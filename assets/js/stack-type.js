/* Stack type (https://design.how/vault/stack-type) — vanilla port.
   Kinetic stacked capitals on Canvas 2D. */
(function () {
  'use strict';

  var SCENE_W = 1200, SCENE_H = 675, CAP = 58, PITCH = 67.625, SIDE = 24, EDGE = 16;
  var ROWS = 9, MID_ROW = 4;
  var KEY_MS = 40, LOOP_KEYS = 48;
  var TRACK_SHIFT = 7, STILL_KEY = 9, SWAP_KEY = 24;
  var DRUM_STEP = 0.28, DRUM_BARREL = 0.35, DRUM_FADE = 0.45, OUTLINE = 1.6;
  var SCRAMBLE = 0.85, SCRAMBLE_KEYS = 6;
  var FONT_WEIGHT = 700;
  var DEFAULT_LOOK = { drum: true, outline: true, scramble: true };
  var MID_Y = SCENE_H / 2;
  var DRUM_R = PITCH / Math.sin(DRUM_STEP);
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  var TRACKS = [
    { top: [8, 10, 13, 17, 32, 36, 39, 41], foot: [4, 8, 11, 14, 35, 38, 40, 45] },
    { top: [8, 10, 13, 17, 32, 36, 39, 41], foot: [3, 6, 9, 12, 37, 40, 43, 46] },
    { top: [8, 10, 13, 17, 32, 36, 39, 41], foot: [1, 4, 8, 10, 39, 41, 45, 48] },
    { top: [6, 8, 11, 14, 35, 38, 40, 43], foot: [3, 6, 9, 12, 37, 40, 43, 46] },
    { top: [6, 9, 11, 13, 36, 38, 40, 43], foot: [8, 10, 10, 14, 35, 39, 39, 41] },
    { top: [4, 7, 9, 12, 37, 40, 42, 45], foot: [5, 8, 11, 14, 35, 38, 41, 44] },
    { top: [2, 5, 8, 10, 39, 41, 44, 47], foot: [7, 10, 13, 16, 33, 36, 39, 42] },
    { top: [4, 7, 9, 12, 37, 40, 42, 45], foot: [9, 12, 15, 18, 31, 34, 37, 40] },
    { top: [2, 5, 9, 11, 38, 40, 44, 47], foot: [4, 7, 10, 15, 34, 35, 39, 42] },
    { top: [8, 10, 13, 17, 32, 36, 39, 41], foot: [3, 6, 9, 12, 37, 40, 43, 46] },
    { top: [4, 7, 9, 12, 32, 35, 38, 41], foot: [5, 8, 11, 14, 35, 38, 41, 44] },
    { top: [4, 7, 9, 12, 37, 40, 42, 45], foot: [9, 12, 15, 18, 31, 34, 37, 40] },
    { top: [2, 5, 8, 10, 33, 36, 39, 41], foot: [11, 14, 17, 20, 41, 44, 47, 48] },
    { top: [8, 10, 13, 17, 32, 36, 39, 41], foot: [3, 6, 9, 12, 37, 40, 43, 46] },
    { top: [8, 10, 13, 17, 32, 36, 39, 41], foot: [5, 8, 11, 14, 35, 38, 40, 44] },
    { top: [2, 5, 8, 10, 39, 41, 44, 47], foot: [5, 8, 11, 14, 35, 38, 40, 44] },
    { top: [6, 8, 11, 15, 34, 38, 40, 43], foot: [7, 10, 12, 18, 31, 37, 39, 42] },
    { top: [9, 12, 16, 19, 30, 33, 37, 40], foot: [7, 10, 13, 16, 33, 36, 39, 42] },
    { top: [6, 8, 11, 14, 35, 38, 41, 43], foot: [5, 8, 11, 14, 35, 38, 41, 44] },
    { top: [2, 5, 8, 10, 35, 38, 41, 43], foot: [9, 12, 15, 18, 31, 34, 37, 40] }
  ];

  function span(track, key) {
    var k = ((key % LOOP_KEYS) + LOOP_KEYS) % LOOP_KEYS;
    function steps(keys) {
      var n = 0;
      for (var i = 0; i < 4; i++) if (keys[i] <= k) n++;
      for (var j = 4; j < keys.length; j++) if (keys[j] <= k) n--;
      return n;
    }
    return [steps(track.top), ROWS - 1 - steps(track.foot)];
  }

  function hash(a, b, c) {
    var h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function StackType(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ok = !!this.ctx;
    if (!this.ok) return;
    this.family = opts.family || 'sans-serif';
    var phrases = (opts.phrases || []).filter(function (p) { return p.text && p.text.trim(); });
    this.phrases = phrases.length ? phrases : [{ text: 'MATESU' }];
    this.look = opts.look || DEFAULT_LOOK;
    this.weight = opts.weight || FONT_WEIGHT;
    this.speed = opts.speed && opts.speed > 0 ? opts.speed : 1;
    this.raf = 0;
    this.running = false;
    this.t0 = 0;
    this.elapsed = 0;
    this.painted = -1;
    this.size = 80;
    this.layouts = [];
    this.measure();
    this.resize();
  }

  StackType.prototype.font = function (size) {
    return this.weight + ' ' + (size || this.size) + 'px ' + this.family;
  };

  StackType.prototype.measure = function () {
    var ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = this.font(100);
    this.size = (100 * CAP) / (ctx.measureText('H').actualBoundingBoxAscent || 70);
    ctx.font = this.font();
    ctx.fontKerning = 'normal';
    this.layouts = this.phrases.map(function (phrase) {
      var text = phrase.text.trim();
      var line = ctx.measureText(text);
      var ink = line.actualBoundingBoxLeft + line.actualBoundingBoxRight;
      var left = SCENE_W / 2 - ink / 2 + line.actualBoundingBoxLeft;
      var letters = [];
      var n = 0;
      var chars = Array.from(text);
      chars.forEach(function (char, i) {
        if (char === ' ') return;
        var x = left + ctx.measureText(chars.slice(0, i).join('')).width;
        var width = ctx.measureText(char).width;
        letters.push({ char: char, x: x, cx: x + width / 2, width: width, index: n++ });
      });
      var reach = this.look.drum
        ? DRUM_R * Math.sin(MID_ROW * DRUM_STEP) + (CAP / 2) * Math.cos(MID_ROW * DRUM_STEP)
        : MID_ROW * PITCH + CAP / 2;
      var fit = Math.min((SCENE_W - 2 * SIDE) / ink, (SCENE_H / 2 - EDGE) / reach);
      return { letters: letters, fit: fit, ground: phrase.ground || '#1544ba', ink: phrase.ink || '#ffffff' };
    }, this);
    this.painted = -1;
    if (!this.running) this.renderStill();
  };

  StackType.prototype.resize = function () {
    var c = this.canvas;
    var box = c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(box.width * dpr));
    var h = Math.max(1, Math.round(box.height * dpr));
    if (w === c.width && h === c.height) return;
    c.width = w;
    c.height = h;
    this.painted = -1;
    if (!this.running) this.renderStill();
  };

  StackType.prototype.paint = function (at) {
    var ctx = this.ctx;
    if (!ctx || !this.layouts.length) return;
    var key = at % LOOP_KEYS;
    var cycle = Math.floor((at + LOOP_KEYS - SWAP_KEY) / LOOP_KEYS);
    var layout = this.layouts[cycle % this.layouts.length];
    var c = this.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = layout.ground;
    ctx.fillRect(0, 0, c.width, c.height);
    var k = Math.min(c.width / SCENE_W, c.height / SCENE_H);
    ctx.setTransform(k, 0, 0, k, (c.width - SCENE_W * k) / 2, (c.height - SCENE_H * k) / 2);
    ctx.translate(SCENE_W / 2, MID_Y);
    ctx.scale(layout.fit, layout.fit);
    ctx.translate(-SCENE_W / 2, -MID_Y);
    ctx.font = this.font();
    ctx.fontKerning = 'normal';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = layout.ink;
    ctx.strokeStyle = layout.ink;
    ctx.lineWidth = OUTLINE / layout.fit;
    ctx.lineJoin = 'round';
    var drum = this.look.drum, outline = this.look.outline, scramble = this.look.scramble;
    var beat = Math.floor(at / SCRAMBLE_KEYS);
    layout.letters.forEach(function (letter, column) {
      var sp = span(TRACKS[(letter.index + cycle * TRACK_SHIFT) % TRACKS.length], key);
      var top = sp[0], foot = sp[1];
      for (var row = Math.max(0, top); row <= Math.min(ROWS - 1, foot); row++) {
        var d = row - MID_ROW;
        var char = letter.char;
        var centred = false;
        if (scramble && d !== 0 && hash(column, row, beat) < SCRAMBLE * Math.abs(d) / MID_ROW) {
          char = LETTERS[Math.floor(hash(row, column, beat + 7) * LETTERS.length)];
          centred = true;
        }
        ctx.save();
        if (drum) {
          var angle = d * DRUM_STEP;
          var tilt = Math.cos(angle);
          ctx.translate(SCENE_W / 2, MID_Y + DRUM_R * Math.sin(angle));
          ctx.scale(1 - DRUM_BARREL * (1 - tilt), tilt);
          ctx.translate(-SCENE_W / 2, 0);
          ctx.globalAlpha = 1 - DRUM_FADE * (1 - tilt);
        } else {
          ctx.translate(0, MID_Y + d * PITCH);
        }
        if (centred) {
          var squeeze = Math.min(1, letter.width / ctx.measureText(char).width);
          ctx.translate(letter.cx, 0);
          ctx.scale(squeeze, 1);
          ctx.translate(-letter.cx, 0);
          ctx.textAlign = 'center';
          if (outline && d !== 0) ctx.strokeText(char, letter.cx, CAP / 2);
          else ctx.fillText(char, letter.cx, CAP / 2);
          ctx.textAlign = 'left';
        } else if (outline && d !== 0) {
          ctx.strokeText(char, letter.x, CAP / 2);
        } else {
          ctx.fillText(char, letter.x, CAP / 2);
        }
        ctx.restore();
      }
    });
    this.painted = at;
  };

  StackType.prototype.renderStill = function () {
    this.paint(STILL_KEY);
  };

  StackType.prototype.start = function () {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now() - this.elapsed / this.speed;
    var self = this;
    function tick(now) {
      if (!self.running) return;
      self.elapsed = (now - self.t0) * self.speed;
      var at = Math.floor(self.elapsed / KEY_MS);
      if (at !== self.painted) self.paint(at);
      self.raf = requestAnimationFrame(tick);
    }
    this.raf = requestAnimationFrame(tick);
  };

  StackType.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  StackType.prototype.destroy = function () {
    this.stop();
    this.layouts = [];
    this.ctx = null;
  };

  window.StackType = StackType;
})();