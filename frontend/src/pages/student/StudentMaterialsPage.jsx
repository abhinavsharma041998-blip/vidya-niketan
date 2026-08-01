import { useState, useEffect } from 'react';
import { FileText, Download, BookOpen, ClipboardList, FileUp, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CATEGORY_META = {
  Syllabus: { icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  Notes: { icon: FileText, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  Assignment: { icon: ClipboardList, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
  Other: { icon: FileUp, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
};
const CATEGORY_ORDER = ['Syllabus', 'Notes', 'Assignment', 'Other'];

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/materials/student')
      .then(r => setMaterials(r.data.data || []))
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-gray-400 py-12">Loading...</p>;

  const grouped = CATEGORY_ORDER.map(cat => ({ cat, items: materials.filter(m => m.category === cat) })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Study Materials</h1>
        <p className="text-gray-500 text-sm">Syllabus, notes & assignments uploaded by your teachers</p>
      </div>

      {grouped.length === 0 ? (
        <div className="card p-10 text-center">
          <FolderOpen className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-gray-400 text-sm">Nothing has been uploaded for your course yet. Check back later.</p>
        </div>
      ) : (
        grouped.map(({ cat, items }) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Icon size={15} /> {cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(m => (
                  <a key={m._id} href={m.fileUrl} target="_blank" rel="noreferrer"
                    className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-400 truncate">{m.description}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.fileType?.toUpperCase()} · {m.fileSizeKB ? `${(m.fileSizeKB / 1024).toFixed(1)} MB` : ''} · {new Date(m.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <Download size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
