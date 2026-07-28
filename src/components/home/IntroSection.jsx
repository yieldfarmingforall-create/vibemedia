import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_CHECKLIST = [
  'Bez długoterminowych umów',
  'Rozliczenie za efekty',
  'Pierwsze rozmowy w 14 dni',
  'Bez reklam i bez cold calli z Twojej strony',
];

export default function IntroSection() {
  const [d, setD] = useState({
    label: 'Przyjmujemy 3 nowych klientów w tym miesiącu',
    h2: 'Pozyskujemy rozmowy sprzedażowe na konkretną godzinę — z klientami zainteresowanymi Twoją ofertą.',
    desc: 'Bez reklam i bez cold calli z Twojej strony. Zanim ktokolwiek trafi do Twojego kalendarza, rozmawiamy z nim 10–20 minut: badamy potrzeby, budżet i cele, przedstawiamy Twoją ofertę. Ty wchodzisz na rozmowę z kimś, kto wie, po co rozmawiacie — i chce kupić.',
    cta: 'Umów bezpłatną konsultację',
    link: 'Zobacz jak kwalifikujemy',
    checklist: DEFAULT_CHECKLIST,
  });
  useEffect(() => {
    base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.intro\\.' } }).then(cs => {
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setD(prev => ({
        label: map['home.intro.label'] ?? prev.label,
        h2: map['home.intro.h2'] ?? prev.h2,
        desc: map['home.intro.desc'] ?? prev.desc,
        cta: map['home.intro.cta'] ?? prev.cta,
        link: map['home.intro.link'] ?? prev.link,
        checklist: map['home.intro.checklist'] ? map['home.intro.checklist'].split('|').map(s => s.trim()).filter(Boolean) : prev.checklist,
      }));
    }).catch(() => {});
  }, []);
  return (
    <section style={{ paddingTop: 'clamp(5rem,10vw,8rem)', paddingBottom: 'clamp(5rem,10vw,8rem)', paddingLeft: 'clamp(1.5rem,5vw,5rem)', paddingRight: 'clamp(1.5rem,5vw,5rem)', maxWidth: 1000, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <span className="inline-block font-ui text-xs uppercase mb-5 px-4 py-2 rounded-full" style={{ color: '#FFC107', border: '1px solid rgba(255,193,7,0.4)', background: 'rgba(255,193,7,0.06)', letterSpacing: '0.12em' }}>{d.label}</span>
        <h2 className="font-heading mb-6" style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 900, lineHeight: 1.15, color: '#fff', maxWidth: 880 }}>{d.h2}</h2>
        <p className="font-body mb-8" style={{ color: '#a1a1aa', fontSize: '1.1rem', lineHeight: 1.9, maxWidth: 780 }}>{d.desc}</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
          <Link to="/konsultacja" className="font-ui font-bold text-xs px-7 py-3 uppercase tracking-widest inline-flex items-center gap-2 transition-all duration-300"
            style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}>
            {d.cta} <ArrowRight size={14} />
          </Link>
          <a href="#proces" className="font-ui text-xs uppercase tracking-widest transition-colors duration-300" style={{ color: '#FFC107', borderBottom: '1px solid rgba(255,193,7,0.4)', paddingBottom: '2px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#FFF020'} onMouseLeave={e => e.currentTarget.style.color = '#FFC107'}>
            {d.link}
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {d.checklist.map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,193,7,0.12)' }}>
              <span style={{ color: '#FFC107', fontWeight: 700 }}>✓</span>
              <span className="font-body text-xs" style={{ color: '#a1a1aa' }}>{c}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}