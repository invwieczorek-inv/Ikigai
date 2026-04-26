import { useState, useEffect } from 'react';
import { DB, fmtDate } from '../db';
import { CONTENT_PHASES } from '../constants';
import { compareSessionsAI } from '../api';

export default function CompareScreen({ sessions, initialIds, onBack }) {
  const completed = sessions.filter(s => s.status === 'completed');
  const [ids, setIds] = useState(initialIds.length === 2 ? initialIds : [completed[0]?.id, completed[1]?.id].filter(Boolean));
  const [sessionData, setSessionData] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [activePhaseId, setActivePhaseId] = useState(CONTENT_PHASES[0].id);

  useEffect(() => {
    (async () => {
      const loaded = {};
      for (const id of ids) {
        if (id && !sessionData[id]) {
          loaded[id] = await DB.getSession(id);
        }
      }
      if (Object.keys(loaded).length) {
        setSessionData(prev => ({ ...prev, ...loaded }));
      }
    })();
  }, [ids]);

  const [s1, s2] = ids.map(id => sessionData[id]);

  const getAnswer = (session, questionId) => session?.answers?.[questionId] || '';

  const handleAIAnalysis = async () => {
    if (!s1 || !s2) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await compareSessionsAI(s1, s2);
      setAnalysis(result);
    } catch (e) {
      setAnalysisError(e.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const allPhases = CONTENT_PHASES;

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Porównanie sesji</h2>
        <button className="btn-ghost" onClick={onBack}>← Wróć</button>
      </div>

      {/* Session selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[0, 1].map(i => (
          <div key={i}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 6 }}>
              Sesja {i + 1}
            </label>
            <select
              value={ids[i] || ''}
              onChange={e => {
                const newIds = [...ids];
                newIds[i] = e.target.value;
                setIds(newIds);
                setAnalysis(null);
              }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem' }}
            >
              <option value="">Wybierz sesję...</option>
              {completed.map(s => (
                <option key={s.id} value={s.id}>{fmtDate(s.date)} {s.type === 'correction' ? '(korekta)' : ''}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {s1 && s2 && (
        <>
          {/* Phase tabs */}
          <div className="flex gap-4 mb-24" style={{ flexWrap: 'wrap' }}>
            {allPhases.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePhaseId(p.id)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem',
                  border: '1px solid',
                  borderColor: activePhaseId === p.id ? 'var(--gold)' : 'var(--border)',
                  background: activePhaseId === p.id ? 'var(--gold)' : 'transparent',
                  color: activePhaseId === p.id ? 'var(--bg)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {p.kanji} {p.title}
              </button>
            ))}
          </div>

          {/* Side-by-side answers */}
          {allPhases.filter(p => p.id === activePhaseId).map(phase => (
            <div key={phase.id} className="mb-32">
              <h3 style={{ marginBottom: 20, color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
                {phase.kanji} {phase.title}
              </h3>
              <div className="flex-col gap-16">
                {phase.questions.map(q => (
                  <div key={q.id}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.95rem', fontFamily: 'Georgia, serif' }}>
                      {q.text}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[s1, s2].map((s, i) => {
                        const ans = getAnswer(s, q.id);
                        return (
                          <div key={i} className="card" style={{
                            padding: '12px 14px',
                            borderColor: i === 0 ? 'var(--moss)' : 'var(--gold)',
                            opacity: ans ? 1 : 0.4,
                          }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                              {fmtDate(s.date)}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {ans || '—'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* AI Analysis */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0 }}>Analiza AI — co się zmieniło?</h3>
              <button
                className="btn-primary"
                onClick={handleAIAnalysis}
                disabled={analysisLoading}
                style={{ fontSize: '0.9rem' }}
              >
                {analysisLoading ? 'Analizuję...' : analysis ? 'Odśwież' : 'Generuj analizę'}
              </button>
            </div>

            {analysisLoading && (
              <div className="flex-center gap-12" style={{ padding: '24px 0', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                <span>Porównuję odpowiedzi...</span>
              </div>
            )}

            {analysisError && (
              <p style={{ color: 'var(--error, #e74c3c)', margin: 0 }}>{analysisError}</p>
            )}

            {analysis && !analysisLoading && (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}>
                {analysis}
              </div>
            )}

            {!analysis && !analysisLoading && !analysisError && (
              <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>
                AI porówna Twoje odpowiedzi z obu sesji i pokaże co się zmieniło w Twoim Ikigai.
              </p>
            )}
          </div>
        </>
      )}

      {(!s1 || !s2) && (
        <div className="text-center" style={{ color: 'var(--text-dim)', paddingTop: 40 }}>
          Wybierz dwie sesje, żeby je porównać.
        </div>
      )}
    </div>
  );
}
