const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Canlı konsol log geçmişi
const logs = [
    "[SYSTEM] Sector Zero Core başlatıldı.",
    "[INFO] WebSocket protokolü aktif.",
    "[SECURITY] Sistem yetkilisi: EmossDev."
];

function addLog(msg) {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    logs.push(`[${timestamp}] ${msg}`);
    if (logs.length > 50) logs.shift(); // En fazla son 50 logu tutar
}

// HTTP Sunucusu: index.html arayüzünü tarayıcılara sunar
const server = http.createServer((req, res) => {
    try {
        const htmlPath = path.join(__dirname, 'panel.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
    } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('index.html dosyası bulunamadı!');
    }
});

// WebSocket Sunucusunu HTTP üzerine kuruyoruz
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    addLog(`Yeni yönetici bağlandı: ${clientIp}`);

    // Arayüzden gelen komutları dinle (Restart, Flush, Bakım vb.)
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.t === 'cmd') {
                if (data.action === 'restart') {
                    addLog("[ACTION] Sunucu yeniden başlatma komutu tetiklendi.");
                } else if (data.action === 'flush') {
                    addLog("[ACTION] Önbellek (Cache) başarıyla temizlendi.");
                } else if (data.action === 'maintenance') {
                    addLog("[ACTION] Bakım modu durumu değiştirildi.");
                }
            }
        } catch (e) {
            console.error('Komut işleme hatası:', e);
        }
    });

    ws.on('close', () => {
        addLog(`Yönetici bağlantısı sonlandırıldı.`);
    });
});

// Her 1 saniyede bir bağlı tüm arayüzlere sistem metriklerini gönder
setInterval(() => {
    // Gerçek RAM kullanımı hesabı (Node.js os modülü ile)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);

    // CPU yükü simülasyonu veya gerçekçi dalgalanma (%12 - %38 arası)
    const cpuPercent = Math.floor(Math.random() * 26) + 12;

    // Gecikme (Ping) simülasyonu (2ms - 7ms arası süper hızlı tepki)
    const pingVal = Math.floor(Math.random() * 6) + 2;

    const payload = JSON.stringify({
        serverPing: pingVal,
        cpu: cpuPercent,
        ram: ramPercent,
        disk: 44.2, // Sabit SSD alanı (GB)
        logs: logs
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`> Sector Zero Control Center aktif: http://localhost:${PORT}`);
});
