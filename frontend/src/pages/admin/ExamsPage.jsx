// ExamsPage.jsx — create/manage exams: add or remove subjects, set question count per subject, live total
import { useState, useEffect } from 'react';
import { Plus, Trash2, X, FileCheck2, Users, PlayCircle, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY_EXAM = { title: '', description: '', course: '', durationMinutes: 60, marksPerQuestion: 1, subjects: [], scheduledStart: '', scheduledEnd: '' };

// Convert a stored ISO date to the value <input type="datetime-local"> needs (local time, no seconds/Z)
const toLocalInputValue = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_EXAM);
  const [saving, setSaving] = useState(false);

  const [resultsModal, setResultsModal] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsExamTitle, setResultsExamTitle] = useState('');

  const fetchExams = () => api.get('/exam/exams').then(r => setExams(r.data.data || []));
  const fetchSubjects = () => api.get('/exam/subjects').then(r => setSubjects(r.data.data || []));
  const fetchCourses = () => api.get('/courses').then(r => setCourses(r.data.data || []));
  useEffect(() => { fetchExams(); fetchSubjects(); fetchCourses(); }, []);

  const examTiming = (exam) => {
    const start = new Date(exam.scheduledStart), end = new Date(exam.scheduledEnd);
    const fmt = (d) => d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  const availableCount = (subjectId) => subjects.find(s => s._id === subjectId)?.questionCount || 0;

  const totalQuestions = form.subjects.reduce((sum, s) => sum + (Number(s.numberOfQuestions) || 0), 0);
  const totalMarks = totalQuestions * Number(form.marksPerQuestion || 0);

  const openAdd = () => { setEditing(null); setForm(EMPTY_EXAM); setModal(true); };
  const openEdit = (exam) => {
    setEditing(exam._id);
    setForm({
      title: exam.title, description: exam.description || '',
      course: exam.course?._id || '',
      durationMinutes: exam.durationMinutes, marksPerQuestion: exam.marksPerQuestion,
      subjects: exam.subjects.map(s => ({ subject: s.subject._id, numberOfQuestions: s.numberOfQuestions })),
      scheduledStart: toLocalInputValue(exam.scheduledStart),
      scheduledEnd: toLocalInputValue(exam.scheduledEnd),
    });
    setModal(true);
  };

  // ── add / remove subject rows within the exam builder ──
  const addSubjectRow = () => {
    const unused = subjects.find(s => !form.subjects.some(fs => fs.subject === s._id));
    if (!unused) { toast.error('All subjects already added, or add more subjects first'); return; }
    setForm({ ...form, subjects: [...form.subjects, { subject: unused._id, numberOfQuestions: 10 }] });
  };
  const removeSubjectRow = (idx) => {
    setForm({ ...form, subjects: form.subjects.filter((_, i) => i !== idx) });
  };
  const updateSubjectRow = (idx, field, value) => {
    const rows = [...form.subjects];
    rows[idx] = { ...rows[idx], [field]: value };
    setForm({ ...form, subjects: rows });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.subjects.length === 0) { toast.error('Add at least one subject'); return; }
    if (!form.scheduledStart || !form.scheduledEnd) { toast.error('Set exam start and end date/time'); return; }
    if (new Date(form.scheduledEnd) <= new Date(form.scheduledStart)) { toast.error('End date/time must be after start'); return; }
    setSaving(true);
    const payload = {
      ...form, durationMinutes: Number(form.durationMinutes), marksPerQuestion: Number(form.marksPerQuestion),
      course: form.course || undefined,
      subjects: form.subjects.map(s => ({ subject: s.subject, numberOfQuestions: Number(s.numberOfQuestions) })),
      // Convert the datetime-local value (browser's local time) into an unambiguous ISO instant
      scheduledStart: new Date(form.scheduledStart).toISOString(),
      scheduledEnd: new Date(form.scheduledEnd).toISOString(),
    };
    try {
      if (editing) { await api.put(`/exam/exams/${editing}`, payload); toast.success('Exam updated'); }
      else { await api.post('/exam/exams', payload); toast.success('Exam created'); }
      setModal(false); fetchExams();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete exam "${title}"? This also deletes all student results for it.`)) return;
    try { await api.delete(`/exam/exams/${id}`); toast.success('Deleted'); fetchExams(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleStatus = async (exam) => {
    const next = exam.status === 'Published' ? 'Closed' : 'Published';
    try { await api.put(`/exam/exams/${exam._id}/status`, { status: next }); toast.success(`Exam ${next.toLowerCase()}`); fetchExams(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const viewResults = async (exam) => {
    try {
      const r = await api.get(`/exam/exams/${exam._id}/results`);
      setResults(r.data.data || []);
      setResultsExamTitle(exam.title);
      setResultsModal(true);
    } catch { toast.error('Failed to load results'); }
  };

  const statusBadge = { Draft: 'badge-yellow', Published: 'badge-green', Closed: 'badge-red' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Exams</h1>
          <p className="text-gray-500 text-sm">{exams.length} exam{exams.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Create Exam</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map(exam => (
          <div key={exam._id} className="card p-5">
            <div className="flex justify-between items-start mb-2">
              <span className={`badge text-xs ${statusBadge[exam.status]}`}>{exam.status}</span>
              <div className="flex gap-1.5">
                <button onClick={() => viewResults(exam)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="View results"><Users size={14} /></button>
                <button onClick={() => toggleStatus(exam)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" title={exam.status === 'Published' ? 'Close exam' : 'Publish exam'}>
                  {exam.status === 'Published' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                </button>
                <button onClick={() => openEdit(exam)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Edit"><FileCheck2 size={14} /></button>
                <button onClick={() => handleDelete(exam._id, exam.title)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="font-montserrat font-bold text-gray-900 dark:text-white mb-1">{exam.title}</h3>
            {exam.course?.name && <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">{exam.course.name}</p>}
            {exam.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{exam.description}</p>}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {exam.subjects.map(s => (
                <span key={s.subject._id} className="badge badge-blue text-xs">{s.subject.name}: {s.numberOfQuestions}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">🗓 {examTiming(exam)}</p>
            <div className="flex justify-between text-sm pt-3 border-t dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">{exam.totalQuestions} questions · {exam.durationMinutes} min</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{exam.totalMarks} marks</span>
            </div>
          </div>
        ))}
        {exams.length === 0 && <p className="text-center text-gray-400 py-12 col-span-2">No exams yet. Create one to get started.</p>}
      </div>

      {/* Create/Edit Exam Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{editing ? 'Edit Exam' : 'Create Exam'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Title *</label>
                  <input required className="input-field" placeholder="e.g. DCA Final Exam" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                  <select className="input-field" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                    <option value="">All courses (not restricted)</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes) *</label>
                  <input required type="number" min="1" className="input-field" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marks per Question *</label>
                  <input required type="number" min="1" className="input-field" value={form.marksPerQuestion} onChange={e => setForm({ ...form, marksPerQuestion: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Opens *</label>
                  <input required type="datetime-local" className="input-field" value={form.scheduledStart} onChange={e => setForm({ ...form, scheduledStart: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Closes *</label>
                  <input required type="datetime-local" className="input-field" value={form.scheduledEnd} onChange={e => setForm({ ...form, scheduledEnd: e.target.value })} /></div>
                <p className="col-span-2 text-xs text-gray-400 -mt-2">Students can only start the exam between these two times. If closing time is near, a student's time given will be capped so it doesn't run past it.</p>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              </div>

              {/* Subject rows: add/remove, per-subject question count */}
              <div className="border-t dark:border-gray-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subjects</label>
                  <button type="button" onClick={addSubjectRow} className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1"><Plus size={13} /> Add Subject</button>
                </div>
                <div className="space-y-2">
                  {form.subjects.map((row, idx) => {
                    const max = availableCount(row.subject);
                    const overLimit = Number(row.numberOfQuestions) > max;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <select className="input-field flex-1" value={row.subject} onChange={e => updateSubjectRow(idx, 'subject', e.target.value)}>
                          {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.questionCount} available)</option>)}
                        </select>
                        <input type="number" min="1" className={`input-field w-28 ${overLimit ? '!border-red-400' : ''}`} value={row.numberOfQuestions}
                          onChange={e => updateSubjectRow(idx, 'numberOfQuestions', e.target.value)} placeholder="Qs" />
                        <button type="button" onClick={() => removeSubjectRow(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"><Trash2 size={15} /></button>
                      </div>
                    );
                  })}
                  {form.subjects.length === 0 && <p className="text-sm text-gray-400 py-3 text-center">No subjects added. Click "Add Subject" above.</p>}
                </div>
                {form.subjects.some(r => Number(r.numberOfQuestions) > availableCount(r.subject)) && (
                  <p className="text-xs text-red-500 mt-2">⚠ One or more subjects request more questions than exist in the bank — add more questions there first.</p>
                )}
              </div>

              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Questions / Marks</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totalQuestions} questions · {totalMarks} marks</span>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Update Exam' : 'Create Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {resultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Results — {resultsExamTitle}</h2>
              <button onClick={() => setResultsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              {results.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No submissions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-400 border-b dark:border-gray-800">
                    <th className="pb-2">Student</th><th className="pb-2">Score</th><th className="pb-2">%</th><th className="pb-2">Correct / Wrong / Skipped</th><th className="pb-2">Warnings</th>
                  </tr></thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r._id} className="border-b dark:border-gray-800/50">
                        <td className="py-2">{r.student?.name} <span className="text-gray-400 text-xs">({r.student?.studentId})</span></td>
                        <td className="py-2 font-semibold">{r.score}/{r.totalMarks}</td>
                        <td className="py-2">{r.percentage}%</td>
                        <td className="py-2 text-gray-500">{r.correctCount} / {r.wrongCount} / {r.unattempted}</td>
                        <td className="py-2">
                          {r.violationCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold" title={r.autoSubmittedForViolations ? 'Auto-submitted after too many warnings' : 'Left the exam window / switched tabs'}>
                              ⚠️ {r.violationCount}{r.autoSubmittedForViolations ? ' (auto-submitted)' : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
