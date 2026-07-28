import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const DEFAULT_ITEMS = [
  'COLD E-MAIL & LINKEDIN',
  'CIEPŁE LEADY B2B',
  'KALENDARZ PEŁEN SPOTKAŃ',
  'ROZMOWY NA KONKRETNĄ GODZINĘ',
  'KWALIFIKACJA BUDŻETU',
];

export default function TickerBar() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  useEffect(() => {
    base44.entities.PageContent.filter({ pageKey: 'home.ticker.items' }).then(d => {
      if (d && d[0] && d[0].value) setItems(d[0].value.split('|').map(s => s.trim()).filter(Boolean));
    }).catch(() => {});
  }, []);
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden py-3" style={{ borderTop: '1px solid rgba(255,193,7,0.2)', borderBottom: '1px solid rgba(255,193,7,0.2)', background: 'rgba(255,193,7,0.03)' }}>
      <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="flex items-center gap-6 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((it, i) => (
          <span key={i} className="font-ui text-xs tracking-widest uppercase flex items-center gap-6" style={{ color: i % 2 === 0 ? '#FFC107' : 'rgba(255,255,255,0.4)' }}>
            {it}<span style={{ color: '#FFC107' }}>•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}