import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Search, Newspaper, Globe, GraduationCap,
  Flag, Cpu, Trophy, BookOpen, Clock, ExternalLink,
  ChevronRight, Wifi, WifiOff, Briefcase, MapPin, Facebook, Twitter, Youtube,
} from 'lucide-react';

const API_KEY = 'pub_0fd50c7840c94548abfbef1fb5433d2f';
const BASE_URL = 'https://newsdata.io/api/1/news';

const STATES = [
  'All India', 'Himachal Pradesh', 'Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh',
  'Uttarakhand', 'Rajasthan', 'Jammu and Kashmir', 'Chandigarh', 'Madhya Pradesh',
  'Bihar', 'Maharashtra', 'Gujarat', 'West Bengal',
];

// One restrained accent colour per section — used sparingly for tags, not backgrounds.
const CATEGORIES = [
  { id: 'all', label: 'Current Affairs', icon: <Newspaper size={13} />, query: 'India current affairs news today', tag: '#1d4ed8' },
  { id: 'govt-jobs', label: 'Govt Recruitment', icon: <Briefcase size={13} />, query: '', tag: '#9a3412', isJobs: true },
  { id: 'education', label: 'Education', icon: <GraduationCap size={13} />, query: 'education India', tag: '#0f766e' },
  { id: 'exam', label: 'Exams', icon: <BookOpen size={13} />, query: 'UPSC SSC exam 2026', tag: '#7c3aed' },
  { id: 'national', label: 'National', icon: <Flag size={13} />, query: 'India national', tag: '#b91c1c' },
  { id: 'international', label: 'World', icon: <Globe size={13} />, query: 'world international', tag: '#1e293b' },
  { id: 'technology', label: 'Technology', icon: <Cpu size={13} />, query: 'technology AI India', tag: '#0369a1' },
  { id: 'sports', label: 'Sports', icon: <Trophy size={13} />, query: 'India sports cricket', tag: '#15803d' },
];

const govtJobsQuery = (state) => state === 'All India'
  ? 'India government job recruitment vacancy sarkari naukri eligibility qualification'
  : `${state} government job recruitment vacancy eligibility qualification`;

const SAMPLE_NEWS = [
  { article_id: '1', title: 'Customer Engagement Marketing: A New Strategy for Institutes', description: 'A look at how education centres are rethinking outreach for the year ahead, with a focus on community and word-of-mouth.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Education Times', category: ['education'] },
  { article_id: '2', title: 'SSC CGL 2026: Registration Begins, Thousands of Vacancies Available', description: 'Staff Selection Commission has opened applications for the Combined Graduate Level examination across government departments.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Govt Jobs Portal', category: ['education'] },
  { article_id: '3', title: 'India GDP Growth Forecast Revised Upward for FY2025-26', description: 'Latest projections cite strong domestic demand and a robust manufacturing sector as key drivers of growth.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Economic Times', category: ['national'] },
  { article_id: '4', title: 'New Curriculum Guidelines: Key Changes Schools Should Know', description: 'The education ministry has announced updates with a focus on skills and critical thinking in the classroom.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Hindustan Times', category: ['education'] },
  { article_id: '5', title: 'Digital Literacy Push: What It Means for Small Institutes', description: 'A new initiative aims to widen access to basic computer training in tier-2 and tier-3 towns.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Indian Express', category: ['technology'] },
];

const SAMPLE_JOBS = [
  { article_id: 'j1', title: 'HPSSC Hamirpur Recruitment 2026: Multiple Posts, 10+2 & Graduate Eligible', description: 'Himachal Pradesh Staff Selection Commission has invited applications for various posts; minimum qualification ranges from 10+2 to graduate depending on the post. Check the official notification for exact eligibility.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'HP Rojgar Samachar', category: ['govt-jobs'] },
  { article_id: 'j2', title: 'SSC, Railways & Banking: Latest All-India Government Vacancies This Week', description: 'A roundup of newly announced central recruitment drives across SSC, Indian Railways and public sector banks, with post-wise qualification requirements.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Sarkari Naukri Update', category: ['govt-jobs'] },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const PlaceholderImg = ({ category, title }) => {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const initials = title?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'VN';
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${cat.tag}14, ${cat.tag}05)` }}>
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, ${cat.tag} 1px, transparent 0)`, backgroundSize: '18px 18px' }} />
      <span className="font-playfair font-bold text-4xl z-10" style={{ color: cat.tag }}>{initials}</span>
    </div>
  );
};

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedState, setSelectedState] = useState('Himachal Pradesh');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [online, setOnline] = useState(true);
  const [featured, setFeatured] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const fetchNews = useCallback(async (catId = activeCategory, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setOnline(true);

    const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
    const queryText = cat.isJobs ? govtJobsQuery(selectedState) : cat.query;

    try {
      const params = new URLSearchParams({
        apikey: API_KEY,
        q: queryText,
        language: 'en',
        country: catId === 'international' ? '' : 'in',
        size: '10',
      });
      if (catId === 'international') params.delete('country');

      const res = await fetch(`${BASE_URL}?${params}`);
      const data = await res.json();

      if (data.status === 'success' && data.results?.length > 0) {
        const articles = data.results.filter(a => a.title && a.title !== '[Removed]');
        setNews(articles);
        setFeatured(articles[0]);
        setLastUpdated(new Date());
      } else {
        const fallback = cat.isJobs ? SAMPLE_JOBS : SAMPLE_NEWS;
        setNews(fallback);
        setFeatured(fallback[0]);
      }
    } catch {
      setOnline(false);
      const fallback = cat.isJobs ? SAMPLE_JOBS : SAMPLE_NEWS;
      setNews(fallback);
      setFeatured(fallback[0]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, selectedState]);

  useEffect(() => { fetchNews(activeCategory); }, [activeCategory, selectedState]);

  useEffect(() => {
    const iv = setInterval(() => fetchNews(activeCategory, true), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [activeCategory, fetchNews]);

  const filtered = news.filter(n =>
    !searchQuery || n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || n.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rest = filtered.slice(1);
  const editorsPicks = filtered.slice(1, 6);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Utility bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-gray-500">
          <Link to="/" className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
            <ArrowLeft size={12} /> Vidya Niketan Home
          </Link>
          <div className="hidden sm:flex items-center gap-1.5">
            {online ? <Wifi size={11} className="text-emerald-600" /> : <WifiOff size={11} className="text-red-500" />}
            <span>{lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : today}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchNews(activeCategory, true)} disabled={refreshing}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <span className="hidden sm:flex items-center gap-2 text-gray-300">
              <Facebook size={12} className="hover:text-gray-600 cursor-pointer" />
              <Twitter size={12} className="hover:text-gray-600 cursor-pointer" />
              <Youtube size={12} className="hover:text-gray-600 cursor-pointer" />
            </span>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 text-center border-b border-gray-100">
        <Link to="/news" className="inline-block">
          <h1 className="font-playfair font-black text-4xl sm:text-5xl tracking-tight text-gray-900">Vidya Niketan Times</h1>
        </Link>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 tracking-[0.2em] uppercase">Current Affairs · Exams · Government Recruitment</p>
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${activeCategory === cat.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSearch(s => !s)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0">
            <Search size={16} />
          </button>
        </div>

        {showSearch && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search headlines..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
          </div>
        )}

        {/* State filter — only for Govt Recruitment */}
        {activeCategory === 'govt-jobs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-1.5 flex-wrap border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1 text-gray-400 text-xs mr-1"><MapPin size={11} /> State:</span>
            {STATES.map(s => (
              <button key={s} onClick={() => setSelectedState(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedState === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {activeCategory === 'govt-jobs' && !loading && (
          <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 mb-8 text-xs text-amber-800">
            <Briefcase size={13} className="mt-0.5 flex-shrink-0" />
            <span>Showing recruitment news for <strong>{selectedState}</strong>. Qualification & eligibility come from the article snippet — always confirm exact criteria on the official notification before applying.</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <Newspaper size={40} className="mx-auto mb-4" />
            <p className="text-lg text-gray-500">No news found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Main column */}
            <div className="lg:col-span-2">
              {/* Featured story */}
              {featured && !searchQuery && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-5 mb-10 pb-10 border-b border-gray-100">
                  <a href={featured.link} target="_blank" rel="noopener noreferrer"
                    className="sm:col-span-3 block aspect-[4/3] rounded-md overflow-hidden bg-gray-100 group relative">
                    {featured.image_url && !imgErrors[featured.article_id] ? (
                      <img src={featured.image_url} alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImgErrors(p => ({ ...p, [featured.article_id]: true }))} />
                    ) : (
                      <PlaceholderImg category={activeCategory} title={featured.title} />
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded" style={{ background: activeCat.tag }}>
                      {activeCat.label}
                    </span>
                  </a>
                  <a href={featured.link} target="_blank" rel="noopener noreferrer" className="sm:col-span-2 flex flex-col justify-center group">
                    <h2 className="font-playfair font-bold text-2xl sm:text-[28px] leading-[1.15] text-gray-900 group-hover:text-gray-600 transition-colors mb-3">
                      {featured.title}
                    </h2>
                    <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{featured.source_name} · {timeAgo(featured.pubDate)}</p>
                    {featured.description && <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{featured.description}</p>}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 mt-4 group-hover:gap-2 transition-all">
                      Read full story <ChevronRight size={13} />
                    </span>
                  </a>
                </div>
              )}

              {/* Article grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                {(searchQuery ? filtered : rest).slice(0, searchQuery ? 20 : 6).map((article, i) => {
                  const cat = CATEGORIES.find(c => article.category?.includes(c.id)) || activeCat;
                  return (
                    <a key={article.article_id || i} href={article.link} target="_blank" rel="noopener noreferrer" className="group flex flex-col">
                      <div className="aspect-[16/10] rounded-md overflow-hidden bg-gray-100 mb-3 relative">
                        {article.image_url && !imgErrors[article.article_id] ? (
                          <img src={article.image_url} alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgErrors(p => ({ ...p, [article.article_id]: true }))} />
                        ) : (
                          <PlaceholderImg category={activeCategory} title={article.title} />
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow">
                            <ExternalLink size={11} className="text-gray-700" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: cat.tag }}>{activeCat.label}</span>
                      <h3 className="font-playfair font-bold text-base leading-snug text-gray-900 group-hover:text-gray-600 transition-colors mb-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-auto flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(article.pubDate)} · {article.source_name || 'News Source'}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:border-l lg:border-gray-100 lg:pl-8">
              <h4 className="font-playfair font-bold text-lg text-gray-900 pb-3 mb-5 border-b-2 border-gray-900 inline-block">Editor's Picks</h4>
              <div className="space-y-5">
                {editorsPicks.map((article, i) => (
                  <a key={article.article_id || i} href={article.link} target="_blank" rel="noopener noreferrer"
                    className="flex gap-3 group items-start">
                    <span className="font-playfair font-black text-2xl text-gray-200 leading-none flex-shrink-0 w-6">{i + 1}</span>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      {article.image_url && !imgErrors[`side-${article.article_id}`] ? (
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover"
                          onError={() => setImgErrors(p => ({ ...p, [`side-${article.article_id}`]: true }))} />
                      ) : (
                        <PlaceholderImg category={activeCategory} title={article.title} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-gray-500 transition-colors">{article.title}</h5>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(article.pubDate)}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Govt jobs quick-link box */}
              {activeCategory !== 'govt-jobs' && (
                <button onClick={() => setActiveCategory('govt-jobs')}
                  className="w-full mt-8 text-left border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Briefcase size={14} style={{ color: '#9a3412' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9a3412' }}>Govt Recruitment</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-gray-600">Himachal &amp; All-India government job alerts →</p>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-gray-400">
          <p>News aggregated via NewsData.io · Refreshes automatically every 5 minutes</p>
          <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors mt-1 inline-block">← Back to Vidya Niketan Home</Link>
        </div>
      </div>
    </div>
  );
}
