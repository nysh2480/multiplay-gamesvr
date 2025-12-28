const { WebSocketServer } = require('ws');

// Render.comやNorthflankは環境変数PORTを指定してくるので、それに合わせます
const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    // 受信したデータを自分以外の全員にブロードキャスト
    // (DODのテーブル更新情報をそのまま横流しする)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });

  ws.on('close', () => console.log('Client disconnected'));
});

console.log(`GBL Relay Server is running on port ${port}`);
