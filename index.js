const express = require('express'); // ファイル配信用のライブラリ
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// 1. "public" フォルダの中身をウェブサイトとして公開する設定
app.use(express.static(path.join(__dirname, 'public')));

// 2. HTTPサーバーを起動
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// 3. 同じポートで WebSocket サーバーを動かす
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (data) => {
    // 全員にデータを転送（リレー）
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });
});
