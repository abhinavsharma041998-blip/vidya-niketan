// StudentResultsPage.jsx — a dedicated, clear view of every published result a student has:
// both auto-graded online exam results and admin-entered manual (offline/paper) results.
import { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, MinusCircle, TrendingUp, FileDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const gradeColor = (pct) => {
  if (pct >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 40) return 'text-blue-600 dark:text-blue-400';
  return 'text-red-500';
};

export default function StudentResultsPage() {
  const [online, setOnline] = useState([]);
  const [manual, setManual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/exam/student/my-results'),
      api.get('/student/manual-results'),
    ]).then(([r, m]) => {
      setOnline(r.data.data || []);
      setManual(m.data.data || []);
      setDebugInfo(`OK — online: ${r.data.data?.length ?? 0}, manual: ${m.data.data?.length ?? 0}`);
    }).catch((err) => {
      setDebugInfo(`ERROR — ${err.response?.status || 'network'}: ${err.response?.data?.message || err.message}`);
      toast.error('Failed to load results — please refresh and try again');
    }).finally(() => setLoading(false));
  }, []);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/results/my-report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'result-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not generate the report — please try again');
    } finally {
      setDownloading(false);
    }
  };

  // One unified, newest-first list — each item keeps enough of its original shape to render its own detail card
  const allResults = [
    ...online.map(r => ({ ...r, _kind: 'online', _date: r.submittedAt })),
    ...manual.map(r => ({ ...r, _kind: 'manual', _date: r.publishedAt || r.createdAt })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date));

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400">Loading results...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award size={24} className="text-blue-600" /> My Results</h1>
          <p className="text-gray-500 text-sm mt-1">Every result your school has published for you — online exams and offline/paper exams.</p>
          {debugInfo && <p className="text-xs font-mono mt-2 px-2 py-1 rounded bg-yellow-50 text-yellow-800 border border-yellow-200 inline-block">DEBUG: {debugInfo}</p>}
        </div>
        {allResults.length > 0 && (
          <button onClick={downloadReport} disabled={downloading} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {downloading ? 'Generating…' : 'Download Result Report (PDF)'}
          </button>
        )}
      </div>

      {allResults.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Award size={36} className="mx-auto mb-3 opacity-30" />
          No results have been published yet. Check back after your exams are graded.
        </div>
      ) : (
        <div className="space-y-4">
          {allResults.map(r => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{r._kind === 'manual' ? r.title : r.exam?.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r._kind === 'manual' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {r._kind === 'manual' ? 'Offline / Paper Exam' : 'Online Exam'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(r._date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {r._kind === 'manual' ? r.totalObtained : r.score}
                    <span className="text-sm font-normal text-gray-400">/{r._kind === 'manual' ? r.totalMax : r.totalMarks}</span>
                  </p>
                  <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${gradeColor(r.percentage)}`}>
                    <TrendingUp size={14} /> {r.percentage}%
                  </p>
                </div>
              </div>

              {r._kind === 'manual' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b dark:border-gray-800">
                        <th className="py-1.5 pr-4 font-medium">Subject</th>
                        <th className="py-1.5 pr-4 font-medium">Marks Obtained</th>
                        <th className="py-1.5 font-medium">Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.subjects.map((s, i) => (
                        <tr key={i} className="border-b last:border-0 dark:border-gray-800/50">
                          <td className="py-1.5 pr-4 text-gray-700 dark:text-gray-300">{s.subjectName}</td>
                          <td className="py-1.5 pr-4 font-medium text-gray-900 dark:text-white">{s.marksObtained}</td>
                          <td className="py-1.5 text-gray-500">{s.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {r.remarks && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">"{r.remarks}"</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-5 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={15} /> {r.correctCount} Correct</span>
                  <span className="flex items-center gap-1.5 text-red-500"><XCircle size={15} /> {r.wrongCount} Wrong</span>
                  <span className="flex items-center gap-1.5 text-gray-400"><MinusCircle size={15} /> {r.unattempted} Skipped</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
