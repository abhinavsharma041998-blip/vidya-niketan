import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function TakeExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null); // { title, durationMinutes, questions, startedAt }
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    api.get(`/exam/student/${examId}/start`).then(r => {
      const data = r.data.data;
      setSession(data);
      setSecondsLeft(data.durationMinutes * 60);
    }).catch(err => {
      toast.error(err.response?.data?.message || 'Could not start exam');
      navigate('/student/exams');
    }).finally(() => setLoading(false));
  }, [examId]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || !session) return;
    submittedRef.current = true;
    setSubmitting(true);
    const answerPayload = session.questions.map(q => ({
      questionId: q._id,
      selectedOption: answers[q._id] ?? null,
    }));
    try {
      const r = await api.post(`/exam/student/${examId}/submit`, { answers: answerPayload, startedAt: session.startedAt });
      toast.success('Exam submitted!');
      navigate('/student/exams', { state: { justSubmitted: r.data.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
      submittedRef.current = false;
    } finally { setSubmitting(false); }
  }, [answers, session, examId, navigate]);

  // Timer
  useEffect(() => {
    if (!session) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, session, handleSubmit]);

  if (loading) return <p className="text-center text-gray-400 py-16">Loading exam...</p>;
  if (!session) return null;

  const q = session.questions[current];
  const answeredCount = Object.keys(answers).length;
  const mins = Math.floor(secondsLeft / 60), secs = secondsLeft % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header / timer */}
      <div className="card p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-montserrat font-bold text-gray-900 dark:text-white">{session.title}</h1>
          <p className="text-xs text-gray-400">{answeredCount}/{session.questions.length} answered</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${secondsLeft < 60 ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
          <Clock size={16} /> {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Question */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="badge badge-blue text-xs">{q.subjectName}</span>
            <span className="text-xs text-gray-400">Question {current + 1} of {session.questions.length}</span>
          </div>
          <p className="font-medium text-gray-900 dark:text-white mb-5">{q.questionText}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => (
              <button key={idx} onClick={() => setAnswers({ ...answers, [q._id]: idx })}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all ${answers[q._id] === idx ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'}`}>
                {answers[q._id] === idx ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" /> : <Circle size={18} className="text-gray-300 flex-shrink-0" />}
                <span className="text-sm text-gray-700 dark:text-gray-200">{String.fromCharCode(65 + idx)}. {opt}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="btn-secondary text-sm disabled:opacity-40">Previous</button>
            {current < session.questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)} className="btn-primary text-sm !bg-gradient-to-r !from-emerald-500 !to-teal-600">Next</button>
            ) : (
              <button disabled={submitting} onClick={handleSubmit} className="btn-primary text-sm !bg-gradient-to-r !from-emerald-500 !to-teal-600">{submitting ? 'Submitting...' : 'Submit Exam'}</button>
            )}
          </div>
        </div>

        {/* Question palette */}
        <div className="card p-4 h-fit">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Questions</p>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
            {session.questions.map((qq, idx) => (
              <button key={qq._id} onClick={() => setCurrent(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all
                  ${idx === current ? 'ring-2 ring-emerald-500' : ''}
                  ${answers[qq._id] !== undefined ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {idx + 1}
              </button>
            ))}
          </div>
          <button disabled={submitting} onClick={handleSubmit} className="btn-primary w-full text-sm mt-4 !bg-gradient-to-r !from-emerald-500 !to-teal-600">
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TakeExamPage;
