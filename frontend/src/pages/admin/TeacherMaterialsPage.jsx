import { useState, useEffect, useMemo } from 'react';
import { UploadCloud, Trash2, FileText, Download, X, Search, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Syllabus', 'Notes', 'Assignment', 'Other'];
const EMPTY = { title: '', description: '', category: 'Notes' };

export default function TeacherMaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');

  const fetchMaterials = () => api.get('/materials/mine').then(r => setMaterials(r.data.data || [])).finally(() => setLoading(false));

  useEffect(() => {
    fetchMaterials();
    api.get('/courses').then(r => {
      const all = r.data.data || [];
      // A course-restricted teacher only ever uploads for their own course
      setCourses(user?.course?._id ? all.filter(c => c._id === user.course._id) : all);
    });
  }, []);

  const openAdd = () => {
    setForm(EMPTY);
    setFile(null);
    setSelectedCourses(user?.course?._id ? [user.course._id] : []);
    setCourseSearch('');
    setModal(true);
  };

  const filteredCourses = useMemo(
    () => courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase())),
    [courses, courseSearch]
  );

  const toggleCourse = (id) => {
    setSelectedCourses(sel => sel.includes(id) ? sel.filter(c => c !== id) : [...sel, id]);
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filteredCourses.map(c => c._id);
    const allSelected = allFilteredIds.every(id => selectedCourses.includes(id));
    setSelectedCourses(sel => allSelected
      ? sel.filter(id => !allFilteredIds.includes(id))
      : [...new Set([...sel, ...allFilteredIds])]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Choose a file to upload'); return; }
    if (selectedCourses.length === 0) { toast.error('Select at least one course'); return; }
    setUploading(true);
    const data = new FormData();
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('category', form.category);
    data.append('courses', JSON.stringify(selectedCourses));
    data.append('file', file);
    try {
      const r = await api.post('/materials', data);
      toast.success(r.data.message || 'Uploaded');
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Study Materials</h1>
          <p className="text-gray-500 text-sm mt-0.5">Upload notes, assignments, or syllabus for your students</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm !bg-gradient-to-r !from-purple-600 !to-indigo-700">
          <UploadCloud size={16} /> Upload
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Category</th><th>Course</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>
              )) : materials.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-purple-500 flex-shrink-0" />
                      <div><p className="font-medium text-gray-900 dark:text-white">{m.title}</p><p className="text-xs text-gray-400 uppercase">{m.fileType}</p></div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue text-xs">{m.category}</span></td>
                  <td className="text-sm">{m.course?.name || '—'}</td>
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
              {!loading && materials.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">No materials uploaded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Upload Material</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input required className="input-field" placeholder="e.g. Unit 3 Notes - Networking" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Multi-course picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Courses * <span className="text-gray-400 font-normal">({selectedCourses.length} selected)</span>
                  </label>
                  {!user?.course?._id && courses.length > 1 && (
                    <button type="button" onClick={toggleSelectAll} className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1">
                      {filteredCourses.every(c => selectedCourses.includes(c._id)) ? <CheckSquare size={13} /> : <Square size={13} />}
                      {filteredCourses.every(c => selectedCourses.includes(c._id)) ? 'Unselect all' : 'Select all'}
                    </button>
                  )}
                </div>

                {user?.course?._id ? (
                  <p className="input-field bg-gray-50 dark:bg-gray-800 text-sm text-gray-500">{user.course.name} (your assigned course)</p>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input className="input-field pl-9 text-sm !py-1.5" placeholder="Search courses..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                    </div>
                    <div className="border dark:border-gray-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredCourses.length === 0 && <p className="text-sm text-gray-400 p-3">No courses match</p>}
                      {filteredCourses.map(c => (
                        <label key={c._id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 text-sm">
                          <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" checked={selectedCourses.includes(c._id)} onChange={() => toggleCourse(c._id)} />
                          <span className="text-gray-700 dark:text-gray-300">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File * <span className="text-gray-400 font-normal">(PDF, Word, PPT, Excel or image — max 15MB)</span></label>
                <input required type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={e => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-900/20 dark:file:text-purple-400 file:text-sm file:font-medium" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary text-sm !bg-gradient-to-r !from-purple-600 !to-indigo-700">
                  {uploading ? 'Uploading…' : `Upload${selectedCourses.length > 1 ? ` to ${selectedCourses.length} courses` : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
