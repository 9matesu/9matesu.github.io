/* Dot cut — adapted from https://design.how/vault/dot-cut.
   Canvas 2D field of sharp four-pointed sparks; a subject is carved out as negative space.
   Vanilla JS, no React. */

var DOTCUT_PALETTES = [
  { circle: "#ff3b30", back: "#0a0a0a" },
  { circle: "#00e5ff", back: "#0a0a0a" },
  { circle: "#ff2d95", back: "#16000f" },
  { circle: "#7cff4f", back: "#0a0a0a" },
  { circle: "#ff7a00", back: "#0a0a0a" },
  { circle: "#ffffff", back: "#1544ba" }
];

var DOTCUT_SCENES = [
  { kind: "glyph", value: "Ж", transition: "wipe", palette: 0, style: "drift" },
  { kind: "glyph", value: "ع", transition: "ripple", palette: 1, style: "grain" },
  { kind: "glyph", value: "Д", transition: "columns", palette: 2, style: "streak" },
  { kind: "glyph", value: "م", transition: "scatter", palette: 3, style: "swell" },
  { kind: "glyph", value: "Щ", transition: "collapse", palette: 4, style: "grain" },
  { kind: "glyph", value: "ي", transition: "wipe", palette: 5, style: "drift" }
];

var DOTCUT_COLS = 24;
var DOTCUT_HOLD = 900;
var DOTCUT_MORPH = 620;

/* Ripple emitted by the pointer: speed in cells/s, width in cells, life in s. */
var DOTCUT_RIPPLE_SPEED = 20;
var DOTCUT_RIPPLE_WIDTH = 3.0;
var DOTCUT_RIPPLE_LIFE = 2.2;
var DOTCUT_RIPPLE_AMP = 1.2;

function dotcutEaseOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function dotcutEaseInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function dotcutHash(n) {
  var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function dotcutHash2(x, y) {
  var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function dotcutSmooth01(v, e0, e1) {
  var t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* Glyph outlines (Cyrillic + Arabic) are prebuilt once into Path2D objects. */
var GLYPH_PATHS = null;
var GLYPH_KEYS = null;

function dotcutGlyphs() {
  if (GLYPH_PATHS || !window.DOTGLYPHS) return GLYPH_PATHS;
  GLYPH_PATHS = {};
  GLYPH_KEYS = [];
  for (var ch in window.DOTGLYPHS) {
    if (!Object.prototype.hasOwnProperty.call(window.DOTGLYPHS, ch)) continue;
    GLYPH_PATHS[ch] = new Path2D(window.DOTGLYPHS[ch]);
    GLYPH_KEYS.push(ch);
  }
  return GLYPH_PATHS;
}

function dotcutCellMotion(kind, t, dir, rand) {
  var u = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
  switch (kind) {
    case "wipe": return { scale: 1, dx: u * 0.16 * -dir, dy: 0 };
    case "ripple": return { scale: 1 - u * 0.1, dx: 0, dy: u * -0.13 };
    case "scatter": return { scale: 1, dx: u * 0.18 * Math.cos(rand * Math.PI * 2), dy: u * 0.18 * Math.sin(rand * Math.PI * 2) };
    case "collapse": return { scale: 1 - u * 0.18, dx: 0, dy: 0 };
    case "columns": return { scale: 1, dx: 0, dy: u * 0.22 };
    default: return { scale: 1, dx: 0, dy: 0 };
  }
}

function dotcutCellDelay(kind, x, y, cols, rows, rand) {
  var fx = cols > 1 ? x / (cols - 1) : 0;
  var fy = rows > 1 ? y / (rows - 1) : 0;
  switch (kind) {
    case "wipe": return Math.min(1, Math.max(0, (fx * 0.75 + fy * 0.25) * 0.85 + rand * 0.15));
    case "ripple":
      var d = Math.hypot(fx - 0.5, fy - 0.5) / 0.707;
      return Math.min(1, d * 0.9 + rand * 0.1);
    case "scatter": return rand;
    case "collapse":
      var d2 = Math.hypot(fx - 0.5, fy - 0.5) / 0.707;
      return Math.min(1, (1 - d2) * 0.85 + rand * 0.15);
    case "columns": return Math.min(1, fx * 0.9 + rand * 0.1);
    default: return 0;
  }
}

function dotcutRasterize(scene, cols, rows, fontFamily) {
  var out = new Uint8Array(cols * rows);
  out.fill(1);

  var cx = (cols - 1) / 2;
  var cy = (rows - 1) / 2;
  var x, y;

  if (scene.kind === "glyph") {
    // Cenas principais: o glifo cirílico/árabe é recortado como buraco no
    // campo de círculos. Usa o Path2D de DOTGLYPHS (normalizado ~0.86).
    var paths = dotcutGlyphs();
    var gp = paths && scene.value ? paths[scene.value] : null;
    if (!gp) return out;
    var gcv = document.createElement("canvas");
    gcv.width = cols;
    gcv.height = rows;
    var gctx = gcv.getContext("2d", { willReadFrequently: true });
    if (!gctx) return out;
    gctx.fillStyle = "#000";
    gctx.fillRect(0, 0, cols, rows);
    gctx.save();
    gctx.translate(cols / 2, rows / 2);
    var gscale = Math.min(cols, rows) * 0.92;
    gctx.scale(gscale, -gscale);
    gctx.fillStyle = "#fff";
    gctx.fill(gp);
    gctx.restore();
    var gdata = gctx.getImageData(0, 0, cols, rows).data;
    for (var gi = 0; gi < cols * rows; gi++) {
      if (gdata[gi * 4] > 110) out[gi] = 0;
    }
    return out;
  }

  if (scene.kind === "checker") {
    var b = Math.max(2, Math.round(cols / 14));
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        if ((Math.floor(x / b) + Math.floor(y / b)) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "bars") {
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        if (Math.floor((x + y) / 3) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "columns") {
    var bw = 4, bh = 3;
    for (y = 0; y < rows; y++) {
      var band = Math.floor(y / bh);
      var shift = band % 2 === 0 ? 0 : bw / 2;
      for (x = 0; x < cols; x++) {
        if (Math.floor((x + shift) / bw) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "boxes") {
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        var d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
        if (Math.floor(d / 2.5) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "rings") {
    var maxR = Math.hypot(cols, rows) / 2;
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        var dd = Math.hypot(x - cx, y - cy) / maxR;
        if (Math.floor(dd * 6) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  // text
  var cv = document.createElement("canvas");
  cv.width = cols;
  cv.height = rows;
  var ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return out;

  var text = (scene.value || "").trim();
  if (!text) return out;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  var size = rows * 0.8;
  ctx.font = "600 " + size + "px " + fontFamily;
  var maxW = cols * 0.36;
  var m = ctx.measureText(text);
  if (m.width > maxW) {
    size *= maxW / m.width;
    ctx.font = "600 " + size + "px " + fontFamily;
  }
  var maxH = rows * 0.58;
  var mm = ctx.measureText(text);
  var gh = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
  if (gh > maxH) {
    size *= maxH / gh;
    ctx.font = "600 " + size + "px " + fontFamily;
  }
  ctx.fillText(text, cols / 2, rows / 2 + rows * 0.02);

  var data = ctx.getImageData(0, 0, cols, rows).data;
  for (var i = 0; i < cols * rows; i++) {
    if (data[i * 4] > 110) out[i] = 0;
  }
  return out;
}

function dotcutStyleField(scene, cols, rows, t, out, prev) {
  var cx = (cols - 1) / 2;
  var cy = (rows - 1) / 2;
  var maxR = Math.hypot(cols, rows) / 2;
  var FLIP = 0.32;

  function stateOf(style, x, y) {
    switch (style) {
      case "drift": {
        var a = Math.sin(x * 0.41 + y * 0.23);
        var b = Math.sin(x * 0.17 - y * 0.53 + 2.1);
        return dotcutSmooth01((a + b) * 0.5, -0.15, 0.75);
      }
      case "grain": {
        var n = dotcutHash2(x, y) * 0.55 + dotcutHash2(x + 1, y) * 0.15 + dotcutHash2(x, y + 1) * 0.15 + dotcutHash2(x + 1, y + 1) * 0.15;
        return dotcutSmooth01(n, 0.34, 0.86);
      }
      case "swell": {
        var d = Math.hypot(x - cx, y - cy) / maxR;
        var warp = Math.sin(Math.atan2(y - cy, x - cx) * 3) * 0.14;
        return dotcutSmooth01(1 - (d + warp), 0.28, 0.92);
      }
      case "streak": {
        var s = Math.sin(x * 0.28 + y * 0.62);
        var cut = Math.sin(x * 0.09 - y * 0.11 + 1.3) * 0.5 + 0.5;
        return dotcutSmooth01(s * cut, -0.05, 0.7);
      }
      default: return 0;
    }
  }

  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var order = 0;
      switch (scene.style) {
        case "drift": order = (x / cols) * 0.75 + Math.sin(y * 0.5) * 0.12 + 0.12; break;
        case "grain": order = (x / cols) * 0.55 + (y / rows) * 0.25 + dotcutHash2(x, y) * 0.2; break;
        case "swell": order = Math.hypot(x - cx, y - cy) / maxR; break;
        case "streak": order = (x / cols) * 0.8 + (y / rows) * 0.2; break;
      }
      var from = stateOf(prev && prev.style ? prev.style : scene.style, x, y);
      var to = stateOf(scene.style, x, y);
      var u = Math.min(1, Math.max(0, (t - order * (1 - FLIP)) / FLIP));
      var eased = u * u * (3 - 2 * u);
      out[y * cols + x] = from + (to - from) * eased;
    }
  }
}

function DotCut(host) {
  this.host = host;
  this.canvas = document.createElement("canvas");
  this.canvas.style.cssText = "display:block;width:100%;height:100%";
  this.canvas.setAttribute("aria-hidden", "true");
  host.appendChild(this.canvas);
  this.ctx = this.canvas.getContext("2d");
  if (!this.ctx) return;

  this.cols = DOTCUT_COLS;
  this.rows = 12;
  this.pitch = 10;
  this.ox = 0;
  this.oy = 0;
  this.dpr = 1;

  this.target = new Uint8Array(0);
  this.live = new Float32Array(0);
  this.from = new Float32Array(0);
  this.delay = new Float32Array(0);
  this.rnd = new Float32Array(0);
  this.prog = new Float32Array(0);
  this.dir = new Float32Array(0);
  this.glyphs = null;
  this.glyphKeys = null;
  this.mtx = null;

  /* physics for knocked-down glyphs */
  this.px = new Float32Array(0);
  this.py = new Float32Array(0);
  this.vx = new Float32Array(0);
  this.vy = new Float32Array(0);
  this.rot = new Float32Array(0);
  this.vrot = new Float32Array(0);
  this.life = new Float32Array(0);

  this.seed = Math.random() * 1000;
  this.hue = Math.random() * 360;
  this._lastPush = 0;
  this._lastPushPos = null;
  this._ambient = 0;

  this.sceneIdx = 0;
  this.prevScene = 0;
  this.phase = "hold";
  this.phaseT = 0;
  this.clock = 0;
  this.paletteMix = 1;
  this.prevPalette = 0;
  this.styleT = 1;

  this.pointer = null;
  this.raf = 0;
  this.last = 0;
  this.running = false;
  this.disposed = false;
  this.fontFamily = '"Switzer", "Helvetica Neue", Helvetica, Arial, sans-serif';
  this.reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  this.resize();
  this.ro = new ResizeObserver(this.resize.bind(this));
  this.ro.observe(host);
}

DotCut.prototype.ok = function() {
  return !!this.ctx;
};

DotCut.prototype.resize = function() {
  var ctx = this.ctx;
  if (!ctx || this.disposed) return;
  var w = this.host.clientWidth;
  var h = this.host.clientHeight;
  if (!w || !h) return;

  this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  this.canvas.width = Math.round(w * this.dpr);
  this.canvas.height = Math.round(h * this.dpr);

  var margin = 0.75;
  this.pitch = w / (this.cols + 2 * margin);
  this.rows = Math.max(3, Math.floor((h - 2 * margin * this.pitch) / this.pitch));
  this.ox = (w - this.cols * this.pitch) / 2;
  this.oy = (h - this.rows * this.pitch) / 2;

  var n = this.cols * this.rows;
  this.target = new Uint8Array(n);
  this.live = new Float32Array(n);
  this.from = new Float32Array(n);
  this.delay = new Float32Array(n);
  this.rnd = new Float32Array(n);
  this.prog = new Float32Array(n);
  this.dir = new Float32Array(n);
  for (var i = 0; i < n; i++) this.rnd[i] = dotcutHash(i * 1.37 + 0.5);

  this.px = new Float32Array(n);
  this.py = new Float32Array(n);
  this.vx = new Float32Array(n);
  this.vy = new Float32Array(n);
  this.rot = new Float32Array(n);
  this.vrot = new Float32Array(n);
  this.life = new Float32Array(n);

  this.glyphs = dotcutGlyphs();
  this.glyphKeys = GLYPH_KEYS;
  if (!this.mtx && typeof DOMMatrix !== "undefined") this.mtx = new DOMMatrix();

  this.applyScene(DOTCUT_SCENES[this.sceneIdx], true);
  if (!this.running) this.draw(0);
};

DotCut.prototype.applyScene = function(scene, instant) {
  var next = dotcutRasterize(scene, this.cols, this.rows, this.fontFamily);
  this.from.set(this.live);
  this.target = next;
  for (var y = 0; y < this.rows; y++) {
    for (var x = 0; x < this.cols; x++) {
      var i = y * this.cols + x;
      this.delay[i] = dotcutCellDelay(scene.transition, x, y, this.cols, this.rows, this.rnd[i]);
    }
  }
  if (instant) {
    for (var j = 0; j < next.length; j++) {
      this.live[j] = next[j];
      this.prog[j] = 0;
      this.dir[j] = 0;
    }
    this.from.set(this.live);
  }
};

DotCut.prototype.advance = function() {
  this.prevScene = this.sceneIdx;
  this.sceneIdx = (this.sceneIdx + 1) % DOTCUT_SCENES.length;
  this.prevPalette = DOTCUT_SCENES[(this.sceneIdx - 1 + DOTCUT_SCENES.length) % DOTCUT_SCENES.length].palette;
  this.paletteMix = 0;
  this.phase = "morph";
  this.phaseT = 0;
  this.styleT = 0;
  this.applyScene(DOTCUT_SCENES[this.sceneIdx], false);
};

DotCut.prototype.step = function(dt) {
  this.clock += dt;
  this.phaseT += dt * 1000;

  if (this.phase === "hold" && this.phaseT >= DOTCUT_HOLD) {
    this.advance();
  } else if (this.phase === "morph" && this.phaseT >= DOTCUT_MORPH) {
    this.phase = "hold";
    this.phaseT = 0;
  }

  if (this.phase === "morph") {
    var p = Math.min(1, this.phaseT / DOTCUT_MORPH);
    var n = this.cols * this.rows;
    for (var i = 0; i < n; i++) {
      var d = this.delay[i];
      var local = Math.min(1, Math.max(0, (p - d * 0.72) / 0.28));
      var e = dotcutEaseOut(local);
      this.live[i] = this.from[i] + (this.target[i] - this.from[i]) * e;
      this.prog[i] = this.from[i] !== this.target[i] ? local : 0;
      this.dir[i] = this.target[i] > this.from[i] ? 1 : -1;
    }
  }

  this.paletteMix = Math.min(1, this.paletteMix + dt * 2.2);
};

DotCut.prototype.draw = function(dt) {
  var ctx = this.ctx;
  if (!ctx) return;
  this.step(dt);

  var W = this.canvas.width;
  var H = this.canvas.height;
  var s = this.dpr;
  var scene = DOTCUT_SCENES[this.sceneIdx];

  var cA = DOTCUT_PALETTES[this.prevPalette % DOTCUT_PALETTES.length];
  var cB = DOTCUT_PALETTES[scene.palette % DOTCUT_PALETTES.length];
  var m = dotcutEaseInOut(this.paletteMix);
  var circle = dotcutMixHex(cA.circle, cB.circle, m);
  var back = dotcutMixHex(cA.back, cB.back, m);

  ctx.clearRect(0, 0, W, H);

  var pitch = this.pitch * s;
  var size = pitch * 1.12;
  var glyphs = this.glyphs;
  var keys = this.glyphKeys;

  var hue = (this.hue + (this.pointer ? (this.pointer.x / this.cols) * 140 + (this.pointer.y / this.rows) * 40 : 0)) % 360;
  circle = "hsl(" + hue.toFixed(0) + ", 92%, 60%)";

  ctx.fillStyle = circle;

  var solidPath = new Path2D();
  var mtx = this.mtx;

  for (var y = 0; y < this.rows; y++) {
    for (var x = 0; x < this.cols; x++) {
      var i = y * this.cols + x;
      var v = this.live[i];
      if (v <= 0.004) continue;

      if (this.life[i] > 0) {
        this.life[i] += dt;
        this.vy[i] += 34 * dt;
        this.px[i] += this.vx[i] * dt;
        this.py[i] += this.vy[i] * dt;
        this.rot[i] += this.vrot[i] * dt;
        this.vx[i] *= 0.992;
        this.vy[i] *= 0.996;
        this.vrot[i] *= 0.985;
        if (this.py[i] > 5) {
          this.py[i] = 5;
          this.vy[i] *= -0.32;
          this.vx[i] *= 0.82;
          this.vrot[i] *= 0.7;
          if (this.vy[i] > -0.6 && this.vy[i] < 0.6) this.vy[i] = 0;
        }
        if (this.life[i] > 3.2) {
          this.life[i] = 0;
          this.px[i] = 0; this.py[i] = 0;
          this.vx[i] = 0; this.vy[i] = 0;
          this.rot[i] = 0; this.vrot[i] = 0;
        }
      }

      var mo = dotcutCellMotion(scene.transition, this.prog[i], this.dir[i], this.rnd[i]);

      var cx = this.ox * s + (x + 0.5) * pitch + mo.dx * pitch + this.px[i] * pitch;
      var cy = this.oy * s + (y + 0.5) * pitch + mo.dy * pitch + this.py[i] * pitch;

      var scl = size * v * mo.scale;
      if (scl <= 0.3) continue;

      var rot = (this.rnd[i] - 0.5) * 0.6 + this.rot[i];
      var gi = Math.floor((this.rnd[i] + this.seed * 0.001 + (this.pointer ? (this.pointer.y / this.rows) * 0.4 : 0)) * keys.length) % keys.length;
      var g = glyphs[keys[gi]];
      if (!g) continue;

      if (mtx) {
        var co = Math.cos(rot), si = Math.sin(rot);
        mtx.a = co * scl; mtx.b = si * scl; mtx.c = -si * scl; mtx.d = co * scl; mtx.e = cx; mtx.f = cy;
        solidPath.addPath(g, mtx);
      }
    }
  }

  ctx.fill(solidPath);
};

DotCut.prototype.renderStill = function() {
  this.phase = "hold";
  this.phaseT = 0;
  this.paletteMix = 1;
  this.applyScene(DOTCUT_SCENES[this.sceneIdx], true);
  this.draw(0);
};

DotCut.prototype.start = function() {
  if (this.running || !this.ok() || this.disposed) return;
  this.running = true;
  this.last = performance.now() - 34;
  var self = this;
  function tick(now) {
    if (!self.running) return;
    self.raf = requestAnimationFrame(tick);
    if (now - self.last < 32) return;
    var dt = Math.min((now - self.last) / 1000, 0.1);
    self.last = now;
    self.draw(dt);
  }
  this.raf = requestAnimationFrame(tick);
};

DotCut.prototype.stop = function() {
  this.running = false;
  if (this.raf) cancelAnimationFrame(this.raf);
  this.raf = 0;
};

DotCut.prototype.destroy = function() {
  this.disposed = true;
  this.stop();
  if (this.ro) this.ro.disconnect();
  this.ro = null;
  this.ctx = null;
  if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
};

DotCut.prototype.knock = function(p, strength) {
  if (!p) return;
  var R = 4.2;
  var force = 9 * (strength || 1);
  var x0 = Math.max(0, Math.floor(p.x - R));
  var x1 = Math.min(this.cols - 1, Math.ceil(p.x + R));
  var y0 = Math.max(0, Math.floor(p.y - R));
  var y1 = Math.min(this.rows - 1, Math.ceil(p.y + R));
  for (var y = y0; y <= y1; y++) {
    for (var x = x0; x <= x1; x++) {
      var dx = x + 0.5 - p.x;
      var dy = y + 0.5 - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > R) continue;
      var f = 1 - d / R;
      var i = y * this.cols + x;
      this.vx[i] += (dx / d) * f * f * force + (Math.random() - 0.5) * 1.6;
      this.vy[i] += (dy / d) * f * f * force - 2.6 * f * (strength || 1);
      this.vrot[i] += (Math.random() - 0.5) * 7 * f * (strength || 1);
      if (this.life[i] <= 0) this.life[i] = 0.001;
    }
  }
};

DotCut.prototype.randomize = function(p) {
  this.seed = Math.random() * 1000;
  this.hue = Math.random() * 360;
  var at = p || { x: this.cols / 2, y: this.rows / 2 };
  this.knock(at, 1.8);
};

DotCut.prototype.setPointer = function(p) {
  this.pointer = p;
  if (!p) return;

  var now = performance.now();
  if (this._lastPush && now - this._lastPush < 80) return;
  if (this._lastPushPos) {
    var dd = Math.hypot(p.x - this._lastPushPos.x, p.y - this._lastPushPos.y);
    if (dd < 1.0) return;
  }
  this._lastPush = now;
  this._lastPushPos = { x: p.x, y: p.y };
  this.knock(p, 1);
};

DotCut.prototype.toCell = function(px, py) {
  return { x: (px - this.ox) / this.pitch, y: (py - this.oy) / this.pitch };
};

function dotcutMixHex(a, b, t) {
  var pa = parseInt(a.slice(1), 16);
  var pb = parseInt(b.slice(1), 16);
  var r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  var g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  var bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return "rgb(" + r + "," + g + "," + bl + ")";
}

window.DotCut = DotCut;
window.DOTCUT_SCENES = DOTCUT_SCENES;
window.DOTCUT_PALETTES = DOTCUT_PALETTES;

// Mount + scroll hijack
(function mountDotCut() {
  var host = document.getElementById("dotcut");
  if (!host) return;
  if (host.getAttribute("data-manual") === "1") return;

  var engine = new DotCut(host);
  if (!engine.ok()) return;

  if (engine.reduce) engine.renderStill();
  else engine.start();

  var fine = window.matchMedia("(pointer: fine)").matches;
  if (fine) {
    host.addEventListener("pointermove", function(e) {
      if (engine.reduce) return;
      var r = host.getBoundingClientRect();
      engine.setPointer(engine.toCell(e.clientX - r.left, e.clientY - r.top));
    });
    host.addEventListener("pointerleave", function() { engine.setPointer(null); });
  }

  // Scroll hijack: advance scenes as the user scrolls.
  var intro = document.getElementById("intro-card");
  var current = 0;
  var locked = false;

  function goTo(index) {
    if (locked || index === current) return;
    locked = true;
    current = index;
    // Force a specific scene by stepping the engine forward/backward.
    while (engine.sceneIdx !== index) {
      if (engine.sceneIdx < index) engine.advance();
      else {
        engine.sceneIdx = (engine.sceneIdx - 1 + DOTCUT_SCENES.length) % DOTCUT_SCENES.length;
        engine.prevScene = engine.sceneIdx;
        engine.applyScene(DOTCUT_SCENES[engine.sceneIdx], false);
      }
    }
    document.body.setAttribute("data-dotcut-scene", String(index));
    setTimeout(function() { locked = false; }, 700);
  }

  var wheelAcc = 0;
  window.addEventListener("wheel", function(e) {
    if (!intro || !intro.classList.contains("desk--intro")) return;
    if (e.target.closest && e.target.closest("#app-window, #settings-panel, .xp-window")) return;

    var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!delta) return;

    e.preventDefault();
    wheelAcc += delta;

    if (Math.abs(wheelAcc) < 80) return;
    var dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;

    var next = (current + dir + DOTCUT_SCENES.length) % DOTCUT_SCENES.length;
    goTo(next);
  }, { passive: false });

  // Touch: swipe up/down changes scene.
  var touchY = null;
  window.addEventListener("touchstart", function(e) {
    if (!intro || !intro.classList.contains("desk--intro")) return;
    if (e.target.closest && e.target.closest("#app-window, #settings-panel, .xp-window")) return;
    if (e.touches.length === 1) touchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchend", function(e) {
    if (touchY == null) return;
    var changed = e.changedTouches[0];
    if (!changed) { touchY = null; return; }
    var dy = touchY - changed.clientY;
    touchY = null;
    if (Math.abs(dy) < 60) return;
    var next = (current + (dy > 0 ? 1 : -1) + DOTCUT_SCENES.length) % DOTCUT_SCENES.length;
    goTo(next);
  }, { passive: true });

  // Keyboard arrows also change scene.
  window.addEventListener("keydown", function(e) {
    if (!intro || !intro.classList.contains("desk--intro")) return;
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      goTo((current + 1) % DOTCUT_SCENES.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      goTo((current - 1 + DOTCUT_SCENES.length) % DOTCUT_SCENES.length);
    }
  });

  // Pause when tab hidden.
  document.addEventListener("visibilitychange", function() {
    if (document.hidden) engine.stop();
    else if (!engine.reduce) engine.start();
  });

  // Pause when intro is not visible.
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          if (!engine.reduce) engine.start();
        } else {
          engine.stop();
        }
      });
    }, { threshold: 0.15 });
    io.observe(host);
  }

  window.addEventListener("beforeunload", function() { engine.destroy(); });
})();