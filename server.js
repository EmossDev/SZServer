// Sector Zero online sunucusu (Toprak Bilişim) - node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// Arayüzü sunucu açılırken bir kez belleğe güvenli şekilde yükle (sunucuyu yormaz)
let htmlCache = '';
try {
  htmlCache = fs.readFileSync(path.join(__dirname, 'panel.html'), 'utf8');
} catch (e) {
  htmlCache = 'Sector Zero server OK (panel.html bulunamadı)';
}

const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  r.end(htmlCache);
});

const wss = new WebSocketServer({ server: srv, maxPayload: 4096 });
const C = new Map(); let dirty = false, n = 0;

wss.on('connection', ws => {
  const id = 'p' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
  const c = { ws, p: {}, cnt: 0 }; C.set(id, c); ws.send(JSON.stringify({ t: 'hi', id })); dirty = true;
  
  ws.on('message', m => {
    if (++c.cnt > 80) return; // saniyede en fazla 80 mesaj
    let d; try { d = JSON.parse(m) } catch (e) { return }
    if (d.t !== 'p' || !d.p || typeof d.p !== 'object') return;
    for (const k in d.p) {
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(k)) continue;
      const v = d.p[k];
      if (v === null) delete c.p[k];
      else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length < 40)) c.p[k] = v;
    }
    dirty = true;
  });

  ws.on('close', () => { C.delete(id); dirty = true }); 
  ws.on('error', () => { });
});

setInterval(() => { for (const c of C.values()) c.cnt = 0 }, 1000);
setInterval(() => {
  if (!dirty) return; dirty = false;
  const all = {}; for (const [id, c] of C) all[id] = c.p;
  const s = JSON.stringify({ t: 's', p: all });
  for (const c of C.values()) if (c.ws.readyState === 1) c.ws.send(s);
}, 50);

srv.listen(process.env.PORT || 8080, () => console.log('Sector Zero server hazir'));
