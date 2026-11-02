// Sector Zero online sunucusu + Otomatik Cihaz Tespiti & Bordo/Kırmızı Tema (node server.js)
const http = require('http'), { WebSocketServer } = require('ws');

const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sector Zero // Control Center</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #0d0205; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; padding: 20px; }
        
        /* Üst Header / Navigasyon */
        .header { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #1a0308 0%, #120406 100%); border: 1px solid #7f1d1d; padding: 18px 25px; border-radius: 14px; margin-bottom: 20px; box-shadow: 0 4px 25px rgba(127, 29, 29, 0.2); }
        .header h1 { font-size: 1.3rem; color: #f87171; letter-spacing: 2px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        
        .header-right { display: flex; align-items: center; gap: 15px; }
        .status-pill { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; background: #1f060b; padding: 6px 14px; border-radius: 20px; border: 1px solid #991b1b; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .dot.online { background: #22c55e; box-shadow: 0 0 10px #22c55e; }

        /* Nickname / Profil Kutusu */
        .profile-box { display: flex; align-items: center; gap: 8px; background: #1f060b; padding: 5px 12px; border-radius: 10px; border: 1px solid #7f1d1d; }
        .profile-box input { background: transparent; border: none; color: #fff; font-size: 0.9rem; outline: none; width: 120px; font-weight: 600; }

        /* Metrik Kartları */
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: #120406; border: 1px solid #7f1d1d55; padding: 20px; border-radius: 14px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .metric-card::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #dc2626; }
        .metric-card label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #fca5a5; font-weight: 600; }
        .metric-card .value { font-size: 1.5rem; font-weight: bold; color: #f8fafc; margin-top: 8px; }

        /* Ana İçerik Izgarası */
        .main-content { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; flex: 1; }
        @media (max-width: 900px) { .main-content { grid-template-columns: 1fr; } }

        .panel { background: #120406; border: 1px solid #7f1d1d55; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .panel-title { font-size: 0.95rem; font-weight: 600; color: #fca5a5; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #7f1d1d44; padding-bottom: 10px; }

        /* Tablo Tasarımı */
        .table-container { overflow-x: auto; flex: 1; max-height: 320px; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
        th { color: #fca5a5; font-weight: 600; padding: 10px; border-bottom: 1px solid #7f1d1d44; }
        td { padding: 12px 10px; border-bottom: 1px solid #7f1d1d11; color: #e2e8f0; }

        /* Cihaz Rozetleri */
        .badge-device { background: #4a0e17; color: #fca5a5; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #7f1d1d; font-weight: 600; }

        /* Konsol & Log Alanı */
        .log-box { background: #070103; border: 1px solid #7f1d1d66; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 0.75rem; color: #fca5a5; height: 210px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
        
        .action-area { display: flex; gap: 10px; margin-top: 15px; }
        .btn { flex: 1; padding: 11px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.85rem; letter-spacing: 0.5px; }
        .btn-red { background: #dc2626; color: #fff; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
        .btn-red:hover { background: #b91c1c; }
        .btn-outline { background: transparent; border: 1px solid #7f1d1d; color: #fca5a5; }
        .btn-outline:hover { background: #4a0e17; }
    </style>
</head>
<body>

    <div class="header">
        <h1>SZSERVER // CONTROL CENTER</h1>
        <div class="header-right">
            <div class="profile-box">
                <span style="font-size:0.75rem; color:#fca5a5;">RUTBE:</span>
                <input type="text" id="playerName" value="Oyuncu" maxlength="15" onchange="updateProfile()" title="Oyuncu Adını Değiştir">
            </div>
            <div class="status-pill">
                <span id="dot" class="dot"></span>
                <span id="statusText">Bağlanıyor...</span>
            </div>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="metric-card">
            <label>Aktif Oyuncular</label>
            <div id="metricPlayers" class="value">0</div>
        </div>
        <div class="metric-card" style="border-left-color: #991b1b;">
            <label>Sunucu Uptime (Süre)</label>
            <div id="metricUptime" class="value">00:00:00</div>
        </div>
        <div class="metric-card" style="border-left-color: #b91c1c;">
            <label>Tespit Edilen Cihazın</label>
            <div id="metricDevice" class="value" style="font-size: 1.1rem; padding-top: 6px; color:#fca5a5;">Otomatik...</div>
        </div>
        <div class="metric-card" style="border-left-color: #ef4444;">
            <label>Toplam İşlenen Paket</label>
            <div id="metricPackets" class="value">0</div>
        </div>
    </div>

    <div class="main-content">
        <div class="panel">
            <div class="panel-title">
                Bağlı Oyuncular ve Otomatik Cihaz Dağılımı
                <span id="playerCounter" style="font-size: 0.75rem; color: #fca5a5;">0 Online</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Oyuncu Adı</th>
                            <th>Tespit Edilen Cihaz / Platform</th>
                            <th>Bağlantı Durumu</th>
                        </tr>
                    </thead>
                    <tbody id="playerTableBody">
                        <tr><td colspan="3" style="text-align: center; color: #fca5a5; opacity: 0.6; padding: 30px;">Sunucu senkronizasyonu bekleniyor...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <div class="panel-title">Sistem Akış Konsolu</div>
            <div id="logBox" class="log-box">
                <div>[Sistem] Bordo tema yüklendi, otomatik cihaz tespiti devrede...</div>
            </div>
            <div class="action-area">
                <button class="btn btn-red" onclick="forceSync()">Senkronizasyonu Yenile</button>
                <button class="btn btn-outline" onclick="clearLogs()">Logları Temizle</button>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let startTime = Date.now();
        let packetCount = 0;

        const dot = document.getElementById('dot');
        const statusText = document.getElementById('statusText');
        const metricPlayers = document.getElementById('metricPlayers');
        const metricUptime = document.getElementById('metricUptime');
        const metricDevice = document.getElementById('metricDevice');
        const metricPackets = document.getElementById('metricPackets');
        const playerTableBody = document.getElementById('playerTableBody');
        const playerCounter = document.getElementById('playerCounter');
        const logBox = document.getElementById('logBox');
        const playerNameInput = document.getElementById('playerName');

        // Otomatik Cihaz Tespiti (User-Agent Analizi)
        function detectDevice() {
            const ua = navigator.userAgent || navigator.vendor || window.opera;
            if (/android/i.test(ua)) {
                return "Android (APK)";
            } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
                return "iOS (Mobil)";
            } else if (/windows|macintosh|linux/i.test(ua)) {
                return "PC Masaüstü";
            }
            return "Web Tarayıcı";
        }

        const myDetectedDevice = detectDevice();
        metricDevice.textContent = myDetectedDevice;

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

        function forceSync() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ t: 'p', p: { active: true } }));
                addLog('Sunucuya durum güncellemesi (sync) gönderildi.');
            } else {
                addLog('Hata: Sunucuya bağlı değil!');
            }
        }

        function updateProfile() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const name = playerNameInput.value.trim() || 'Misafir';
                ws.send(JSON.stringify({
                    t: 'auth',
                    name: name,
                    device: myDetectedDevice
                }));
                addLog('Profil güncellendi -> Ad: ' + name);
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
            
            addLog('Sunucuya bağlanılıyor: ' + wsUrl);

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                dot.className = "dot online";
                statusText.textContent = "Çevrimiçi";
                addLog('WebSocket bağlantısı kuruldu.');

                // İlk bağlantıda otomatik cihaz ve isim bilgilerini gönder
                updateProfile();
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
                                    '<td style="font-weight:700; color:#fca5a5;">' + (p.name || 'Oyuncu') + '</td>' +
                                    '<td><span class="badge-device">' + (p.device || 'Bilinmiyor') + '</span></td>' +
                                    '<td><span style="color:#22c55e;">●</span> Senkronize</td>' +
                                '</tr>';
                            }
                            playerTableBody.innerHTML = html;
                        } else {
                            playerTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #fca5a5; opacity: 0.6; padding: 20px;">Aktif oyuncu yok</td></tr>';
                        }
                    }
                } catch (e) {}
            };

            ws.onclose = () => {
                dot.className = "dot";
                statusText.textContent = "Bağlantı Koptu (Yeniden bağlanıyor...)";
                addLog('Sunucu bağlantısı kesildi, yeniden deneniyor...');
                setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                addLog('Bağlantı hatası oluştu.');
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
  const c = { ws, p: { name: 'Misafir', device: 'Web' }, cnt: 0 }; 
  C.set(id, c); 
  dirty = true;

  ws.on('message', m => {
    if (++c.cnt > 80) return;
    let d; try { d = JSON.parse(m) } catch (e) { return }
    
    // Kimlik ve otomatik cihaz doğrulama mesajı
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
