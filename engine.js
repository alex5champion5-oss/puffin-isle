// =====================================================================
//  Tiny 3D engine for Puffin Isle (WebGL 1, no libraries)
// =====================================================================
(function (root) {
  // ---------------------------------------------------------------- math
  const M4 = {
    ident() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        o[i * 4 + j] = a[j] * b[i * 4] + a[4 + j] * b[i * 4 + 1] + a[8 + j] * b[i * 4 + 2] + a[12 + j] * b[i * 4 + 3];
      }
      return o;
    },
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (near - far); m[11] = -1; m[14] = 2 * far * near / (near - far);
      return m;
    },
    lookAt(e, t, up = [0, 1, 0]) {
      let z = [e[0] - t[0], e[1] - t[1], e[2] - t[2]]; z = norm(z);
      let x = norm(cross(up, z)); const y = cross(z, x);
      const m = new Float32Array(16);
      m[0] = x[0]; m[1] = y[0]; m[2] = z[0];
      m[4] = x[1]; m[5] = y[1]; m[6] = z[1];
      m[8] = x[2]; m[9] = y[2]; m[10] = z[2];
      m[12] = -dot(x, e); m[13] = -dot(y, e); m[14] = -dot(z, e); m[15] = 1;
      return m;
    },
    // T * Ry * Rx * Rz * S
    trs(p, r, s) {
      const cy = Math.cos(r[1]), sy = Math.sin(r[1]), cx = Math.cos(r[0]), sx = Math.sin(r[0]), cz = Math.cos(r[2]), sz = Math.sin(r[2]);
      const r00 = cy * cz + sy * sx * sz, r01 = -cy * sz + sy * sx * cz, r02 = sy * cx;
      const r10 = cx * sz, r11 = cx * cz, r12 = -sx;
      const r20 = -sy * cz + cy * sx * sz, r21 = sy * sz + cy * sx * cz, r22 = cy * cx;
      const m = new Float32Array(16);
      m[0] = r00 * s[0]; m[1] = r10 * s[0]; m[2] = r20 * s[0];
      m[4] = r01 * s[1]; m[5] = r11 * s[1]; m[6] = r21 * s[1];
      m[8] = r02 * s[2]; m[9] = r12 * s[2]; m[10] = r22 * s[2];
      m[12] = p[0]; m[13] = p[1]; m[14] = p[2]; m[15] = 1;
      return m;
    },
    invert(a) {
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) return null; det = 1 / det;
      const o = new Float32Array(16);
      o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return o;
    },
    normalMat(m) { // inverse-transpose of upper 3x3, column-major
      const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
      const C00 = e * i - f * h, C01 = -(d * i - f * g), C02 = d * h - e * g;
      const C10 = -(b * i - c * h), C11 = a * i - c * g, C12 = -(a * h - b * g);
      const C20 = b * f - c * e, C21 = -(a * f - c * d), C22 = a * e - b * d;
      let det = a * C00 + b * C01 + c * C02; det = det ? 1 / det : 1;
      return new Float32Array([C00 * det, C10 * det, C20 * det, C01 * det, C11 * det, C21 * det, C02 * det, C12 * det, C22 * det]);
    },
    xform(m, v) { // v = [x,y,z,w]
      return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3], m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]];
    },
  };
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  // ---------------------------------------------------------------- geometry
  function geo(pos, nrm, uv, idx) { return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), uv: new Float32Array(uv), idx: new Uint16Array(idx), id: ++geo.n }; }
  geo.n = 0;
  function box() {
    const P = [], N = [], U = [], I = [];
    const faces = [[[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
      [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
    for (const [n, u, v] of faces) {
      const b = P.length / 3;
      for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P.push(n[0] * .5 + u[0] * .5 * su + v[0] * .5 * sv, n[1] * .5 + u[1] * .5 * su + v[1] * .5 * sv, n[2] * .5 + u[2] * .5 * su + v[2] * .5 * sv);
        N.push(...n); U.push((su + 1) / 2, (sv + 1) / 2);
      }
      I.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    return geo(P, N, U, I);
  }
  function sphere(seg = 18, rings = 12) {
    const P = [], N = [], U = [], I = [];
    for (let r = 0; r <= rings; r++) {
      const th = r / rings * Math.PI;
      for (let s = 0; s <= seg; s++) {
        const ph = s / seg * Math.PI * 2;
        const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        P.push(x, y, z); N.push(x, y, z); U.push(s / seg, 1 - r / rings);
      }
    }
    for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) {
      const a = r * (seg + 1) + s, b = a + seg + 1;
      I.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return geo(P, N, U, I);
  }
  function cyl(rt = 1, rb = 1, seg = 20) {
    const P = [], N = [], U = [], I = [];
    for (let s = 0; s <= seg; s++) {
      const ph = s / seg * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph);
      const n = norm([c, rb - rt, sn]);
      P.push(c * rt, .5, sn * rt); N.push(...n); U.push(s / seg, 1);
      P.push(c * rb, -.5, sn * rb); N.push(...n); U.push(s / seg, 0);
    }
    for (let s = 0; s < seg; s++) { const a = s * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    for (const [y, r, ny] of [[.5, rt, 1], [-.5, rb, -1]]) {
      if (r <= 0) continue;
      const c0 = P.length / 3; P.push(0, y, 0); N.push(0, ny, 0); U.push(.5, .5);
      for (let s = 0; s <= seg; s++) { const ph = s / seg * Math.PI * 2; P.push(Math.cos(ph) * r, y, Math.sin(ph) * r); N.push(0, ny, 0); U.push(.5 + Math.cos(ph) / 2, .5 + Math.sin(ph) / 2); }
      for (let s = 0; s < seg; s++) I.push(c0, c0 + 1 + s, c0 + 2 + s);
    }
    return geo(P, N, U, I);
  }
  function plane() { // vertical quad in XY facing +Z
    return geo([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1], [0, 1, 2, 0, 2, 3]);
  }
  function prism() { // triangle (-.5,0) (.5,0) (0,1) in XY, extruded z -.5..+.5
    const P = [], N = [], U = [], I = [];
    const quad = (a, b, c, d, n) => { const s = P.length / 3; P.push(...a, ...b, ...c, ...d); for (let i = 0; i < 4; i++) N.push(...n); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(s, s + 1, s + 2, s, s + 2, s + 3); };
    const tri = (a, b, c, n) => { const s = P.length / 3; P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) N.push(...n); U.push(0, 0, 1, 0, .5, 1); I.push(s, s + 1, s + 2); };
    tri([-.5, 0, .5], [.5, 0, .5], [0, 1, .5], [0, 0, 1]);
    tri([-.5, 0, -.5], [.5, 0, -.5], [0, 1, -.5], [0, 0, -1]);
    quad([-.5, 0, -.5], [.5, 0, -.5], [.5, 0, .5], [-.5, 0, .5], [0, -1, 0]);
    quad([-.5, 0, .5], [0, 1, .5], [0, 1, -.5], [-.5, 0, -.5], norm([-1, .5, 0]));
    quad([.5, 0, .5], [0, 1, .5], [0, 1, -.5], [.5, 0, -.5], norm([1, .5, 0]));
    return geo(P, N, U, I);
  }
  function torus(R = 1, r = .25, su = 24, sv = 10, arc = Math.PI * 2) {
    const P = [], N = [], U = [], I = [];
    for (let i = 0; i <= su; i++) {
      const u = i / su * arc;
      for (let j = 0; j <= sv; j++) {
        const v = j / sv * Math.PI * 2;
        P.push((R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u));
        N.push(Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u)); U.push(i / su, j / sv);
      }
    }
    for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) { const a = i * (sv + 1) + j, b = a + sv + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    return geo(P, N, U, I);
  }
  function dome(seg = 24, rings = 10, half = false) { // upper hemisphere, open bottom (half = back half only)
    const P = [], N = [], U = [], I = [];
    for (let r = 0; r <= rings; r++) {
      const th = r / rings * Math.PI / 2;
      for (let s = 0; s <= seg; s++) {
        const ph = half ? Math.PI + s / seg * Math.PI : s / seg * Math.PI * 2, x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        P.push(x, y, z); N.push(x, y, z); U.push(s / seg, 1 - r / rings);
      }
    }
    for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) { const a = r * (seg + 1) + s, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    return geo(P, N, U, I);
  }
  const GEO = { box: box(), sphere: sphere(), lowSphere: sphere(10, 7), cyl: cyl(1, 1), cone: cyl(0, 1), cone8: cyl(0, 1, 8), cyl8: cyl(1, 1, 8), cyl6: cyl(1, 1, 6), pyramid: cyl(0, 1, 4), shade: cyl(0.55, 1, 18), cup: cyl(1, 0.55, 18), halfDome: dome(28, 12, true), disc: cyl(1, 1, 28), plane: plane(), prism: prism(), dome: dome(), torus: torus(1, .25), torusThin: torus(1, .08, 30, 8), halfTorus: torus(1, .1, 18, 8, Math.PI) };

  // ---------------------------------------------------------------- scene nodes
  const colorCache = new Map();
  function hex(c) {
    if (Array.isArray(c)) return c;
    let v = colorCache.get(c); if (v) return v;
    const n = parseInt(c.slice(1), 16); v = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    colorCache.set(c, v); return v;
  }
  class Node {
    constructor(geo = null, color = '#ffffff') {
      this.geo = geo; this.color = hex(color); this.pos = [0, 0, 0]; this.rot = [0, 0, 0]; this.scl = [1, 1, 1];
      this.children = []; this.alpha = 1; this.emissive = 0; this.boost = 0; this.visible = true; this.tex = null;
    }
    add(n) { this.children.push(n); return n; }
    remove(n) { const i = this.children.indexOf(n); if (i >= 0) this.children.splice(i, 1); }
    setColor(c) { this.color = hex(c); }
  }
  // N(parent, geometry, color, position, scale, rotation, extra)
  function N(parent, g, color, p = [0, 0, 0], s = 1, r = [0, 0, 0], o) {
    const n = new Node(g, color); n.pos = p; n.scl = typeof s === 'number' ? [s, s, s] : s; n.rot = r;
    if (o) { if (o.e !== undefined) n.emissive = o.e; if (o.a !== undefined) n.alpha = o.a; if (o.tex) n.tex = o.tex; }
    if (parent) parent.children.push(n); return n;
  }
  function Grp(parent, p = [0, 0, 0], r = [0, 0, 0], s = 1) { return N(parent, null, '#ffffff', p, s, r); }

  // ---------------------------------------------------------------- renderer
  const VS = `
    attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUv;
    uniform mat4 uMVP; uniform mat4 uModel; uniform mat3 uNrm;
    varying vec3 vN; varying vec2 vUv; varying vec3 vW;
    void main() { gl_Position = uMVP * vec4(aPos, 1.0); vN = uNrm * aNrm; vUv = aUv; vW = (uModel * vec4(aPos, 1.0)).xyz; }`;
  const FS = `
    precision mediump float;
    varying vec3 vN; varying vec2 vUv; varying vec3 vW;
    uniform vec3 uColor; uniform float uAlpha; uniform float uEmissive; uniform float uBoost;
    uniform vec3 uLight; uniform vec3 uSky; uniform vec3 uGround; uniform vec3 uCam;
    uniform vec3 uFog; uniform vec2 uFogRange; uniform sampler2D uTex; uniform float uUseTex;
    void main() {
      vec3 n = normalize(vN);
      vec4 base = vec4(uColor, 1.0);
      if (uUseTex > 0.5) { vec4 t = texture2D(uTex, vUv); base = vec4(t.rgb * uColor, t.a); }
      float diff = max(dot(n, uLight), 0.0);
      vec3 hemi = mix(uGround, uSky, n.y * 0.5 + 0.5);
      vec3 col = base.rgb * (hemi * 0.62 + diff * 0.55);
      vec3 v = normalize(uCam - vW);
      float sp = pow(max(dot(n, normalize(uLight + v)), 0.0), 24.0) * 0.12;
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.12;
      col += sp + rim;
      col = mix(col, base.rgb, uEmissive);
      col += uBoost * vec3(0.35, 0.3, 0.05);
      float f = clamp((length(uCam - vW) - uFogRange.x) / (uFogRange.y - uFogRange.x), 0.0, 1.0);
      col = mix(col, uFog, f);
      gl_FragColor = vec4(col, uAlpha * base.a);
    }`;

  class Renderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: !!opts.preserve });
      if (!gl) throw new Error('WebGL not supported');
      this.gl = gl;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      gl.useProgram(p); this.prog = p;
      this.a = { pos: gl.getAttribLocation(p, 'aPos'), nrm: gl.getAttribLocation(p, 'aNrm'), uv: gl.getAttribLocation(p, 'aUv') };
      this.u = {};
      for (const n of ['uMVP', 'uModel', 'uNrm', 'uColor', 'uAlpha', 'uEmissive', 'uBoost', 'uLight', 'uSky', 'uGround', 'uCam', 'uFog', 'uFogRange', 'uTex', 'uUseTex']) this.u[n] = gl.getUniformLocation(p, n);
      for (const k of ['pos', 'nrm', 'uv']) gl.enableVertexAttribArray(this.a[k]);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      this.buffers = new Map(); this.textures = new Map();
      this.env = { clear: '#a9dcff', fog: '#a9dcff', fogNear: 60, fogFar: 140, light: norm([-0.45, 0.85, 0.5]), sky: [1, 1, 1], ground: [0.72, 0.78, 0.9] };
      this.vp = M4.ident(); this.eye = [0, 10, 10];
    }
    buf(g) {
      let b = this.buffers.get(g.id); if (b) return b;
      const gl = this.gl, mk = (data, target = gl.ARRAY_BUFFER) => { const x = gl.createBuffer(); gl.bindBuffer(target, x); gl.bufferData(target, data, gl.STATIC_DRAW); return x; };
      b = { pos: mk(g.pos), nrm: mk(g.nrm), uv: mk(g.uv), idx: mk(g.idx, gl.ELEMENT_ARRAY_BUFFER), n: g.idx.length };
      this.buffers.set(g.id, b); return b;
    }
    tex(canvas) {
      let t = this.textures.get(canvas);
      if (t && !canvas.dirty) return t;
      const gl = this.gl;
      if (!t) t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.textures.set(canvas, t); canvas.dirty = false; return t;
    }
    setCamera(eye, target, fov = 0.72, near = 0.5, far = 300) {
      const aspect = this.canvas.width / this.canvas.height;
      this.proj = M4.perspective(fov, aspect, near, far);
      this.view = M4.lookAt(eye, target);
      this.vp = M4.mul(this.proj, this.view); this.ivp = M4.invert(this.vp); this.eye = eye;
    }
    render(roots) {
      const gl = this.gl, e = this.env;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      const cc = hex(e.clear); gl.clearColor(cc[0], cc[1], cc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform3fv(this.u.uLight, e.light); gl.uniform3fv(this.u.uSky, e.sky); gl.uniform3fv(this.u.uGround, e.ground);
      gl.uniform3fv(this.u.uCam, this.eye); gl.uniform3fv(this.u.uFog, hex(e.fog)); gl.uniform2f(this.u.uFogRange, e.fogNear, e.fogFar);
      gl.uniform1i(this.u.uTex, 0);
      const opaque = [], trans = [];
      const walk = (n, parent, boost, alpha) => {
        if (!n.visible) return;
        const w = M4.mul(parent, M4.trs(n.pos, n.rot, n.scl));
        const b = boost + n.boost, a = alpha * n.alpha;
        if (n.geo) (a < 0.999 || n.tex && n.tex.transparent ? trans : opaque).push([n, w, b, a]);
        for (const c of n.children) walk(c, w, b, a);
      };
      const I = M4.ident();
      for (const r of roots) if (r) walk(r, I, 0, 1);
      gl.disable(gl.BLEND); gl.depthMask(true);
      for (const d of opaque) this.drawOne(...d);
      if (trans.length) {
        const ey = this.eye;
        trans.sort((p, q) => Math.hypot(q[1][12] - ey[0], q[1][13] - ey[1], q[1][14] - ey[2]) - Math.hypot(p[1][12] - ey[0], p[1][13] - ey[1], p[1][14] - ey[2]));
        gl.enable(gl.BLEND); gl.depthMask(false);
        for (const d of trans) this.drawOne(...d);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
    }
    drawOne(n, w, boost, alpha) {
      const gl = this.gl, b = this.buf(n.geo);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.pos); gl.vertexAttribPointer(this.a.pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.nrm); gl.vertexAttribPointer(this.a.nrm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.uv); gl.vertexAttribPointer(this.a.uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.idx);
      gl.uniformMatrix4fv(this.u.uMVP, false, M4.mul(this.vp, w));
      gl.uniformMatrix4fv(this.u.uModel, false, w);
      gl.uniformMatrix3fv(this.u.uNrm, false, M4.normalMat(w));
      gl.uniform3fv(this.u.uColor, n.color); gl.uniform1f(this.u.uAlpha, alpha);
      gl.uniform1f(this.u.uEmissive, n.emissive); gl.uniform1f(this.u.uBoost, boost);
      if (n.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex(n.tex)); gl.uniform1f(this.u.uUseTex, 1); }
      else gl.uniform1f(this.u.uUseTex, 0);
      gl.drawElements(gl.TRIANGLES, b.n, gl.UNSIGNED_SHORT, 0);
    }
    // world -> screen (in units of the given width/height). Returns null if behind camera.
    project(p, W, H) {
      const v = M4.xform(this.vp, [p[0], p[1], p[2], 1]);
      if (v[3] <= 0.01) return null;
      return [(v[0] / v[3] * 0.5 + 0.5) * W, (1 - (v[1] / v[3] * 0.5 + 0.5)) * H, v[3]];
    }
    // screen (0..W, 0..H) -> ray {o, d}
    ray(x, y, W, H) {
      const nx = x / W * 2 - 1, ny = 1 - y / H * 2;
      const a = M4.xform(this.ivp, [nx, ny, -1, 1]), b = M4.xform(this.ivp, [nx, ny, 1, 1]);
      const o = [a[0] / a[3], a[1] / a[3], a[2] / a[3]], f = [b[0] / b[3], b[1] / b[3], b[2] / b[3]];
      return { o, d: norm([f[0] - o[0], f[1] - o[1], f[2] - o[2]]) };
    }
  }
  function rayGround(r, h = 0) { if (Math.abs(r.d[1]) < 1e-6) return null; const t = (h - r.o[1]) / r.d[1]; return t > 0 ? [r.o[0] + r.d[0] * t, h, r.o[2] + r.d[2] * t] : null; }
  function rayBox(r, b) { // b = [minx,miny,minz,maxx,maxy,maxz]; returns distance or null
    let t0 = 0, t1 = 1e9;
    for (let i = 0; i < 3; i++) {
      const inv = 1 / (r.d[i] || 1e-9); let a = (b[i] - r.o[i]) * inv, c = (b[i + 3] - r.o[i]) * inv;
      if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t1 < t0) return null;
    }
    return t0;
  }

  // ---------------------------------------------------------------- canvas textures
  const texCache = new Map();
  function textTex(text, bg = '#b77942', fg = '#ffffff', w = 512, h = 160, opts = {}) {
    const key = [text, bg, fg, w, h, opts.border || '', opts.font || ''].join('|');
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (opts.border) { x.strokeStyle = opts.border; x.lineWidth = h * 0.08; x.strokeRect(0, 0, w, h); }
    let size = h * 0.55;
    x.font = `bold ${size}px ${opts.font || '"Trebuchet MS", Arial, sans-serif'}`;
    while (x.measureText(text).width > w * 0.9 && size > 8) { size -= 2; x.font = `bold ${size}px ${opts.font || '"Trebuchet MS", Arial, sans-serif'}`; }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = size * 0.14; x.strokeStyle = 'rgba(0,0,0,.35)'; x.strokeText(text, w / 2, h / 2 + 2);
    x.fillStyle = fg; x.fillText(text, w / 2, h / 2 + 2);
    texCache.set(key, c); return c;
  }
  function paintTex(key, w, h, draw) {
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    texCache.set(key, c); return c;
  }

  root.E3 = { M4, GEO, Node, N, Grp, Renderer, hex, rayGround, rayBox, textTex, paintTex, norm };
})(typeof window !== 'undefined' ? window : globalThis);
