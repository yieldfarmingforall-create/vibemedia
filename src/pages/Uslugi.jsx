import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';

export default function Uslugi() {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pageTitle, setPageTitle] = useState('USŁUGI');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [svcData, contentData] = await Promise.all([
        base44.entities.Service.list('order', 10),
        base44.entities.PageContent.filter({ pageKey: 'services.title' }),
      ]);
      setServices(svcData || []);
      if (contentData && contentData[0]) setPageTitle(contentData[0].value);
      if (svcData && svcData.length > 0) setSelected(svcData[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (svc) => {
    setSelected(svc);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FFC107', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '80px', color: '#fff' }}>
      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* Back arrow */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-10 font-ui text-xs uppercase tracking-widest transition-all duration-200"
          style={{ color: '#A1A1AA', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FFC107'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#A1A1AA'; }}
        >
          <ArrowLeft size={14} /> Powrót
        </Link>

        <h1
          className="font-heading text-center mb-16"
          style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 900, color: '#FFC107', letterSpacing: '0.1em', textShadow: '0 0 40px rgba(255,193,7,0.3)' }}
        >
          {pageTitle}
        </h1>

        {/* 4-column monolith grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {services.map(svc => {
            const isSelected = selected?.id === svc.id;
            const isDimmed = selected && !isSelected;
            return (
              <div
                key={svc.id}
                onClick={() => handleSelect(svc)}
                className="cursor-pointer p-6 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[180px]"
                style={{
                  background: isSelected ? 'rgba(255,193,7,0.06)' : '#0A0A0A',
                  border: isSelected ? '1px solid rgba(255,193,7,0.8)' : '1px solid rgba(255,193,7,0.15)',
                  opacity: isDimmed ? 0.25 : 1,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 30px rgba(255,193,7,0.2)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,193,7,0.5)';
                    e.currentTarget.style.opacity = isDimmed ? '0.5' : '1';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,193,7,0.15)';
                    e.currentTarget.style.opacity = isDimmed ? '0.25' : '1';
                  }
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ border: `1px solid ${isSelected ? '#FFC107' : 'rgba(255,193,7,0.3)'}`, color: '#FFC107' }}
                >
                  <span className="font-heading font-black text-lg">{svc.order || 1}</span>
                </div>
                <h3
                  className="font-heading font-bold"
                  style={{ fontSize: '1rem', color: isSelected ? '#FFC107' : '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  {svc.name}
                </h3>
                {svc.price && (
                  <p className="font-ui mt-2 text-xs" style={{ color: '#A1A1AA' }}>
                    {(svc.price / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Service Info Box */}
        {selected && (
          <div
            key={selected.id}
            className="animate-fade-in w-full p-8 md:p-12"
            style={{
              background: '#0A0A0A',
              border: '1px solid rgba(255,193,7,0.25)',
              borderRadius: '4px',
              minHeight: '200px',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <p className="font-ui text-xs uppercase tracking-widest mb-2" style={{ color: '#A1A1AA' }}>Wybrana usługa</p>
                <h2 className="font-heading font-black mb-6" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#FFC107' }}>
                  {selected.name}
                </h2>
                <div className="font-body" style={{ color: '#CCCCCC', lineHeight: 1.8, fontSize: '1rem', maxWidth: '700px' }}
                  dangerouslySetInnerHTML={{ __html: selected.description?.replace(/\n/g, '<br/>') || '' }} />
              </div>
              <div className="flex flex-col items-center md:items-end gap-4 md:ml-8 md:min-w-[200px]">
                {selected.price && (
                  <div className="text-center md:text-right">
                    <p className="font-ui text-xs uppercase tracking-widest mb-1" style={{ color: '#A1A1AA' }}>Cena</p>
                    <p className="font-heading font-black text-3xl" style={{ color: '#FFC107' }}>
                      {(selected.price / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                    </p>
                  </div>
                )}
                <Link
                  to={`/konsultacja?serviceId=${selected.id}`}
                  className="font-ui font-semibold text-xs px-8 py-4 uppercase tracking-widest transition-all duration-300 text-center"
                  style={{
                    background: '#FFC107',
                    color: '#000',
                    border: '1px solid #FFC107',
                    letterSpacing: '0.12em',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulseAmber 2s ease infinite',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.borderColor = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Umów się
                </Link>
              </div>
            </div>
          </div>
        )}

        {services.length === 0 && (
          <div className="text-center py-20" style={{ color: '#A1A1AA', fontFamily: "'Poppins', sans-serif" }}>
            Brak usług. Dodaj je w panelu admina.
          </div>
        )}
      </div>
    </div>
  );
}