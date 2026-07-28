import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const DEFAULT_STEPS = [
  { number: 'KROK 01', title: 'Outreach', description: 'Docieramy do Twojej grupy docelowej przez cold e-mail, LinkedIn i telefon.' },
  { number: 'KROK 02', title: 'Rozmowa kwalifikacyjna — 10-20 minut', description: 'Rozmawiamy z leadem na poważnie: o problemach, celach, obecnej sytuacji w firmie i tej wymarzonej, do której chce dojść. Pytamy, ilu nowych klientów jest w stanie realnie przyjąć w miesiącu.' },
  { number: 'KROK 03', title: 'Badanie potrzeb i budżetu', description: 'Naciskamy na ból, który lead ma teraz — bez realnego problemu i budżetu nie ma spotkania.' },
  { number: 'KROK 04', title: 'Prezentacja Twojej oferty', description: 'Przedstawiamy wartość Twojej usługi tak, że umówienie rozmowy z Tobą staje się dla leada oczywistym następnym krokiem.' },
  { number: 'KROK 05', title: 'Umówienie na konkretną godzinę', description: 'Lead wybiera termin, który mu pasuje — dostajesz spotkanie na godzinę, którą sam wskazałeś w swojej dostępności.' },
  { number: 'KROK 06', title: 'Przypomnienie przed rozmową', description: 'Przed spotkaniem przypominamy leadowi o rozmowie — dzięki temu frekwencja jest wysoka, a Ty nie czekasz przy pustym Zoomie.' },
  { number: 'KROK 07', title: 'Ciepły lead w Twoim kalendarzu', description: 'Dostajesz kontakt z briefem: kim jest, jaki ma budżet, czego chce. Nikt nie będzie zaskoczony Twoim telefonem — lead czeka na tę rozmowę.' },
];

const DEFAULT_DELIVERY = [
  { title: 'DOSTAWA - WARIANT A: Numer wstępnie zainteresowanego klienta', description: 'Wysyłamy Ci numer osoby, która zna Twoją ofertę i czeka na kontakt — dzwonisz w umówionym terminie.' },
  { title: 'DOSTAWA - WARIANT B: Rezerwacja przez Twój Calendly', description: 'Lead dostaje link do Twojego kalendarza i sam wybiera termin oraz godzinę — spotkanie ląduje u Ciebie automatycznie.' },
];

export default function ProcessSection({ id }) {
  const [data, setData] = useState({
    label: 'JAK KWALIFIKUJEMY',
    h2: 'Każdy lead przechodzi przez nasze sito.',
    desc: 'Pytamy o budżet, cele i bariery, zanim Ty w ogóle podniesiesz słuchawkę. Do Twojego kalendarza trafiają tylko rozmowy, które mają sens.',
    steps: DEFAULT_STEPS,
    delivery: DEFAULT_DELIVERY,
  });
  useEffect(() => {
    Promise.all([
      base44.entities.PageContent.filter({ pageKey: { $regex: '^home\\.process\\.' } }),
      base44.entities.ProcessStep.list('order', 20),
      base44.entities.HomeCard.filter({ section: 'delivery' }),
    ]).then(([cs, steps, deliv]) => {
      const map = {};
      (cs || []).forEach(c => { map[c.pageKey] = c.value; });
      setData(d => ({
        label: map['home.process.label'] ?? d.label,
        h2: map['home.process.h2'] ?? d.h2,
        desc: map['home.process.desc'] ?? d.desc,
        steps: (steps && steps.length) ? steps.sort((a, b) => (a.order || 0) - (b.order || 0)) : d.steps,
        delivery: (deliv && deliv.length) ? deliv.sort((a, b) => (a.order || 0) - (b.order || 0)) : d.delivery,
      }));
    }).catch(() => {});
  }, []);

  return (
    <section id={id} style={{ paddingTop: 'clamp(5rem,10vw,8rem)', paddingBottom: 'clamp(5rem,10vw,8rem)', paddingLeft: 'clamp(1.5rem,5vw,5rem)', paddingRight: 'clamp(1.5rem,5vw,5rem)', maxWidth: 1000, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center">
        <p className="font-ui text-xs uppercase mb-4" style={{ color: '#FFC107', letterSpacing: '0.25em' }}>{data.label}</p>
        <h2 className="font-heading mb-5" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>{data.h2}</h2>
        <p className="font-body mb-14 mx-auto" style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 680 }}>{data.desc}</p>
      </motion.div>
      <div className="flex flex-col gap-3">
        {data.steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: (i % 2) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-5 p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,193,7,0.12)' }}>
            <span className="font-ui text-xs font-bold flex-shrink-0" style={{ color: '#FFC107', letterSpacing: '0.1em' }}>{s.number}</span>
            <div>
              <h3 className="font-heading font-bold text-base mb-2" style={{ color: '#fff' }}>{s.title}</h3>
              <p className="font-body text-sm" style={{ color: '#71717a', lineHeight: 1.7 }}>{s.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-12">
        <h3 className="font-heading font-bold text-lg mb-5" style={{ color: '#FFC107' }}>Warianty dostawy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.delivery.map((d, i) => (
            <div key={i} className="p-6 rounded-2xl" style={{ background: 'rgba(255,193,7,0.04)', border: '1px solid rgba(255,193,7,0.2)' }}>
              <h4 className="font-heading font-bold text-sm mb-2" style={{ color: '#fff' }}>{d.title}</h4>
              <p className="font-body text-sm" style={{ color: '#71717a', lineHeight: 1.7 }}>{d.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}