import { useState, useEffect } from 'react';
import { Trash2, Eye, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function QueriesPage() {
  const [queries, setQueries] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    const url = filter === 'All' ? '/queries' : `/queries?status=${filter}`;
    api.get(url).then(r => setQueries(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [filter]);

  const updateStatus = async (id, status) => {
    try { await api.put(`/queries/${id}`, { status }); toast.success('Status updated'); fetch(); if (selected?._id === id) setSelected(s => ({ ...s, status })); }
    catch { toast.error('Failed'); }
  };

  const deleteQuery = async (id) => {
    if (!confirm('Delete this query?')) return;
    try { await api.delete(`/queries/${id}`); toast.success('Deleted'); fetch(); setSelected(null); }
    catch { toast.error('Failed'); }
  };

  const statusColors = { New: 'badge-blue', Contacted: 'badge-yellow', Enrolled: 'badge-green', Closed: 'badge-red' };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Student Queries</h1>
        <p className="text-gray-500 text-sm">{queries.length} queries</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['All', 'New', 'Contacted', 'Enrolled', 'Closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>{s}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Course</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td></tr>) :
                queries.map(q => (
                  <tr key={q._id}>
                    <td className="font-medium">{q.name}</td>
                    <td>{q.phone}</td>
                    <td className="text-gray-400 text-xs">{q.email || '—'}</td>
                    <td>{q.course || '—'}</td>
                    <td>
                      <select value={q.status} onChange={e => updateStatus(q._id, e.target.value)} className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {['New', 'Contacted', 'Enrolled', 'Closed'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-xs text-gray-400">{format(new Date(q.createdAt), 'dd MMM yy')}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelected(q)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye size={14} /></button>
                        <button onClick={() => deleteQuery(q._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
              {!loading && queries.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">No queries found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Query Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Name</p><p className="font-semibold text-gray-900 dark:text-white">{selected.name}</p></div>
                <div><p className="text-gray-400 text-xs">Phone</p><p className="font-semibold text-gray-900 dark:text-white">{selected.phone}</p></div>
                <div><p className="text-gray-400 text-xs">Email</p><p className="text-gray-700 dark:text-gray-300">{selected.email || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Course</p><p className="text-gray-700 dark:text-gray-300">{selected.course || '—'}</p></div>
                <div className="col-span-2"><p className="text-gray-400 text-xs mb-1">Message</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">{selected.message}</p></div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => deleteQuery(selected._id)} className="btn-danger text-sm">Delete</button>
                <button onClick={() => setSelected(null)} className="btn-secondary text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
