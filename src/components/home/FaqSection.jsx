import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

export default function FaqSection({ id }) {
  const [data, setData] = useState({ label: 'FAQ', h2: 'Wszystko, o co pytają przed startem.', subtitle: 'Jeśli nie znajdziesz tu odpowiedzi — zadasz pytanie na bezpłatnej konsultacji.', items: DEFAULTS });
  const [open, setOpen] = useState(0);
  useEffect(() => {
    Promise.all([
      base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.faq\\.' } }),
      base44.entities.FaqItem.list('order', 30),
    ]).then(([cs, items]) => {
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setData(d => ({
        label: map['home.faq.label'] ?? d.label,
        h2: map['home.faq.h2'] ?? d.h2,
        subtitle: map['home.faq.subtitle'] ?? d.subtitle,
        items: (items && items.length) ? items.sort((a, b) => (a.order || 0) - (b.order || 0)) : d.items,
      }));
    }).catch(() => {});
  }, []);
  return (
    <section id={id} style={{ paddingTop: 'clamp(5rem,10vw,8rem)', paddingBottom: 'clamp(5rem,10vw,8rem)', paddingLeft: 'clamp(1.5rem,5vw,5rem)', paddingRight: 'clamp(1.5rem,5vw,5rem)', maxWidth: 860, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-12">
        <p className="font-ui text-xs uppercase mb-4" style={{ color: '#FFC107', letterSpacing: '0.25em' }}>{data.label}</p>
        <h2 className="font-heading mb-4" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>{data.h2}</h2>
        <p className="font-body" style={{ color: '#71717a', fontSize: '1rem', lineHeight: 1.7 }}>{data.subtitle}</p>
      </motion.div>
      <div className="flex flex-col gap-3">
        {data.items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${isOpen ? 'rgba(255,193,7,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left" style={{ cursor: 'pointer' }}>
                <span className="font-heading font-bold text-sm sm:text-base" style={{ color: '#fff' }}>{it.question}</span>
                {isOpen ? <Minus size={18} style={{ color: '#FFC107', flexShrink: 0 }} /> : <Plus size={18} style={{ color: '#FFC107', flexShrink: 0 }} />}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                    <div className="px-5 pb-5">
                      {it.answer ? (
                        <p className="font-body text-sm" style={{ color: '#71717a', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{it.answer}</p>
                      ) : (
                        <div className="flex items-center gap-2" style={{ color: '#52525b' }}>
                          <Plus size={14} /> <span className="font-body text-sm">Brak odpowiedzi</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}