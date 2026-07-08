import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, ListChecks, Award, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function StudentExamsPage() {
  const [available, setAvailable] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/exam/student/available'),
      api.get('/exam/student/my-results'),
    ]).then(([a, r]) => {
      setAvailable(a.data.data || []);
      setResults(r.data.data || []);
    }).catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const startExam = (examId) => navigate(`/student/exams/${examId}`);

  if (loading) return <p className="text-center text-gray-400 py-12">Loading...</p>;

  const active = available.filter(e => e.windowStatus === 'active');
  const upcoming = available.filter(e => e.windowStatus === 'upcoming');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Exams</h1>
        <p className="text-gray-500 text-sm">Attempt available exams and review your results</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Available Now</h2>
        {active.length === 0 ? (
          <p className="text-gray-400 text-sm card p-6 text-center">No exams open right now. Check back later.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map(exam => (
              <div key={exam._id} className="card p-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <ClipboardList size={18} />
                </div>
                <h3 className="font-montserrat font-bold text-gray-900 dark:text-white mb-1">{exam.title}</h3>
                {exam.description && <p className="text-sm text-gray-500 mb-3">{exam.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {exam.subjects.map(s => <span key={s.subject._id} className="badge badge-blue text-xs">{s.subject.name}: {s.numberOfQuestions}</span>)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1"><Clock size={13} /> {exam.durationMinutes} min</span>
                  <span className="flex items-center gap-1"><ListChecks size={13} /> {exam.totalQuestions} questions</span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">Closes {fmt(exam.scheduledEnd)}</p>
                <button onClick={() => startExam(exam._id)} className="btn-primary w-full text-sm !bg-gradient-to-r !from-emerald-500 !to-teal-600">Start Exam</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Upcoming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(exam => (
              <div key={exam._id} className="card p-5 opacity-80">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                  <CalendarClock size={18} />
                </div>
                <h3 className="font-montserrat font-bold text-gray-900 dark:text-white mb-1">{exam.title}</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {exam.subjects.map(s => <span key={s.subject._id} className="badge badge-blue text-xs">{s.subject.name}: {s.numberOfQuestions}</span>)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1"><Clock size={13} /> {exam.durationMinutes} min</span>
                  <span className="flex items-center gap-1"><ListChecks size={13} /> {exam.totalQuestions} questions</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Opens {fmt(exam.scheduledStart)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">My Results</h2>
        {results.length === 0 ? (
          <p className="text-gray-400 text-sm card p-6 text-center">No exams attempted yet.</p>
        ) : (
          <div className="card divide-y dark:divide-gray-800">
            {results.map(r => (
              <div key={r._id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Award size={16} /></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{r.exam?.title}</p>
                    <p className="text-xs text-gray-400">{r.correctCount} correct · {r.wrongCount} wrong · {r.unattempted} skipped</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{r.score}/{r.totalMarks}</p>
                  <p className={`text-xs font-semibold ${r.percentage >= 40 ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentExamsPage;
