// Puffin Isle — multiplayer game server
// No extra packages needed: runs with plain Node.js (version 18 or newer).
// Start it with:  node server.js   then open http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const S = require('./shared.js');

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
// Only these files are sent to browsers (everything sits in one folder, no subfolders)
const PUBLIC_FILES = new Set(['index.html', 'shared.js', 'engine.js', 'models.js', 'rooms.js', 'minigames.js', 'game.js']);

const START_COINS = 100;
const GAME_CAPS = { sled: 60, fish: 60, catch: 60 };
const MAX_HOME_ITEMS = 80;

// ---------- Saved accounts ----------
let db = { accounts: {} };
try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { /* fresh start */ }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fs.writeFile(DATA_FILE, JSON.stringify(db), () => {}), 1000);
}
function saveNow() { clearTimeout(saveTimer); try { fs.writeFileSync(DATA_FILE, JSON.stringify(db)); } catch {} }
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { saveNow(); process.exit(0); });
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 32).toString('hex'); }

function num(v, min, max, def) { v = Number(v); return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def; }

// Make sure every account has all the newer fields
function fixAccount(a) {
  if (!Array.isArray(a.items)) a.items = [];
  if (typeof a.coins !== 'number') a.coins = START_COINS;
  if (typeof a.xp !== 'number') a.xp = 0;
  if (!a.quests || typeof a.quests !== 'object') a.quests = { active: {}, done: [] };
  if (!a.quests.active) a.quests.active = {};
  if (!Array.isArray(a.quests.done)) a.quests.done = [];
  if (!a.furn || typeof a.furn !== 'object') a.furn = { ...S.STARTER_FURN };
  if (!a.home || typeof a.home !== 'object') a.home = { type: 'igloo', floor: 0, wall: 0, items: [] };
  if (!Array.isArray(a.home.items)) a.home.items = [];
  return a;
}
for (const a of Object.values(db.accounts)) fixAccount(a);

function cleanHomeItem(it) {
  if (!it || !S.FURN[it.f]) return null;
  return { f: it.f, x: num(it.x, -12.5, 12.5, 0), z: num(it.z, -7.5, 7.5, 0), r: Math.round(num(it.r, 0, 7, 0)) };
}
// Restore from the browser's backup (free hosting wipes server files when it sleeps)
function restore(a, s) {
  if (!s || typeof s !== 'object') return;
  a.coins = Math.floor(num(s.coins, 0, 20000, START_COINS));
  a.items = Array.isArray(s.items) ? [...new Set(s.items.filter(i => i in S.ITEMS))] : [];
  a.hat = a.items.includes(s.hat) ? s.hat : null;
  if (S.COLORS.includes(s.color)) a.color = s.color;
  a.xp = Math.floor(num(s.xp, 0, 1e6, 0));
  if (s.furn && typeof s.furn === 'object') {
    a.furn = {};
    for (const [k, v] of Object.entries(s.furn)) if (S.FURN[k]) a.furn[k] = Math.floor(num(v, 0, 99, 0));
  }
  if (s.home && typeof s.home === 'object') {
    a.home = {
      type: S.HOME_TYPES[s.home.type] ? s.home.type : 'igloo',
      floor: Math.floor(num(s.home.floor, 0, S.FLOORS.length - 1, 0)),
      wall: Math.floor(num(s.home.wall, 0, S.WALLS.length - 1, 0)),
      items: (Array.isArray(s.home.items) ? s.home.items : []).map(cleanHomeItem).filter(Boolean).slice(0, MAX_HOME_ITEMS),
    };
  }
  if (s.quests && typeof s.quests === 'object') {
    const done = Array.isArray(s.quests.done) ? s.quests.done.filter(id => S.QUEST_BY_ID[id]) : [];
    const active = {};
    for (const [id, p] of Object.entries(s.quests.active || {})) if (S.QUEST_BY_ID[id] && !done.includes(id)) active[id] = S.cleanProg(S.QUEST_BY_ID[id], p);
    a.quests = { active, done: [...new Set(done)] };
  }
}

// ---------- Simple chat filter ----------
const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigg', 'fag', 'whore', 'slut', 'bastard', 'asshole'];
function clean(text) {
  let t = String(text).replace(/[\u0000-\u001f]/g, '').slice(0, 80).trim();
  for (const w of BAD) t = t.replace(new RegExp(w, 'gi'), m => '*'.repeat(m.length));
  return t;
}

// ---------- Static file server ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p === '/health') { res.end('ok'); return; }
  const name = p.replace(/^\/+/, '');
  if (!PUBLIC_FILES.has(name)) { res.writeHead(404); res.end('Not found'); return; }
  const file = path.join(__dirname, name);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------- Minimal WebSocket implementation ----------
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
function wsFrame(str, opcode = 1) {
  const payload = Buffer.from(str);
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x80 | opcode, len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([header, payload]);
}
const conns = new Set();
server.on('upgrade', (req, socket) => {
  if (!req.url.startsWith('/ws') || !req.headers['sec-websocket-key']) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.setNoDelay(true);
  const conn = {
    socket, alive: true, player: null,
    send(obj) { if (!socket.destroyed) socket.write(wsFrame(JSON.stringify(obj))); },
    close() { try { socket.write(Buffer.from([0x88, 0])); } catch {} socket.end(); },
  };
  let buf = Buffer.alloc(0), fragments = [];
  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const fin = (buf[0] & 0x80) !== 0, opcode = buf[0] & 0x0f, masked = (buf[1] & 0x80) !== 0;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > 262144) { socket.destroy(); return; }
      const need = off + (masked ? 4 : 0) + len;
      if (buf.length < need) return;
      let payload = buf.subarray(off + (masked ? 4 : 0), need);
      if (masked) { const mask = buf.subarray(off, off + 4); payload = Buffer.from(payload.map((b, i) => b ^ mask[i % 4])); }
      buf = buf.subarray(need);
      if (opcode === 8) { conn.close(); return; }
      if (opcode === 9) { socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
      if (opcode === 10) { conn.alive = true; continue; }
      if (opcode === 1 || opcode === 0) {
        fragments.push(payload);
        if (!fin) continue;
        const text = Buffer.concat(fragments).toString('utf8'); fragments = [];
        conn.alive = true;
        try { handle(conn, JSON.parse(text)); } catch (e) { console.error(e); }
      }
    }
  });
  socket.on('close', () => leave(conn));
  socket.on('error', () => leave(conn));
  conns.add(conn);
});
setInterval(() => {
  for (const c of conns) {
    if (!c.alive) { c.socket.destroy(); leave(c); continue; }
    c.alive = false;
    if (!c.socket.destroyed) c.socket.write(Buffer.from([0x89, 0]));
  }
}, 25000);

// ---------- Game state ----------
const players = new Map();
let nextId = 1;
const acct = p => db.accounts[p.name.toLowerCase()];
const isHome = r => typeof r === 'string' && r.startsWith('home:');
function roomValid(r) { return S.PUBLIC_ROOMS.includes(r) || (isHome(r) && !!db.accounts[r.slice(5)]); }

function publicPlayer(p) {
  return { id: p.id, name: p.name, color: p.color, hat: p.hat, room: p.room, x: p.x, y: p.y, lvl: S.levelFromXp(acct(p).xp) };
}
function toRoom(room, obj, exceptId) { for (const p of players.values()) if (p.room === room && p.id !== exceptId) p.conn.send(obj); }
function toAll(obj) { for (const p of players.values()) p.conn.send(obj); }
function onlineList() { return [...players.values()].map(p => ({ id: p.id, name: p.name, room: p.room, lvl: S.levelFromXp(acct(p).xp) })); }
function homeData(room) {
  const a = db.accounts[room.slice(5)];
  return a ? { owner: a.name, type: a.home.type, floor: a.home.floor, wall: a.home.wall, items: a.home.items } : null;
}
function sendRoom(p) {
  const list = [...players.values()].filter(o => o.room === p.room).map(publicPlayer);
  p.conn.send({ t: 'room', room: p.room, players: list, home: isHome(p.room) ? homeData(p.room) : null });
}
function sendProfile(p) {
  const a = acct(p);
  p.conn.send({ t: 'profile', coins: a.coins, items: a.items, hat: a.hat, color: a.color, xp: a.xp, lvl: S.levelFromXp(a.xp),
    quests: a.quests, furn: a.furn, home: a.home });
}
function homeChanged(p) {
  const room = 'home:' + p.name.toLowerCase();
  const data = homeData(room);
  for (const o of players.values()) if (o.room === room) o.conn.send({ t: 'home', home: data });
  save(); sendProfile(p);
}
function addXp(p, xp) {
  const a = acct(p), before = S.levelFromXp(a.xp);
  a.xp += xp;
  const after = S.levelFromXp(a.xp);
  if (after > before) {
    p.conn.send({ t: 'levelup', lvl: after });
    toRoom(p.room, { t: 'look', id: p.id, color: p.color, hat: p.hat, lvl: after });
    toAll({ t: 'online', list: onlineList() });
  }
}

function leave(conn) {
  conns.delete(conn);
  const p = conn.player;
  if (!p || !players.has(p.id)) return;
  players.delete(p.id);
  toRoom(p.room, { t: 'left', id: p.id });
  toAll({ t: 'online', list: onlineList() });
}

function handle(conn, m) {
  const p = conn.player;

  if (m.t === 'join' && !p) {
    const name = String(m.name || '').replace(/[^A-Za-z0-9 _-]/g, '').trim().slice(0, 14);
    const pw = String(m.password || '');
    if (name.length < 2) return conn.send({ t: 'error', msg: 'Name must be 2–14 letters or numbers.' });
    if (clean(name) !== name) return conn.send({ t: 'error', msg: 'Please pick a different name.' });
    if (pw.length < 3) return conn.send({ t: 'error', msg: 'Password must be at least 3 characters.' });
    const key = name.toLowerCase();
    let a = db.accounts[key];
    if (!a) {
      const salt = crypto.randomBytes(8).toString('hex');
      a = db.accounts[key] = fixAccount({ name, salt, hash: hashPw(pw, salt), coins: START_COINS, items: [], hat: null,
        color: S.COLORS.includes(m.color) ? m.color : S.COLORS[0] });
      restore(a, m.save);
      save();
    } else if (hashPw(pw, a.salt) !== a.hash) {
      return conn.send({ t: 'error', msg: 'That name is taken (wrong password).' });
    }
    for (const o of players.values()) if (o.name.toLowerCase() === key) { o.conn.send({ t: 'error', msg: 'You logged in somewhere else.' }); o.conn.close(); leave(o.conn); }
    const np = { id: nextId++, name: a.name, color: a.color, hat: a.hat, room: 'town', x: 480 + Math.random() * 100 - 50, y: 420, conn, lastChat: 0, lastEarn: {} };
    conn.player = np;
    players.set(np.id, np);
    conn.send({ t: 'welcome', id: np.id });
    sendProfile(np);
    sendRoom(np);
    toRoom(np.room, { t: 'joined', player: publicPlayer(np) }, np.id);
    toAll({ t: 'online', list: onlineList() });
    return;
  }
  if (!p) return;
  const a = acct(p);

  switch (m.t) {
    case 'move':
      p.x = num(m.x, 0, 960, p.x); p.y = num(m.y, 0, 600, p.y);
      toRoom(p.room, { t: 'move', id: p.id, x: p.x, y: p.y }, p.id);
      break;
    case 'goto': {
      if (!roomValid(m.room)) return;
      if (m.room === p.room) { sendRoom(p); return; }
      toRoom(p.room, { t: 'left', id: p.id });
      p.room = m.room;
      p.x = num(m.x, 0, 960, 480); p.y = num(m.y, 0, 600, 450);
      sendRoom(p);
      toRoom(p.room, { t: 'joined', player: publicPlayer(p) }, p.id);
      toAll({ t: 'online', list: onlineList() });
      break;
    }
    case 'chat': {
      const now = Date.now();
      if (now - p.lastChat < 700) return;
      p.lastChat = now;
      const text = clean(m.text);
      if (text) toRoom(p.room, { t: 'chat', id: p.id, text });
      break;
    }
    case 'emote': toRoom(p.room, { t: 'emote', id: p.id, e: String(m.e || '').slice(0, 8) }); break;
    case 'dance': toRoom(p.room, { t: 'dance', id: p.id, on: !!m.on }); break;
    case 'throw': toRoom(p.room, { t: 'throw', id: p.id, x: num(m.x, 0, 960, 0), y: num(m.y, 0, 600, 0) }); break;
    case 'earn': {
      const cap = GAME_CAPS[m.game];
      if (!cap) return;
      const now = Date.now();
      if (now - (p.lastEarn[m.game] || 0) < 10000) return;
      p.lastEarn[m.game] = now;
      const coins = Math.floor(num(m.coins, 0, cap, 0));
      a.coins += coins;
      addXp(p, Math.min(30, Math.floor(coins / 2)));
      save(); sendProfile(p);
      p.conn.send({ t: 'toast', msg: `+${coins} coins!` });
      break;
    }
    case 'buy': {
      const it = S.ITEMS[m.item];
      if (!it) return;
      if (a.items.includes(m.item)) return p.conn.send({ t: 'toast', msg: 'You already own that.' });
      if (a.coins < it[1]) return p.conn.send({ t: 'toast', msg: 'Not enough coins!' });
      a.coins -= it[1]; a.items.push(m.item);
      save(); sendProfile(p);
      p.conn.send({ t: 'toast', msg: 'Bought it! Open your bag 🎒 to wear it.' });
      break;
    }
    case 'wear': {
      if (m.item !== undefined && m.item !== null && !a.items.includes(m.item)) return;
      if (m.color !== undefined && S.COLORS.includes(m.color)) a.color = p.color = m.color;
      if (m.item !== undefined) a.hat = p.hat = m.item;
      save(); sendProfile(p);
      toRoom(p.room, { t: 'look', id: p.id, color: p.color, hat: p.hat, lvl: S.levelFromXp(a.xp) });
      break;
    }

    // ----- Home & furniture -----
    case 'fbuy': {
      const f = S.FURN[m.id];
      if (!f) return;
      if (a.coins < f[1]) return p.conn.send({ t: 'toast', msg: 'Not enough coins!' });
      a.coins -= f[1]; a.furn[m.id] = (a.furn[m.id] || 0) + 1;
      save(); sendProfile(p);
      p.conn.send({ t: 'toast', msg: `Bought a ${f[0]}! It's in your furniture box.` });
      break;
    }
    case 'hplace': {
      const it = cleanHomeItem(m);
      if (!it || !(a.furn[it.f] > 0)) return;
      if (a.home.items.length >= MAX_HOME_ITEMS) return p.conn.send({ t: 'toast', msg: 'Your home is full!' });
      a.furn[it.f]--; a.home.items.push(it);
      homeChanged(p);
      break;
    }
    case 'hmove': {
      const i = Math.floor(num(m.i, -1, 999, -1)), cur = a.home.items[i];
      if (!cur) return;
      const it = cleanHomeItem({ f: cur.f, x: m.x, z: m.z, r: m.r });
      a.home.items[i] = it;
      homeChanged(p);
      break;
    }
    case 'hremove': {
      const i = Math.floor(num(m.i, -1, 999, -1)), cur = a.home.items[i];
      if (!cur) return;
      a.home.items.splice(i, 1); a.furn[cur.f] = (a.furn[cur.f] || 0) + 1;
      homeChanged(p);
      break;
    }
    case 'hstyle': {
      if (m.type && S.HOME_TYPES[m.type]) a.home.type = m.type;
      if (m.floor !== undefined) a.home.floor = Math.floor(num(m.floor, 0, S.FLOORS.length - 1, a.home.floor));
      if (m.wall !== undefined) a.home.wall = Math.floor(num(m.wall, 0, S.WALLS.length - 1, a.home.wall));
      homeChanged(p);
      break;
    }

    // ----- Quests -----
    case 'qaccept': {
      const q = S.QUEST_BY_ID[m.id];
      if (!q || S.questState(q, a) !== 'available') return;
      a.quests.active[q.id] = S.newProg(q);
      save(); sendProfile(p);
      break;
    }
    case 'qprog': {
      const q = S.QUEST_BY_ID[m.id];
      if (!q || !a.quests.active[q.id]) return;
      a.quests.active[q.id] = S.cleanProg(q, m.prog);
      save(); sendProfile(p);
      break;
    }
    case 'qabandon': {
      if (a.quests.active[m.id]) { delete a.quests.active[m.id]; save(); sendProfile(p); }
      break;
    }
    case 'qturnin': {
      const q = S.QUEST_BY_ID[m.id];
      if (!q || S.questState(q, a) !== 'ready') return;
      delete a.quests.active[q.id];
      a.quests.done.push(q.id);
      const r = q.reward;
      a.coins += r.coins || 0;
      let extra = '';
      if (r.item && !a.items.includes(r.item)) { a.items.push(r.item); extra = ` + ${S.ITEMS[r.item][0]}`; }
      if (r.furn) { a.furn[r.furn] = (a.furn[r.furn] || 0) + 1; extra = ` + ${S.FURN[r.furn][0]}`; }
      addXp(p, r.xp || 0);
      save(); sendProfile(p);
      p.conn.send({ t: 'qdone', id: q.id, msg: `Quest complete: ${q.title}! +${r.coins} coins, +${r.xp} XP${extra}` });
      break;
    }
  }
}

server.listen(PORT, () => console.log(`Puffin Isle running on http://localhost:${PORT}`));
