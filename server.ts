import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());


// Cloudflare credentials from process.env
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const D1_DB_ID = "d1b6e5df-c633-40e6-a320-edfd1a56fec1";

async function queryD1(sql, params = []) {
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    throw new Error("Missing Cloudflare credentials");
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`D1 Error: ${res.status} ${errText}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 API Error: ${JSON.stringify(data.errors)}`);
  }
  return data.result[0].results;
}

// API Routes

// Ping user location & active status
app.post('/api/users/:uid/ping', async (req, res) => {
  try {
    const { uid } = req.params;
    const { displayName, photoURL, isAnonymous, location_lat, location_lng } = req.body;
    const now = Date.now();
    
    await queryD1(`
      INSERT INTO users (uid, displayName, photoURL, isAnonymous, lastSeen, location_lat, location_lng, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET 
        displayName=excluded.displayName,
        photoURL=excluded.photoURL,
        lastSeen=excluded.lastSeen,
        location_lat=excluded.location_lat,
        location_lng=excluded.location_lng
    `, [uid, displayName, photoURL, isAnonymous ? 1 : 0, now, location_lat, location_lng, now]);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error pinging:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update user status
app.post('/api/users/:uid/status', async (req, res) => {
  try {
    const { uid } = req.params;
    const { isSearching, friendId, chatToken } = req.body;
    
    let updates = [];
    let params = [];
    
    if (isSearching !== undefined) {
      updates.push("isSearching = ?");
      params.push(isSearching ? 1 : 0);
    }
    if (friendId !== undefined) {
      updates.push("friendId = ?");
      params.push(friendId);
    }
    if (chatToken !== undefined) {
      updates.push("chatToken = ?");
      params.push(chatToken);
    }
    
    if (updates.length > 0) {
      params.push(uid);
      await queryD1(`UPDATE users SET ${updates.join(", ")} WHERE uid = ?`, params);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const results = await queryD1(`SELECT * FROM users WHERE uid = ?`, [uid]);
    if (results.length === 0) return res.status(404).json({ error: "Not found" });
    const u = results[0];
    res.json({
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      isAnonymous: Boolean(u.isAnonymous),
      lastSeen: u.lastSeen,
      isSearching: Boolean(u.isSearching),
      location_lat: u.location_lat,
      location_lng: u.location_lng,
      friendId: u.friendId,
      chatToken: u.chatToken,
      createdAt: u.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all active users (last hour)
app.get('/api/users', async (req, res) => {
  try {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const results = await queryD1(`SELECT * FROM users WHERE lastSeen >= ?`, [oneHourAgo]);
    const users = results.map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      isAnonymous: Boolean(u.isAnonymous),
      lastSeen: u.lastSeen,
      isSearching: Boolean(u.isSearching),
      location_lat: u.location_lat,
      location_lng: u.location_lng,
      friendId: u.friendId,
      chatToken: u.chatToken,
      createdAt: u.createdAt
    }));
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chats - Get chat
app.get('/api/chats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const results = await queryD1(`SELECT * FROM chats WHERE id = ?`, [id]);
    if (results.length === 0) return res.status(404).json({ error: "Not found" });
    const c = results[0];
    res.json({ id: c.id, users: [c.user1_uid, c.user2_uid], active: Boolean(c.active) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create chat
app.post('/api/chats', async (req, res) => {
  try {
    const { id, user1_uid, user2_uid } = req.body;
    const now = Date.now();
    await queryD1(`
      INSERT INTO chats (id, user1_uid, user2_uid, active, createdAt, updatedAt)
      VALUES (?, ?, ?, 1, ?, ?)
    `, [id, user1_uid, user2_uid, now, now]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chats/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    await queryD1(`UPDATE chats SET active = 0 WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user chats
app.get('/api/users/:uid/chats', async (req, res) => {
  try {
    const { uid } = req.params;
    const results = await queryD1(`SELECT * FROM chats WHERE user1_uid = ? OR user2_uid = ? ORDER BY updatedAt DESC LIMIT 50`, [uid, uid]);
    const chats = results.map(c => ({ id: c.id, users: [c.user1_uid, c.user2_uid], active: Boolean(c.active) }));
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Messages - List
app.get('/api/chats/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const results = await queryD1(`SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC`, [id]);
    const messages = results.map(m => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp
    }));
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Messages - Create
app.post('/api/chats/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, senderId } = req.body;
    const msgId = Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    await queryD1(`
      INSERT INTO messages (id, chatId, senderId, text, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, [msgId, id, senderId, text, now]);
    await queryD1(`UPDATE chats SET updatedAt = ? WHERE id = ?`, [now, id]);
    res.json({ success: true, id: msgId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
