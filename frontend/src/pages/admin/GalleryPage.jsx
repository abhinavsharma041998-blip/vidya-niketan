import { useState, useEffect } from 'react';
import { UploadCloud, Trash2, X, Search, Image as ImageIcon, Star, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CATEGORIES = ['Campus', 'Events', 'Classroom', 'Convocation', 'Achievements', 'Other'];
const EMPTY = { title: '', description: '', category: 'Campus', featured: false };

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // photo being edited, or null for "add"
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchPhotos = () => api.get('/gallery').then(r => setPhotos(r.data.data || [])).finally(() => setLoading(false));

  useEffect(() => { fetchPhotos(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setFile(null); setPreview(null); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description || '', category: p.category, featured: p.featured });
    setFile(null);
    setPreview(p.imageUrl);
    setModal(true);
  };

  const handleFile = (f) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing && !file) { toast.error('Choose an image to upload'); return; }
    setSaving(true);
    const data = new FormData();
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('category', form.category);
    data.append('featured', form.featured);
    if (file) data.append('file', file);
    try {
      if (editing) {
        const r = await api.put(`/gallery/${editing._id}`, data);
        toast.success(r.data.message || 'Photo updated');
      } else {
        const r = await api.post('/gallery', data);
        toast.success(r.data.message || 'Photo uploaded');
      }
      setModal(false);
      fetchPhotos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/gallery/${id}`); toast.success('Deleted'); fetchPhotos(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleFeatured = async (p) => {
    try {
      const data = new FormData();
      data.append('featured', !p.featured);
      await api.put(`/gallery/${p._id}`, data);
      fetchPhotos();
    } catch { toast.error('Failed to update'); }
  };

  const visible = photos.filter(p =>
    (!filterCategory || p.category === filterCategory) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Photo Gallery</h1>
          <p className="text-gray-500 text-sm mt-0.5">Upload campus & event photos — mark ones to feature on the home page</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <UploadCloud size={16} /> Add Photo
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input-field pl-10" placeholder="Search by title..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field max-w-xs" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center text-gray-400">
          <ImageIcon size={36} className="mb-3" />
          <p>No photos yet. Click "Add Photo" to build your gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(p => (
            <div key={p._id} className="card overflow-hidden group relative">
              <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              {p.featured && (
                <span className="absolute top-2 left-2 badge badge-blue text-[10px] flex items-center gap-1 shadow"><Star size={10} className="fill-current" /> Featured</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-sm font-semibold truncate">{p.title}</p>
                <p className="text-blue-200 text-xs">{p.category}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button onClick={() => toggleFeatured(p)} title={p.featured ? 'Unfeature' : 'Feature on home page'}
                    className={`p-1.5 rounded-lg ${p.featured ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    <Star size={13} className={p.featured ? 'fill-current' : ''} />
                  </button>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(p._id, p.title)} className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{editing ? 'Edit Photo' : 'Add Photo'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Image {!editing && '*'} <span className="text-gray-400 font-normal">(JPG, PNG or WEBP)</span>
                </label>
                {preview && (
                  <div className="mb-2 rounded-xl overflow-hidden border dark:border-gray-700 aspect-video bg-gray-100 dark:bg-gray-800">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input required={!editing} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 file:text-sm file:font-medium" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input required className="input-field" placeholder="e.g. Annual Day Celebration 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                Feature this photo on the home page
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Upload Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
