import http from 'node:http';
import { appendFileSync } from 'node:fs';

const port = Number(process.env.MOCK_WA_GATEWAY_PORT || 8787);
const logPath = process.env.MOCK_WA_GATEWAY_LOG || '';

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
    return;
  }

  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });

  req.on('end', () => {
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = { raw };
    }

    const record = {
      timestamp: new Date().toISOString(),
      path: req.url,
      authorization: req.headers.authorization || null,
      body,
    };

    console.log(JSON.stringify(record, null, 2));
    if (logPath) {
      appendFileSync(logPath, JSON.stringify(record) + '\n');
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      id: `mock-wa-${Date.now()}`,
      data: {
        accepted: true,
      },
    }));
  });
});

server.listen(port, () => {
  console.log(`Mock WA gateway listening on http://127.0.0.1:${port}`);
});
