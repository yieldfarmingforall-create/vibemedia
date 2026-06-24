import React from 'react';
import { useLocation } from 'react-router-dom';

const InstagramIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function Footer() {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('management-dashboard');

  if (isAdminPage) return null;

  return (
    <footer
      className="w-full py-8"
      style={{
        background: '#000000',
        borderTop: '1px solid rgba(255,193,7,0.15)',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <a
          href="https://www.instagram.com/norbert_rzepka_biznes?igsh=MWExcDNkdzB6MzFleA=="
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group transition-all duration-300"
          style={{ color: '#FFC107' }}
        >
          <span
            className="transition-all duration-300"
            style={{
              display: 'inline-flex',
              transition: 'transform 0.3s ease, filter 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.2)';
              e.currentTarget.style.filter = 'drop-shadow(0 0 8px #FFF020)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
          >
            <InstagramIcon />
          </span>
          <span className="font-ui font-medium text-sm tracking-widest uppercase group-hover:text-amber-glow transition-colors duration-300">
            Instagram
          </span>
        </a>
        <p className="font-body text-xs text-zinc tracking-wide">
          Norbert Rzepka-Mamadaliw®
        </p>
      </div>
    </footer>
  );
}