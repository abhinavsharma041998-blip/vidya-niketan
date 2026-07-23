const Subject = require('../models/Subject');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const ExamAttempt = require('../models/ExamAttempt');

// Anti-cheating: after this many tab-switch/fullscreen-exit violations, the exam is
// auto-submitted with whatever the student had answered so far.
const MAX_VIOLATIONS = 2;

// ══════════════════════════════════════════════════════════════════
// SUBJECTS
// ══════════════════════════════════════════════════════════════════

// @desc  Get all subjects (with question count in bank)
// @route GET /api/exam/subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    const withCounts = await Promise.all(
      subjects.map(async (s) => {
        const questionCount = await Question.countDocuments({ subject: s._id });
        return { ...s.toObject(), questionCount };
      })
    );
    res.json({ success: true, count: withCounts.length, data: withCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Add a subject
// @route POST /api/exam/subjects
const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const exists = await Subject.findOne({ name: name?.trim() });
    if (exists) return res.status(400).json({ success: false, message: 'Subject already exists' });

    const subject = await Subject.create({ name, code, description });
    res.status(201).json({ success: true, data: subject, message: 'Subject added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a subject
// @route PUT /api/exam/subjects/:id
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject, message: 'Subject updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Remove a subject (blocked if used in any exam, or deletes its question bank)
// @route DELETE /api/exam/subjects/:id
const deleteSubject = async (req, res) => {
  try {
    const usedInExam = await Exam.findOne({ 'subjects.subject': req.params.id });
    if (usedInExam) {
      return res.status(400).json({ success: false, message: `Cannot delete — used in exam "${usedInExam.title}". Remove it from the exam first.` });
    }
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await Question.deleteMany({ subject: req.params.id });
    res.json({ success: true, message: 'Subject and its questions removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// QUESTION BANK
// ══════════════════════════════════════════════════════════════════

// @desc  Get questions (optionally filtered by subject)
// @route GET /api/exam/questions?subject=<id>
const getQuestions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    const questions = await Question.find(filter).populate('subject', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Add a question to a subject's bank
// @route POST /api/exam/questions
const createQuestion = async (req, res) => {
  try {
    const { subject, questionText, options, correctOption, marks } = req.body;
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ success: false, message: 'Exactly 4 options required' });
    }
    if (correctOption === undefined || correctOption < 0 || correctOption > 3) {
      return res.status(400).json({ success: false, message: 'correctOption must be 0-3' });
    }
    const question = await Question.create({ subject, questionText, options, correctOption, marks });
    res.status(201).json({ success: true, data: question, message: 'Question added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Bulk add questions to a subject by pasting plain text, one question per line.
//        Line format: Question | Option A | Option B | Option C | Option D | CorrectLetter | Marks(optional)
// @route POST /api/exam/questions/bulk
const bulkCreateQuestions = async (req, res) => {
  try {
    const { subject, text } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'Subject is required' });
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) return res.status(404).json({ success: false, message: 'Subject not found' });

    const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return res.status(400).json({ success: false, message: 'No lines to import' });

    const toInsert = [];
    const errors = [];

    lines.forEach((line, i) => {
      const lineNo = i + 1;
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 6) {
        errors.push(`Line ${lineNo}: expected at least 6 parts separated by "|" (question, 4 options, correct letter) — got ${parts.length}`);
        return;
      }
      const [questionText, optA, optB, optC, optD, correctRaw, marksRaw] = parts;
      if (!questionText || !optA || !optB || !optC || !optD) {
        errors.push(`Line ${lineNo}: question text and all 4 options are required`);
        return;
      }
      const letter = correctRaw.trim().toUpperCase();
      const letterMap = { A: 0, B: 1, C: 2, D: 3 };
      if (!(letter in letterMap)) {
        errors.push(`Line ${lineNo}: correct answer must be A, B, C or D — got "${correctRaw}"`);
        return;
      }
      const marks = marksRaw && !isNaN(Number(marksRaw)) ? Number(marksRaw) : 1;
      toInsert.push({
        subject,
        questionText,
        options: [optA, optB, optC, optD],
        correctOption: letterMap[letter],
        marks,
      });
    });

    let inserted = [];
    if (toInsert.length > 0) {
      inserted = await Question.insertMany(toInsert);
    }

    res.status(201).json({
      success: true,
      data: { insertedCount: inserted.length, errorCount: errors.length, errors },
      message: `${inserted.length} question(s) added${errors.length ? `, ${errors.length} line(s) skipped` : ''}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a question
// @route PUT /api/exam/questions/:id
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: question, message: 'Question updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Remove a question from the bank
// @route DELETE /api/exam/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// EXAMS (Admin) — add/remove subjects, auto total questions
// ══════════════════════════════════════════════════════════════════

// @desc  Get all exams (admin)
// @route GET /api/exam/exams
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate('subjects.subject', 'name code').populate('course', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single exam (admin)
// @route GET /api/exam/exams/:id
const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('subjects.subject', 'name code').populate('course', 'name');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create exam — subjects array: [{ subject, numberOfQuestions }]
// @route POST /api/exam/exams
const createExam = async (req, res) => {
  try {
    const { title, description, course, subjects, durationMinutes, marksPerQuestion, scheduledStart, scheduledEnd } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one subject' });
    }
    if (!scheduledStart || !scheduledEnd) {
      return res.status(400).json({ success: false, message: 'Set the exam start and end date/time' });
    }
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      return res.status(400).json({ success: false, message: 'End date/time must be after start date/time' });
    }

    // Validate each subject has enough questions available in the bank
    for (const s of subjects) {
      const available = await Question.countDocuments({ subject: s.subject });
      if (available < s.numberOfQuestions) {
        const subj = await Subject.findById(s.subject);
        return res.status(400).json({
          success: false,
          message: `"${subj?.name || 'Subject'}" only has ${available} question(s) in the bank, but ${s.numberOfQuestions} were requested. Add more questions first.`,
        });
      }
    }

    const exam = await Exam.create({ title, description, course, subjects, durationMinutes, marksPerQuestion, scheduledStart, scheduledEnd });
    const populated = await Exam.findById(exam._id).populate('subjects.subject', 'name code').populate('course', 'name');
    res.status(201).json({ success: true, data: populated, message: 'Exam created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update exam (title/description/duration/subjects — add/remove/change counts)
// @route PUT /api/exam/exams/:id
const updateExam = async (req, res) => {
  try {
    const { subjects, scheduledStart, scheduledEnd } = req.body;

    if (scheduledStart && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart)) {
      return res.status(400).json({ success: false, message: 'End date/time must be after start date/time' });
    }

    if (subjects) {
      for (const s of subjects) {
        const available = await Question.countDocuments({ subject: s.subject });
        if (available < s.numberOfQuestions) {
          const subj = await Subject.findById(s.subject);
          return res.status(400).json({
            success: false,
            message: `"${subj?.name || 'Subject'}" only has ${available} question(s) available, but ${s.numberOfQuestions} were requested.`,
          });
        }
      }
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('subjects.subject', 'name code').populate('course', 'name');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam, message: 'Exam updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete exam
// @route DELETE /api/exam/exams/:id
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    await ExamResult.deleteMany({ exam: req.params.id });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Toggle publish status so students can see/take it
// @route PUT /api/exam/exams/:id/status
const setExamStatus = async (req, res) => {
  try {
    const { status } = req.body; // Draft | Published | Closed
    if (!['Draft', 'Published', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const exam = await Exam.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam, message: `Exam ${status.toLowerCase()}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all results for a specific exam (admin — for scoreboard)
// @route GET /api/exam/exams/:id/results
const getExamResults = async (req, res) => {
  try {
    const results = await ExamResult.find({ exam: req.params.id })
      .populate('student', 'name studentId username')
      .sort({ score: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// EXAMS (Student) — take real exam with own assigned login
// ══════════════════════════════════════════════════════════════════

// @desc  List exams available to the logged-in student (published, not yet attempted)
// @route GET /api/exam/student/available
const getAvailableExams = async (req, res) => {
  try {
    const attempted = await ExamResult.find({ student: req.student._id }).distinct('exam');
    // Show Published exams not yet attempted, whose end window hasn't passed —
    // includes upcoming (not yet open) and currently active ones, so students can see what's scheduled.
    const filter = { status: 'Published', _id: { $nin: attempted }, scheduledEnd: { $gte: new Date() } };
    const exams = await Exam.find(filter).populate('subjects.subject', 'name').populate('course', 'name').sort({ scheduledStart: 1 });
    const visible = exams.filter(e => !e.course || String(e.course._id || e.course) === String(req.student.course?._id || req.student.course));
    res.json({ success: true, count: visible.length, data: visible });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Build the correct-answer-stripped question list, in a fixed order, for a given set of question IDs
const buildSafeQuestions = async (questionIds) => {
  const questions = await Question.find({ _id: { $in: questionIds } }).populate('subject', 'name');
  const qMap = new Map(questions.map(q => [String(q._id), q]));
  return questionIds.map(id => {
    const q = qMap.get(String(id));
    if (!q) return null;
    return { _id: q._id, subjectName: q.subject?.name, questionText: q.questionText, options: q.options };
  }).filter(Boolean);
};

// Score a finished/expired attempt against the real answer key and store it as a permanent ExamResult.
// Used both by an explicit Submit click and by auto-finalizing an attempt whose time ran out.
const finalizeAttempt = async (attempt, exam, autoSubmittedForViolations = false) => {
  const questions = await Question.find({ _id: { $in: attempt.questions } });
  const qMap = new Map(questions.map(q => [String(q._id), q]));

  let correctCount = 0, wrongCount = 0, unattempted = 0, score = 0;
  const answerDocs = attempt.questions.map(qId => {
    const q = qMap.get(String(qId));
    const selectedOption = attempt.answers.get(String(qId));
    const hasAnswer = selectedOption !== undefined && selectedOption !== null;
    const isCorrect = hasAnswer && q && selectedOption === q.correctOption;
    if (!hasAnswer) unattempted++;
    else if (isCorrect) { correctCount++; score += exam.marksPerQuestion; }
    else wrongCount++;
    return {
      question: qId,
      selectedOption: hasAnswer ? selectedOption : null,
      correctOption: q ? q.correctOption : null,
      isCorrect: !!isCorrect,
    };
  });

  const totalQuestions = attempt.questions.length;
  const totalMarks = totalQuestions * exam.marksPerQuestion;

  const result = await ExamResult.create({
    exam: exam._id,
    student: attempt.student,
    answers: answerDocs,
    correctCount, wrongCount, unattempted, totalQuestions,
    score, totalMarks,
    percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0,
    startedAt: attempt.startedAt,
    violationCount: attempt.violations?.length || 0,
    violations: attempt.violations || [],
    autoSubmittedForViolations,
  });

  await ExamAttempt.deleteOne({ _id: attempt._id });
  return result;
};

// @desc  Start (or resume) an exam — returns randomized questions (no correct answers exposed).
//        If the student already has an in-progress attempt (e.g. they refreshed after a power cut),
//        the SAME question set and their saved answers-so-far are returned instead of a fresh one.
// @route GET /api/exam/student/:examId/start
const startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('subjects.subject', 'name');
    if (!exam || exam.status !== 'Published') {
      return res.status(404).json({ success: false, message: 'Exam not available' });
    }

    const now = new Date();
    if (now < exam.scheduledStart) {
      return res.status(403).json({
        success: false,
        message: `This exam opens on ${exam.scheduledStart.toLocaleString('en-IN')}. Please come back then.`,
      });
    }

    const already = await ExamResult.findOne({ exam: exam._id, student: req.student._id });
    if (already) return res.status(400).json({ success: false, message: 'You have already attempted this exam' });

    // Resume an existing in-progress attempt, if any
    let attempt = await ExamAttempt.findOne({ exam: exam._id, student: req.student._id });

    if (attempt) {
      if (now > attempt.expiresAt) {
        // Time ran out while they were away (power cut, tab closed, etc.) — auto-submit whatever was saved
        await finalizeAttempt(attempt, exam);
        return res.status(403).json({
          success: false,
          message: 'Your time ran out while you were away. Your saved answers were auto-submitted — check your results.',
        });
      }
      const safeQuestions = await buildSafeQuestions(attempt.questions);
      return res.json({
        success: true,
        data: {
          examId: exam._id,
          title: exam.title,
          durationMinutes: Math.max(1, Math.ceil((attempt.expiresAt - now) / 60000)),
          marksPerQuestion: exam.marksPerQuestion,
          totalQuestions: safeQuestions.length,
          questions: safeQuestions,
          startedAt: attempt.startedAt,
          savedAnswers: Object.fromEntries(attempt.answers), // resume with what was already saved
          resumed: true,
          violationCount: attempt.violations?.length || 0,
          maxViolations: MAX_VIOLATIONS,
        },
      });
    }

    if (now > exam.scheduledEnd) {
      return res.status(403).json({
        success: false,
        message: `This exam's window closed on ${exam.scheduledEnd.toLocaleString('en-IN')}. You can no longer attempt it.`,
      });
    }

    // Fresh attempt: pick random questions per subject and lock them in for this student
    let questionIds = [];
    for (const s of exam.subjects) {
      const pool = await Question.aggregate([
        { $match: { subject: s.subject._id } },
        { $sample: { size: s.numberOfQuestions } },
      ]);
      questionIds = questionIds.concat(pool.map(q => q._id));
    }

    // Cap the effective time given to the student by whatever's left in the admin's window,
    // so a tight scheduledEnd can't be overrun by the exam's normal duration.
    const minutesLeftInWindow = Math.floor((exam.scheduledEnd - now) / 60000);
    const effectiveDurationMinutes = Math.max(1, Math.min(exam.durationMinutes, minutesLeftInWindow));
    const expiresAt = new Date(now.getTime() + effectiveDurationMinutes * 60000);

    attempt = await ExamAttempt.create({
      exam: exam._id, student: req.student._id, questions: questionIds,
      answers: {}, startedAt: now, expiresAt,
    });

    const safeQuestions = await buildSafeQuestions(questionIds);
    res.json({
      success: true,
      data: {
        examId: exam._id,
        title: exam.title,
        durationMinutes: effectiveDurationMinutes,
        marksPerQuestion: exam.marksPerQuestion,
        totalQuestions: safeQuestions.length,
        questions: safeQuestions,
        startedAt: now,
        savedAnswers: {},
        resumed: false,
        violationCount: 0,
        maxViolations: MAX_VIOLATIONS,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Autosave a single answer (or a batch) as the student works through the exam,
//        so a power cut / crash / accidental tab close never loses progress.
// @route PUT /api/exam/student/:examId/progress
const saveProgress = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedOption }]
    if (!Array.isArray(answers)) return res.status(400).json({ success: false, message: 'answers array required' });

    const attempt = await ExamAttempt.findOne({ exam: req.params.examId, student: req.student._id });
    if (!attempt) return res.status(404).json({ success: false, message: 'No active attempt found for this exam' });

    if (new Date() > attempt.expiresAt) {
      return res.status(403).json({ success: false, message: 'Time is up for this exam' });
    }

    for (const a of answers) {
      if (a.selectedOption === null || a.selectedOption === undefined) {
        attempt.answers.delete(String(a.questionId));
      } else {
        attempt.answers.set(String(a.questionId), a.selectedOption);
      }
    }
    attempt.markModified('answers');
    await attempt.save();

    res.json({ success: true, message: 'Progress saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Log an anti-cheating violation (tab switch, window blur, fullscreen exit, copy/paste).
//        Once the student crosses MAX_VIOLATIONS, their exam is auto-submitted server-side
//        with whatever was saved so far, and the frontend is told to lock them out.
// @route POST /api/exam/student/:examId/violation
const logViolation = async (req, res) => {
  try {
    const { type } = req.body; // 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'copy_paste'
    const validTypes = ['tab_switch', 'window_blur', 'fullscreen_exit', 'copy_paste'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid violation type' });
    }

    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const attempt = await ExamAttempt.findOne({ exam: exam._id, student: req.student._id });
    if (!attempt) {
      // Attempt already finalized/expired — nothing to log against, just acknowledge.
      return res.json({ success: true, violationCount: 0, autoSubmitted: false });
    }

    attempt.violations.push({ type, at: new Date() });
    await attempt.save();

    const violationCount = attempt.violations.length;

    if (violationCount >= MAX_VIOLATIONS) {
      const result = await finalizeAttempt(attempt, exam, true);
      return res.json({
        success: true,
        violationCount,
        autoSubmitted: true,
        message: `You exceeded the maximum of ${MAX_VIOLATIONS} warnings. Your exam has been auto-submitted.`,
        data: result,
      });
    }

    res.json({
      success: true,
      violationCount,
      autoSubmitted: false,
      message: `Warning ${violationCount}/${MAX_VIOLATIONS}: leaving the exam window is being recorded. Your exam will be auto-submitted if you exceed the limit.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Submit exam answers — scored server-side against the real answer key,
//        using the saved attempt as the source of truth (any last-second answers in the
//        request body are merged in first, so nothing typed right before Submit is lost).
// @route POST /api/exam/student/:examId/submit
const submitExam = async (req, res) => {
  try {
    const { answers } = req.body; // answers: [{ questionId, selectedOption }] — optional final batch
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const already = await ExamResult.findOne({ exam: exam._id, student: req.student._id });
    if (already) return res.status(400).json({ success: false, message: 'You have already submitted this exam' });

    const attempt = await ExamAttempt.findOne({ exam: exam._id, student: req.student._id });
    if (!attempt) {
      return res.status(400).json({ success: false, message: 'No active attempt found — it may have already expired or been submitted' });
    }

    if (Array.isArray(answers)) {
      for (const a of answers) {
        if (a.selectedOption === null || a.selectedOption === undefined) attempt.answers.delete(String(a.questionId));
        else attempt.answers.set(String(a.questionId), a.selectedOption);
      }
    }

    const result = await finalizeAttempt(attempt, exam);
    res.status(201).json({ success: true, data: result, message: 'Exam submitted' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Student's own exam results (list)
// @route GET /api/exam/student/my-results
const getMyResults = async (req, res) => {
  try {
    const results = await ExamResult.find({ student: req.student._id })
      .populate('exam', 'title durationMinutes')
      .sort({ submittedAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Student's single result detail (with correct answers, for review)
// @route GET /api/exam/student/my-results/:id
const getMyResultDetail = async (req, res) => {
  try {
    const result = await ExamResult.findOne({ _id: req.params.id, student: req.student._id })
      .populate('exam', 'title')
      .populate('answers.question', 'questionText options');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkCreateQuestions,
  getExams, getExam, createExam, updateExam, deleteExam, setExamStatus, getExamResults,
  getAvailableExams, startExam, submitExam, saveProgress, getMyResults, getMyResultDetail,
  logViolation,
};
