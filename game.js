// =====================================================================
//  Puffin Isle — main game client (3D world, quests, homes, UI)
// =====================================================================
const $ = id => document.getElementById(id);
const PI = Math.PI;
const glCanvas = $('gl'), ov = $('ov'), octx = ov.getContext('2d');
let R3 = null, PR3 = null;
try { R3 = new E3.Renderer(glCanvas); } catch (e) { $('err').textContent = 'Your browser does not support 3D graphics (WebGL). Try Chrome, Edge, Firefox or Safari.'; }
try { const pc = document.createElement('canvas'); pc.width = 200; pc.height = 240; PR3 = new E3.Renderer(pc, { preserve: true }); } catch {}

// ---------------------------------------------------------------- state
let ws = null, myId = null, roomId = null, creds = null, reconnecting = false, kicked = false;
let players = new Map(), onlineList = [];
let profile = { coins: 0, items: [], hat: null, color: S.COLORS[0], xp: 0, lvl: 1, quests: { active: {}, done: [] }, furn: {}, home: { type: 'igloo', floor: 0, wall: 0, items: [] } };
const keys = new Set();
let homeData = null, scene = null;
const roomCache = {};
let pending = null, hover = null, throwMode = false, snowballs = [], splats = [];
const cam = { yaw: 0, tyaw: 0, pitch: .58, dist: 31, tdist: 31, tx: 0, tz: 1 };
let edit = null;           // home editing: { sel, drag, dragPos }
let danceAcc = 0, banner = null, lvlBanner = null, qmsg = null, loginColor = S.COLORS[0];
const fxRoot = new E3.Node();

const toWorld = (x, y) => [(x - 480) / 30, (y - 300) / 30];
const toServer = (X, Z) => [X * 30 + 480, Z * 30 + 300];
const myKey = () => creds ? creds.name.toLowerCase() : '';
const isHomeRoom = id => typeof id === 'string' && id.startsWith('home:');
const roomDef = id => isHomeRoom(id) ? Rooms.HOME_DEF : Rooms.ROOMS[id];
function clampB(def, X, Z) { const b = def.bounds; return [Math.max(b[0], Math.min(b[1], X)), Math.max(b[2], Math.min(b[3], Z))]; }
function store(k, v) { try { localStorage.setItem(k, v); } catch {} }
function load(k) { try { return localStorage.getItem(k); } catch { return null; } }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.tm); toast.tm = setTimeout(() => t.style.opacity = 0, 2600); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ---------------------------------------------------------------- sizing
function resize() {
  const r = ov.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const c of [glCanvas, ov]) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
  octx.setTransform(ov.width / W, 0, 0, ov.height / H, 0, 0);
}
window.addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- scenes
function buildScene(id, home) {
  const def = roomDef(id);
  const ctx = { id, def, root: new E3.Node(), hot: [], anim: [], furn: [], npcs: [], collect: [] };
  if (isHomeRoom(id)) Rooms.buildHome(ctx, home || { type: 'igloo', floor: 0, wall: 0, items: [] });
  else def.build(ctx);
  for (const [nid, n] of Object.entries(S.NPCS)) if (n.room === id) {
    const m = Models.buildPuffin(n.color, n.hat); m.root.pos = [n.x, 0, n.z]; ctx.root.add(m.root);
    ctx.npcs.push({ id: nid, npc: n, model: m });
    ctx.hot.push({ box: [n.x - 1, 0, n.z - 1, n.x + 1, 3.4, n.z + 1], label: n.name, npc: nid, walk: clampB(def, n.x, n.z + 2.2), nodes: [m.root] });
  }
  return ctx;
}
function getScene(id) {
  if (isHomeRoom(id)) return buildScene(id, homeData);
  return roomCache[id] || (roomCache[id] = buildScene(id));
}
function refreshCollectibles() {
  if (!scene) return;
  for (const c of scene.collect) scene.root.remove(c.node);
  scene.collect = [];
  const want = new Set();
  for (const [id, prog] of Object.entries(profile.quests.active)) {
    const q = S.QUEST_BY_ID[id]; if (!q) continue;
    for (const o of q.objs) if (o.t === 'collect') for (const [cid, c] of Object.entries(S.COLLECT)) if (c.item === o.item && !(prog.got || []).includes(cid)) want.add(cid);
  }
  for (const cid of want) {
    const c = S.COLLECT[cid]; if (c.room !== roomId) continue;
    const node = Models.collectible(c.item); node.pos = [c.x, 0, c.z]; scene.root.add(node);
    scene.collect.push({ id: cid, node, x: c.x, z: c.z });
  }
}

// ---------------------------------------------------------------- network
function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen = () => {
    let save = null; try { save = JSON.parse(load('pi_save_' + myKey())); } catch {}
    ws.send(JSON.stringify({ t: 'join', ...creds, save }));
  };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
  ws.onclose = () => {
    if (kicked) return;
    if (myId === null && !reconnecting) {
      if (!$('err').textContent) $('err').textContent = 'Could not connect. The server may be waking up — try again in a minute.';
      $('play').disabled = false; return;
    }
    if (myId !== null) toast('Connection lost — reconnecting…');
    myId = null; roomId = null; scene = null; reconnecting = true; game = null; edit = null;
    setTimeout(connect, 2500);
  };
}
function send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function mkPlayer(p) { return { ...p, tx: p.x, ty: p.y, ang: 0, chat: null, chatT: 0, emote: null, emoteT: 0, dancing: false, moving: false, model: null, mkey: '' }; }

function onMsg(m) {
  switch (m.t) {
    case 'error':
      $('err').textContent = m.msg; $('play').disabled = false;
      if (m.msg.includes('somewhere else')) { kicked = true; myId = null; roomId = null; scene = null; game = null; showLogin(); }
      if (reconnecting) { reconnecting = false; showLogin(); }
      break;
    case 'welcome':
      myId = m.id; reconnecting = false;
      $('login').classList.remove('show'); setHudVisible(true);
      store('pi_name', creds.name);
      break;
    case 'profile': {
      const before = JSON.stringify(profile.quests);
      profile = m;
      $('coins').textContent = `🪙 ${m.coins}`;
      store('pi_save_' + myKey(), JSON.stringify({ coins: m.coins, items: m.items, hat: m.hat, color: m.color, xp: m.xp, quests: m.quests, furn: m.furn, home: m.home }));
      if (JSON.stringify(m.quests) !== before) refreshCollectibles();
      renderTracker(); renderXp();
      for (const id of ['shop', 'bag', 'furncat', 'questlog']) if ($(id).classList.contains('show')) openPanel(id, true);
      if (edit) renderEditor();
      if ($('npc').classList.contains('show') && npcView) renderNpc();
      break;
    }
    case 'room':
      roomId = m.room; homeData = m.home; players = new Map(); pending = null; edit = null; hover = null;
      for (const p of m.players) players.set(p.id, mkPlayer(p));
      scene = getScene(roomId);
      refreshCollectibles();
      if (S.PUBLIC_ROOMS.includes(roomId)) questEvent('visit', roomId);
      $('editBtn').style.display = roomId === 'home:' + myKey() ? 'block' : 'none';
      $('homeEdit').classList.remove('show');
      cam.tyaw = 0; cam.yaw = 0;
      break;
    case 'home':
      homeData = m.home;
      if (isHomeRoom(roomId)) { scene = getScene(roomId); if (edit) { if (edit.sel != null && edit.sel >= homeData.items.length) edit.sel = null; renderEditor(); } }
      break;
    case 'joined': players.set(m.player.id, mkPlayer(m.player)); break;
    case 'left': players.delete(m.id); break;
    case 'move': { const p = players.get(m.id); if (p) { p.tx = m.x; p.ty = m.y; p.dancing = false; } break; }
    case 'chat': { const p = players.get(m.id); if (p) { p.chat = m.text; p.chatT = performance.now(); p.emote = null; } break; }
    case 'emote': { const p = players.get(m.id); if (p) { p.emote = m.e; p.emoteT = performance.now(); p.chat = null; } break; }
    case 'dance': { const p = players.get(m.id); if (p) p.dancing = m.on; break; }
    case 'look': { const p = players.get(m.id); if (p) { p.color = m.color; p.hat = m.hat; if (m.lvl) p.lvl = m.lvl; } break; }
    case 'throw': { const p = players.get(m.id); if (p) addSnowball(p, m.x, m.y, false); break; }
    case 'online': onlineList = m.list; if ($('online').classList.contains('show')) buildOnline(); break;
    case 'toast': toast(m.msg); break;
    case 'levelup': lvlBanner = { text: `⭐ LEVEL UP! You are now level ${m.lvl} ⭐`, color: '#ffd23f', t0: performance.now() }; levelFx(); break;
    case 'qdone': showBanner(m.msg, '#7dff6a'); break;
  }
}

// ---------------------------------------------------------------- picking & input
function canvasPos(e) { const r = ov.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
function me() { return players.get(myId); }
function pickHot(p) {
  if (!scene || !R3) return null;
  const ray = R3.ray(p.x, p.y, W, H);
  let best = null, bt = 1e9;
  for (const h of scene.hot) { const t = E3.rayBox(ray, h.box); if (t !== null && t < bt) { bt = t; best = h; } }
  return best;
}
function pickGround(p, h = 0) { return R3 ? E3.rayGround(R3.ray(p.x, p.y, W, H), h) : null; }
function walkTo(X, Z) {
  const m = me(); if (!m) return;
  [X, Z] = clampB(scene.def, X, Z);
  const [x, y] = toServer(X, Z);
  m.tx = x; m.ty = y; m.dancing = false;
  send({ t: 'move', x, y });
}

ov.addEventListener('contextmenu', e => e.preventDefault());
ov.addEventListener('wheel', e => { e.preventDefault(); cam.tdist = Math.max(15, Math.min(40, cam.tdist + Math.sign(e.deltaY) * 2)); }, { passive: false });
let rdrag = null;
ov.addEventListener('pointerdown', e => {
  const p = canvasPos(e);
  if (game) { game.click && game.click(p.x, p.y); return; }
  if (!scene || !me()) return;
  if (e.button === 2) { rdrag = { x: e.clientX, yaw: cam.tyaw }; return; }
  closePanels();
  if (edit) { editPointerDown(p); return; }
  if (throwMode) {
    throwMode = false; $('bThrow').classList.remove('on');
    const g = pickGround(p); if (!g) return;
    const [x, y] = toServer(g[0], g[2]);
    addSnowball(me(), x, y, true); send({ t: 'throw', x, y }); return;
  }
  const hit = pickHot(p);
  if (hit) { pending = hit; walkTo(hit.walk[0], hit.walk[1]); return; }
  pending = null;
  const g = pickGround(p); if (g) walkTo(g[0], g[2]);
});
ov.addEventListener('pointermove', e => {
  const p = canvasPos(e);
  if (game) { game.pointer && game.pointer(p.x, p.y); return; }
  if (rdrag) { cam.tyaw = Math.max(-1.2, Math.min(1.2, rdrag.yaw - (e.clientX - rdrag.x) * .006)); return; }
  if (!scene) return;
  if (edit && edit.drag) { const g = pickGround(p); if (g) { edit.dragPos = [Math.max(-12.5, Math.min(12.5, g[0])), Math.max(-7.5, Math.min(7.5, g[2]))]; const f = scene.furn[edit.sel]; if (f) f.node.pos = [edit.dragPos[0], .15, edit.dragPos[1]]; } return; }
  hover = edit ? null : pickHot(p);
  ov.style.cursor = throwMode ? 'crosshair' : (hover || edit) ? 'pointer' : 'default';
});
window.addEventListener('pointerup', () => {
  rdrag = null;
  if (edit && edit.drag) {
    edit.drag = false;
    if (edit.dragPos && edit.sel != null) { const it = homeData.items[edit.sel]; send({ t: 'hmove', i: edit.sel, x: edit.dragPos[0], z: edit.dragPos[1], r: it.r }); }
    edit.dragPos = null;
  }
});

function enterRoom(room, at) {
  if (room === '@home') room = 'home:' + myKey();
  const def = roomDef(room); if (!def) return;
  const [x, y] = toServer(...(at || def.spawn));
  players.clear(); roomId = null; scene = null; send({ t: 'goto', room, x, y });
}
function arrived() {
  const h = pending; pending = null;
  if (h.to) enterRoom(h.to, h.at);
  else if (h.npc) openNpc(h.npc);
  else if (h.action === 'shop') openPanel('shop');
  else if (h.action === 'furniture') openPanel('furncat');
  else startGame(h.action);
}

document.addEventListener('keydown', e => {
  const typing = document.activeElement && document.activeElement.tagName === 'INPUT';
  if (typing) {
    if (e.key === 'Enter' && document.activeElement === $('chat')) { const v = $('chat').value.trim(); if (v) send({ t: 'chat', text: v }); $('chat').value = ''; $('chat').blur(); }
    return;
  }
  const k = e.key.toLowerCase();
  keys.add(k);
  if (game) { if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); return; }
  if (!scene) return;
  if (e.key === 'Enter') { $('chat').focus(); e.preventDefault(); }
  else if (k === 'd') toggleDance();
  else if (k === 't') toggleThrow();
  else if (k === 'q') rotateCam(-1);
  else if (k === 'e') rotateCam(1);
  else if (k === 'l') openPanel('questlog');
  else if (e.key === 'Escape') { closePanels(); if (edit) stopEdit(); }
});
document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
function rotateCam(d) { cam.tyaw = Math.max(-1.2, Math.min(1.2, cam.tyaw + d * .35)); }
function toggleDance() { const m = me(); if (!m) return; m.dancing = !m.dancing; m.tx = m.x; m.ty = m.y; send({ t: 'dance', on: m.dancing }); }
function toggleThrow() { throwMode = !throwMode; $('bThrow').classList.toggle('on', throwMode); if (throwMode) toast('Click where to throw your snowball!'); }

// ---------------------------------------------------------------- snowballs & effects
function addSnowball(p, x, y, mine) {
  const [fx, fz] = toWorld(p.x, p.y), [tx, tz] = toWorld(x, y);
  let ty = .1, hitPlayer = null, hitTarget = false;
  for (const o of players.values()) if (o.id !== p.id) { const [ox, oz] = toWorld(o.x, o.y); if (Math.hypot(ox - tx, oz - tz) < 1.3) { ty = 1.3; hitPlayer = o; } }
  const tg = scene && scene.def.targets;
  if (tg) for (const [sx, sz] of tg) if (Math.hypot(sx - tx, sz - tz) < 1.4) { ty = 1.75; hitTarget = true; }
  const node = E3.N(fxRoot, E3.GEO.sphere, '#ffffff', [fx, 2, fz], .2);
  snowballs.push({ from: [fx, 2, fz], to: [tx, ty, tz], t0: performance.now(), node, mine, hitPlayer, hitTarget });
}
function stepFx(now) {
  for (const s of snowballs) {
    const k = (now - s.t0) / 650;
    if (k >= 1) {
      s.dead = true; fxRoot.remove(s.node);
      const parts = [];
      for (let i = 0; i < 7; i++) parts.push(E3.N(fxRoot, E3.GEO.lowSphere, '#ffffff', [...s.to], .15, [0, 0, 0], { a: .9 }));
      splats.push({ at: s.to, t0: now, parts });
      if (s.mine && s.hitTarget) { questEvent('targets'); toast('🎯 Bullseye!'); }
      if (s.mine && s.hitPlayer) questEvent('hitplayer');
      if (s.hitPlayer) { s.hitPlayer.emote = '😵'; s.hitPlayer.emoteT = now; s.hitPlayer.chat = null; }
      continue;
    }
    s.node.pos = [s.from[0] + (s.to[0] - s.from[0]) * k, s.from[1] + (s.to[1] - s.from[1]) * k + Math.sin(k * PI) * 3, s.from[2] + (s.to[2] - s.from[2]) * k];
  }
  snowballs = snowballs.filter(s => !s.dead);
  for (const s of splats) {
    const k = (now - s.t0) / 600;
    if (k >= 1) { s.dead = true; s.parts.forEach(p => fxRoot.remove(p)); continue; }
    s.parts.forEach((p, i) => { const a = i / 7 * PI * 2; p.pos = [s.at[0] + Math.cos(a) * k * 1.2, s.at[1] + Math.sin(k * PI) * .6, s.at[2] + Math.sin(a) * k * 1.2]; p.alpha = 1 - k; });
  }
  splats = splats.filter(s => !s.dead);
}
let lvlFx = null;
function levelFx() {
  const m = me(); if (!m) return;
  const [x, z] = toWorld(m.x, m.y);
  const ring = E3.N(fxRoot, E3.GEO.torus, '#ffd23f', [x, .3, z], 1, [0, 0, 0], { e: 1, a: .8 });
  const pillar = E3.N(fxRoot, E3.GEO.cyl, '#ffe14f', [x, 4, z], [1, 8, 1], [0, 0, 0], { e: 1, a: .3 });
  lvlFx = { ring, pillar, t0: performance.now() };
}
function showBanner(text, color) { banner = { text, color, t0: performance.now() }; }

// ---------------------------------------------------------------- quests
function qProg(q) { return S.cleanProg(q, profile.quests.active[q.id]); }
function questEvent(type, data) {
  if (!profile.quests) return;
  for (const [id] of Object.entries(profile.quests.active)) {
    const q = S.QUEST_BY_ID[id]; if (!q) continue;
    const prog = qProg(q), wasDone = S.questComplete(q, prog, profile);
    let changed = false;
    q.objs.forEach((o, i) => {
      if (o.t !== type) return;
      if (type === 'collect' && S.COLLECT[data] && S.COLLECT[data].item === o.item && !prog.got.includes(data)) { prog.got.push(data); changed = true; }
      else if (type === 'game' && o.game === data.game && data.score > prog.c[i]) { prog.c[i] = data.score; changed = true; }
      else if ((type === 'dance' || type === 'targets' || type === 'hitplayer') && prog.c[i] < o.n) { prog.c[i] += 1; changed = true; }
      else if (type === 'visit' && !prog.v.includes(data)) { prog.v.push(data); changed = true; }
      else if (type === 'talk' && o.npc === data && prog.c[i] < 1 && q.objs.slice(0, i).every((_, j) => S.objValue(q, j, prog, profile) >= q.objs[j].n)) { prog.c[i] = 1; changed = true; }
      if (changed && type !== 'talk') { const v = S.objValue(q, i, prog, profile); if (type !== 'dance' || v % 5 === 0 || v >= o.n) showQmsg(`${o.label}: ${v}/${o.n}`); }
    });
    if (!changed) continue;
    profile.quests.active[id] = prog;
    send({ t: 'qprog', id, prog });
    if (!wasDone && S.questComplete(q, prog, profile)) { showQmsg(`✅ ${q.title} — return to ${S.NPCS[q.turnIn].name}`); }
  }
  if (type === 'collect') refreshCollectibles();
  renderTracker();
}
function onGameFinished(kind, score) { questEvent('game', { game: kind, score }); }
function showQmsg(text) { qmsg = { text, t0: performance.now() }; }
function npcMarker(nid) {
  let mark = null;
  for (const q of S.QUESTS) {
    const st = S.questState(q, profile);
    if (st === 'ready' && q.turnIn === nid) return ['?', '#ffd23f'];
    if (st === 'available' && q.giver === nid) mark = ['!', '#ffd23f'];
    else if (!mark && st === 'active' && q.turnIn === nid) mark = ['?', '#aaaaaa'];
  }
  return mark;
}
function renderTracker() {
  const el = $('tracker');
  const act = Object.keys(profile.quests.active || {}).map(id => S.QUEST_BY_ID[id]).filter(Boolean);
  if (!act.length || !myId) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = '<div class="trk-h">📜 Quests <span>(L)</span></div>' + act.map(q => {
    const prog = qProg(q), ready = S.questComplete(q, prog, profile);
    return `<div class="trk-q"><b>${esc(q.title)}</b>` + (ready ? `<div class="ok">✔ Return to ${esc(S.NPCS[q.turnIn].name)}</div>` :
      q.objs.map((o, i) => { const v = S.objValue(q, i, prog, profile); return `<div class="${v >= o.n ? 'ok' : ''}">- ${esc(o.label)}: ${Math.min(v, o.n)}/${o.n}</div>`; }).join('')) + '</div>';
  }).join('');
}
function renderXp() {
  const L = profile.lvl || S.levelFromXp(profile.xp || 0), a = S.xpForLevel(L), b = S.xpForLevel(L + 1);
  $('xpfill').style.width = Math.min(100, (profile.xp - a) / (b - a) * 100) + '%';
  $('xptext').textContent = `Level ${L}  •  ${profile.xp - a} / ${b - a} XP`;
}

// NPC dialog
let npcView = null;
function openNpc(nid) {
  questEvent('talk', nid);
  npcView = { nid, q: null };
  closePanels(); renderNpc(); $('npc').classList.add('show');
}
function rewardHtml(r) {
  return `<div class="rw"><b>Rewards:</b> 🪙 ${r.coins} coins &nbsp; ⭐ ${r.xp} XP` + (r.item ? ` &nbsp; 🎩 ${S.ITEMS[r.item][0]}` : '') + (r.furn ? ` &nbsp; 🛋️ ${S.FURN[r.furn][0]}` : '') + '</div>';
}
function renderNpc() {
  const { nid } = npcView, n = S.NPCS[nid], el = $('npcBody');
  $('npcName').textContent = n.name;
  if (npcView.q) {
    const q = S.QUEST_BY_ID[npcView.q], st = S.questState(q, profile), prog = qProg(q);
    let html = `<h3>${esc(q.title)}</h3>`;
    if (st === 'ready' && q.turnIn === nid) html += `<p class="say">${esc(q.finish)}</p>${rewardHtml(q.reward)}<button class="btn go" id="qBtn">Complete Quest</button>`;
    else {
      html += `<p class="say">${esc(q.text)}</p><b>Objectives:</b><ul>` + q.objs.map((o, i) => `<li>${esc(o.label)}${st === 'active' || st === 'ready' ? `: ${Math.min(S.objValue(q, i, prog, profile), o.n)}/${o.n}` : ` (${o.n})`}</li>`).join('') + '</ul>' + rewardHtml(q.reward);
      if (st === 'available') html += `<button class="btn go" id="qBtn">Accept Quest</button>`;
      else if (st === 'active' || st === 'ready') html += `<div class="small">In progress — ${st === 'ready' ? 'turn it in to ' + esc(S.NPCS[q.turnIn].name) : 'keep going!'}</div>`;
    }
    html += `<button class="btn back" id="qBack">← Back</button>`;
    el.innerHTML = html;
    $('qBack').onclick = () => { npcView.q = null; renderNpc(); };
    const b = $('qBtn');
    if (b) b.onclick = () => {
      if (st === 'available') { send({ t: 'qaccept', id: q.id }); profile.quests.active[q.id] = S.newProg(q); toast(`Quest accepted: ${q.title}`); refreshCollectibles(); renderTracker(); questEvent('talk', nid); }
      else { send({ t: 'qturnin', id: q.id }); }
      npcView.q = null; closePanels();
    };
    return;
  }
  const list = S.QUESTS.map(q => [q, S.questState(q, profile)]).filter(([q, st]) =>
    (st === 'ready' && q.turnIn === nid) || (st === 'available' && q.giver === nid) || (st === 'active' && (q.giver === nid || q.turnIn === nid)));
  const locked = S.QUESTS.filter(q => q.giver === nid && S.questState(q, profile) === 'locked' && q.req.every(r => profile.quests.done.includes(r)));
  let html = `<p class="say">${esc(n.hi)}</p>`;
  if (list.length) html += '<div class="qlist">' + list.map(([q, st]) => `<button class="qitem" data-q="${q.id}"><span class="mk ${st === 'active' ? 'gray' : ''}">${st === 'available' ? '!' : '?'}</span>${esc(q.title)}${st === 'ready' && q.turnIn === nid ? ' <i>(complete)</i>' : ''}</button>`).join('') + '</div>';
  else html += '<p class="small">I have nothing for you right now.</p>';
  if (locked.length) html += `<p class="small">Come back at level ${Math.min(...locked.map(q => q.lvl))} for more work!</p>`;
  el.innerHTML = html;
  el.querySelectorAll('.qitem').forEach(b => b.onclick = () => { npcView.q = b.dataset.q; renderNpc(); });
}
function buildQuestLog() {
  const el = $('questlogBody');
  const act = Object.keys(profile.quests.active).map(id => S.QUEST_BY_ID[id]).filter(Boolean);
  const L = profile.lvl || 1;
  let html = `<div class="lvlrow">⭐ Level ${L} — ${profile.xp} XP total · ${profile.quests.done.length}/${S.QUESTS.length} quests done</div>`;
  if (!act.length) html += '<p class="small">No active quests. Look for puffins with a yellow <b style="color:#d4a90a">!</b> over their heads.</p>';
  for (const q of act) {
    const prog = qProg(q), ready = S.questComplete(q, prog, profile);
    html += `<div class="logq"><h3>${esc(q.title)} ${ready ? '<span class="ok">✔ Ready</span>' : ''}</h3><p class="small">From ${esc(S.NPCS[q.giver].name)} · Turn in to ${esc(S.NPCS[q.turnIn].name)} (${esc(Rooms.ROOMS[S.NPCS[q.turnIn].room].name)})</p><ul>` +
      q.objs.map((o, i) => { const v = S.objValue(q, i, prog, profile); return `<li class="${v >= o.n ? 'ok' : ''}">${esc(o.label)}: ${Math.min(v, o.n)}/${o.n}</li>`; }).join('') +
      `</ul>${rewardHtml(q.reward)}<button class="btn small-btn" data-ab="${q.id}">Abandon</button></div>`;
  }
  const done = profile.quests.done.map(id => S.QUEST_BY_ID[id]).filter(Boolean);
  if (done.length) html += '<h3>Completed</h3><div class="small">' + done.map(q => '✔ ' + esc(q.title)).join('<br>') + '</div>';
  el.innerHTML = html;
  el.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { if (confirmAb(b)) { send({ t: 'qabandon', id: b.dataset.ab }); delete profile.quests.active[b.dataset.ab]; buildQuestLog(); renderTracker(); refreshCollectibles(); } });
}
function confirmAb(b) { if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = 'Click again to abandon'; return false; }

// ---------------------------------------------------------------- home editing
function startEdit() { if (roomId !== 'home:' + myKey()) return; edit = { sel: null, drag: false, tab: 'box' }; closePanels(); renderEditor(); $('homeEdit').classList.add('show'); }
function stopEdit() { edit = null; $('homeEdit').classList.remove('show'); if (scene) for (const f of scene.furn) f.node.boost = 0; }
function editPointerDown(p) {
  const ray = R3.ray(p.x, p.y, W, H);
  let best = null, bt = 1e9;
  for (const f of scene.furn) { const t = E3.rayBox(ray, f.box); if (t !== null && t < bt) { bt = t; best = f; } }
  if (best) { edit.sel = best.i; edit.drag = true; edit.dragPos = null; }
  else edit.sel = null;
  renderEditor();
}
function renderEditor() {
  if (!edit) return;
  if (scene) for (const f of scene.furn) f.node.boost = f.i === edit.sel ? .6 : 0;
  const el = $('editBody'), tab = edit.tab;
  document.querySelectorAll('#homeEdit .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  let html = '';
  if (edit.sel != null && homeData.items[edit.sel]) {
    const it = homeData.items[edit.sel];
    html += `<div class="selbar">Selected: <b>${esc(S.FURN[it.f][0])}</b> — drag it to move <button class="btn" id="eRot">⟳ Rotate</button><button class="btn" id="eDel">📦 Put away</button><button class="btn" id="eDes">✖</button></div>`;
  }
  if (tab === 'box') {
    const owned = Object.entries(profile.furn || {}).filter(([, n]) => n > 0);
    html += owned.length ? '<div class="frow">' + owned.map(([id, n]) => `<button class="fcard" data-f="${id}"><canvas data-prev="${id}"></canvas><span>${esc(S.FURN[id][0])} ×${n}</span></button>`).join('') + '</div>'
      : '<p class="small">Your furniture box is empty. Buy furniture in the 🛒 Catalog!</p>';
  } else if (tab === 'style') {
    html += '<div class="frow">' + Object.entries(S.HOME_TYPES).map(([id, n]) => `<button class="btn ${homeData.type === id ? 'on' : ''}" data-type="${id}">${id === 'igloo' ? '❄️' : id === 'cabin' ? '🪵' : '🏰'} ${n}</button>`).join('') + '</div>';
  } else if (tab === 'floor') {
    html += '<div class="frow">' + S.FLOORS.map(([n, c], i) => `<button class="swb ${homeData.floor === i ? 'on' : ''}" data-floor="${i}"><i style="background:${c}"></i>${esc(n)}</button>`).join('') + '</div>';
  } else if (tab === 'walls') {
    html += '<div class="frow">' + S.WALLS.map((c, i) => `<button class="sw ${homeData.wall === i ? 'sel' : ''}" data-wall="${i}" style="background:${c}"></button>`).join('') + '</div>';
  }
  el.innerHTML = html;
  el.querySelectorAll('canvas[data-prev]').forEach(c => { c.width = 100; c.height = 100; c.getContext('2d').drawImage(furnPreview(c.dataset.prev), 0, 0, 100, 100); });
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    const n = homeData.items.length, m = me(); let [x, z] = m ? toWorld(m.x, m.y) : [0, 0];
    x = Math.max(-12, Math.min(12, x + ((n % 5) - 2) * 2.6)); z = Math.max(-7, Math.min(7, z - 3 - (Math.floor(n / 5) % 3) * 2.4));
    send({ t: 'hplace', f: b.dataset.f, x, z, r: 0 }); edit.sel = n;
  });
  el.querySelectorAll('[data-type]').forEach(b => b.onclick = () => send({ t: 'hstyle', type: b.dataset.type }));
  el.querySelectorAll('[data-floor]').forEach(b => b.onclick = () => send({ t: 'hstyle', floor: +b.dataset.floor }));
  el.querySelectorAll('[data-wall]').forEach(b => b.onclick = () => send({ t: 'hstyle', wall: +b.dataset.wall }));
  if ($('eRot')) $('eRot').onclick = () => { const it = homeData.items[edit.sel]; send({ t: 'hmove', i: edit.sel, x: it.x, z: it.z, r: (it.r + 1) % 8 }); };
  if ($('eDel')) $('eDel').onclick = () => { send({ t: 'hremove', i: edit.sel }); edit.sel = null; };
  if ($('eDes')) $('eDes').onclick = () => { edit.sel = null; renderEditor(); };
}
document.querySelectorAll('#homeEdit .tab').forEach(b => b.onclick = () => { if (b.dataset.tab === 'cat') { openPanel('furncat'); return; } edit.tab = b.dataset.tab; renderEditor(); });
$('editDone').onclick = stopEdit;
$('editBtn').onclick = () => edit ? stopEdit() : startEdit();

// ---------------------------------------------------------------- previews (3D rendered into little pictures)
const prevCache = new Map();
function snap(roots, eye, target) {
  const c = document.createElement('canvas'); c.width = 200; c.height = 240;
  if (!PR3) return c;
  PR3.env = { ...PR3.env, clear: '#ffffff', fog: '#ffffff', fogNear: 500, fogFar: 900 };
  PR3.setCamera(eye, target, .6);
  PR3.render(roots);
  c.getContext('2d').drawImage(PR3.canvas, 0, 0);
  return c;
}
function puffinPreview(item, color) {
  const key = 'p' + item + color; if (prevCache.has(key)) return prevCache.get(key);
  const m = Models.buildPuffin(color, item); m.root.rot = [0, .45, 0]; Models.posePuffin(m, 0, false, false);
  const c = snap([m.root], [0, 2.3, 7.2], [0, 1.75, 0]); prevCache.set(key, c); return c;
}
function furnPreview(id) {
  const key = 'f' + id; if (prevCache.has(key)) return prevCache.get(key);
  const g = Models.furniture(id); g.rot = [0, .5, 0];
  const s = Math.max(Models.FURN_SIZE[id] || 2, (Models.FURN_H[id] || 2) * .9), h = Models.FURN_H[id] || 2;
  const c = snap([g], [0, h * .55 + s * .9, s * 2.4 + 1.5], [0, h * .45, 0]); prevCache.set(key, c); return c;
}

// ---------------------------------------------------------------- panels
const PANELS = ['map', 'shop', 'bag', 'online', 'emotes', 'furncat', 'questlog', 'npc'];
function closePanels() { for (const id of PANELS) $(id).classList.remove('show'); }
function openPanel(id, refresh) {
  const was = $(id).classList.contains('show');
  if (!refresh) { closePanels(); if (was) return; }
  if (id === 'shop') buildShop(); if (id === 'bag') buildBag(); if (id === 'online') buildOnline(); if (id === 'map') buildMap();
  if (id === 'furncat') buildFurnCat(); if (id === 'questlog') buildQuestLog();
  $(id).classList.add('show');
}
document.querySelectorAll('.close').forEach(b => b.onclick = closePanels);
$('bMap').onclick = () => openPanel('map'); $('bBag').onclick = () => openPanel('bag'); $('bOnline').onclick = () => openPanel('online');
$('bEmote').onclick = () => openPanel('emotes'); $('bQuest').onclick = () => openPanel('questlog');
$('bDance').onclick = toggleDance; $('bThrow').onclick = toggleThrow;
$('camL').onclick = () => rotateCam(-1); $('camR').onclick = () => rotateCam(1);

function card(canvas, title, sub, cls, onclick) {
  const d = document.createElement('div'); d.className = 'card ' + (cls || '');
  const c = document.createElement('canvas'); c.width = 100; c.height = 120; c.getContext('2d').drawImage(canvas, 0, 0, 100, 120); d.appendChild(c);
  d.insertAdjacentHTML('beforeend', `<b>${esc(title)}</b>${sub}`); d.onclick = onclick; return d;
}
function buildShop() {
  const g = $('shopGrid'); g.innerHTML = '';
  for (const [id, [name, price]] of Object.entries(S.ITEMS)) {
    const owned = profile.items.includes(id);
    g.appendChild(card(puffinPreview(id, profile.color), name, owned ? '✅ Owned' : '🪙 ' + price, owned ? 'worn' : '', () => { if (!owned) send({ t: 'buy', item: id }); }));
  }
}
function buildFurnCat() {
  const g = $('furnGrid'); g.innerHTML = '';
  for (const [id, [name, price]] of Object.entries(S.FURN)) {
    const n = (profile.furn || {})[id] || 0;
    g.appendChild(card(furnPreview(id), name, `🪙 ${price}${n ? ` <span class="small">(have ${n})</span>` : ''}`, '', () => send({ t: 'fbuy', id })));
  }
}
function buildBag() {
  const sw = $('bagColors'); sw.innerHTML = '';
  for (const col of S.COLORS) { const s = document.createElement('div'); s.className = 'sw' + (col === profile.color ? ' sel' : ''); s.style.background = col; s.onclick = () => send({ t: 'wear', color: col }); sw.appendChild(s); }
  const g = $('bagGrid'); g.innerHTML = '';
  for (const id of [null, ...profile.items]) g.appendChild(card(puffinPreview(id, profile.color), id ? S.ITEMS[id][0] : 'Nothing', profile.hat === id ? 'Wearing' : 'Wear', profile.hat === id ? 'worn' : '', () => send({ t: 'wear', item: id })));
  if (!profile.items.length) g.insertAdjacentHTML('beforeend', '<div class="small" style="grid-column:1/-1">Buy items at the Gift Shop in Town, or earn them from quests!</div>');
}
function roomLabel(r) { if (isHomeRoom(r)) return '🏠 a home'; const d = Rooms.ROOMS[r]; return d ? d.emoji + ' ' + d.name : ''; }
function buildOnline() {
  const el = $('onlineList'); el.innerHTML = '';
  for (const o of onlineList) {
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<span>${o.id === myId ? '⭐' : '🐦'} <b></b> <span class="lv">Lv ${o.lvl || 1}</span> — ${roomLabel(o.room)}</span><span class="btns"></span>`;
    r.querySelector('b').textContent = o.name;
    const bs = r.querySelector('.btns');
    if (o.id !== myId && o.room !== roomId) { const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Go there'; b.onclick = () => { closePanels(); enterRoom(o.room); }; bs.appendChild(b); }
    const h = document.createElement('button'); h.className = 'btn'; h.textContent = o.id === myId ? '🏠 My home' : '🏠 Visit home';
    h.onclick = () => { closePanels(); enterRoom('home:' + o.name.toLowerCase()); }; bs.appendChild(h);
    el.appendChild(r);
  }
}
function buildMap() {
  const el = $('mapList'); el.innerHTML = '';
  const add = (id, label, sub) => { const b = document.createElement('button'); b.innerHTML = `${label}<br><span class="small">${sub}</span>`; b.onclick = () => { closePanels(); if (id !== roomId) enterRoom(id); }; el.appendChild(b); };
  add('@home', '🏠 My Home', 'decorate it!');
  for (const id of S.PUBLIC_ROOMS) { const R = Rooms.ROOMS[id]; add(id, `${R.emoji} ${R.name}`, `${onlineList.filter(o => o.room === id).length} here`); }
}
(function buildEmotes() {
  const g = $('emoteGrid');
  for (const e of ['😀', '😂', '😍', '😮', '😢', '😡', '❤️', '⭐', '🐟', '☕', '👋', '🎉']) {
    const b = document.createElement('button'); b.textContent = e;
    b.onclick = () => { send({ t: 'emote', e }); closePanels(); const m = me(); if (m) { m.emote = e; m.emoteT = performance.now(); m.chat = null; } };
    g.appendChild(b);
  }
})();
function setHudVisible(v) {
  $('hud').classList.toggle('hidden', !v);
  for (const id of ['coins', 'xpbar', 'camL', 'camR']) $(id).style.display = v ? '' : 'none';
  if (v) { renderTracker(); $('editBtn').style.display = roomId === 'home:' + myKey() ? 'block' : 'none'; }
  else { $('tracker').style.display = 'none'; $('editBtn').style.display = 'none'; $('homeEdit').classList.remove('show'); }
}

// ---------------------------------------------------------------- login
function showLogin() { $('login').classList.add('show'); setHudVisible(false); $('play').disabled = false; }
(function buildLoginColors() {
  const el = $('loginColors');
  S.COLORS.forEach((col, i) => {
    const s = document.createElement('div'); s.className = 'sw' + (i === 0 ? ' sel' : ''); s.style.background = col;
    s.onclick = () => { loginColor = col; el.querySelectorAll('.sw').forEach(x => x.classList.remove('sel')); s.classList.add('sel'); };
    el.appendChild(s);
  });
  $('name').value = load('pi_name') || '';
})();
$('play').onclick = () => {
  $('err').textContent = '';
  if (!R3) { $('err').textContent = 'Your browser does not support 3D graphics (WebGL).'; return; }
  const name = $('name').value.trim(), password = $('pw').value;
  if (name.length < 2) { $('err').textContent = 'Type a name (2+ letters).'; return; }
  if (password.length < 3) { $('err').textContent = 'Type a password (3+ characters).'; return; }
  creds = { name, password, color: loginColor }; kicked = false;
  $('play').disabled = true;
  if (ws) { ws.onclose = null; ws.close(); }
  connect();
};
$('pw').addEventListener('keydown', e => { if (e.key === 'Enter') $('play').click(); });
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') $('pw').focus(); });
setHudVisible(false);

// ---------------------------------------------------------------- overlay drawing
function wrapText(c, s, maxW) {
  const words = s.split(' '), lines = []; let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line); return lines.slice(0, 4);
}
function drawBubble(c, x, y, text, big) {
  c.font = big ? '34px serif' : 'bold 14px "Trebuchet MS", Arial';
  const lines = big ? [text] : wrapText(c, text, 170);
  const lh = big ? 38 : 18, w = big ? 60 : Math.max(40, ...lines.map(l => c.measureText(l).width)) + 20, h = lines.length * lh + 12;
  const bx = Math.max(4, Math.min(W - w - 4, x - w / 2)), by = Math.max(4, y - h);
  c.fillStyle = '#fff'; c.strokeStyle = '#12324f'; c.lineWidth = 2;
  rr(c, bx, by, w, h, 12); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 7, by + h - 1); c.lineTo(x, by + h + 9); c.lineTo(x + 7, by + h - 1); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x - 7, by + h); c.lineTo(x, by + h + 9); c.lineTo(x + 7, by + h); c.stroke();
  c.fillStyle = '#12324f'; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((l, i) => c.fillText(l, bx + w / 2, by + 6 + lh / 2 + i * lh));
}
const flakes = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.5, s: 20 + Math.random() * 40 }));
function drawFlakes(dt) {
  octx.fillStyle = 'rgba(255,255,255,.85)';
  for (const f of flakes) { f.y += f.s * dt; f.x += Math.sin(f.y / 40) * .3; if (f.y > H) { f.y = -5; f.x = Math.random() * W; } circle(octx, f.x, f.y, f.r); octx.fill(); }
}
const proj = p => R3.project(p, W, H);

// ---------------------------------------------------------------- main loop
let last = performance.now(), loginScene = null;
function frame(now) {
  const dt = Math.min(game ? .05 : .12, (now - last) / 1000); last = now;
  const t = now / 1000; nowSec = t;
  octx.clearRect(0, 0, W, H);
  if (game) { gameFrame(octx, dt, t); requestAnimationFrame(frame); return; }
  if (!R3) { requestAnimationFrame(frame); return; }

  let sc = scene;
  if (!sc) {
    if (!loginScene) loginScene = buildScene('town');
    sc = loginScene; cam.tyaw = Math.sin(t * .15) * .6;
  }
  // camera
  cam.yaw += (cam.tyaw - cam.yaw) * Math.min(1, dt * 6); cam.dist += (cam.tdist - cam.dist) * Math.min(1, dt * 6);
  const m = me();
  if (m && scene) { const [mx, mz] = toWorld(m.x, m.y); cam.tx += (mx * .35 - cam.tx) * Math.min(1, dt * 3); cam.tz += (1 + mz * .2 - cam.tz) * Math.min(1, dt * 3); }
  const target = [cam.tx, 2.2, cam.tz];
  const eye = [target[0] + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, target[1] + Math.sin(cam.pitch) * cam.dist, target[2] + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist];
  R3.env = { ...R3.env, ...sc.def.env };
  R3.setCamera(eye, target);

  // animate scene
  for (const a of sc.anim) a(t);
  for (const c of sc.collect || []) c.node.anim(t);
  for (const n of sc.npcs) {
    Models.posePuffin(n.model, t + n.npc.x, false, false);
    if (m) { const [mx, mz] = toWorld(m.x, m.y); const d = Math.hypot(mx - n.npc.x, mz - n.npc.z); const want = d < 8 ? Math.atan2(mx - n.npc.x, mz - n.npc.z) : 0; n.model.root.rot[1] += (want - n.model.root.rot[1]) * Math.min(1, dt * 4); }
  }
  for (const h of sc.hot) for (const nd of h.nodes) nd.boost = h === hover ? .5 : 0;
  if (edit && scene) for (const f of scene.furn) f.node.boost = f.i === edit.sel ? .6 : 0;

  // players
  const roots = [sc.root, fxRoot];
  if (scene) {
    for (const p of players.values()) {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d > 2) { const step = Math.min(d, 190 * dt); p.x += dx / d * step; p.y += dy / d * step; p.moving = true; p.wantAng = Math.atan2(dx, dy); }
      else { p.x = p.tx; p.y = p.ty; p.moving = false; }
      if (p.wantAng !== undefined) { let da = p.wantAng - p.ang; while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI; p.ang += da * Math.min(1, dt * 10); }
      const key = p.color + '|' + p.hat;
      if (p.mkey !== key) { p.model = Models.buildPuffin(p.color, p.hat); p.mkey = key; }
      const [X, Z] = toWorld(p.x, p.y);
      p.model.root.pos = [X, 0, Z]; p.model.root.rot = [0, p.ang, 0];
      Models.posePuffin(p.model, t + p.id, p.moving, p.dancing, p.emote === '😵' && performance.now() - p.emoteT < 800);
      roots.push(p.model.root);
    }
    if (m && pending && !m.moving) arrived();
    // collectibles pickup
    if (m) { const [mx, mz] = toWorld(m.x, m.y); for (const c of scene.collect) if (Math.hypot(mx - c.x, mz - c.z) < 1.4) { questEvent('collect', c.id); toast(`Found: ${S.COLLECT_NAMES[S.COLLECT[c.id].item]}!`); break; } }
    // dance quest
    const dz = scene.def.dance;
    if (m && m.dancing && dz) { const [mx, mz] = toWorld(m.x, m.y); if (mx > dz[0] && mx < dz[1] && mz > dz[2] && mz < dz[3]) { danceAcc += dt; if (danceAcc >= 1) { danceAcc -= 1; questEvent('dance'); } } }
  }
  stepFx(now);
  if (lvlFx) { const k = (now - lvlFx.t0) / 1500; if (k >= 1) { fxRoot.remove(lvlFx.ring); fxRoot.remove(lvlFx.pillar); lvlFx = null; } else { const s = 1 + k * 4; lvlFx.ring.scl = [s, 1, s]; lvlFx.ring.alpha = 1 - k; lvlFx.pillar.alpha = .35 * (1 - k); } }
  R3.render(roots);

  // ----- 2D overlay -----
  if (scene) {
    const sorted = [...players.values()].sort((a, b) => a.y - b.y);
    for (const p of sorted) {
      const [X, Z] = toWorld(p.x, p.y), s = proj([X, 0, Z]); if (!s) continue;
      txt(octx, p.name, s[0], s[1] + 14, 14, p.id === myId ? '#ffe14f' : '#fff');
      txt(octx, `Lv ${p.lvl || 1}`, s[0], s[1] + 30, 11, '#bfe6ff');
    }
    for (const n of scene.npcs) {
      const s = proj([n.npc.x, 0, n.npc.z]); if (s) txt(octx, n.npc.name, s[0], s[1] + 14, 14, '#7dff6a');
      const mk = npcMarker(n.id), h = proj([n.npc.x, 3.6 + (n.npc.hat ? .5 : 0), n.npc.z]);
      if (mk && h) txt(octx, mk[0], h[0], h[1] - 18 + Math.sin(t * 4) * 4, 40, mk[1], '#4a3500');
    }
    const nowMs = performance.now();
    for (const p of sorted) {
      const [X, Z] = toWorld(p.x, p.y), s = proj([X, 3.3 + (p.hat ? .5 : 0), Z]); if (!s) continue;
      if (p.chat && nowMs - p.chatT < 7000) drawBubble(octx, s[0], s[1] - 6, p.chat, false);
      else if (p.emote && nowMs - p.emoteT < 4000) drawBubble(octx, s[0], s[1] - 6, p.emote, true);
    }
    if (hover) {
      const b = hover.box, s = proj([(b[0] + b[3]) / 2, b[4] + .3, (b[2] + b[5]) / 2]);
      if (s) txt(octx, hover.label, Math.max(90, Math.min(870, s[0])), Math.max(20, s[1] - 10), 17, '#ffe14f');
    }
    if (sc.def.outdoor) drawFlakes(dt);
    const title = isHomeRoom(roomId) ? `🏠 ${homeData ? homeData.owner : ''}'s ${S.HOME_TYPES[homeData && homeData.type] || 'Home'}` : `${sc.def.emoji} ${sc.def.name}`;
    txt(octx, title, 14, 24, 20, '#fff', '#12324f', 'left');
    if (edit) txt(octx, 'EDIT MODE — click furniture to select, drag to move', 480, 60, 16, '#ffe14f');
    if (qmsg) { const k = (nowMs - qmsg.t0) / 3000; if (k > 1) qmsg = null; else { octx.globalAlpha = Math.min(1, (1 - k) * 3); txt(octx, qmsg.text, 480, 110, 22, '#ffd23f', '#3a2a00'); octx.globalAlpha = 1; } }
    if (banner) { const k = (nowMs - banner.t0) / 4000; if (k > 1) banner = null; else { octx.globalAlpha = Math.min(1, (1 - k) * 3); txt(octx, banner.text, 480, 170, 26, banner.color, '#1a1a1a'); octx.globalAlpha = 1; } }
    if (lvlBanner) { const k = (nowMs - lvlBanner.t0) / 4500; if (k > 1) lvlBanner = null; else { octx.globalAlpha = Math.min(1, (1 - k) * 3); txt(octx, lvlBanner.text, 480, 215, 30, lvlBanner.color, '#1a1a1a'); octx.globalAlpha = 1; } }
  } else {
    drawFlakes(dt);
    if (reconnecting) txt(octx, 'Reconnecting…', 480, 300, 30);
    else if (myId !== null) txt(octx, 'Waddling over…', 480, 300, 30);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
