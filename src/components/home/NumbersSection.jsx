import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const DEFAULTS = {
  rules: {
    label: 'ZASADY WSPÓŁPRACY',
    h2: 'Płacisz za efekty, nie za obietnice.',
    desc: '',
    cards: [
      { badge: '0 zł', subtitle: 'ZA ROZMOWY, KTÓRE SIĘ NIE ODBYŁY', description: '' },
      { badge: '100%', subtitle: 'ROZMÓW KWALIFIKOWANYCH PRZED PRZEKAZANIEM', description: '' },
      { badge: '14 dni', subtitle: 'DO PIERWSZYCH UMÓWIONYCH ROZMÓW', description: '' },
      { badge: '1 mies.', subtitle: 'WYPOWIEDZENIA — BEZ WIELOLETNICH UMÓW', description: '' },
    ],
  },
  guarantee: {
    label: 'GWARANCJA',
    h2: 'Ryzyko bierzemy na siebie.',
    desc: 'Płacisz za rozmowy, które realnie się odbyły. Jeśli klient nie pojawi się na potwierdzonym spotkaniu — umawiamy zastępczy termin bez dodatkowych kosztów. Jeśli po pierwszym okresie uznasz, że to nie działa, kończysz współpracę z miesięcznym wypowiedzeniem. Bez kar, bez wieloletnich zobowiązań, bez drobnego druku.',
    cards: [
      { badge: 'Odbyta', subtitle: 'ROZMOWA = JEDYNA PODSTAWA ROZLICZENIA', description: '', isViolet: true },
      { badge: 'Zastępczy', subtitle: 'TERMIN ZA 0 ZŁ, GDY KLIENT SIĘ NIE POJAWI', description: '', isViolet: true },
      { badge: 'Test', subtitle: 'PIERWSZY OKRES TRAKTUJEMY JAKO SPRAWDZENIE DOPASOWANIA', description: '', isViolet: true },
      { badge: 'Wyjście', subtitle: 'W KAŻDEJ CHWILI Z MIESIĘCZNYM WYPOWIEDZENIEM', description: '', isViolet: true },
    ],
  },
};

export default function NumbersSection({ section, id }) {
  const [data, setData] = useState(DEFAULTS[section]);
  useEffect(() => {
    Promise.all([
      base44.entities.PageContent.filter({ pageKey: { $regex: `^home\\.${section}\\.` } }),
      base44.entities.HomeCard.filter({ section }),
    ]).then(([cs, cards]) => {
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setData(d => ({
        label: map[`home.${section}.label`] ?? d.label,
        h2: map[`home.${section}.h2`] ?? d.h2,
        desc: map[`home.${section}.desc`] ?? d.desc,
        cards: (cards && cards.length) ? cards.sort((a, b) => (a.order || 0) - (b.order || 0)) : d.cards,
      }));
    }).catch(() => {});
  }, [section]);

  const isViolet = section === 'guarantee';
  const accent = isViolet ? '#A855F7' : '#FFC107';
  return (
    <section id={id} style={{ paddingTop: 'clamp(5rem,10vw,8rem)', paddingBottom: 'clamp(5rem,10vw,8rem)', paddingLeft: 'clamp(1.5rem,5vw,5rem)', paddingRight: 'clamp(1.5rem,5vw,5rem)', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <p className="font-ui text-xs uppercase mb-4" style={{ color: accent, letterSpacing: '0.25em' }}>{data.label}</p>
        <h2 className="font-heading mb-5" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff', maxWidth: 900 }}>{data.h2}</h2>
        {data.desc && <p className="font-body mb-12" style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 760 }}>{data.desc}</p>}
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="p-7 rounded-2xl text-center" style={{ background: isViolet ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isViolet ? 'rgba(139,92,246,0.3)' : 'rgba(255,193,7,0.15)'}`, backdropFilter: 'blur(8px)' }}>
            <p className="font-heading font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: accent, textShadow: isViolet ? '0 0 24px rgba(168,85,247,0.4)' : '0 0 24px rgba(255,193,7,0.4)' }}>{c.badge}</p>
            <p className="font-ui text-xs uppercase mt-3" style={{ color: '#71717a', letterSpacing: '0.12em', lineHeight: 1.5 }}>{c.subtitle}</p>
            {c.description && <p className="font-body text-xs mt-2" style={{ color: '#52525b' }}>{c.description}</p>}
          </motion.div>
        ))}
      </div>
    </section>
  );
}