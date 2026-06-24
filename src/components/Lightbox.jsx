import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Lightbox({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full transition-all duration-300 z-10"
        style={{ color: '#FFC107', border: '1px solid rgba(255,193,7,0.5)' }}
        onClick={onClose}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,193,7,0.1)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,193,7,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <X size={20} />
      </button>

      <div
        className="max-w-4xl w-full animate-fade-in flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={item.fileUrl}
          alt="Opinia klienta"
          className="max-h-[75vh] w-auto object-contain rounded"
          style={{ border: '1px solid rgba(255,193,7,0.2)' }}
        />
        {item.description && (
          <div
            className="rich-text-content text-sm text-center max-w-2xl px-4"
            dangerouslySetInnerHTML={{ __html: item.description }}
            style={{ color: '#A1A1AA', fontFamily: "'Poppins', sans-serif" }}
          />
        )}
      </div>
    </div>
  );
}