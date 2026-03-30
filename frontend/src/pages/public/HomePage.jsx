import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { ArrowRight, BookOpen, Users, Award, Clock, Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
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

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { ref: statsRef, inView: statsVisible } = useInView({ triggerOnce: true });
  const typedText = useTyping(['DCA & PGDCA', 'Web Development', 'Tally & Accounts', 'Basic Computer']);

  useEffect(() => {
    api.get('/courses?active=true').then(r => setCourses(r.data.data?.slice(0, 3) || []));
    const iv = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 4000);
    return () => clearInterval(iv);
  }, []);

  const stats = [
    { icon: <Users className="w-8 h-8" />, value: 500, suffix: '+', label: 'Students Enrolled', color: 'text-blue-500' },
    { icon: <BookOpen className="w-8 h-8" />, value: 10, suffix: '+', label: 'Courses Offered', color: 'text-purple-500' },
    { icon: <Award className="w-8 h-8" />, value: 95, suffix: '%', label: 'Success Rate', color: 'text-green-500' },
    { icon: <Clock className="w-8 h-8" />, value: 8, suffix: '+', label: 'Years Experience', color: 'text-orange-500' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-blue-200 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Admissions Open for 2026
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-montserrat font-black text-white mb-6 leading-tight animate-fade-up">
            Shape Your Future<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200">
              with Vidya Niketan
            </span>
          </h1>

          <div className="text-xl sm:text-2xl text-blue-200 mb-4 font-medium animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Expert courses in{' '}
            <span className="text-white font-bold typing-cursor">{typedText}</span>
          </div>

          <p className="text-base sm:text-lg text-blue-300 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Join thousands of students who transformed their careers with our industry-focused computer education programs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/courses" className="inline-flex items-center gap-2 btn-primary text-base py-3.5 px-8">
              Explore Courses <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 backdrop-blur-sm hover:bg-white/10">
              Enquire Now
            </Link>
          </div>

          {/* Quick stats row */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            {['500+ Students', '10+ Courses', '95% Success Rate', '8+ Years'].map(s => (
              <div key={s} className="text-blue-200 text-sm font-medium flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" /> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="fill-white dark:fill-gray-950 w-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className={`${stat.color} flex justify-center mb-3`}>{stat.icon}</div>
                <div className="text-3xl lg:text-4xl font-montserrat font-black text-gray-900 dark:text-white">
                  {statsVisible ? <CountUp end={stat.value} duration={2} suffix={stat.suffix} /> : '0'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white">The Vidya Niketan Advantage</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🎓', title: 'Expert Faculty', desc: 'Learn from experienced professionals with real industry knowledge and hands-on teaching methods.' },
              { icon: '💻', title: 'Practical Training', desc: 'Hands-on lab sessions with modern computers and latest software tools for real-world readiness.' },
              { icon: '📜', title: 'Recognized Certification', desc: 'Earn certificates that are recognized by employers and open doors to better opportunities.' },
              { icon: '📅', title: 'Flexible Batches', desc: 'Morning, afternoon, and evening batches to fit your schedule. Learn at your own pace.' },
              { icon: '💰', title: 'Affordable Fees', desc: 'Quality education at the most competitive prices. EMI options available for all courses.' },
              { icon: '🚀', title: 'Career Support', desc: 'Resume building, interview preparation, and job placement assistance for all students.' },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-montserrat font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
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
            {courses.map(course => (
              <div key={course._id} className="card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge text-xs ${
                      course.category === 'Professional' ? 'badge-blue' :
                      course.category === 'Advanced' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                      'badge-green'
                    }`}>{course.category}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">₹{course.fees?.toLocaleString()}</span>
                  </div>
                  <h3 className="font-montserrat font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 transition-colors">{course.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5">
                    <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                  </div>
                  <Link to="/contact" className="btn-primary text-sm py-2 px-4 w-full text-center block">
                    Enroll Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link to="/courses" className="btn-secondary text-sm">View All Courses</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-blue-950 to-indigo-950 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-300 font-semibold text-sm uppercase tracking-widest mb-2">Testimonials</p>
          <h2 className="text-3xl font-montserrat font-bold text-white mb-12">What Our Students Say</h2>

          <div className="relative">
            <div className="glass rounded-2xl p-8 md:p-10">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(testimonials[testimonialIdx].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-blue-100 text-lg italic mb-6 leading-relaxed">"{testimonials[testimonialIdx].text}"</p>
              <div>
                <p className="text-white font-semibold">{testimonials[testimonialIdx].name}</p>
                <p className="text-blue-300 text-sm">{testimonials[testimonialIdx].course} Graduate</p>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? 'w-6 bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-montserrat font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Join thousands of successful students. Take the first step today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="btn-primary text-base py-3.5 px-8 inline-flex items-center gap-2">
              Browse Courses <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-secondary text-base py-3.5 px-8">Contact Us</Link>
<Link to="/news" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-base py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5">📰 Live News</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
