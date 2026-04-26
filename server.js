// Lokalny serwer Ikigai — uruchom: node server.js
// Wymaga Node.js 18+, zero dodatkowych zależności

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const DIR  = fs.existsSync(DIST) ? DIST : __dirname;

function loadEnv() {
  const envPath = path.join(DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq < 1) return;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  });
}
loadEnv();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

// ─── Streaming proxy do Anthropic (dla /api/generate) ──────────────────────────
function streamAnthropicResponse(body, clientRes) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    clientRes.writeHead(500, { 'Content-Type': 'application/json' });
    return clientRes.end(JSON.stringify({
      error: 'Brak klucza API. Utwórz plik .env z linią: ANTHROPIC_API_KEY=sk-ant-...'
    }));
  }

  const reqBody = JSON.stringify({ ...body, stream: true });
  const opts = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'Content-Length':  Buffer.byteLength(reqBody),
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
  };

  clientRes.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  });

  const apiReq = https.request(opts, (apiRes) => {
    if (apiRes.statusCode !== 200) {
      let errData = '';
      apiRes.on('data', c => { errData += c; });
      apiRes.on('end', () => {
        let msg = 'Błąd API';
        try { msg = JSON.parse(errData).error?.message || msg; } catch {}
        clientRes.write(`data: {"type":"error","error":{"message":"${msg}"}}\n\n`);
        clientRes.end();
      });
      return;
    }
    apiRes.pipe(clientRes);
  });

  apiReq.on('error', err => {
    clientRes.write(`data: {"type":"error","error":{"message":"${err.message}"}}\n\n`);
    clientRes.end();
  });

  apiReq.write(reqBody);
  apiReq.end();
}

// ─── Zwykłe proxy (dla /api/compare) ──────────────────────────────────────────
function proxyAnthropicCall(body, clientRes) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    clientRes.writeHead(500, { 'Content-Type': 'application/json' });
    return clientRes.end(JSON.stringify({ error: 'Brak klucza API.' }));
  }

  const reqBody = JSON.stringify(body);
  const opts = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'Content-Length':  Buffer.byteLength(reqBody),
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
  };

  const apiReq = https.request(opts, (apiRes) => {
    let data = '';
    apiRes.on('data', c => { data += c; });
    apiRes.on('end', () => {
      clientRes.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
      clientRes.end(data);
    });
  });

  apiReq.on('error', err => {
    clientRes.writeHead(500, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: err.message }));
  });

  apiReq.write(reqBody);
  apiReq.end();
}

// ─── Prompty ──────────────────────────────────────────────────────────────────
function buildFullPrompt(answers) {
  const text = Object.entries(answers).filter(([,v])=>v?.trim()).map(([k,v])=>`[${k}]: ${v}`).join('\n\n');
  return `Jesteś głęboko empatycznym coachem Ikigai, działającym w tradycji japońskiej filozofii — nie zachodniej wersji z diagramem Venna, ale oryginalnego Ikigai jako "powodu do wstawania każdego ranka". Integrujesz: oryginalne japońskie Ikigai, mocne strony Gallupa, Cień Junga, Syndrom Oszusta, konstruktywistyczne doradztwo kariery. Ton: spokojny, bezpośredni, do "Ciebie".

ODPOWIEDZI UŻYTKOWNIKA:
${text}

Wygeneruj spersonalizowany raport Ikigai po polsku. Sekcje oddzielone ---:

🌿 ESENCJA
2-3 zdania syntezy, konkretnie, bez ogólników.

---

⛩️ TWOJE NATURALNE TALENTY
3-4 wzorce przez czasowniki i działania.

---

🍵 NIEODKRYTE ZASOBY
Co widać w cieniu i fascynacjach?

---

🎋 SYNDROM OSZUSTA
Czy jest obecny? Jak się przejawia?

---

🌸 KIERUNEK IKIGAI
Metafora lub obraz kierunku. Na końcu: (SŁOWO-KLUCZ)

---

✦ JEDEN KROK
Konkretne działanie na najbliższy tydzień.

---

❓ PYTANIE DO ZABRANIA
Jedno głębokie pytanie na kolejne dni.

80-130 słów na sekcję.`;
}

function buildCorrectionPrompt(answers, previousReport) {
  const text = Object.entries(answers).filter(([,v])=>v?.trim()).map(([k,v])=>`[${k}]: ${v}`).join('\n\n');
  return `Jesteś coachem Ikigai. Użytkownik wraca na korektę kursu.

POPRZEDNI RAPORT:
${previousReport}

NOWE ODPOWIEDZI:
${text}

Wygeneruj raport korekty kursu po polsku, sekcje oddzielone ---:

🔄 CO SIĘ ZMIENIŁO
Co ewoluowało? Co pozostało stałe?

---

🌸 AKTUALNY KIERUNEK
Ikigai teraz. Na końcu: (SŁOWO-KLUCZ)

---

✦ JEDEN KROK
Konkretne działanie na teraz.

---

❓ PYTANIE DO ZABRANIA
Nowe pytanie na kolejny okres.`;
}

function buildComparePrompt(s1, s2) {
  const fmt = s => s.report ? `RAPORT:\n${s.report}` : `ODPOWIEDZI:\n${Object.entries(s.answers||{}).filter(([,v])=>v?.trim()).map(([k,v])=>`[${k}]: ${v}`).join('\n\n')}`;
  return `Jesteś coachem Ikigai analizującym ewolucję między dwiema sesjami.

SESJA 1 (${new Date(s1.date).toLocaleDateString('pl-PL')}):
${fmt(s1)}

SESJA 2 (${new Date(s2.date).toLocaleDateString('pl-PL')}):
${fmt(s2)}

Napisz po polsku analizę ewolucji (200-300 słów). Co się zmieniło? Co stałe? Dokąd zmierza ta osoba? Zakończ pytaniem do refleksji. Ton: uważny, konkretny.`;
}

// ─── Główny serwer ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);

  res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── API POST routes ────────────────────────────────────────────
  if (req.method === 'POST' && (pathname === '/api/generate' || pathname === '/api/compare')) {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); }
      catch { res.writeHead(400); return res.end('Bad request'); }

      if (pathname === '/api/generate') {
        const { answers, type = 'full', previousReport = null } = parsed;
        const system = (type === 'correction' && previousReport)
          ? buildCorrectionPrompt(answers, previousReport)
          : buildFullPrompt(answers);
        streamAnthropicResponse({ model: 'claude-sonnet-4-6', max_tokens: 1800, system, messages: [{ role: 'user', content: 'Wygeneruj mój raport Ikigai.' }] }, res);
      } else {
        const { session1, session2 } = parsed;
        proxyAnthropicCall({ model: 'claude-sonnet-4-6', max_tokens: 500, system: buildComparePrompt(session1, session2), messages: [{ role: 'user', content: 'Porównaj te sesje.' }] }, res);
      }
    });
    return;
  }

  // ── Pliki statyczne ────────────────────────────────────────────
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(path.join(DIR, filePath));

  if (!filePath.startsWith(DIR + path.sep) && filePath !== path.join(DIR, 'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code !== 'ENOENT') { res.writeHead(500); return res.end('Error'); }
      fs.readFile(path.join(DIR, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const ct = MIME[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': ct };
    if (filePath.endsWith('sw.js')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Service-Worker-Allowed'] = '/';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║        🌿  IKIGAI — Serwer lokalny        ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Otwórz:  http://localhost:${PORT}              ║`);
  console.log('║   Zatrzymaj:  Ctrl+C                      ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Brak klucza API — raporty AI nie będą działać.');
    console.log('   Utwórz plik .env z: ANTHROPIC_API_KEY=sk-ant-...\n');
  } else {
    console.log('✓  Klucz API wczytany — raporty AI gotowe.\n');
  }
});
