import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  ArrowRight, BookOpen, Users, Award, Clock, Star, CheckCircle, Camera,
  GraduationCap, Laptop, Rocket, Layers, Quote, Sparkles, ShieldCheck,
  CalendarClock, Wallet, TrendingUp,
} from 'lucide-react';
import api from '../../utils/api';

// Typing animation hook
const useTyping = (words) => {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    const speed = deleting ? 60 : 120;
    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setText(current.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      } else if (!deleting && charIdx === current.length) {
        setTimeout(() => setDeleting(true), 1500);
      } else if (deleting && charIdx > 0) {
        setText(current.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      } else {
        setDeleting(false);
        setWordIdx(w => (w + 1) % words.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [text, deleting, charIdx, wordIdx, words]);

  return text;
};

const testimonials = [
  { name: 'Priya Sharma', course: 'DCA', rating: 5, text: 'Vidya Niketan transformed my career. The teachers are excellent and the course content is very practical.' },
  { name: 'Rahul Verma', course: 'PGDCA', rating: 5, text: 'Best computer institute in the area. Got placed in a good company after completing PGDCA here.' },
  { name: 'Sunita Devi', course: 'Basic Computer', rating: 5, text: 'Even as a beginner I felt comfortable learning here. Very supportive environment.' },
  { name: 'Amit Kumar', course: 'Web Development', rating: 5, text: 'The web development course is excellent. Now I am freelancing and earning well.' },
];

// One icon + soft colour per course level — used on course thumbnails and category pills.
const CATEGORY_STYLE = {
  Basic: { icon: <BookOpen size={26} />, color: '#2563eb', from: '#dbeafe', to: '#eff6ff' },
  Intermediate: { icon: <Layers size={26} />, color: '#7c3aed', from: '#ede9fe', to: '#f5f3ff' },
  Advanced: { icon: <Rocket size={26} />, color: '#dc2626', from: '#fee2e2', to: '#fef2f2' },
  Professional: { icon: <GraduationCap size={26} />, color: '#059669', from: '#d1fae5', to: '#ecfdf5' },
};
const catStyle = (cat) => CATEGORY_STYLE[cat] || CATEGORY_STYLE.Basic;

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { ref: statsRef, inView: statsVisible } = useInView({ triggerOnce: true });
  const typedText = useTyping(['DCA & PGDCA', 'Web Development', 'Tally & Accounts', 'Basic Computer']);

  useEffect(() => {
    api.get('/courses?active=true').then(r => {
      const list = r.data.data || [];
      setAllCourses(list);
      setCourses(list.slice(0, 3));
    });
    // Featured photos first; if the admin hasn't featured enough, fall back to the latest ones.
    api.get('/gallery?featured=true&limit=8').then(r => {
      const featured = r.data.data || [];
      if (featured.length >= 4) { setGalleryPhotos(featured); return; }
      api.get('/gallery?limit=8').then(r2 => setGalleryPhotos(r2.data.data || []));
    });
    const iv = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 4000);
    return () => clearInterval(iv);
  }, []);

  const stats = [
    { icon: <Users size={22} />, value: 500, suffix: '+', label: 'Students Enrolled', color: '#2563eb', bg: '#eff6ff' },
    { icon: <BookOpen size={22} />, value: 10, suffix: '+', label: 'Courses Offered', color: '#7c3aed', bg: '#f5f3ff' },
    { icon: <Award size={22} />, value: 95, suffix: '%', label: 'Success Rate', color: '#059669', bg: '#ecfdf5' },
    { icon: <Clock size={22} />, value: 8, suffix: '+', label: 'Years Experience', color: '#d97706', bg: '#fffbeb' },
  ];

  // Unique categories actually offered right now, in a sensible display order.
  const categoryOrder = ['Basic', 'Intermediate', 'Advanced', 'Professional'];
  const categoriesPresent = categoryOrder
    .map(cat => ({ cat, count: allCourses.filter(c => c.category === cat).length }))
    .filter(c => c.count > 0);

  const heroImage = galleryPhotos[0];

  return (
    <div className="overflow-hidden">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-950 dark:to-blue-950/40 overflow-hidden">
        {/* Soft decorative blobs — light, not the heavy dark-navy look */}
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/30 dark:bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 shadow-sm border border-blue-100 dark:border-blue-900/40 rounded-full px-4 py-2 text-sm text-blue-700 dark:text-blue-300 mb-6 animate-fade-in">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Admissions Open for 2026
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-montserrat font-black text-gray-900 dark:text-white mb-5 leading-[1.1] animate-fade-up">
                Shape Your Future<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">with Vidya Niketan</span>
              </h1>

              <div className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 font-medium animate-fade-up" style={{ animationDelay: '0.15s' }}>
                Expert courses in <span className="text-blue-700 dark:text-blue-400 font-bold typing-cursor">{typedText}</span>
              </div>

              <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg mb-8 animate-fade-up" style={{ animationDelay: '0.25s' }}>
                Join thousands of students who transformed their careers with our industry-focused computer education programs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-up" style={{ animationDelay: '0.35s' }}>
                <Link to="/courses" className="inline-flex items-center justify-center gap-2 btn-primary text-base py-3.5 px-8">
                  Explore Courses <ArrowRight size={18} />
                </Link>
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 font-semibold py-3.5 px-8 rounded-xl transition-colors">
                  Enquire Now
                </Link>
              </div>

              {/* Quick stat chips — like a template's trust-bar */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 animate-fade-up" style={{ animationDelay: '0.45s' }}>
                {stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <div className="font-montserrat font-black text-lg text-gray-900 dark:text-white leading-none">{s.value}{s.suffix}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual */}
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700">
                {heroImage ? (
                  <img src={heroImage.imageUrl} alt={heroImage.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)', backgroundSize: '28px 28px' }} />
                    <GraduationCap size={120} className="text-white/25" strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Floating badge — bottom-left, overlapping the image */}
              <div className="absolute -bottom-6 -left-6 sm:-left-10 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 pr-6 flex items-center gap-3 border border-gray-100 dark:border-gray-800">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <div className="font-montserrat font-black text-gray-900 dark:text-white leading-none">
                    {statsVisible ? <CountUp end={500} duration={2} suffix="+" /> : '0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Happy Students</div>
                </div>
              </div>

              {/* Floating badge — top-right */}
              <div className="absolute -top-5 -right-4 sm:-right-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 border border-gray-100 dark:border-gray-800">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">95% Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ Feature strip ══════════════ */}
      <section className="relative -mt-1 py-14 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <GraduationCap size={22} />, title: 'Expert Faculty', desc: 'Real industry experience', color: '#2563eb', bg: '#eff6ff' },
              { icon: <Laptop size={22} />, title: 'Practical Training', desc: 'Hands-on lab sessions', color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <CalendarClock size={22} />, title: 'Flexible Batches', desc: 'Morning to evening slots', color: '#059669', bg: '#ecfdf5' },
              { icon: <Award size={22} />, title: 'Certification', desc: 'Recognised by employers', color: '#d97706', bg: '#fffbeb' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <div>
                  <p className="font-montserrat font-bold text-sm text-gray-900 dark:text-white">{f.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ Gallery Carousel — right below the hero area, first thing visitors see ══════════════ */}
      {galleryPhotos.length > 0 && (
        <section className="pt-14 pb-6 sm:pt-16 sm:pb-8 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2"><Camera size={14} /> Campus Life</p>
                <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white">Photo Gallery</h2>
              </div>
              <Link to="/gallery" className="hidden sm:flex items-center gap-1 text-blue-600 font-medium text-sm hover:gap-2 transition-all">
                View All <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-white dark:from-gray-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-white dark:from-gray-950 to-transparent" />

            <div className="flex w-max gap-5 animate-scroll-x hover:[animation-play-state:paused] px-4 sm:px-6">
              {[...galleryPhotos, ...galleryPhotos].map((p, idx) => (
                <Link
                  key={`${p._id}-${idx}`}
                  to="/gallery"
                  className="relative flex-shrink-0 w-64 sm:w-80 h-80 sm:h-96 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl group transition-all duration-500 hover:-translate-y-2"
                >
                  <img src={p.imageUrl} alt={p.title} loading="lazy" draggable={false}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-blue-200 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">{p.category}</span>
                    <p className="text-white font-montserrat font-bold text-lg leading-snug drop-shadow">{p.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-8 sm:hidden px-4">
            <Link to="/gallery" className="btn-secondary text-sm">View Full Gallery</Link>
          </div>
        </section>
      )}

      {/* ══════════════ Stats (detailed) ══════════════ */}
      <section ref={statsRef} className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
                <div className="text-3xl lg:text-4xl font-montserrat font-black text-gray-900 dark:text-white">
                  {statsVisible ? <CountUp end={stat.value} duration={2} suffix={stat.suffix} /> : '0'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ Popular Categories ══════════════ */}
      {categoriesPresent.length > 0 && (
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Find By Category</p>
            <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white mb-10">Popular Course Categories</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {categoriesPresent.map(({ cat, count }) => {
                const s = catStyle(cat);
                return (
                  <Link key={cat} to="/courses" className="group flex items-center gap-3 bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg rounded-2xl px-5 py-4 transition-all duration-300">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.from, color: s.color }}>{s.icon}</div>
                    <div className="text-left">
                      <p className="font-montserrat font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{cat}</p>
                      <p className="text-xs text-gray-400">{count} course{count !== 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ Why Choose Us ══════════════ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white">The Vidya Niketan Advantage</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <GraduationCap size={24} />, title: 'Expert Faculty', desc: 'Learn from experienced professionals with real industry knowledge and hands-on teaching methods.', color: '#2563eb', bg: '#eff6ff' },
              { icon: <Laptop size={24} />, title: 'Practical Training', desc: 'Hands-on lab sessions with modern computers and latest software tools for real-world readiness.', color: '#7c3aed', bg: '#f5f3ff' },
              { icon: <Award size={24} />, title: 'Recognized Certification', desc: 'Earn certificates that are recognized by employers and open doors to better opportunities.', color: '#059669', bg: '#ecfdf5' },
              { icon: <CalendarClock size={24} />, title: 'Flexible Batches', desc: 'Morning, afternoon, and evening batches to fit your schedule. Learn at your own pace.', color: '#d97706', bg: '#fffbeb' },
              { icon: <Wallet size={24} />, title: 'Affordable Fees', desc: 'Quality education at the most competitive prices. EMI options available for all courses.', color: '#db2777', bg: '#fdf2f8' },
              { icon: <TrendingUp size={24} />, title: 'Career Support', desc: 'Resume building, interview preparation, and job placement assistance for all students.', color: '#0891b2', bg: '#ecfeff' },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <h3 className="font-montserrat font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ Featured Courses ══════════════ */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Our Programs</p>
              <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white">Popular Courses</h2>
            </div>
            <Link to="/courses" className="hidden sm:flex items-center gap-1 text-blue-600 font-medium text-sm hover:gap-2 transition-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map(course => {
              const s = catStyle(course.category);
              return (
                <div key={course._id} className="card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                  <div className="h-36 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
                    <div className="w-16 h-16 rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center" style={{ color: s.color }}>{s.icon}</div>
                    <span className="absolute top-3 left-3 badge text-xs bg-white/90 dark:bg-gray-900/80" style={{ color: s.color }}>{course.category}</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-montserrat font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">{course.name}</h3>
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg flex-shrink-0 ml-2">₹{course.fees?.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5">
                      <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                      {course.enrolledCount > 0 && <span className="flex items-center gap-1"><Users size={12} /> {course.enrolledCount}+ enrolled</span>}
                    </div>
                    <Link to="/contact" className="btn-primary text-sm py-2 px-4 w-full text-center block">
                      Enroll Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link to="/courses" className="btn-secondary text-sm">View All Courses</Link>
          </div>
        </div>
      </section>

      {/* ══════════════ Testimonials ══════════════ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Testimonials</p>
            <h2 className="text-3xl font-montserrat font-bold text-gray-900 dark:text-white">What Our Students Say</h2>
          </div>

          <div className="relative">
            <div className="bg-white dark:bg-gray-950 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-10 grid sm:grid-cols-[auto,1fr] gap-6 items-start">
              <div className="flex sm:flex-col items-center gap-3 sm:gap-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-montserrat font-black text-xl flex-shrink-0">
                  {testimonials[testimonialIdx].name.split(' ').map(w => w[0]).join('')}
                </div>
                <Quote size={22} className="text-blue-200 dark:text-blue-900 sm:mt-2" />
              </div>
              <div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonials[testimonialIdx].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-200 text-lg italic leading-relaxed mb-5">"{testimonials[testimonialIdx].text}"</p>
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold">{testimonials[testimonialIdx].name}</p>
                  <p className="text-gray-400 text-sm">{testimonials[testimonialIdx].course} Graduate</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === testimonialIdx ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="mx-auto text-blue-500 mb-4" size={28} />
          <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Join thousands of successful students. Take the first step today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="btn-primary text-base py-3.5 px-8 inline-flex items-center gap-2">
              Browse Courses <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-secondary text-base py-3.5 px-8">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
