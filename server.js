// Sector Zero - Serverless Ziyaretçi & Oyuncu Filtreli Motor (server.js)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

let htmlCache = '';
try {
  htmlCache = fs.readFileSync(path.join(__dirname, 'panel.html'), 'utf8');
} catch (e) {
  htmlCache = 'Sector Zero server OK';
}

const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  r.end(htmlCache);
});

const wss = new WebSocketServer({ server: srv, maxPayload: 4096 });
const Players = new Map();   // Gerçek oyun istemcileri
const Dashboards = new Set();// Paneli izleyen tarayıcı ziyaretçileri
let dirty = false, n = 0;

function broadcastViewers() {
  const msg = JSON.stringify({ t: 'viewers', count: Dashboards.size });
  for (const client of Dashboards) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on('connection', (ws, req) => {
  const ua = req.headers['user-agent'] || '';
  let isDashboard = false;

  ws.on('message', m => {
    let d; try { d = JSON.parse(m) } catch (e) { return }

    // Eğer bağlanan tarayıcıdan açılan panelse, oyuncu listesine katma, izleyici yap
    if (d.t === 'dashboard_join') {
      isDashboard = true;
      Dashboards.add(ws);
      broadcastViewers();
      return;
    }

    if (isDashboard) return; // İzleyicilerin oyun verisi göndermesini engelle

    // Gerçek Oyuncu Kaydı (Unity / APK / Harici client)
    let player = Players.get(ws);
    if (!player) {
      const id = 'p' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
      
      // Cihaz / Platform Tespiti
      let dev = "PC Masaüstü";
      if (/android/i.test(ua)) {
        dev = /mobile/i.test(ua) ? "Android (Mobil Web)" : "Android (APK)";
      } else if (/iphone|ipad|ipod/i.test(ua)) {
        dev = "iOS (Mobil)";
      }

      player = { id, p: { name: 'Oyuncu_' + id, device: dev }, cnt: 0 };
      Players.set(ws, player);
      dirty = true;
    }

    if (++player.cnt > 80) return;

    // Oyuncu ismini güncelleme paketi (Örn: {"t": "auth", "name": "Mücahit"})
    if (d.t === 'auth' && d.name && typeof d.name === 'string') {
      player.p.name = d.name.slice(0, 20); // Maksimum 20 karakter
      dirty = true;
    }

    // Oyun içi state güncellemeleri
    if (d.t === 'p' && d.p && typeof d.p === 'object') {
      for (const k in d.p) {
        if (!/^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(k)) continue;
        const v = d.p[k];
        if (v === null) delete player.p[k];
        else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length < 40)) player.p[k] = v;
      }
      dirty = true;
    }
  });

  ws.on('close', () => {
    if (Dashboards.has(ws)) {
      Dashboards.delete(ws);
      broadcastViewers();
    }
    if (Players.has(ws)) {
      Players.delete(ws);
      dirty = true;
    }
  });

  ws.on('error', () => {});
});

setInterval(() => { for (const c of Players.values()) c.cnt = 0 }, 1000);

// Durum değişikliklerini hem oyunculara hem de paneli izleyen yöneticilere gönder
setInterval(() => {
  if (!dirty) return; 
  dirty = false;
  
  const all = {}; 
  for (const [ws, c] of Players) all[c.id] = c.p;
  
  const s = JSON.stringify({ t: 's', p: all });
  
  for (const c of Players.keys()) if (c.readyState === 1) c.send(s);
  for (const client of Dashboards) if (client.readyState === 1) client.send(s);
}, 50);

srv.listen(process.env.PORT || 8080, () => console.log('Sector Zero server hazir'));
