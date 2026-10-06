import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  motion, useInView, useScroll, useTransform, useSpring,
} from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';
import ParticleTrail from '@/components/home/ParticleTrail';
import InteractiveGrid from '@/components/home/InteractiveGrid';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import HeroScene3D from '@/components/home/HeroScene3D';
import MeetingsCard from '@/components/home/MeetingsCard';
import TickerBar from '@/components/home/TickerBar';
import IntroSection from '@/components/home/IntroSection';
import CardsSection from '@/components/home/CardsSection';
import NumbersSection from '@/components/home/NumbersSection';
import ProcessSection from '@/components/home/ProcessSection';
import FaqSection from '@/components/home/FaqSection';
import PreFooterCta from '@/components/home/PreFooterCta';
import use3DTilt from '@/hooks/use3DTilt';

const AMBER = '#FFC107';
const sp = { stiffness: 55, damping: 20 };

// ── Amber button ────────────────────────────────────────────────────────────
function AmberButton({ to, href, children, onClick, solid = false }) {
  const [hov, setHov] = useState(false);
  const base = {
    fontFamily: "'Nunito', sans-serif",
    border: `1px solid ${AMBER}`,
    padding: '0.85rem 2.4rem',
    fontSize: '0.78rem', fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    transition: 'all 0.3s ease', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    textDecoration: 'none', borderRadius: '0.75rem',
    background: hov || solid ? '#FFF020' : 'transparent',
    color: hov || solid ? '#000' : AMBER,
    boxShadow: hov ? '0 0 32px rgba(255,240,32,0.45)' : 'none',
    transform: hov ? 'translateY(-2px)' : 'none',
  };
  const p = { style: base, onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false) };
  if (to) return <Link to={to} {...p}>{children}</Link>;
  if (href) return <a href={href} {...p}>{children}</a>;
  return <button onClick={onClick} {...p}>{children}</button>;
}

// ── Character-by-character reveal ──────────────────────────────────────────
function CharReveal({ text, delay = 0, className, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', ...style }}>
      {text.split('').map((ch, i) => (
        <motion.span key={i} style={{ display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.03, ease: [0.22, 1, 0.36, 1] }}>
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

// ── Slide-in reveal ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, from = 'bottom', once = true }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-70px' });
  const v = {
    bottom: { hidden: { opacity: 0, y: 60 },   visible: { opacity: 1, y: 0 } },
    left:   { hidden: { opacity: 0, x: -80 },  visible: { opacity: 1, x: 0 } },
    right:  { hidden: { opacity: 0, x: 80 },   visible: { opacity: 1, x: 0 } },
    scale:  { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  }[from];
  return (
    <motion.div ref={ref} variants={v} initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ── Hero word-by-word headline (3D flip-in) ──────────────────────────────────
function AnimatedHeadline({ html }) {
  const text = html
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim() || 'SKALUJ AGENCJĘ. ZDOBYWAJ LEADY.';
  const words = text.split(' ');
  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.11, delayChildren: 0.2 } } };
  const word = {
    hidden: { opacity: 0, y: 80, rotateX: -55, scale: 0.9, filter: 'blur(8px)' },
    visible: {
      opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)',
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    },
  };
  return (
    <motion.h1 variants={container} initial="hidden" animate="visible" className="font-heading"
      style={{
        fontWeight: 900, fontSize: 'clamp(3rem, 8.5vw, 7.5rem)',
        letterSpacing: '-0.04em', lineHeight: 1.0,
        perspective: '1000px', transformStyle: 'preserve-3d',
      }}>
      {words.map((w, i) => (
        <motion.span key={i} variants={word}
          style={{
            display: 'inline-block', marginRight: '0.28em',
            transformOrigin: 'bottom center',
            transformStyle: 'preserve-3d',
            background: i < 2
              ? 'linear-gradient(135deg,#FFF020 0%,#FFC107 55%,#ff9500 100%)'
              : 'linear-gradient(135deg,#ffffff 0%,#d4d4d8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          {w}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ pageContent, onScrollToReviews }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });

  // 6 independent parallax depths — deeper = faster scroll away
  const sceneY    = useSpring(useTransform(scrollYProgress, [0,1], [0,  60]), { stiffness:40, damping:18 });
  const gridY     = useSpring(useTransform(scrollYProgress, [0,1], [0, 110]), { stiffness:45, damping:18 });
  const orb1Y     = useSpring(useTransform(scrollYProgress, [0,1], [0, 280]), { stiffness:30, damping:15 });
  const orb2Y     = useSpring(useTransform(scrollYProgress, [0,1], [0, 190]), { stiffness:35, damping:16 });
  const titleY    = useSpring(useTransform(scrollYProgress, [0,1], [0,  80]), { stiffness:55, damping:22 });
  const subY      = useSpring(useTransform(scrollYProgress, [0,1], [0, 145]), { stiffness:50, damping:20 });
  const ctaY      = useSpring(useTransform(scrollYProgress, [0,1], [0, 210]), { stiffness:45, damping:18 });
  const titleRotX = useTransform(scrollYProgress, [0, 0.5], [0, 12]);
  const opacity   = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section ref={sectionRef}
      className="relative min-h-screen overflow-hidden flex items-center"
      style={{ paddingTop: 80, paddingLeft: 'clamp(1.5rem,5vw,6rem)', paddingRight: 'clamp(1.5rem,5vw,6rem)', perspective: '1200px' }}>

      {/* Dot grid — layer 0 */}
      <InteractiveGrid />

      {/* 3D scene — layer 1 (slowest) */}
      <motion.div style={{ y: sceneY, position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <HeroScene3D />
      </motion.div>

      {/* Grid lines — layer 2 */}
      <motion.div style={{ y: gridY, position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,193,7,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,193,7,0.03) 1px,transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
      </motion.div>

      {/* Orb 1 — layer 3 */}
      <motion.div style={{ y: orb1Y, position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <motion.div animate={{ x:[0,35,0], y:[0,-24,0] }} transition={{ duration:13, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', top:'20%', left:'-10%', width:680, height:680, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(255,193,7,0.14) 0%,transparent 68%)', filter:'blur(55px)' }} />
      </motion.div>

      {/* Orb 2 — layer 4 */}
      <motion.div style={{ y: orb2Y, position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <motion.div animate={{ x:[0,-30,0], y:[0,35,0] }} transition={{ duration:17, repeat:Infinity, ease:'easeInOut', delay:5 }}
          style={{ position:'absolute', top:'0%', right:'-14%', width:780, height:780, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(255,240,32,0.07) 0%,transparent 68%)', filter:'blur(65px)' }} />
      </motion.div>

      {/* Content — two columns: headline left, meetings card right */}
      <div className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16" style={{ zIndex: 3, padding: '2rem 0' }}>

        {/* Left half — headline + subtitle + CTA */}
        <motion.div style={{ y: titleY, opacity }}
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div style={{ rotateX: titleRotX, transformStyle: 'preserve-3d', maxWidth: 1020 }}>
            <AnimatedHeadline html={pageContent['home.hero.h1']} />
          </motion.div>

          <motion.p initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.75, delay:0.75, ease:[0.22,1,0.36,1] }}
            className="font-heading mt-6 mb-10 tracking-widest uppercase"
            style={{ fontSize:'clamp(0.85rem,2vw,1.2rem)', color:'#52525b', fontWeight:600, letterSpacing:'0.38em' }}>
            {pageContent['home.hero.name'] || 'Vibe media'}
          </motion.p>

          <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.75, delay:0.95, ease:[0.22,1,0.36,1] }}
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 flex-wrap">
            <AmberButton to="/uslugi" solid>Sprawdź usługi <ArrowRight size={14}/></AmberButton>
            <AmberButton onClick={onScrollToReviews}>Wyniki klientów</AmberButton>
            <AmberButton href="#kontakt">Kontakt</AmberButton>
          </motion.div>
        </motion.div>

        {/* Right half — meetings card */}
        <motion.div style={{ y: subY, opacity }}
          className="flex-shrink-0 w-full max-w-md">
          <motion.div initial={{ opacity:0, x:60 }} animate={{ opacity:1, x:0 }}
            transition={{ duration:0.85, delay:0.6, ease:[0.22,1,0.36,1] }}>
            <MeetingsCard />
          </motion.div>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ zIndex:3 }}>
        <motion.span className="font-ui" style={{ color:'rgba(255,193,7,0.38)', fontSize:'0.58rem', letterSpacing:'0.32em', textTransform:'uppercase' }}
          animate={{ opacity:[0.38,0.85,0.38] }} transition={{ duration:2.6, repeat:Infinity }}>
          scroll
        </motion.span>
        <motion.div animate={{ y:[0,14,0] }} transition={{ duration:1.9, repeat:Infinity, ease:'easeInOut' }}
          style={{ width:1, height:56, background:'linear-gradient(to bottom,rgba(255,193,7,0.55),transparent)' }} />
      </motion.div>
    </section>
  );
}

// ── Floating stat card ───────────────────────────────────────────────────────
function FloatingStatCard({ value, label, index }) {
  const { ref, onMouseMove, onMouseLeave, tiltStyle } = use3DTilt({ maxDeg: 14, glowColor: 'rgba(255,193,7,0.2)', scale: 1.06 });
  const floatDelay = index * 0.7;

  return (
    <Reveal delay={index * 0.12} from={index % 2 === 0 ? 'left' : 'right'}>
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 3.5 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
      >
        <div
          ref={ref}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="text-center p-7 rounded-2xl cursor-default"
          style={{
            ...tiltStyle,
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,193,7,0.15)',
          }}
        >
          <p className="font-heading font-black"
            style={{ fontSize: 'clamp(2.2rem,5vw,3.8rem)', color: AMBER, letterSpacing: '-0.03em', lineHeight: 1,
              textShadow: '0 0 30px rgba(255,193,7,0.4)' }}>
            {value}
          </p>
          <p className="font-body text-xs mt-3 tracking-widest uppercase"
            style={{ color: '#71717a', letterSpacing: '0.14em' }}>
            {label}
          </p>
        </div>
      </motion.div>
    </Reveal>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: '200+', label: 'Zadowolonych klientów' },
    { value: '5×',   label: 'Średni wzrost leadów' },
    { value: '3 lata', label: 'Doświadczenia na rynku' },
    { value: '98%',  label: 'Poleca dalej' },
  ];
  return (
    <section className="py-28 overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <FloatingStatCard key={i} value={s.value} label={s.label} index={i} />
        ))}
      </div>
    </section>
  );
}

// ── Feature card with 3D tilt ─────────────────────────────────────────────────
function FeatureCard({ item }) {
  const { ref, onMouseMove, onMouseLeave, tiltStyle } = use3DTilt({ maxDeg:8, glowColor:'rgba(255,193,7,0.15)', scale:1.02 });
  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="flex items-start gap-5 p-5 rounded-2xl cursor-default"
      style={{
        ...tiltStyle,
        border:'1px solid rgba(255,255,255,0.06)',
        background:'rgba(255,255,255,0.02)',
        backdropFilter:'blur(8px)',
      }}>
      <span className="font-heading font-black flex-shrink-0 mt-0.5"
        style={{ color:'rgba(255,193,7,0.3)', fontSize:'0.7rem', letterSpacing:'0.1em' }}>{item.n}</span>
      <div>
        <p className="font-heading font-bold text-sm mb-1" style={{ color:'#ffffff' }}>{item.t}</p>
        <p className="font-body text-xs" style={{ color:'#52525b', lineHeight:1.6 }}>{item.d}</p>
      </div>
    </div>
  );
}

// ── About strip ──────────────────────────────────────────────────────────────
function AboutSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const leftX  = useSpring(useTransform(scrollYProgress, [0,0.5], [-100, 0]), sp);
  const rightX = useSpring(useTransform(scrollYProgress, [0,0.5], [100, 0]), sp);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  return (
    <section ref={ref} className="py-32 overflow-hidden"
      style={{ maxWidth:1200, margin:'0 auto', padding:'clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,5rem)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <motion.div style={{ x: leftX, opacity }}>
          <p className="font-heading text-xs tracking-widest uppercase mb-4"
            style={{ color: AMBER, letterSpacing:'0.25em' }}>O mnie</p>
          <h2 className="font-heading mb-6"
            style={{
              fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:900, lineHeight:1.1,
              background:'linear-gradient(135deg,#ffffff 0%,#a1a1aa 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>
            Pomagamy agencjom rosnąć szybciej niż rynek
          </h2>
          <p className="font-body" style={{ color:'#71717a', lineHeight:1.9, fontSize:'1rem' }}>
            Przez ostatnie 3 lata zbudowaliśmy systemy, które pomogły ponad 200 agencjom i freelancerom
            skalować przychody, pozyskiwać wartościowe leady i budować przewidywalny biznes.
          </p>
          <div className="mt-10">
            <AmberButton to="/konsultacja">Umów bezpłatną konsultację <ArrowRight size={14}/></AmberButton>
          </div>
        </motion.div>

        {/* Right — feature list with 3D tilt */}
        <motion.div style={{ x: rightX, opacity }} className="flex flex-col gap-5">
          {[
            { n:'01', t:'Strategia leadów', d:'Systemy pozyskiwania klientów B2B i B2C' },
            { n:'02', t:'Skalowanie procesów', d:'Automatyzacja i delegowanie w agencji' },
            { n:'03', t:'Mentoring 1:1', d:'Indywidualna ścieżka wzrostu dostosowana do Ciebie' },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.15} from="right">
              <FeatureCard item={item} />
            </Reveal>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function reviewText(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function hasSafeSocialUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// ── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, index }) {
  const revealRef = useRef(null);
  const inView = useInView(revealRef, { once:true, margin:'-60px' });
  const socials = [
    { key: 'instagramUrl', label: 'Instagram', Icon: Instagram },
    { key: 'facebookUrl', label: 'Facebook', Icon: Facebook },
    { key: 'linkedinUrl', label: 'LinkedIn', Icon: Linkedin },
    { key: 'youtubeUrl', label: 'YouTube', Icon: Youtube },
  ].filter(({ key }) => hasSafeSocialUrl(review[key]));

  return (
    <motion.article
      ref={revealRef}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl"
      style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,193,7,0.14)', backdropFilter:'blur(12px)' }}
    >
      {review.fileUrl && (
        <div className="flex items-center justify-center overflow-hidden" style={{ minHeight: review.type === 'audio' ? 110 : 220, background:'rgba(0,0,0,0.45)' }}>
          {review.type === 'video' ? (
            <video src={review.fileUrl} controls playsInline preload="metadata" className="w-full" style={{ maxHeight:320 }} aria-label={`Nagranie wideo: ${review.authorName || 'opinia klienta'}`} />
          ) : review.type === 'audio' ? (
            <div className="w-full px-5 py-7">
              <audio src={review.fileUrl} controls preload="metadata" className="w-full" aria-label={`Nagranie audio: ${review.authorName || 'opinia klienta'}`} />
            </div>
          ) : (
            <img src={review.fileUrl} alt={`Opinia klienta${review.authorName ? ` — ${review.authorName}` : ''}`} className="w-full object-cover" style={{ maxHeight:320 }} loading="lazy" />
          )}
        </div>
      )}
      <div className="p-5 sm:p-6">
        {review.authorName && <h3 className="font-heading font-bold text-base mb-3" style={{ color:'#fff' }}>{review.authorName}</h3>}
        {review.description && <p className="font-body text-sm leading-7" style={{ color:'#D4D4D8', whiteSpace:'pre-wrap' }}>{reviewText(review.description)}</p>}
        {socials.length > 0 && (
          <nav className="flex items-center gap-2 mt-5" aria-label={`Profile społecznościowe${review.authorName ? `: ${review.authorName}` : ''}`}>
            {socials.map(({ key, label, Icon }) => (
              <a key={key} href={review[key]} target="_blank" rel="noopener noreferrer" aria-label={`Otwórz profil ${label}`}
                className="inline-flex items-center justify-center rounded-full transition-colors"
                style={{ width:38, height:38, color:AMBER, border:'1px solid rgba(255,193,7,0.28)', background:'rgba(255,193,7,0.06)' }}>
                <Icon size={17} aria-hidden="true" />
              </a>
            ))}
          </nav>
        )}
      </div>
    </motion.article>
  );
}

// ── Reviews section ──────────────────────────────────────────────────────────
function ReviewsSection({ reviewsRef, reviews, title }) {
  const sRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ['start end', 'center center'] });
  const titleX    = useSpring(useTransform(scrollYProgress, [0,1], [-140, 0]), sp);
  const subX      = useSpring(useTransform(scrollYProgress, [0,1], [140, 0]), sp);
  const titleOp   = useTransform(scrollYProgress, [0, 0.55], [0, 1]);

  return (
    <section id="opinie" ref={el => { sRef.current = el; if (reviewsRef) reviewsRef.current = el; }}
      style={{ maxWidth:1400, margin:'0 auto', padding:'clamp(4rem,8vw,8rem) clamp(1.5rem,5vw,5rem)' }}>

      <div className="text-center mb-3 overflow-hidden">
        <motion.p className="font-heading text-xs tracking-widest uppercase mb-4"
          style={{ opacity:titleOp, color:AMBER, letterSpacing:'0.25em' }}>Wyniki</motion.p>
        <motion.h2 className="font-heading" style={{
          x: titleX, opacity: titleOp, display:'inline-block',
          fontSize:'clamp(2rem,4.5vw,3.5rem)', fontWeight:900,
          background:'linear-gradient(90deg,#fff 0%,#e4e4e7 45%,#FFC107 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        }}>
          {reviewText(title) || 'Opinie moich klientów'}
        </motion.h2>
      </div>
      <div className="text-center mb-16 overflow-hidden">
        <motion.p className="font-body text-sm" style={{ x: subX, opacity: titleOp, display:'inline-block', color:'#52525b' }}>
          Historie klientów, zdjęcia, nagrania i filmy z przebiegu współpracy
        </motion.p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 rounded-2xl font-body text-sm"
          style={{ color:'#71717A', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.015)' }}>
          Opinie klientów pojawią się tutaj.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reviews.map((review, index) => <ReviewCard key={review.id} review={review} index={index} />)}
        </div>
      )}
    </section>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────
function ContactSection({ pageContent }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const scale  = useSpring(useTransform(scrollYProgress, [0,1], [0.86, 1]), sp);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);

  return (
    <section id="kontakt" className="relative text-center overflow-hidden"
      style={{ borderTop:'1px solid rgba(255,255,255,0.04)', padding:'clamp(6rem,12vw,12rem) clamp(1.5rem,5vw,5rem)' }}>
      {/* Big ambient glow */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:500, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(255,193,7,0.05) 0%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />

      <motion.div ref={ref} style={{ scale, opacity, margin:'0 auto', maxWidth:700, position:'relative' }}>
        <div className="rounded-2xl p-14"
          style={{ background:'rgba(255,255,255,0.025)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <CharReveal
            text={pageContent['home.contact.title'] || 'Gotowy na wzrost?'}
            delay={0}
            className="font-heading"
            style={{
              fontSize:'clamp(2rem,5vw,3.2rem)', fontWeight:900, display:'block', marginBottom:'1.5rem',
              background:'linear-gradient(135deg,#ffffff 0%,#a1a1aa 60%,#FFC107 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}
          />
          <Reveal from="bottom" delay={0.3}>
            <p className="font-body mb-12" style={{ color:'#71717a', lineHeight:1.9, fontSize:'1.05rem' }}>
              {pageContent['home.contact.desc'] || 'Umów się na bezpłatną konsultację i dowiedz się, jak skalować swoją agencję z naszą pomocą.'}
            </p>
            <AmberButton to="/konsultacja" solid>
              Umów konsultację <ArrowRight size={14}/>
            </AmberButton>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [pageContent, setPageContent] = useState({});
  const reviewsRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Review.list('order', 100),
      base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.' } }),
    ]).then(([rv, cd]) => {
      setReviews(rv || []);
      const map = {};
      (cd || []).forEach(c => { map[c.pageKey] = c.value; });
      setPageContent(map);
    }).catch(console.error);
  }, []);

  return (
    <div style={{ background:'#000', minHeight:'100vh', color:'#fff' }}>
      <CustomCursor />
      <ParticleTrail />

      <HeroSection pageContent={pageContent} onScrollToReviews={() => reviewsRef.current?.scrollIntoView({ behavior:'smooth' })} />

      <TickerBar />
      <IntroSection />
      <CardsSection section="problem" id="problem" />
      <CardsSection section="solution" id="solution" />
      <CardsSection section="forwho" id="dlakogo" />
      <ProcessSection id="proces" />
      <NumbersSection section="rules" />
      <NumbersSection section="guarantee" id="gwarancja" />
      <FaqSection id="faq" />
      <PreFooterCta />

      <MarqueeStrip />
      <StatsSection />
      <MarqueeStrip />

      <AboutSection />

      <ReviewsSection
        reviewsRef={reviewsRef}
        reviews={reviews}
        title={pageContent['home.reviews.title']}
      />

      <ContactSection pageContent={pageContent} />
    </div>
  );
}