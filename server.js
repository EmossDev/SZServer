// Sector Zero - Owner Command Center Backend (server.js)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// Arayüzü hafızaya yükle
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
const Players = new Map();  // Gerçek oyun istemcileri
const Dashboards = new Set(); // Sadece komuta merkezini izleyen tarayıcılar
let dirty = false, n = 0;

function broadcastViewersCount() {
  const count = Dashboards.size;
  const msg = JSON.stringify({ t: 'viewers', count });
  for (const client of Dashboards) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on('connection', (ws, req) => {
  const ua = req.headers['user-agent'] || '';
  let isDashboardViewer = false;

  ws.on('message', m => {
    let d; try { d = JSON.parse(m) } catch (e) { return }

    // Eğer bağlanan tarayıcı komuta merkezini açtıysa
    if (d.t === 'dashboard_join') {
      isDashboardViewer = true;
      Dashboards.add(ws);
      broadcastViewersCount();
      return;
    }

    if (isDashboardViewer) return; // İzleyicilerin oyun verisi göndermesini engelle

    // Gerçek Oyuncu Kayıt ve Telemetri Güncellemesi
    let clientObj = Players.get(ws);
    if (!clientObj) {
      const id = 'p' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
      
      // Detaylı Cihaz / Platform Tespiti
      let deviceType = "PC Masaüstü";
      if (/android/i.test(ua)) {
        deviceType = /mobile/i.test(ua) ? "Android (Mobil Web)" : "Android (APK)";
      } else if (/iphone|ipad|ipod/i.test(ua)) {
        deviceType = "iOS (Mobil)";
      }

      clientObj = { 
        id, 
        p: { 
          name: 'Oyuncu_' + id, 
          device: deviceType, 
          room: 'Oda_1', 
          x: Math.floor(Math.random() * 400) + 50, 
          y: Math.floor(Math.random() * 220) + 40 
        }, 
        cnt: 0 
      };
      Players.set(ws, clientObj);
      dirty = true;
    }

    if (++clientObj.cnt > 100) return;

    // Oyuncudan gelen veri (isim, oda, x/y konumları vb.)
    if (d.t === 'auth' && d.name) {
      if (typeof d.name === 'string' && d.name.length < 20) clientObj.p.name = d.name;
      dirty = true;
    }

    if (d.t === 'p' && d.p && typeof d.p === 'object') {
      for (const k in d.p) {
        if (!/^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(k)) continue;
        const v = d.p[k];
        if (v === null) delete clientObj.p[k];
        else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length < 40)) clientObj.p[k] = v;
      }
      dirty = true;
    }
  });

  ws.on('close', () => {
    if (Dashboards.has(ws)) {
      Dashboards.delete(ws);
      broadcastViewersCount();
    }
    if (Players.has(ws)) {
      Players.delete(ws);
      dirty = true;
    }
  });

  ws.on('error', () => {});
});

// Saniyede bir rate-limit sayaçlarını sıfırla
setInterval(() => { for (const c of Players.values()) c.cnt = 0 }, 1000);

// Durum değişikliklerini hem oyunculara hem de komuta merkezi izleyicilerine senkronize et
setInterval(() => {
  if (!dirty) return; 
  dirty = false;
  
  const all = {}; 
  for (const [ws, c] of Players) all[c.id] = c.p;
  
  const s = JSON.stringify({ t: 's', p: all });
  
  // Tüm oyunculara ve paneli izleyen yöneticilere gönder
  for (const c of Players.keys()) if (c.readyState === 1) c.send(s);
  for (const client of Dashboards) if (client.readyState === 1) client.send(s);
}, 50);

srv.listen(process.env.PORT || 8080, () => console.log('Sector Zero Owner Command Center Ready'));
