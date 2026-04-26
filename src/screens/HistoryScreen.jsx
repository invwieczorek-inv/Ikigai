import { useState } from 'react';
import { fmtDate, fmtDateShort, monthsAgo } from '../db';

export default function HistoryScreen({ sessions, onView, onCompare, onBack }) {
  const [selected, setSelected] = useState([]);
  const completed = sessions.filter(s => s.status === 'completed');

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const handleCompare = () => {
    if (selected.length === 2) onCompare(selected);
  };

  if (completed.length === 0) {
    return (
      <div className="flex-col flex-center fade-in" style={{ minHeight: '60vh', padding: '40px 24px' }}>
        <div style={{ fontSize: 48, color: 'var(--gold)', opacity: 0.4, fontFamily: 'Georgia, serif', marginBottom: 16 }}>道</div>
        <p style={{ color: 'var(--text-muted)' }}>Brak zakończonych sesji.</p>
        <button className="btn-ghost" onClick={onBack} style={{ marginTop: 16 }}>← Wróć</button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Historia sesji</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', margin: 0 }}>
            {completed.length} {completed.length === 1 ? 'sesja' : completed.length < 5 ? 'sesje' : 'sesji'}
          </p>
        </div>
        <div className="flex gap-8">
          {selected.length === 2 && (
            <button className="btn-primary" onClick={handleCompare} style={{ fontSize: '0.9rem' }}>
              Porównaj →
            </button>
          )}
          <button className="btn-ghost" onClick={onBack}>← Wróć</button>
        </div>
      </div>

      {/* Compare hint */}
      {completed.length > 1 && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, background: 'var(--surface)',
          fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 20,
        }}>
          Zaznacz 2 sesje, żeby je porównać ({selected.length}/2 zaznaczono)
        </div>
      )}

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 20, top: 12, bottom: 12,
          width: 2, background: 'var(--border)',
        }} />

        <div className="flex-col gap-4">
          {completed.map((s, i) => {
            const isSelected = selected.includes(s.id);
            const ago = monthsAgo(s.date);

            return (
              <div key={s.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Timeline dot / checkbox */}
                <div
                  onClick={() => completed.length > 1 && toggleSelect(s.id)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? 'var(--gold)' : i === 0 ? 'var(--surface)' : 'var(--bg)',
                    border: `2px solid ${isSelected ? 'var(--gold)' : i === 0 ? 'var(--gold)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: completed.length > 1 ? 'pointer' : 'default',
                    fontSize: '0.75rem', color: isSelected ? 'var(--bg)' : 'var(--text-dim)',
                    fontWeight: 600, zIndex: 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {isSelected ? '✓' : fmtDateShort(s.date).split(' ')[0]}
                </div>

                {/* Card */}
                <div
                  className="card"
                  onClick={() => onView(s.id)}
                  style={{
                    flex: 1, cursor: 'pointer', marginBottom: 12,
                    borderColor: isSelected ? 'var(--gold)' : i === 0 ? 'var(--border)' : 'var(--border)',
                    opacity: i === 0 ? 1 : 0.85,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                    <div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: 4 }}>
                        {fmtDate(s.date)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        {s.type === 'correction' ? 'Korekta kierunku' : 'Pełna sesja'}
                        {i === 0 && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>· Ostatnia</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                      {ago === 0 ? 'Ten miesiąc' : `${ago} mies. temu`}
                      <br />
                      <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Zobacz →</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
