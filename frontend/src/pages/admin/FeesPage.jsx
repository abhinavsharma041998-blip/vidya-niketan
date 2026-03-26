import { useState, useEffect } from 'react';
import { Plus, X, IndianRupee, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

const EMPTY = { studentId: '', amount: '', amountPaid: '', dueDate: '', paymentMode: 'Cash', installmentNumber: 1, description: '' };

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    const url = filterStatus === 'All' ? '/fees' : `/fees?status=${filterStatus}`;
    api.get(url).then(r => { setFees(r.data.data || []); setSummary(r.data.summary || {}); }).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [filterStatus]);
  useEffect(() => { api.get('/students?status=Active').then(r => setStudents(r.data.data || [])); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/fees', form);
      toast.success('Fee record added & notification sent');
      setModal(false); setForm(EMPTY); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const statusColors = { Paid: 'badge-green', Pending: 'badge-red', Partial: 'badge-yellow', Overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Fees Management</h1><p className="text-gray-500 text-sm">Track payments and dues</p></div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Add Record</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Amount', value: summary.totalAmount, icon: <IndianRupee size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Collected', value: summary.totalCollected, icon: <CheckCircle size={20} />, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Pending', value: summary.totalPending, icon: <AlertCircle size={20} />, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-lg font-bold text-gray-900 dark:text-white">₹{(s.value || 0).toLocaleString()}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Paid', 'Pending', 'Partial', 'Overdue'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Total</th><th>Paid</th><th>Pending</th><th>Mode</th><th>Status</th><th>Receipt</th><th>Date</th></tr></thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={9}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>) :
                fees.map(f => (
                  <tr key={f._id}>
                    <td><div><p className="font-medium text-gray-900 dark:text-white">{f.student?.name}</p><p className="text-xs text-gray-400">{f.student?.studentId}</p></div></td>
                    <td className="text-xs text-gray-500">{f.course?.name || '—'}</td>
                    <td className="font-semibold">₹{f.amount?.toLocaleString()}</td>
                    <td className="text-green-600 font-medium">₹{f.amountPaid?.toLocaleString()}</td>
                    <td className="text-red-500">₹{(f.amount - f.amountPaid)?.toLocaleString()}</td>
                    <td className="text-xs text-gray-500">{f.paymentMode}</td>
                    <td><span className={`badge text-xs ${statusColors[f.status] || 'badge-blue'}`}>{f.status}</span></td>
                    <td className="font-mono text-xs text-gray-400">{f.receiptNumber}</td>
                    <td className="text-xs text-gray-400">{format(new Date(f.createdAt), 'dd MMM yy')}</td>
                  </tr>
                ))}
              {!loading && fees.length === 0 && <tr><td colSpan={9} className="text-center text-gray-400 py-8">No fee records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Add Fee Record</h2>
              <button onClick={() => setModal(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Student *</label>
                <select required className="input-field" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Total Amount (₹) *</label><input required type="number" className="input-field" placeholder="6000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount Paid (₹)</label><input type="number" className="input-field" placeholder="0" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label><input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment Mode</label>
                  <select className="input-field" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                    {['Cash', 'Online', 'UPI', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label><input className="input-field" placeholder="e.g. 1st installment" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
