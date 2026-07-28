import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import use3DTilt from '@/hooks/use3DTilt';

const DEFAULT_MEETINGS = [
  { initials: 'AK', name: 'Anna K.',  role: 'CEO · e-commerce, moda',  time: 'DZIŚ 14:00' },
  { initials: 'MN', name: 'Marek N.', role: 'Head of Growth · SaaS',   time: 'JUTRO 10:30' },
  { initials: 'JW', name: 'Julia W.', role: 'Founder · usługi B2B',    time: 'PT 16:00' },
];

export default function MeetingsCard() {
  const { ref, onMouseMove, onMouseLeave, tiltStyle } = use3DTilt({ maxDeg: 10, glowColor: 'rgba(255,193,7,0.18)', scale: 1.02 });
  const [meetings, setMeetings] = useState(DEFAULT_MEETINGS);
  const [meta, setMeta] = useState({ header: 'Nadchodzące spotkania', badge: 'Na żywo', footer: 'wizualizacja przykładowa' });

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.list('order', 10),
      base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.meetings\\.' } }),
    ]).then(([ms, cs]) => {
      if (ms && ms.length) setMeetings(ms);
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setMeta({
        header: map['home.meetings.header'] || 'Nadchodzące spotkania',
        badge: map['home.meetings.badge'] || 'Na żywo',
        footer: map['home.meetings.footer'] || 'wizualizacja przykładowa',
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="flex justify-center" style={{ perspective: '1000px' }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          ref={ref}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="rounded-2xl"
          style={{
            ...tiltStyle,
            width: '100%',
            maxWidth: 460,
            padding: '1.75rem',
            background: 'rgba(18,16,26,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,193,7,0.18)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span className="font-ui text-xs uppercase" style={{ color: '#888888', letterSpacing: '0.18em' }}>
              {meta.header}
            </span>
            <span className="font-ui text-xs uppercase font-bold" style={{ color: '#FFC107', letterSpacing: '0.18em' }}>
              {meta.badge}
            </span>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {meetings.map((m, i) => (
              <div key={i}>
                <div className="flex items-center gap-4 py-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 42, height: 42, background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.3)' }}>
                    <span className="font-heading font-bold text-sm" style={{ color: '#FFC107' }}>{m.initials}</span>
                  </div>
                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm" style={{ color: '#ffffff' }}>{m.name}</p>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#888888' }}>{m.role}</p>
                  </div>
                  {/* Time badge */}
                  <div className="flex-shrink-0 px-3 py-1.5 rounded-lg"
                    style={{ border: '1px solid rgba(255,193,7,0.3)' }}>
                    <span className="font-ui text-xs font-semibold" style={{ color: '#FFC107', letterSpacing: '0.06em' }}>{m.time}</span>
                  </div>
                </div>
                {i < meetings.length - 1 && (
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="font-body text-xs text-center mt-5" style={{ color: '#555555' }}>
            {meta.footer}
          </p>
        </div>
      </motion.div>
    </div>
  );
}