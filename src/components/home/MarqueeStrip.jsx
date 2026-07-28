import React from 'react';
import { motion } from 'framer-motion';

const ITEMS = [
  'POZYSKIWANIE LEADÓW', '✦',
  'SKALOWANIE AGENCJI', '✦',
  'MENTORING 1:1', '✦',
  'WZROST PRZYCHODÓW', '✦',
  'STRATEGIA MARKETINGOWA', '✦',
  'SYSTEMY SPRZEDAŻY', '✦',
];

export default function MarqueeStrip() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden py-4"
      style={{ borderTop: '1px solid rgba(255,193,7,0.1)', borderBottom: '1px solid rgba(255,193,7,0.1)', background: 'rgba(255,193,7,0.018)' }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="flex items-center gap-10 whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="font-heading text-xs tracking-widest"
            style={{ color: item === '✦' ? '#FFC107' : 'rgba(255,255,255,0.3)', letterSpacing: item === '✦' ? 0 : '0.22em' }}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}