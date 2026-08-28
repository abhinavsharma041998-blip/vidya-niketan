import { useState, useEffect } from 'react';
import { Settings, Inbox, UploadCloud, Check, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

const statusBadge = { Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red' };

function SettingsTab() {
  const [form, setForm] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payment-settings/admin').then(r => {
      const s = r.data.data;
      setForm({
        upiId: s.upiId || '', whatsappNumber: s.whatsappNumber || '',
        accountHolder: s.bank?.accountHolder || '', accountNumber: s.bank?.accountNumber || '',
        accountType: s.bank?.accountType || '', bankUpiId: s.bank?.upiId || '',
        ifsc: s.bank?.ifsc || '', branchName: s.bank?.branchName || '',
      });
      setQrPreview(s.qrImageUrl || '');
    }).finally(() => setLoading(false));
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setQrFile(f);
    setQrPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (qrFile) fd.append('file', qrFile);
      await api.put('/payment-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Payment settings updated');
      setQrFile(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (loading || !form) return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;

  const field = (label, key, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input className="input-field" placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">UPI Payment</h3>
        {field('UPI ID', 'upiId', 'yourid@bank')}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">QR Code Image</label>
          <div className="flex items-center gap-4">
            {qrPreview ? <img src={qrPreview} alt="QR preview" className="w-24 h-24 rounded-lg border border-gray-200 dark:border-gray-700 object-contain" /> :
              <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400"><UploadCloud size={20} /></div>}
            <label className="btn-secondary text-sm cursor-pointer">
              Upload QR
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
        </div>
        {field('WhatsApp Number (for payment queries)', 'whatsappNumber', '+91 8855856055')}
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Bank Transfer Details</h3>
        {field('Account Holder', 'accountHolder')}
        {field('Account Number', 'accountNumber')}
        {field('Account Type', 'accountType', 'e.g. Current Account')}
        {field('UPI ID (shown on Bank tab)', 'bankUpiId')}
        {field('IFSC Code', 'ifsc')}
        {field('Branch Name', 'branchName')}
      </div>

      <div className="lg:col-span-2 flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save Payment Settings'}</button>
      </div>
    </form>
  );
}

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [reviewing, setReviewing] = useState(null); // submission being reviewed
  const [studentFees, setStudentFees] = useState([]);
  const [applyToFeeId, setApplyToFeeId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState(''); // 'approve' | 'reject'
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const url = filter === 'All' ? '/payment-submissions' : `/payment-submissions?status=${filter}`;
    api.get(url).then(r => setSubmissions(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const openReview = async (submission, actionMode) => {
    setReviewing(submission); setMode(actionMode); setApplyToFeeId(''); setRejectReason('');
    if (actionMode === 'approve') {
      const r = await api.get(`/fees?studentId=${submission.student._id}`);
      setStudentFees((r.data.data || []).filter(f => f.status !== 'Paid'));
    }
  };

  const closeReview = () => { setReviewing(null); setMode(''); };

  const confirmAction = async () => {
    setSaving(true);
    try {
      const payload = mode === 'approve'
        ? { action: 'Approve', applyToFeeId: applyToFeeId || undefined }
        : { action: 'Reject', rejectionReason: rejectReason };
      await api.put(`/payment-submissions/${reviewing._id}/review`, payload);
      toast.success(mode === 'approve' ? 'Payment approved & reflected in fees' : 'Submission rejected');
      closeReview(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>{s}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Screenshot</th><th>Student</th><th>Method</th><th>Amount</th><th>Ref</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={8}><div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>) :
                submissions.map(s => (
                  <tr key={s._id}>
                    <td><a href={s.screenshotUrl} target="_blank" rel="noreferrer"><img src={s.screenshotUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700" /></a></td>
                    <td><p className="font-medium text-gray-900 dark:text-white">{s.student?.name}</p><p className="text-xs text-gray-400">{s.student?.studentId}</p></td>
                    <td className="text-xs text-gray-500">{s.method}</td>
                    <td className="font-semibold">₹{s.amount?.toLocaleString()}</td>
                    <td className="text-xs text-gray-400 font-mono">{s.transactionRef || '—'}</td>
                    <td><span className={`badge text-xs ${statusBadge[s.status]}`}>{s.status}</span></td>
                    <td className="text-xs text-gray-400">{format(new Date(s.createdAt), 'dd MMM yy, h:mm a')}</td>
                    <td>
                      {s.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => openReview(s, 'approve')} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg p-1.5" title="Approve"><Check size={16} /></button>
                          <button onClick={() => openReview(s, 'reject')} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-1.5" title="Reject"><X size={16} /></button>
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              {!loading && !submissions.length && <tr><td colSpan={8} className="text-center text-gray-400 py-8">No submissions</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">{mode === 'approve' ? 'Approve Payment' : 'Reject Payment'}</h2>
              <button onClick={closeReview} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <img src={reviewing.screenshotUrl} className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{reviewing.student?.name} — ₹{reviewing.amount?.toLocaleString()}</p>
                  <a href={reviewing.screenshotUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1">View full screenshot <ExternalLink size={12} /></a>
                </div>
              </div>

              {mode === 'approve' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apply to existing fee record (optional)</label>
                  <select className="input-field" value={applyToFeeId} onChange={e => setApplyToFeeId(e.target.value)}>
                    <option value="">Create a new fee record</option>
                    {studentFees.map(f => (
                      <option key={f._id} value={f._id}>{f.description || f.receiptNumber} — ₹{f.amount - f.amountPaid} pending</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5">If this payment is towards an existing pending/partial fee, pick it here. Otherwise a new "Paid" record is created.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason for rejection</label>
                  <input className="input-field" placeholder="e.g. Screenshot unclear / amount mismatch" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeReview} className="btn-secondary text-sm">Cancel</button>
                <button onClick={confirmAction} disabled={saving} className={`text-sm px-4 py-2.5 rounded-xl font-medium text-white ${mode === 'approve' ? 'bg-green-600' : 'bg-red-500'}`}>
                  {saving ? 'Please wait...' : mode === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const [tab, setTab] = useState('submissions');

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Payments</h1><p className="text-gray-500 text-sm">Review student payment submissions and manage payment details</p></div>

      <div className="flex gap-2">
        <button onClick={() => setTab('submissions')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${tab === 'submissions' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}><Inbox size={16} /> Submissions</button>
        <button onClick={() => setTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${tab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}><Settings size={16} /> Payment Settings</button>
      </div>

      {tab === 'submissions' ? <SubmissionsTab /> : <SettingsTab />}
    </div>
  );
}
