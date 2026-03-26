import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, BookOpen, Filter } from 'lucide-react';
import api from '../../utils/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses?active=true').then(r => {
      setCourses(r.data.data || []);
      setFiltered(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = courses;
    if (category !== 'All') result = result.filter(c => c.category === category);
    if (search) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [search, category, courses]);

  const categories = ['All', 'Basic', 'Intermediate', 'Advanced', 'Professional'];
  const categoryColors = { Basic: 'badge-green', Intermediate: 'badge-yellow', Advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', Professional: 'badge-blue' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-16 mb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-montserrat font-black mb-3">Our Courses</h1>
          <p className="text-blue-200 text-lg">Industry-focused programs designed for your success</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input className="input-field pl-10" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${category === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-gray-200 dark:bg-gray-800" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <div key={course._id} className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`badge text-xs ${categoryColors[course.category] || 'badge-blue'}`}>{course.category}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xl">₹{course.fees?.toLocaleString()}</span>
                  </div>
                  <h3 className="font-montserrat font-bold text-gray-900 dark:text-white text-xl mb-2">{course.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 leading-relaxed">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {course.syllabusTopics?.length || 0} Topics</span>
                  </div>
                  {course.syllabusTopics?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Key Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {course.syllabusTopics.slice(0, 4).map(t => (
                          <span key={t} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">{t}</span>
                        ))}
                        {course.syllabusTopics.length > 4 && <span className="text-xs text-gray-400">+{course.syllabusTopics.length - 4} more</span>}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link to="/contact" className="flex-1 btn-primary text-sm py-2.5 text-center">Enroll Now</Link>
                    <Link to="/contact" className="btn-secondary text-sm py-2.5 px-4">Query</Link>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No courses found. Try a different search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
