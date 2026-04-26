import { useState, useEffect, useRef } from 'react';
import { DB, fmtDate, parseReport } from '../db';
import { generateReport } from '../api';

export default function ReportScreen({ sessionId, allSessions, onBack, onNewSession, onRefresh }) {
  const [session, setSession] = useState(null);
  const [sections, setSections] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const reportRef = useRef(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    (async () => {
      const s = await DB.getSession(sessionId);
      if (!s) return;
      setSession(s);

      if (s.report) {
        setSections(parseReport(s.report));
        return;
      }

      // Auto-generate if no report yet
      if (!hasGenerated.current) {
        hasGenerated.current = true;
        await generate(s);
      }
    })();
  }, [sessionId]);

  const generate = async (s) => {
    setStreaming(true);
    setError(null);
    setSections([]);

    try {
      const previousReport = s.type === 'correction'
        ? allSessions.find(prev => prev.status === 'completed' && prev.id !== s.id)?.report || null
        : null;

      const fullText = await generateReport(
        s.answers,
        s.type || 'full',
        previousReport,
        (partial) => setSections(parseReport(partial))
      );

      const updated = { ...s, report: fullText, status: 'completed' };
      await DB.saveSession(updated);
      setSession(updated);
      setSections(parseReport(fullText));
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setStreaming(false);
    }
  };

  const handleRetry = () => {
    if (session) generate(session);
  };

  const handleAddNote = async () => {
    if (!note.trim() || !session) return;
    const newNote = { text: note.trim(), date: new Date().toISOString() };
    const updated = { ...session, notes: [...(session.notes || []), newNote] };
    await DB.saveSession(updated);
    setSession(updated);
    setNote('');
    setShowNoteInput(false);
    onRefresh();
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      let y = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (y < h) {
        pdf.addImage(imgData, 'PNG', 0, -y, w, h);
        y += pageH;
        if (y < h) pdf.addPage();
      }
      pdf.save(`ikigai-${fmtDate(session.date).replace(/ /g, '-')}.pdf`);
    } catch (e) {
      alert('Błąd eksportu PDF: ' + e.message);
    }
  };

  if (!session) {
    return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 4 }}>
            {session.type === 'correction' ? 'Korekta kierunku' : 'Raport Ikigai'}
          </div>
          <h2 style={{ marginBottom: 0 }}>{fmtDate(session.date)}</h2>
        </div>
        <div className="flex gap-8">
          {session.report && (
            <button className="btn-ghost" onClick={handleExportPDF} style={{ fontSize: '0.85rem' }}>
              PDF ↓
            </button>
          )}
          <button className="btn-ghost" onClick={onBack}>
            ← Wróć
          </button>
        </div>
      </div>

      {/* Streaming indicator */}
      {streaming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: 18, height: 18 }} />
          <span>AI analizuje Twoje odpowiedzi...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card mb-24" style={{ borderColor: 'var(--error, #c0392b)' }}>
          <p style={{ color: 'var(--error, #e74c3c)', marginBottom: 12 }}>{error}</p>
          <button className="btn-primary" onClick={handleRetry}>Spróbuj ponownie</button>
        </div>
      )}

      {/* Report sections */}
      {sections.length > 0 && (
        <div ref={reportRef} className="flex-col gap-24 mb-32">
          {sections.map((section, i) => (
            <div key={i} className="card" style={{ lineHeight: 1.8 }}>
              <div style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'Georgia, serif',
                fontSize: '1rem',
                color: 'var(--text)',
              }}>
                {section}
              </div>
            </div>
          ))}
          {streaming && (
            <div style={{ textAlign: 'center', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
              ···
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {session.status === 'completed' && (
        <div className="mb-24">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Notatki</h3>
            <button className="btn-ghost" style={{ fontSize: '0.85rem' }} onClick={() => setShowNoteInput(v => !v)}>
              + Dodaj
            </button>
          </div>

          {showNoteInput && (
            <div className="card mb-12">
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Twoja refleksja, pytanie, obserwacja..."
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 8 }}
              />
              <div className="flex gap-8">
                <button className="btn-primary" onClick={handleAddNote}>Zapisz</button>
                <button className="btn-ghost" onClick={() => setShowNoteInput(false)}>Anuluj</button>
              </div>
            </div>
          )}

          {(session.notes || []).map((n, i) => (
            <div key={i} className="card mb-8" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                {fmtDate(n.date)}
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{n.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {session.status === 'completed' && (
        <div className="flex gap-12" style={{ justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={onNewSession}>
            Nowa sesja
          </button>
          <button className="btn-ghost" onClick={onBack}>
            ← Historia
          </button>
        </div>
      )}
    </div>
  );
}
