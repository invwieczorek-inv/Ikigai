import { useState } from 'react';
import { DB } from '../db';

export default function SettingsScreen({ theme, onToggleTheme, sessions, onDeleteAll, onBack }) {
  const [notifMonths, setNotifMonths] = useState(() =>
    parseInt(localStorage.getItem('ikigai_notif_months') || '0')
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const handleNotifChange = (val) => {
    setNotifMonths(val);
    localStorage.setItem('ikigai_notif_months', String(val));
  };

  const handleExport = async () => {
    const json = await DB.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ikigai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg('Plik zapisany!');
    setTimeout(() => setExportMsg(''), 3000);
  };

  const handleDeleteAll = async () => {
    await onDeleteAll();
    setDeleteConfirm(false);
  };

  const completedCount = sessions.filter(s => s.status === 'completed').length;

  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ margin: 0 }}>Ustawienia</h2>
        <button className="btn-ghost" onClick={onBack}>← Wróć</button>
      </div>

      {/* Appearance */}
      <div className="card mb-16">
        <h3 style={{ marginBottom: 16, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-dim)' }}>
          Wygląd
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: 2 }}>Motyw</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              {theme === 'dark' ? 'Ciemny' : 'Jasny'}
            </div>
          </div>
          <button className="btn-ghost" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀️ Jasny' : '🌙 Ciemny'}
          </button>
        </div>
      </div>

      {/* Reminders */}
      <div className="card mb-16">
        <h3 style={{ marginBottom: 16, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-dim)' }}>
          Przypomnienia
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Aplikacja pokaże Ci przypomnienie, gdy minie wybrany czas od ostatniej sesji.
        </p>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {[0, 1, 3, 6].map(m => (
            <button
              key={m}
              onClick={() => handleNotifChange(m)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem',
                border: '1px solid',
                borderColor: notifMonths === m ? 'var(--gold)' : 'var(--border)',
                background: notifMonths === m ? 'var(--gold)' : 'transparent',
                color: notifMonths === m ? 'var(--bg)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {m === 0 ? 'Wyłączone' : `${m} mies.`}
            </button>
          ))}
        </div>
      </div>

      {/* Data */}
      <div className="card mb-16">
        <h3 style={{ marginBottom: 16, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-dim)' }}>
          Dane
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ marginBottom: 2 }}>Eksport danych</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              {completedCount} {completedCount === 1 ? 'sesja' : completedCount < 5 ? 'sesje' : 'sesji'} · plik JSON
            </div>
          </div>
          <button className="btn-ghost" onClick={handleExport}>
            {exportMsg || 'Eksportuj ↓'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: 2, color: 'var(--error, #e74c3c)' }}>Usuń wszystkie dane</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Tej operacji nie można cofnąć
            </div>
          </div>
          {!deleteConfirm ? (
            <button className="btn-ghost" onClick={() => setDeleteConfirm(true)} style={{ color: 'var(--error, #e74c3c)' }}>
              Usuń
            </button>
          ) : (
            <div className="flex gap-8">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(false)}>Anuluj</button>
              <button className="btn-primary" onClick={handleDeleteAll} style={{ background: 'var(--error, #c0392b)' }}>
                Potwierdzam
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Privacy info */}
      <div style={{
        padding: '14px 16px', borderRadius: 8, background: 'var(--surface)',
        fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--text-muted)' }}>Prywatność</strong>
        <br />
        Wszystkie dane są przechowywane lokalnie na Twoim urządzeniu (IndexedDB).
        Jedyny moment wysyłania danych to generowanie raportu przez Anthropic API.
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        Ikigai v2.0 · Claude Sonnet
      </div>
    </div>
  );
}
