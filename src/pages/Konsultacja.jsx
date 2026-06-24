import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_PL = ['Pon','Wt','Śr','Czw','Pt','Sob','Niedz'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export default function Konsultacja() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('serviceId');

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showProceed, setShowProceed] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    base44.entities.AvailableSlot.filter({ isBooked: false }).then(data => {
      setSlots(data || []);
    });
  }, []);

  const datesWithSlots = new Set(slots.map(s => s.date));

  const handleDateClick = (dateStr) => {
    if (!datesWithSlots.has(dateStr)) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setShowProceed(false);
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowProceed(true);
  };

  const handleProceed = () => {
    if (!selectedSlot) return;
    navigate(`/szczegoly?slotId=${selectedSlot.id}&serviceId=${serviceId || ''}`);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null); setSelectedSlot(null); setShowProceed(false);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null); setSelectedSlot(null); setShowProceed(false);
  };

  const slotsForDate = slots.filter(s => s.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '80px', color: '#fff' }}>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1
          className="font-heading text-center mb-4"
          style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 900, color: '#FFC107', letterSpacing: '-0.02em' }}
        >
          Umów się na konsultacje
        </h1>
        <p className="text-center mb-12 font-body" style={{ color: '#A1A1AA' }}>
          Wybierz dostępny termin ze swojego kalendarza
        </p>

        {/* CALENDAR */}
        <div
          className="w-full mb-8"
          style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '4px', padding: '2rem' }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 transition-all duration-200"
              style={{ color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', background: 'transparent', cursor: 'pointer', borderRadius: '2px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,193,7,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-heading font-bold" style={{ color: '#FFF', fontSize: '1.1rem' }}>
              {MONTHS_PL[viewMonth]} {viewYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 transition-all duration-200"
              style={{ color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', background: 'transparent', cursor: 'pointer', borderRadius: '2px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,193,7,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-3">
            {DAYS_PL.map(d => (
              <div key={d} className="text-center font-ui text-xs font-semibold py-1" style={{ color: '#555', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} />;
              const { day, dateStr } = cell;
              const hasSlots = datesWithSlots.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isPast = new Date(dateStr) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && handleDateClick(dateStr)}
                  className="flex items-center justify-center font-ui text-sm font-medium transition-all duration-200"
                  style={{
                    height: '40px',
                    borderRadius: '2px',
                    cursor: hasSlots && !isPast ? 'pointer' : 'default',
                    background: isSelected ? '#FFC107' : hasSlots && !isPast ? 'rgba(255,193,7,0.07)' : 'transparent',
                    color: isSelected ? '#000' : hasSlots && !isPast ? '#FFC107' : isPast ? '#222' : '#555',
                    border: isSelected ? '1px solid #FFC107' : hasSlots && !isPast ? '1px solid rgba(255,193,7,0.4)' : '1px solid transparent',
                    fontWeight: isSelected ? '700' : hasSlots ? '600' : '400',
                    boxShadow: isSelected ? '0 0 16px rgba(255,193,7,0.5)' : 'none',
                    textDecoration: isPast ? 'line-through' : 'none',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME SLOTS */}
        {selectedDate && (
          <div className="mb-8 animate-fade-in">
            <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#A1A1AA' }}>
              Dostępne godziny — {selectedDate}
            </h4>
            {slotsForDate.length === 0 ? (
              <p className="font-body" style={{ color: '#555', fontSize: '0.9rem' }}>Brak dostępnych godzin w tym dniu.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {slotsForDate.map(slot => {
                  const isActive = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      className="font-ui font-semibold px-6 py-3 text-sm transition-all duration-200"
                      style={{
                        background: isActive ? '#FFC107' : 'transparent',
                        color: isActive ? '#000' : '#FFC107',
                        border: `1px solid ${isActive ? '#FFC107' : 'rgba(255,193,7,0.5)'}`,
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 16px rgba(255,193,7,0.5)' : 'none',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROCEED BUTTON */}
        {showProceed && selectedSlot && (
          <div className="animate-fade-in flex justify-center">
            <button
              onClick={handleProceed}
              className="font-ui font-bold px-12 py-4 text-sm uppercase tracking-widest transition-all duration-300"
              style={{
                background: '#FFC107',
                color: '#000',
                border: '1px solid #FFC107',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                animation: 'pulseAmber 2s ease infinite',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.borderColor = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,240,32,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Przejdź do szczegółów →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}