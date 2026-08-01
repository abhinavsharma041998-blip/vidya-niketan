import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

const EMPTY = { name: '', phone: '', email: '', subject: '', username: '', password: '', course: '', status: 'Active', photo: '' };

const resizeImageToBase64 = (file, maxDim = 400) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchTeachers = useCallback(() => {
    setLoading(true);
    api.get('/teachers').then(r => setTeachers(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useEffect(() => { api.get('/courses?active=true').then(r => setCourses(r.data.data || [])); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (t) => { setEditing(t._id); setForm({ ...t, course: t.course?._id || '', password: '', photo: t.photo || '' }); setModal(true); };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    try {
      const base64 = await resizeImageToBase64(file);
      setForm(f => ({ ...f, photo: base64 }));
    } catch { toast.error('Could not read that image'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { password, ...data } = form;
        await api.put(`/teachers/${editing}`, { ...data, password: password || undefined });
        toast.success('Teacher updated');
      } else {
        await api.post('/teachers', form);
        toast.success('Teacher added');
      }
      setModal(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove teacher "${name}"? Their uploaded materials will stay, but they will no longer be able to log in.`)) return;
    try { await api.delete(`/teachers/${id}`); toast.success('Teacher removed'); fetchTeachers(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="text-gray-500 text-sm mt-0.5">{teachers.length} total teachers</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Teacher</th><th>Subject</th><th>Course</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>
              )) : teachers.map(t => (
                <tr key={t._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      {t.photo ? (
                        <img src={t.photo} alt={t.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border dark:border-gray-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{t.name[0]}</div>
                      )}
                      <div><p className="font-medium text-gray-900 dark:text-white">{t.name}</p><p className="text-xs text-gray-400">{t.username}</p></div>
                    </div>
                  </td>
                  <td className="text-sm">{t.subject || '—'}</td>
                  <td>{t.course?.name || <span className="text-gray-300">All Courses</span>}</td>
                  <td>{t.phone}</td>
                  <td><span className={`badge text-xs ${t.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{t.status}</span></td>
                  <td className="text-xs text-gray-400">{format(new Date(t.createdAt), 'dd MMM yy')}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(t._id, t.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && teachers.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No teachers added yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{editing ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {form.photo ? (
                  <img src={form.photo} alt="Preview" className="w-20 h-20 rounded-xl object-cover border dark:border-gray-700" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400"><Camera size={24} /></div>
                )}
                <label className="btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer">
                  <Camera size={14} /> {form.photo ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label><input required className="input-field" placeholder="Teacher name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone *</label><input required className="input-field" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label><input type="email" className="input-field" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject Taught</label><input className="input-field" placeholder="e.g. Computer Fundamentals" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assigned Course</label>
                  <select className="input-field" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                    <option value="">All Courses (not restricted)</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Active</option><option>Inactive</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username *</label><input required={!editing} className="input-field" placeholder="login username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{editing ? 'New Password (leave blank)' : 'Password *'}</label><input type="password" required={!editing} className="input-field" placeholder={editing ? 'Leave blank to keep' : 'Set password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editing ? 'Update Teacher' : 'Add Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
