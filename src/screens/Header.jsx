export default function Header({ view, theme, onToggleTheme, onHome, onHistory, onSettings, sessionCount }) {
  return (
    <header>
      <button className="btn-ghost" onClick={onHome} style={{ padding: '4px 8px', fontSize: 20 }}>
        <span style={{ color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>生き甲斐</span>
        <span style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: 3, marginLeft: 10, textTransform: 'uppercase' }}>
          Ikigai
        </span>
      </button>

      <div className="flex gap-8" style={{ alignItems: 'center' }}>
        {sessionCount > 0 && (
          <button className="btn-icon" onClick={onHistory} title="Historia sesji">
            📋
          </button>
        )}
        <button className="btn-icon" onClick={onSettings} title="Ustawienia">
          ⚙️
        </button>
        <button className="btn-icon" onClick={onToggleTheme} title="Zmień motyw">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
