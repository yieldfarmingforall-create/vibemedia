import React, { useState, useEffect, useRef } from 'react'; // eslint-disable-line
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Type, Image, Briefcase, HelpCircle, Users, Settings,
  Plus, Trash2, Save, Upload, LogOut, ChevronDown, ChevronUp,
  Eye, EyeOff, Check, X, Calendar, Layers, ListOrdered
} from 'lucide-react';
import { generateTotpSecret, verifyTotp, buildOtpAuthUri } from '@/lib/totp';
import WysiwygEditor from '@/components/WysiwygEditor';

const SESSION_KEY = 'adminSession';

// ===== TAB: TEXT CMS =====
function TabText() {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});

  const defaultContent = [
    { pageKey: 'home.hero.h1', label: 'Strona główna – H1 (nagłówek Hero)', value: 'SKALUJ AGENCJĘ.\nZDOBYWAJ LEADY.' },
    { pageKey: 'home.hero.name', label: 'Strona główna – Imię i nazwisko pod H1', value: 'Norbert Rzepka' },
    { pageKey: 'home.reviews.title', label: 'Strona główna – Tytuł sekcji Opinie', value: 'Wyniki i opinie moich klientów' },
    { pageKey: 'home.contact.title', label: 'Strona główna – Tytuł sekcji Kontakt', value: 'Gotowy na wzrost?' },
    { pageKey: 'home.contact.desc', label: 'Strona główna – Opis sekcji Kontakt', value: 'Umów się na bezpłatną konsultację i dowiedz się, jak skalować swoją agencję z moją pomocą.' },
    { pageKey: 'services.title', label: 'Usługi – Tytuł strony', value: 'USŁUGI' },
    { pageKey: 'home.ticker.items', label: 'Pasek Ticker (hasła oddzielone |)', value: 'COLD E-MAIL & LINKEDIN | CIEPŁE LEADY B2B | KALENDARZ PEŁEN SPOTKAŃ | ROZMOWY NA KONKRETNĄ GODZINĘ | KWALIFIKACJA BUDŻETU', plain: true },
    { pageKey: 'home.intro.label', label: 'Intro – Etykieta', value: 'Przyjmujemy 3 nowych klientów w tym miesiącu' },
    { pageKey: 'home.intro.h2', label: 'Intro – Nagłówek', value: 'Pozyskujemy rozmowy sprzedażowe na konkretną godzinę — z klientami zainteresowanymi Twoją ofertą.' },
    { pageKey: 'home.intro.desc', label: 'Intro – Opis', value: 'Bez reklam i bez cold calli z Twojej strony. Zanim ktokolwiek trafi do Twojego kalendarza, rozmawiamy z nim 10–20 minut: badamy potrzeby, budżet i cele, przedstawiamy Twoją ofertę. Ty wchodzisz na rozmowę z kimś, kto wie, po co rozmawiacie — i chce kupić.' },
    { pageKey: 'home.intro.cta', label: 'Intro – Przycisk', value: 'Umów bezpłatną konsultację' },
    { pageKey: 'home.intro.link', label: 'Intro – Link obok', value: 'Zobacz jak kwalifikujemy' },
    { pageKey: 'home.intro.checklist', label: 'Intro – Checklist (oddzielone |)', value: 'Bez długoterminowych umów | Rozliczenie za efekty | Pierwsze rozmowy w 14 dni | Bez reklam i bez cold calli z Twojej strony', plain: true },
    { pageKey: 'home.problem.label', label: 'Problem – Etykieta', value: 'PROBLEM' },
    { pageKey: 'home.problem.h2', label: 'Problem – Nagłówek', value: 'Świetny w tym, co robisz — ale klienci nie pukają sami.' },
    { pageKey: 'home.problem.desc', label: 'Problem – Opis', value: 'Większość agencji i freelancerów utyka na tym samym pułapie, bo brakuje im systemu pozyskiwania klientów.' },
    { pageKey: 'home.solution.label', label: 'Rozwiązanie – Etykieta', value: 'ROZWIĄZANIE' },
    { pageKey: 'home.solution.h2', label: 'Rozwiązanie – Nagłówek', value: 'Kompletny system pozyskiwania — zrobiony za Ciebie.' },
    { pageKey: 'home.solution.desc', label: 'Rozwiązanie – Opis', value: 'Nie dostajesz listy kontaktów do obdzwonienia. Dostajesz spotkanie w kalendarzu z osobą, która wie, po co rozmawiacie.' },
    { pageKey: 'home.forwho.label', label: 'Dla kogo – Etykieta', value: 'DLA KOGO' },
    { pageKey: 'home.forwho.h2', label: 'Dla kogo – Nagłówek', value: 'Pracujemy z ludźmi, którzy sprzedają konkret.' },
    { pageKey: 'home.forwho.desc', label: 'Dla kogo – Opis', value: 'Nie umawiamy przypadkowych rozmów. Wybieramy leady, które mają realny budżet, jasny cel i pilny problem. Twoja rola: sprzedać. Nasza: dostarczyć rozmowę.' },
    { pageKey: 'home.process.label', label: 'Proces – Etykieta', value: 'JAK KWALIFIKUJEMY' },
    { pageKey: 'home.process.h2', label: 'Proces – Nagłówek', value: 'Każdy lead przechodzi przez nasze sito.' },
    { pageKey: 'home.process.desc', label: 'Proces – Opis', value: 'Pytamy o budżet, cele i bariery, zanim Ty w ogóle podniesiesz słuchawkę. Do Twojego kalendarza trafiają tylko rozmowy, które mają sens.' },
    { pageKey: 'home.rules.label', label: 'Zasady – Etykieta', value: 'ZASADY WSPÓŁPRACY' },
    { pageKey: 'home.rules.h2', label: 'Zasady – Nagłówek', value: 'Płacisz za efekty, nie za obietnice.' },
    { pageKey: 'home.guarantee.label', label: 'Gwarancja – Etykieta', value: 'GWARANCJA' },
    { pageKey: 'home.guarantee.h2', label: 'Gwarancja – Nagłówek', value: 'Ryzyko bierzemy na siebie.' },
    { pageKey: 'home.guarantee.desc', label: 'Gwarancja – Opis', value: 'Płacisz za rozmowy, które realnie się odbyły. Jeśli klient nie pojawi się na potwierdzonym spotkaniu — umawiamy zastępczy termin bez dodatkowych kosztów. Jeśli po pierwszym okresie uznasz, że to nie działa, kończysz współpracę z miesięcznym wypowiedzeniem. Bez kar, bez wieloletnich zobowiązań, bez drobnego druku.' },
    { pageKey: 'home.faq.label', label: 'FAQ – Etykieta', value: 'FAQ' },
    { pageKey: 'home.faq.h2', label: 'FAQ – Nagłówek', value: 'Wszystko, o co pytają przed startem.' },
    { pageKey: 'home.faq.subtitle', label: 'FAQ – Podnagłówek', value: 'Jeśli nie znajdziesz tu odpowiedzi — zadasz pytanie na bezpłatnej konsultacji.' },
    { pageKey: 'home.prefooter.h2', label: 'Przed stopką – Nagłówek', value: 'Nie znalazłeś odpowiedzi?' },
    { pageKey: 'home.prefooter.subtitle', label: 'Przed stopką – Podnagłówek', value: 'Zadaj pytanie na 15-minutowej, bezpłatnej konsultacji.' },
    { pageKey: 'home.prefooter.cta', label: 'Przed stopką – Przycisk', value: 'Umów bezpłatną konsultację' },
  ];

  useEffect(() => {
    base44.entities.PageContent.list().then(data => {
      const map = {};
      (data || []).forEach(d => { map[d.pageKey] = d; });
      const merged = defaultContent.map(def => map[def.pageKey] ? { ...def, ...map[def.pageKey] } : def);
      setItems(merged);
    });
  }, []);

  const handleChange = (idx, val) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], value: val };
      return next;
    });
  };

  const handleSave = async (item) => {
    setSaving(s => ({ ...s, [item.pageKey]: true }));
    try {
      const existing = await base44.entities.PageContent.filter({ pageKey: item.pageKey });
      if (existing && existing[0]) {
        await base44.entities.PageContent.update(existing[0].id, { value: item.value });
      } else {
        await base44.entities.PageContent.create({ pageKey: item.pageKey, value: item.value, label: item.label });
      }
      setSuccess(s => ({ ...s, [item.pageKey]: true }));
      setTimeout(() => setSuccess(s => ({ ...s, [item.pageKey]: false })), 2000);
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [item.pageKey]: false }));
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Zarządzanie tekstem strony</h2>
      {items.map((item, idx) => (
        <div key={item.pageKey} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
          <label className="font-ui text-xs uppercase tracking-widest block mb-2" style={{ color: '#A1A1AA' }}>
            {item.label}
          </label>
          {item.plain ? (
            <textarea value={item.value} onChange={e => handleChange(idx, e.target.value)} className="input-amber resize-none" rows={3} style={{ minHeight: '80px' }} />
          ) : (
            <WysiwygEditor
              value={item.value}
              onChange={val => handleChange(idx, val)}
              minHeight="80px"
            />
          )}
          <button
            onClick={() => handleSave(item)}
            className="mt-3 font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest transition-all duration-200 flex items-center gap-2"
            style={{
              background: success[item.pageKey] ? 'rgba(0,200,100,0.15)' : 'rgba(255,193,7,0.1)',
              color: success[item.pageKey] ? '#00C864' : '#FFC107',
              border: `1px solid ${success[item.pageKey] ? '#00C864' : 'rgba(255,193,7,0.3)'}`,
              cursor: 'pointer',
            }}
          >
            {success[item.pageKey] ? <><Check size={12} /> Zapisano</> : <><Save size={12} /> Zapisz</>}
            {saving[item.pageKey] && '...'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ===== TAB: REVIEWS CMS =====
function TabReviews() {
  const [reviews, setReviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editDesc, setEditDesc] = useState({});
  const fileRef = useRef(null);

  const load = () => base44.entities.Review.list('order', 100).then(data => setReviews(data || []));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const type = file.type.startsWith('video') ? 'video' : 'image';
        await base44.entities.Review.create({ type, fileUrl: file_url, description: '', order: reviews.length + 1 });
      } catch (e) { console.error(e); }
    }
    setUploading(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Usunąć tę opinię?')) return;
    await base44.entities.Review.delete(id);
    load();
  };

  const handleSaveDesc = async (review) => {
    await base44.entities.Review.update(review.id, { description: editDesc[review.id] ?? review.description });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Zarządzanie opiniami (CMS)</h2>
        <label
          className="font-ui font-bold text-xs px-4 py-3 uppercase tracking-widest transition-all duration-200 flex items-center gap-2 cursor-pointer"
          style={{ background: uploading ? 'rgba(255,193,7,0.2)' : '#FFC107', color: uploading ? '#FFC107' : '#000', border: '1px solid #FFC107' }}
        >
          <Upload size={14} />
          {uploading ? 'Przesyłanie...' : 'Dodaj plik'}
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {reviews.length === 0 && (
        <p className="font-body text-sm" style={{ color: '#555' }}>Brak opinii. Dodaj pierwsze zdjęcie lub wideo.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(review => (
          <div key={review.id} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="font-ui text-xs px-2 py-1" style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)' }}>
                {review.type === 'image' ? '📷 Zdjęcie' : '🎥 Wideo'}
              </span>
              <button onClick={() => handleDelete(review.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#666'}>
                <Trash2 size={16} />
              </button>
            </div>
            {review.type === 'image'
              ? <img src={review.fileUrl} alt="" className="w-full rounded mb-3" style={{ maxHeight: '120px', objectFit: 'cover', border: '1px solid rgba(255,193,7,0.1)' }} />
              : <video src={review.fileUrl} className="w-full rounded mb-3" style={{ maxHeight: '120px', objectFit: 'cover', border: '1px solid rgba(255,193,7,0.1)' }} />
            }
            <label className="font-ui text-xs uppercase tracking-widest block mb-2" style={{ color: '#A1A1AA' }}>Opis (WYSIWYG)</label>
            <WysiwygEditor
              value={editDesc[review.id] ?? review.description ?? ''}
              onChange={val => setEditDesc(d => ({ ...d, [review.id]: val }))}
            />
            <button onClick={() => handleSaveDesc(review)}
              className="mt-2 font-ui text-xs px-3 py-2 flex items-center gap-1 transition-all duration-200"
              style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}>
              <Save size={11} /> Zapisz opis
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TAB: SERVICES =====
function TabServices() {
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(null);

  const defaultServices = [
    { name: 'Wsparcie freelancerskie', description: 'Kompleksowe wsparcie dla freelancerów chcących skalować swoją działalność i pozyskiwać więcej klientów.', price: 49900, order: 1 },
    { name: 'Wsparcie agencyjne', description: 'Strategiczne wsparcie dla właścicieli agencji marketingowych. Systemy, procesy i pozyskiwanie leadów.', price: 99900, order: 2 },
    { name: 'Mentoring', description: 'Indywidualny mentoring 1:1. Wspólnie budujemy Twoją strategię wzrostu i eliminujemy bariery.', price: 149900, order: 3 },
    { name: 'Konsultacja', description: 'Jednorazowa sesja strategiczna. Analizujemy Twój biznes i wyznaczamy konkretny plan działania.', price: 29900, order: 4 },
  ];

  const load = async () => {
    const data = await base44.entities.Service.list('order', 10);
    if (data && data.length > 0) {
      setServices(data);
    } else {
      // Seed defaults
      for (const svc of defaultServices) {
        await base44.entities.Service.create(svc);
      }
      const fresh = await base44.entities.Service.list('order', 10);
      setServices(fresh || []);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (idx, field, val) => {
    setServices(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === 'price' ? Math.round((parseFloat(val) || 0) * 100) : val };
      return next;
    });
  };

  const handleSave = async (svc, idx) => {
    setSaving(idx);
    await base44.entities.Service.update(svc.id, { name: svc.name, description: svc.description, price: svc.price });
    setSaving(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Zarządzanie usługami</h2>
      {services.map((svc, idx) => (
        <div key={svc.id} className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Nazwa usługi</label>
              <input type="text" value={svc.name} onChange={e => handleChange(idx, 'name', e.target.value)} className="input-amber" />
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Cena (w PLN)</label>
              <input type="number" value={svc.price / 100} onChange={e => handleChange(idx, 'price', e.target.value)} className="input-amber" step="1" min="0" />
            </div>
          </div>
          <div className="mb-4 p-3" style={{ background: 'rgba(255,193,7,0.04)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <p className="font-ui text-xs uppercase tracking-widest mb-1" style={{ color: '#555' }}>Stripe</p>
            <p className="font-body text-xs" style={{ color: '#A1A1AA', lineHeight: 1.6 }}>
              ✓ Cena jest automatycznie przekazywana do Stripe Checkout na podstawie pola "Cena (w PLN)" powyżej. Nie musisz konfigurować Price ID.
            </p>
          </div>
          <div className="mb-4">
            <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Opis</label>
            <WysiwygEditor
              value={svc.description}
              onChange={val => handleChange(idx, 'description', val)}
              minHeight="100px"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-ui text-xs" style={{ color: '#555' }}>
              Cena: {(svc.price / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </span>
            <button onClick={() => handleSave(svc, idx)}
              className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest flex items-center gap-2 transition-all duration-200"
              style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}>
              {saving === idx ? 'Zapisywanie...' : <><Save size={12} /> Zapisz</>}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== TAB: QUESTIONS =====
function TabQuestions() {
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState({ text: '', type: 'open', options: ['', '', '', ''] });
  const [adding, setAdding] = useState(false);

  const load = () => base44.entities.SurveyQuestion.list('order', 50).then(d => setQuestions(d || []));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newQ.text.trim()) return;
    setAdding(true);
    const payload = {
      text: newQ.text,
      type: newQ.type,
      order: questions.length + 1,
      options: newQ.type === 'closed' ? newQ.options.filter(o => o.trim()) : [],
    };
    await base44.entities.SurveyQuestion.create(payload);
    setNewQ({ text: '', type: 'open', options: ['', '', '', ''] });
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Usunąć pytanie?')) return;
    await base44.entities.SurveyQuestion.delete(id);
    load();
  };

  const updateOption = (idx, val) => {
    setNewQ(q => {
      const opts = [...q.options];
      opts[idx] = val;
      return { ...q, options: opts };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Konfigurator pytań do ankiety</h2>

      {/* Existing questions */}
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={q.id} className="p-4 flex items-start justify-between gap-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-ui text-xs font-bold" style={{ color: '#FFC107' }}>#{i + 1}</span>
                <span className="font-ui text-xs px-2 py-0.5" style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.2)' }}>
                  {q.type === 'open' ? 'Otwarte' : 'Zamknięte ABCD'}
                </span>
              </div>
              <p className="font-body text-sm" style={{ color: '#DDD' }}>{q.text}</p>
              {q.type === 'closed' && q.options && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.options.map((opt, oi) => (
                    <span key={oi} className="font-ui text-xs px-2 py-1" style={{ border: '1px solid rgba(255,193,7,0.2)', color: '#A1A1AA' }}>
                      {['A','B','C','D'][oi]}: {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleDelete(q.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#666'}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="font-body text-sm" style={{ color: '#555' }}>Brak pytań. Dodaj pierwsze poniżej.</p>
        )}
      </div>

      {/* Add new question */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Dodaj pytanie</h3>
        <div className="flex flex-col gap-4">
          <textarea
            value={newQ.text}
            onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))}
            placeholder="Treść pytania..."
            rows={2}
            className="input-amber resize-none"
          />
          <div className="flex gap-3">
            {['open', 'closed'].map(t => (
              <button
                key={t}
                onClick={() => setNewQ(q => ({ ...q, type: t }))}
                className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest transition-all duration-200"
                style={{
                  background: newQ.type === t ? '#FFC107' : 'transparent',
                  color: newQ.type === t ? '#000' : '#FFC107',
                  border: '1px solid rgba(255,193,7,0.5)',
                  cursor: 'pointer',
                }}
              >
                {t === 'open' ? 'Otwarte' : 'Zamknięte ABCD'}
              </button>
            ))}
          </div>
          {newQ.type === 'closed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {newQ.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-ui font-bold text-xs w-5 text-center flex-shrink-0" style={{ color: '#FFC107' }}>
                    {['A','B','C','D'][i]}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Odpowiedź ${['A','B','C','D'][i]}`}
                    className="input-amber flex-1"
                  />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={!newQ.text.trim() || adding}
            className="font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2 transition-all duration-200 self-start"
            style={{
              background: newQ.text.trim() ? '#FFC107' : 'rgba(255,193,7,0.15)',
              color: newQ.text.trim() ? '#000' : '#555',
              border: `1px solid ${newQ.text.trim() ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
              cursor: newQ.text.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={14} /> {adding ? 'Dodawanie...' : 'Dodaj pytanie'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== TAB: CALENDAR SLOTS =====
function TabSlots() {
  const [slots, setSlots] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newTimes, setNewTimes] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const load = () => base44.entities.AvailableSlot.list('-date', 200).then(d => setSlots(d || []));
  useEffect(() => { load(); }, []);

  const handleAddSlots = async () => {
    if (!newDate || !newTimes.trim()) return;
    setSaving(true);
    const times = newTimes.split(',').map(t => t.trim()).filter(t => t.match(/^\d{2}:\d{2}$/));
    for (const time of times) {
      const exists = slots.find(s => s.date === newDate && s.time === time);
      if (!exists) {
        await base44.entities.AvailableSlot.create({ date: newDate, time, isBooked: false });
      }
    }
    setNewDate('');
    setNewTimes('');
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.AvailableSlot.delete(id);
    load();
  };

  const handleToggleBooked = async (slot) => {
    await base44.entities.AvailableSlot.update(slot.id, { isBooked: !slot.isBooked });
    load();
  };

  const grouped = {};
  slots.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });

  const dates = Object.keys(grouped).filter(d => !filterDate || d === filterDate).sort();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Zarządzanie slotami kalendarza</h2>

      {/* Add slots */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Dodaj sloty</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Data</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input-amber" />
          </div>
          <div className="sm:col-span-2">
            <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>
              Godziny (format HH:MM, oddzielone przecinkami)
            </label>
            <input
              type="text"
              value={newTimes}
              onChange={e => setNewTimes(e.target.value)}
              placeholder="09:00, 11:00, 13:00, 15:00"
              className="input-amber"
            />
          </div>
        </div>
        <button
          onClick={handleAddSlots}
          disabled={!newDate || !newTimes.trim() || saving}
          className="font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2 transition-all duration-200"
          style={{
            background: newDate && newTimes ? '#FFC107' : 'rgba(255,193,7,0.15)',
            color: newDate && newTimes ? '#000' : '#555',
            border: `1px solid ${newDate && newTimes ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
            cursor: newDate && newTimes ? 'pointer' : 'not-allowed',
          }}
        >
          <Plus size={14} /> {saving ? 'Dodawanie...' : 'Dodaj sloty'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="font-ui text-xs uppercase tracking-widest" style={{ color: '#A1A1AA' }}>Filtr daty:</label>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-amber" style={{ width: 'auto' }} />
        {filterDate && <button onClick={() => setFilterDate('')} style={{ color: '#FFC107', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem' }}>Wyczyść</button>}
      </div>

      {/* Slot list */}
      {dates.length === 0 && (
        <p className="font-body text-sm" style={{ color: '#555' }}>Brak slotów. Dodaj pierwsze sloty powyżej.</p>
      )}
      {dates.map(date => (
        <div key={date} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
          <h4 className="font-heading font-bold text-sm mb-3" style={{ color: '#FFC107' }}>{date}</h4>
          <div className="flex flex-wrap gap-2">
            {(grouped[date] || []).sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
              <div key={slot.id} className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleBooked(slot)}
                  className="font-ui text-xs px-3 py-2 transition-all duration-200"
                  style={{
                    background: slot.isBooked ? 'rgba(255,50,50,0.1)' : 'rgba(255,193,7,0.07)',
                    color: slot.isBooked ? '#ff6666' : '#FFC107',
                    border: `1px solid ${slot.isBooked ? 'rgba(255,50,50,0.4)' : 'rgba(255,193,7,0.4)'}`,
                    cursor: 'pointer',
                    textDecoration: slot.isBooked ? 'line-through' : 'none',
                  }}
                  title={slot.isBooked ? 'Zaznaczony jako zajęty – kliknij aby odblokować' : 'Wolny – kliknij aby oznaczyć jako zajęty'}
                >
                  {slot.time} {slot.isBooked ? '🔒' : '✓'}
                </button>
                <button onClick={() => handleDelete(slot.id)} style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== TAB: MEETINGS =====
function TabMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [meta, setMeta] = useState({ header: '', badge: '', footer: '' });
  const [newM, setNewM] = useState({ initials: '', name: '', role: '', time: '' });
  const [saving, setSaving] = useState(null);
  const [metaSaving, setMetaSaving] = useState(false);

  const DEFAULTS = [
    { initials: 'AK', name: 'Anna K.',  role: 'CEO · e-commerce, moda',  time: 'DZIŚ 14:00', order: 1 },
    { initials: 'MN', name: 'Marek N.', role: 'Head of Growth · SaaS',   time: 'JUTRO 10:30', order: 2 },
    { initials: 'JW', name: 'Julia W.', role: 'Founder · usługi B2B',    time: 'PT 16:00', order: 3 },
  ];

  const load = async () => {
    const [ms, cs] = await Promise.all([
      base44.entities.Meeting.list('order', 20),
      base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.meetings\\.' } }),
    ]);
    if (ms && ms.length) {
      setMeetings(ms);
    } else {
      for (const d of DEFAULTS) await base44.entities.Meeting.create(d);
      const fresh = await base44.entities.Meeting.list('order', 20);
      setMeetings(fresh || []);
    }
    const map = {};
    (cs || []).forEach(c => { map[c.pageKey] = c; });
    setMeta({
      header: map['home.meetings.header']?.value || 'Nadchodzące spotkania',
      badge: map['home.meetings.badge']?.value || 'Na żywo',
      footer: map['home.meetings.footer']?.value || 'wizualizacja przykładowa',
    });
  };

  useEffect(() => { load(); }, []);

  const handleChange = (id, field, val) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const handleSave = async (m) => {
    setSaving(m.id);
    await base44.entities.Meeting.update(m.id, { initials: m.initials, name: m.name, role: m.role, time: m.time });
    setSaving(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Usunąć to spotkanie?')) return;
    await base44.entities.Meeting.delete(id);
    load();
  };

  const handleAdd = async () => {
    if (!newM.name.trim() || !newM.time.trim()) return;
    await base44.entities.Meeting.create({ ...newM, order: meetings.length + 1 });
    setNewM({ initials: '', name: '', role: '', time: '' });
    load();
  };

  const saveMetaItem = async (key, value) => {
    const existing = await base44.entities.PageContent.filter({ pageKey: key });
    if (existing && existing[0]) {
      await base44.entities.PageContent.update(existing[0].id, { value });
    } else {
      await base44.entities.PageContent.create({ pageKey: key, value });
    }
  };

  const handleSaveMeta = async () => {
    setMetaSaving(true);
    await Promise.all([
      saveMetaItem('home.meetings.header', meta.header),
      saveMetaItem('home.meetings.badge', meta.badge),
      saveMetaItem('home.meetings.footer', meta.footer),
    ]);
    setMetaSaving(false);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Nadchodzące spotkania (Hero)</h2>

      {/* Card texts */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Teksty karty</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Nagłówek</label>
            <input type="text" value={meta.header} onChange={e => setMeta(m => ({ ...m, header: e.target.value }))} className="input-amber" />
          </div>
          <div>
            <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Znacznik (badge)</label>
            <input type="text" value={meta.badge} onChange={e => setMeta(m => ({ ...m, badge: e.target.value }))} className="input-amber" />
          </div>
          <div>
            <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Stopka</label>
            <input type="text" value={meta.footer} onChange={e => setMeta(m => ({ ...m, footer: e.target.value }))} className="input-amber" />
          </div>
        </div>
        <button onClick={handleSaveMeta}
          className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest flex items-center gap-2 transition-all duration-200"
          style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}>
          <Save size={12} /> {metaSaving ? 'Zapisywanie...' : 'Zapisz teksty'}
        </button>
      </div>

      {/* Meetings list */}
      <div className="flex flex-col gap-3">
        {meetings.map((m, i) => (
          <div key={m.id} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <div className="flex items-center mb-3">
              <span className="font-ui text-xs font-bold" style={{ color: '#FFC107' }}>#{i + 1}</span>
              <button onClick={() => handleDelete(m.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#666'}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Inicjały</label>
                <input type="text" value={m.initials} onChange={e => handleChange(m.id, 'initials', e.target.value)} className="input-amber" maxLength={3} />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Imię i nazwisko</label>
                <input type="text" value={m.name} onChange={e => handleChange(m.id, 'name', e.target.value)} className="input-amber" />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Rola / opis</label>
                <input type="text" value={m.role} onChange={e => handleChange(m.id, 'role', e.target.value)} className="input-amber" />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Data / godzina</label>
                <input type="text" value={m.time} onChange={e => handleChange(m.id, 'time', e.target.value)} className="input-amber" />
              </div>
            </div>
            <button onClick={() => handleSave(m)}
              className="mt-3 font-ui text-xs px-3 py-2 flex items-center gap-1 transition-all duration-200"
              style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}>
              <Save size={11} /> {saving === m.id ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Dodaj spotkanie</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <input type="text" placeholder="Inicjały" value={newM.initials} onChange={e => setNewM(m => ({ ...m, initials: e.target.value }))} className="input-amber" maxLength={3} />
          <input type="text" placeholder="Imię i nazwisko" value={newM.name} onChange={e => setNewM(m => ({ ...m, name: e.target.value }))} className="input-amber" />
          <input type="text" placeholder="Rola / opis" value={newM.role} onChange={e => setNewM(m => ({ ...m, role: e.target.value }))} className="input-amber" />
          <input type="text" placeholder="Data / godzina" value={newM.time} onChange={e => setNewM(m => ({ ...m, time: e.target.value }))} className="input-amber" />
        </div>
        <button onClick={handleAdd} disabled={!newM.name.trim() || !newM.time.trim()}
          className="font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2 transition-all duration-200"
          style={{
            background: newM.name && newM.time ? '#FFC107' : 'rgba(255,193,7,0.15)',
            color: newM.name && newM.time ? '#000' : '#555',
            border: `1px solid ${newM.name && newM.time ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
            cursor: newM.name && newM.time ? 'pointer' : 'not-allowed',
          }}>
          <Plus size={14} /> Dodaj spotkanie
        </button>
      </div>
    </div>
  );
}

// ===== TAB: CRM =====
function TabCRM() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => Promise.all([
    base44.entities.Client.list('-created_date', 200),
    base44.entities.Service.list('order', 10),
  ]).then(([cls, svcs]) => {
    setClients(cls || []);
    const map = {};
    (svcs || []).forEach(s => { map[s.id] = s; });
    setServices(map);
  });

  useEffect(() => { load(); }, []);

  const handleMarkPaid = async (e, clientId) => {
    e.stopPropagation();
    setUpdatingId(clientId);
    await base44.entities.Client.update(clientId, { paymentStatus: 'paid' });
    setUpdatingId(null);
    load();
  };

  const handleMarkPending = async (e, clientId) => {
    e.stopPropagation();
    setUpdatingId(clientId);
    await base44.entities.Client.update(clientId, { paymentStatus: 'pending' });
    setUpdatingId(null);
    load();
  };

  const STATUS_BADGE = {
    paid: { label: '✓ Opłacone', color: '#00C864', bg: 'rgba(0,200,100,0.1)', border: 'rgba(0,200,100,0.3)' },
    pending: { label: '⏳ Oczekuje', color: '#FFC107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.3)' },
    failed: { label: '✕ Nieudane', color: '#ff4444', bg: 'rgba(255,50,50,0.08)', border: 'rgba(255,50,50,0.3)' },
  };

  const filtered = statusFilter === 'all' ? clients : clients.filter(c => c.paymentStatus === statusFilter);
  const counts = { all: clients.length, paid: clients.filter(c => c.paymentStatus === 'paid').length, pending: clients.filter(c => c.paymentStatus === 'pending').length };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Klienci (CRM)</h2>
        <div className="flex gap-2 flex-wrap">
          {[['all', `Wszyscy (${counts.all})`], ['paid', `Opłaceni (${counts.paid})`], ['pending', `Oczekujący (${counts.pending})`]].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className="font-ui text-xs px-3 py-1 transition-all duration-200"
              style={{
                background: statusFilter === val ? '#FFC107' : 'transparent',
                color: statusFilter === val ? '#000' : '#FFC107',
                border: '1px solid rgba(255,193,7,0.4)',
                cursor: 'pointer',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="font-body text-sm" style={{ color: '#555' }}>Brak klientów.</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((client, i) => {
          const isOpen = expanded === client.id;
          const svc = services[client.serviceId];
          const badge = STATUS_BADGE[client.paymentStatus] || STATUS_BADGE.pending;
          let answers = [];
          try { answers = JSON.parse(client.surveyAnswers || '[]'); } catch {}

          return (
            <div key={client.id} className="crm-row" style={{ border: '1px solid rgba(255,193,7,0.1)', borderRadius: '4px' }}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer gap-2"
                onClick={() => setExpanded(isOpen ? null : client.id)}
              >
                <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                  <span className="font-ui font-bold text-xs flex-shrink-0" style={{ color: '#555' }}>#{i + 1}</span>
                  <span className="font-heading font-bold text-sm" style={{ color: '#FFF' }}>
                    {client.contactName || 'Brak danych'}
                  </span>
                  <span className="font-ui text-xs hidden sm:block" style={{ color: '#A1A1AA' }}>{client.contactEmail}</span>
                  <span className="font-ui text-xs px-2 py-0.5 flex-shrink-0" style={{ background: 'rgba(255,193,7,0.08)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.2)' }}>
                    {svc?.name || '—'}
                  </span>
                  {/* Payment status badge */}
                  <span className="font-ui text-xs px-2 py-0.5 flex-shrink-0" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Manual payment toggle */}
                  {client.paymentStatus !== 'paid' && (
                    <button
                      onClick={e => handleMarkPaid(e, client.id)}
                      disabled={updatingId === client.id}
                      className="font-ui text-xs px-2 py-1 flex-shrink-0"
                      style={{ background: 'rgba(0,200,100,0.1)', color: '#00C864', border: '1px solid rgba(0,200,100,0.3)', cursor: 'pointer' }}
                      title="Oznacz jako opłacone"
                    >
                      {updatingId === client.id ? '...' : '✓ Opłać'}
                    </button>
                  )}
                  {client.paymentStatus === 'paid' && (
                    <button
                      onClick={e => handleMarkPending(e, client.id)}
                      disabled={updatingId === client.id}
                      className="font-ui text-xs px-2 py-1 flex-shrink-0"
                      style={{ background: 'rgba(255,50,50,0.07)', color: '#ff6666', border: '1px solid rgba(255,50,50,0.2)', cursor: 'pointer' }}
                      title="Cofnij status płatności"
                    >
                      {updatingId === client.id ? '...' : '↩ Cofnij'}
                    </button>
                  )}
                  {isOpen ? <ChevronUp size={16} style={{ color: '#FFC107' }} /> : <ChevronDown size={16} style={{ color: '#555' }} />}
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div style={{ borderTop: '1px solid rgba(255,193,7,0.1)', paddingTop: '1rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Email</label>
                        <p className="font-body text-sm" style={{ color: '#FFF' }}>{client.contactEmail || '—'}</p>
                      </div>
                      <div>
                        <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Telefon</label>
                        <p className="font-body text-sm" style={{ color: '#FFF' }}>{client.contactPhone || '—'}</p>
                      </div>
                      <div>
                        <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Termin</label>
                        <p className="font-body text-sm" style={{ color: '#FFF' }}>{client.slotDate} {client.slotTime}</p>
                      </div>
                    </div>
                    {client.stripeSessionId && (
                      <div className="mb-4 p-3" style={{ background: 'rgba(255,193,7,0.03)', border: '1px solid rgba(255,193,7,0.1)', borderRadius: '2px' }}>
                        <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Stripe Session ID</label>
                        <code className="font-ui text-xs" style={{ color: '#FFC107' }}>{client.stripeSessionId}</code>
                        <p className="font-body text-xs mt-1" style={{ color: '#555' }}>
                          Zweryfikuj w{' '}
                          <a href={`https://dashboard.stripe.com/payments`} target="_blank" rel="noreferrer"
                            style={{ color: '#FFC107', textDecoration: 'underline' }}>
                            Stripe Dashboard
                          </a>
                          {' '}— wyszukaj po client_reference_id: <code style={{ color: '#FFC107' }}>{client.id}</code>
                        </p>
                      </div>
                    )}
                    {!client.stripeSessionId && (
                      <div className="mb-4 p-3" style={{ background: 'rgba(255,193,7,0.03)', border: '1px solid rgba(255,193,7,0.1)', borderRadius: '2px' }}>
                        <p className="font-body text-xs" style={{ color: '#555' }}>
                          Aby zweryfikować płatność w Stripe, wyszukaj po <strong style={{ color: '#FFC107' }}>client_reference_id: {client.id}</strong> w{' '}
                          <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer" style={{ color: '#FFC107', textDecoration: 'underline' }}>Stripe Dashboard</a>.
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="font-ui text-xs uppercase tracking-widest block mb-3" style={{ color: '#A1A1AA' }}>Odpowiedzi ankiety</label>
                      {answers.length === 0 ? (
                        <p className="font-body text-xs" style={{ color: '#555' }}>Brak odpowiedzi.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {answers.map((a, ai) => (
                            <div key={ai} className="p-3" style={{ background: 'rgba(255,193,7,0.03)', border: '1px solid rgba(255,193,7,0.08)', borderRadius: '2px' }}>
                              <p className="font-ui text-xs font-bold mb-1" style={{ color: '#FFC107' }}>Pyt. {ai + 1}: {a.questionText}</p>
                              <p className="font-body text-sm" style={{ color: '#CCC' }}>{a.answer || '—'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TotpInput({ state, setState, refs }) {
  const handleChange = (index, value) => {
    const digits = value.replace(/\D/g, '');
    const digit = digits.slice(-1);
    setState(previous => {
      const next = [...previous];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      requestAnimationFrame(() => refs.current[index + 1]?.focus());
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !state[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setState(Array.from({ length: 6 }, (_, index) => pasted[index] || ''));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2">
      {state.map((digit, index) => (
        <input
          key={index}
          ref={element => { refs.current[index] = element; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={event => handleChange(index, event.target.value)}
          onKeyDown={event => handleKeyDown(index, event)}
          onPaste={index === 0 ? handlePaste : undefined}
          className={`totp-box ${digit ? 'filled' : ''}`}
          style={{ width: 40, height: 48 }}
        />
      ))}
    </div>
  );
}

// ===== TAB: SETTINGS =====
function TabSettings() {
  const navigate = useNavigate();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [totpToDisable, setTotpToDisable] = useState(['','','','','','']);
  const totpDisableRefs = useRef([]);
  const [passMsg, setPassMsg] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  // Setup flow state
  const [setupSecret, setSetupSecret] = useState(null);
  const [setupQrUrl, setSetupQrUrl] = useState(null);
  const [setupCode, setSetupCode] = useState(['','','','','','']);
  const setupRefs = useRef([]);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    base44.entities.AdminSettings.filter({ settingKey: 'twoFAEnabled' }).then(data => {
      setTwoFAEnabled(data && data[0] ? data[0].value === 'true' : false);
    });
  }, []);

  useEffect(() => {
    if (showSetup) setupRefs.current[0]?.focus();
  }, [showSetup]);

  useEffect(() => {
    if (showDisableForm) totpDisableRefs.current[0]?.focus();
  }, [showDisableForm]);

  const saveOrUpdate = async (key, value) => {
    const existing = await base44.entities.AdminSettings.filter({ settingKey: key });
    if (existing && existing[0]) {
      await base44.entities.AdminSettings.update(existing[0].id, { value: String(value) });
    } else {
      await base44.entities.AdminSettings.create({ settingKey: key, value: String(value) });
    }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) { setPassMsg('Hasła się nie zgadzają.'); return; }
    if (newPass.length < 8) { setPassMsg('Hasło musi mieć minimum 8 znaków.'); return; }
    await saveOrUpdate('adminPassword', newPass);
    setPassMsg('Hasło zmienione pomyślnie.');
    setNewPass(''); setConfirmPass('');
    setTimeout(() => setPassMsg(''), 3000);
  };

  const handleEnable2FA = async () => {
    // Generate a fresh secret and show QR code for scanning
    const secret = generateTotpSecret();
    const uri = buildOtpAuthUri(secret);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
    setSetupSecret(secret);
    setSetupQrUrl(qrUrl);
    setSetupCode(['','','','','','']);
    setShowSetup(true);
    setTwoFAMsg('');
  };

  const handleConfirmSetup = async () => {
    const code = setupCode.join('');
    const valid = await verifyTotp(setupSecret, code);
    if (!valid) {
      setTwoFAMsg('Nieprawidłowy kod. Upewnij się, że zeskanowałeś kod QR i wpisujesz aktualny kod z aplikacji.');
      return;
    }
    // Save secret and enable 2FA
    await saveOrUpdate('totpSecret', setupSecret);
    await saveOrUpdate('twoFAEnabled', 'true');
    setTwoFAEnabled(true);
    setShowSetup(false);
    setSetupSecret(null);
    setSetupQrUrl(null);
    setTwoFAMsg('✓ 2FA zostało włączone pomyślnie!');
    setTimeout(() => setTwoFAMsg(''), 4000);
  };

  const handleDisable2FA = async () => {
    const code = totpToDisable.join('');
    const stored = await base44.entities.AdminSettings.filter({ settingKey: 'totpSecret' });
    if (!stored || !stored[0]) {
      setTwoFAMsg('Błąd: brak sekretu TOTP.');
      return;
    }
    const valid = await verifyTotp(stored[0].value, code);
    if (!valid) {
      setTwoFAMsg('Nieprawidłowy kod TOTP. Spróbuj ponownie.');
      return;
    }
    await saveOrUpdate('twoFAEnabled', 'false');
    setTwoFAEnabled(false);
    setShowDisableForm(false);
    setTotpToDisable(['','','','','','']);
    setTwoFAMsg('2FA zostało wyłączone.');
    setTimeout(() => setTwoFAMsg(''), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/management-dashboard-secure-nr7x912');
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Ustawienia</h2>

      {/* Change password */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Zmiana hasła</h3>
        <div className="flex flex-col gap-3 max-w-sm">
          <input type="password" placeholder="Nowe hasło" value={newPass} onChange={e => setNewPass(e.target.value)} className="input-amber" />
          <input type="password" placeholder="Potwierdź nowe hasło" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="input-amber" />
          {passMsg && <p className="font-body text-xs" style={{ color: passMsg.includes('pomyślnie') ? '#00C864' : '#ff4444' }}>{passMsg}</p>}
          <button onClick={handleChangePassword}
            className="font-ui font-bold text-xs px-4 py-3 uppercase tracking-widest flex items-center gap-2 transition-all duration-200 self-start"
            style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}>
            <Save size={12} /> Zmień hasło
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-ui font-bold text-sm uppercase tracking-widest" style={{ color: '#FFC107' }}>Weryfikacja dwuetapowa (2FA)</h3>
          {!showSetup && !showDisableForm && (
            <button
              onClick={twoFAEnabled ? () => { setShowDisableForm(true); setTwoFAMsg(''); } : handleEnable2FA}
              className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest transition-all duration-200"
              style={{
                background: twoFAEnabled ? 'rgba(255,50,50,0.1)' : 'rgba(255,193,7,0.1)',
                color: twoFAEnabled ? '#ff6666' : '#FFC107',
                border: `1px solid ${twoFAEnabled ? 'rgba(255,50,50,0.4)' : 'rgba(255,193,7,0.3)'}`,
                cursor: 'pointer',
              }}
            >
              {twoFAEnabled ? 'Wyłącz 2FA' : 'Włącz 2FA'}
            </button>
          )}
        </div>
        <p className="font-body text-xs mb-4" style={{ color: '#555' }}>
          Status: <strong style={{ color: twoFAEnabled ? '#00C864' : '#555' }}>{twoFAEnabled ? '🔐 WŁĄCZONE' : '🔓 WYŁĄCZONE'}</strong>
        </p>

        {/* Setup flow — scan QR then confirm */}
        {showSetup && setupSecret && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="p-4" style={{ background: 'rgba(255,193,7,0.04)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '4px' }}>
              <p className="font-ui font-bold text-xs uppercase tracking-widest mb-3" style={{ color: '#FFC107' }}>
                Krok 1 – Zeskanuj kod QR w Google Authenticator lub Authy
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <img src={setupQrUrl} alt="QR kod TOTP" width={160} height={160}
                  style={{ border: '2px solid rgba(255,193,7,0.4)', borderRadius: '4px', background: '#fff', padding: 4 }} />
                <div>
                  <p className="font-body text-xs mb-2" style={{ color: '#A1A1AA', lineHeight: 1.7 }}>
                    Jeśli nie możesz zeskanować, wpisz ręcznie ten sekret w aplikacji:
                  </p>
                  <code className="font-ui text-xs px-3 py-2 block" style={{ background: '#111', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', borderRadius: '2px', wordBreak: 'break-all', letterSpacing: '0.1em' }}>
                    {setupSecret}
                  </code>
                </div>
              </div>
            </div>
            <div>
              <p className="font-ui font-bold text-xs uppercase tracking-widest mb-2" style={{ color: '#FFC107' }}>
                Krok 2 – Potwierdź kodem z aplikacji
              </p>
              <p className="font-body text-xs mb-3" style={{ color: '#A1A1AA' }}>Wpisz 6-cyfrowy kod który widzisz w aplikacji, aby potwierdzić konfigurację:</p>
              <TotpInput state={setupCode} setState={setSetupCode} refs={setupRefs} />
            </div>
            {twoFAMsg && <p className="font-body text-xs" style={{ color: '#ff4444' }}>{twoFAMsg}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSetup}
                disabled={setupCode.join('').length < 6}
                className="font-ui font-bold text-xs px-4 py-3 uppercase tracking-widest flex items-center gap-2"
                style={{
                  background: setupCode.join('').length === 6 ? '#FFC107' : 'rgba(255,193,7,0.15)',
                  color: setupCode.join('').length === 6 ? '#000' : '#555',
                  border: `1px solid ${setupCode.join('').length === 6 ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
                  cursor: setupCode.join('').length === 6 ? 'pointer' : 'not-allowed',
                }}
              >
                <Check size={12} /> Aktywuj 2FA
              </button>
              <button onClick={() => { setShowSetup(false); setSetupSecret(null); setSetupQrUrl(null); setTwoFAMsg(''); }}
                className="font-ui text-xs px-4 py-3"
                style={{ background: 'transparent', color: '#555', border: '1px solid #333', cursor: 'pointer' }}>
                Anuluj
              </button>
            </div>
          </div>
        )}

        {/* Disable flow */}
        {showDisableForm && (
          <div className="animate-fade-in">
            <p className="font-body text-xs mb-3" style={{ color: '#A1A1AA' }}>
              Wprowadź aktualny kod TOTP z aplikacji, aby wyłączyć 2FA:
            </p>
            <TotpInput state={totpToDisable} setState={setTotpToDisable} refs={totpDisableRefs} />
            {twoFAMsg && <p className="mt-2 font-body text-xs" style={{ color: '#ff4444' }}>{twoFAMsg}</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={handleDisable2FA}
                className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest flex items-center gap-2"
                style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6666', border: '1px solid rgba(255,50,50,0.3)', cursor: 'pointer' }}>
                Wyłącz 2FA
              </button>
              <button onClick={() => { setShowDisableForm(false); setTotpToDisable(['','','','','','']); setTwoFAMsg(''); }}
                className="font-ui text-xs px-4 py-2"
                style={{ background: 'transparent', color: '#555', border: '1px solid #333', cursor: 'pointer' }}>
                Anuluj
              </button>
            </div>
          </div>
        )}

        {twoFAMsg && !showSetup && !showDisableForm && (
          <p className="mt-3 font-body text-xs" style={{ color: twoFAMsg.includes('✓') || twoFAMsg.includes('wyłączone') ? '#00C864' : '#ff4444' }}>{twoFAMsg}</p>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="self-start font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2 transition-all duration-200"
        style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6666', border: '1px solid rgba(255,50,50,0.3)', cursor: 'pointer' }}>
        <LogOut size={14} /> Wyloguj się
      </button>
    </div>
  );
}

// ===== TAB: HOME CARDS =====
function TabHomeCards() {
  const SECTIONS = [
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Rozwiązanie' },
    { id: 'forwho', label: 'Dla kogo' },
    { id: 'rules', label: 'Zasady współpracy' },
    { id: 'guarantee', label: 'Gwarancja' },
    { id: 'delivery', label: 'Warianty dostawy' },
  ];
  const [section, setSection] = useState('problem');
  const [cards, setCards] = useState([]);
  const [saving, setSaving] = useState(null);
  const [newCard, setNewCard] = useState({ identifier: '', title: '', description: '', badge: '', subtitle: '', isViolet: false });

  const DEFAULT_CARDS = {
    problem: [
      { identifier: '// 01', title: 'Brak regularnego napływu leadów', description: 'Miesiąc dobry, dwa słabe. Bez przewidywalności trudno planować rozwój i zatrudnienie.' },
      { identifier: '// 02', title: 'Zbyt mało rozmów sprzedażowych', description: 'Świetnie realizujesz projekty, ale kalendarz świeci pustkami — a rachunki nie czekają.' },
      { identifier: '// 03', title: 'Uzależnienie od poleceń', description: 'Kiedy polecenia się kończą, kończą się też klienci. Potrzebujesz drugiego, kontrolowanego kanału.' },
      { identifier: '// 04', title: 'Rozmowy, które nie mają sensu', description: 'Ktoś wchodzi na calla i nie wie, o co chodzi. Albo pyta tylko o cenę i rozłącza się, gdy słyszy, że to kosztuje parę tysięcy.' },
      { identifier: '// 05', title: 'Brak czasu na prospecting', description: 'Wysyłanie wiadomości, follow-upy, kwalifikacja — to pełny etat, którego nie masz.' },
    ],
    solution: [
      { identifier: 'IN 01', title: 'Spersonalizowane wiadomości', description: 'Piszemy sekwencje, które brzmią jak wiadomość od człowieka, a nie masowy szablon.' },
      { identifier: 'IN 02', title: 'Outreach na LinkedIn i e-mail', description: 'Prowadzimy kampanie wielokanałowe, testujemy, optymalizujemy — codziennie.' },
      { identifier: '✓ 03', title: 'Kwalifikacja leadów', description: 'Rozmawiamy z odpowiadającymi, weryfikujemy dopasowanie i intencję zakupową.' },
      { identifier: '🗂 04', title: 'Umawianie spotkań w Twoim kalendarzu', description: 'Dostajesz numer wstępnie zainteresowanego klienta z briefem — albo lead sam wybiera termin w Twoim Calendly. Ty tylko wchodzisz na rozmowę i sprzedajesz.' },
    ],
    forwho: [
      { title: 'Agencje marketingowe', description: 'Social media, SEO, Google Ads, performance — budujemy Ci pipeline z firm gotowych do inwestycji.' },
      { title: 'Freelancerzy specjaliści', description: 'Copywriterzy, UX/UI, developerzy — dopasowujemy leady do Twojej specjalizacji.' },
      { title: 'Studia produkcyjne', description: 'Zlecenia na kampanie, spoty, sesje — rozmawiasz z decydentami, nie z asystentami.' },
      { title: 'Twórcy i montażyści rolek', description: 'Montujesz rolki, shorty, wideo? Docieramy do marek i twórców, którzy potrzebują stałej obsługi montażu.' },
      { title: 'Graficy i branding', description: 'Projekty identyfikacji i brandingu — klienci z realnym budżetem, nie darmówki.' },
      { title: 'Konsultanci B2B', description: 'Sprzedaż eksperckich usług do firm — docieramy do osób decyzyjnych.' },
    ],
    rules: [
      { badge: '0 zł', subtitle: 'ZA ROZMOWY, KTÓRE SIĘ NIE ODBYŁY', description: '' },
      { badge: '100%', subtitle: 'ROZMÓW KWALIFIKOWANYCH PRZED PRZEKAZANIEM', description: '' },
      { badge: '14 dni', subtitle: 'DO PIERWSZYCH UMÓWIONYCH ROZMÓW', description: '' },
      { badge: '1 mies.', subtitle: 'WYPOWIEDZENIA — BEZ WIELOLETNICH UMÓW', description: '' },
    ],
    guarantee: [
      { badge: 'Odbyta', subtitle: 'ROZMOWA = JEDYNA PODSTAWA ROZLICZENIA', description: '', isViolet: true },
      { badge: 'Zastępczy', subtitle: 'TERMIN ZA 0 ZŁ, GDY KLIENT SIĘ NIE POJAWI', description: '', isViolet: true },
      { badge: 'Test', subtitle: 'PIERWSZY OKRES TRAKTUJEMY JAKO SPRAWDZENIE DOPASOWANIA', description: '', isViolet: true },
      { badge: 'Wyjście', subtitle: 'W KAŻDEJ CHWILI Z MIESIĘCZNYM WYPOWIEDZENIEM', description: '', isViolet: true },
    ],
    delivery: [
      { title: 'DOSTAWA - WARIANT A: Numer wstępnie zainteresowanego klienta', description: 'Wysyłamy Ci numer osoby, która zna Twoją ofertę i czeka na kontakt — dzwonisz w umówionym terminie.' },
      { title: 'DOSTAWA - WARIANT B: Rezerwacja przez Twój Calendly', description: 'Lead dostaje link do Twojego kalendarza i sam wybiera termin oraz godzinę — spotkanie ląduje u Ciebie automatycznie.' },
    ],
  };

  const load = async (sec) => {
    let d = await base44.entities.HomeCard.filter({ section: sec });
    if ((!d || d.length === 0) && DEFAULT_CARDS[sec]) {
      for (let i = 0; i < DEFAULT_CARDS[sec].length; i++) {
        await base44.entities.HomeCard.create({ ...DEFAULT_CARDS[sec][i], section: sec, order: i + 1 });
      }
      d = await base44.entities.HomeCard.filter({ section: sec });
    }
    setCards((d || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
  };
  useEffect(() => { load(section); }, [section]);

  const handleChange = (id, field, val) => setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  const handleSave = async (c) => {
    setSaving(c.id);
    await base44.entities.HomeCard.update(c.id, { identifier: c.identifier, title: c.title, description: c.description, badge: c.badge, subtitle: c.subtitle, isViolet: c.isViolet });
    setSaving(null); load(section);
  };
  const handleDelete = async (id) => { if (!confirm('Usunąć tę kartę?')) return; await base44.entities.HomeCard.delete(id); load(section); };
  const handleAdd = async () => {
    if (!newCard.title.trim()) return;
    await base44.entities.HomeCard.create({ ...newCard, section, order: cards.length + 1 });
    setNewCard({ identifier: '', title: '', description: '', badge: '', subtitle: '', isViolet: false });
    load(section);
  };

  const showIdentifier = ['problem', 'solution', 'delivery'].includes(section);
  const showNumbers = ['rules', 'guarantee'].includes(section);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Karty sekcji</h2>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} className="font-ui text-xs px-4 py-2 uppercase tracking-widest transition-all duration-200"
            style={{ background: section === s.id ? '#FFC107' : 'transparent', color: section === s.id ? '#000' : '#FFC107', border: '1px solid rgba(255,193,7,0.4)', cursor: 'pointer' }}>{s.label}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {cards.map(c => (
          <div key={c.id} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <div className="flex items-center mb-3">
              <span className="font-ui text-xs" style={{ color: '#555' }}>#{c.order || ''}</span>
              <button onClick={() => handleDelete(c.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'} onMouseLeave={e => e.currentTarget.style.color = '#666'}><Trash2 size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {showIdentifier && <div><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Identyfikator</label><input type="text" value={c.identifier || ''} onChange={e => handleChange(c.id, 'identifier', e.target.value)} className="input-amber" /></div>}
              <div><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Tytuł</label><input type="text" value={c.title || ''} onChange={e => handleChange(c.id, 'title', e.target.value)} className="input-amber" /></div>
              {showNumbers && <div><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Wartość (badge)</label><input type="text" value={c.badge || ''} onChange={e => handleChange(c.id, 'badge', e.target.value)} className="input-amber" /></div>}
              {showNumbers && <div><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Podtytuł</label><input type="text" value={c.subtitle || ''} onChange={e => handleChange(c.id, 'subtitle', e.target.value)} className="input-amber" /></div>}
            </div>
            <div className="mb-3"><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Opis</label><textarea value={c.description || ''} onChange={e => handleChange(c.id, 'description', e.target.value)} className="input-amber" rows={2} /></div>
            {section === 'guarantee' && <label className="flex items-center gap-2 font-ui text-xs mb-3" style={{ color: '#A1A1AA' }}><input type="checkbox" checked={!!c.isViolet} onChange={e => handleChange(c.id, 'isViolet', e.target.checked)} /> Wariant fioletowy</label>}
            <button onClick={() => handleSave(c)} className="font-ui text-xs px-3 py-2 flex items-center gap-1" style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}><Save size={11} /> {saving === c.id ? 'Zapisywanie...' : 'Zapisz'}</button>
          </div>
        ))}
      </div>
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Dodaj kartę</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {showIdentifier && <input type="text" placeholder="Identyfikator" value={newCard.identifier} onChange={e => setNewCard(n => ({ ...n, identifier: e.target.value }))} className="input-amber" />}
          <input type="text" placeholder="Tytuł" value={newCard.title} onChange={e => setNewCard(n => ({ ...n, title: e.target.value }))} className="input-amber" />
          {showNumbers && <input type="text" placeholder="Wartość (badge)" value={newCard.badge} onChange={e => setNewCard(n => ({ ...n, badge: e.target.value }))} className="input-amber" />}
          {showNumbers && <input type="text" placeholder="Podtytuł" value={newCard.subtitle} onChange={e => setNewCard(n => ({ ...n, subtitle: e.target.value }))} className="input-amber" />}
        </div>
        <textarea placeholder="Opis" value={newCard.description} onChange={e => setNewCard(n => ({ ...n, description: e.target.value }))} className="input-amber mb-3" rows={2} />
        {section === 'guarantee' && <label className="flex items-center gap-2 font-ui text-xs mb-3" style={{ color: '#A1A1AA' }}><input type="checkbox" checked={newCard.isViolet} onChange={e => setNewCard(n => ({ ...n, isViolet: e.target.checked }))} /> Wariant fioletowy</label>}
        <button onClick={handleAdd} disabled={!newCard.title.trim()} className="font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2"
          style={{ background: newCard.title.trim() ? '#FFC107' : 'rgba(255,193,7,0.15)', color: newCard.title.trim() ? '#000' : '#555', border: `1px solid ${newCard.title.trim() ? '#FFC107' : 'rgba(255,193,7,0.2)'}`, cursor: newCard.title.trim() ? 'pointer' : 'not-allowed' }}><Plus size={14} /> Dodaj kartę</button>
      </div>
    </div>
  );
}

// ===== TAB: PROCESS =====
function TabProcess() {
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(null);
  const [newStep, setNewStep] = useState({ number: '', title: '', description: '' });
  const DEFAULT_STEPS = [
    { number: 'KROK 01', title: 'Outreach', description: 'Docieramy do Twojej grupy docelowej przez cold e-mail, LinkedIn i telefon.' },
    { number: 'KROK 02', title: 'Rozmowa kwalifikacyjna — 10-20 minut', description: 'Rozmawiamy z leadem na poważnie: o problemach, celach, obecnej sytuacji w firmie i tej wymarzonej, do której chce dojść. Pytamy, ilu nowych klientów jest w stanie realnie przyjąć w miesiącu.' },
    { number: 'KROK 03', title: 'Badanie potrzeb i budżetu', description: 'Naciskamy na ból, który lead ma teraz — bez realnego problemu i budżetu nie ma spotkania.' },
    { number: 'KROK 04', title: 'Prezentacja Twojej oferty', description: 'Przedstawiamy wartość Twojej usługi tak, że umówienie rozmowy z Tobą staje się dla leada oczywistym następnym krokiem.' },
    { number: 'KROK 05', title: 'Umówienie na konkretną godzinę', description: 'Lead wybiera termin, który mu pasuje — dostajesz spotkanie na godzinę, którą sam wskazałeś w swojej dostępności.' },
    { number: 'KROK 06', title: 'Przypomnienie przed rozmową', description: 'Przed spotkaniem przypominamy leadowi o rozmowie — dzięki temu frekwencja jest wysoka, a Ty nie czekasz przy pustym Zoomie.' },
    { number: 'KROK 07', title: 'Ciepły lead w Twoim kalendarzu', description: 'Dostajesz kontakt z briefem: kim jest, jaki ma budżet, czego chce. Nikt nie będzie zaskoczony Twoim telefonem — lead czeka na tę rozmowę.' },
  ];
  const load = async () => {
    let d = await base44.entities.ProcessStep.list('order', 30);
    if (!d || d.length === 0) {
      for (let i = 0; i < DEFAULT_STEPS.length; i++) await base44.entities.ProcessStep.create({ ...DEFAULT_STEPS[i], order: i + 1 });
      d = await base44.entities.ProcessStep.list('order', 30);
    }
    setSteps((d || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (id, field, val) => setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  const handleSave = async (s) => { setSaving(s.id); await base44.entities.ProcessStep.update(s.id, { number: s.number, title: s.title, description: s.description }); setSaving(null); load(); };
  const handleDelete = async (id) => { if (!confirm('Usunąć krok?')) return; await base44.entities.ProcessStep.delete(id); load(); };
  const handleAdd = async () => { if (!newStep.title.trim()) return; await base44.entities.ProcessStep.create({ ...newStep, order: steps.length + 1 }); setNewStep({ number: '', title: '', description: '' }); load(); };
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Proces 7 kroków</h2>
      <p className="font-body text-xs" style={{ color: '#555' }}>Warianty dostawy edytuj w zakładce „Karty sekcji" → „Warianty dostawy".</p>
      <div className="flex flex-col gap-3">
        {steps.map(s => (
          <div key={s.id} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <div className="flex items-center mb-3">
              <span className="font-ui text-xs" style={{ color: '#555' }}>#{s.order || ''}</span>
              <button onClick={() => handleDelete(s.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'} onMouseLeave={e => e.currentTarget.style.color = '#666'}><Trash2 size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Numer</label><input type="text" value={s.number || ''} onChange={e => handleChange(s.id, 'number', e.target.value)} className="input-amber" /></div>
              <div className="sm:col-span-2"><label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#A1A1AA' }}>Tytuł</label><input type="text" value={s.title || ''} onChange={e => handleChange(s.id, 'title', e.target.value)} className="input-amber" /></div>
            </div>
            <textarea value={s.description || ''} onChange={e => handleChange(s.id, 'description', e.target.value)} className="input-amber mb-3" rows={3} placeholder="Opis kroku" />
            <button onClick={() => handleSave(s)} className="font-ui text-xs px-3 py-2 flex items-center gap-1" style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}><Save size={11} /> {saving === s.id ? 'Zapisywanie...' : 'Zapisz'}</button>
          </div>
        ))}
      </div>
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Dodaj krok</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input type="text" placeholder="Numer (KROK 01)" value={newStep.number} onChange={e => setNewStep(n => ({ ...n, number: e.target.value }))} className="input-amber" />
          <input type="text" placeholder="Tytuł" value={newStep.title} onChange={e => setNewStep(n => ({ ...n, title: e.target.value }))} className="input-amber sm:col-span-2" />
        </div>
        <textarea placeholder="Opis" value={newStep.description} onChange={e => setNewStep(n => ({ ...n, description: e.target.value }))} className="input-amber mb-3" rows={3} />
        <button onClick={handleAdd} disabled={!newStep.title.trim()} className="font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2"
          style={{ background: newStep.title.trim() ? '#FFC107' : 'rgba(255,193,7,0.15)', color: newStep.title.trim() ? '#000' : '#555', border: `1px solid ${newStep.title.trim() ? '#FFC107' : 'rgba(255,193,7,0.2)'}`, cursor: newStep.title.trim() ? 'pointer' : 'not-allowed' }}><Plus size={14} /> Dodaj krok</button>
      </div>
    </div>
  );
}

// ===== TAB: FAQ =====
function TabFaq() {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(null);
  const [newItem, setNewItem] = useState({ question: '', answer: '' });
  const DEFAULTS = [
    { question: 'Skąd wiadomo, że klient jest naprawdę zainteresowany?', answer: 'Zanim ktokolwiek trafi do Twojego kalendarza, rozmawiamy z nim 10–20 minut. Badamy jego obecną sytuację, cele, problemy i budżet, pytamy, ilu nowych klientów jest w stanie przyjąć w miesiącu — i przedstawiamy Twoją ofertę. Do Ciebie trafiają tylko osoby, które po tej rozmowie same chciały się umówić.' },
    { question: 'Czy lead będzie wiedział, o co chodzi na rozmowie?', answer: 'Tak — i to jest cała różnica. Nie masz sytuacji, że ktoś wchodzi na rozmowę i nie wie, po co, albo pyta tylko o cenę i rozłącza się, gdy słyszy, że usługa kosztuje kilka tysięcy. Lead zna Twoją ofertę, zna orientacyjną wartość usługi i czeka na tę rozmowę. Nikt nie jest zaskoczony Twoim telefonem.' },
    { question: 'Jak dokładnie otrzymuję spotkanie?', answer: 'Na dwa sposoby, jak wolisz: (1) wysyłamy Ci numer telefonu wstępnie zainteresowanego klienta wraz z briefem, albo (2) lead dostaje link do Twojego Calendly i sam wybiera termin oraz godzinę rozmowy. W obu przypadkach spotkanie jest na konkretną godzinę, którą klient wybrał.' },
    { question: 'Czy muszę mieć Calendly?', answer: 'Nie. Jeśli go nie masz, wystarczy że wyślesz nam swój kalendarz dostępności — dni i godziny, w których możesz prowadzić rozmowy. Wtedy wiemy dokładnie, na jakie terminy umawiać Ci spotkania.' },
    { question: 'Czy używacie reklam?', answer: '' },
    { question: 'Co jeśli rozmowa się nie odbędzie?', answer: 'Przed każdym spotkaniem przypominamy leadowi o rozmowie, więc frekwencja jest wysoka. Jeśli mimo to klient się nie pojawi — umawiamy zastępczy termin bez dodatkowych kosztów. Rozliczamy się wyłącznie za realnie odbyte rozmowy.' },
    { question: 'Dla kogo to jest?', answer: 'Dla agencji marketingowych (m.in. Facebook Ads, Google Ads, SEO, social media), freelancerów, montażystów rolek i wideo, grafików oraz studiów produkcyjnych. Szczegóły per branża znajdziesz na stronie Dla kogo.' },
    { question: 'Czy muszę podpisywać długą umowę?', answer: 'Nie. Po pierwszym okresie, który traktujemy jako test dopasowania, przechodzimy na elastyczne warunki z miesięcznym okresem wypowiedzenia. Bez kar i wieloletnich zobowiązań.' },
    { question: 'Ile spotkań mogę otrzymywać miesięcznie?', answer: 'Docelowo 8–20 kwalifikowanych spotkań miesięcznie, w zależności od Twojej niszy, oferty i tego, ilu nowych klientów Twój zespół jest w stanie realnie obsłużyć. Wolumen ustalamy wspólnie i zwiększamy, gdy jesteś gotowy na więcej.' },
  ];
  const load = async () => {
    let d = await base44.entities.FaqItem.list('order', 50);
    if (!d || d.length === 0) {
      for (let i = 0; i < DEFAULTS.length; i++) await base44.entities.FaqItem.create({ ...DEFAULTS[i], order: i + 1 });
      d = await base44.entities.FaqItem.list('order', 50);
    }
    setItems((d || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (id, field, val) => setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));
  const handleSave = async (it) => { setSaving(it.id); await base44.entities.FaqItem.update(it.id, { question: it.question, answer: it.answer }); setSaving(null); load(); };
  const handleDelete = async (id) => { if (!confirm('Usunąć pytanie?')) return; await base44.entities.FaqItem.delete(id); load(); };
  const handleAdd = async () => { if (!newItem.question.trim()) return; await base44.entities.FaqItem.create({ ...newItem, order: items.length + 1 }); setNewItem({ question: '', answer: '' }); load(); };
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>FAQ (Akordeon)</h2>
      <div className="flex flex-col gap-3">
        {items.map(it => (
          <div key={it.id} className="p-4" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
            <div className="flex items-center mb-3">
              <span className="font-ui text-xs" style={{ color: '#555' }}>#{it.order || ''}</span>
              <button onClick={() => handleDelete(it.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'} onMouseLeave={e => e.currentTarget.style.color = '#666'}><Trash2 size={16} /></button>
            </div>
            <input type="text" value={it.question || ''} onChange={e => handleChange(it.id, 'question', e.target.value)} className="input-amber mb-3" placeholder="Pytanie" />
            <textarea value={it.answer || ''} onChange={e => handleChange(it.id, 'answer', e.target.value)} className="input-amber mb-3" rows={4} placeholder="Odpowiedź (puste = ikona plusa)" />
            <button onClick={() => handleSave(it)} className="font-ui text-xs px-3 py-2 flex items-center gap-1" style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer' }}><Save size={11} /> {saving === it.id ? 'Zapisywanie...' : 'Zapisz'}</button>
          </div>
        ))}
      </div>
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '4px' }}>
        <h3 className="font-ui font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#FFC107' }}>Dodaj pytanie</h3>
        <input type="text" placeholder="Pytanie" value={newItem.question} onChange={e => setNewItem(n => ({ ...n, question: e.target.value }))} className="input-amber mb-3" />
        <textarea placeholder="Odpowiedź" value={newItem.answer} onChange={e => setNewItem(n => ({ ...n, answer: e.target.value }))} className="input-amber mb-3" rows={4} />
        <button onClick={handleAdd} disabled={!newItem.question.trim()} className="font-ui font-bold text-xs px-6 py-3 uppercase tracking-widest flex items-center gap-2"
          style={{ background: newItem.question.trim() ? '#FFC107' : 'rgba(255,193,7,0.15)', color: newItem.question.trim() ? '#000' : '#555', border: `1px solid ${newItem.question.trim() ? '#FFC107' : 'rgba(255,193,7,0.2)'}`, cursor: newItem.question.trim() ? 'pointer' : 'not-allowed' }}><Plus size={14} /> Dodaj pytanie</button>
      </div>
    </div>
  );
}

// ===== MAIN DASHBOARD =====
const TABS = [
  { id: 'text', label: 'Teksty strony', icon: Type },
  { id: 'reviews', label: 'Opinie (CMS)', icon: Image },
  { id: 'services', label: 'Usługi', icon: Briefcase },
  { id: 'questions', label: 'Pytania', icon: HelpCircle },
  { id: 'slots', label: 'Kalendarz', icon: Settings },
  { id: 'meetings', label: 'Spotkania', icon: Calendar },
  { id: 'homecards', label: 'Karty sekcji', icon: Layers },
  { id: 'process', label: 'Proces', icon: ListOrdered },
  { id: 'faqtab', label: 'FAQ', icon: HelpCircle },
  { id: 'crm', label: 'Klienci (CRM)', icon: Users },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== 'authenticated') {
      navigate('/management-dashboard-secure-nr7x912');
    }
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'text': return <TabText />;
      case 'reviews': return <TabReviews />;
      case 'services': return <TabServices />;
      case 'questions': return <TabQuestions />;
      case 'slots': return <TabSlots />;
      case 'meetings': return <TabMeetings />;
      case 'homecards': return <TabHomeCards />;
      case 'process': return <TabProcess />;
      case 'faqtab': return <TabFaq />;
      case 'crm': return <TabCRM />;
      case 'settings': return <TabSettings />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#000', color: '#fff' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar hidden lg:flex flex-col w-60 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,193,7,0.15)' }}>
          <h1 className="font-heading font-black text-sm tracking-widest" style={{ color: '#FFC107' }}>PANEL ADMINA</h1>
          <p className="font-ui text-xs mt-1" style={{ color: '#444' }}>Norbert Rzepka</p>
        </div>
        <nav className="flex-1 py-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className={`admin-nav-item flex items-center gap-3 ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span className="text-sm">{tab.label}</span>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,193,7,0.1)' }}>
          <a href="/" target="_blank" className="font-ui text-xs" style={{ color: '#444', textDecoration: 'none' }}>
            ← Wróć do strony
          </a>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: '#050505', borderBottom: '1px solid rgba(255,193,7,0.15)' }}>
        <h1 className="font-heading font-black text-xs tracking-widest" style={{ color: '#FFC107' }}>PANEL ADMINA</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: '#FFC107', background: 'none', border: '1px solid rgba(255,193,7,0.3)', padding: '4px 8px', cursor: 'pointer' }}>
          ☰
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)}>
          <div className="admin-sidebar w-56 min-h-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,193,7,0.15)' }}>
              <h1 className="font-heading font-black text-sm tracking-widest" style={{ color: '#FFC107' }}>PANEL ADMINA</h1>
            </div>
            <nav className="py-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <div
                    key={tab.id}
                    className={`admin-nav-item flex items-center gap-3 ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{tab.label}</span>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto lg:mt-0 mt-[52px]">
        {renderTab()}
      </main>
    </div>
  );
}