const WebSocket = require('ws');
const http = require('http');

// HTTP Sunucusu (Vercel ve bulut platformların sağlık kontrolü / ping yanıtı için)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Sector Zero WebSocket Server aktif ve çalışıyor!\n');
});

// WebSocket sunucusunu HTTP üzerine kuruyoruz
const wwss = new WebSocket.Server({ server });

// Bağlı oyuncuları takip etmek için harita
const clients = new Map();

wwss.on('connection', (ws) => {
    // Her bağlanan oyuncuya rastgele benzersiz bir ID atıyoruz
    const clientId = 'Player_' + Math.random().toString(36).substring(2, 7);
    console.log(`> Yeni oyuncu bağlandı: ${clientId}`);

    clients.set(ws, { id: clientId });

    // Oyuncudan gelen veri akışı
    ws.on('message', (message) => {
        try {
            const rawData = message.toString();
            const data = JSON.parse(rawData);
            
            // Mesajın hangi oyuncudan geldiğini ID ile mühürle
            data.id = clientId;

            // Bu oyuncu hariç odadaki diğer herkese veriyi ilet (Broadcast)
            wwss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (e) {
            console.error('> Paket çözümleme hatası:', e.message);
        }
    });

    // Oyuncu bağlantıyı kestiğinde
    ws.on('close', () => {
        console.log(`> Oyuncu ayrıldı: ${clientId}`);
        clients.delete(ws);
    });

    ws.on('error', (err) => {
        console.error(`> Bağlantı hatası (${clientId}):`, err.message);
    });
});

// Port ayarı (Bulut sunucu ortam değişkeni veya yerel 3000)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`> Sector Zero Sunucusu ${PORT} portunda dinlemede.`);
});
