// =====================================================================
//  Puffin Isle — 3D models: puffins, wearables, furniture, scenery
// =====================================================================
(function (root) {
  const { N, Grp, GEO, textTex, paintTex } = E3;
  const PI = Math.PI;

  function shadeHex(hex, amt) {
    const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, v + amt));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ---------------------------------------------------------------- wearables (relative to head centre)
  function hatNode(item) {
    const g = Grp(null); g.anim = null;
    switch (item) {
      case 'partyhat':
        N(g, GEO.cone, '#ff4fa3', [0, .88, 0], [.34, .72, .34]);
        N(g, GEO.torusThin, '#ffe14f', [0, .7, 0], [.25, .5, .25]); N(g, GEO.torusThin, '#ffe14f', [0, .95, 0], [.15, .5, .15]);
        N(g, GEO.sphere, '#ffe14f', [0, 1.26, 0], .1); break;
      case 'beanie':
        N(g, GEO.sphere, '#3aa7ff', [0, .32, 0], [.6, .42, .6]);
        N(g, GEO.cyl, '#ffffff', [0, .24, 0], [.61, .13, .61]);
        N(g, GEO.sphere, '#ffffff', [0, .78, 0], .15); break;
      case 'flower':
        for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; N(g, GEO.sphere, '#ff7eb6', [-.36 + Math.cos(a) * .12, .5 + Math.sin(a) * .12, .22], [.09, .09, .05]); }
        N(g, GEO.sphere, '#ffd23f', [-.36, .5, .25], .07); break;
      case 'headphones':
        N(g, GEO.halfTorus, '#333333', [0, .02, 0], [.62, .62, .62], [-PI / 2, 0, 0]);
        N(g, GEO.cyl, '#e74c3c', [.6, 0, 0], [.19, .13, .19], [0, 0, PI / 2]); N(g, GEO.cyl, '#e74c3c', [-.6, 0, 0], [.19, .13, .19], [0, 0, PI / 2]); break;
      case 'propeller': {
        N(g, GEO.sphere, '#e74c3c', [0, .3, 0], [.59, .4, .59]);
        N(g, GEO.box, '#3aa7ff', [0, .66, 0], [.06, .06, .06]);
        N(g, GEO.cyl, '#ffd23f', [0, .75, 0], [.04, .2, .04]);
        const spin = Grp(g, [0, .86, 0]); N(spin, GEO.box, '#2fa84f', [0, 0, 0], [1, .03, .14]); N(spin, GEO.sphere, '#ffd23f', [0, 0, 0], .06);
        g.anim = (t) => { spin.rot[1] = t * 14; }; break;
      }
      case 'tophat':
        N(g, GEO.cyl, '#1b1b24', [0, .46, 0], [.66, .05, .66]);
        N(g, GEO.cyl, '#1b1b24', [0, .82, 0], [.4, .7, .4]);
        N(g, GEO.cyl, '#d43b3b', [0, .58, 0], [.41, .13, .41]); break;
      case 'viking':
        N(g, GEO.sphere, '#9aa4ad', [0, .25, 0], [.6, .47, .6]);
        N(g, GEO.cyl, '#c9a23a', [0, .14, 0], [.61, .1, .61]);
        N(g, GEO.cone, '#f3efe0', [-.6, .55, 0], [.11, .5, .11], [0, 0, .75]); N(g, GEO.cone, '#f3efe0', [.6, .55, 0], [.11, .5, .11], [0, 0, -.75]); break;
      case 'crown':
        N(g, GEO.cyl, '#f2c12e', [0, .56, 0], [.42, .22, .42]);
        for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; N(g, GEO.cone, '#f2c12e', [Math.cos(a) * .38, .8, Math.sin(a) * .38], [.08, .26, .08]); }
        N(g, GEO.sphere, '#d43b3b', [0, .56, .42], .08); N(g, GEO.sphere, '#3aa7ff', [.3, .56, .3], .06); N(g, GEO.sphere, '#3aa7ff', [-.3, .56, .3], .06); break;
      case 'sunglasses':
        N(g, GEO.box, '#111111', [.2, .08, .52], [.27, .17, .06]); N(g, GEO.box, '#111111', [-.2, .08, .52], [.27, .17, .06]);
        N(g, GEO.box, '#111111', [0, .12, .54], [.16, .03, .03]);
        N(g, GEO.box, '#111111', [.42, .12, .28], [.03, .03, .45]); N(g, GEO.box, '#111111', [-.42, .12, .28], [.03, .03, .45]); break;
      case 'scarf':
        N(g, GEO.torus, '#d43b3b', [0, -.48, 0], [.5, .5, .5]);
        N(g, GEO.box, '#d43b3b', [.22, -.82, .38], [.18, .5, .07], [.25, 0, -.15]); N(g, GEO.box, '#ffffff', [.25, -1.04, .44], [.19, .06, .08], [.25, 0, -.15]); break;
      case 'bowtie':
        N(g, GEO.cone, '#d43b3b', [.14, -.55, .56], [.12, .2, .12], [0, 0, PI / 2]); N(g, GEO.cone, '#d43b3b', [-.14, -.55, .56], [.12, .2, .12], [0, 0, -PI / 2]);
        N(g, GEO.sphere, '#a32020', [0, -.55, .58], .07); break;
    }
    return g;
  }

  // ---------------------------------------------------------------- puffin
  function buildPuffin(color, item) {
    const root = Grp(null);
    const dark = shadeHex(color, -45);
    N(root, GEO.disc, '#000000', [0, .03, 0], [.85, .02, .7], [0, 0, 0], { a: .2 });
    N(root, GEO.sphere, '#ff8a1f', [.28, .07, .22], [.24, .08, .34]); N(root, GEO.sphere, '#ff8a1f', [-.28, .07, .22], [.24, .08, .34]);
    const body = Grp(root);
    N(body, GEO.sphere, color, [0, 1.0, 0], [.78, .95, .72]);
    N(body, GEO.sphere, '#ffffff', [0, .92, .33], [.57, .75, .45]);
    const wingL = Grp(body, [.72, 1.45, 0]); N(wingL, GEO.sphere, dark, [0, -.45, 0], [.15, .52, .36]);
    const wingR = Grp(body, [-.72, 1.45, 0]); N(wingR, GEO.sphere, dark, [0, -.45, 0], [.15, .52, .36]);
    const head = Grp(body, [0, 2.05, 0]);
    N(head, GEO.sphere, color, [0, 0, 0], .56);
    N(head, GEO.sphere, '#ffffff', [0, -.02, .26], [.47, .4, .36]);
    for (const sx of [1, -1]) {
      N(head, GEO.sphere, '#1a1a1a', [.2 * sx, .1, .55], .075);
      N(head, GEO.sphere, '#ffffff', [.22 * sx, .13, .61], .025);
      N(head, GEO.sphere, '#d43b3b', [.2 * sx, .1, .53], [.1, .1, .04]);
    }
    N(head, GEO.cone, '#ff5a1f', [0, -.1, .74], [.25, .4, .33], [PI / 2, 0, 0]);
    N(head, GEO.cyl, '#ffd23f', [0, -.1, .58], [.27, .07, .35], [PI / 2, 0, 0]);
    N(head, GEO.box, '#a33a0c', [0, -.12, .8], [.26, .025, .25]);
    let hat = null;
    if (item) { hat = hatNode(item); head.add(hat); }
    return { root, body, head, wingL, wingR, hat };
  }
  // per-frame pose
  function posePuffin(m, t, moving, dancing, extra = 0) {
    let bob = 0, sway = 0, flap = .12;
    if (moving) { bob = Math.abs(Math.sin(t * 11)) * .12; sway = Math.sin(t * 11) * .09; flap = .25 + Math.abs(Math.sin(t * 11)) * .2; }
    if (dancing) { bob = Math.abs(Math.sin(t * 8)) * .35; sway = Math.sin(t * 8) * .25; flap = 1.2 + Math.sin(t * 16) * .9; }
    if (extra) { flap = 1.6 + Math.sin(t * 20) * .4; }
    m.body.pos[1] = bob; m.body.rot[2] = sway; m.body.rot[1] = dancing ? Math.sin(t * 4) * .6 : 0;
    m.wingL.rot[2] = flap; m.wingR.rot[2] = -flap;
    if (m.hat && m.hat.anim) m.hat.anim(t);
  }

  // ---------------------------------------------------------------- textures
  const woodTex = (base = '#a8683a', line = '#8c5530', key = '') => paintTex('wood' + base + line + key, 512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 16; r++) {
      x.fillStyle = r % 2 ? shadeHex(base, -8) : shadeHex(base, 6); x.fillRect(0, r * 32, w, 32);
      x.fillStyle = line; x.fillRect(0, r * 32, w, 3);
      const off = (r * 137) % 256; for (let c = off; c < w; c += 256) x.fillRect(c, r * 32, 3, 32);
    }
  });
  const logTex = (base = '#8b5a2b') => paintTex('log' + base, 512, 512, (x, w, h) => {
    for (let r = 0; r < 12; r++) { const g = x.createLinearGradient(0, r * 43, 0, r * 43 + 43); g.addColorStop(0, shadeHex(base, 25)); g.addColorStop(.5, base); g.addColorStop(1, shadeHex(base, -35)); x.fillStyle = g; x.fillRect(0, r * 43, w, 43); }
  });
  const brickTex = (base = '#f4faff', line = '#c9dff0', key = '') => paintTex('brick' + base + line + key, 512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h); x.strokeStyle = line; x.lineWidth = 5;
    for (let r = 0; r < 8; r++) { x.beginPath(); x.moveTo(0, r * 64); x.lineTo(w, r * 64); x.stroke(); for (let c = (r % 2) * 64; c < w; c += 128) { x.beginPath(); x.moveTo(c, r * 64); x.lineTo(c, r * 64 + 64); x.stroke(); } }
  });
  function floorTex(i) {
    const [name, col] = S.FLOORS[i] || S.FLOORS[0];
    return paintTex('floor' + i, 512, 512, (x, w, h) => {
      x.fillStyle = col; x.fillRect(0, 0, w, h);
      if (name === 'Wood') { x.drawImage(woodTex('#b07a45', '#7d5129'), 0, 0); }
      else if (name === 'Checkers') { for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { x.fillStyle = (a + b) % 2 ? '#f2f2f2' : '#222'; x.fillRect(a * 64, b * 64, 64, 64); } }
      else if (name === 'Stone') { x.strokeStyle = '#6f747d'; x.lineWidth = 6; for (let a = 0; a <= 8; a++) { x.beginPath(); x.moveTo(a * 64, 0); x.lineTo(a * 64, h); x.stroke(); x.beginPath(); x.moveTo(0, a * 64); x.lineTo(w, a * 64); x.stroke(); } }
      else if (name.includes('Carpet')) { x.strokeStyle = shadeHex(col, 40); x.lineWidth = 14; x.strokeRect(30, 30, w - 60, h - 60); x.lineWidth = 4; x.strokeRect(60, 60, w - 120, h - 120); for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) { x.fillStyle = shadeHex(col, 25); x.beginPath(); x.arc(110 + a * 58, 110 + b * 58, 6, 0, 7); x.fill(); } }
      else if (name === 'Ice') { x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; for (let a = 0; a < 14; a++) { x.beginPath(); let px = (a * 97) % w, py = (a * 53) % h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (Math.sin(a * 3 + k) * 60); py += (Math.cos(a * 2 + k) * 60); x.lineTo(px, py); } x.stroke(); } }
      else { for (let a = 0; a < 900; a++) { x.fillStyle = shadeHex(col, (a % 3 - 1) * 14); x.fillRect((a * 73) % w, (a * 151) % h, 4, 4); } }
    });
  }

  // ---------------------------------------------------------------- furniture
  const FURN_SIZE = { chair: 1.3, stool: 1.1, table: 1.5, sofa: 3.3, beanbag: 2, bed: 3.6, lamp: 1.2, plant: 1.2, bookshelf: 2.5, tv: 3, rug_red: 3, rug_blue: 3,
    fireplace: 3.6, aquarium: 2.7, piano: 3.1, snowman: 1.5, xmastree: 2.6, arcade: 1.5, fridge: 1.6, fountain: 3.3, discoball: 1.4, trophy: 1.2, bench: 3, speaker: 1.3 };
  const FURN_H = { rug_red: .3, rug_blue: .3, bed: 2.2, chair: 2.5, table: 1.5, sofa: 2, beanbag: 1.2, lamp: 3.2, plant: 2.2, bookshelf: 3.6, tv: 3, fireplace: 5, aquarium: 2.7, piano: 2.3,
    snowman: 3.2, xmastree: 4.6, arcade: 3.3, fridge: 3.4, fountain: 2.6, discoball: 4, trophy: 2.4, bench: 2, speaker: 2.6, stool: 1.6 };
  function furniture(id) {
    const g = Grp(null); g.anim = null;
    const wood = '#a0662f';
    switch (id) {
      case 'chair':
        N(g, GEO.box, wood, [0, 1, 0], [1.2, .15, 1.2]);
        for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) N(g, GEO.cyl, shadeHex(wood, -30), [.5 * a, .5, .5 * b], [.08, 1, .08]);
        N(g, GEO.box, wood, [0, 1.8, -.55], [1.2, 1.5, .14]); N(g, GEO.box, '#d43b3b', [0, 1.13, .05], [1, .1, 1]); break;
      case 'stool':
        N(g, GEO.cyl, '#d43b3b', [0, 1.4, 0], [.55, .16, .55]); N(g, GEO.cyl, '#c0c6cc', [0, .7, 0], [.08, 1.4, .08]); N(g, GEO.cyl, '#c0c6cc', [0, .05, 0], [.45, .1, .45]); break;
      case 'table':
        N(g, GEO.cyl, '#c88a4a', [0, 1.3, 0], [1.45, .14, 1.45]); N(g, GEO.cyl, '#7a4a24', [0, .65, 0], [.16, 1.3, .16]); N(g, GEO.cyl, '#7a4a24', [0, .05, 0], [.7, .1, .7]); break;
      case 'sofa': {
        const c = '#3f6fb5';
        N(g, GEO.box, c, [0, .6, 0], [3.2, .8, 1.4]); N(g, GEO.box, c, [0, 1.4, -.55], [3.2, 1.2, .35]);
        N(g, GEO.box, shadeHex(c, -20), [1.55, 1.0, 0], [.32, .95, 1.45]); N(g, GEO.box, shadeHex(c, -20), [-1.55, 1.0, 0], [.32, .95, 1.45]);
        N(g, GEO.box, shadeHex(c, 30), [.72, 1.07, .08], [1.38, .2, 1.12]); N(g, GEO.box, shadeHex(c, 30), [-.72, 1.07, .08], [1.38, .2, 1.12]);
        N(g, GEO.box, '#ffd23f', [.9, 1.45, -.25], [.6, .6, .2], [0, 0, .2]); break;
      }
      case 'beanbag': N(g, GEO.sphere, '#ff7f2a', [0, .55, 0], [.95, .6, .95]); N(g, GEO.sphere, '#ff9a4f', [0, .95, .1], [.6, .25, .6]); break;
      case 'bed':
        N(g, GEO.box, wood, [0, .4, 0], [2.4, .5, 3.6]); N(g, GEO.box, '#ffffff', [0, .8, 0], [2.2, .35, 3.4]);
        N(g, GEO.box, '#3f6fb5', [0, .9, .45], [2.32, .3, 2.5]); N(g, GEO.box, '#ffffff', [0, 1.1, -1.25], [1.6, .28, .6]);
        N(g, GEO.box, wood, [0, 1.3, -1.75], [2.4, 1.9, .2]); N(g, GEO.sphere, wood, [1.1, 2.3, -1.75], .18); N(g, GEO.sphere, wood, [-1.1, 2.3, -1.75], .18); break;
      case 'lamp': {
        N(g, GEO.cyl, '#333333', [0, .05, 0], [.5, .1, .5]); N(g, GEO.cyl, '#555555', [0, 1.4, 0], [.06, 2.8, .06]);
        N(g, GEO.sphere, '#fff3b0', [0, 2.7, 0], .22, [0, 0, 0], { e: 1 });
        N(g, GEO.shade, '#ffe08a', [0, 2.85, 0], [.55, .7, .55], [0, 0, 0], { e: .45 }); break;
      }
      case 'plant':
        N(g, GEO.cup, '#c96f3b', [0, .45, 0], [.5, .9, .5]); N(g, GEO.cyl, '#5a3a1f', [0, .88, 0], [.45, .05, .45]);
        for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; N(g, GEO.sphere, i % 2 ? '#2e8b57' : '#3fae6a', [Math.cos(a) * .25, 1.5, Math.sin(a) * .25], [.22, .7, .22], [Math.sin(a) * .5, 0, -Math.cos(a) * .5]); }
        break;
      case 'bookshelf': {
        N(g, GEO.box, '#7a4a24', [0, 1.8, -.05], [2.4, 3.6, .7]); N(g, GEO.box, '#5a3216', [0, 1.8, .02], [2.2, 3.4, .6]);
        const cols = ['#d43b3b', '#2b6cd4', '#2fa84f', '#f2c12e', '#8e44ad', '#ff7f2a', '#1abc9c', '#ff6fb5'];
        for (let s = 0; s < 4; s++) {
          N(g, GEO.box, '#7a4a24', [0, .15 + s * .85, .05], [2.2, .1, .6]);
          let x = -1;
          for (let b = 0; b < 9; b++) { const w = .13 + ((s * 9 + b) % 3) * .04, hh = .5 + ((s * 7 + b) % 4) * .06; N(g, GEO.box, cols[(s * 3 + b) % 8], [x + w / 2, .2 + s * .85 + hh / 2, .1], [w, hh, .45]); x += w + .03; if (x > .9) break; }
        }
        break;
      }
      case 'tv': {
        N(g, GEO.box, '#2b2b33', [0, .5, 0], [2.6, 1, .9]); N(g, GEO.box, '#111111', [0, 2.05, 0], [3, 1.8, .2]);
        const scr = N(g, GEO.plane, '#ffffff', [0, 2.05, .11], [2.8, 1.6, 1], [0, 0, 0], { e: .85 });
        scr.tex = paintTex('tvscreen', 256, 160, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7ec8ff'); gr.addColorStop(1, '#e6f6ff'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(0, 110, w, 50); x.font = '60px serif'; x.textAlign = 'center'; x.fillText('🐧', 128, 105); });
        g.anim = t => { scr.emissive = .75 + Math.sin(t * 3) * .1; }; break;
      }
      case 'rug_red': case 'rug_blue': {
        const c = id === 'rug_red' ? '#c0392b' : '#2e5fa8';
        N(g, GEO.disc, c, [0, .03, 0], [2.4, .04, 1.7]); N(g, GEO.disc, shadeHex(c, 45), [0, .04, 0], [1.9, .04, 1.3]); N(g, GEO.disc, c, [0, .05, 0], [1.3, .04, .85]); break;
      }
      case 'fireplace': {
        N(g, GEO.box, '#8a8f99', [0, 1.5, -.2], [3.4, 3, 1.2]); N(g, GEO.box, '#222222', [0, 1.05, .3], [1.9, 1.7, .4]);
        N(g, GEO.box, wood, [0, 3.05, 0], [3.8, .22, 1.6]); N(g, GEO.box, '#7d828c', [0, 4.2, -.35], [1.7, 2.2, .9]);
        for (const lx of [-.4, .4]) N(g, GEO.cyl, '#5a3216', [lx, .35, .35], [.15, 1, .15], [0, 0, PI / 2 + lx]);
        const flames = [];
        for (const [fx, c, sz] of [[-.3, '#ff7f2a', .5], [.25, '#ff7f2a', .45], [0, '#ffd23f', .35]]) flames.push(N(g, GEO.cone, c, [fx, .8, .4], [sz * .6, sz * 1.6, sz * .6], [0, 0, 0], { e: 1 }));
        g.anim = t => flames.forEach((f, i) => { f.scl[1] = (.6 + Math.sin(t * 9 + i * 2) * .15) * (i === 2 ? .9 : 1.2); }); break;
      }
      case 'aquarium': {
        N(g, GEO.box, wood, [0, .6, 0], [2.6, 1.2, 1.1]); N(g, GEO.box, '#e8d29b', [0, 1.3, 0], [2.3, .2, .9]);
        N(g, GEO.box, '#5fb1ec', [0, 1.95, 0], [2.4, 1.5, 1], [0, 0, 0], { a: .38 });
        N(g, GEO.box, '#333333', [0, 2.72, 0], [2.5, .1, 1.05]);
        N(g, GEO.sphere, '#2fa84f', [-.8, 1.7, -.2], [.12, .4, .12]); N(g, GEO.sphere, '#2fa84f', [-.6, 1.6, .1], [.1, .3, .1]);
        const fish = [0, 1, 2].map(i => N(g, GEO.sphere, ['#ff7f2a', '#ffd23f', '#ff6fb5'][i], [0, 1.8 + i * .25, 0], [.18, .1, .07]));
        g.anim = t => fish.forEach((f, i) => { const a = t * (.8 + i * .3) + i * 2; f.pos[0] = Math.sin(a) * .9; f.pos[2] = Math.cos(a * 1.3) * .25; f.rot[1] = Math.cos(a) > 0 ? 0 : PI; }); break;
      }
      case 'piano':
        N(g, GEO.box, '#111118', [0, 1.2, -.1], [3, 1.6, 1.3]); N(g, GEO.box, '#111118', [0, 2.15, -.55], [3, .3, .4]);
        N(g, GEO.box, '#ffffff', [0, 1.55, .65], [2.7, .12, .45]);
        for (let k = 0; k < 14; k++) if (k % 7 !== 2 && k % 7 !== 6) N(g, GEO.box, '#111111', [-1.25 + k * .19, 1.64, .55], [.09, .08, .28]);
        for (const lx of [-1.3, 1.3]) N(g, GEO.box, '#111118', [lx, .3, .4], [.15, .6, .15]);
        N(g, GEO.box, '#111118', [0, .75, .9], [1.2, .1, .6]); break;
      case 'snowman':
        N(g, GEO.sphere, '#ffffff', [0, .7, 0], .75); N(g, GEO.sphere, '#ffffff', [0, 1.75, 0], .55); N(g, GEO.sphere, '#ffffff', [0, 2.55, 0], .4);
        N(g, GEO.sphere, '#222222', [.14, 2.65, .35], .06); N(g, GEO.sphere, '#222222', [-.14, 2.65, .35], .06);
        N(g, GEO.cone, '#ff7f2a', [0, 2.55, .55], [.08, .4, .08], [PI / 2, 0, 0]);
        N(g, GEO.cyl, '#1b1b24', [0, 2.95, 0], [.4, .05, .4]); N(g, GEO.cyl, '#1b1b24', [0, 3.15, 0], [.25, .4, .25]);
        for (const y of [1.55, 1.85]) N(g, GEO.sphere, '#222222', [0, y, .52], .06);
        N(g, GEO.torus, '#2fa84f', [0, 2.2, 0], [.42, .5, .42]); break;
      case 'xmastree': {
        N(g, GEO.cyl, '#6b3f1f', [0, .4, 0], [.2, .8, .2]);
        for (let i = 0; i < 3; i++) N(g, GEO.cone, '#2e8b57', [0, 1.3 + i * .95, 0], [1.4 - i * .35, 1.5, 1.4 - i * .35]);
        const orns = [];
        for (let i = 0; i < 12; i++) { const a = i * 2.4, y = 1 + (i % 6) * .45, r = 1.15 - (y - 1) * .33; orns.push(N(g, GEO.sphere, ['#d43b3b', '#f2c12e', '#3aa7ff', '#ff6fb5'][i % 4], [Math.cos(a) * r, y, Math.sin(a) * r], .12, [0, 0, 0], { e: .3 })); }
        N(g, GEO.sphere, '#ffe14f', [0, 4.35, 0], .25, [0, 0, 0], { e: 1 });
        g.anim = t => orns.forEach((o, i) => { o.emissive = .2 + (Math.sin(t * 3 + i) > .5 ? .7 : 0); }); break;
      }
      case 'arcade': {
        N(g, GEO.box, '#6c3fc4', [0, 1.6, 0], [1.4, 3.2, 1.2]); N(g, GEO.box, '#111111', [0, 2.3, .55], [1.2, 1, .1]);
        const scr = N(g, GEO.plane, '#ffffff', [0, 2.3, .61], [1.1, .9, 1], [0, 0, 0], { e: .9 });
        scr.tex = paintTex('arcadescr', 128, 100, (x, w, h) => { x.fillStyle = '#101040'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffe14f'; x.fillRect(20, 60, 18, 18); x.fillStyle = '#ff3fa4'; x.fillRect(70, 30, 18, 18); x.fillStyle = '#3fd0ff'; x.fillRect(95, 70, 14, 14); });
        N(g, GEO.box, '#4a2a8a', [0, 1.45, .7], [1.4, .2, .6], [.3, 0, 0]);
        N(g, GEO.cyl, '#222', [-.3, 1.6, .75], [.04, .3, .04]); N(g, GEO.sphere, '#d43b3b', [-.3, 1.78, .75], .09);
        N(g, GEO.cyl, '#ffd23f', [.2, 1.55, .8], [.08, .06, .08]); N(g, GEO.cyl, '#3fd0ff', [.45, 1.55, .78], [.08, .06, .08]);
        N(g, GEO.box, '#ff3fa4', [0, 3.15, .3], [1.4, .35, .7], [0, 0, 0], { e: .7 }); break;
      }
      case 'fridge':
        N(g, GEO.box, '#e8eef2', [0, 1.7, 0], [1.5, 3.4, 1.3]); N(g, GEO.box, '#c0c8cf', [0, 2.3, .66], [1.45, .05, .02]);
        N(g, GEO.box, '#9aa4ad', [.55, 2.8, .7], [.08, .6, .08]); N(g, GEO.box, '#9aa4ad', [.55, 1.6, .7], [.08, .8, .08]);
        N(g, GEO.box, '#ff6fb5', [-.3, 2.9, .67], [.25, .25, .02]); N(g, GEO.box, '#3aa7ff', [0, 2.7, .67], [.2, .3, .02]); break;
      case 'fountain': {
        N(g, GEO.cyl, '#b9c2cc', [0, .3, 0], [1.6, .6, 1.6]); N(g, GEO.disc, '#5fb1ec', [0, .62, 0], [1.45, .05, 1.45], [0, 0, 0], { a: .8 });
        N(g, GEO.cyl, '#b9c2cc', [0, 1.1, 0], [.2, 1.2, .2]); N(g, GEO.cup, '#b9c2cc', [0, 1.75, 0], [.8, .3, .8]);
        const drops = [];
        for (let i = 0; i < 8; i++) drops.push(N(g, GEO.lowSphere, '#bfe6ff', [0, 2, 0], .1, [0, 0, 0], { a: .7 }));
        g.anim = t => drops.forEach((d, i) => { const k = (t * .8 + i / 8) % 1, a = i / 8 * PI * 2; d.pos = [Math.cos(a) * k * 1.1, 2 + Math.sin(k * PI) * .6 - k * 1.3, Math.sin(a) * k * 1.1]; }); break;
      }
      case 'discoball': {
        N(g, GEO.cyl, '#333', [0, .05, 0], [.5, .1, .5]); N(g, GEO.cyl, '#555', [0, 1.7, 0], [.05, 3.3, .05]);
        const ball = N(g, GEO.sphere, '#d8dde3', [0, 3.5, 0], .5, [0, 0, 0], { e: .2 });
        g.anim = t => { ball.rot[1] = t * 2; ball.boost = (Math.sin(t * 6) * .5 + .5) * .6; }; break;
      }
      case 'trophy':
        N(g, GEO.box, '#5a3216', [0, .4, 0], [1, .8, 1]); N(g, GEO.cyl, '#f2c12e', [0, 1, 0], [.12, .4, .12]);
        N(g, GEO.cup, '#f2c12e', [0, 1.6, 0], [.55, .9, .55]);
        N(g, GEO.torusThin, '#f2c12e', [.55, 1.65, 0], [.25, .25, .25], [PI / 2, 0, 0]); N(g, GEO.torusThin, '#f2c12e', [-.55, 1.65, 0], [.25, .25, .25], [PI / 2, 0, 0]);
        N(g, GEO.sphere, '#ffe14f', [0, 2.2, 0], .12, [0, 0, 0], { e: .8 }); break;
      case 'bench':
        N(g, GEO.box, wood, [0, .9, 0], [2.8, .14, 1]);
        for (const y of [1.4, 1.8]) N(g, GEO.box, wood, [0, y, -.45], [2.8, .25, .08]);
        for (const lx of [-1.2, 1.2]) { N(g, GEO.box, '#333', [lx, .45, 0], [.1, .9, .9]); N(g, GEO.box, '#333', [lx, 1.4, -.48], [.1, 1, .08]); } break;
      case 'speaker': {
        N(g, GEO.box, '#1b1b24', [0, 1.3, 0], [1.2, 2.6, 1]);
        const cones = [[2, .38], [.9, .45]].map(([y, r]) => N(g, GEO.cyl, '#555', [0, y, .5], [r, .08, r], [PI / 2, 0, 0]));
        g.anim = t => cones.forEach((c, i) => { const p = 1 + Math.abs(Math.sin(t * 8 + i)) * .12; c.scl[0] = c.scl[2] = (i ? .45 : .38) * p; }); break;
      }
    }
    return g;
  }

  // ---------------------------------------------------------------- scenery helpers
  function tree(p, x, z, s = 1) {
    const g = Grp(p, [x, 0, z], [0, x * 7, 0], s);
    N(g, GEO.cyl, '#6b3f1f', [0, .6, 0], [.3, 1.2, .3]);
    for (let i = 0; i < 3; i++) { N(g, GEO.cone8, '#2e8b57', [0, 1.9 + i * 1.3, 0], [2 - i * .5, 2.2, 2 - i * .5]); N(g, GEO.cone8, '#ffffff', [0, 2.55 + i * 1.3, 0], [(2 - i * .5) * .45, .9, (2 - i * .5) * .45]); }
    N(g, GEO.disc, '#000000', [0, .03, 0], [1.6, .02, 1.6], [0, 0, 0], { a: .12 });
    return g;
  }
  function sign(p, x, z, text, ry = 0) {
    const g = Grp(p, [x, 0, z], [0, ry, 0]);
    N(g, GEO.cyl, '#7a4a24', [0, 1, 0], [.12, 2, .12]);
    const board = N(g, GEO.box, '#b77942', [0, 2.15, 0], [3, 1, .16]);
    N(g, GEO.plane, '#ffffff', [0, 2.15, .09], [2.86, .88, 1], [0, 0, 0], { tex: textTex(text, '#b77942', '#ffffff', 512, 160, { border: '#7a4a24' }) });
    return { node: g, box: [x - 1.6, 0, z - .7, x + 1.6, 2.8, z + .7] };
  }
  function label(p, pos, text, w, h, bg, fg, ry = 0, rx = 0) {
    return N(p, GEO.plane, '#ffffff', pos, [w, h, 1], [rx, ry, 0], { tex: textTex(text, bg, fg, 512, Math.round(512 * h / w), {}) });
  }
  function windowBox(p, x, y, z, w, h, lit, ry = 0) {
    const g = Grp(p, [x, y, z], [0, ry, 0]);
    N(g, GEO.box, '#5a3a1f', [0, 0, 0], [w + .3, h + .3, .12]);
    N(g, GEO.box, lit ? '#ffe9a8' : '#bfe6ff', [0, 0, .04], [w, h, .1], [0, 0, 0], { e: lit ? .8 : .35 });
    N(g, GEO.box, '#5a3a1f', [0, 0, .1], [.1, h, .05]); N(g, GEO.box, '#5a3a1f', [0, 0, .1], [w, .1, .05]);
    N(g, GEO.box, '#ffffff', [0, -h / 2 - .2, .15], [w + .5, .14, .35]);
    return g;
  }
  // A building seen from outside. Returns the door hotspot box & walk point.
  function building(p, o) {
    const { x, z, w, h, d, wall, roof } = o;
    const g = Grp(p, [x, 0, z]);
    N(g, GEO.box, wall, [0, h / 2, 0], [w, h, d], [0, 0, 0], o.wallTex ? { tex: o.wallTex } : undefined);
    N(g, GEO.box, shadeHex(wall.startsWith('#') ? wall : '#888888', -35), [0, .3, 0], [w + .15, .6, d + .15]);
    N(g, GEO.prism, roof, [0, h, 0], [w + 1.2, o.roofH || 2.4, d + 1]);
    N(g, GEO.prism, '#ffffff', [0, h + .3, -.15], [w * .78, (o.roofH || 2.4) * .92, d + .7]);
    const front = d / 2;
    N(g, GEO.box, o.doorColor || '#6b3f1f', [0, 1.4, front + .05], [1.7, 2.8, .14]);
    N(g, GEO.box, shadeHex(o.doorColor || '#6b3f1f', 30), [0, 2.9, front + .07], [2, .25, .18]);
    N(g, GEO.sphere, '#ffd23f', [.55, 1.35, front + .16], .09);
    if (o.sign) {
      N(g, GEO.box, o.signColor || '#7a3b1c', [0, h - .75, front + .1], [w * .72, 1.05, .16]);
      N(g, GEO.plane, '#ffffff', [0, h - .75, front + .19], [w * .7, .95, 1], [0, 0, 0], { tex: textTex(o.sign, o.signColor || '#7a3b1c', '#ffffff') });
    }
    if (o.windows !== false) { windowBox(g, -w * .3, h * .45, front + .06, 1.4, 1.2, o.lit !== false); windowBox(g, w * .3, h * .45, front + .06, 1.4, 1.2, o.lit !== false); }
    N(g, GEO.disc, '#000000', [0, .02, 0], [w * .7, .02, d * .8], [0, 0, 0], { a: .12 });
    return { g, door: [x - 1.2, 0, z + front - .4, x + 1.2, 3, z + front + .6], walk: [x, z + front + 1.3], nodes: [g] };
  }
  function exitMat(p, z = 9.3) {
    N(p, GEO.box, '#3d7a3d', [0, .04, z], [4, .08, 1.5]);
    N(p, GEO.plane, '#ffffff', [0, .1, z], [3.6, 1.2, 1], [-PI / 2, 0, 0], { tex: textTex('EXIT', '#3d7a3d', '#ffffff', 512, 170) });
    return [-2.2, 0, z - .9, 2.2, .6, z + .9];
  }
  function pictureFrame(p, x, y, z, w, h, draw, key, ry = 0) {
    const g = Grp(p, [x, y, z], [0, ry, 0]);
    N(g, GEO.box, '#5a3216', [0, 0, 0], [w + .25, h + .25, .1]);
    N(g, GEO.plane, '#ffffff', [0, 0, .06], [w, h, 1], [0, 0, 0], { tex: paintTex('pic' + key, 256, Math.round(256 * h / w), draw) });
    return g;
  }
  function hangingLamp(p, x, z, y = 7, col = '#ffe08a') {
    N(p, GEO.cyl, '#333', [x, y + 1.5, z], [.03, 3, .03]);
    N(p, GEO.shade, col, [x, y, z], [.7, .6, .7]);
    N(p, GEO.sphere, '#fff3b0', [x, y - .3, z], .2, [0, 0, 0], { e: 1 });
  }
  function mug(p, x, y, z, c = '#ffffff') { N(p, GEO.cyl, c, [x, y + .17, z], [.14, .34, .14]); N(p, GEO.cyl, '#6b3f1f', [x, y + .33, z], [.12, .02, .12]); N(p, GEO.torusThin, c, [x + .15, y + .18, z], [.09, .09, .09], [PI / 2, 0, 0]); }
  function crate(p, x, z, s = 1, ry = 0) { const g = Grp(p, [x, 0, z], [0, ry, 0], s); N(g, GEO.box, '#b07a45', [0, .6, 0], [1.2, 1.2, 1.2]); N(g, GEO.box, '#7d5129', [0, .6, 0], [1.25, .15, 1.25]); N(g, GEO.box, '#7d5129', [0, .6, 0], [.15, 1.25, 1.25]); return g; }
  function barrel(p, x, z, s = 1) { const g = Grp(p, [x, 0, z], [0, 0, 0], s); N(g, GEO.cyl, '#8b5a2b', [0, .8, 0], [.6, 1.6, .6]); for (const y of [.3, 1.3]) N(g, GEO.cyl, '#555', [0, y, 0], [.62, .1, .62]); return g; }
  function iceberg(p, x, z, s = 1) { const g = Grp(p, [x, -.2, z], [0, x, 0], s); N(g, GEO.cone8, '#ffffff', [0, 1.2, 0], [2.4, 3, 2.4]); N(g, GEO.cone8, '#e3f2fd', [1.2, .8, .6], [1.4, 2, 1.4]); return g; }
  function mountain(p, x, z, s, col = '#e3f0fb') { N(p, GEO.cone8, col, [x, s * .45, z], [s, s * .9, s]); N(p, GEO.cone8, '#ffffff', [x, s * .73, z], [s * .38, s * .35, s * .38]); }

  // Quest collectibles
  function collectible(item) {
    const g = Grp(null); const spin = Grp(g, [0, .9, 0]);
    if (item === 'mitten') { N(spin, GEO.sphere, '#d43b3b', [0, 0, 0], [.35, .45, .18]); N(spin, GEO.sphere, '#d43b3b', [.32, .05, 0], [.13, .2, .13], [0, 0, -.5]); N(spin, GEO.cyl, '#ffffff', [0, -.42, 0], [.32, .15, .18]); }
    else if (item === 'bottle') { N(spin, GEO.cyl, '#3fae6a', [0, 0, 0], [.22, .7, .22], [0, 0, 0], { a: .75 }); N(spin, GEO.cyl, '#3fae6a', [0, .45, 0], [.09, .25, .09], [0, 0, 0], { a: .75 }); N(spin, GEO.cyl, '#b07a45', [0, .6, 0], [.08, .12, .08]); N(spin, GEO.cyl, '#fff3d6', [0, 0, 0], [.1, .45, .1]); }
    else { N(spin, GEO.cyl, '#d43b3b', [0, 0, 0], [.32, .7, .32]); N(spin, GEO.cyl, '#999', [0, .38, 0], [.28, .06, .28]); N(spin, GEO.cyl, '#999', [.18, .5, 0], [.05, .3, .05], [0, 0, -.6]); N(spin, GEO.box, '#ffd23f', [0, 0, .3], [.35, .25, .05]); }
    const beam = N(g, GEO.cyl, '#ffe14f', [0, 2.5, 0], [.5, 5, .5], [0, 0, 0], { a: .18, e: 1 });
    N(g, GEO.disc, '#ffe14f', [0, .03, 0], [.8, .02, .8], [0, 0, 0], { a: .35, e: 1 });
    g.anim = t => { spin.rot[1] = t * 2; spin.pos[1] = .9 + Math.sin(t * 3) * .15; spin.boost = .25 + Math.sin(t * 5) * .2; beam.alpha = .12 + Math.sin(t * 3) * .06; };
    return g;
  }
  // Snowman target for the Target Practice quest
  function snowTarget() {
    const g = furniture('snowman');
    N(g, GEO.torus, '#d43b3b', [0, 1.75, .5], [.45, .45, .45], [PI / 2, 0, 0]);
    N(g, GEO.torus, '#ffffff', [0, 1.75, .55], [.27, .27, .27], [PI / 2, 0, 0]);
    N(g, GEO.sphere, '#d43b3b', [0, 1.75, .56], [.12, .12, .05]);
    return g;
  }

  root.Models = { shadeHex, hatNode, buildPuffin, posePuffin, furniture, FURN_SIZE, FURN_H, woodTex, logTex, brickTex, floorTex,
    tree, sign, label, windowBox, building, exitMat, pictureFrame, hangingLamp, mug, crate, barrel, iceberg, mountain, collectible, snowTarget };
})(window);
