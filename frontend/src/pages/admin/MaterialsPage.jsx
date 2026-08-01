import { useState, useEffect } from 'react';
import { UploadCloud, Trash2, FileText, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CATEGORIES = ['Syllabus', 'Notes', 'Assignment', 'Other'];
const EMPTY = { title: '', description: '', category: 'Syllabus', course: '' };

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');

  const fetchMaterials = () => api.get('/materials/admin').then(r => setMaterials(r.data.data || [])).finally(() => setLoading(false));

  useEffect(() => {
    fetchMaterials();
    api.get('/courses').then(r => setCourses(r.data.data || []));
  }, []);

  const openAdd = () => { setForm(EMPTY); setFile(null); setModal(true); };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Choose a file to upload'); return; }
    setUploading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append('file', file);
    try {
      await api.post('/materials', data);
      toast.success('Material uploaded');
      setModal(false);
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/materials/${id}`); toast.success('Deleted'); fetchMaterials(); }
    catch { toast.error('Failed to delete'); }
  };

  const visible = filterCourse ? materials.filter(m => m.course?._id === filterCourse) : materials;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Study Materials</h1>
          <p className="text-gray-500 text-sm mt-0.5">Syllabus, notes & assignments — uploaded by admin and teachers</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <UploadCloud size={16} /> Upload
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input-field max-w-xs" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Category</th><th>Course</th><th>Uploaded By</th><th>Size</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>
              )) : visible.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-blue-500 flex-shrink-0" />
                      <div><p className="font-medium text-gray-900 dark:text-white">{m.title}</p><p className="text-xs text-gray-400 uppercase">{m.fileType}</p></div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue text-xs">{m.category}</span></td>
                  <td className="text-sm">{m.course?.name || '—'}</td>
                  <td className="text-sm">{m.uploadedByName} <span className="text-xs text-gray-400">({m.uploadedByRole})</span></td>
                  <td className="text-xs text-gray-400">{m.fileSizeKB ? `${(m.fileSizeKB / 1024).toFixed(1)} MB` : '—'}</td>
                  <td className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <a href={m.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Download size={14} /></a>
                      <button onClick={() => handleDelete(m._id, m.title)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No materials uploaded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Upload Material</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input required className="input-field" placeholder="e.g. DCA Official Syllabus 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                  <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course *</label>
                  <select required className="input-field" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File * <span className="text-gray-400 font-normal">(PDF, Word, PPT, Excel or image — max 15MB)</span></label>
                <input required type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 file:text-sm file:font-medium" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary text-sm">{uploading ? 'Uploading…' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
