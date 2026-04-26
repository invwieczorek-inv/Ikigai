export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session1, session2 } = req.body;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Klucz API nie jest skonfigurowany.' });
  }

  const formatSession = (s) => {
    if (s.report) return `RAPORT:\n${s.report}`;
    return `ODPOWIEDZI:\n${Object.entries(s.answers || {}).filter(([,v]) => v?.trim()).map(([k,v]) => `[${k}]: ${v}`).join('\n\n')}`;
  };

  const systemPrompt = `Jesteś coachem Ikigai analizującym ewolucję kierunku życiowego użytkownika między dwiema sesjami.

SESJA 1 (${new Date(session1.date).toLocaleDateString('pl-PL')}):
${formatSession(session1)}

SESJA 2 (${new Date(session2.date).toLocaleDateString('pl-PL')}):
${formatSession(session2)}

Napisz po polsku analizę ewolucji (200-300 słów). Odpowiedz na:
— Co się zmieniło w tym, jak osoba postrzega siebie i swoje możliwości?
— Co pozostało stałe — jakie wzorce powracają?
— W jakim kierunku zmierza ta osoba?

Zakończ jednym zdaniem-pytaniem do refleksji.
Ton: uważny, konkretny, ciepły. Bez ogólników.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Porównaj te dwie sesje.' }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `API error ${resp.status}`);

    return res.status(200).json({ analysis: data.content[0].text });
  } catch (err) {
    console.error('Compare error:', err);
    return res.status(500).json({ error: err.message });
  }
}
