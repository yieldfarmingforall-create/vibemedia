import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, CalendarDays, ChevronDown, MessageCircle, Send, X } from 'lucide-react';

const quickActions = [
  { type: 'navigate', target: 'services', label: 'Zobacz usługi' },
  { type: 'book', label: 'Umów termin' },
  { type: 'navigate', target: 'reviews', label: 'Opinie klientów' },
];

const initialMessages = [{
  role: 'assistant',
  text: 'Cześć! Napisz, czego szukasz. Pomogę znaleźć usługę, opinie lub rozpocząć wybór terminu.',
  actions: quickActions,
}];

const idleBooking = {
  step: 'idle',
  services: [],
  slots: [],
  selectedService: null,
  selectedSlot: null,
  notice: '',
};

function plainText(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .trim();
}

function formatSlot(slot) {
  const date = new Date(`${slot.date}T${slot.time}:00`);
  const formattedDate = Number.isNaN(date.getTime())
    ? slot.date
    : new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  return `${formattedDate} · ${slot.time}`;
}

export default function ChatAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [booking, setBooking] = useState(idleBooking);
  const [isCheckingSlot, setIsCheckingSlot] = useState(false);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, booking]);

  if (location.pathname.startsWith('/management-dashboard') || location.pathname === '/platnosc') {
    return null;
  }

  const goToSection = (id) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAction = (action) => {
    if (action?.type === 'book') {
      void startBooking();
      return;
    }
    if (action?.type !== 'navigate') return;
    if (action.target === 'services') {
      setIsOpen(false);
      navigate('/uslugi');
    } else if (action.target === 'reviews') {
      goToSection('opinie');
    } else if (action.target === 'consultation') {
      setIsOpen(false);
      navigate('/konsultacja');
    }
  };

  async function startBooking() {
    setBooking({ ...idleBooking, step: 'loading' });
    try {
      const [servicesResponse, slotsResponse] = await Promise.all([
        fetch('/api/services?_limit=100'),
        fetch('/api/slots?isBooked=false&_limit=500'),
      ]);
      if (!servicesResponse.ok || !slotsResponse.ok) throw new Error('Nie udało się pobrać usług lub kalendarza.');
      const [servicesData, slotsData] = await Promise.all([servicesResponse.json(), slotsResponse.json()]);
      const futureSlots = (slotsData || [])
        .filter(slot => {
          const time = new Date(`${slot.date}T${slot.time}:00`).getTime();
          return !slot.isBooked && Number.isFinite(time) && time > Date.now();
        })
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      const services = servicesData || [];
      setBooking({
        ...idleBooking,
        step: services.length && futureSlots.length ? 'services' : 'empty',
        services,
        slots: futureSlots,
        notice: services.length && !futureSlots.length
          ? 'Obecnie nie ma wolnych przyszłych terminów. Kalendarz pokaże nowe terminy, gdy zostaną dodane.'
          : !services.length
            ? 'Nie ma jeszcze dodanych usług. Napisz do nas, a pomożemy dobrać właściwą.'
            : '',
      });
    } catch (error) {
      setBooking({ ...idleBooking, step: 'error', notice: error.message || 'Nie udało się pobrać kalendarza.' });
    }
  }

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = input.trim().slice(0, 600);
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);
    setBooking(idleBooking);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPath: location.pathname,
          messages: nextMessages.slice(-12).map(message => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się uzyskać odpowiedzi.');
      setMessages(current => [...current, {
        role: 'assistant',
        text: data.reply,
        actions: Array.isArray(data.actions) ? data.actions : [],
      }]);
    } catch (error) {
      setMessages(current => [...current, {
        role: 'assistant',
        text: error.message || 'Czat jest chwilowo niedostępny. Możesz skorzystać z tych skrótów:',
        actions: quickActions,
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const continueBooking = async () => {
    if (!booking.selectedService || !booking.selectedSlot || isCheckingSlot) return;
    setIsCheckingSlot(true);
    try {
      const response = await fetch(`/api/slots?id=${encodeURIComponent(booking.selectedSlot.id)}&isBooked=false`);
      const availableSlots = response.ok ? await response.json() : [];
      const slotIsAvailable = availableSlots.some(slot => slot.id === booking.selectedSlot.id && !slot.isBooked);
      if (!slotIsAvailable) {
        setBooking(current => ({
          ...current,
          step: 'slots',
          selectedSlot: null,
          notice: 'Ten termin nie jest już dostępny. Wybierz inny z aktualnej listy.',
        }));
        return;
      }
      const query = new URLSearchParams({
        slotId: booking.selectedSlot.id,
        serviceId: booking.selectedService.id,
      });
      setIsOpen(false);
      setBooking(idleBooking);
      navigate(`/szczegoly?${query.toString()}`);
    } catch {
      setBooking(current => ({
        ...current,
        notice: 'Nie udało się ponownie sprawdzić terminu. Spróbuj jeszcze raz.',
      }));
    } finally {
      setIsCheckingSlot(false);
    }
  };

  const bubbleStyle = {
    maxWidth: '88%',
    padding: '11px 13px',
    borderRadius: '14px',
    fontSize: '13px',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  };

  return (
    <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 1000, fontFamily: "'Nunito', sans-serif" }}>
      {isOpen && (
        <section
          role="dialog"
          aria-label="Czat z asystentem Vibe Media"
          aria-modal="false"
          className="flex flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 76,
            width: 'min(390px, calc(100vw - 24px))',
            height: 'min(640px, calc(100dvh - 110px))',
            minHeight: 390,
            background: '#080808',
            border: '1px solid rgba(255,193,7,0.35)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.7), 0 0 35px rgba(255,193,7,0.08)',
          }}
        >
          <header className="flex items-center justify-between px-4 py-3" style={{ background: '#101010', borderBottom: '1px solid rgba(255,193,7,0.18)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full" style={{ width: 38, height: 38, color: '#000', background: '#FFC107' }}>
                <Bot size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold" style={{ color: '#fff' }}>Asystent Vibe Media</h2>
                <p className="font-body text-xs" style={{ color: '#A1A1AA' }}>Usługi · opinie · terminy</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Zamknij czat"
              className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, color: '#D4D4D8', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
              <ChevronDown size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4" aria-live="polite">
            <div className="flex flex-col gap-3">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div style={{
                    ...bubbleStyle,
                    background: message.role === 'user' ? 'rgba(255,193,7,0.15)' : '#151515',
                    color: message.role === 'user' ? '#FFF3C4' : '#E4E4E7',
                    border: `1px solid ${message.role === 'user' ? 'rgba(255,193,7,0.32)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {message.text}
                  </div>
                  {message.role === 'assistant' && message.actions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.actions.map((action, actionIndex) => (
                        <button key={`${action.type}-${action.target || ''}-${actionIndex}`} type="button" onClick={() => handleAction(action)}
                          className="font-ui text-xs px-3 py-2 rounded-lg transition-colors"
                          style={{ color: '#FFC107', background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.28)', cursor: 'pointer' }}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="self-start rounded-xl px-3 py-2 text-xs" style={{ color: '#A1A1AA', background: '#151515' }}>
                  Asystent pisze…
                </div>
              )}

              {booking.step !== 'idle' && (
                <div className="rounded-xl p-3" style={{ background: '#101010', border: '1px solid rgba(255,193,7,0.22)' }}>
                  <div className="flex items-center gap-2 mb-2 font-ui text-xs uppercase tracking-wider" style={{ color: '#FFC107' }}>
                    <CalendarDays size={14} /> Wybór terminu
                  </div>
                  {booking.step === 'loading' && <p className="text-xs" style={{ color: '#A1A1AA' }}>Pobieram usługi i aktualne terminy…</p>}
                  {booking.notice && <p className="text-xs leading-5 mb-2" style={{ color: booking.step === 'error' ? '#FCA5A5' : '#D4D4D8' }}>{booking.notice}</p>}

                  {booking.step === 'services' && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs" style={{ color: '#D4D4D8' }}>Najpierw wybierz usługę:</p>
                      {booking.services.map(service => (
                        <button key={service.id} type="button" onClick={() => setBooking(current => ({ ...current, step: 'slots', selectedService: service, notice: '' }))}
                          className="text-left rounded-lg px-3 py-2"
                          style={{ color: '#fff', background: '#191919', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                          <span className="block text-sm font-semibold">{service.name}</span>
                          {service.description && <span className="block mt-1 text-xs" style={{ color: '#A1A1AA' }}>{plainText(service.description).slice(0, 100)}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {booking.step === 'slots' && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs" style={{ color: '#D4D4D8' }}>
                        {booking.selectedService?.name ? `Wybierz termin dla: ${booking.selectedService.name}` : 'Wybierz termin:'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {booking.slots.map(slot => (
                          <button key={slot.id} type="button"
                            onClick={() => setBooking(current => ({ ...current, step: 'confirm', selectedSlot: slot, notice: '' }))}
                            className="rounded-lg px-2 py-2 text-xs"
                            style={{ color: '#FFC107', background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.24)', cursor: 'pointer' }}>
                            {formatSlot(slot)}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setBooking(current => ({ ...current, step: 'services', selectedService: null, notice: '' }))}
                        className="self-start text-xs underline" style={{ color: '#A1A1AA', background: 'none', border: 0, cursor: 'pointer' }}>
                        Zmień usługę
                      </button>
                    </div>
                  )}

                  {booking.step === 'confirm' && booking.selectedSlot && booking.selectedService && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold" style={{ color: '#fff' }}>{booking.selectedService.name}</p>
                      <p className="text-xs" style={{ color: '#D4D4D8' }}>{formatSlot(booking.selectedSlot)}</p>
                      <p className="text-xs leading-5" style={{ color: '#A1A1AA' }}>Wybór terminu nie rezerwuje go jeszcze. Dokończ formularz, aby kontynuować.</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void continueBooking()} disabled={isCheckingSlot}
                          className="rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
                          style={{ color: '#000', background: '#FFC107', border: 0, cursor: isCheckingSlot ? 'wait' : 'pointer' }}>
                          {isCheckingSlot ? 'Sprawdzam termin…' : 'Kontynuuj rezerwację'}
                        </button>
                        <button type="button" onClick={() => setBooking(current => ({ ...current, step: 'slots', selectedSlot: null, notice: '' }))}
                          className="rounded-lg px-3 py-2 text-xs"
                          style={{ color: '#FFC107', background: 'transparent', border: '1px solid rgba(255,193,7,0.25)', cursor: 'pointer' }}>
                          Wybierz inny
                        </button>
                      </div>
                    </div>
                  )}

                  {(booking.step === 'empty' || booking.step === 'error') && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void startBooking()} className="text-xs underline" style={{ color: '#FFC107', background: 'none', border: 0, cursor: 'pointer' }}>
                        Odśwież terminy
                      </button>
                      <button type="button" onClick={() => { setBooking(idleBooking); setIsOpen(false); navigate('/konsultacja'); }}
                        className="text-xs underline" style={{ color: '#FFC107', background: 'none', border: 0, cursor: 'pointer' }}>
                        Przejdź do konsultacji
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 p-3" style={{ borderTop: '1px solid rgba(255,193,7,0.16)', background: '#101010' }}>
            <input value={input} onChange={event => setInput(event.target.value)} maxLength={600}
              placeholder="Napisz, czego potrzebujesz…" aria-label="Wiadomość do asystenta"
              className="min-w-0 flex-1 rounded-xl px-3 py-3 text-sm outline-none"
              style={{ color: '#fff', background: '#191919', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button type="submit" disabled={isSending || !input.trim()} aria-label="Wyślij wiadomość"
              className="flex items-center justify-center rounded-xl disabled:opacity-40"
              style={{ width: 44, height: 44, color: '#000', background: '#FFC107', border: 0, cursor: isSending ? 'wait' : 'pointer' }}>
              <Send size={17} />
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[10px] leading-4" style={{ color: '#71717A', background: '#101010' }}>
            Wiadomości przetwarza Groq; nie wpisuj danych karty ani haseł.
          </p>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen(open => !open)}
        aria-label={isOpen ? 'Zamknij czat' : 'Otwórz czat z asystentem'} aria-expanded={isOpen}
        className="flex items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          width: 58,
          height: 58,
          marginLeft: 'auto',
          color: isOpen ? '#FFC107' : '#000',
          background: isOpen ? '#141414' : '#FFC107',
          border: '1px solid #FFC107',
          boxShadow: '0 8px 30px rgba(255,193,7,0.25)',
          cursor: 'pointer',
        }}>
        {isOpen ? <X size={23} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
}
