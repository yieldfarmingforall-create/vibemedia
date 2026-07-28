import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Problem', href: '#problem' },
  { label: 'Jak kwalifikujemy', href: '#proces' },
  { label: 'Dla kogo', href: '#dlakogo' },
  { label: 'Gwarancja', href: '#gwarancja' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar({ focusMode = false }) {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('management-dashboard');

  if (isAdminPage) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-500 ${focusMode ? 'opacity-10 hover:opacity-100' : 'opacity-100'}`}
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,193,7,0.3)',
      }}
    >
      <div className="w-full flex items-center justify-between h-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <Link
          to="/"
          className="font-ui text-white font-medium tracking-widest uppercase text-xs sm:text-sm hover:text-amber transition-colors duration-300"
          style={{ letterSpacing: '0.15em' }}
        >
          Zdobywam leady dla agencji
        </Link>
        <div className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="font-ui text-xs uppercase tracking-widest transition-colors duration-300"
              style={{ color: '#A1A1AA', letterSpacing: '0.12em' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FFC107'}
              onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}
            >
              {l.label}
            </a>
          ))}
        </div>
        <Link
          to="/konsultacja"
          className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest transition-all duration-300 hidden sm:inline-flex items-center"
          style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,240,32,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          Umów konsultację
        </Link>
      </div>
    </nav>
  );
}