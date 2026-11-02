// Sector Zero online sunucusu + Gelişmiş Sunucu Yönetim Paneli (node server.js)
const http = require('http'), { WebSocketServer } = require('ws');

const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sector Zero // Server Dashboard</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #07090e; color: #cbd5e1; min-height: 100vh; display: flex; flex-direction: column; padding: 20px; }
        
        .header { display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid #1e293b; padding: 15px 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .header h1 { font-size: 1.2rem; color: #38bdf8; letter-spacing: 2px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        
        .status-pill { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; background: #1e293b; padding: 6px 14px; border-radius: 20px; border: 1px solid #334155; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .dot.online { background: #22c55e; box-shadow: 0 0 10px #22c55e; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: #0f172a; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; }
        .metric-card::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #38bdf8; }
        .metric-card label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; }
        .metric-card .value { font-size: 1.6rem; font-weight: bold; color: #f8fafc; margin-top: 8px; }

        .main-content { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; flex: 1; }
        @media (max-width: 900px) { .main-content { grid-template-columns: 1fr; } }

        .panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; }
        .panel-title { font-size: 0.95rem; font-weight: 600; color: #f8fafc; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 10px; }

        .table-container { overflow-x: auto; flex: 1; max-height: 300px; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
        th { color: #64748b; font-weight: 600; padding: 10px; border-bottom: 1px solid #1e293b; }
        td { padding: 12px 10px; border-bottom: 1px solid #1e293b11; color: #e2e8f0; }

        .action-area { display: flex; flex-direction: column; gap: 12px; }
        .btn { padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.85rem; letter-spacing: 0.5px; }
        .btn-cyan { background: #38bdf8; color: #07090e; }
        .btn-cyan:hover { background: #0ea5e9; }
        .btn-outline { background: transparent; border: 1px solid #334155; color: #cbd5e1; }
        .btn-outline:hover { background: #1e293b; }

        .log-box { background: #05070a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 0.75rem; color: #94a3b8; height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    </style>
</head>
<body>

    <div class="header">
        <h1>SZSERVER // CORE DASHBOARD</h1>
        <div class="status-pill">
            <span id="dot" class="dot"></span>
            <span id="statusText">Bağlantı Kuruluyor...</span>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="metric-card">
            <label>Aktif Oyuncular</label>
            <div id="metricPlayers" class="value">0</div>
        </div>
        <div class="metric-card" style="border-left-color: #22c55e;">
            <label>Sunucu Çalışma Süresi</label>
            <div id="metricUptime" class="value">00:00:00</div>
        </div>
        <div class="metric-card" style="border-left-color: #a855f7;">
            <label>Aktif Oturum ID'niz</label>
            <div id="metricClientId" class="value" style="font-size: 1.1rem; padding-top: 5px;">-</div>
        </div>
        <div class="metric-card" style="border-left-color: #eab308;">
            <label>Protokol Durumu</label>
            <div class="value" style="font-size: 1.1rem; padding-top: 5px;">WebSocket (WSS)</div>
        </div>
    </div>

    <div class="main-content">
        <div class="panel">
            <div class="panel-title">
                Bağlı Oyuncular Listesi
                <span id="playerCounter" style="font-size: 0.75rem; color: #64748b;">0 Online</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Client ID</th>
                            <th>Durum</th>
                            <th>Senkronizasyon</th>
                        </tr>
                    </thead>
                    <tbody id="playerTableBody">
                        <tr><td colspan="3" style="text-align: center; color: #64748b; padding: 30px;">Henüz aktif oyuncu verisi yok...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <div class="panel-title">Sistem Akışı & Loglar</div>
            <div id="logBox" class="log-box">
                <div>[Sistem] Panel arayüzü başlatıldı, sunucu dinleniyor...</div>
            </div>
            <div style="margin-top: 15px;" class="action-area">
                <button class="btn btn-cyan" onclick="pingServer()">Sunucu Ping Testi</button>
                <button class="btn btn-outline" onclick="clearLogs()">Log Ekranını Temizle</button>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let startTime = Date.now();
        const dot = document.getElementById('dot');
        const statusText = document.getElementById('statusText');
        const metricPlayers = document.getElementById('metricPlayers');
        const metricUptime = document.getElementById('metricUptime');
        const metricClientId = document.getElementById('metricClientId');
        const playerTableBody = document.getElementById('playerTableBody');
        const playerCounter = document.getElementById('playerCounter');
        const logBox = document.getElementById('logBox');

        function addLog(msg) {
            const time = new Date().toTimeString().split(' ')[0];
            const div = document.createElement('div');
            div.textContent = '[' + time + '] ' + msg;
            logBox.appendChild(div);
            logBox.scrollTop = logBox.scrollHeight;
        }

        function clearLogs() {
            logBox.innerHTML = '';
            addLog('Log ekranı temizlendi.');
        }

        function pingServer() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const t0 = performance.now();
                // Sunucuya test mesajı gönder
                ws.send(JSON.stringify({ t: 'ping' }));
                addLog('Ping gönderildi...');
            } else {
                addLog('Hata: Sunucuya bağlı değil!');
            }
        }

        // Uptime sayacı
        setInterval(() => {
            const diff = Math.floor((Date.now() - startTime) / 1000);
            const h = String(Math.floor(diff / 3600)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            metricUptime.textContent = h + ':' + m + ':' + s;
        }, 1000);

        function connect() {
            const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
            const wsUrl = proto + location.host;
            
            addLog('Bağlanılıyor: ' + wsUrl);

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                dot.className = "dot online";
                statusText.textContent = "Sistem Çevrimiçi";
                addLog('Sunucu bağlantısı başarıyla kuruldu.');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.t === 'hi') {
                        metricClientId.textContent = data.id;
                        addLog('Oturum açıldı, ID: ' + data.id);
                    } else if (data.t === 's') {
                        const players = data.p;
                        const keys = Object.keys(players);
                        metricPlayers.textContent = keys.length;
                        playerCounter.textContent = keys.length + ' Online';

                        if (keys.length > 0) {
                            let html = '';
                            for (const id in players) {
                                html += '<tr>' +
                                    '<td style="font-family:monospace; color:#38bdf8;">' + id + '</td>' +
                                    '<td><span style="color:#22c55e;">●</span> Aktif</td>' +
                                    '<td style="color:#64748b;">Senkronize</td>' +
                                '</tr>';
                            }
                            playerTableBody.innerHTML = html;
                        } else {
                            playerTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">Aktif oyuncu yok</td></tr>';
                        }
                    }
                } catch (e) {}
            };

            ws.onclose = () => {
                dot.className = "dot";
                statusText.textContent = "Bağlantı Kesildi (Yeniden bağlanılıyor...)";
                addLog('Sunucu bağlantısı koptu.');
                setTimeout(connect, 3000); // 3 saniye sonra otomatik tekrar bağlan
            };

            ws.onerror = () => {
                addLog('WebSocket hata oluştu.');
            };
        }

        window.onload = connect;
    </script>
</body>
</html>`;

const srv = http.createServer((q, r) => {
    r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    r.end(htmlContent);
});

const wss = new WebSocketServer({ server: srv, maxPayload: 4096 });
const C = new Map(); let dirty = false, n = 0;

wss.on('connection', ws => {
  const id = 'p' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
  const c = { ws, p: {}, cnt: 0 }; C.set(id, c); ws.send(JSON.stringify({ t: 'hi', id })); dirty = true;
  ws.on('message', m => {
    if (++c.cnt > 80) return;
    let d; try { d = JSON.parse(m) } catch (e) { return }
    if (d.t === 'ping') { ws.send(JSON.stringify({ t: 'pong' })); return; }
    if (d.t !== 'p' || !d.p || typeof d.p !== 'object') return;
    for (const k in d.p) {
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(k)) continue;
      const v = d.p[k];
      if (v === null) delete c.p[k];
      else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length < 40)) c.p[k] = v;
    }
    dirty = true;
  });
  ws.on('close', () => { C.delete(id); dirty = true }); ws.on('error', () => { });
});

setInterval(() => { for (const c of C.values()) c.cnt = 0 }, 1000);
setInterval(() => {
  if (!dirty) return; dirty = false;
  const all = {}; for (const [id, c] of C) all[id] = c.p;
  const s = JSON.stringify({ t: 's', p: all });
  for (const c of C.values()) if (c.ws.readyState === 1) c.ws.send(s);
}, 50);

srv.listen(process.env.PORT || 8080, () => console.log('Sector Zero server hazir'));
