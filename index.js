const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// 【重要】ここがファイルを配る設定です
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });
});
