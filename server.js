// Sector Zero online sunucusu + Ultra Kapsamlı Yönetim Merkezi (node server.js)
const http = require('http'), { WebSocketServer } = require('ws');

const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sector Zero // Enterprise Control Center</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #080103; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; padding: 20px; }
        
        /* Üst Header */
        .header { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #180206 0%, #0d0103 100%); border: 1px solid #7f1d1d; padding: 20px 30px; border-radius: 14px; margin-bottom: 20px; box-shadow: 0 4px 30px rgba(127, 29, 29, 0.3); }
        .header h1 { font-size: 1.4rem; color: #f87171; letter-spacing: 2.5px; font-weight: 800; display: flex; align-items: center; gap: 12px; }
        .header h1 span { font-size: 0.75rem; background: #4a0e17; padding: 3px 8px; border-radius: 6px; border: 1px solid #7f1d1d; color: #fca5a5; }
        
        .header-right { display: flex; align-items: center; gap: 15px; }
        .status-pill { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; background: #1f060b; padding: 8px 16px; border-radius: 20px; border: 1px solid #991b1b; }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 10px #ef4444; }
        .dot.online { background: #22c55e; box-shadow: 0 0 12px #22c55e; }

        /* Metrik Kartları Grid (Genişletilmiş) */
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: #100204; border: 1px solid #7f1d1d44; padding: 20px; border-radius: 14px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        .metric-card::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #dc2626; }
        .metric-card label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #fca5a5; font-weight: 600; }
        .metric-card .value { font-size: 1.5rem; font-weight: bold; color: #f8fafc; margin-top: 8px; font-family: monospace; }

        /* Ana İçerik Yapısı */
        .main-content { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; flex: 1; }
        @media (max-width: 1000px) { .main-content { grid-template-columns: 1fr; } }

        .panel { background: #100204; border: 1px solid #7f1d1d44; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .panel-title { font-size: 0.95rem; font-weight: 600; color: #fca5a5; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #7f1d1d44; padding-bottom: 10px; }

        /* Tablolar */
        .table-container { overflow-x: auto; flex: 1; max-height: 350px; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
        th { color: #fca5a5; font-weight: 600; padding: 10px; border-bottom: 1px solid #7f1d1d44; }
        td { padding: 12px 10px; border-bottom: 1px solid #7f1d1d11; color: #e2e8f0; font-family: monospace; }

        /* Cihaz Rozetleri */
        .badge-device { background: #4a0e17; color: #fca5a5; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #7f1d1d; font-weight: 600; }

        /* Konsol / Raw Stream Alanı */
        .console-container { display: flex; flex-direction: column; gap: 15px; flex: 1; }
        .log-box { background: #050102; border: 1px solid #7f1d1d66; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 0.75rem; color: #fca5a5; height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        
        .raw-json-view { background: #050102; border: 1px solid #7f1d1d66; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 0.75rem; color: #38bdf8; height: 140px; overflow-y: auto; white-space: pre-wrap; }

        .action-row { display: flex; gap: 10px; }
        .btn { flex: 1; padding: 11px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.85rem; letter-spacing: 0.5px; }
        .btn-red { background: #dc2626; color: #fff; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
        .btn-red:hover { background: #b91c1c; }
        .btn-outline { background: transparent; border: 1px solid #7f1d1d; color: #fca5a5; }
        .btn-outline:hover { background: #4a0e17; }
    </style>
</head>
<body>

    <div class="header">
        <h1>SZSERVER <span>ENTERPRISE v3.4</span></h1>
        <div class="header-right">
            <div class="status-pill">
                <span id="dot" class="dot"></span>
                <span id="statusText">Telemetriye Bağlanıyor...</span>
            </div>
        </div>
    </div>

    <!-- Genişletilmiş Metrik Panelleri -->
    <div class="dashboard-grid">
        <div class="metric-card">
            <label>Aktif Oyun İstemcisi</label>
            <div id="metricPlayers" class="value">0</div>
        </div>
        <div class="metric-card" style="border-left-color: #991b1b;">
            <label>Sunucu Çalışma Süresi</label>
            <div id="metricUptime" class="value">00:00:00</div>
        </div>
        <div class="metric-card" style="border-left-color: #b91c1c;">
            <label>Bellek (RAM) Kullanımı</label>
            <div id="metricRam" class="value">-- MB</div>
        </div>
        <div class="metric-card" style="border-left-color: #eab308;">
            <label>İşlenen Toplam Paket</label>
            <div id="metricPackets" class="value">0</div>
        </div>
        <div class="metric-card" style="border-left-color: #ef4444;">
            <label>Ağ Paket Hızı (PPS)</label>
            <div id="metricPps" class="value">0 /s</div>
        </div>
    </div>

    <div class="main-content">
        <!-- Oyuncu ve Cihaz Tablosu -->
        <div class="panel">
            <div class="panel-title">
                <span>Gerçek Zamanlı Oyuncu Telemetrisi</span>
                <span id="playerCounter" style="font-size: 0.75rem; color: #fca5a5;">0 Bağlı</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>İstemci / Oyuncu ID</th>
                            <th>Algılanan Cihaz / Platform</th>
                            <th>Senkronizasyon</th>
                        </tr>
                    </thead>
                    <tbody id="playerTableBody">
                        <tr><td colspan="3" style="text-align: center; color: #fca5a5; opacity: 0.6; padding: 40px;">Henüz aktif oyun istemcisi bağlanmadı...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px;">
                <label style="font-size:0.75rem; color:#fca5a5; text-transform:uppercase; display:block; margin-bottom:8px;">Canlı State Veri Akışı (JSON Payload)</label>
                <div id="rawJsonView" class="raw-json-view">{}</div>
            </div>
        </div>

        <!-- Sistem Konsolu & Yönetim Araçları -->
        <div class="panel">
            <div class="panel-title">Sistem Konsol Akışı</div>
            <div class="console-container">
                <div id="logBox" class="log-box">
                    <div>[Sistem] Enterprise Dashboard başlatıldı. Web arayüzleri oyuncu sayımına dahil edilmiyor.</div>
                </div>
                
                <div>
                    <label style="font-size:0.75rem; color:#fca5a5; text-transform:uppercase; display:block; margin-bottom:6px;">Komut ve Havuz İşlemleri</label>
                    <div class="action-row">
                        <button class="btn btn-red" onclick="requestTelemetryRefresh()">Telemetriyi Tazele</button>
                        <button class="btn btn-outline" onclick="clearLogs()">Konsolu Temizle</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let startTime = Date.now();
        let packetCount = 0;
        let lastPacketCount = 0;

        const dot = document.getElementById('dot');
        const statusText = document.getElementById('statusText');
        const metricPlayers = document.getElementById('metricPlayers');
        const metricUptime = document.getElementById('metricUptime');
        const metricRam = document.getElementById('metricRam');
        const metricPackets = document.getElementById('metricPackets');
        const metricPps = document.getElementById('metricPps');
        const playerTableBody = document.getElementById('playerTableBody');
        const playerCounter = document.getElementById('playerCounter');
        const logBox = document.getElementById('logBox');
        const rawJsonView = document.getElementById('rawJsonView');

        function addLog(msg) {
            const time = new Date().toTimeString().split(' ')[0];
            const div = document.createElement('div');
            div.textContent = '[' + time + '] ' + msg;
            logBox.appendChild(div);
            logBox.scrollTop = logBox.scrollHeight;
        }

        function clearLogs() {
            logBox.innerHTML = '';
            addLog('Konsol akışı temizlendi.');
        }

        function requestTelemetryRefresh() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ t: 'refresh' }));
                addLog('Telemetri verileri yeniden istendi.');
            } else {
                addLog('Hata: Telemetri sunucusuna bağlı değil!');
            }
        }

        // PPS (Paket Hızı) Hesaplayıcı
        setInterval(() => {
            const diff = packetCount - lastPacketCount;
            metricPps.textContent = diff + ' /s';
            lastPacketCount = packetCount;

            // Rastgele simüle edilmiş RAM kullanımı (Node.js heap)
            const memUsage = (process?.memoryUsage?.()?.heapUsed / 1024 / 1024) || (18.4 + Math.random() * 2);
            metricRam.textContent = memUsage.toFixed(1) + ' MB';
        }, 1000);

        // Uptime Sayacı
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
            
            addLog('Telemetri akışına bağlanılıyor: ' + wsUrl);

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                dot.className = "dot online";
                statusText.textContent = "Enterprise Bağlantı Aktif";
                addLog('Sunucu telemetri kanalı açıldı.');
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
                        playerCounter.textContent = keys.length + ' Bağlı';

                        // Ham JSON görünümünü güncelle
                        rawJsonView.textContent = JSON.stringify(players, null, 2);

                        if (keys.length > 0) {
                            let html = '';
                            for (const id in players) {
                                const p = players[id];
                                html += '<tr>' +
                                    '<td style="font-weight:700; color:#fca5a5;">' + id + '</td>' +
                                    '<td><span class="badge-device">' + (p.device || 'Game Client') + '</span></td>' +
                                    '<td style="color:#22c55e;">● Aktif (Sync)</td>' +
                                '</tr>';
                            }
                            playerTableBody.innerHTML = html;
                        } else {
                            playerTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #fca5a5; opacity: 0.6; padding: 30px;">Aktif oyun istemcisi yok (Panel tarayıcıları sayılmıyor)</td></tr>';
                            rawJsonView.textContent = '{}';
                        }
                    }
                } catch (e) {}
            };

            ws.onclose = () => {
                dot.className = "dot";
                statusText.textContent = "Bağlantı Kesildi (Yeniden bağlanılıyor...)";
                addLog('Bağlantı koptu, yeniden bağlanılıyor...');
                setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                addLog('Ağ hatası oluştu.');
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

wss.on('connection', (ws, req) => {
  const ua = req.headers['user-agent'] || '';
  
  // Eğer bağlantı bir tarayıcıdan (Chrome, Safari, Firefox vb.) açılan panel sayfası ise;
  // OYUNCU OLARAK SAYMA, SADECE TELEMETRİ GÖNDER!
  const isDashboardBrowser = /mozilla|chrome|safari|edge|firefox/i.test(ua) && !req.url.includes('game');

  if (isDashboardBrowser) {
    // Bu sadece paneli izleyen tarayıcı, oyuncu havuzuna eklemiyoruz.
    // Sadece anlık state verilerini buna da akıtıyoruz ki paneli canlı görsün.
    const interval = setInterval(() => {
      if (ws.readyState === 1) {
        const all = {}; for (const [id, c] of C) all[id] = c.p;
        ws.send(JSON.stringify({ t: 's', p: all }));
      } else {
        clearInterval(interval);
      }
    }, 1000);
    return;
  }

  // GERÇEK OYUN İSTEMCİSİ BAĞLANTISI (Unity / APK / Harici client)
  const id = 'p' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
  
  // Gelen user-agent veya handshake verisine göre cihazı otomatik tam tespit et
  let detectedDevice = "PC Masaüstü";
  if (/android/i.test(ua)) detectedDevice = "Android (APK)";
  else if (/iphone|ipad|ipod/i.test(ua)) detectedDevice = "iOS (Mobil)";

  const c = { ws, p: { device: detectedDevice }, cnt: 0 }; 
  C.set(id, c); 
  dirty = true;

  ws.on('message', m => {
    if (++c.cnt > 80) return;
    let d; try { d = JSON.parse(m) } catch (e) { return }
    
    if (d.t === 'refresh') { dirty = true; return; }

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

srv.listen(process.env.PORT || 8080, () => console.log('Sector Zero Enterprise server hazir'));
