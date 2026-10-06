import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function Szczegoly() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const slotId = urlParams.get('slotId');
  const serviceId = urlParams.get('serviceId');

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('survey'); // survey | thankyou | payment
  const [animState, setAnimState] = useState('in'); // in | out-left | out
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    base44.entities.SurveyQuestion.list('order', 50).then(data => {
      setQuestions(data || []);
      setLoading(false);
    });
  }, []);

  const currentQuestion = questions[currentIdx];
  const totalQ = questions.length;
  const isAnswered = currentQuestion
    ? (answers[currentQuestion.id] || '').toString().trim() !== ''
    : false;

  const goNext = () => {
    if (!isAnswered && currentQuestion) return;
    if (currentIdx < totalQ - 1) {
      setAnimState('out-left');
      setTimeout(() => {
        setCurrentIdx(i => i + 1);
        setAnimState('in');
      }, 400);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setAnimState('out');
    setTimeout(async () => {
      setPhase('thankyou');
      // Save client record
      try {
        const surveyAnswers = questions.map(q => ({
          questionId: q.id,
          questionText: q.text,
          answer: answers[q.id] || '',
        }));
        const rec = await base44.entities.Client.create({
          serviceId: serviceId || '',
          slotId: slotId || '',
          contactName: contactData.name,
          contactEmail: contactData.email,
          contactPhone: contactData.phone,
          surveyAnswers: JSON.stringify(surveyAnswers),
          paymentStatus: 'pending',
        });
        setClientId(rec.id);
      } catch (e) {
        console.error(e);
      }
    }, 500);
  };

  const handlePayment = async () => {
    setCreatingSession(true);
    try {
      // We'll pass clientId and serviceId to the Stripe checkout via URL params
      // The admin will configure Stripe separately; here we redirect with params
      navigate(`/platnosc?clientId=${clientId}&serviceId=${serviceId}&slotId=${slotId}`);
    } catch (e) {
      console.error(e);
      setCreatingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FFC107', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const questionAnimStyle = () => {
    if (animState === 'in') return { animation: 'slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' };
    if (animState === 'out-left') return { animation: 'slideOutLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' };
    if (animState === 'out') return { animation: 'fadeOut 0.5s ease forwards' };
    return {};
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '80px', color: '#fff' }}>
      <div className="max-w-2xl mx-auto px-4 py-16">

        {phase === 'survey' && (
          <div>
            <h1
              className="font-heading text-center mb-12"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, color: '#FFC107' }}
            >
              Szczegóły
            </h1>

            {/* Contact data first */}
            <div
              className="mb-10 p-6"
              style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '4px' }}
            >
              <p className="font-ui text-xs uppercase tracking-widest mb-4" style={{ color: '#A1A1AA' }}>Dane kontaktowe</p>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'name', placeholder: 'Imię i nazwisko *', required: true },
                  { key: 'email', placeholder: 'Adres e-mail *', required: true },
                  { key: 'phone', placeholder: 'Numer telefonu (opcjonalnie)', required: false },
                ].map(field => (
                  <input
                    key={field.key}
                    type={field.key === 'email' ? 'email' : 'text'}
                    placeholder={field.placeholder}
                    value={contactData[field.key]}
                    onChange={e => setContactData(d => ({ ...d, [field.key]: e.target.value }))}
                    className="input-amber"
                  />
                ))}
              </div>
            </div>

            {/* Progress */}
            {totalQ > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,193,7,0.15)' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#FFC107',
                      width: `${((currentIdx + 1) / totalQ) * 100}%`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span className="font-ui text-xs" style={{ color: '#A1A1AA', whiteSpace: 'nowrap' }}>
                  {currentIdx + 1} / {totalQ}
                </span>
              </div>
            )}

            {totalQ === 0 && (
              <div style={{ color: '#A1A1AA', textAlign: 'center', padding: '2rem 0', fontFamily: "'Poppins', sans-serif" }}>
                Brak pytań do ankiety.
              </div>
            )}

            {currentQuestion && (
              <div key={currentQuestion.id} style={questionAnimStyle()}>
                <div
                  className="p-8 mb-6"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '4px' }}
                >
                  <p className="font-ui text-xs uppercase tracking-widest mb-4" style={{ color: '#A1A1AA' }}>
                    Pytanie {currentIdx + 1}
                  </p>
                  <h3 className="font-heading font-bold mb-6" style={{ fontSize: '1.2rem', lineHeight: 1.5, color: '#FFF' }}>
                    {currentQuestion.text}
                  </h3>

                  {currentQuestion.type === 'open' ? (
                    <textarea
                      placeholder="Wpisz swoją odpowiedź..."
                      value={answers[currentQuestion.id] || ''}
                      onChange={e => setAnswers(a => ({ ...a, [currentQuestion.id]: e.target.value }))}
                      rows={4}
                      className="input-amber resize-none"
                      style={{ fontFamily: "'Poppins', sans-serif", lineHeight: 1.6 }}
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(currentQuestion.options || []).map((opt, oi) => {
                        const labels = ['A', 'B', 'C', 'D'];
                        const isChosen = answers[currentQuestion.id] === opt;
                        return (
                          <button
                            key={oi}
                            onClick={() => setAnswers(a => ({ ...a, [currentQuestion.id]: opt }))}
                            className="w-full text-left flex items-center gap-4 p-4 transition-all duration-200"
                            style={{
                              background: isChosen ? 'rgba(255,193,7,0.1)' : 'transparent',
                              border: `1px solid ${isChosen ? '#FFC107' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: '2px',
                              cursor: 'pointer',
                              color: '#FFF',
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            <span
                              className="font-ui font-bold text-xs flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-sm"
                              style={{
                                background: isChosen ? '#FFC107' : 'rgba(255,193,7,0.1)',
                                color: isChosen ? '#000' : '#FFC107',
                                border: `1px solid ${isChosen ? '#FFC107' : 'rgba(255,193,7,0.3)'}`,
                              }}
                            >
                              {labels[oi] || oi + 1}
                            </span>
                            <span style={{ fontSize: '0.95rem' }}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (currentIdx > 0) {
                        setAnimState('out-left');
                        setTimeout(() => { setCurrentIdx(i => i - 1); setAnimState('in'); }, 400);
                      }
                    }}
                    disabled={currentIdx === 0}
                    className="font-ui text-sm px-6 py-3 transition-all duration-200"
                    style={{
                      background: 'transparent',
                      color: currentIdx === 0 ? '#333' : '#A1A1AA',
                      border: `1px solid ${currentIdx === 0 ? '#222' : 'rgba(255,255,255,0.15)'}`,
                      cursor: currentIdx === 0 ? 'default' : 'pointer',
                    }}
                  >
                    ← Wróć
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!isAnswered && !contactData.name && !contactData.email}
                    className="font-ui font-bold text-sm px-8 py-3 uppercase tracking-widest transition-all duration-300"
                    style={{
                      background: isAnswered ? '#FFC107' : 'rgba(255,193,7,0.2)',
                      color: isAnswered ? '#000' : '#555',
                      border: `1px solid ${isAnswered ? '#FFC107' : 'rgba(255,193,7,0.2)'}`,
                      cursor: isAnswered ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={e => { if (isAnswered) { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,240,32,0.4)'; } }}
                    onMouseLeave={e => { if (isAnswered) { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; } }}
                  >
                    {currentIdx === totalQ - 1 ? 'Zakończ →' : 'Dalej →'}
                  </button>
                </div>
              </div>
            )}

            {totalQ === 0 && contactData.name && contactData.email && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleFinish}
                  className="font-ui font-bold text-sm px-12 py-4 uppercase tracking-widest transition-all duration-300"
                  style={{ background: '#FFC107', color: '#000', border: '1px solid #FFC107', cursor: 'pointer', letterSpacing: '0.15em' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,240,32,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Dalej →
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'thankyou' && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
              style={{ border: '2px solid #FFC107', boxShadow: '0 0 30px rgba(255,193,7,0.4)' }}
            >
              <span style={{ color: '#FFC107', fontSize: '1.5rem' }}>✓</span>
            </div>
            <h2
              className="font-heading font-black mb-6"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#FFC107', lineHeight: 1.1 }}
            >
              Dziękuję za udzielenie odpowiedzi
            </h2>
            <p className="font-body mb-10" style={{ color: '#A1A1AA', maxWidth: '400px', lineHeight: 1.7 }}>
              Twoje odpowiedzi zostały zapisane. Teraz przejdź do płatności, aby potwierdzić rezerwację.
            </p>
            <button
              onClick={handlePayment}
              disabled={creatingSession}
              className="font-ui font-bold text-sm px-12 py-4 uppercase tracking-widest transition-all duration-300 animate-pulse-amber"
              style={{
                background: '#FFC107',
                color: '#000',
                border: '1px solid #FFC107',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                opacity: creatingSession ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!creatingSession) { e.currentTarget.style.background = '#FFF020'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,240,32,0.6)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFC107'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {creatingSession ? 'Przetwarzanie...' : 'Przejdź do płatności'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}