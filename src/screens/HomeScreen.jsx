import { fmtDate, monthsAgo } from '../db';

export default function HomeScreen({ sessions, draftPrompt, showCorrection, onStart, onCorrection, onContinueDraft, onHistory, onViewSession }) {
  const completed = sessions.filter(s => s.status === 'completed');
  const last = completed[0] || null;
  const monthsSinceLast = last ? monthsAgo(last.date) : null;

  return (
    <div className="fade-in" style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
      {/* Hero */}
      <div className="text-center mb-32">
        <div style={{ fontSize: 72, color: 'var(--gold)', fontFamily: 'Georgia, serif', opacity: 0.8, lineHeight: 1, marginBottom: 16 }}>
          生き甲斐
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Odkryj swój powód, by wstawać każdego ranka.
        </p>
      </div>

      {/* Draft recovery */}
      {draftPrompt && (
        <div className="card mb-16" style={{ borderColor: 'var(--gold)', borderWidth: 1, borderStyle: 'solid' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--gold)', marginBottom: 8 }}>
            Niedokończona sesja
          </div>
          <p className="mb-16" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Masz niezapisaną sesję z {fmtDate(draftPrompt.date)}. Kontynuować?
          </p>
          <div className="flex gap-8">
            <button className="btn-primary" onClick={() => onContinueDraft(draftPrompt.id)}>
              Kontynuuj
            </button>
            <button className="btn-ghost" onClick={onStart}>
              Zacznij od nowa
            </button>
          </div>
        </div>
      )}

      {/* Last session summary */}
      {last && !draftPrompt && (
        <div className="card mb-16" onClick={() => onViewSession(last.id)} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8 }}>
            Ostatnia sesja
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', marginBottom: 4 }}>
            {fmtDate(last.date)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {monthsSinceLast === 0 ? 'Ten miesiąc' : `${monthsSinceLast} ${monthsSinceLast === 1 ? 'miesiąc' : monthsSinceLast < 5 ? 'miesiące' : 'miesięcy'} temu`}
            {' · '}
            <span style={{ color: 'var(--gold)' }}>Zobacz raport →</span>
          </div>
        </div>
      )}

      {/* Main actions */}
      {!draftPrompt && (
        <div className="flex-col gap-12 mb-24">
          <button className="btn-primary" onClick={onStart} style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
            {last ? 'Nowa sesja' : 'Rozpocznij odkrywanie'}
          </button>

          {showCorrection && (
            <div>
              <button className="btn-ghost" onClick={onCorrection} style={{ width: '100%' }}>
                Korekta kierunku (3 etapy)
              </button>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', marginTop: 6 }}>
                Szybka weryfikacja po {monthsSinceLast} {monthsSinceLast === 1 ? 'miesiącu' : 'miesiącach'} — tylko teraźniejszość, zasoby i synteza
              </p>
            </div>
          )}
        </div>
      )}

      {/* History shortcut */}
      {completed.length > 1 && (
        <div className="text-center">
          <button className="btn-ghost" onClick={onHistory} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Historia sesji ({completed.length}) →
          </button>
        </div>
      )}

      {/* Empty state */}
      {!last && !draftPrompt && (
        <div className="text-center" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: 32 }}>
          <p>Pierwsza sesja zajmuje ok. 20–30 minut.</p>
          <p>Możesz ją przerwać i dokończyć później.</p>
        </div>
      )}
    </div>
  );
}
