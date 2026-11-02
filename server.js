const WebSocket = require('ws');
const http = require('http');

// Terminal ANSI Renk Kodları
const C = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    blue: "\x1b[34m"
};

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// HTTP ve WebSocket Sunucusu
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "online", server: "SZServer Core", clients: wss.clients.size }));
});

const wss = new WebSocket.Server({ server });

// Sunucu Durum Bilgileri
const state = {
    rooms: {},
    players: new Map()
};

function getTimestamp() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function log(type, message, color = C.cyan) {
    const tag = `[${getTimestamp()}] [${type}]`;
    console.log(`${C.dim}${tag}${C.reset} ${color}${message}${C.reset}`);
}

// Oyuncular ve Bağlantı Yönetimi
wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substring(2, 9);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    state.players.set(ws, { id: clientId, ip: clientIp, joinedAt: Date.now() });

    log("JOIN", `🎮 Yeni Oyuncu Bağlandı! ID: ${clientId} (${clientIp})`, C.green);
    log("STATS", `Toplam Aktif Oyuncu: ${wss.clients.size}`, C.yellow);

    // Oyuncuya kendi ID'sini ilet
    ws.send(JSON.stringify({ t: 'hi', id: clientId }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Paket akış mantığı (Oda durumları, pozisyon güncellemeleri vb.)
            if (data.t === 'p') {
                // Presence / Oyuncu Pozisyon Paketi
                broadcast(ws, data);
            }
        } catch (err) {
            log("ERROR", `Hatalı paket alındı (${clientId}): ${err.message}`, C.red);
        }
    });

    ws.on('close', () => {
        state.players.delete(ws);
        log("LEAVE", `❌ Oyuncu Ayrıldı: ${clientId}`, C.red);
        log("STATS", `Kalan Oyuncu Sayısı: ${wss.clients.size}`, C.yellow);
    });

    ws.on('error', (err) => {
        log("WARN", `Socket Hatası (${clientId}): ${err.message}`, C.magenta);
    });
});

// Yayınlama (Broadcast) Fonksiyonu
function broadcast(sender, data) {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Sunucuyu Başlat ve Banner Çiz
server.listen(PORT, HOST, () => {
    console.clear();
    console.log(`${C.cyan}${C.bright}`);
    console.log(` 🚀  ======================================================`);
    console.log(`       S Z S E R V E R   C O R E   M U L T I P L A Y E R    `);
    console.log(` ======================================================  ${C.reset}`);
    console.log(` ${C.green}● Geliştirici:${C.reset} EmossDev`);
    console.log(` ${C.green}● Port:${C.reset}        ${PORT}`);
    console.log(` ${C.green}● Dinlenen Adres:${C.reset} ${HOST} (Tüm dış/iç IP'lere açık)`);
    console.log(` ${C.green}● Durum:${C.reset}       Hazır ve Bağlantıları Bekliyor...\n`);
});
