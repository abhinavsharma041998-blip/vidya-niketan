import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Pencil, Briefcase, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const STATES = [
  'All India', 'Himachal Pradesh', 'Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh',
  'Uttarakhand', 'Rajasthan', 'Jammu and Kashmir', 'Chandigarh', 'Madhya Pradesh',
  'Bihar', 'Maharashtra', 'Gujarat', 'West Bengal',
];

const EMPTY = {
  title: '', board: '', state: 'Himachal Pradesh', postName: '', vacancies: '',
  qualification: '', ageLimit: '', applicationFee: '', lastDate: '', applyLink: '',
  officialNotificationLink: '', active: true,
};

export default function RecruitmentNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchNotices = () => api.get('/recruitment-notices/admin').then(r => setNotices(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { fetchNotices(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (n) => {
    setEditing(n);
    setForm({ ...EMPTY, ...n, lastDate: n.lastDate ? n.lastDate.slice(0, 10) : '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, lastDate: form.lastDate || undefined };
      if (editing) {
        await api.put(`/recruitment-notices/${editing._id}`, payload);
        toast.success('Notice updated');
      } else {
        await api.post('/recruitment-notices', payload);
        toast.success('Notice added');
      }
      setModal(false);
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (n) => {
    try { await api.put(`/recruitment-notices/${n._id}`, { active: !n.active }); fetchNotices(); }
    catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/recruitment-notices/${id}`); toast.success('Deleted'); fetchNotices(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Recruitment Notices</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manually verified govt job notices — shown on the News page's "Govt Recruitment" tab, above the auto-fetched news</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Notice
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : notices.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center text-gray-400">
          <Briefcase size={36} className="mb-3" />
          <p>No notices yet. Add one from the official board's notification.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n._id} className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${!n.active ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="badge badge-blue text-xs">{n.board}</span>
                  <span className="text-xs text-gray-400">{n.state}</span>
                  {n.lastDate && <span className="text-xs text-gray-400">· Last date: {new Date(n.lastDate).toLocaleDateString('en-IN')}</span>}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.qualification}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a href={n.officialNotificationLink} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View official notification">
                  <ExternalLink size={15} />
                </a>
                <button onClick={() => toggleActive(n)} title={n.active ? 'Deactivate' : 'Activate'}
                  className={`p-2 rounded-lg ${n.active ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {n.active ? <CheckCircle size={15} /> : <XCircle size={15} />}
                </button>
                <button onClick={() => openEdit(n)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"><Pencil size={15} /></button>
                <button onClick={() => handleDelete(n._id, n.title)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{editing ? 'Edit Notice' : 'Add Notice'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input required className="input-field" placeholder="e.g. HPSSC Junior Office Assistant (IT) Recruitment 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Board *</label>
                  <input required className="input-field" placeholder="HPSSC, HPPSC, SSC..." value={form.board} onChange={e => setForm({ ...form, board: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State *</label>
                  <select className="input-field" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Post Name(s)</label>
                <input className="input-field" placeholder="e.g. Clerk, Junior Office Assistant" value={form.postName} onChange={e => setForm({ ...form, postName: e.target.value })} /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vacancies</label>
                  <input className="input-field" placeholder="e.g. 250 posts" value={form.vacancies} onChange={e => setForm({ ...form, vacancies: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Date to Apply</label>
                  <input type="date" className="input-field" value={form.lastDate} onChange={e => setForm({ ...form, lastDate: e.target.value })} /></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qualification / Eligibility *</label>
                <textarea required rows={2} className="input-field resize-none" placeholder="e.g. 10+2 pass with DCA / Graduate in any discipline" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Age Limit</label>
                  <input className="input-field" placeholder="e.g. 18-45 years" value={form.ageLimit} onChange={e => setForm({ ...form, ageLimit: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Application Fee</label>
                  <input className="input-field" placeholder="e.g. ₹360 (General)" value={form.applicationFee} onChange={e => setForm({ ...form, applicationFee: e.target.value })} /></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Official Notification Link * <span className="text-gray-400 font-normal">(the board's own PDF/notice page)</span></label>
                <input required type="url" className="input-field" placeholder="https://hpsssb.hp.gov.in/..." value={form.officialNotificationLink} onChange={e => setForm({ ...form, officialNotificationLink: e.target.value })} /></div>

              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apply Online Link</label>
                <input type="url" className="input-field" placeholder="https://hpsssb.hp.gov.in/apply" value={form.applyLink} onChange={e => setForm({ ...form, applyLink: e.target.value })} /></div>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                Active (visible on the News page)
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Notice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
