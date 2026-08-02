import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

const todayStr = () => new Date().toISOString().split('T')[0];
const EMPTY = { name: '', phone: '', email: '', username: '', password: '', course: '', fatherName: '', address: '', gender: '', dob: '', status: 'Active', photo: '', admissionDate: todayStr(), studentId: '' };

// Shrink & compress a selected photo client-side before storing it (keeps documents small and uploads fast)
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

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(() => {
    setLoading(true);
    api.get(`/students${search ? `?search=${search}` : ''}`).then(r => setStudents(r.data.data || [])).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { api.get('/courses?active=true').then(r => setCourses(r.data.data || [])); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => {
    setEditing(s._id);
    setForm({
      ...s, course: s.course?._id || '', password: '', photo: s.photo || '',
      admissionDate: s.admissionDate ? s.admissionDate.split('T')[0] : todayStr(),
    });
    setModal(true);
  };

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
        await api.put(`/students/${editing}`, data);
        toast.success('Student updated');
      } else {
        await api.post('/students', form);
        toast.success('Student added & SMS/WhatsApp sent');
      }
      setModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete student "${name}"?`)) return;
    try { await api.delete(`/students/${id}`); toast.success('Student deleted'); fetchStudents(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">{students.length} total students</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input-field pl-10" placeholder="Search by name, ID, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>ID</th><th>Course</th><th>Phone</th><th>Status</th><th>Admission Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>
              )) : students.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      {s.photo ? (
                        <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border dark:border-gray-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.name[0]}</div>
                      )}
                      <div><p className="font-medium text-gray-900 dark:text-white">{s.name}</p><p className="text-xs text-gray-400">{s.username}</p></div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{s.studentId}</td>
                  <td>{s.course?.name || <span className="text-gray-300">—</span>}</td>
                  <td>{s.phone}</td>
                  <td><span className={`badge text-xs ${s.status === 'Active' ? 'badge-green' : s.status === 'Completed' ? 'badge-blue' : 'badge-red'}`}>{s.status}</span></td>
                  <td className="text-xs text-gray-400">{format(new Date(s.admissionDate || s.createdAt), 'dd MMM yyyy')}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && students.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{editing ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {form.photo ? (
                  <img src={form.photo} alt="Preview" className="w-20 h-20 rounded-xl object-cover border dark:border-gray-700" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <Camera size={24} />
                  </div>
                )}
                <div>
                  <label className="btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer">
                    <Camera size={14} /> {form.photo ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5">Used to verify the student's identity during exams</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Student ID {!editing && '*'}</label>
                  <input required={!editing} disabled={!!editing} className="input-field disabled:opacity-60 disabled:cursor-not-allowed font-mono" placeholder="e.g. VN0026" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value.toUpperCase() })} />
                  <p className="text-xs text-gray-400 mt-1">{editing ? "Can't be changed after creation" : 'Set this yourself — reuse an ID freed up by a deleted student if you want'}</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label><input required className="input-field" placeholder="Student name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone *</label><input required className="input-field" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label><input type="email" className="input-field" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Father's Name</label><input className="input-field" placeholder="Father's name" value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course</label>
                  <select className="input-field" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
                  <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Admission Date *</label>
                  <input required type="date" className="input-field" value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} />
                  <p className="text-xs text-gray-400 mt-1">Set the actual date the student was admitted (can be backdated)</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username *</label><input required={!editing} className="input-field" placeholder="login username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{editing ? 'New Password (leave blank)' : 'Password *'}</label><input type="password" required={!editing} className="input-field" placeholder={editing ? 'Leave blank to keep' : 'Set password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Active</option><option>Inactive</option><option>Completed</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of Birth</label><input type="date" className="input-field" value={form.dob ? form.dob.split('T')[0] : ''} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label><textarea rows={2} className="input-field resize-none" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                  {saving && <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  {saving ? 'Saving...' : editing ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
