import { useState, useEffect, useRef, useCallback } from 'react';
import { DB } from '../db';
import { CONTENT_PHASES, CORRECTION_PHASE_IDS, TOTAL_QUESTIONS } from '../constants';

const AUTOSAVE_DELAY = 1500;
const AUTOSAVE_INTERVAL = 30000;
const MIN_ANSWER_LENGTH = 20;

function estimateMinutes(answeredCount, totalCount) {
  const remaining = totalCount - answeredCount;
  return Math.max(1, Math.round(remaining * 1.5));
}

export default function SessionScreen({ sessionId, onReady, onBack }) {
  const [session, setSession] = useState(null);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [skipped, setSkipped] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(null);
  const autosaveTimer = useRef(null);
  const intervalTimer = useRef(null);

  // Load session
  useEffect(() => {
    (async () => {
      const s = await DB.getSession(sessionId);
      if (!s) return;
      setSession(s);
      setAnswers(s.answers || {});
      setSkipped(s.skippedQuestions || []);

      // Resume at last unanswered phase
      const phases = getPhases(s.type);
      const lastPhaseWithAnswer = phases.findIndex(p =>
        p.questions.some(q => s.answers?.[q.id])
      );
      if (lastPhaseWithAnswer >= 0) setPhaseIdx(lastPhaseWithAnswer);
    })();
  }, [sessionId]);

  // Interval autosave
  useEffect(() => {
    intervalTimer.current = setInterval(() => {
      if (dirty) saveSession();
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(intervalTimer.current);
  }, [dirty, answers, skipped]);

  const getPhases = (type) => {
    if (type === 'correction') {
      return CONTENT_PHASES.filter(p => CORRECTION_PHASE_IDS.includes(p.id));
    }
    return CONTENT_PHASES;
  };

  const phases = session ? getPhases(session.type) : CONTENT_PHASES;
  const currentPhase = phases[phaseIdx];
  const totalQs = phases.reduce((a, p) => a + p.questions.length, 0);
  const answeredQs = Object.keys(answers).filter(k => answers[k]?.trim().length >= MIN_ANSWER_LENGTH).length;
  const skippedQs = skipped.length;
  const progressPct = Math.round(((answeredQs + skippedQs) / totalQs) * 100);
  const canGenerate = answeredQs / totalQs >= 0.7;
  const isLastPhase = phaseIdx === phases.length - 1;

  const saveSession = useCallback(async (extraData = {}) => {
    if (!session) return;
    setSaving(true);
    const updated = { ...session, answers, skippedQuestions: skipped, ...extraData };
    await DB.saveSession(updated);
    setDirty(false);
    setSaving(false);
  }, [session, answers, skipped]);

  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setDirty(true);
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => saveSession(), AUTOSAVE_DELAY);
  }, [saveSession]);

  const handleSkip = (questionId) => {
    setShowSkipConfirm(null);
    setSkipped(prev => [...prev.filter(id => id !== questionId), questionId]);
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setDirty(true);
  };

  const handleUnskip = (questionId) => {
    setSkipped(prev => prev.filter(id => id !== questionId));
    setDirty(true);
  };

  const handleNextPhase = async () => {
    await saveSession();
    if (isLastPhase) return;
    setPhaseIdx(i => i + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevPhase = () => {
    if (phaseIdx === 0) {
      saveSession();
      onBack(sessionId);
      return;
    }
    setPhaseIdx(i => i - 1);
    window.scrollTo(0, 0);
  };

  const handleGenerate = async () => {
    await saveSession({ status: 'generating' });
    onReady(sessionId);
  };

  const phaseAnsweredCount = (phase) =>
    phase.questions.filter(q => answers[q.id]?.trim().length >= MIN_ANSWER_LENGTH || skipped.includes(q.id)).length;

  if (!session) {
    return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            {answeredQs} / {totalQs} odpowiedzi
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            ~{estimateMinutes(answeredQs + skippedQs, totalQs)} min
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: `linear-gradient(90deg, var(--moss), var(--gold))`,
            width: `${progressPct}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Phase tabs */}
        <div className="flex gap-4" style={{ marginTop: 16, flexWrap: 'wrap' }}>
          {phases.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { saveSession(); setPhaseIdx(i); }}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem',
                border: '1px solid',
                borderColor: i === phaseIdx ? 'var(--gold)' : 'var(--border)',
                background: i === phaseIdx ? 'var(--gold)' : 'transparent',
                color: i === phaseIdx ? 'var(--bg)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: i === phaseIdx ? 600 : 400,
              }}
            >
              {p.kanji} {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Phase header */}
      <div className="mb-32">
        <div style={{ fontSize: 48, color: 'var(--gold)', fontFamily: 'Georgia, serif', opacity: 0.7, marginBottom: 8 }}>
          {currentPhase.kanji}
        </div>
        <h2 style={{ marginBottom: 4 }}>{currentPhase.title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{currentPhase.subtitle}</p>
        {currentPhase.info && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: 'var(--surface)', borderLeft: '3px solid var(--gold)',
            fontSize: '0.88rem', color: 'var(--text-muted)',
          }}>
            {currentPhase.info}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="flex-col gap-24 mb-32">
        {currentPhase.questions.map((q, qi) => {
          const isSkipped = skipped.includes(q.id);
          const val = answers[q.id] || '';
          const valid = val.trim().length >= MIN_ANSWER_LENGTH;

          return (
            <div key={q.id} className="card" style={{
              borderColor: isSkipped ? 'var(--border)' : valid ? 'var(--moss)' : 'var(--border)',
              opacity: isSkipped ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Pytanie {qi + 1}
                </span>
                {isSkipped ? (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', padding: '2px 8px' }}
                    onClick={() => handleUnskip(q.id)}
                  >
                    Odpowiedz
                  </button>
                ) : (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', padding: '2px 8px', color: 'var(--text-dim)' }}
                    onClick={() => showSkipConfirm === q.id ? handleSkip(q.id) : setShowSkipConfirm(q.id)}
                  >
                    {showSkipConfirm === q.id ? 'Potwierdzam pominięcie' : 'Pomiń'}
                  </button>
                )}
              </div>

              <p style={{ marginBottom: 8, lineHeight: 1.6, fontFamily: 'Georgia, serif' }}>{q.text}</p>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-dim)', marginBottom: 12, fontStyle: 'italic' }}>
                {q.hint}
              </p>

              {!isSkipped && (
                <textarea
                  rows={4}
                  value={val}
                  onChange={e => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Twoja odpowiedź..."
                  style={{
                    width: '100%', resize: 'vertical', minHeight: 100,
                    fontFamily: 'inherit', fontSize: '0.95rem',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase progress */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 16, textAlign: 'center' }}>
        {phaseAnsweredCount(currentPhase)} / {currentPhase.questions.length} w tym etapie
        {saving && <span style={{ marginLeft: 12 }}>· zapisuję...</span>}
      </div>

      {/* Navigation */}
      <div className="flex gap-12" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-ghost" onClick={handlePrevPhase}>
          ← {phaseIdx === 0 ? 'Wyjdź' : 'Wstecz'}
        </button>

        <div className="flex gap-8">
          {isLastPhase ? (
            <>
              {canGenerate ? (
                <button className="btn-primary" onClick={handleGenerate} style={{ padding: '12px 28px' }}>
                  Generuj raport →
                </button>
              ) : (
                <div style={{ textAlign: 'right' }}>
                  <button className="btn-primary" disabled style={{ opacity: 0.4, padding: '12px 28px' }}>
                    Generuj raport
                  </button>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    Potrzeba min. 70% odpowiedzi ({Math.ceil(totalQs * 0.7)} pytań)
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="btn-primary" onClick={handleNextPhase}>
              Dalej →
            </button>
          )}
        </div>
      </div>

      {/* Threshold hint */}
      {isLastPhase && !canGenerate && (
        <div style={{
          marginTop: 24, padding: '12px 16px', borderRadius: 8,
          background: 'var(--surface)', textAlign: 'center',
          fontSize: '0.88rem', color: 'var(--text-muted)',
        }}>
          Odpowiedziano na {answeredQs} z {totalQs} pytań. Potrzeba jeszcze {Math.ceil(totalQs * 0.7) - answeredQs} więcej, żeby wygenerować raport.
        </div>
      )}
    </div>
  );
}
