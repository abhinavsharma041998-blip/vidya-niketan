import { useState, useEffect } from 'react';
import { BookOpen, CalendarCheck, CreditCard, TrendingUp, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/students/me'),
      api.get('/attendance/me'),
      api.get('/fees/me'),
    ]).then(([p, a, f]) => {
      setProfile(p.data.data);
      setAttendance(a.data.data);
      setFees(f.data);
    }).finally(() => setLoading(false));
  }, []);

  const pieData = attendance ? [
    { name: 'Present', value: attendance.summary?.present || 0, color: '#22c55e' },
    { name: 'Absent', value: attendance.summary?.absent || 0, color: '#ef4444' },
    { name: 'Late', value: attendance.summary?.late || 0, color: '#f59e0b' },
  ] : [];

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.name}!</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <BookOpen size={20} />, label: 'Course', value: profile?.course?.name || 'Not assigned', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
          { icon: <TrendingUp size={20} />, label: 'Attendance', value: `${attendance?.summary?.percentage || 0}%`, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
          { icon: <CreditCard size={20} />, label: 'Fees Paid', value: `₹${(fees?.summary?.totalPaid || 0).toLocaleString()}`, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
          { icon: <AlertCircle size={20} />, label: 'Pending', value: `₹${(fees?.summary?.totalPending || 0).toLocaleString()}`, color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CalendarCheck size={16} className="text-blue-600" /> Attendance Summary</h3>
          {attendance?.summary?.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No attendance records yet</p>
          ) : (
            <>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  <div className="text-center mb-3">
                    <span className="text-3xl font-montserrat font-black text-gray-900 dark:text-white">{attendance?.summary?.percentage}%</span>
                    <p className="text-xs text-gray-400">Overall Attendance</p>
                  </div>
                  {[
                    { label: 'Present', value: attendance?.summary?.present, color: 'text-green-500' },
                    { label: 'Absent', value: attendance?.summary?.absent, color: 'text-red-500' },
                    { label: 'Late', value: attendance?.summary?.late, color: 'text-yellow-500' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Attendance % indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Attendance</span>
                  <span className={attendance?.summary?.percentage >= 75 ? 'text-green-600' : 'text-red-600'}>{attendance?.summary?.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${attendance?.summary?.percentage >= 75 ? 'bg-green-500' : attendance?.summary?.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${attendance?.summary?.percentage || 0}%` }} />
                </div>
                {attendance?.summary?.percentage < 75 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Attendance below 75%. Please attend regularly.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Fees status */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard size={16} className="text-blue-600" /> Fee Records</h3>
          {!fees?.data?.length ? (
            <p className="text-sm text-gray-400 text-center py-10">No fee records yet</p>
          ) : (
            <div className="space-y-3">
              {fees.data.slice(0, 4).map(f => (
                <div key={f._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${f.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {f.status === 'Paid' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">₹{f.amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{f.description || f.course?.name || 'Fee'} • {format(new Date(f.createdAt), 'dd MMM yy')}</p>
                  </div>
                  <span className={`badge text-xs ${f.status === 'Paid' ? 'badge-green' : f.status === 'Partial' ? 'badge-yellow' : 'badge-red'}`}>{f.status}</span>
                </div>
              ))}
              <div className="pt-2 border-t dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Pending:</span>
                  <span className="font-bold text-red-500">₹{(fees.summary?.totalPending || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent attendance */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Attendance</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {attendance?.records?.slice(0, 7).map(r => (
                <tr key={r._id}>
                  <td>{format(new Date(r.date), 'EEEE, dd MMM yyyy')}</td>
                  <td><span className={`badge text-xs ${r.status === 'Present' ? 'badge-green' : r.status === 'Absent' ? 'badge-red' : 'badge-yellow'}`}>{r.status}</span></td>
                </tr>
              ))}
              {!attendance?.records?.length && <tr><td colSpan={2} className="text-center text-gray-400 py-6">No attendance records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
