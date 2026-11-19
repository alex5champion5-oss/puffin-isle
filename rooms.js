// =====================================================================
//  Puffin Isle — 3D rooms (outdoor areas, detailed interiors, homes)
// =====================================================================
(function (root) {
  const { N, Grp, GEO, textTex, paintTex } = E3;
  const M = Models, PI = Math.PI;
  const OUT = { clear: '#a9dcff', fog: '#cfeaff', fogNear: 50, fogFar: 130, ground: [.75, .8, .9] };
  const IN = { clear: '#2a2233', fog: '#2a2233', fogNear: 90, fogFar: 220, ground: [.7, .66, .62] };

  // Hotspot helpers. A hotspot is something you can click: a door, a game, a catalog...
  function door(ctx, box, label, to, at, walk, nodes) { ctx.hot.push({ box, label, to, at, walk, nodes: nodes || [] }); }
  function spot(ctx, box, label, action, walk, nodes) { ctx.hot.push({ box, label, action, walk, nodes: nodes || [] }); }

  function interiorShell(ctx, o) {
    const r = ctx.root;
    N(r, GEO.box, '#ffffff', [0, -.5, 0], [34, 1, 22], [0, 0, 0], { tex: o.floor });
    N(r, GEO.box, o.wall, [0, 4.5, -10.6], [34, 9, 1], [0, 0, 0], o.wallTex ? { tex: o.wallTex } : undefined);
    for (const sx of [-1, 1]) N(r, GEO.box, M.shadeHex(o.wall, -18), [16.6 * sx, 4.5, 0], [1, 9, 22.2], [0, 0, 0], o.wallTex ? { tex: o.wallTex } : undefined);
    if (o.wainscot) {
      N(r, GEO.box, o.wainscot, [0, 1.2, -10.05], [33.2, 2.4, .15]);
      for (const sx of [-1, 1]) N(r, GEO.box, M.shadeHex(o.wainscot, -15), [16.05 * sx, 1.2, 0], [.15, 2.4, 22]);
      N(r, GEO.box, M.shadeHex(o.wainscot, 30), [0, 2.45, -9.95], [33.2, .12, .3]);
    }
    N(r, GEO.box, '#3b2a1a', [0, .15, -10.05], [33.2, .3, .2]);
    const ex = M.exitMat(r);
    door(ctx, ex, 'Exit', o.exitTo, o.exitAt, [0, 8.8]);
  }

  const ROOMS = {
    // ================================================================ TOWN
    town: {
      name: 'Town Center', emoji: '🏘️', bounds: [-15, 15, -6.5, 8.5], spawn: [0, 4], outdoor: true, env: OUT,
      build(ctx) {
        const r = ctx.root;
        N(r, GEO.box, '#f4faff', [0, -.5, -15], [150, 1, 90]);
        N(r, GEO.disc, '#e3eef8', [0, .02, 1.5], [11, .02, 6]);
        N(r, GEO.box, '#e3eef8', [0, .015, -6.3], [32, .02, 3.6]);
        for (const [x, z, s] of [[-20, 2, 3], [21, 4, 3.5], [-17, 12, 2.5], [18, 13, 2.8], [-26, -8, 4], [27, -6, 4]]) N(r, GEO.sphere, '#ffffff', [x, 0, z], [s, s * .35, s * .8]);
        for (const [x, z, s] of [[-45, -70, 26], [-12, -80, 34], [25, -75, 28], [55, -62, 22]]) M.mountain(r, x, z, s);
        const cafe = M.building(r, { x: -11, z: -11, w: 8, h: 5.5, d: 6, wall: '#c96f3b', roof: '#7a3b1c', sign: 'Cocoa Café', signColor: '#7a3b1c' });
        door(ctx, cafe.door, 'Cocoa Café', 'cafe', [0, 8], cafe.walk, cafe.nodes);
        const club = M.building(r, { x: 0, z: -11.5, w: 8.5, h: 6.8, d: 6, wall: '#3b2a6b', roof: '#20163d', sign: 'Night Club', signColor: '#ff3fa4', doorColor: '#151515', windows: false });
        door(ctx, club.door, 'Night Club', 'club', [0, 8], club.walk, club.nodes);
        const lights = [];
        for (let i = 0; i < 7; i++) lights.push(N(r, GEO.sphere, '#ff3fa4', [-3.3 + i * 1.1, 4.1, -8.35], .22, [0, 0, 0], { e: 1 }));
        const neon = ['#ff3fa4', '#3fd0ff', '#ffe14f', '#7dff6a', '#b56bff'];
        ctx.anim.push(t => lights.forEach((l, i) => l.setColor(neon[(i + Math.floor(t * 4)) % 5])));
        const shop = M.building(r, { x: 11, z: -11, w: 8, h: 5.2, d: 6, wall: '#5cb6e8', roof: '#2a6fa8', sign: 'Gift Shop', signColor: '#2fa84f', lit: false });
        door(ctx, shop.door, 'Gift Shop', 'shop', [0, 8], shop.walk, shop.nodes);
        for (const [x, z, s] of [[-5.9, -9.5, .8], [5.9, -9.8, .75], [-17, -4, 1], [17.5, -3, 1.1], [-19, 7, 1.2], [19, 9, 1], [-22, -14, 1.3], [22, -16, 1.4], [-30, 0, 1.4], [30, 2, 1.3]]) M.tree(r, x, z, s);
        for (const x of [-6, 6]) { N(r, GEO.cyl, '#333344', [x, 2, -4.2], [.12, 4, .12]); N(r, GEO.sphere, '#fff3b0', [x, 4.1, -4.2], .35, [0, 0, 0], { e: 1 }); N(r, GEO.cone8, '#333344', [x, 4.6, -4.2], [.45, .4, .45]); }
        const tr = M.furniture('xmastree'); tr.pos = [-12.5, 0, 6]; tr.scl = [1.2, 1.2, 1.2]; r.add(tr); ctx.anim.push(tr.anim);
        const sm = M.furniture('snowman'); sm.pos = [15.5, 0, -5]; sm.rot = [0, -.5, 0]; r.add(sm);
        const bench = M.furniture('bench'); bench.pos = [.5, 0, 8.4]; r.add(bench);
        let s = M.sign(r, -14.5, .5, '← Dock', .5); door(ctx, s.box, 'To the Dock', 'dock', [13, 4], [-13.5, 1.5], [s.node]);
        s = M.sign(r, 14.5, .5, 'Ski Hill →', -.5); door(ctx, s.box, 'To Ski Hill', 'skihill', [-12, 4], [13.5, 1.5], [s.node]);
        s = M.sign(r, 6, 8.7, 'Beach ↓', 0); door(ctx, s.box, 'To the Beach', 'beach', [-12, 5], [6, 7.8], [s.node]);
        s = M.sign(r, -6, 8.7, '🏠 My Home', 0); door(ctx, s.box, 'Go to your home', '@home', null, [-6, 7.8], [s.node]);
      },
    },

    // ================================================================ COCOA CAFÉ
    cafe: {
      name: 'Cocoa Café', emoji: '☕', bounds: [-14, 15, -5, 8.8], spawn: [0, 7], env: IN,
      build(ctx) {
        const r = ctx.root;
        interiorShell(ctx, { wall: '#e0a96d', wainscot: '#8c5530', floor: M.woodTex('#a8683a', '#7d4a28'), exitTo: 'town', exitAt: [-11, -6.3] });
        M.windowBox(r, -3.5, 5, -10, 3, 2.2, false); M.windowBox(r, 1.5, 5, -10, 3, 2.2, false);
        N(r, GEO.box, '#5a3216', [-9.5, 5.6, -10], [4.4, 3, .15]);
        N(r, GEO.plane, '#ffffff', [-9.5, 5.6, -9.9], [4.1, 2.7, 1], [0, 0, 0], { tex: paintTex('menu', 300, 200, (x, w, h) => {
          x.fillStyle = '#2b2b2b'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = 'bold 30px Trebuchet MS'; x.textAlign = 'center'; x.fillText('MENU', w / 2, 38);
          x.font = '20px Trebuchet MS'; x.textAlign = 'left';
          [['Hot Cocoa', '5'], ['Marshmallows', '2'], ['Whipped Cream', '2'], ['Fish Muffin', '4'], ['Snow Cone', '3']].forEach(([a, b], i) => { x.fillStyle = ['#ffd23f', '#fff', '#7fd3ff', '#ff9fcf', '#a3e635'][i]; x.fillText(a, 22, 75 + i * 26); x.fillText('🪙' + b, 230, 75 + i * 26); });
        }) });
        // counter
        N(r, GEO.box, '#7a3b1c', [7, 1.1, -6.2], [9, 2.2, 1.4]);
        N(r, GEO.box, '#e8d29b', [7, 2.27, -6.2], [9.4, .14, 1.8]);
        for (let i = 0; i < 4; i++) N(r, GEO.box, '#5a2a10', [3.6 + i * 2.25, 1.1, -5.48], [.12, 2, .05]);
        N(r, GEO.box, '#6b3f1f', [7, 1.4, -9.7], [11, 2.8, 1.2]);
        for (const y of [4.2, 5.6]) N(r, GEO.box, '#6b3f1f', [7, y, -9.85], [9, .14, .8]);
        for (let i = 0; i < 7; i++) M.mug(r, 3.5 + i * 1.2, 4.27, -9.8, ['#ffffff', '#ff7f2a', '#3aa7ff', '#ff6fb5'][i % 4]);
        for (let i = 0; i < 5; i++) { N(r, GEO.cyl, '#bfe6ff', [4 + i * 1.6, 6.05, -9.8], [.3, .8, .3], [0, 0, 0], { a: .6 }); N(r, GEO.cyl, ['#8b5a2b', '#f2e3c2', '#ff9fcf', '#7a3b1c', '#ffd23f'][i], [4 + i * 1.6, 5.9, -9.8], [.25, .45, .25]); }
        N(r, GEO.box, '#c0c6cc', [9.8, 3.7, -9.5], [2, 2, 1.1]); N(r, GEO.box, '#333', [9.8, 3.4, -8.95], [.9, .3, .05]);
        N(r, GEO.cyl, '#555', [9.8, 2.95, -9.1], [.08, .4, .08]);
        const steam = [0, 1, 2, 3].map(i => N(r, GEO.lowSphere, '#ffffff', [9.8, 4.9, -9.5], .25, [0, 0, 0], { a: .4 }));
        ctx.anim.push(t => steam.forEach((s, i) => { const k = (t * .5 + i / 4) % 1; s.pos[1] = 4.8 + k * 2; s.pos[0] = 9.8 + Math.sin(t * 2 + i) * .3; s.alpha = .45 * (1 - k); s.scl = [.2 + k * .4, .2 + k * .4, .2 + k * .4]; }));
        N(r, GEO.box, '#2b2b33', [3.6, 2.65, -6.3], [1.1, .6, .9]); N(r, GEO.box, '#7dff6a', [3.6, 3, -6.5], [.8, .3, .05], [-.3, 0, 0], { e: .8 });
        N(r, GEO.box, '#bfe6ff', [7.2, 2.85, -6.2], [2.6, .95, 1.3], [0, 0, 0], { a: .3 });
        for (let i = 0; i < 4; i++) { N(r, GEO.cup, '#f2e3c2', [6.4 + i * .55, 2.55, -6.2], [.18, .3, .18]); N(r, GEO.sphere, ['#ff9fcf', '#ffffff', '#8b5a2b', '#7fd3ff'][i], [6.4 + i * .55, 2.78, -6.2], .2); }
        // tables & chairs
        for (const [tx, tz] of [[-6, 1.5], [-.5, 4.8], [5, 1.5]]) {
          const tb = M.furniture('table'); tb.pos = [tx, 0, tz]; r.add(tb);
          for (const [dx, ry] of [[-1.7, PI / 2], [1.7, -PI / 2]]) { const c = M.furniture('chair'); c.pos = [tx + dx, 0, tz]; c.rot = [0, ry, 0]; c.scl = [.85, .85, .85]; r.add(c); }
          M.mug(r, tx - .3, 1.37, tz + .2); M.mug(r, tx + .4, 1.37, tz - .2, '#ff7f2a');
          M.hangingLamp(r, tx, tz, 6.5);
        }
        const rug = M.furniture('rug_red'); rug.pos = [-.5, 0, 3]; rug.scl = [2.2, 1, 2]; r.add(rug);
        const fp = M.furniture('fireplace'); fp.pos = [-15.4, 0, 1.5]; fp.rot = [0, PI / 2, 0]; r.add(fp); ctx.anim.push(fp.anim);
        for (const [x, z] of [[-14.5, -8.8], [14.5, -3.5], [14.5, 7.5]]) { const pl = M.furniture('plant'); pl.pos = [x, 0, z]; r.add(pl); }
        M.pictureFrame(r, 13.5, 5.8, -10, 2.4, 1.8, (x, w, h) => { x.fillStyle = '#ffe9a8'; x.fillRect(0, 0, w, h); x.font = '120px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('☕', w / 2, h / 2 + 8); }, 'mug');
        M.pictureFrame(r, -16.05, 5.5, -5, 2.6, 1.8, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7ec8ff'); g.addColorStop(1, '#fff'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#e3f0fb'; x.beginPath(); x.moveTo(0, h); x.lineTo(80, 60); x.lineTo(150, h); x.lineTo(200, 80); x.lineTo(w, h); x.fill(); }, 'mtn', PI / 2);
        // Cocoa Catch arcade
        const ar = M.furniture('arcade'); ar.pos = [-11.5, 0, -8.6]; ar.scl = [1.25, 1.25, 1.25]; r.add(ar);
        M.label(r, [-11.5, 4.9, -8.2], 'COCOA CATCH', 3.2, .8, '#ff7f2a', '#ffffff');
        spot(ctx, [-13, 0, -9.5, -10, 5.2, -7.5], 'Play Cocoa Catch!', 'catch', [-11.5, -5], [ar]);
      },
    },

    // ================================================================ NIGHT CLUB
    club: {
      name: 'Night Club', emoji: '🪩', bounds: [-15, 15, -5.5, 8.8], spawn: [0, 7], env: { ...IN, clear: '#120a22', fog: '#120a22', ground: [.5, .45, .7] },
      dance: [-8, 8, -2.5, 5.5],
      build(ctx) {
        const r = ctx.root;
        interiorShell(ctx, { wall: '#2a1b4d', floor: paintTex('clubfloor', 256, 256, (x, w, h) => { x.fillStyle = '#17102a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a1f45'; x.lineWidth = 3; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); } }), exitTo: 'town', exitAt: [0, -6.3] });
        const strips = [];
        for (const [y, c] of [[7.5, '#ff3fa4'], [3, '#3fd0ff']]) strips.push(N(r, GEO.box, c, [0, y, -10.05], [33, .18, .1], [0, 0, 0], { e: 1 }));
        for (const sx of [-1, 1]) for (const [y, c] of [[7.5, '#ff3fa4'], [3, '#3fd0ff']]) strips.push(N(r, GEO.box, c, [16.05 * sx, y, 0], [.1, .18, 21], [0, 0, 0], { e: 1 }));
        N(r, GEO.plane, '#ffffff', [0, 6.3, -10], [9, 2.2, 1], [0, 0, 0], { e: .9, tex: textTex('NIGHT CLUB', '#2a1b4d', '#ff6fd0', 512, 125, { border: '#3fd0ff' }) });
        const cols = ['#ff3fa4', '#3fd0ff', '#ffe14f', '#7dff6a', '#b56bff'];
        const tiles = [];
        for (let i = 0; i < 10; i++) for (let j = 0; j < 5; j++) tiles.push([N(r, GEO.box, cols[0], [-7.2 + i * 1.6, .04, -1.7 + j * 1.6], [1.52, .08, 1.52], [0, 0, 0], { e: .55 }), i, j]);
        // DJ booth
        N(r, GEO.box, '#2b2b33', [0, 1.2, -7.4], [6.5, 2.4, 2]);
        N(r, GEO.box, '#ff3fa4', [0, 1.6, -6.38], [6.3, .15, .05], [0, 0, 0], { e: 1 });
        N(r, GEO.box, '#111', [0, 2.45, -7.4], [6.6, .1, 2.1]);
        const decks = [-1.8, 1.8].map(x => { N(r, GEO.box, '#444', [x, 2.6, -7.4], [1.8, .2, 1.4]); return N(r, GEO.cyl, '#111', [x, 2.75, -7.4], [.6, .06, .6]); });
        N(r, GEO.box, '#555', [0, 2.65, -7.4], [1.2, .3, 1]);
        const leds = [0, 1, 2, 3, 4].map(i => N(r, GEO.sphere, '#7dff6a', [-.4 + i * .2, 2.85, -7.1], .06, [0, 0, 0], { e: 1 }));
        for (const [x, z, s] of [[-5.5, -8.3, 1.6], [5.5, -8.3, 1.6], [-14, -7.5, 1.3], [14, -7.5, 1.3]]) { const sp = M.furniture('speaker'); sp.pos = [x, 0, z]; sp.scl = [s, s, s]; r.add(sp); ctx.anim.push(sp.anim); }
        // disco ball + beams
        N(r, GEO.cyl, '#333', [0, 9.5, 0], [.04, 2, .04]);
        const ball = N(r, GEO.sphere, '#d8dde3', [0, 8.3, 1], .8, [0, 0, 0], { e: .25 });
        const beams = [];
        for (let i = 0; i < 6; i++) { const g = Grp(r, [0, 8.3, 1]); N(g, GEO.cone, cols[i % 5], [0, -4.5, 0], [1.3, 9, 1.3], [0, 0, 0], { a: .13, e: 1 }); beams.push(g); }
        // lounge & bar
        for (const [x, ry] of [[-13.5, PI / 2], [13.5, -PI / 2]]) { const so = M.furniture('sofa'); so.pos = [x, 0, 3]; so.rot = [0, ry, 0]; r.add(so); const tb = M.furniture('table'); tb.pos = [x + (x < 0 ? 2.6 : -2.6), 0, 3]; tb.scl = [.8, .8, .8]; r.add(tb); }
        N(r, GEO.box, '#3b2a6b', [12, 1.1, -6.3], [6, 2.2, 1.3]); N(r, GEO.box, '#b56bff', [12, 2.27, -6.3], [6.3, .14, 1.6], [0, 0, 0], { e: .3 });
        for (let i = 0; i < 3; i++) { const st = M.furniture('stool'); st.pos = [10 + i * 2, 0, -4.9]; r.add(st); }
        for (let i = 0; i < 6; i++) N(r, GEO.cyl, cols[i % 5], [10 + i * .8, 4.5, -9.9], [.18, .9, .18], [0, 0, 0], { e: .4 });
        N(r, GEO.box, '#3b2a6b', [12, 4, -10], [6, .12, .6]);
        ctx.anim.push(t => {
          for (const [tile, i, j] of tiles) tile.setColor(cols[(i + j + Math.floor(t * 3)) % 5]);
          ball.rot[1] = t; beams.forEach((b, i) => { b.rot[1] = t * .7 + i * PI / 3; b.rot[2] = .45 + Math.sin(t + i) * .15; });
          decks.forEach(d => d.rot[1] = t * 6); leds.forEach((l, i) => l.visible = Math.sin(t * 10 + i * 1.3) > -.2);
          strips.forEach((s, i) => s.emissive = .7 + Math.sin(t * 4 + i) * .3);
        });
      },
    },

    // ================================================================ GIFT SHOP
    shop: {
      name: 'Gift Shop', emoji: '🎁', bounds: [-15, 15, -5, 8.8], spawn: [0, 7], env: IN,
      build(ctx) {
        const r = ctx.root;
        interiorShell(ctx, { wall: '#c9b8f0', wainscot: '#8e7cc3', floor: M.woodTex('#e9d7a8', '#cdb47f'), exitTo: 'town', exitAt: [11, -6.3] });
        const hats = ['partyhat', 'beanie', 'tophat', 'crown', 'viking', 'propeller', 'flower', 'headphones', 'sunglasses'];
        for (const [sx, off] of [[-10.5, 0], [10.5, 4]]) {
          N(r, GEO.box, '#7a4a24', [sx, 3.5, -9.9], [6, 7, .4]);
          for (let k = 0; k < 3; k++) {
            N(r, GEO.box, '#a0662f', [sx, 1.8 + k * 2, -9.5], [5.8, .15, 1]);
            for (let h = 0; h < 3; h++) { const hn = M.hatNode(hats[(off + k * 3 + h) % hats.length]); hn.pos = [sx - 1.8 + h * 1.8, 1.55 + k * 2, -9.4]; hn.scl = [.9, .9, .9]; r.add(hn); if (hn.anim) ctx.anim.push(hn.anim); }
          }
        }
        // mannequins
        for (const [x, item, c] of [[-2.5, 'tophat', '#e8eef2'], [0, 'crown', '#e8eef2'], [2.5, 'viking', '#e8eef2']]) {
          N(r, GEO.cyl, '#8e7cc3', [x, .25, -8.6], [.9, .5, .9]);
          const m = M.buildPuffin(c, item); m.root.pos = [x, .5, -8.6]; r.add(m.root); M.posePuffin(m, 0, false, false);
        }
        N(r, GEO.plane, '#ffffff', [0, 6.6, -10], [7, 1.4, 1], [0, 0, 0], { tex: textTex('NEW ARRIVALS', '#8e7cc3', '#ffffff') });
        // clothing rack
        N(r, GEO.box, '#c0c6cc', [-14, 3.2, 0], [.1, .1, 5]); for (const z of [-2.5, 2.5]) N(r, GEO.cyl, '#c0c6cc', [-14, 1.6, z], [.07, 3.2, .07]);
        for (let i = 0; i < 7; i++) N(r, GEO.box, ['#d43b3b', '#2b6cd4', '#ffd23f', '#2fa84f', '#ff6fb5', '#8e44ad', '#ff7f2a'][i], [-14, 2.2, -2 + i * .65], [1, 1.6, .15]);
        // counter with Pip
        N(r, GEO.box, '#5a3a8a', [-5, 1.1, -6.6], [5, 2.2, 1.4]); N(r, GEO.box, '#e9d7a8', [-5, 2.27, -6.6], [5.3, .14, 1.7]);
        N(r, GEO.box, '#2b2b33', [-6.3, 2.65, -6.7], [1.1, .6, .9]); N(r, GEO.box, '#7dff6a', [-6.3, 3, -6.9], [.8, .3, .05], [-.3, 0, 0], { e: .8 });
        N(r, GEO.box, '#ff6fb5', [-4, 2.6, -6.6], [.8, .5, .6]); N(r, GEO.box, '#ffd23f', [-4, 2.86, -6.6], [.82, .08, .62]);
        // hat catalog podium
        N(r, GEO.box, '#2fa84f', [4, 1.2, -6.4], [2.4, 2.4, 1.4]); N(r, GEO.box, '#ffffff', [4, 2.5, -6.4], [1.6, .15, 1.1], [-.3, 0, 0]);
        M.label(r, [4, 1.4, -5.68], 'HAT CATALOG', 2.2, .6, '#2fa84f', '#ffffff');
        const th = M.hatNode('tophat'); th.pos = [4, 2.4, -6.6]; r.add(th);
        spot(ctx, [2.6, 0, -7.2, 5.4, 3.4, -5.6], 'Open the Hat Catalog', 'shop', [4, -4.8], [th]);
        // furniture showroom
        const rug = M.furniture('rug_blue'); rug.pos = [11, 0, 2]; rug.scl = [1.4, 1, 1.4]; r.add(rug);
        const so = M.furniture('sofa'); so.pos = [11.5, 0, -.4]; r.add(so);
        const lp = M.furniture('lamp'); lp.pos = [14.3, 0, -.6]; r.add(lp);
        const pl = M.furniture('plant'); pl.pos = [8.3, 0, -.6]; r.add(pl);
        const tv = M.furniture('tv'); tv.pos = [11.5, 0, 4.6]; tv.rot = [0, PI, 0]; tv.scl = [.8, .8, .8]; r.add(tv); ctx.anim.push(tv.anim);
        const fs = Grp(r, [7.6, 0, 3.5]); N(fs, GEO.cyl, '#7a4a24', [0, 1, 0], [.12, 2, .12]); N(fs, GEO.box, '#ff7f2a', [0, 2.2, 0], [3, 1, .16]);
        N(fs, GEO.plane, '#ffffff', [0, 2.2, .09], [2.9, .9, 1], [0, 0, 0], { tex: textTex('FURNITURE', '#ff7f2a', '#ffffff') });
        spot(ctx, [6, 0, -1.6, 15, 3.4, 5.5], 'Browse furniture for your home', 'furniture', [7.6, 5], [so, fs, rug]);
        for (const [x, z] of [[-14.5, -8.8], [14.5, -8.8]]) { const p2 = M.furniture('plant'); p2.pos = [x, 0, z]; r.add(p2); }
        M.hangingLamp(r, -5, -3, 7, '#c9b8f0'); M.hangingLamp(r, 4, -3, 7, '#c9b8f0'); M.hangingLamp(r, 11, 2, 7, '#c9b8f0');
      },
    },

    // ================================================================ SKI HILL
    skihill: {
      name: 'Ski Hill', emoji: '🎿', bounds: [-15, 15, -5.5, 8.5], spawn: [-12, 4], outdoor: true, env: { ...OUT, clear: '#8fcaf7' },
      targets: [[-6.5, -3.5], [-1, -4.6], [4, -3.2]],
      build(ctx) {
        const r = ctx.root;
        N(r, GEO.box, '#f4faff', [0, -.5, -10], [150, 1, 80]);
        N(r, GEO.prism, '#dcebf8', [0, 0, -30], [44, 22, 140], [0, PI / 2, 0]);
        for (let i = 0; i < 5; i++) N(r, GEO.box, '#c8dcef', [-10 + i * 6, 11.1, -19], [.5, .05, 31], [.785, 0, 0]);
        N(r, GEO.prism, '#cfe3f5', [-30, 0, -38], [40, 28, 40], [0, PI / 2, 0]);
        for (const [x, z, s] of [[-50, -70, 30], [40, -75, 34]]) M.mountain(r, x, z, s);
        for (let i = 0; i < 6; i++) { const z = -11 - i * 3, y = -8 - z; N(r, GEO.cyl, i % 2 ? '#2b6cd4' : '#d43b3b', [3 + (i % 2 ? 2 : -2), y + .7, z], [.06, 1.6, .06]); N(r, GEO.box, i % 2 ? '#2b6cd4' : '#d43b3b', [3 + (i % 2 ? 2 : -2) + .3, y + 1.3, z], [.6, .4, .03]); }
        // ski lift
        const A = [-12, 5.5, -6.5], B = [-4, 26, -29];
        for (let k = 0; k <= 3; k++) { const p = A.map((a, i) => a + (B[i] - a) * k / 3); const gy = Math.max(0, -8 - p[2]); N(r, GEO.cyl, '#555', [p[0], (p[1] + gy) / 2, p[2]], [.18, p[1] - gy, .18]); N(r, GEO.box, '#555', [p[0], p[1], p[2]], [1.6, .15, .15]); }
        const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], len = Math.hypot(...d);
        N(r, GEO.box, '#333', [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], [len, .06, .06], [0, Math.atan2(-d[2], d[0]), Math.atan2(d[1], Math.hypot(d[0], d[2]))]);
        const chairs = [0, 1, 2, 3, 4].map(() => { const c = Grp(r); N(c, GEO.cyl, '#333', [0, -.6, 0], [.04, 1.2, .04]); N(c, GEO.box, '#d43b3b', [0, -1.3, 0], [1, .15, .8]); N(c, GEO.box, '#d43b3b', [0, -.95, -.35], [1, .7, .1]); return c; });
        ctx.anim.push(t => chairs.forEach((c, i) => { const k = (t * .03 + i / 5) % 1; c.pos = A.map((a, j) => a + (B[j] - a) * k); c.rot[1] = Math.atan2(-d[2], d[0]) + PI / 2; }));
        // lodge
        const lodge = M.building(r, { x: 9, z: -10.5, w: 9, h: 5, d: 6, wall: '#9b6a3b', wallTex: M.logTex('#9b6a3b'), roof: '#d43b3b', sign: 'Ski Lodge', signColor: '#5a3216' });
        door(ctx, lodge.door, 'Ski Lodge', 'lodge', [0, 8], lodge.walk, lodge.nodes);
        N(r, GEO.box, '#7d828c', [12, 6, -11], [1.2, 3, 1.2]);
        const smoke = [0, 1, 2].map(() => N(r, GEO.lowSphere, '#ffffff', [12, 8, -11], .5, [0, 0, 0], { a: .5 }));
        ctx.anim.push(t => smoke.forEach((s, i) => { const k = (t * .25 + i / 3) % 1; s.pos = [12 + k * 1.5, 7.6 + k * 4, -11]; s.alpha = .5 * (1 - k); s.scl = [.5 + k, .5 + k, .5 + k]; }));
        const sled = Grp(r, [14.5, 0, -6.5], [0, -.4, .25]); N(sled, GEO.box, '#d43b3b', [0, .5, 0], [1, .15, 2.2]); N(sled, GEO.torusThin, '#888', [0, .55, 1.1], [.5, .5, .5], [0, 0, PI / 2]);
        // targets
        for (const [x, z] of this.targets) { const t2 = M.snowTarget(); t2.pos = [x, 0, z]; r.add(t2); }
        M.label(r, [-1, 4.2, -6.6], 'TARGET PRACTICE', 5, .8, '#d43b3b', '#ffffff');
        for (const [x, z, s] of [[-17, -2, 1.1], [-16.5, 5, 1], [-20, 9, 1.3], [17, -2, 1], [18.5, 6, 1.2], [-9, -12, 1.2], [-15, -14, 1.4], [20, -14, 1.3], [-3, -15, 1], [1, -19, 1.1]]) M.tree(r, x, z, s);
        const s = M.sign(r, -14.5, 1, '← Town', .5); door(ctx, s.box, 'Back to Town', 'town', [13, 3], [-13.5, 2], [s.node]);
      },
    },

    // ================================================================ SKI LODGE (interior)
    lodge: {
      name: 'Ski Lodge', emoji: '🏂', bounds: [-14.5, 15, -5.5, 8.8], spawn: [0, 7], env: IN,
      build(ctx) {
        const r = ctx.root;
        interiorShell(ctx, { wall: '#9b6a3b', wallTex: M.logTex('#9b6a3b'), floor: M.woodTex('#8b5a2b', '#5a3216', 'lodge'), exitTo: 'skihill', exitAt: [9, -6.5] });
        const fp = M.furniture('fireplace'); fp.pos = [0, 0, -9.4]; fp.scl = [1.5, 1.5, 1.5]; r.add(fp); ctx.anim.push(fp.anim);
        N(r, GEO.cyl, '#5a3216', [0, 6.2, -9.1], [.15, 2, .15], [0, 0, PI / 2]);
        for (const sx of [-1, 1]) N(r, GEO.cone, '#e9dcc0', [sx * .9, 6.7, -9.1], [.12, 1.1, .12], [0, 0, -sx * .9]);
        const rug = M.furniture('rug_red'); rug.pos = [0, 0, -4]; rug.scl = [1.8, 1, 1.5]; r.add(rug);
        for (const [x, ry] of [[-5.2, PI * .75], [5.2, -PI * .75]]) { const so = M.furniture('sofa'); so.pos = [x, 0, -3.6]; so.rot = [0, ry, 0]; r.add(so); }
        const ct = M.furniture('table'); ct.pos = [0, 0, -2.5]; ct.scl = [.9, .7, .9]; r.add(ct); M.mug(r, -.3, .98, -2.5); M.mug(r, .4, .98, -2.2, '#d43b3b');
        M.windowBox(r, -8.5, 5, -10, 3.5, 2.6, false); M.windowBox(r, 8.5, 5, -10, 3.5, 2.6, false);
        // ski rack
        N(r, GEO.box, '#5a3216', [-15.9, 1.5, -4], [.3, .2, 6]); N(r, GEO.box, '#5a3216', [-15.9, 3.5, -4], [.3, .2, 6]);
        for (let i = 0; i < 6; i++) N(r, GEO.box, ['#d43b3b', '#2b6cd4', '#ffd23f', '#2fa84f', '#ff7f2a', '#8e44ad'][i], [-15.6, 2.4, -6.3 + i * .9], [.08, 4.2, .25], [0, 0, -.12]);
        // trophy shelf
        N(r, GEO.box, '#5a3216', [-9.5, 2.8, -9.9], [5, .2, .9]);
        for (let i = 0; i < 3; i++) { const tr = M.furniture('trophy'); tr.pos = [-11.2 + i * 1.7, 2.9, -9.85]; tr.scl = [.6, .6, .6]; r.add(tr); }
        M.pictureFrame(r, 9.5, 2.5, -10, 3.2, 1.6, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d43b3b'; x.lineWidth = 6; x.beginPath(); x.moveTo(20, h - 20); x.bezierCurveTo(80, 20, 140, h, w - 20, 20); x.stroke(); x.fillStyle = '#2e8b57'; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(15 + i * 25, h - 10); x.lineTo(25 + i * 25, h - 35); x.lineTo(35 + i * 25, h - 10); x.fill(); } }, 'trail');
        // Sled Race gate
        const gate = Grp(r, [12.5, 0, -2]);
        for (const sx of [-1.6, 1.6]) N(gate, GEO.box, '#5a3216', [sx, 2.2, 0], [.4, 4.4, .4]);
        N(gate, GEO.box, '#d43b3b', [0, 4.6, 0], [4, .9, .3]);
        N(gate, GEO.plane, '#ffffff', [0, 4.6, .16], [3.8, .8, 1], [0, 0, 0], { tex: textTex('SLED RACE ▶', '#d43b3b', '#ffffff') });
        const glow = N(gate, GEO.plane, '#bfe6ff', [0, 2, .02], [2.8, 4, 1], [0, 0, 0], { e: .9, a: .7 });
        ctx.anim.push(t => glow.alpha = .55 + Math.sin(t * 3) * .2);
        spot(ctx, [10.5, 0, -3, 14.5, 5, -1], 'Start the Sled Race!', 'sled', [12.5, -.2], [gate]);
        // tables, lanterns, boots
        const tb = M.furniture('table'); tb.pos = [-10, 0, 4]; r.add(tb);
        for (const [dx, ry] of [[-1.7, PI / 2], [1.7, -PI / 2]]) { const c = M.furniture('chair'); c.pos = [-10 + dx, 0, 4]; c.rot = [0, ry, 0]; c.scl = [.85, .85, .85]; r.add(c); }
        M.mug(r, -10, 1.37, 4);
        for (let i = 0; i < 4; i++) { N(r, GEO.box, ['#d43b3b', '#2b6cd4', '#ffd23f', '#2fa84f'][i], [3 + i * 1.1, .3, 8.6], [.4, .6, .7]); N(r, GEO.box, '#ffffff', [3 + i * 1.1, .62, 8.6], [.42, .1, .72]); }
        M.hangingLamp(r, -6, -4, 7, '#d43b3b'); M.hangingLamp(r, 6, -4, 7, '#d43b3b'); M.hangingLamp(r, -10, 4, 7, '#d43b3b');
        for (const [x, z] of [[14.5, 7.5], [-14.5, 7.5]]) { const pl = M.furniture('plant'); pl.pos = [x, 0, z]; r.add(pl); }
      },
    },

    // ================================================================ DOCK
    dock: {
      name: 'The Dock', emoji: '⚓', bounds: [-15, 15, -.8, 8.5], spawn: [12, 4], outdoor: true, env: OUT,
      build(ctx) {
        const r = ctx.root;
        N(r, GEO.box, '#2f86d0', [0, -.9, -25], [160, 1, 80]);
        N(r, GEO.box, '#ffffff', [0, -.3, 1.5], [36.5, .6, 17.5], [0, 0, 0], { tex: M.woodTex('#a7703f', '#7d5129', 'dock') });
        for (let x = -16; x <= 16; x += 4) N(r, GEO.cyl, '#6b4423', [x, .1, -7.3], [.35, 2, .35]);
        for (const [x, z, s] of [[-12, -22, 1.6], [14, -26, 1.3], [1, -38, 2.2], [-28, -30, 2]]) M.iceberg(r, x, z, s);
        for (const [x, z, s] of [[-50, -80, 30], [10, -90, 36], [55, -70, 26]]) M.mountain(r, x, z, s);
        const glints = [];
        for (let i = 0; i < 18; i++) glints.push(N(r, GEO.lowSphere, '#ffffff', [0, -.38, 0], [.8, .03, .12], [0, 0, 0], { a: .6 }));
        ctx.anim.push(t => glints.forEach((g, i) => { g.pos[0] = ((i * 13.7 + t * 1.5) % 50) - 25; g.pos[2] = -9 - (i * 7.3) % 28; }));
        const boat = Grp(r, [7, -.2, -13]);
        N(boat, GEO.box, '#d43b3b', [0, .5, 0], [5.5, 1.3, 2.3]); N(boat, GEO.box, '#ffffff', [0, 1.2, 0], [5.6, .15, 2.4]);
        N(boat, GEO.box, '#ffffff', [-.6, 1.9, 0], [2, 1.3, 1.7]); N(boat, GEO.box, '#bfe6ff', [-.6, 2, .86], [1.4, .5, .05], [0, 0, 0], { e: .3 });
        N(boat, GEO.cyl, '#6b4423', [1.4, 3, 0], [.08, 4, .08]); const flag = N(boat, GEO.box, '#ffd23f', [1.9, 4.6, 0], [1, .6, .04]);
        ctx.anim.push(t => { boat.pos[1] = -.2 + Math.sin(t * 1.5) * .15; boat.rot[2] = Math.sin(t * 1.2) * .04; flag.rot[1] = Math.sin(t * 3) * .3; });
        const hut = M.building(r, { x: -9, z: -4.3, w: 7, h: 4.4, d: 4.6, wall: '#5cb6e8', roof: '#ffffff', sign: 'Fishing Hut', signColor: '#2a6fa8', lit: true, roofH: 2 });
        door(ctx, hut.door, 'Fishing Hut', 'fishhut', [0, 8], hut.walk, hut.nodes);
        for (const [x, z, ry] of [[9, -5, .3], [10.5, -5.5, -.2], [9.7, -4.3, 0]]) M.crate(r, x, z, .9, ry);
        M.barrel(r, 12.8, -5.3); M.barrel(r, 13.9, -4.4, .9);
        N(r, GEO.torus, '#e0c080', [4.5, .25, -5.5], [.8, 1.5, .8]); N(r, GEO.torus, '#e0c080', [4.5, .55, -5.5], [.65, 1.5, .65]);
        let s = M.sign(r, 14.5, 2.5, 'Town →', -.5); door(ctx, s.box, 'To Town', 'town', [-13, 3], [13.5, 3], [s.node]);
        s = M.sign(r, -14.5, 6.5, '← Beach', .5); door(ctx, s.box, 'To the Beach', 'beach', [13, 5], [-13.5, 6.5], [s.node]);
      },
    },

    // ================================================================ FISHING HUT (interior)
    fishhut: {
      name: 'Fishing Hut', emoji: '🎣', bounds: [-15, 15, -5.5, 8.8], spawn: [0, 7], env: IN,
      build(ctx) {
        const r = ctx.root;
        interiorShell(ctx, { wall: '#5cb6e8', wallTex: M.woodTex('#5cb6e8', '#3f8fc2', 'hut'), floor: M.woodTex('#b07a45', '#7d5129', 'hutfloor'), exitTo: 'dock', exitAt: [-9, 0.2] });
        // ice hole
        N(r, GEO.disc, '#0f3e73', [-1, .02, 1.5], [1.9, .05, 1.9]);
        N(r, GEO.torus, '#f4faff', [-1, .05, 1.5], [1.9, .7, 1.9]);
        const bob = Grp(r, [-.6, .1, 1.3]); N(bob, GEO.sphere, '#d43b3b', [0, .12, 0], .16); N(bob, GEO.sphere, '#ffffff', [0, .25, 0], [.15, .08, .15]);
        ctx.anim.push(t => { bob.pos[1] = .05 + Math.sin(t * 3) * .05; });
        N(r, GEO.cyl, '#6b3f1f', [-2.4, 1.3, .5], [.05, 3, .05], [.5, 0, .4]);
        M.label(r, [-1, 6, -10], 'ICE FISHING', 5, 1, '#2a6fa8', '#ffffff');
        spot(ctx, [-3.2, 0, -.7, 1.2, 1.5, 3.7], 'Go Ice Fishing!', 'fish', [-1, 4.2], [bob]);
        // net on the wall
        const net = paintTex('net', 256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#e0c080'; x.lineWidth = 3; for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(i * 22, 0); x.lineTo(i * 22 - 30, h); x.stroke(); x.beginPath(); x.moveTo(i * 22 - 30, 0); x.lineTo(i * 22, h); x.stroke(); } });
        net.transparent = true;
        N(r, GEO.plane, '#ffffff', [8, 5, -10], [6, 4, 1], [0, 0, 0], { tex: net });
        for (let i = 0; i < 4; i++) N(r, GEO.sphere, '#ff7f2a', [6.2 + i * 1.2, 4.2 + (i % 2) * .8, -9.95], [.4, .2, .08]);
        // rods
        for (let i = 0; i < 4; i++) { N(r, GEO.cyl, '#6b3f1f', [-14 + i * .7, 2.8, -9.6], [.06, 5.6, .06], [0, 0, .12]); N(r, GEO.cyl, '#999', [-14.2 + i * .7, 1.3, -9.5], [.15, .15, .15], [PI / 2, 0, 0]); }
        // buckets with fish
        for (const [x, z] of [[-11, -7], [-9.5, -7.6]]) { N(r, GEO.cup, '#9aa4ad', [x, .5, z], [.6, 1, .6]); for (let k = 0; k < 3; k++) N(r, GEO.sphere, '#ff7f2a', [x - .2 + k * .2, 1.1, z], [.12, .35, .08], [0, 0, (k - 1) * .4]); }
        M.barrel(r, 13.5, -8); M.barrel(r, 14.5, -6.5, .9); M.crate(r, 12, -8.5); M.crate(r, 14.3, 6.5, .9, .4);
        // stove
        N(r, GEO.box, '#2b2b33', [5, 1, -8.7], [2, 2, 1.6]); N(r, GEO.box, '#ff7f2a', [5, .9, -7.88], [1, .6, .05], [0, 0, 0], { e: .9 });
        N(r, GEO.cyl, '#333', [5, 5.5, -9], [.25, 7, .25]); N(r, GEO.sphere, '#c0c6cc', [5.3, 2.35, -8.6], [.45, .35, .45]); N(r, GEO.cyl, '#c0c6cc', [5.8, 2.45, -8.6], [.06, .45, .06], [0, 0, -1]);
        // lantern, life ring, window, table
        N(r, GEO.cyl, '#333', [-6, 8, -2], [.03, 2, .03]); N(r, GEO.cyl, '#ffd23f', [-6, 6.8, -2], [.3, .6, .3], [0, 0, 0], { e: .9 }); N(r, GEO.cone8, '#333', [-6, 7.25, -2], [.35, .3, .35]);
        N(r, GEO.torus, '#d43b3b', [-16, 5, 3], [1, 1, 1], [0, 0, PI / 2]);
        M.windowBox(r, -5, 5, -10, 3, 2, false);
        const tb = M.furniture('table'); tb.pos = [8, 0, 3.5]; r.add(tb);
        N(r, GEO.plane, '#ffffff', [8, 1.39, 3.5], [1.6, 1.1, 1], [-PI / 2, 0, .2], { tex: paintTex('chart', 160, 110, (x, w, h) => { x.fillStyle = '#f3e1c0'; x.fillRect(0, 0, w, h); x.fillStyle = '#5fb1ec'; x.fillRect(10, 10, w - 20, h - 20); x.fillStyle = '#f2e3c2'; x.beginPath(); x.arc(70, 55, 25, 0, 7); x.fill(); x.fillStyle = '#d43b3b'; x.font = 'bold 20px Arial'; x.fillText('X', 62, 62); }) });
        const bn = M.furniture('bench'); bn.pos = [8, 0, 6.3]; bn.rot = [0, PI, 0]; bn.scl = [.8, .8, .8]; r.add(bn);
      },
    },

    // ================================================================ BEACH
    beach: {
      name: 'Snowy Beach', emoji: '🏖️', bounds: [-15, 15, -3.5, 8.5], spawn: [12, 5], outdoor: true,
      env: { clear: '#ffc79a', fog: '#ffd9b8', fogNear: 50, fogFar: 140, ground: [.85, .78, .7] },
      build(ctx) {
        const r = ctx.root;
        N(r, GEO.box, '#2f86d0', [0, -.75, -40], [170, 1, 80]);
        N(r, GEO.box, '#f2e3c2', [0, -.5, 13], [170, 1, 38]);
        const foam = [0, 1, 2].map(i => N(r, GEO.box, '#ffffff', [0, -.2, -6.2], [170, .1, .5], [0, 0, 0], { a: .7 }));
        ctx.anim.push(t => foam.forEach((f, i) => { f.pos[2] = -6.3 - ((t * .3 + i / 3) % 1) * 2.5; f.alpha = .7 * (1 - ((t * .3 + i / 3) % 1)); }));
        for (const [x, z, s] of [[-12, 4, 1.3], [8, 6, 1], [-3, 8, 1.5], [13, 1, 1]]) N(r, GEO.disc, '#ffffff', [x, .02, z], [s * 1.8, .03, s]);
        N(r, GEO.sphere, '#ffd76a', [-45, 26, -100], 9, [0, 0, 0], { e: 1 });
        M.iceberg(r, -8, -18, 1.5); M.iceberg(r, 20, -30, 2);
        // lighthouse
        const lh = Grp(r, [10, 0, -8.5]);
        for (const [x, z, s] of [[-2, 1, 1.5], [2, .5, 1.3], [0, -2, 1.8]]) N(lh, GEO.sphere, '#8a8f99', [x, 0, z], [s * 1.4, s * .7, s]);
        for (let i = 0; i < 6; i++) N(lh, GEO.cyl, i % 2 ? '#d43b3b' : '#ffffff', [0, 1 + i * 2, 0], [2.2 - i * .15, 2, 2.2 - i * .15]);
        N(lh, GEO.torus, '#333', [0, 12, 0], [1.9, 1, 1.9]);
        N(lh, GEO.cyl, '#ffe14f', [0, 13, 0], [1.2, 2, 1.2], [0, 0, 0], { e: .9 });
        N(lh, GEO.cone, '#d43b3b', [0, 14.8, 0], [1.6, 1.7, 1.6]);
        const beam = Grp(lh, [0, 13, 0]); N(beam, GEO.cone, '#fff3b0', [0, -9, 0], [2.5, 18, 2.5], [0, 0, 0], { a: .15, e: 1 }); beam.rot = [0, 0, PI / 2];
        ctx.anim.push(t => { beam.rot[1] = t * .8; });
        N(lh, GEO.box, '#6b3f1f', [0, 1.4, 2.2], [1.5, 2.8, .3]); N(lh, GEO.box, '#5a3216', [0, 3, 2.25], [1.8, .25, .35]);
        door(ctx, [7.6, 0, -11, 12.4, 15.5, -5.5], 'Lighthouse', 'lighthouse', [0, 8], [10, -3.3], [lh]);
        // umbrella, towels, chairs
        N(r, GEO.cyl, '#ffffff', [-5, 1.6, 2], [.08, 3.2, .08]);
        N(r, GEO.cone, '#d43b3b', [-5, 3.4, 2], [2.4, .9, 2.4]); N(r, GEO.cone, '#ffffff', [-5, 3.55, 2], [1.4, .62, 1.4]);
        N(r, GEO.box, '#3aa7ff', [-3.8, .04, 3.4], [1.3, .06, 2.6]); N(r, GEO.box, '#ffffff', [-3.8, .05, 3.4], [1.3, .06, .3]);
        const lc = Grp(r, [-7, 0, 3.6], [0, .2, 0]); N(lc, GEO.box, '#ffd23f', [0, .6, .3], [1.1, .12, 2]); N(lc, GEO.box, '#ffd23f', [0, 1.2, -.9], [1.1, .12, 1.4], [-.9, 0, 0]);
        // snow castle
        const sc = Grp(r, [-11, 0, -1.5]);
        N(sc, GEO.box, '#ffffff', [0, .6, 0], [3, 1.2, 2]);
        for (const [x, z] of [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]]) { N(sc, GEO.cyl, '#ffffff', [x, 1, z], [.45, 2, .45]); N(sc, GEO.cone8, '#e3f0fb', [x, 2.4, z], [.55, .8, .55]); }
        N(sc, GEO.box, '#d43b3b', [0, 2.6, 0], [.6, .4, .03]); N(sc, GEO.cyl, '#6b3f1f', [-.3, 2, 0], [.03, 1.6, .03]);
        let s = M.sign(r, 14.5, 4, 'Dock →', -.5); door(ctx, s.box, 'To the Dock', 'dock', [-12, 6.5], [13.5, 4.5], [s.node]);
        s = M.sign(r, -14.5, 1, '← Town', .5); door(ctx, s.box, 'To Town', 'town', [6, 7], [-13.5, 1.5], [s.node]);
      },
    },

    // ================================================================ LIGHTHOUSE (interior)
    lighthouse: {
      name: 'Lighthouse', emoji: '🗼', bounds: [-12, 12, -5.5, 8.8], spawn: [0, 7], env: IN,
      build(ctx) {
        const r = ctx.root;
        N(r, GEO.box, '#ffffff', [0, -.5, 0], [34, 1, 22], [0, 0, 0], { tex: M.brickTex('#9aa0a8', '#7d828c', 'lhfloor') });
        const wall = M.brickTex('#efe8da', '#cfc4ae', 'lhwall');
        for (let a = 190; a <= 350; a += 10) {
          const ang = a * PI / 180, x = Math.cos(ang) * 14, z = Math.sin(ang) * 11;
          N(r, GEO.box, '#ffffff', [x, 5, z], [2.6, 10, .8], [0, -ang - PI / 2, 0], { tex: wall });
          N(r, GEO.box, '#d43b3b', [x * .98, 7.5, z * .98], [2.6, .8, .85], [0, -ang - PI / 2, 0]);
        }
        const ex = M.exitMat(r); door(ctx, ex, 'Exit', 'beach', [10, -3.6], [0, 8.8]);
        // spiral stairs & lamp
        N(r, GEO.cyl, '#6b6f78', [6, 5, -5], [.35, 10, .35]);
        for (let i = 0; i < 22; i++) { const a = i * .5; N(r, GEO.box, '#8b5a2b', [6 + Math.cos(a) * 1.4, .3 + i * .42, -5 + Math.sin(a) * 1.4], [2.4, .15, .9], [0, -a, 0]); }
        N(r, GEO.cyl, '#333', [6, 9.8, -5], [2.5, .2, 2.5]);
        const lamp = N(r, GEO.sphere, '#ffe14f', [6, 11, -5], 1.2, [0, 0, 0], { e: 1 });
        N(r, GEO.torus, '#c0c6cc', [6, 11, -5], [1.4, 1.5, 1.4]);
        ctx.anim.push(t => { lamp.boost = .3 + Math.sin(t * 2) * .3; });
        // map table
        const tb = M.furniture('table'); tb.pos = [-6, 0, -2]; tb.scl = [1.2, 1, 1.2]; r.add(tb);
        N(r, GEO.plane, '#ffffff', [-6, 1.39, -2], [2.2, 1.5, 1], [-PI / 2, 0, -.15], { tex: paintTex('seamap', 220, 150, (x, w, h) => { x.fillStyle = '#f3e1c0'; x.fillRect(0, 0, w, h); x.fillStyle = '#7fb6e0'; x.fillRect(8, 8, w - 16, h - 16); x.fillStyle = '#f2e3c2'; x.beginPath(); x.ellipse(110, 75, 50, 30, .3, 0, 7); x.fill(); x.strokeStyle = '#d43b3b'; x.setLineDash([5, 4]); x.lineWidth = 3; x.beginPath(); x.moveTo(20, 130); x.quadraticCurveTo(80, 20, 150, 60); x.stroke(); }) });
        // telescope
        const ts = Grp(r, [-9.5, 0, -6.5]);
        for (const a of [0, 2.1, 4.2]) N(ts, GEO.cyl, '#6b3f1f', [Math.cos(a) * .4, 1, Math.sin(a) * .4], [.05, 2.1, .05], [Math.sin(a) * .2, 0, -Math.cos(a) * .2]);
        N(ts, GEO.cyl, '#c9a23a', [0, 2.2, -.3], [.18, 1.8, .18], [-1.1, 0, 0]);
        // shelves with oil cans and a ship in a bottle
        N(r, GEO.box, '#6b3f1f', [-1, 2.5, -10.2], [5, .2, 1], [0, 0, 0]);
        N(r, GEO.box, '#6b3f1f', [-1, 4.3, -10.2], [5, .2, 1], [0, 0, 0]);
        for (let i = 0; i < 4; i++) N(r, GEO.cyl, '#d43b3b', [-2.8 + i * 1.1, 3, -10.1], [.3, .8, .3]);
        N(r, GEO.cyl, '#bfe6ff', [-1, 4.8, -10.1], [.35, 1, .35], [0, 0, PI / 2], { a: .5 }); N(r, GEO.box, '#8b5a2b', [-1, 4.7, -10.1], [.6, .15, .2]); N(r, GEO.box, '#ffffff', [-1, 4.9, -10.1], [.2, .3, .02]);
        // desk with logbook
        N(r, GEO.box, '#7a4a24', [-8, 1.2, 3.5], [3, .2, 1.6]); for (const [a, b] of [[-1.3, -.6], [1.3, -.6], [-1.3, .6], [1.3, .6]]) N(r, GEO.box, '#5a3216', [-8 + a, .55, 3.5 + b], [.15, 1.1, .15]);
        N(r, GEO.box, '#2b6cd4', [-8.4, 1.4, 3.5], [.9, .15, 1.2]); N(r, GEO.cyl, '#ffd23f', [-7.4, 1.55, 3.3], [.15, .5, .15], [0, 0, 0], { e: .8 });
        const ch = M.furniture('chair'); ch.pos = [-8, 0, 5]; ch.rot = [0, PI, 0]; ch.scl = [.85, .85, .85]; r.add(ch);
        M.barrel(r, 9.5, 4); M.barrel(r, 10.6, 5.3, .85);
        N(r, GEO.torus, '#d43b3b', [11.8, 4, -4], [1, 1, 1], [0, .9, PI / 2]);
        M.hangingLamp(r, -6, -2, 7.5); M.hangingLamp(r, -1, 4, 7.5);
      },
    },
  };

  // ================================================================ HOMES
  function buildHome(ctx, home) {
    const r = ctx.root;
    const wall = S.WALLS[home.wall] || S.WALLS[0];
    N(r, GEO.box, '#ffffff', [0, -.5, 0], [34, 1, 22], [0, 0, 0], { tex: M.floorTex(home.floor) });
    if (home.type === 'cabin') {
      const lt = M.logTex(wall);
      N(r, GEO.box, wall, [0, 4.5, -10.6], [34, 9, 1], [0, 0, 0], { tex: lt });
      for (const sx of [-1, 1]) N(r, GEO.box, wall, [16.6 * sx, 4.5, 0], [1, 9, 22.2], [0, 0, 0], { tex: lt });
      M.windowBox(r, -7, 5, -10, 3.2, 2.4, false); M.windowBox(r, 7, 5, -10, 3.2, 2.4, false);
      for (const z of [-8, -3, 2]) N(r, GEO.box, M.shadeHex(wall, -40), [0, 9.2, z], [33, .5, .5]);
    } else if (home.type === 'castle') {
      const st = M.brickTex(M.shadeHex(wall, -10), M.shadeHex(wall, -45), 'castle');
      N(r, GEO.box, '#ffffff', [0, 5.5, -10.6], [34, 11, 1], [0, 0, 0], { tex: st });
      for (const sx of [-1, 1]) N(r, GEO.box, '#ffffff', [16.6 * sx, 5.5, 0], [1, 11, 22.2], [0, 0, 0], { tex: st });
      for (let i = 0; i < 9; i++) N(r, GEO.box, M.shadeHex(wall, -20), [-16 + i * 4, 11.5, -10.6], [1.8, 1.2, 1.1]);
      for (const sx of [-1, 1]) { N(r, GEO.cyl, '#ffffff', [15 * sx, 6.5, -9.5], [2.2, 13, 2.2], [0, 0, 0], { tex: st }); N(r, GEO.cone, '#2b6cd4', [15 * sx, 14.5, -9.5], [2.6, 3, 2.6]); }
      for (const x of [-6, 6]) { N(r, GEO.box, '#d43b3b', [x, 6.5, -10], [2, 4, .08]); N(r, GEO.cone, '#d43b3b', [x, 4.2, -10], [1, .6, .08], [PI, 0, 0]); N(r, GEO.sphere, '#ffd23f', [x, 7, -9.9], [.5, .5, .05]); }
      M.windowBox(r, 0, 6, -10, 2, 3, true);
    } else {
      const ice = M.brickTex(wall, M.shadeHex(wall, -35), 'igloo');
      N(r, GEO.halfDome, '#ffffff', [0, 0, 0], [16.8, 11, 10.8], [0, 0, 0], { tex: ice });
    }
    const ex = M.exitMat(r); door(ctx, ex, 'Leave home', 'town', [-6, 7], [0, 8.8]);
    ctx.furn = [];
    home.items.forEach((it, i) => {
      const f = M.furniture(it.f); f.pos = [it.x, 0, it.z]; f.rot = [0, it.r * PI / 4, 0]; r.add(f);
      if (f.anim) ctx.anim.push(f.anim);
      const s = (M.FURN_SIZE[it.f] || 1.5) / 2, h = M.FURN_H[it.f] || 2;
      ctx.furn.push({ node: f, i, box: [it.x - s, 0, it.z - s, it.x + s, h, it.z + s] });
    });
  }
  const HOME_DEF = { name: 'Home', emoji: '🏠', bounds: [-13, 13, -7, 8.8], spawn: [0, 6], env: { ...IN, clear: '#33405a', fog: '#33405a' } };

  root.Rooms = { ROOMS, buildHome, HOME_DEF };
})(window);
