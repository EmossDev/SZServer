// Sector Zero - Hosting Özellikleri Destekli Motor (server.js)
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
const C = new Map(); let n = 0;

// Sunucunun öz internal döngü gecikmesi ve hosting simülasyon metrikleri
let corePing = 1;
let lastTick = Date.now();
let serverLogs = ["[SYSTEM] Sector Zero Core başlatıldı.", "[NETWORK] Güvenlik duvarı aktif."];

function addLog(msg) {
  const time = new Date().toLocaleTimeString('tr-TR');
  serverLogs.push(`[${time}] ${msg}`);
  if (serverLogs.length > 25) serverLogs.shift();
}

setInterval(() => {
  const now = Date.now();
  const diff = now - lastTick;
  corePing = Math.max(1, Math.min(15, Math.abs(diff - 1000) + Math.floor(Math.random() * 3)));
  lastTick = now;
}, 1000);

wss.on('connection', ws => {
  const id = 'p' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
  const c = { ws, p: {}, cnt: 0 }; C.set(id, c); 
  ws.send(JSON.stringify({ t: 'hi', id }));
  addLog(`Yeni istemci bağlandı: ${id}`);
  
  ws.on('message', m => {
    let d; try { d = JSON.parse(m) } catch (e) { return }
    
    // Hosting Panel Komutları
    if (d.t === 'cmd') {
      if (d.action === 'restart') {
        addLog('UYARI: Kullanıcı panelden sunucu yeniden başlatma komutu tetikledi!');
        setTimeout(() => { addLog('Sunucu yeniden başlatıldı ve kararlı duruma geçti.'); }, 1500);
      } else if (d.action === 'flush') {
        addLog('Sistem önbelleği (Cache) başarıyla temizlendi.');
      } else if (d.action === 'maintenance') {
        addLog('Bakım modu durumu değiştirildi.');
      }
      return;
    }

    if (++c.cnt > 80) return;
    if (d.t !== 'p' || !d.p || typeof d.p !== 'object') return;
    for (const k in d.p) {
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(k)) continue;
      const v = d.p[k];
      if (v === null) delete c.p[k];
      else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length < 40)) c.p[k] = v;
    }
  });

  ws.on('close', () => { 
    addLog(`İstemci bağlantısı koptu: ${id}`);
    C.delete(id); 
  }); 
  ws.on('error', () => { });
});

setInterval(() => { for (const c of C.values()) c.cnt = 0 }, 1000);

// Her saniye hosting istatistiklerini ve logları istemcilere gönderiyoruz
setInterval(() => {
  const all = {}; for (const [id, c] of C) all[id] = c.p;
  // Simüle edilmiş dinamik CPU ve RAM değerleri (Hosting Barındırma Paneli İçin)
  const cpuUsage = (12 + Math.random() * 15).toFixed(1);
  const ramUsage = (42 + Math.random() * 4).toFixed(1);
  const diskUsage = "28.4";

  const s = JSON.stringify({ 
    t: 's', 
    serverPing: corePing, 
    cpu: cpuUsage, 
    ram: ramUsage, 
    disk: diskUsage, 
    logs: serverLogs,
    p: all 
  });

  for (const c of C.values()) if (c.ws.readyState === 1) c.ws.send(s);
}, 1000);

srv.listen(process.env.PORT || 8080, () => console.log('Sector Zero hosting server hazir'));
