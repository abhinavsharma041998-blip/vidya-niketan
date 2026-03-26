import { useState, useEffect } from 'react';
import { Users, BookOpen, MessageSquare, TrendingUp, IndianRupee, UserCheck, UserX, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import { format } from 'date-fns';

const StatCard = ({ icon, label, value, sub, color, loading }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      {loading ? <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" /> :
        <p className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>}
      {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const { stats, todayAttendance, recentStudents, recentQueries } = data || {};

  const attendancePieData = todayAttendance ? [
    { name: 'Present', value: todayAttendance.Present || 0, color: '#22c55e' },
    { name: 'Absent', value: todayAttendance.Absent || 0, color: '#ef4444' },
    { name: 'Late', value: todayAttendance.Late || 0, color: '#f59e0b' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={loading} icon={<Users className="w-6 h-6 text-white" />} label="Total Students" value={stats?.totalStudents || 0} sub={`${stats?.activeStudents || 0} active`} color="bg-blue-500" />
        <StatCard loading={loading} icon={<BookOpen className="w-6 h-6 text-white" />} label="Courses" value={stats?.totalCourses || 0} sub="Active courses" color="bg-purple-500" />
        <StatCard loading={loading} icon={<IndianRupee className="w-6 h-6 text-white" />} label="Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} sub={`₹${(stats?.pendingFees || 0).toLocaleString()} pending`} color="bg-emerald-500" />
        <StatCard loading={loading} icon={<MessageSquare className="w-6 h-6 text-white" />} label="Queries" value={stats?.totalQueries || 0} sub={`${stats?.newQueries || 0} new`} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-600" /> Today's Attendance
          </h3>
          {attendancePieData.every(d => d.value === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">No attendance marked today</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {attendancePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-2">
                {attendancePieData.map(d => (
                  <div key={d.name} className="text-center">
                    <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: d.color }} />
                    <p className="text-xs text-gray-400">{d.name}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{d.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Students */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> Recent Students
          </h3>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {recentStudents?.slice(0, 5).map(s => (
                <div key={s._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.course?.name || 'No course'} • {s.studentId}</p>
                  </div>
                  <span className={`badge text-xs ${s.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{s.status}</span>
                </div>
              ))}
              {!recentStudents?.length && <p className="text-sm text-gray-400 text-center py-4">No students yet</p>}
            </div>
          )}
        </div>
      </div>

      {/* Recent Queries */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600" /> Recent Queries
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Course</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentQueries?.map(q => (
                <tr key={q._id}>
                  <td className="font-medium">{q.name}</td>
                  <td>{q.phone}</td>
                  <td>{q.course || '-'}</td>
                  <td><span className={`badge text-xs ${q.status === 'New' ? 'badge-blue' : q.status === 'Enrolled' ? 'badge-green' : 'badge-yellow'}`}>{q.status}</span></td>
                  <td>{format(new Date(q.createdAt), 'dd MMM yyyy')}</td>
                </tr>
              ))}
              {!recentQueries?.length && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No queries yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
