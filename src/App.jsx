import { useState, useEffect, useCallback } from 'react';
import { DB, uuid, monthsAgo } from './db';
import { CONTENT_PHASES, CORRECTION_PHASE_IDS } from './constants';
import Header from './screens/Header';
import Onboarding from './screens/Onboarding';
import HomeScreen from './screens/HomeScreen';
import SessionScreen from './screens/SessionScreen';
import ReportScreen from './screens/ReportScreen';
import HistoryScreen from './screens/HistoryScreen';
import CompareScreen from './screens/CompareScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  const [view, setView] = useState('loading');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [reportSessionId, setReportSessionId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [draftPrompt, setDraftPrompt] = useState(null); // { id, date }

  // ─── Init ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem('ikigai_theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      applyTheme(saved);

      const allSessions = await DB.getSessions();
      setSessions(allSessions);

      const onboarded = localStorage.getItem('ikigai_onboarded');
      if (!onboarded) { setView('onboarding'); return; }

      // Check for unfinished draft
      const draft = allSessions.find(s => s.status === 'draft');
      if (draft) {
        setDraftPrompt({ id: draft.id, date: draft.date });
      }

      // Check notification reminder
      checkNotificationReminder(allSessions);

      setView('home');
    })();
  }, []);

  const applyTheme = (t) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem('ikigai_theme', t);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', t === 'dark' ? '#181410' : '#f7f2e8');
  };

  const checkNotificationReminder = (allSessions) => {
    const interval = parseInt(localStorage.getItem('ikigai_notif_months') || '0');
    if (!interval) return;
    const completed = allSessions.filter(s => s.status === 'completed');
    if (!completed.length) return;
    const last = completed[0];
    if (monthsAgo(last.date) >= interval) {
      // Show in-app reminder via Home screen (passed as prop)
    }
  };

  const refreshSessions = useCallback(async () => {
    const all = await DB.getSessions();
    setSessions(all);
  }, []);

  // ─── Session handlers ────────────────────────────────────────────
  const startNewSession = useCallback(async (type = 'full') => {
    const session = {
      id: uuid(),
      date: new Date().toISOString(),
      type,
      status: 'draft',
      answers: {},
      report: null,
      notes: [],
      skippedQuestions: [],
    };
    await DB.saveSession(session);
    await refreshSessions();
    setActiveSessionId(session.id);
    setView('session');
  }, [refreshSessions]);

  const continueDraft = useCallback(async (id) => {
    setDraftPrompt(null);
    setActiveSessionId(id);
    setView('session');
  }, []);

  const handleSessionReady = useCallback(async (sessionId) => {
    await refreshSessions();
    setReportSessionId(sessionId);
    setView('report');
  }, [refreshSessions]);

  const handleSessionBack = useCallback(async (sessionId) => {
    await refreshSessions();
    setView('home');
  }, [refreshSessions]);

  const viewSession = useCallback((id) => {
    setReportSessionId(id);
    setView('report');
  }, []);

  const startCompare = useCallback((ids) => {
    setCompareIds(ids);
    setView('compare');
  }, []);

  const handleDeleteAll = useCallback(async () => {
    await DB.clearAll();
    setSessions([]);
    setView('home');
  }, []);

  const handleOnboardingDone = useCallback(() => {
    localStorage.setItem('ikigai_onboarded', '1');
    setView('home');
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  // ─── Render ──────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="app flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (view === 'onboarding') {
    return <Onboarding onDone={handleOnboardingDone} />;
  }

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const lastCompleted = completedSessions[0] || null;
  const showCorrectionOption = lastCompleted && monthsAgo(lastCompleted.date) >= 1;

  return (
    <div className="app">
      <Header
        view={view}
        theme={theme}
        onToggleTheme={toggleTheme}
        onHome={() => setView('home')}
        onHistory={() => setView('history')}
        onSettings={() => setView('settings')}
        sessionCount={completedSessions.length}
      />
      <main>
        {view === 'home' && (
          <HomeScreen
            sessions={sessions}
            draftPrompt={draftPrompt}
            showCorrection={showCorrectionOption}
            onStart={() => startNewSession('full')}
            onCorrection={() => startNewSession('correction')}
            onContinueDraft={continueDraft}
            onHistory={() => setView('history')}
            onViewSession={viewSession}
          />
        )}
        {view === 'session' && (
          <SessionScreen
            sessionId={activeSessionId}
            onReady={handleSessionReady}
            onBack={handleSessionBack}
          />
        )}
        {view === 'report' && (
          <ReportScreen
            sessionId={reportSessionId}
            allSessions={sessions}
            onBack={() => setView(sessions.length > 1 ? 'history' : 'home')}
            onNewSession={() => startNewSession('full')}
            onRefresh={refreshSessions}
          />
        )}
        {view === 'history' && (
          <HistoryScreen
            sessions={sessions}
            onView={viewSession}
            onCompare={startCompare}
            onBack={() => setView('home')}
          />
        )}
        {view === 'compare' && (
          <CompareScreen
            sessions={sessions}
            initialIds={compareIds}
            onBack={() => setView('history')}
          />
        )}
        {view === 'settings' && (
          <SettingsScreen
            theme={theme}
            onToggleTheme={toggleTheme}
            sessions={sessions}
            onDeleteAll={handleDeleteAll}
            onBack={() => setView('home')}
          />
        )}
      </main>
    </div>
  );
}
