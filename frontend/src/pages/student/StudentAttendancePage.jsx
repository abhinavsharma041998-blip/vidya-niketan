import { useState, useEffect } from 'react';
import { CalendarCheck } from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';

export function StudentAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/attendance/me').then(r => setData(r.data.data)).finally(() => setLoading(false)); }, []);

  const { records = [], summary = {} } = data || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">My Attendance</h1>
        <p className="text-gray-500 text-sm">View your complete attendance history</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Classes', value: summary.total || 0, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Present', value: summary.present || 0, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Absent', value: summary.absent || 0, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
          { label: 'Percentage', value: `${summary.percentage || 0}%`, color: summary.percentage >= 75 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className={`text-2xl font-montserrat font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Attendance Progress</span>
          <span className={`font-bold ${summary.percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>{summary.percentage || 0}%</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${summary.percentage >= 75 ? 'bg-gradient-to-r from-green-400 to-green-600' : summary.percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
            style={{ width: `${summary.percentage || 0}%` }} />
        </div>
        {summary.percentage < 75 && <p className="text-xs text-red-500 mt-2">Your attendance is below 75%. Minimum 75% is required.</p>}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><CalendarCheck size={16} className="text-blue-600" /> Attendance Records ({records.length})</h3>
        </div>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={3}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>) :
              records.map(r => (
                <tr key={r._id}>
                  <td>{format(new Date(r.date), 'dd MMM yyyy')}</td>
                  <td className="text-gray-500 text-xs">{format(new Date(r.date), 'EEEE')}</td>
                  <td><span className={`badge text-xs ${r.status === 'Present' ? 'badge-green' : r.status === 'Absent' ? 'badge-red' : r.status === 'Late' ? 'badge-yellow' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                </tr>
              ))}
            {!loading && !records.length && <tr><td colSpan={3} className="text-center text-gray-400 py-8">No records yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StudentFeesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/fees/me').then(r => setData(r.data)).finally(() => setLoading(false)); }, []);

  const { data: fees = [], summary = {} } = data || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">My Fees</h1>
        <p className="text-gray-500 text-sm">Track your fee payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Fees', value: summary.totalAmount || 0, color: 'text-blue-600' },
          { label: 'Amount Paid', value: summary.totalPaid || 0, color: 'text-green-600' },
          { label: 'Pending', value: summary.totalPending || 0, color: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="card p-5 text-center">
            <p className={`text-3xl font-montserrat font-bold ${s.color}`}>₹{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {summary.totalPending > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          ⚠️ You have ₹{summary.totalPending?.toLocaleString()} in pending fees. Please pay at the earliest to avoid disruption to your studies.
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Receipt No.</th><th>Amount</th><th>Paid</th><th>Mode</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>) :
              fees.map(f => (
                <tr key={f._id}>
                  <td className="font-mono text-xs">{f.receiptNumber}</td>
                  <td className="font-semibold">₹{f.amount?.toLocaleString()}</td>
                  <td className="text-green-600">₹{f.amountPaid?.toLocaleString()}</td>
                  <td className="text-xs text-gray-400">{f.paymentMode}</td>
                  <td><span className={`badge text-xs ${f.status === 'Paid' ? 'badge-green' : f.status === 'Partial' ? 'badge-yellow' : 'badge-red'}`}>{f.status}</span></td>
                  <td className="text-xs text-gray-400">{format(new Date(f.createdAt), 'dd MMM yy')}</td>
                </tr>
              ))}
            {!loading && !fees.length && <tr><td colSpan={6} className="text-center text-gray-400 py-8">No fee records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentAttendancePage;
