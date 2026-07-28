import React from 'react';
import { useLocation } from 'react-router-dom';

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

function SocialLink({ href, Icon, name }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 group transition-all duration-300" style={{ color: '#FFC107' }}>
      <span className="transition-all duration-300" style={{ display: 'inline-flex', transition: 'transform 0.3s ease, filter 0.3s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.filter = 'drop-shadow(0 0 8px #FFF020)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}>
        <Icon />
      </span>
      <span className="font-ui font-medium text-sm tracking-widest uppercase group-hover:text-amber-glow transition-colors duration-300">
        {name}
      </span>
    </a>
  );
}

export default function Footer() {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('management-dashboard');

  if (isAdminPage) return null;

  return (
    <footer className="w-full pt-8 pb-16" style={{ background: '#000000', borderTop: '1px solid rgba(255,193,7,0.15)' }}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <SocialLink href="https://www.instagram.com/norbert_rzepka_biznes?igsh=MTd0bjV0c3FqOHhqYg==" Icon={InstagramIcon} name="Norbert Rzepka-Mamadaliw" />
          <SocialLink href="https://www.facebook.com/adrian.rudnicki.5458?mibextid=wwXIfr&rdid=jVBY2r5zXNNhwoq2&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HJAqWVzh8%2F%3Fmibextid%3DwwXIfr#" Icon={FacebookIcon} name="Adrian Rudnicki" />
        </div>
        <p className="font-body text-xs text-zinc tracking-wide">Vibe media®</p>
      </div>
    </footer>
  );
}