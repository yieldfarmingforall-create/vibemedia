import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Lightbox from '@/components/Lightbox';

const INSTAGRAM_URL = 'https://www.instagram.com/norbert_rzepka_biznes?igsh=MWExcDNkdzB6MzFleA==';

function AmberButton({ to, href, children, onClick, className = '' }) {
  const style = {
    fontFamily: "'Nunito', sans-serif",
    border: '1px solid #FFC107',
    color: '#FFC107',
    padding: '0.75rem 2rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    background: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.color = '#000';
    e.currentTarget.style.background = '#FFF020';
    e.currentTarget.style.borderColor = '#FFF020';
    e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.color = '#FFC107';
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.borderColor = '#FFC107';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  if (to) {
    return (
      <Link to={to} style={style} className={className}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} style={style} className={className}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </a>
    );
  }
  return (
    <button style={style} className={className} onClick={onClick}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </button>
  );
}

function VideoFeedItem({ review, isActive }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <div className="video-snap-item relative flex items-center justify-center" style={{ height: '100vh', background: '#000' }}>
      <video
        ref={videoRef}
        src={review.fileUrl}
        loop muted={muted} playsInline
        className="max-h-full max-w-full object-contain cursor-pointer"
        style={{ maxHeight: '90vh', maxWidth: '450px' }}
        onClick={togglePlay}
      />
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-3 px-4">
        {review.description && (
          <div
            className="text-xs text-center px-4 py-2 rounded"
            style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', fontFamily: "'Poppins', sans-serif", backdropFilter: 'blur(4px)' }}
            dangerouslySetInnerHTML={{ __html: review.description }}
          />
        )}
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="p-2 rounded-full transition-all duration-200"
            style={{ border: '1px solid rgba(255,193,7,0.6)', color: '#FFC107' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,193,7,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={toggleMute} className="p-2 rounded-full transition-all duration-200"
            style={{ border: '1px solid rgba(255,193,7,0.6)', color: '#FFC107' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,193,7,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-4 rounded-full" style={{ background: 'rgba(255,193,7,0.15)', border: '2px solid #FFC107' }}>
            <Play size={32} style={{ color: '#FFC107' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [mediaTab, setMediaTab] = useState('images');
  const [lightboxItem, setLightboxItem] = useState(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [pageContent, setPageContent] = useState({});
  const videoFeedRef = useRef(null);
  const reviewsRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsData, contentData] = await Promise.all([
        base44.entities.Review.list('order', 100),
        base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.' } }),
      ]);
      setReviews(reviewsData || []);
      const contentMap = {};
      (contentData || []).forEach(c => { contentMap[c.pageKey] = c.value; });
      setPageContent(contentMap);
    } catch (e) {
      console.error(e);
    }
  };

  const imageReviews = reviews.filter(r => r.type === 'image');
  const videoReviews = reviews.filter(r => r.type === 'video');

  useEffect(() => {
    if (mediaTab !== 'videos' || !videoFeedRef.current) return;
    const container = videoFeedRef.current;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const idx = Math.round(scrollTop / height);
      setActiveVideoIndex(idx);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [mediaTab]);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      {/* HERO */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen text-center px-4"
        style={{ paddingTop: '80px' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,193,7,0.06) 0%, transparent 70%)',
        }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          <h1
            className="font-heading mb-4 leading-none"
            style={{
              fontWeight: '900',
              fontSize: 'clamp(2.8rem, 8vw, 7rem)',
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              lineHeight: '1.1',
            }}
            dangerouslySetInnerHTML={{ __html: pageContent['home.hero.h1'] || '<span style="color:#FFC107;display:block">SKALUJ AGENCJĘ.</span><span style="display:block">ZDOBYWAJ LEADY.</span>' }}
          />

          <p
            className="font-heading mt-3 mb-10 tracking-widest uppercase"
            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', color: '#A1A1AA', fontWeight: 500, letterSpacing: '0.3em' }}
          >
            {pageContent['home.hero.name'] || 'Norbert Rzepka'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <AmberButton to="/uslugi">Usługi</AmberButton>
            <AmberButton onClick={scrollToReviews}>Wyniki moich klientów</AmberButton>
            <AmberButton href="#kontakt">Kontakt</AmberButton>
          </div>
        </div>

        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
          style={{ color: 'rgba(255,193,7,0.4)' }}
        >
          <div style={{ width: 1, height: 60, background: 'linear-gradient(to bottom, rgba(255,193,7,0.4), transparent)' }} />
        </div>
      </section>

      {/* OPINIE SECTION */}
      <section ref={reviewsRef} className="px-4 py-24" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2
          className="font-heading text-center mb-12"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#FFC107' }}
        >
          {pageContent['home.reviews.title'] || 'Wyniki i opinie moich klientów'}
        </h2>

        {/* TAB SWITCHER */}
        <div className="flex justify-center gap-2 mb-12">
          {['images', 'videos'].map(tab => (
            <button
              key={tab}
              onClick={() => setMediaTab(tab)}
              className="font-ui text-sm px-6 py-3 transition-all duration-300"
              style={{
                background: mediaTab === tab ? '#FFC107' : 'transparent',
                color: mediaTab === tab ? '#000' : '#FFC107',
                border: '1px solid #FFC107',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {tab === 'images' ? 'Materiały graficzne' : 'Materiały wideo'}
            </button>
          ))}
        </div>

        {/* IMAGE GALLERY */}
        {mediaTab === 'images' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {imageReviews.length === 0 ? (
              <div className="col-span-full text-center py-16" style={{ color: '#A1A1AA', fontFamily: "'Poppins', sans-serif" }}>
                Brak materiałów graficznych. Dodaj je w panelu admina.
              </div>
            ) : (
              imageReviews.map(review => (
                <div
                  key={review.id}
                  className="relative overflow-hidden cursor-pointer group"
                  style={{ border: '1px solid rgba(255,193,7,0.15)', aspectRatio: '1', background: '#0A0A0A' }}
                  onClick={() => setLightboxItem(review)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,193,7,0.6)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,193,7,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,193,7,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <img
                    src={review.fileUrl}
                    alt="Opinia klienta"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <span className="font-ui text-xs tracking-widest uppercase" style={{ color: '#FFC107' }}>Powiększ</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIDEO FEED */}
        {mediaTab === 'videos' && (
          <div className="animate-fade-in">
            {videoReviews.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#A1A1AA', fontFamily: "'Poppins', sans-serif" }}>
                Brak materiałów wideo. Dodaj je w panelu admina.
              </div>
            ) : (
              <div
                ref={videoFeedRef}
                style={{
                  height: '90vh',
                  overflowY: 'scroll',
                  scrollSnapType: 'y mandatory',
                  WebkitOverflowScrolling: 'touch',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,193,7,0.15)',
                }}
              >
                {videoReviews.map((review, idx) => (
                  <VideoFeedItem
                    key={review.id}
                    review={review}
                    isActive={idx === activeVideoIndex}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* KONTAKT */}
      <section
        id="kontakt"
        className="px-4 py-24 text-center"
        style={{ borderTop: '1px solid rgba(255,193,7,0.1)' }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="font-heading mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#FFC107' }}>
            {pageContent['home.contact.title'] || 'Gotowy na wzrost?'}
          </h2>
          <p className="font-body mb-8" style={{ color: '#A1A1AA', lineHeight: 1.7, fontSize: '1rem' }}>
            {pageContent['home.contact.desc'] || 'Umów się na bezpłatną konsultację i dowiedz się, jak skalować swoją agencję z moją pomocą.'}
          </p>
          <AmberButton to="/konsultacja">Umów konsultację</AmberButton>
        </div>
      </section>

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  );
}