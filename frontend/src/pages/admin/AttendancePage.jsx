import { useState, useEffect } from 'react';
import { CalendarCheck, Save, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState('mark');
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => { api.get('/students?status=Active').then(r => { const s = r.data.data || []; setStudents(s); const init = {}; s.forEach(st => { init[st._id] = 'Present'; }); setAttendance(init); }); }, []);

  const fetchRecords = () => { api.get(`/attendance?date=${filterDate}`).then(r => setRecords(r.data.data || [])); };
  useEffect(() => { if (tab === 'view') fetchRecords(); }, [tab, filterDate]);

  const handleSave = async () => {
    setSaving(true);
    const recordsArr = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'Present' }));
    try {
      await api.post('/attendance', { records: recordsArr, date });
      toast.success(`Attendance marked! SMS/WhatsApp sent to absent students.`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const statusColors = { Present: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', Late: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Holiday: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Attendance</h1>
        <p className="text-gray-500 text-sm">Mark and track student attendance</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('mark')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'mark' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>Mark Attendance</button>
        <button onClick={() => setTab('view')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'view' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>View Records</button>
      </div>

      {tab === 'mark' ? (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Select Date</label>
              <input type="date" className="input-field" value={date} max={format(new Date(), 'yyyy-MM-dd')} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">{students.length} active students</div>
            <button onClick={handleSave} disabled={saving || !students.length} className="btn-primary ml-auto flex items-center gap-2 text-sm">
              {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
              {saving ? 'Saving & Notifying...' : 'Save Attendance'}
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-gray-800 flex gap-2 text-sm">
              {['Present', 'Absent', 'Late', 'Holiday'].map(s => (
                <button key={s} onClick={() => { const all = {}; students.forEach(st => { all[st._id] = s; }); setAttendance(all); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[s]}`}>
                  All {s}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Student</th><th>ID</th><th>Course</th><th>Status</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{s.name[0]}</div>
                          <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{s.studentId}</td>
                      <td className="text-xs text-gray-500">{s.course?.name || '—'}</td>
                      <td>
                        <div className="flex gap-1.5">
                          {['Present', 'Absent', 'Late', 'Holiday'].map(status => (
                            <button key={status} onClick={() => setAttendance(a => ({ ...a, [s._id]: status }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${attendance[s._id] === status ? statusColors[status] : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!students.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No active students found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Date</label><input type="date" className="input-field" value={filterDate} onChange={e => setFilterDate(e.target.value)} /></div>
            <button onClick={fetchRecords} className="btn-primary text-sm mt-4 flex items-center gap-2"><Filter size={14} /> Filter</button>
          </div>
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-gray-800">
              <div className="flex gap-4 text-sm">
                {['Present', 'Absent', 'Late'].map(s => (
                  <span key={s} className={`font-medium ${s === 'Present' ? 'text-green-600' : s === 'Absent' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {s}: {records.filter(r => r.status === s).length}
                  </span>
                ))}
              </div>
            </div>
            <table className="data-table">
              <thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td className="font-medium">{r.student?.name}</td>
                    <td className="text-xs text-gray-400">{r.course?.name || '—'}</td>
                    <td><span className={`badge text-xs ${r.status === 'Present' ? 'badge-green' : r.status === 'Absent' ? 'badge-red' : 'badge-yellow'}`}>{r.status}</span></td>
                    <td className="text-xs text-gray-400">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
                {!records.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No records for this date</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
