import { useState } from 'react';

const SLIDES = [
  {
    kanji: '生き甲斐',
    title: 'Czym jest Ikigai',
    text: 'Ikigai to japońskie słowo oznaczające "powód do wstawania rano". Nie wielki cel życiowy — małe, codzienne rzeczy które nadają sens. Ta aplikacja pomaga Ci je odkryć i śledzić jak zmieniają się w czasie.',
  },
  {
    kanji: '道',
    title: 'Jak to działa',
    text: 'Przejdziesz przez 6 etapów refleksji — od tego kim jesteś dziś, przez twoje talenty i cień, aż po syntezę. Na końcu AI wygeneruje spersonalizowany raport. Za kilka miesięcy wrócisz — żeby sprawdzić czy kierunek się zmienił.',
  },
  {
    kanji: '鍵',
    title: 'Twoja prywatność',
    text: 'Wszystkie odpowiedzi zostają na Twoim urządzeniu — w lokalnej bazie danych przeglądarki. Nic nie jest wysyłane na żaden serwer poza jednym momentem: gdy AI generuje raport, Twoje odpowiedzi trafiają do Anthropic API.',
  },
];

export default function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="flex-col flex-center fade-in" style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 560, margin: '0 auto' }}>
      {/* Kanji */}
      <div style={{ fontSize: 64, color: 'var(--gold)', opacity: 0.7, fontFamily: 'Georgia, serif', marginBottom: 24, lineHeight: 1 }}>
        {slide.kanji}
      </div>

      {/* Content */}
      <h1 className="mb-16 text-center" style={{ fontSize: '1.9rem' }}>{slide.title}</h1>
      <p className="text-center mb-32" style={{ color: 'var(--text-muted)', lineHeight: 1.9, fontSize: '1.05rem' }}>
        {slide.text}
      </p>

      {/* Dots */}
      <div className="flex gap-8 mb-32">
        {SLIDES.map((_, i) => (
          <div key={i} style={{
            width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
            background: i === idx ? 'var(--gold)' : 'var(--border)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-12">
        {!isLast ? (
          <>
            <button className="btn-ghost" onClick={onDone}>
              Znam już Ikigai — zacznij
            </button>
            <button className="btn-primary" onClick={() => setIdx(i => i + 1)}>
              Dalej →
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={onDone} style={{ padding: '14px 40px', fontSize: 17 }}>
            Zacznij odkrywanie →
          </button>
        )}
      </div>
    </div>
  );
}
