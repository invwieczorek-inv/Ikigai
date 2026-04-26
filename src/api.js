// Wszystkie wywołania przez /api/generate (proxy w server.js lub Vercel function)
// — klucz API nigdy nie trafia do przeglądarki

export async function generateReport(answers, type = 'full', previousReport = null, onChunk = null) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, type, previousReport }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Błąd serwera (${res.status})`);
  }

  const ct = res.headers.get('content-type') || '';
  let fullText = '';

  if (ct.includes('text/event-stream')) {
    // Streaming (server.js lokalny)
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            fullText += ev.delta.text;
            onChunk?.(fullText);
          }
          if (ev.type === 'error') throw new Error(ev.error?.message || 'Błąd API');
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }
  } else {
    // JSON (Vercel function)
    const data = await res.json();
    fullText = data.report || data.content?.[0]?.text || '';
    onChunk?.(fullText);
  }

  if (!fullText) throw new Error('Pusty raport — spróbuj ponownie');
  return fullText;
}

export async function compareSessionsAI(session1, session2) {
  const res = await fetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session1, session2 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Błąd serwera (${res.status})`);
  }
  const data = await res.json();
  return data.analysis;
}
