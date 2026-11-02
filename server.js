// Sector Zero online sunucusu + Kapsamlı Yönetim Paneli (node server.js)
const http = require('http'), { WebSocketServer } = require('ws');

const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sector Zero // Control Center</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #05070a; color: #cbd5e1; min-height: 100vh; display: flex; flex-direction: column; padding: 20px; }
        
        /* Modal Giriş Ekranı */
        #loginModal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 7, 10, 0.92); display: flex; align-items: center; justify-content: center; z-index: 999; }
        .modal-box { background: #0f172a; border: 1px solid #334155; padding: 30px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .modal-box h2 { color: #38bdf8; font-size: 1.4rem; margin-bottom: 15px; letter-spacing: 1px; }
        .modal-box label { font-size: 0.8rem; color: #94a3b8; display: block; margin-bottom: 6px; text-transform: uppercase; }
        .modal-box input, .modal-box select { width: 100%; background: #07090e; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 8px; font-size: 0.95rem; margin-bottom: 15px; outline: none; }
        .modal-box input:focus, .modal-box select:focus { border-color: #38bdf8; }
        .modal-box button { width: 100%; background: #38bdf8; color: #05070a; border: none; padding: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: 0.2s; }
        .modal-box button:hover { background: #0ea5e9; }

        /* Ana Panel */
        .header { display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid #1e293b; padding: 15px 25px; border-radius: 12px; margin-bottom: 20px; }
        .header h1 { font-size: 1.2rem; color: #38bdf8; letter-spacing: 2px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        
        .status-pill { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; background: #1e293b; padding: 6px 14px; border-radius: 20px; border: 1px solid #334155; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .dot.online { background: #22c55e; box-shadow: 0 0 10px #22c55e; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: #0f172a; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; }
        .metric-card::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #38bdf8; }
        .metric-card label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; }
        .metric-card .value { font-size: 1.5rem; font-weight: bold; color: #f8fafc; margin-top: 8px; }

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
        .btn-cyan { background: #38bdf8; color: #05070a; }
        .btn-cyan:hover { background: #0ea5e9; }
        .btn-outline { background: transparent; border: 1px solid #334155; color: #cbd5e1; }
        .btn-outline:hover { background: #1e293b; }

        .log-box { background: #05070a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 0.75rem; color: #94a3b8; height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    </style>
</head>
<body>

    <!-- Oyuncu Giriş Modalı -->
    <div id="loginModal">
        <div class="modal-box">
            <h2>SECTOR ZERO // GİRİŞ</h2>
            <label>Oyuncu Adınız</label>
            <input type="text" id="playerNameInput" placeholder="Örn: EmossN1" value="Oyuncu">
            
            <label>Bağlantı Türü / Cihaz</label>
            <select id="deviceSelect">
                <option value="PC Masaüstü">PC Masaüstü</option>
                <option value="Web Tarayıcı">Web Tarayıcı</option>
                <option value="Android (APK)">Android (APK / Mobil)</option>
            </select>

            <button onclick="startSession()">PANELE BAĞLAN</button>
        </div>
    </div>

    <div class="header">
        <h1>SZSERVER // CONTROL CENTER</h1>
        <div class="status-pill">
            <span id="dot" class="dot"></span>
            <span id="statusText">Çevrimdışı</span>
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
            <label>Oturum Sahibi</label>
            <div id="metricOwner" class="value" style="font-size: 1.1rem; padding-top: 5px; overflow:hidden; text-overflow:ellipsis;">-</div>
        </div>
        <div class="metric-card" style="border-left-color: #eab308;">
            <label>İşlenen Toplam Paket</label>
            <div id="metricPackets" class="value">0</div>
        </div>
    </div>

    <div class="main-content">
        <div class="panel">
            <div class="panel-title">
                Aktif Oyuncular ve Cihaz Bilgileri
                <span id="playerCounter" style="font-size: 0.75rem; color: #64748b;">0 Online</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Oyuncu Adı</th>
                            <th>Cihaz / Platform</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody id="playerTableBody">
                        <tr><td colspan="3" style="text-align: center; color: #64748b; padding: 30px;">Oturum bekleniyor...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <div class="panel-title">Sistem Konsolu & İşlemler</div>
            <div id="logBox" class="log-box">
                <div>[Sistem] Arayüz hazır, giriş bekleniyor...</div>
            </div>
            <div style="margin-top: 15px;" class="action-area">
                <button class="btn btn-cyan" onclick="pingServer()">Gecikme (Ping) Testi</button>
                <button class="btn btn-outline" onclick="clearLogs()">Logları Temizle</button>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let startTime = Date.now();
        let packetCount = 0;
        let myName = "";
        let myDevice = "";

        const dot = document.getElementById('dot');
        const statusText = document.getElementById('statusText');
        const metricPlayers = document.getElementById('metricPlayers');
        const metricUptime = document.getElementById('metricUptime');
        const metricOwner = document.getElementById('metricOwner');
        const metricPackets = document.getElementById('metricPackets');
        const playerTableBody = document.getElementById('playerTableBody');
        const playerCounter = document.getElementById('playerCounter');
        const logBox = document.getElementById('logBox');
        const loginModal = document.getElementById('loginModal');

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

        function startSession() {
            myName = document.getElementById('playerNameInput').value.trim() || 'Misafir';
            myDevice = document.getElementById('deviceSelect').value;
            
            metricOwner.textContent = myName + " (" + myDevice + ")";
            loginModal.style.display = 'none';
            
            connect();
        }

        function pingServer() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ t: 'ping' }));
                addLog('Ping testi gönderildi...');
            } else {
                addLog('Hata: Sunucuya bağlı değil!');
            }
        }

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
            
            addLog('Sunucuya bağlanılıyor: ' + wsUrl);

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                dot.className = "dot online";
                statusText.textContent = "Bağlantı Aktif";
                addLog('WebSocket bağlantısı kuruldu.');

                // Giriş bilgilerini sunucuya bildir
                ws.send(JSON.stringify({
                    t: 'auth',
                    name: myName,
                    device: myDevice
                }));
            };

            ws.onmessage = (event) => {
                packetCount++;
                metricPackets.textContent = packetCount;

                try {
                    const data = JSON.parse(event.data);
                    if (data.t === 's') {
                        const players = data.p;
                        const keys = Object.keys(players);
                        metricPlayers.textContent = keys.length;
                        playerCounter.textContent = keys.length + ' Online';

                        if (keys.length > 0) {
                            let html = '';
                            for (const id in players) {
                                const p = players[id];
                                html += '<tr>' +
                                    '<td style="font-weight:600; color:#38bdf8;">' + (p.name || 'Bilinmiyor') + '</td>' +
                                    '<td><span style="background:#1e293b; padding:3px 8px; border-radius:4px; font-size:0.75rem;">' + (p.device || 'Web') + '</span></td>' +
                                    '<td><span style="color:#22c55e;">●</span> Aktif</td>' +
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
                statusText.textContent = "Bağlantı Koptu (Yeniden deneniyor...)";
                addLog('Sunucu bağlantısı koptu.');
                setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                addLog('Bağlantı hatası oluştu.');
            };
        }
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
  // Varsayılan oyuncu bilgileri
  const c = { ws, p: { name: 'Misafir', device: 'Web' }, cnt: 0 }; 
  C.set(id, c); 
  dirty = true;

  ws.on('message', m => {
    if (++c.cnt > 80) return;
    let d; try { d = JSON.parse(m) } catch (e) { return }
    
    if (d.t === 'ping') { ws.send(JSON.stringify({ t: 'pong' })); return; }
    
    // Oyuncu kimlik doğrulama/kayıt mesajı
    if (d.t === 'auth') {
      if (typeof d.name === 'string' && d.name.length < 20) c.p.name = d.name;
      if (typeof d.device === 'string' && d.device.length < 30) c.p.device = d.device;
      dirty = true;
      return;
    }

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
