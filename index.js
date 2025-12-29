const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const { Pool } = require('pg'); // PostgreSQL用のライブラリ

const app = express();
const port = process.env.PORT || 10000;

// 1. データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Renderで必要なSSL設定
});

// 2. テーブルの自動作成（掲示板用のテーブル）
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database Table Ready");
  } catch (err) {
    console.error("DB Init Error:", err);
  }
}
initDB();

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', async (ws) => {
  console.log('Client connected');

  // 接続時に過去のメッセージをDBから取得して送る
  try {
    const res = await pool.query('SELECT content FROM messages ORDER BY id DESC LIMIT 50');
    ws.send(JSON.stringify({ type: 'history', data: res.rows.reverse() }));
  } catch (err) {
    console.error("DB Select Error:", err);
  }

  ws.on('message', async (data) => {
    const messageStr = data.toString();
    
    // DBに保存
    try {
      await pool.query('INSERT INTO messages (content) VALUES ($1)', [messageStr]);
    } catch (err) {
      console.error("DB Insert Error:", err);
    }

    // 全員に転送（リアルタイム同期）
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(messageStr);
      }
    });
  });
});
