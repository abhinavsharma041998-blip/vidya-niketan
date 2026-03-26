// AdminCoursesPage.jsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY = { name: '', code: '', description: '', duration: '', durationMonths: '', fees: '', category: 'Basic', syllabusTopics: '', eligibility: '', isActive: true };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = () => api.get('/courses').then(r => setCourses(r.data.data || []));
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => { setEditing(c._id); setForm({ ...c, syllabusTopics: c.syllabusTopics?.join(', ') || '' }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, syllabusTopics: form.syllabusTopics.split(',').map(s => s.trim()).filter(Boolean), fees: Number(form.fees), durationMonths: Number(form.durationMonths) };
    try {
      if (editing) { await api.put(`/courses/${editing}`, payload); toast.success('Course updated'); }
      else { await api.post('/courses', payload); toast.success('Course created'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/courses/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed to delete'); }
  };

  const categoryColors = { Basic: 'badge-green', Intermediate: 'badge-yellow', Advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', Professional: 'badge-blue' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-gray-500 text-sm">{courses.length} courses</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Add Course</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c._id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className={`badge text-xs ${categoryColors[c.category] || 'badge-blue'}`}>{c.category}</span>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(c._id, c.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 className="font-montserrat font-bold text-gray-900 dark:text-white mb-1">{c.name}</h3>
            <p className="text-xs text-gray-400 mb-3 font-mono">{c.code}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{c.description}</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">{c.duration}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">₹{c.fees?.toLocaleString()}</span>
            </div>
            <div className={`mt-3 pt-3 border-t dark:border-gray-800 flex items-center justify-between`}>
              <span className={`badge text-xs ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
              <span className="text-xs text-gray-400">{c.syllabusTopics?.length || 0} topics</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{editing ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name *</label><input required className="input-field" placeholder="e.g. DCA" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label><input required className="input-field" placeholder="DCA" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['Basic', 'Intermediate', 'Advanced', 'Professional'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label><input className="input-field" placeholder="6 Months" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fees (₹) *</label><input required type="number" className="input-field" placeholder="6000" value={form.fees} onChange={e => setForm({ ...form, fees: e.target.value })} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Syllabus Topics (comma separated)</label><input className="input-field" placeholder="MS Office, Tally, Internet, HTML" value={form.syllabusTopics} onChange={e => setForm({ ...form, syllabusTopics: e.target.value })} /></div>
                <div className="col-span-2 flex items-center gap-2"><input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Active (visible on website)</label></div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
