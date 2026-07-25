// ManualResultsPage.jsx — admin manually enters a student's marks (e.g. offline/paper exam)
// per subject, saves as a draft, and publishes it whenever ready so the student sees it
// under their own "My Results".
import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X, Eye, EyeOff, Pencil, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY_FORM = { studentId: '', title: '', subjects: [{ subjectName: '', marksObtained: '', maxMarks: '' }], remarks: '' };

export default function ManualResultsPage() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // the result being edited, or null for a new one
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchResults = () => api.get('/admin/manual-results').then(r => setResults(r.data.data || [])).finally(() => setLoading(false));
  const fetchStudents = () => api.get('/students').then(r => setStudents(r.data.data || []));
  useEffect(() => { fetchResults(); fetchStudents(); }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s => s.name?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const totals = useMemo(() => {
    const obtained = form.subjects.reduce((sum, s) => sum + (Number(s.marksObtained) || 0), 0);
    const max = form.subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);
    const pct = max > 0 ? Math.round((obtained / max) * 10000) / 100 : 0;
    return { obtained, max, pct };
  }, [form.subjects]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setStudentSearch(''); setModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      studentId: r.student?._id || '',
      title: r.title,
      subjects: r.subjects.map(s => ({ subjectName: s.subjectName, marksObtained: s.marksObtained, maxMarks: s.maxMarks })),
      remarks: r.remarks || '',
    });
    setModal(true);
  };

  const addSubjectRow = () => setForm(f => ({ ...f, subjects: [...f.subjects, { subjectName: '', marksObtained: '', maxMarks: '' }] }));
  const removeSubjectRow = (idx) => setForm(f => ({ ...f, subjects: f.subjects.filter((_, i) => i !== idx) }));
  const updateSubjectRow = (idx, field, value) => setForm(f => ({
    ...f, subjects: f.subjects.map((s, i) => i === idx ? { ...s, [field]: value } : s),
  }));

  const validateForm = () => {
    if (!editing && !form.studentId) { toast.error('Please select a student'); return false; }
    if (!form.title.trim()) { toast.error('Please enter a title (e.g. Mid Term Exam)'); return false; }
    const cleanSubjects = form.subjects.filter(s => s.subjectName.trim());
    if (cleanSubjects.length === 0) { toast.error('Add at least one subject with marks'); return false; }
    for (const s of cleanSubjects) {
      if (s.marksObtained === '' || s.maxMarks === '' || Number(s.maxMarks) <= 0) {
        toast.error(`Enter valid marks for "${s.subjectName}"`); return false;
      }
      if (Number(s.marksObtained) > Number(s.maxMarks)) {
        toast.error(`"${s.subjectName}": marks obtained can't exceed max marks`); return false;
      }
    }
    return true;
  };

  const buildPayload = () => ({
    studentId: form.studentId,
    title: form.title.trim(),
    subjects: form.subjects
      .filter(s => s.subjectName.trim())
      .map(s => ({ subjectName: s.subjectName.trim(), marksObtained: Number(s.marksObtained), maxMarks: Number(s.maxMarks) })),
    remarks: form.remarks.trim(),
  });

  const handleSave = async (publish) => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/manual-results/${editing._id}`, buildPayload());
        if (publish !== undefined && editing.published !== publish) {
          await api.put(`/admin/manual-results/${editing._id}/publish`, { published: publish });
        }
        toast.success('Result updated');
      } else {
        await api.post('/admin/manual-results', { ...buildPayload(), publish: !!publish });
        toast.success(publish ? 'Result published — student can see it now' : 'Saved as draft');
      }
      setModal(false);
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (r) => {
    try {
      await api.put(`/admin/manual-results/${r._id}/publish`, { published: !r.published });
      toast.success(r.published ? 'Unpublished — hidden from student now' : 'Published — student can see it now');
      fetchResults();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete "${r.title}" for ${r.student?.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/manual-results/${r._id}`);
      toast.success('Deleted');
      fetchResults();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award size={24} className="text-blue-600" /> Manual Results</h1>
          <p className="text-gray-500 text-sm mt-1">Enter marks by hand (e.g. offline/paper exams) and publish them to students.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Add Result</button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No manual results yet. Click "Add Result" to create one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b dark:border-gray-800">
              <th className="p-4">Student</th><th className="p-4">Title</th><th className="p-4">Score</th><th className="p-4">%</th><th className="p-4">Status</th><th className="p-4">Actions</th>
            </tr></thead>
            <tbody>
              {results.map(r => (
                <tr key={r._id} className="border-b dark:border-gray-800/50">
                  <td className="p-4">{r.student?.name || <span className="text-red-400 italic">Deleted student</span>} <span className="text-gray-400 text-xs">({r.student?.studentId})</span></td>
                  <td className="p-4">{r.title}</td>
                  <td className="p-4 font-semibold">{r.totalObtained}/{r.totalMax}</td>
                  <td className="p-4">{r.percentage}%</td>
                  <td className="p-4">
                    {r.published
                      ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Published</span>
                      : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Draft</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(r)} title="Edit" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><Pencil size={16} /></button>
                      <button onClick={() => togglePublish(r)} title={r.published ? 'Unpublish' : 'Publish'} className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${r.published ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {r.published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => handleDelete(r)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Edit Result' : 'Add Manual Result'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(editing ? editing.published : false); }} className="space-y-4">
              {!editing && (
                <div>
                  <label className="text-sm font-medium block mb-1">Student *</label>
                  <input
                    className="input-field mb-2"
                    placeholder="Search by name or ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <select required className="input-field" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                    <option value="">Select student</option>
                    {filteredStudents.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.studentId}) — {s.course?.name || 'No course'}</option>
                    ))}
                  </select>
                </div>
              )}
              {editing && (
                <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  Editing result for <span className="font-semibold text-gray-700 dark:text-gray-300">{editing.student?.name} ({editing.student?.studentId})</span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-1">Title *</label>
                <input required className="input-field" placeholder="e.g. Mid Term Exam - July 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Subjects & Marks *</label>
                  <button type="button" onClick={addSubjectRow} className="text-blue-600 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Add Subject</button>
                </div>
                <div className="space-y-2">
                  {form.subjects.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input className="input-field flex-1" placeholder="Subject name" value={row.subjectName} onChange={e => updateSubjectRow(idx, 'subjectName', e.target.value)} />
                      <input type="number" min="0" className="input-field w-24" placeholder="Obtained" value={row.marksObtained} onChange={e => updateSubjectRow(idx, 'marksObtained', e.target.value)} />
                      <span className="text-gray-400">/</span>
                      <input type="number" min="1" className="input-field w-24" placeholder="Max" value={row.maxMarks} onChange={e => updateSubjectRow(idx, 'maxMarks', e.target.value)} />
                      {form.subjects.length > 1 && (
                        <button type="button" onClick={() => removeSubjectRow(idx)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2 text-sm font-semibold">
                  <span>Total: {totals.obtained}/{totals.max}</span>
                  <span>{totals.pct}%</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Remarks (optional)</label>
                <textarea rows={2} className="input-field resize-none" placeholder="e.g. Excellent performance, needs improvement in..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm flex-1">Cancel</button>
                {(!editing || !editing.published) && (
                  <button type="button" disabled={saving} onClick={() => handleSave(false)} className="btn-secondary text-sm flex-1">
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </button>
                )}
                <button type="button" disabled={saving} onClick={() => handleSave(true)} className="btn-primary text-sm flex-1 !bg-gradient-to-r !from-emerald-500 !to-teal-600">
                  {saving ? 'Saving...' : editing?.published ? 'Update' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
