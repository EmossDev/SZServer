// Sector Zero online sunucusu + Modern Oyun Lobisi (node server.js)
const http = require('http'), { WebSocketServer } = require('ws');

const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sector Zero // Game Lobby</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #080b11; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
        .wrapper { width: 100%; max-width: 650px; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); overflow: hidden; }
        .hero { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 30px 25px; text-align: center; border-bottom: 1px solid #1e293b; position: relative; }
        .hero h1 { font-size: 1.8rem; letter-spacing: 3px; color: #38bdf8; font-weight: 800; margin-bottom: 8px; text-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }
        .hero p { font-size: 0.9rem; color: #94a3b8; letter-spacing: 1px; }
        
        .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ef4444; margin-right: 6px; box-shadow: 0 0 8px #ef4444; transition: 0.3s; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 10px #22c55e; }

        .content { padding: 25px; }
        .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-card { background: #111827; border: 1px solid #1f2937; padding: 15px; border-radius: 10px; text-align: center; }
        .info-card span { display: block; font-size: 1.3rem; font-weight: bold; color: #38bdf8; margin-top: 5px; }
        .info-card label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }

        .btn-container { display: flex; gap: 12px; }
        .btn { flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.3s; letter-spacing: 1px; }
        .btn-primary { background: #38bdf8; color: #080b11; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); }
        .btn-primary:hover { background: #0ea5e9; transform: translateY(-2px); }
        .btn-danger { background: #ef4444; color: #fff; display: none; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); }
        .btn-danger:hover { background: #dc2626; }

        .footer-note { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #64748b; }
    </style>
</head>
<body>

    <div class="wrapper">
        <div class="hero">
            <h1>SECTOR ZERO</h1>
            <p><span id="dot" class="status-dot"></span><span id="statusText">Sunucu Bağlantısı Bekleniyor...</span></p>
        </div>
        <div class="content">
            <div class="card-grid">
                <div class="info-card">
                    <label>Oyuncu Kimliğin (ID)</label>
                    <span id="clientId">-</span>
                </div>
                <div class="info-card">
                    <label>Aktif Oyuncular</label>
                    <span id="activeCount">0</span>
                </div>
            </div>

            <div class="btn-container">
                <button id="connectBtn" class="btn btn-primary" onclick="toggleConnection()">OYUNA BAĞLAN</button>
                <button id="disconnectBtn" class="btn btn-danger" onclick="toggleConnection()">BAĞLANTIYI KES</button>
            </div>

            <div class="footer-note">
                SZServer Core v1.0 // Multi-user Realtime Engine
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        const statusDot = document.getElementById('dot');
        const statusText = document.getElementById('statusText');
        const clientIdEl = document.getElementById('clientId');
        const activeCountEl = document.getElementById('activeCount');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');

        function toggleConnection() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
                return;
            }

            // Vercel domain adresini otomatik algıla ve wss protokolüne çevir
            const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
            const wsUrl = proto + location.host;

            statusText.textContent = "Bağlanıyor...";

            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    statusDot.className = "status-dot active";
                    statusText.textContent = "Sunucuya Bağlandı";
                    connectBtn.style.display = "none";
                    disconnectBtn.style.display = "block";
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.t === 'hi') {
                            clientIdEl.textContent = data.id;
                        } else if (data.t === 'p') {
                            // Aktif oyuncu sayısını güncelle
                            activeCountEl.textContent = Object.keys(data.p).length;
                        }
                    } catch (e) {}
                };

                ws.onclose = () => {
                    statusDot.className = "status-dot";
                    statusText.textContent = "Bağlantı Kesildi";
                    clientIdEl.textContent = "-";
                    activeCountEl.textContent = "0";
                    connectBtn.style.display = "block";
                    disconnectBtn.style.display = "none";
                };

                ws.onerror = () => {
                    statusText.textContent = "Bağlantı Hatası!";
                };

            } catch (e) {
                statusText.textContent = "Kritik Hata!";
            }
        }

        // Sayfa açıldığında otomatik bağlanmayı dene
        window.onload = () => {
            toggleConnection();
        };
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
