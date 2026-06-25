import React, { useState, useEffect, useRef } from 'react'; // eslint-disable-line
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Type, Image, Briefcase, HelpCircle, Users, Settings,
  Plus, Trash2, Save, Upload, LogOut, ChevronDown, ChevronUp,
  Eye, EyeOff, Check, X
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
  ];

  useEffect(() => {
    base44.entities.PageContent.list().then(data => {
      const map = {};
      (data || []).forEach(d => { map[d.pageKey] = d; });
      const merged = defaultContent.map(def => map[def.pageKey] ? { ...def, ...map[def.pageKey] } : def);
      setItems(merged);
    }).catch(() => {
      setItems(defaultContent);
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
          <WysiwygEditor
            value={item.value}
            onChange={val => handleChange(idx, val)}
            minHeight="80px"
          />
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

  const load = () => base44.entities.Review.list('order', 100).then(data => setReviews(data || [])).catch(() => {});
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
    try {
      const data = await base44.entities.Service.list('order', 10);
      if (data && data.length > 0) {
        setServices(data);
      } else {
        try {
          for (const svc of defaultServices) {
            await base44.entities.Service.create(svc);
          }
          const fresh = await base44.entities.Service.list('order', 10);
          setServices(fresh || defaultServices);
        } catch {
          setServices(defaultServices);
        }
      }
    } catch {
      setServices(defaultServices);
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

  const load = () => base44.entities.SurveyQuestion.list('order', 50).then(d => setQuestions(d || [])).catch(() => {});
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

  const load = () => base44.entities.AvailableSlot.list('-date', 200).then(d => setSlots(d || [])).catch(() => {});
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
  }).catch(() => {});

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
                      <div className="mb-4 p-3" style={{ background: 'rgba(0,200,100,0.04)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '2px' }}>
                        <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#00C864' }}>Stripe — płatność zrealizowana</label>
                        <code className="font-ui text-xs" style={{ color: '#FFC107' }}>{client.stripeSessionId}</code>
                        <p className="font-body text-xs mt-1" style={{ color: '#555' }}>
                          Zweryfikuj w{' '}
                          <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer"
                            style={{ color: '#FFC107', textDecoration: 'underline' }}>
                            Stripe Dashboard
                          </a>
                        </p>
                      </div>
                    )}
                    {!client.stripeSessionId && (
                      <div className="mb-4 p-3" style={{ background: 'rgba(255,80,80,0.04)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '2px' }}>
                        <label className="font-ui text-xs uppercase tracking-widest block mb-1" style={{ color: '#ff6666' }}>Płatność niezrealizowana</label>
                        <p className="font-body text-xs" style={{ color: '#999' }}>
                          Klient wypełnił formularz, ale <strong style={{ color: '#ff6666' }}>nie ukończył płatności</strong> przez Stripe.
                          Ten wpis można zignorować lub ręcznie usunąć.
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

// ===== TAB: SETTINGS =====
function TabSettings() {
  const navigate = useNavigate();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
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

  const handleTotpChange = (refs, state, setState) => (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...state];
    next[idx] = v;
    setState(next);
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleTotpKeyDown = (refs, state) => (idx, e) => {
    if (e.key === 'Backspace' && !state[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleTotpPaste = (setState) => (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('').map((_, i) => pasted[i] || '');
    setState(next);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/management-dashboard-secure-nr7x912');
  };

  const TotpInput = ({ state, setState, refs }) => (
    <div className="flex gap-2">
      {state.map((digit, idx) => (
        <input
          key={idx}
          ref={el => refs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleTotpChange(refs, state, setState)(idx, e.target.value)}
          onKeyDown={e => handleTotpKeyDown(refs, state)(idx, e)}
          onPaste={idx === 0 ? handleTotpPaste(setState) : undefined}
          autoFocus={idx === 0}
          className={`totp-box ${digit ? 'filled' : ''}`}
          style={{ width: 40, height: 48 }}
        />
      ))}
    </div>
  );

  const checkStripe = async () => {
    setStripeLoading(true);
    try {
      const data = await fetch('/api/stripe/health').then(r => r.json());
      setStripeStatus(data);
    } catch (e) {
      setStripeStatus({ ok: false, error: e.message });
    } finally {
      setStripeLoading(false);
    }
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/stripe/webhook`
    : '/api/stripe/webhook';

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading font-black text-xl" style={{ color: '#FFC107' }}>Ustawienia</h2>

      {/* STRIPE STATUS */}
      <div className="p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-ui font-bold text-sm uppercase tracking-widest" style={{ color: '#FFC107' }}>Stripe — status połączenia</h3>
          <button onClick={checkStripe} disabled={stripeLoading}
            className="font-ui font-bold text-xs px-4 py-2 uppercase tracking-widest transition-all duration-200"
            style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer', opacity: stripeLoading ? 0.6 : 1 }}>
            {stripeLoading ? 'Sprawdzam...' : 'Sprawdź połączenie'}
          </button>
        </div>

        {stripeStatus && (
          <div className="mb-4 animate-fade-in">
            {stripeStatus.ok ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: '#00C864', fontSize: '1rem' }}>✓</span>
                  <span className="font-ui text-sm font-bold" style={{ color: '#00C864' }}>Połączono ze Stripe</span>
                  <span className="font-ui text-xs px-2 py-0.5" style={{
                    background: stripeStatus.mode === 'test' ? 'rgba(255,193,7,0.15)' : 'rgba(0,200,100,0.15)',
                    color: stripeStatus.mode === 'test' ? '#FFC107' : '#00C864',
                    border: `1px solid ${stripeStatus.mode === 'test' ? 'rgba(255,193,7,0.4)' : 'rgba(0,200,100,0.4)'}`,
                    borderRadius: '2px',
                  }}>
                    {stripeStatus.mode === 'test' ? 'TRYB TESTOWY' : 'TRYB LIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="p-2" style={{ background: '#111', borderRadius: '2px', border: '1px solid #222' }}>
                    <p className="font-ui text-xs" style={{ color: '#555' }}>Płatności aktywne</p>
                    <p className="font-ui text-sm font-bold" style={{ color: stripeStatus.chargesEnabled ? '#00C864' : '#ff6666' }}>
                      {stripeStatus.chargesEnabled ? '✓ Tak' : '✕ Nie — dokończ konfigurację konta w Stripe'}
                    </p>
                  </div>
                  <div className="p-2" style={{ background: '#111', borderRadius: '2px', border: '1px solid #222' }}>
                    <p className="font-ui text-xs" style={{ color: '#555' }}>Dane konta przesłane</p>
                    <p className="font-ui text-sm font-bold" style={{ color: stripeStatus.detailsSubmitted ? '#00C864' : '#FFC107' }}>
                      {stripeStatus.detailsSubmitted ? '✓ Tak' : '⚠ Nie — uzupełnij dane w Stripe Dashboard'}
                    </p>
                  </div>
                  {stripeStatus.email && (
                    <div className="p-2" style={{ background: '#111', borderRadius: '2px', border: '1px solid #222' }}>
                      <p className="font-ui text-xs" style={{ color: '#555' }}>E-mail konta Stripe</p>
                      <p className="font-ui text-sm" style={{ color: '#FFF' }}>{stripeStatus.email}</p>
                    </div>
                  )}
                  <div className="p-2" style={{ background: '#111', borderRadius: '2px', border: '1px solid #222' }}>
                    <p className="font-ui text-xs" style={{ color: '#555' }}>Kraj</p>
                    <p className="font-ui text-sm font-bold" style={{ color: '#FFF' }}>{stripeStatus.country?.toUpperCase() || '—'}</p>
                  </div>
                </div>
                {!stripeStatus.chargesEnabled && (
                  <div className="mt-3 p-3" style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '4px' }}>
                    <p className="font-body text-xs" style={{ color: '#ff8888', lineHeight: 1.7 }}>
                      <strong>Konto Stripe wymaga aktywacji.</strong> Przejdź do{' '}
                      <a href="https://dashboard.stripe.com/settings/account" target="_blank" rel="noreferrer" style={{ color: '#FFC107', textDecoration: 'underline' }}>
                        Stripe Dashboard → Ustawienia konta
                      </a>{' '}
                      i uzupełnij dane weryfikacyjne (tożsamość, konto bankowe). Dopiero po aktywacji będą możliwe prawdziwe płatności.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3" style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '4px' }}>
                <p className="font-ui text-xs font-bold mb-1" style={{ color: '#ff6666' }}>✕ Błąd połączenia ze Stripe</p>
                <p className="font-body text-xs" style={{ color: '#999' }}>{stripeStatus.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Webhook URL */}
        <div className="mt-4 p-4" style={{ background: 'rgba(255,193,7,0.03)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '4px' }}>
          <p className="font-ui text-xs uppercase tracking-widest mb-2" style={{ color: '#A1A1AA' }}>URL Webhooka Stripe</p>
          <p className="font-body text-xs mb-3" style={{ color: '#666', lineHeight: 1.7 }}>
            Zarejestruj ten adres w{' '}
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" style={{ color: '#FFC107', textDecoration: 'underline' }}>
              Stripe Dashboard → Webhooks → Add endpoint
            </a>
            . Zdarzenia do nasłuchiwania: <code style={{ color: '#FFC107' }}>checkout.session.completed</code> i <code style={{ color: '#FFC107' }}>checkout.session.expired</code>.
          </p>
          <div className="flex items-center gap-2">
            <code className="font-ui text-xs flex-1 px-3 py-2" style={{ background: '#111', color: '#FFC107', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '2px', wordBreak: 'break-all' }}>
              {webhookUrl}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(webhookUrl)}
              className="font-ui text-xs px-3 py-2 flex-shrink-0 transition-all duration-200"
              style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer', borderRadius: '2px' }}>
              Kopiuj
            </button>
          </div>
          <p className="font-body text-xs mt-2" style={{ color: '#444' }}>
            ⚠ W środowisku deweloperskim (Replit) webhook działa przez proxy Vite. Po wdrożeniu produkcyjnym URL może być inny.
          </p>
        </div>
      </div>

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

// ===== MAIN DASHBOARD =====
const TABS = [
  { id: 'text', label: 'Teksty strony', icon: Type },
  { id: 'reviews', label: 'Opinie (CMS)', icon: Image },
  { id: 'services', label: 'Usługi', icon: Briefcase },
  { id: 'questions', label: 'Pytania', icon: HelpCircle },
  { id: 'slots', label: 'Kalendarz', icon: Settings },
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