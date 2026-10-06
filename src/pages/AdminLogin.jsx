import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff } from 'lucide-react';
import { verifyTotp } from '@/lib/totp';
import TotpCodeInput from '@/components/TotpCodeInput';

const DEFAULT_PASSWORD = 'NorbertAdmin2024!';
const SESSION_KEY = 'adminSession';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials'); // credentials | totp
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const totpRefs = useRef([]);
  const totpInputRef = useCallback(element => {
    totpRefs.current[0] = element;
  }, []);

  useEffect(() => {
    // Check if already logged in
    if (sessionStorage.getItem(SESSION_KEY) === 'authenticated') {
      navigate('/management-dashboard-secure-nr7x912/dashboard');
    }
    // Load 2FA setting
    base44.entities.AdminSettings.filter({ settingKey: 'twoFAEnabled' }).then(data => {
      if (data && data[0]) setTwoFAEnabled(data[0].value === 'true');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 'totp') totpRefs.current[0]?.focus();
  }, [step]);

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let storedPassword = DEFAULT_PASSWORD;
    try {
      const stored = await base44.entities.AdminSettings.filter({ settingKey: 'adminPassword' });
      if (stored && stored[0]) storedPassword = stored[0].value;
    } catch {
      // Backend niedostępny — używamy domyślnego hasła
    }

    if (password !== storedPassword) {
      setError('Nieprawidłowe hasło.');
      setLoading(false);
      return;
    }

    if (twoFAEnabled) {
      setStep('totp');
    } else {
      sessionStorage.setItem(SESSION_KEY, 'authenticated');
      navigate('/management-dashboard-secure-nr7x912/dashboard');
    }

    setLoading(false);
  };

  const handleTotpVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const code = totpCode.join('');
    try {
      const storedTotp = await base44.entities.AdminSettings.filter({ settingKey: 'totpSecret' });
      if (!storedTotp || !storedTotp[0]) {
        setError('Brak skonfigurowanego sekretu TOTP. Wyłącz i włącz 2FA ponownie w ustawieniach.');
        setLoading(false);
        return;
      }
      const valid = await verifyTotp(storedTotp[0].value, code);
      if (!valid) {
        setError('Nieprawidłowy kod TOTP. Sprawdź aplikację Authenticator.');
        setLoading(false);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, 'authenticated');
      navigate('/management-dashboard-secure-nr7x912/dashboard');
    } catch {
      setError('Błąd weryfikacji. Spróbuj ponownie.');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#000', color: '#fff' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div
            className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{ border: '1px solid rgba(255,193,7,0.4)', background: 'rgba(255,193,7,0.05)' }}
          >
            <span style={{ color: '#FFC107', fontSize: '1.5rem' }}>⚡</span>
          </div>
          <h1 className="font-heading font-black text-xl mb-1" style={{ color: '#FFC107', letterSpacing: '0.1em' }}>
            PANEL ADMINA
          </h1>
          <p className="font-ui text-xs" style={{ color: '#555', letterSpacing: '0.1em' }}>
            DOSTĘP ZASTRZEŻONY
          </p>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Hasło administratora"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-amber pr-12"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="font-body text-xs text-center" style={{ color: '#ff4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="font-ui font-bold text-sm py-4 uppercase tracking-widest transition-all duration-300 mt-2"
              style={{
                background: password ? '#FFC107' : 'rgba(255,193,7,0.15)',
                color: password ? '#000' : '#555',
                border: `1px solid ${password ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
                cursor: password ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Weryfikacja...' : 'Zaloguj się'}
            </button>

          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotpVerify} className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="font-ui text-sm mb-1" style={{ color: '#A1A1AA' }}>Weryfikacja dwuetapowa</p>
              <p className="font-body text-xs" style={{ color: '#555' }}>Wprowadź 6-cyfrowy kod z aplikacji Authenticator</p>
            </div>

            <TotpCodeInput
              value={totpCode.join('')}
              onChange={code => setTotpCode(Array.from({ length: 6 }, (_, index) => code[index] || ''))}
              inputRef={totpInputRef}
            />

            {error && (
              <p className="font-body text-xs text-center" style={{ color: '#ff4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || totpCode.join('').length < 6}
              className="w-full font-ui font-bold text-sm py-4 uppercase tracking-widest transition-all duration-300"
              style={{
                background: totpCode.join('').length === 6 ? '#FFC107' : 'rgba(255,193,7,0.15)',
                color: totpCode.join('').length === 6 ? '#000' : '#555',
                border: `1px solid ${totpCode.join('').length === 6 ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
                cursor: totpCode.join('').length === 6 ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Weryfikacja...' : 'Zweryfikuj kod'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setTotpCode(['','','','','','']); setError(''); }}
              className="font-ui text-xs"
              style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Wróć do logowania
            </button>
          </form>
        )}
      </div>
    </div>
  );
}