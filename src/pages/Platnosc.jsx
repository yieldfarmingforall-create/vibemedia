import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Platnosc() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId  = urlParams.get('clientId');
  const serviceId = urlParams.get('serviceId');
  const slotId    = urlParams.get('slotId');
  const status    = urlParams.get('status');
  const sessionId = urlParams.get('session_id'); // injected by Stripe via {CHECKOUT_SESSION_ID}

  const [service, setService]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified]   = useState(null); // null=pending, true=paid, false=not paid

  useEffect(() => {
    if (status === 'success') {
      setLoading(false);
      if (sessionId) {
        // Server-side verification — ask our Express server to check with Stripe API
        setVerifying(true);
        fetch(`/api/stripe/verify-session/${sessionId}`)
          .then(r => r.json())
          .then(data => { setVerified(!!data.paid); })
          .catch(() => { setVerified(null); })
          .finally(() => setVerifying(false));
      } else {
        // Fallback: no session_id in URL (shouldn't happen with {CHECKOUT_SESSION_ID} template)
        setVerified(true);
      }
      return;
    }

    if (status === 'cancel') {
      const loadService = async () => {
        if (serviceId) {
          try {
            const data = await base44.entities.Service.filter({ id: serviceId });
            if (data && data[0]) setService(data[0]);
          } catch (e) { console.error(e); }
        }
        setLoading(false);
      };
      loadService();
      return;
    }

    // Normal payment page — load service
    const loadService = async () => {
      if (serviceId) {
        try {
          const data = await base44.entities.Service.filter({ id: serviceId });
          if (data && data[0]) setService(data[0]);
        } catch (e) { console.error(e); }
      }
      setLoading(false);
    };
    loadService();
  }, []);

  const handlePay = async () => {
    if (!clientId || !service) {
      setError('Brak danych zamówienia. Wróć do wyboru usługi i spróbuj ponownie.');
      return;
    }
    setPaying(true);
    setError('');
    try {
      if (slotId) {
        try {
          await base44.entities.AvailableSlot.update(slotId, { isBooked: true, bookedByClientId: clientId });
        } catch (e) { console.error('Slot lock failed:', e); }
      }
      const result = await base44.functions.createStripeSession({
        clientId,
        serviceId: service.id,
        serviceName: service.name,
        priceGrosze: service.price,
        slotId: slotId || '',
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        if (slotId) {
          base44.entities.AvailableSlot.update(slotId, { isBooked: false, bookedByClientId: '' }).catch(() => {});
        }
        setError(result.error || 'Nie udało się utworzyć sesji płatności. Spróbuj ponownie.');
        setPaying(false);
      }
    } catch (e) {
      console.error(e);
      if (slotId) {
        base44.entities.AvailableSlot.update(slotId, { isBooked: false, bookedByClientId: '' }).catch(() => {});
      }
      setError(e.message || 'Błąd połączenia ze Stripe. Sprawdź konfigurację kluczy API lub spróbuj ponownie.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FFC107', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (status === 'success') {
    if (verifying) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: '#000', paddingTop: '80px' }}>
          <Loader2 size={40} className="animate-spin mb-6" style={{ color: '#FFC107' }} />
          <p className="font-body" style={{ color: '#A1A1AA' }}>Weryfikacja płatności...</p>
        </div>
      );
    }

    if (verified === false) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: '#000', paddingTop: '80px' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
            style={{ border: '2px solid rgba(255,50,50,0.6)', boxShadow: '0 0 30px rgba(255,50,50,0.2)' }}>
            <span style={{ color: '#ff6666', fontSize: '2rem' }}>!</span>
          </div>
          <h1 className="font-heading font-black mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#ff6666' }}>
            Płatność w trakcie przetwarzania
          </h1>
          <p className="font-body mb-8" style={{ color: '#A1A1AA', maxWidth: '420px', lineHeight: 1.7 }}>
            Stripe jeszcze przetwarza Twoją płatność. Odczekaj chwilę i odśwież stronę lub sprawdź e-mail z potwierdzeniem.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => window.location.reload()}
              className="font-ui font-bold text-sm px-8 py-4 uppercase tracking-widest"
              style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107', cursor: 'pointer' }}
            >
              Odśwież
            </button>
            <Link to="/"
              className="font-ui font-bold text-sm px-8 py-4 uppercase tracking-widest"
              style={{ background: 'transparent', color: '#A1A1AA', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', display: 'inline-flex' }}>
              Wróć do strony głównej
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: '#000', paddingTop: '80px' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{ border: '2px solid #FFC107', boxShadow: '0 0 40px rgba(255,193,7,0.4)' }}>
          <span style={{ color: '#FFC107', fontSize: '2rem' }}>✓</span>
        </div>
        <h1 className="font-heading font-black mb-4" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#FFC107' }}>
          Płatność zrealizowana!
        </h1>
        <p className="font-body mb-8" style={{ color: '#A1A1AA', maxWidth: '400px', lineHeight: 1.7 }}>
          Twoja rezerwacja konsultacji została potwierdzona. Wkrótce skontaktuję się z Tobą.
        </p>
        <Link to="/"
          className="font-ui font-bold text-sm px-10 py-4 uppercase tracking-widest transition-all duration-300"
          style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107', textDecoration: 'none', display: 'inline-flex' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}>
          Wróć do strony głównej
        </Link>
      </div>
    );
  }

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  if (status === 'cancel') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: '#000', paddingTop: '80px' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{ border: '2px solid rgba(255,50,50,0.6)', boxShadow: '0 0 30px rgba(255,50,50,0.2)' }}>
          <span style={{ color: '#ff6666', fontSize: '2rem' }}>✕</span>
        </div>
        <h1 className="font-heading font-black mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#ff6666' }}>
          Płatność anulowana
        </h1>
        <p className="font-body mb-8" style={{ color: '#A1A1AA', maxWidth: '400px', lineHeight: 1.7 }}>
          Płatność została anulowana. Twoja rezerwacja nie została potwierdzona. Możesz spróbować ponownie.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={handlePay}
            disabled={paying || !service}
            className="font-ui font-bold text-sm px-8 py-4 uppercase tracking-widest transition-all duration-300"
            style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107', cursor: paying || !service ? 'not-allowed' : 'pointer', opacity: paying || !service ? 0.7 : 1 }}
            onMouseEnter={e => { if (!paying && service) e.currentTarget.style.background = '#FFF020'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; }}>
            {paying ? 'Przekierowanie...' : 'Spróbuj ponownie'}
          </button>
          <Link to="/"
            className="font-ui font-bold text-sm px-8 py-4 uppercase tracking-widest transition-all duration-300"
            style={{ background: 'transparent', color: '#A1A1AA', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', display: 'inline-flex' }}>
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    );
  }

  // ── PAYMENT PAGE ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#000', paddingTop: '80px', color: '#fff' }}>
      <div className="max-w-lg w-full">
        <h1 className="font-heading font-black text-center mb-8" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#FFC107' }}>
          Płatność
        </h1>

        <div className="p-8" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '4px' }}>
          <p className="font-ui text-xs uppercase tracking-widest mb-4" style={{ color: '#A1A1AA' }}>Podsumowanie</p>

          {service ? (
            <div className="mb-6">
              <h3 className="font-heading font-bold mb-2" style={{ color: '#FFF', fontSize: '1.1rem' }}>{service.name}</h3>
              <p className="font-heading text-3xl font-black" style={{ color: '#FFC107' }}>
                {(service.price / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="font-body text-sm" style={{ color: '#A1A1AA' }}>Ładowanie danych usługi...</p>
            </div>
          )}

          <div className="mb-6" style={{ borderTop: '1px solid rgba(255,193,7,0.1)', paddingTop: '1.5rem' }}>
            <p className="font-body text-sm mb-3" style={{ color: '#A1A1AA', lineHeight: 1.6 }}>
              Bezpieczna płatność przez Stripe. Dostępne metody:
            </p>
            <div className="flex flex-wrap gap-2">
              {['BLIK', 'Przelewy24', 'Karta Visa/MC', 'Google Pay', 'Apple Pay'].map(method => (
                <span key={method} className="font-ui text-xs px-3 py-1"
                  style={{ border: '1px solid rgba(255,193,7,0.3)', color: '#FFC107', borderRadius: '2px' }}>
                  {method}
                </span>
              ))}
            </div>
          </div>

          <button
            className="w-full font-ui font-bold text-sm py-4 uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: paying ? 'rgba(255,193,7,0.6)' : '#FFC107',
              color: '#000',
              border: '1px solid #FFC107',
              cursor: paying || !service ? 'not-allowed' : 'pointer',
              letterSpacing: '0.15em',
              opacity: paying ? 0.8 : 1,
            }}
            onMouseEnter={e => { if (!paying && service) { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = paying ? 'rgba(255,193,7,0.6)' : '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}
            onClick={handlePay}
            disabled={paying || !service}>
            {paying ? (
              <><Loader2 size={16} className="animate-spin" />Przekierowanie do Stripe...</>
            ) : 'Zapłać przez Stripe'}
          </button>

          <p className="mt-4 text-center font-ui text-xs" style={{ color: '#333' }}>
            🔒 Płatność szyfrowana SSL · Obsługiwana przez Stripe
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4" style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '4px' }}>
            <p className="font-body text-sm text-center" style={{ color: '#ff6666' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
