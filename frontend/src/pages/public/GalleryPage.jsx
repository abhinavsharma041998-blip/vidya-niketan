import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, ImageOff } from 'lucide-react';
import api from '../../utils/api';

const CATEGORIES = ['All', 'Campus', 'Events', 'Classroom', 'Convocation', 'Achievements', 'Other'];

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [activeIdx, setActiveIdx] = useState(null); // index into `filtered`

  useEffect(() => {
    api.get('/gallery').then(r => setPhotos(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (category === 'All' ? photos : photos.filter(p => p.category === category)),
    [photos, category]
  );

  const openAt = (idx) => setActiveIdx(idx);
  const close = () => setActiveIdx(null);
  const prev = () => setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
  const next = () => setActiveIdx(i => (i + 1) % filtered.length);

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, filtered.length]);

  const active = activeIdx !== null ? filtered[activeIdx] : null;

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900">
        <div className="absolute top-10 left-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-blue-200 mb-6">
            <Camera size={14} /> Photo Gallery
          </div>
          <h1 className="text-4xl sm:text-5xl font-montserrat font-black text-white mb-4">
            Moments at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200">Vidya Niketan</span>
          </h1>
          <p className="text-blue-200 max-w-xl mx-auto">A glimpse of campus life, events, and celebrations from our institute.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 lg:top-20 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === c
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-14 bg-gray-50 dark:bg-gray-900 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="mb-4 break-inside-avoid rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" style={{ height: `${180 + (i % 3) * 60}px` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center text-center text-gray-400 py-20">
              <ImageOff size={40} className="mb-3" />
              <p>No photos in this category yet. Check back soon!</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
              {filtered.map((p, idx) => (
                <button
                  key={p._id}
                  onClick={() => openAt(idx)}
                  className="mb-4 w-full break-inside-avoid block rounded-2xl overflow-hidden relative group shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <img src={p.imageUrl} alt={p.title} loading="lazy" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left">
                    <p className="text-white font-semibold text-sm">{p.title}</p>
                    <p className="text-blue-200 text-xs">{p.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={close}
          >
            <button onClick={close} className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 z-10">
              <X size={26} />
            </button>
            {filtered.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 z-10">
                  <ChevronLeft size={28} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 z-10">
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            <motion.div
              key={active._id}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            >
              <img src={active.imageUrl} alt={active.title} className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl" />
              <div className="mt-4 text-center">
                <p className="text-white font-montserrat font-semibold text-lg">{active.title}</p>
                {active.description && <p className="text-blue-200 text-sm mt-1 max-w-lg">{active.description}</p>}
                <span className="inline-block mt-2 text-xs uppercase tracking-wide text-blue-300 bg-white/10 px-3 py-1 rounded-full">{active.category}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
