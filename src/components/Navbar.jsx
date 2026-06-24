import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
      <div className="w-full flex items-center justify-center h-16 px-4">
        <Link
          to="/"
          className="font-ui text-white font-medium tracking-widest uppercase text-sm hover:text-amber transition-colors duration-300"
          style={{ letterSpacing: '0.15em' }}
        >
          Zdobywam leady dla agencji
        </Link>
      </div>
    </nav>
  );
}