import { useState, useEffect } from 'react';
import { QrCode, Landmark, Copy, Camera, MessageCircle, UploadCloud, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

const copyToClipboard = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toast.success('Copied');
};

const statusBadge = { Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red' };

export default function StudentPaymentPage() {
  const [tab, setTab] = useState('UPI'); // 'UPI' | 'Bank Transfer'
  const [settings, setSettings] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', transactionRef: '', note: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/payment-settings'),
      api.get('/payment-submissions/me'),
    ]).then(([s, sub]) => {
      setSettings(s.data.data);
      setSubmissions(sub.data.data || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please attach your payment screenshot');
    if (!form.amount) return toast.error('Please enter the amount you paid');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('method', tab);
      fd.append('amount', form.amount);
      fd.append('transactionRef', form.transactionRef);
      fd.append('note', form.note);
      fd.append('file', file);
      await api.post('/payment-submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Payment submitted! It will reflect once the admin confirms it.');
      setForm({ amount: '', transactionRef: '', note: '' });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit payment');
    } finally {
      setSaving(false);
    }
  };

  const bank = settings?.bank || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Make a Payment</h1>
        <p className="text-gray-500 text-sm">Pay via UPI or bank transfer and submit proof for confirmation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: payment details + submit form */}
        <div className="card p-5 space-y-5">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button onClick={() => setTab('UPI')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'UPI' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
              UPI Payment
            </button>
            <button onClick={() => setTab('Bank Transfer')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'Bank Transfer' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
              Bank Transfer
            </button>
          </div>

          {loading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : tab === 'UPI' ? (
            <div className="text-center space-y-3">
              <p className="flex items-center justify-center gap-2 font-montserrat font-bold text-gray-900 dark:text-white"><QrCode size={18} className="text-blue-600" /> Scan &amp; Pay</p>
              <p className="text-sm text-gray-500">Scan the QR code using any UPI app and complete your payment.</p>
              {settings?.qrImageUrl ? (
                <img src={settings.qrImageUrl} alt="UPI QR" className="w-52 h-52 mx-auto rounded-xl border border-gray-200 dark:border-gray-700 object-contain" />
              ) : (
                <div className="w-52 h-52 mx-auto rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-400">QR not set up yet</div>
              )}
              <button onClick={() => copyToClipboard(settings?.upiId)} className="inline-flex items-center gap-2 text-sm font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
                UPI ID: <span className="font-semibold">{settings?.upiId || '—'}</span> <Copy size={14} className="text-gray-400" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-montserrat font-bold text-gray-900 dark:text-white"><Landmark size={18} className="text-blue-600" /> Bank Transfer</p>
              <p className="text-sm text-gray-500">Transfer funds directly to our bank account and share payment proof.</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {[
                  ['Account Holder', bank.accountHolder],
                  ['Account Number', bank.accountNumber],
                  ['Account Type', bank.accountType],
                  ['UPI ID', bank.upiId],
                  ['IFSC Code', bank.ifsc],
                  ['Branch Name', bank.branchName],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">{value || '—'}
                      {value && <Copy size={13} className="text-gray-400 cursor-pointer" onClick={() => copyToClipboard(value)} />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settings?.whatsappNumber && (
            <div className="flex items-center gap-3 text-sm bg-green-50 dark:bg-green-900/10 rounded-xl px-4 py-3">
              <MessageCircle size={18} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-gray-500">Questions about your payment?</p>
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="font-semibold text-green-700 dark:text-green-400">{settings.whatsappNumber}</a>
              </div>
            </div>
          )}

          {/* Submit proof form */}
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Camera size={16} className="text-blue-600" /> Submit your payment for confirmation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount Paid (₹) *</label>
                <input required type="number" min="1" className="input-field" placeholder="e.g. 5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Transaction / UTR No.</label>
                <input className="input-field" placeholder="Optional" value={form.transactionRef} onChange={e => setForm({ ...form, transactionRef: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
              <input className="input-field" placeholder="Optional" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Screenshot *</label>
              <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors">
                <UploadCloud size={18} className="text-gray-400" />
                <span className="text-sm text-gray-500 truncate">{file ? file.name : 'Choose screenshot to upload'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
              </label>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full text-sm">{saving ? 'Submitting...' : 'Submit Payment'}</button>
          </form>
        </div>

        {/* Right: submission history */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-4 border-b dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Your Submissions</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse m-3 rounded-lg" />) :
              submissions.map(s => (
                <div key={s._id} className="p-4 flex items-start gap-3">
                  <img src={s.screenshotUrl} alt="proof" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">₹{s.amount?.toLocaleString()}</p>
                      <span className={`badge text-xs ${statusBadge[s.status]}`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.method} · {format(new Date(s.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                    {s.status === 'Rejected' && s.rejectionReason && <p className="text-xs text-red-500 mt-1">Reason: {s.rejectionReason}</p>}
                  </div>
                </div>
              ))}
            {!loading && !submissions.length && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FolderOpen size={40} className="mb-2" />
                <p className="text-sm">No submissions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
