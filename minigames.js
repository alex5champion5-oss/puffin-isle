// =====================================================================
//  Puffin Isle — 2D minigames (Sled Race, Ice Fishing, Cocoa Catch)
// =====================================================================
const W = 960, H = 600;
let game = null;
// ---------------------------------------------------------------- helpers
function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function txt(c, s, x, y, size = 16, color = '#fff', outline = '#12324f', align = 'center') {
  c.font = `bold ${size}px "Trebuchet MS", Arial, sans-serif`;
  c.textAlign = align; c.textBaseline = 'middle';
  if (outline) { c.lineWidth = 4; c.strokeStyle = outline; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y);
}
// ---------------------------------------------------------------- avatar
function drawItem(c, item, t) {
  switch (item) {
    case 'partyhat':
      c.fillStyle = '#ff4fa3'; c.beginPath(); c.moveTo(-13, -78); c.lineTo(13, -78); c.lineTo(1, -114); c.closePath(); c.fill();
      c.strokeStyle = '#ffe14f'; c.lineWidth = 3; c.beginPath(); c.moveTo(-9, -88); c.lineTo(9, -90); c.moveTo(-5, -100); c.lineTo(6, -101); c.stroke();
      c.fillStyle = '#ffe14f'; circle(c, 1, -115, 5); c.fill(); break;
    case 'beanie':
      c.fillStyle = '#3aa7ff'; c.beginPath(); c.arc(0, -72, 19, Math.PI, 0); c.fill();
      c.fillStyle = '#fff'; rr(c, -20, -76, 40, 9, 4); c.fill(); circle(c, 0, -93, 6); c.fill(); break;
    case 'flower':
      c.fillStyle = '#ff7eb6'; for (let i = 0; i < 5; i++) { const a = i * 1.2566 + t; circle(c, -8 + Math.cos(a) * 6, -82 + Math.sin(a) * 6, 5); c.fill(); }
      c.fillStyle = '#ffd23f'; circle(c, -8, -82, 4); c.fill(); break;
    case 'headphones':
      c.strokeStyle = '#333'; c.lineWidth = 5; c.beginPath(); c.arc(0, -64, 21, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.fillStyle = '#e74c3c'; rr(c, -24, -72, 9, 16, 4); c.fill(); rr(c, 15, -72, 9, 16, 4); c.fill(); break;
    case 'propeller':
      c.fillStyle = '#e74c3c'; c.beginPath(); c.arc(0, -72, 19, Math.PI, Math.PI * 1.5); c.lineTo(0, -72); c.fill();
      c.fillStyle = '#3aa7ff'; c.beginPath(); c.arc(0, -72, 19, Math.PI * 1.5, 0); c.lineTo(0, -72); c.fill();
      c.fillStyle = '#ffd23f'; rr(c, -1.5, -98, 3, 8, 1); c.fill();
      c.fillStyle = '#2fa84f'; ell(c, 0, -98, Math.abs(Math.cos(t * 18)) * 18 + 2, 3); c.fill(); break;
    case 'tophat':
      c.fillStyle = '#1b1b24'; ell(c, 0, -79, 23, 5); c.fill(); rr(c, -13, -110, 26, 31, 3); c.fill();
      c.fillStyle = '#d43b3b'; c.fillRect(-13, -88, 26, 5); break;
    case 'viking':
      c.fillStyle = '#f3efe0'; c.beginPath(); c.moveTo(-16, -80); c.quadraticCurveTo(-34, -86, -30, -108); c.quadraticCurveTo(-24, -90, -12, -88); c.fill();
      c.beginPath(); c.moveTo(16, -80); c.quadraticCurveTo(34, -86, 30, -108); c.quadraticCurveTo(24, -90, 12, -88); c.fill();
      c.fillStyle = '#9aa4ad'; c.beginPath(); c.arc(0, -72, 19, Math.PI, 0); c.fill();
      c.fillStyle = '#c9a23a'; c.fillRect(-19, -76, 38, 6); break;
    case 'crown':
      c.fillStyle = '#f2c12e'; c.beginPath(); c.moveTo(-15, -78); c.lineTo(-17, -100); c.lineTo(-8, -89); c.lineTo(0, -104); c.lineTo(8, -89); c.lineTo(17, -100); c.lineTo(15, -78); c.closePath(); c.fill();
      c.fillStyle = '#d43b3b'; circle(c, 0, -86, 3); c.fill(); c.fillStyle = '#3aa7ff'; circle(c, -9, -84, 2.5); c.fill(); circle(c, 9, -84, 2.5); c.fill(); break;
    case 'sunglasses':
      c.fillStyle = '#111'; rr(c, 2, -72, 14, 9, 4); c.fill(); c.fillRect(-16, -70, 20, 3);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(5, -70, 4, 2); break;
    case 'scarf':
      c.fillStyle = '#d43b3b'; rr(c, -19, -52, 38, 10, 5); c.fill(); rr(c, -16, -46, 10, 22, 4); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-16, -32, 10, 3); break;
    case 'bowtie':
      c.fillStyle = '#d43b3b'; c.beginPath(); c.moveTo(6, -48); c.lineTo(-5, -54); c.lineTo(-5, -42); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(6, -48); c.lineTo(17, -54); c.lineTo(17, -42); c.closePath(); c.fill();
      circle(c, 6, -48, 3); c.fill(); break;
  }
}

function drawPuffin(c, x, y, color, item, dir, t, moving, dancing, scale = 1) {
  c.save(); c.translate(x, y); c.scale(scale, scale);
  c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, 0, 0, 24, 7); c.fill();
  let bob = 0, rot = 0;
  if (moving) { bob = -Math.abs(Math.sin(t * 12)) * 3; rot = Math.sin(t * 12) * 0.06; }
  if (dancing) { bob = -Math.abs(Math.sin(t * 8)) * 10; rot = Math.sin(t * 8) * 0.25; }
  c.translate(0, bob); c.rotate(rot);
  if (dir < 0) c.scale(-1, 1);
  // feet
  c.fillStyle = '#ff8a1f'; ell(c, -9, -2, 8, 4); c.fill(); ell(c, 9, -2, 8, 4); c.fill();
  // body + belly
  c.fillStyle = color; ell(c, 0, -32, 22, 30); c.fill();
  c.fillStyle = '#fff'; ell(c, 5, -28, 14, 21); c.fill();
  // wing
  c.fillStyle = shade(color, -35); c.save(); c.translate(-12, -36); c.rotate(dancing ? Math.sin(t * 8) * 0.8 : 0.15); ell(c, 0, 0, 7, 17); c.fill(); c.restore();
  // head + face
  c.fillStyle = color; circle(c, 0, -64, 18); c.fill();
  c.fillStyle = '#fff'; ell(c, 6, -63, 12, 11); c.fill();
  // eye
  c.fillStyle = '#222'; circle(c, 8, -67, 3); c.fill();
  c.fillStyle = '#fff'; circle(c, 9, -68, 1.1); c.fill();
  // beak (big striped puffin beak)
  c.fillStyle = '#ff5a1f'; c.beginPath(); c.moveTo(14, -71); c.quadraticCurveTo(34, -64, 15, -54); c.closePath(); c.fill();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(14, -71); c.quadraticCurveTo(21, -68, 20, -63); c.quadraticCurveTo(20, -58, 15, -54); c.closePath(); c.fill();
  c.strokeStyle = '#a33a0c'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(19, -63); c.lineTo(28, -63); c.stroke();
  if (item) drawItem(c, item, t);
  c.restore();
}

function tree(c, x, y, s = 1) {
  c.fillStyle = '#6b3f1f'; c.fillRect(x - 5 * s, y - 14 * s, 10 * s, 14 * s);
  c.fillStyle = '#2e8b57';
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - (34 - i * 8) * s, y - (12 + i * 26) * s); c.lineTo(x + (34 - i * 8) * s, y - (12 + i * 26) * s); c.lineTo(x, y - (52 + i * 26) * s); c.fill(); }
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 12 * s, y - 96 * s); c.lineTo(x + 12 * s, y - 96 * s); c.lineTo(x, y - 116 * s); c.fill();
}
function interior(c, wall, floor, floorLine) {
  c.fillStyle = wall; c.fillRect(0, 0, W, 270);
  c.fillStyle = shade(wall, -30); c.fillRect(0, 255, W, 15);
  c.fillStyle = floor; c.fillRect(0, 270, W, H - 270);
  c.strokeStyle = floorLine; c.lineWidth = 2;
  for (let y = 300; y < H; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
}
// ---------------------------------------------------------------- minigames
function startGame(kind) {
  closePanels();
  game = GAMES[kind](); game.kind = kind; game.state = 'intro';
  setHudVisible(false);
}
function finishGame() {
  const g = game;
  if (g.coins > 0) send({ t: 'earn', game: g.kind, coins: g.coins });
  if (typeof onGameFinished === 'function') onGameFinished(g.kind, g.score());
  game = null; keys.clear();
  setHudVisible(true);
}
function gameFrame(c, dt, t) {
  const g = game;
  if (g.state === 'play') { g.update(dt, t); if (g.lives <= 0 || g.done) { g.state = 'over'; g.overAt = t; } }
  g.draw(c, t);
  txt(c, g.hudText(), 14, 24, 20, '#fff', '#12324f', 'left');
  txt(c, '❤️'.repeat(Math.max(0, g.lives)), W - 14, 24, 20, '#fff', null, 'right');
  if (g.state === 'intro' || g.state === 'over') {
    c.fillStyle = 'rgba(10,30,60,.65)'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#f3f9ff'; rr(c, 230, 140, 500, 300, 24); c.fill(); c.strokeStyle = '#1f5fa8'; c.lineWidth = 6; c.stroke();
    if (g.state === 'intro') {
      txt(c, g.title, 480, 195, 38, '#1f5fa8', '#bfe0ff');
      g.help.forEach((line, i) => txt(c, line, 480, 250 + i * 30, 18, '#12324f', null));
      txt(c, 'Click to start!', 480, 400, 26, '#2fa84f', '#fff');
    } else {
      txt(c, 'Game Over!', 480, 195, 40, '#1f5fa8', '#bfe0ff');
      txt(c, g.hudText(), 480, 260, 22, '#12324f', null);
      txt(c, `You earned 🪙 ${g.coins} coins`, 480, 310, 28, '#a6750a', null);
      txt(c, t - g.overAt > 0.8 ? 'Click to collect & go back' : '…', 480, 395, 22, '#2fa84f', '#fff');
    }
  }
}
function gameClick(g, t) {
  if (g.state === 'intro') { g.state = 'play'; return true; }
  if (g.state === 'over' && t - g.overAt > 0.8) { finishGame(); return true; }
  return g.state !== 'play';
}
let nowSec = 0;
function steer(g, dt, speed = 520) {
  if (keys.has('arrowleft') || keys.has('a')) { g.px -= speed * dt; g.usePointer = false; }
  if (keys.has('arrowright') || keys.has('d')) { g.px += speed * dt; g.usePointer = false; }
  if (g.usePointer) g.px += (g.pointerX - g.px) * Math.min(1, dt * 10);
  g.px = Math.max(40, Math.min(920, g.px));
}

const GAMES = {
  // ---- Sled Race: dodge trees and rocks, grab fish
  sled() {
    return {
      title: '🛷 Sled Race', help: ['Steer with ← → or your mouse.', 'Dodge trees and rocks.', 'Grab 🐟 for bonus coins!'],
      px: 480, pointerX: 480, usePointer: true, speed: 260, dist: 0, fish: 0, lives: 3, things: [], spawn: 0, hurt: 0, coins: 0,
      hudText() { return `Distance: ${Math.floor(this.dist / 10)} m   🐟 ${this.fish}`; },
      score() { return Math.floor(this.dist / 10); },
      pointer(x) { this.pointerX = x; this.usePointer = true; },
      click() { gameClick(this, nowSec); },
      update(dt) {
        steer(this, dt);
        this.speed = Math.min(700, this.speed + 12 * dt);
        this.dist += this.speed * dt;
        this.spawn -= dt;
        if (this.spawn <= 0) {
          this.spawn = Math.max(0.25, 0.8 - this.dist / 30000);
          const r = Math.random();
          this.things.push({ x: 40 + Math.random() * 880, y: H + 60, kind: r < 0.18 ? 'fish' : r < 0.6 ? 'tree' : 'rock' });
        }
        this.hurt = Math.max(0, this.hurt - dt);
        for (const o of this.things) {
          o.y -= this.speed * dt;
          const dx = o.x - this.px, dy = (o.y - 20) - 150;
          const rad = o.kind === 'fish' ? 34 : o.kind === 'tree' ? 34 : 30;
          if (!o.hit && dx * dx + dy * dy < rad * rad) {
            o.hit = true;
            if (o.kind === 'fish') { this.fish++; o.gone = true; }
            else if (this.hurt <= 0) { this.lives--; this.hurt = 1.2; }
          }
        }
        this.things = this.things.filter(o => o.y > -140 && !o.gone);
        this.coins = Math.min(60, Math.floor(this.dist / 600) + this.fish * 2);
      },
      draw(c, t) {
        c.fillStyle = '#f4faff'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#dcecf9'; c.lineWidth = 3;
        for (let i = 0; i < 12; i++) { const y = (i * 60 - this.dist * 0.5) % H; const yy = y < 0 ? y + H : y; c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy + 30); c.stroke(); }
        const sorted = [...this.things].sort((a, b) => a.y - b.y);
        for (const o of sorted) {
          if (o.kind === 'tree') tree(c, o.x, o.y, .75);
          else if (o.kind === 'rock') { c.fillStyle = '#8a96a3'; ell(c, o.x, o.y - 12, 30, 20); c.fill(); c.fillStyle = '#fff'; ell(c, o.x - 6, o.y - 26, 16, 6); c.fill(); }
          else { c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🐟', o.x, o.y - 18); }
        }
        if (this.hurt > 0 && Math.floor(t * 12) % 2) return;
        c.fillStyle = '#d43b3b'; rr(c, this.px - 30, 150, 60, 16, 8); c.fill();
        c.fillStyle = '#a32020'; c.fillRect(this.px - 26, 166, 52, 4);
        drawPuffin(c, this.px, 158, profile.color, profile.hat, 1, t, false, false, 0.8);
      },
    };
  },
  // ---- Ice Fishing: hook fish, avoid jellyfish
  fish() {
    return {
      title: '🎣 Ice Fishing', help: ['Move your hook up and down (mouse or ↑ ↓).', 'Touch a fish, then reel it up to the hole.', 'Avoid the jellyfish! You have 60 seconds.'],
      hookY: 250, pointerY: 250, lives: 3, caught: 0, fish: [], hooked: null, spawn: 0, time: 60, hurt: 0, coins: 0,
      hudText() { return `🐟 Caught: ${this.caught}   ⏱️ ${Math.ceil(this.time)}s`; },
      score() { return this.caught; },
      pointer(x, y) { this.pointerY = y; this.usePointer = true; },
      click() { gameClick(this, nowSec); },
      update(dt) {
        if (keys.has('arrowup') || keys.has('w')) { this.pointerY -= 400 * dt; }
        if (keys.has('arrowdown') || keys.has('s')) { this.pointerY += 400 * dt; }
        this.pointerY = Math.max(140, Math.min(570, this.pointerY));
        this.hookY += (this.pointerY - this.hookY) * Math.min(1, dt * 6);
        this.time -= dt; if (this.time <= 0) this.done = true;
        this.hurt = Math.max(0, this.hurt - dt);
        this.spawn -= dt;
        if (this.spawn <= 0) {
          this.spawn = 0.7 + Math.random() * 0.6;
          const left = Math.random() < 0.5, jelly = Math.random() < 0.3;
          this.fish.push({ x: left ? -40 : W + 40, y: 200 + Math.random() * 360, vx: (left ? 1 : -1) * (80 + Math.random() * 120 + (60 - this.time) * 2), jelly });
        }
        for (const f of this.fish) {
          f.x += f.vx * dt; if (f.jelly) f.y += Math.sin(nowSec * 3 + f.x / 50) * 0.6;
          const dx = f.x - 480, dy = f.y - this.hookY;
          if (dx * dx + dy * dy < 30 * 30) {
            if (f.jelly) { if (this.hurt <= 0) { this.lives--; this.hurt = 1; this.hooked = null; } }
            else if (!this.hooked) { this.hooked = f; f.gone = true; }
          }
        }
        this.fish = this.fish.filter(f => !f.gone && f.x > -80 && f.x < W + 80);
        if (this.hooked && this.hookY < 165) { this.caught++; this.hooked = null; }
        this.coins = Math.min(60, this.caught * 3);
      },
      draw(c, t) {
        const g = c.createLinearGradient(0, 120, 0, H); g.addColorStop(0, '#5fb1ec'); g.addColorStop(1, '#0f3e73');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#eaf6ff'; c.fillRect(0, 0, W, 130); c.fillStyle = '#cfe8fa'; c.fillRect(0, 118, W, 12);
        c.fillStyle = '#0f3e73'; ell(c, 480, 124, 34, 8); c.fill();
        c.fillStyle = 'rgba(255,255,255,.15)'; for (let i = 0; i < 6; i++) { ell(c, (i * 180 + t * 10) % 1000, 200 + i * 60, 60, 4); c.fill(); }
        drawPuffin(c, 420, 122, profile.color, profile.hat, 1, t, false, false, .9);
        c.strokeStyle = '#6b3f1f'; c.lineWidth = 4; c.beginPath(); c.moveTo(430, 80); c.lineTo(480, 40); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(480, 40); c.lineTo(480, this.hookY); c.stroke();
        c.strokeStyle = '#ccc'; c.lineWidth = 3; c.beginPath(); c.arc(480, this.hookY, 8, 0, Math.PI); c.stroke();
        c.font = '38px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const f of this.fish) {
          c.save(); c.translate(f.x, f.y); if (f.vx > 0 && !f.jelly) c.scale(-1, 1);
          c.fillText(f.jelly ? '🪼' : '🐟', 0, 0); c.restore();
        }
        if (this.hooked) { c.save(); c.translate(480, this.hookY + 18); c.rotate(-Math.PI / 2); c.fillText('🐟', 0, 0); c.restore(); }
        if (this.hurt > 0) { c.fillStyle = `rgba(255,0,0,${this.hurt * .25})`; c.fillRect(0, 0, W, H); }
      },
    };
  },
  // ---- Cocoa Catch: catch mugs, avoid snowballs
  catch() {
    return {
      title: '☕ Cocoa Catch', help: ['Move with ← → or your mouse.', 'Catch the cocoa mugs on your tray.', "Dropping a mug or catching a ❄️ costs a heart."],
      px: 480, pointerX: 480, usePointer: true, lives: 5, caught: 0, items: [], spawn: 0, speed: 160, hurt: 0, coins: 0,
      hudText() { return `☕ Caught: ${this.caught}`; },
      score() { return this.caught; },
      pointer(x) { this.pointerX = x; this.usePointer = true; },
      click() { gameClick(this, nowSec); },
      update(dt) {
        steer(this, dt, 600);
        this.speed = Math.min(520, this.speed + 6 * dt);
        this.hurt = Math.max(0, this.hurt - dt);
        this.spawn -= dt;
        if (this.spawn <= 0) {
          this.spawn = Math.max(0.35, 1.1 - this.caught * 0.015);
          this.items.push({ x: 60 + Math.random() * 840, y: -30, bad: Math.random() < 0.25, spin: Math.random() * 6 });
        }
        for (const o of this.items) {
          o.y += this.speed * dt * (o.bad ? 1.2 : 1);
          if (!o.done && o.y > 440 && o.y < 470 && Math.abs(o.x - this.px) < 55) {
            o.done = true;
            if (o.bad) { this.lives--; this.hurt = .8; } else this.caught++;
          }
          if (!o.done && o.y > H + 20) { o.done = true; if (!o.bad) { this.lives--; this.hurt = .8; } }
        }
        this.items = this.items.filter(o => !o.done);
        this.coins = Math.min(60, this.caught);
      },
      draw(c, t) {
        interior(c, '#d9a066', '#a8683a', '#8c5530');
        c.font = '36px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const o of this.items) {
          if (o.bad) { c.fillStyle = '#fff'; circle(c, o.x, o.y, 15); c.fill(); c.strokeStyle = '#9cc4ec'; c.lineWidth = 2; c.stroke(); }
          else c.fillText('☕', o.x, o.y);
        }
        if (this.hurt > 0 && Math.floor(t * 12) % 2) return;
        drawPuffin(c, this.px, 560, profile.color, profile.hat, 1, t, false, false, 1.1);
        c.fillStyle = '#c0c6cc'; rr(c, this.px - 60, 455, 120, 12, 6); c.fill();
        c.fillStyle = '#9aa4ad'; c.fillRect(this.px - 4, 467, 8, 20);
      },
    };
  },
};
