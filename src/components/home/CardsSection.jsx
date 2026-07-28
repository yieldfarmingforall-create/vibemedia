import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const DEFAULTS = {
  problem: {
    label: 'PROBLEM',
    h2: 'Świetny w tym, co robisz — ale klienci nie pukają sami.',
    desc: 'Większość agencji i freelancerów utyka na tym samym pułapie, bo brakuje im systemu pozyskiwania klientów.',
    cards: [
      { identifier: '// 01', title: 'Brak regularnego napływu leadów', description: 'Miesiąc dobry, dwa słabe. Bez przewidywalności trudno planować rozwój i zatrudnienie.' },
      { identifier: '// 02', title: 'Zbyt mało rozmów sprzedażowych', description: 'Świetnie realizujesz projekty, ale kalendarz świeci pustkami — a rachunki nie czekają.' },
      { identifier: '// 03', title: 'Uzależnienie od poleceń', description: 'Kiedy polecenia się kończą, kończą się też klienci. Potrzebujesz drugiego, kontrolowanego kanału.' },
      { identifier: '// 04', title: 'Rozmowy, które nie mają sensu', description: 'Ktoś wchodzi na calla i nie wie, o co chodzi. Albo pyta tylko o cenę i rozłącza się, gdy słyszy, że to kosztuje parę tysięcy.' },
      { identifier: '// 05', title: 'Brak czasu na prospecting', description: 'Wysyłanie wiadomości, follow-upy, kwalifikacja — to pełny etat, którego nie masz.' },
    ],
  },
  solution: {
    label: 'ROZWIĄZANIE',
    h2: 'Kompletny system pozyskiwania — zrobiony za Ciebie.',
    desc: 'Nie dostajesz listy kontaktów do obdzwonienia. Dostajesz spotkanie w kalendarzu z osobą, która wie, po co rozmawiacie.',
    cards: [
      { identifier: 'IN 01', title: 'Spersonalizowane wiadomości', description: 'Piszemy sekwencje, które brzmią jak wiadomość od człowieka, a nie masowy szablon.' },
      { identifier: 'IN 02', title: 'Outreach na LinkedIn i e-mail', description: 'Prowadzimy kampanie wielokanałowe, testujemy, optymalizujemy — codziennie.' },
      { identifier: '✓ 03', title: 'Kwalifikacja leadów', description: 'Rozmawiamy z odpowiadającymi, weryfikujemy dopasowanie i intencję zakupową.' },
      { identifier: '🗂 04', title: 'Umawianie spotkań w Twoim kalendarzu', description: 'Dostajesz numer wstępnie zainteresowanego klienta z briefem — albo lead sam wybiera termin w Twoim Calendly. Ty tylko wchodzisz na rozmowę i sprzedajesz.' },
    ],
  },
  forwho: {
    label: 'DLA KOGO',
    h2: 'Pracujemy z ludźmi, którzy sprzedają konkret.',
    desc: 'Nie umawiamy przypadkowych rozmów. Wybieramy leady, które mają realny budżet, jasny cel i pilny problem. Twoja rola: sprzedać. Nasza: dostarczyć rozmowę.',
    cards: [
      { title: 'Agencje marketingowe', description: 'Social media, SEO, Google Ads, performance — budujemy Ci pipeline z firm gotowych do inwestycji.' },
      { title: 'Freelancerzy specjaliści', description: 'Copywriterzy, UX/UI, developerzy — dopasowujemy leady do Twojej specjalizacji.' },
      { title: 'Studia produkcyjne', description: 'Zlecenia na kampanie, spoty, sesje — rozmawiasz z decydentami, nie z asystentami.' },
      { title: 'Twórcy i montażyści rolek', description: 'Montujesz rolki, shorty, wideo? Docieramy do marek i twórców, którzy potrzebują stałej obsługi montażu.' },
      { title: 'Graficy i branding', description: 'Projekty identyfikacji i brandingu — klienci z realnym budżetem, nie darmówki.' },
      { title: 'Konsultanci B2B', description: 'Sprzedaż eksperckich usług do firm — docieramy do osób decyzyjnych.' },
    ],
  },
};

const SECTION_STYLE = { paddingTop: 'clamp(5rem,10vw,8rem)', paddingBottom: 'clamp(5rem,10vw,8rem)', paddingLeft: 'clamp(1.5rem,5vw,5rem)', paddingRight: 'clamp(1.5rem,5vw,5rem)', maxWidth: 1200, margin: '0 auto' };

export default function CardsSection({ section, id }) {
  const [data, setData] = useState(DEFAULTS[section]);
  useEffect(() => {
    Promise.all([
      base44.entities.PageContent.filter({ pageKey: { $regex: `^home\\.${section}\\.` } }),
      base44.entities.HomeCard.filter({ section }),
    ]).then(([cs, cards]) => {
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setData(d => ({
        label: map[`home.${section}.label`] ?? d.label,
        h2: map[`home.${section}.h2`] ?? d.h2,
        desc: map[`home.${section}.desc`] ?? d.desc,
        cards: (cards && cards.length) ? cards.sort((a, b) => (a.order || 0) - (b.order || 0)) : d.cards,
      }));
    }).catch(() => {});
  }, [section]);

  const isForWho = section === 'forwho';
  return (
    <section id={id} style={SECTION_STYLE}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <p className="font-ui text-xs uppercase mb-4" style={{ color: '#FFC107', letterSpacing: '0.25em' }}>{data.label}</p>
        <h2 className="font-heading mb-5" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff', maxWidth: 900 }}>{data.h2}</h2>
        <p className="font-body mb-12" style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 760 }}>{data.desc}</p>
      </motion.div>
      <div className={`grid gap-4 ${isForWho ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {data.cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
            {c.identifier && <span className="font-ui text-xs font-bold block mb-3" style={{ color: 'rgba(255,193,7,0.5)', letterSpacing: '0.15em' }}>{c.identifier}</span>}
            <h3 className="font-heading font-bold text-base mb-2" style={{ color: '#fff' }}>{c.title}</h3>
            <p className="font-body text-sm" style={{ color: '#71717a', lineHeight: 1.7 }}>{c.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}