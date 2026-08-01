import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileUp, FileText, BookOpen, ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const CATEGORY_ICON = { Syllabus: BookOpen, Notes: FileText, Assignment: ClipboardList, Other: FileUp };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/materials/mine').then(r => setMaterials(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const counts = materials.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {user?.course?.name ? `You're assigned to ${user.course.name}` : 'You can upload materials for any course'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['Syllabus', 'Notes', 'Assignment', 'Other'].map(cat => {
          const Icon = CATEGORY_ICON[cat];
          return (
            <div key={cat} className="card p-4">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                <Icon size={16} />
              </div>
              <p className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">{loading ? '—' : (counts[cat] || 0)}</p>
              <p className="text-xs text-gray-400">{cat}</p>
            </div>
          );
        })}
      </div>

      <Link to="/teacher/materials" className="btn-primary inline-flex items-center gap-2 text-sm !bg-gradient-to-r !from-purple-600 !to-indigo-700">
        <FileUp size={16} /> Upload a Material
      </Link>
    </div>
  );
}
