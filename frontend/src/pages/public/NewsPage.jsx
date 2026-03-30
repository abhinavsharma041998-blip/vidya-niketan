import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Search, Newspaper, Globe, GraduationCap,
  Flag, Cpu, Trophy, BookOpen, Clock, ExternalLink, TrendingUp,
  Zap, ChevronRight, Wifi, WifiOff
} from 'lucide-react';

const API_KEY = 'pub_0fd50c7840c94548abfbef1fb5433d2f';
const BASE_URL = 'https://newsdata.io/api/1/news';

const CATEGORIES = [
  { id: 'all',         label: 'Top Stories',    icon: <TrendingUp size={16}/>,   query: 'India',              color: '#f97316', bg: 'from-orange-500 to-red-500' },
  { id: 'education',  label: 'Education',       icon: <GraduationCap size={16}/>, query: 'education India',   color: '#3b82f6', bg: 'from-blue-500 to-indigo-600' },
  { id: 'national',   label: 'National',        icon: <Flag size={16}/>,          query: 'India national',    color: '#10b981', bg: 'from-emerald-500 to-teal-600' },
  { id: 'international', label: 'International', icon: <Globe size={16}/>,        query: 'world international', color: '#8b5cf6', bg: 'from-violet-500 to-purple-600' },
  { id: 'exam',       label: 'Exams & Jobs',    icon: <BookOpen size={16}/>,      query: 'UPSC SSC exam 2025', color: '#f59e0b', bg: 'from-amber-500 to-orange-500' },
  { id: 'technology', label: 'Technology',      icon: <Cpu size={16}/>,           query: 'technology AI India', color: '#06b6d4', bg: 'from-cyan-500 to-blue-500' },
  { id: 'sports',     label: 'Sports',          icon: <Trophy size={16}/>,        query: 'India sports cricket', color: '#ec4899', bg: 'from-pink-500 to-rose-500' },
];

const SAMPLE_NEWS = [
  { article_id: '1', title: 'UPSC Civil Services 2025 Notification Released – Check Eligibility & Exam Pattern', description: 'Union Public Service Commission has released the official notification for Civil Services Examination 2025. Candidates can apply online from the official website.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Education Times', category: ['education'] },
  { article_id: '2', title: 'SSC CGL 2025: Registration Begins, Over 17,000 Vacancies Available', description: 'Staff Selection Commission has opened applications for Combined Graduate Level examination with thousands of vacancies across government departments.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Govt Jobs Portal', category: ['education'] },
  { article_id: '3', title: 'India GDP Growth Forecast Revised Upward to 7.2% for FY2025-26', description: 'International Monetary Fund revises India growth projection upward citing strong domestic demand and robust manufacturing sector performance.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Economic Times', category: ['national'] },
  { article_id: '4', title: 'New National Education Policy Implementation: Key Changes in Curriculum', description: 'Ministry of Education announces major updates to school curriculum under NEP 2020 with focus on skill development and critical thinking.', image_url: null, link: '#', pubDate: new Date().toISOString(), source_name: 'Hindustan Times', category: ['education'] },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const PlaceholderImg = ({ category, title }) => {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const initials = title?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'VN';
  return (
    <div className={`w-full h-full bg-gradient-to-br ${cat.bg} flex flex-col items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 80%, white 1px, transparent 0), radial-gradient(circle at 80% 20%, white 1px, transparent 0)', backgroundSize:'30px 30px'}} />
      <div className="text-white/20 text-7xl font-black absolute -bottom-4 -right-4 select-none">{cat.icon}</div>
      <div className="text-white font-black text-3xl z-10">{initials}</div>
      <div className="text-white/70 text-xs mt-1 z-10">{cat.label}</div>
    </div>
  );
};

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [online, setOnline] = useState(true);
  const [featured, setFeatured] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const fetchNews = useCallback(async (catId = activeCategory, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setOnline(true);

    const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];

    try {
      const params = new URLSearchParams({
        apikey: API_KEY,
        q: cat.query,
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
        setNews(SAMPLE_NEWS);
        setFeatured(SAMPLE_NEWS[0]);
      }
    } catch {
      setOnline(false);
      setNews(SAMPLE_NEWS);
      setFeatured(SAMPLE_NEWS[0]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => { fetchNews(activeCategory); }, [activeCategory]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const iv = setInterval(() => fetchNews(activeCategory, true), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [activeCategory, fetchNews]);

  const filtered = news.filter(n =>
    !searchQuery || n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || n.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rest = filtered.slice(1);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{fontFamily:"'Poppins', sans-serif"}}>

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ArrowLeft size={16}/>
            </div>
            <span className="text-sm font-medium hidden sm:block">Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Newspaper size={16} className="text-white"/>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">Vidya Niketan News</h1>
              <p className="text-xs text-white/40 leading-none mt-0.5">Live Updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!online && <WifiOff size={14} className="text-red-400"/>}
            {online && <Wifi size={14} className="text-green-400 animate-pulse"/>}
            {lastUpdated && <span className="text-xs text-white/30 hidden sm:block">{timeAgo(lastUpdated)}</span>}
            <button onClick={() => fetchNews(activeCategory, true)} disabled={refreshing}
              className={`w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={14}/>
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
            />
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat.id ? 'text-white shadow-lg scale-105' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
              style={activeCategory === cat.id ? {background:`linear-gradient(135deg, ${cat.color}cc, ${cat.color}88)`} : {}}>
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {/* Featured skeleton */}
            <div className="h-72 bg-white/5 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" style={{animationDelay:`${i*0.1}s`}}/>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Newspaper size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="text-lg">No news found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            {/* FEATURED ARTICLE */}
            {featured && !searchQuery && (
              <a href={featured.link} target="_blank" rel="noopener noreferrer"
                className="block group relative rounded-2xl overflow-hidden mb-6 h-72 sm:h-96 cursor-pointer">
                <div className="absolute inset-0">
                  {featured.image_url && !imgErrors[featured.article_id] ? (
                    <img src={featured.image_url} alt={featured.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={() => setImgErrors(p => ({...p, [featured.article_id]: true}))}/>
                  ) : (
                    <PlaceholderImg category={activeCategory} title={featured.title}/>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"/>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{background:activeCat.color}}>
                      {activeCat.label}
                    </span>
                    <span className="flex items-center gap-1 text-white/50 text-xs"><Clock size={10}/> {timeAgo(featured.pubDate)}</span>
                    <span className="text-white/50 text-xs">• {featured.source_name}</span>
                  </div>
                  <h2 className="text-white font-bold text-lg sm:text-2xl leading-tight mb-2 group-hover:text-orange-300 transition-colors line-clamp-2">{featured.title}</h2>
                  {featured.description && <p className="text-white/60 text-sm line-clamp-2 hidden sm:block">{featured.description}</p>}
                  <div className="flex items-center gap-1 mt-3 text-orange-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Read full story <ChevronRight size={14}/>
                  </div>
                </div>
                {/* Live badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/>
                  LIVE
                </div>
              </a>
            )}

            {/* TICKER */}
            {!searchQuery && news.length > 1 && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-6 overflow-hidden">
                <span className="flex-shrink-0 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">LATEST</span>
                <div className="flex gap-8 overflow-hidden">
                  <p className="text-white/70 text-xs truncate animate-pulse">{news[1]?.title}</p>
                </div>
              </div>
            )}

            {/* NEWS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(searchQuery ? filtered : rest).map((article, i) => (
                <a key={article.article_id || i} href={article.link} target="_blank" rel="noopener noreferrer"
                  className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 flex flex-col"
                  style={{animationDelay:`${i*0.05}s`}}>
                  {/* Image */}
                  <div className="h-44 overflow-hidden relative flex-shrink-0">
                    {article.image_url && !imgErrors[article.article_id] ? (
                      <img src={article.image_url} alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => setImgErrors(p => ({...p, [article.article_id]: true}))}/>
                    ) : (
                      <PlaceholderImg category={activeCategory} title={article.title}/>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <ExternalLink size={12} className="text-white"/>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {article.category?.slice(0,1).map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/60">{c}</span>
                      ))}
                      <span className="text-white/30 text-xs flex items-center gap-1 ml-auto"><Clock size={9}/>{timeAgo(article.pubDate)}</span>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-3 group-hover:text-orange-300 transition-colors flex-1">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-white/40 text-xs line-clamp-2 mb-3">{article.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                      <span className="text-white/30 text-xs truncate">{article.source_name || 'News Source'}</span>
                      <span className="text-orange-400 text-xs font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                        Read <ChevronRight size={10}/>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* STATS BAR */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { label: 'Articles Today', value: filtered.length, icon: <Newspaper size={16}/>, color: 'text-orange-400' },
                { label: 'Auto Refresh', value: '5 min', icon: <RefreshCw size={16}/>, color: 'text-green-400' },
                { label: 'Source', value: 'Live API', icon: <Zap size={16}/>, color: 'text-blue-400' },
              ].map((s,i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className={`${s.color} flex justify-center mb-1`}>{s.icon}</div>
                  <p className="text-white font-bold text-lg">{s.value}</p>
                  <p className="text-white/30 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="text-center py-6 text-white/20 text-xs border-t border-white/5 mt-6">
        <p>Powered by NewsData.io • Auto-refreshes every 5 minutes</p>
        <Link to="/" className="text-orange-400/60 hover:text-orange-400 transition-colors mt-1 inline-block">← Back to Vidya Niketan Home</Link>
      </div>
    </div>
  );
}
