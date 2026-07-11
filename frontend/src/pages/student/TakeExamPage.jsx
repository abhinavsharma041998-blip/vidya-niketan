import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Flag, CheckCircle2, Circle, AlertTriangle, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// Answer status per question, drives the palette colors — mirrors the SSC/competitive-exam convention
const STATUS = {
  NOT_VISITED: 'not_visited',
  NOT_ANSWERED: 'not_answered',
  ANSWERED: 'answered',
  MARKED: 'marked',
  ANSWERED_MARKED: 'answered_marked',
};

const paletteStyle = {
  [STATUS.NOT_VISITED]: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  [STATUS.NOT_ANSWERED]: 'bg-red-500 text-white border-red-500',
  [STATUS.ANSWERED]: 'bg-emerald-500 text-white border-emerald-500',
  [STATUS.MARKED]: 'bg-purple-500 text-white border-purple-500',
  [STATUS.ANSWERED_MARKED]: 'bg-purple-500 text-white border-purple-500 ring-2 ring-emerald-400 ring-offset-1',
};

const AUTOSAVE_DEBOUNCE_MS = 1200;
const PERIODIC_SAVE_MS = 20000; // safety-net save even if nothing changed recently

export default function TakeExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [exam, setExam] = useState(null); // { title, marksPerQuestion, questions, totalQuestions }
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption
  const [visited, setVisited] = useState({}); // questionId -> true
  const [flagged, setFlagged] = useState({}); // questionId -> true
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

  const autosaveTimer = useRef(null);
  const pendingAnswersRef = useRef({}); // batches changes between debounced saves
  const answersRef = useRef({});
  const submittedRef = useRef(false);

  // ── Load / resume the exam ────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/exam/student/${examId}/start`)
      .then(r => {
        const data = r.data.data;
        setExam(data);
        setAnswers(data.savedAnswers || {});
        answersRef.current = data.savedAnswers || {};
        if (data.questions[0]) setVisited({ [data.questions[0]._id]: true });
        setSecondsLeft(data.durationMinutes * 60);
        if (data.resumed) toast('Welcome back — your saved answers were restored.', { icon: '🔄' });
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Could not load this exam';
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [examId]);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!exam || submittedRef.current) return;
    if (secondsLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, secondsLeft]);

  // ── Autosave: debounced on change + periodic safety net ──────────────────
  const flushSave = useCallback(async () => {
    const entries = Object.entries(pendingAnswersRef.current);
    if (entries.length === 0 || submittedRef.current) return;
    const batch = entries.map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
    pendingAnswersRef.current = {};
    setSaveState('saving');
    try {
      await api.put(`/exam/student/${examId}/progress`, { answers: batch });
      setSaveState('saved');
    } catch {
      setSaveState('error');
      // put them back so the next flush retries
      batch.forEach(({ questionId, selectedOption }) => { pendingAnswersRef.current[questionId] = selectedOption; });
    }
  }, [examId]);

  const queueAnswerSave = useCallback((questionId, selectedOption) => {
    pendingAnswersRef.current[questionId] = selectedOption;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(flushSave, AUTOSAVE_DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => {
    const interval = setInterval(flushSave, PERIODIC_SAVE_MS);
    return () => clearInterval(interval);
  }, [flushSave]);

  // Save immediately when the student leaves/closes the tab, so nothing typed right before is lost.
  // (sendBeacon can't carry our auth header, so we use fetch with keepalive instead — browsers
  // let a keepalive fetch finish even after the page starts unloading.)
  useEffect(() => {
    const onUnload = () => {
      const entries = Object.entries(pendingAnswersRef.current);
      if (entries.length === 0 || submittedRef.current) return;
      const batch = entries.map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
      const token = localStorage.getItem('vn_token');
      const base = import.meta.env.VITE_API_URL || '/api';
      fetch(`${base}/exam/student/${examId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: batch }),
        keepalive: true,
      }).catch(() => { });
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="card p-8 max-w-md text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
          <p className="text-gray-700 dark:text-gray-300 mb-5">{loadError}</p>
          <button onClick={() => navigate('/student/exams')} className="btn-primary text-sm">Back to Exams</button>
        </div>
      </div>
    );
  }

  const questions = exam.questions;
  const q = questions[current];

  const statusOf = (qid) => {
    const isAnswered = answers[qid] !== undefined && answers[qid] !== null;
    const isFlagged = !!flagged[qid];
    if (isAnswered && isFlagged) return STATUS.ANSWERED_MARKED;
    if (isFlagged) return STATUS.MARKED;
    if (isAnswered) return STATUS.ANSWERED;
    if (visited[qid]) return STATUS.NOT_ANSWERED;
    return STATUS.NOT_VISITED;
  };

  const goTo = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
    const qid = questions[index]._id;
    setVisited(v => (v[qid] ? v : { ...v, [qid]: true }));
  };

  const selectOption = (optionIndex) => {
    setAnswers(a => {
      const next = { ...a, [q._id]: optionIndex };
      answersRef.current = next;
      return next;
    });
    queueAnswerSave(q._id, optionIndex);
  };

  const clearResponse = () => {
    setAnswers(a => {
      const next = { ...a };
      delete next[q._id];
      answersRef.current = next;
      return next;
    });
    queueAnswerSave(q._id, null);
  };

  const toggleFlag = () => setFlagged(f => ({ ...f, [q._id]: !f[q._id] }));

  const saveAndNext = () => { if (current < questions.length - 1) goTo(current + 1); };
  const markAndNext = () => { toggleFlag(); if (current < questions.length - 1) goTo(current + 1); };

  const counts = questions.reduce((acc, qq) => {
    const s = statusOf(qq._id);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const answeredCount = (counts[STATUS.ANSWERED] || 0) + (counts[STATUS.ANSWERED_MARKED] || 0);
  const notAnsweredCount = questions.length - answeredCount;

  async function handleSubmit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const finalBatch = Object.entries(answersRef.current).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
    try {
      const r = await api.post(`/exam/student/${examId}/submit`, { answers: finalBatch });
      toast.success(auto ? "Time's up — your exam was auto-submitted" : 'Exam submitted successfully');
      navigate('/student/exams', { state: { justSubmittedResultId: r.data.data._id } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed — please try again');
      submittedRef.current = false;
      setSubmitting(false);
    }
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeCritical = secondsLeft <= 300; // last 5 minutes

  const subjectGroups = questions.reduce((acc, qq, idx) => {
    const key = qq.subjectName || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(idx);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="min-w-0">
          <h1 className="font-montserrat font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">{exam.title}</h1>
          <p className="text-xs text-gray-400">
            {answeredCount}/{questions.length} answered
            <span className={`ml-2 ${saveState === 'saving' ? 'text-amber-500' : saveState === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
              {saveState === 'saving' && '● saving…'}
              {saveState === 'saved' && '● saved'}
              {saveState === 'error' && '● save failed, retrying'}
              {saveState === 'idle' && ''}
            </span>
          </p>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-3 py-1.5 rounded-lg ${timeCritical ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>
          <Clock size={18} />
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-4 max-w-7xl mx-auto w-full">
        {/* Question panel */}
        <div className="flex-1 card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="badge badge-blue">{q.subjectName}</span>
            <span className="text-sm text-gray-400">Question {current + 1} of {questions.length} · {exam.marksPerQuestion} mark{exam.marksPerQuestion > 1 ? 's' : ''}</span>
          </div>

          <p className="text-gray-900 dark:text-white text-base sm:text-lg font-medium mb-6 leading-relaxed">{q.questionText}</p>

          <div className="space-y-3 flex-1">
            {q.options.map((opt, i) => (
              <label key={i}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors
                  ${answers[q._id] === i
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800'}`}>
                <input type="radio" name={`q-${q._id}`} className="sr-only" checked={answers[q._id] === i} onChange={() => selectOption(i)} />
                {answers[q._id] === i
                  ? <CheckCircle2 className="text-blue-600 shrink-0" size={20} />
                  : <Circle className="text-gray-300 dark:text-gray-600 shrink-0" size={20} />}
                <span className="text-gray-800 dark:text-gray-200 text-sm sm:text-base">{opt}</span>
              </label>
            ))}
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t dark:border-gray-800">
            <button onClick={toggleFlag}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border-2 transition-colors
                ${flagged[q._id] ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              <Flag size={15} /> {flagged[q._id] ? 'Unmark Review' : 'Mark for Review'}
            </button>
            <button onClick={clearResponse} disabled={answers[q._id] === undefined} className="text-sm px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40">
              Clear Response
            </button>
            <div className="flex-1" />
            <button onClick={() => goTo(current - 1)} disabled={current === 0} className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-40">
              <ChevronLeft size={16} /> Previous
            </button>
            <button onClick={markAndNext} className="text-sm px-3 py-2 rounded-lg border-2 border-purple-300 text-purple-700 dark:text-purple-400 dark:border-purple-800">
              Mark & Next
            </button>
            {current < questions.length - 1 ? (
              <button onClick={saveAndNext} className="btn-primary text-sm flex items-center gap-1">
                Save & Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => setConfirmSubmit(true)} className="btn-primary text-sm !bg-gradient-to-r !from-emerald-500 !to-teal-600">
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Question palette */}
        <aside className="w-full lg:w-72 shrink-0 card p-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Not Answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Marked</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800 border inline-block" /> Not Visited</span>
          </div>

          {Object.entries(subjectGroups).map(([subject, indices]) => (
            <div key={subject} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{subject}</p>
              <div className="grid grid-cols-6 gap-1.5">
                {indices.map(idx => (
                  <button key={idx} onClick={() => goTo(idx)}
                    className={`w-8 h-8 rounded-md border text-xs font-semibold flex items-center justify-center transition-transform hover:scale-105
                      ${paletteStyle[statusOf(questions[idx]._id)]}
                      ${idx === current ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={() => setConfirmSubmit(true)} className="btn-primary w-full text-sm mt-2 !bg-gradient-to-r !from-emerald-500 !to-teal-600">
            Submit Exam
          </button>
        </aside>
      </div>

      {/* Submit confirmation modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-montserrat font-bold text-gray-900 dark:text-white">Submit Exam?</h2>
              <button onClick={() => setConfirmSubmit(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-5">
              <p className="flex justify-between"><span>Answered</span><span className="font-semibold text-emerald-600">{answeredCount}</span></p>
              <p className="flex justify-between"><span>Not Answered</span><span className="font-semibold text-red-500">{notAnsweredCount}</span></p>
              <p className="flex justify-between"><span>Marked for Review</span><span className="font-semibold text-purple-600">{(counts[STATUS.MARKED] || 0) + (counts[STATUS.ANSWERED_MARKED] || 0)}</span></p>
            </div>
            <p className="text-xs text-gray-400 mb-5">Once submitted, you cannot change your answers. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSubmit(false)} className="btn-secondary flex-1 text-sm">Cancel, review again</button>
              <button onClick={() => handleSubmit(false)} disabled={submitting} className="btn-primary flex-1 text-sm !bg-gradient-to-r !from-emerald-500 !to-teal-600">
                {submitting ? 'Submitting…' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
