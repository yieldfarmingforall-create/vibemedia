import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PreFooterCta() {
  const [data, setData] = useState({ h2: 'Nie znalazłeś odpowiedzi?', subtitle: 'Zadaj pytanie na 15-minutowej, bezpłatnej konsultacji.', cta: 'Umów bezpłatną konsultację' });
  useEffect(() => {
    base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.prefooter\\.' } }).then(cs => {
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setData(d => ({
        h2: map['home.prefooter.h2'] ?? d.h2,
        subtitle: map['home.prefooter.subtitle'] ?? d.subtitle,
        cta: map['home.prefooter.cta'] ?? d.cta,
      }));
    }).catch(() => {});
  }, []);
  return (
    <section style={{ padding: 'clamp(5rem,10vw,8rem) clamp(1.5rem,5vw,5rem)', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mx-auto" style={{ maxWidth: 680 }}>
        <h2 className="font-heading mb-4" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#fff' }}>{data.h2}</h2>
        <p className="font-body mb-10" style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.8 }}>{data.subtitle}</p>
        <Link to="/konsultacja" className="font-ui font-bold text-xs px-7 py-3 uppercase tracking-widest inline-flex items-center gap-2 transition-all duration-300"
          style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}>
          {data.cta} <ArrowRight size={14} />
        </Link>
      </motion.div>
    </section>
  );
}