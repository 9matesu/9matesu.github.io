/* Code trail (https://design.how/vault/code-trail) — port vanilla.
   Staircase de nomes de projetos em barras chapadas que perseguem o ponteiro. */
(function () {
  'use strict';

  var PAIRS = [
    { bg: '#1544ba', fg: '#ffffff', underline: true },
    { bg: '#ff3b30', fg: '#ffffff' },
    { bg: '#ffd400', fg: '#0a0a0a' },
    { bg: '#0a0a0a', fg: '#ffffff' },
    { bg: '#00e5ff', fg: '#0a0a0a' },
    { bg: '#ff2d95', fg: '#ffffff' },
    { bg: '#7cff4f', fg: '#0a0a0a' },
    { bg: '#ff7a00', fg: '#0a0a0a' }
  ];
  window.CODE_TRAIL_PAIRS = PAIRS;

  var ROWS = 20;
  var CHASE = 0.22;
  var MIN_TRAVEL_RATIO = 0.05;
  var FONT_RATIO = 1 / 64;
  var LINE_RATIO = 1.24;
  var PAD_RATIO = 0.12;
  var STEP_RATIO = 1.4;

  function makeBag(items) {
    var pool = [];
    return function () {
      if (!pool.length) {
        pool = items.slice();
        for (var i = pool.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
        }
      }
      return pool.pop();
    };
  }

  function presence(index, total) {
    var t = total <= 1 ? 0 : index / (total - 1);
    var START = 0.62;
    var fade = 1 - Math.pow(Math.max(0, (t - START) / (1 - START)), 1.6);
    return Math.max(0, Math.min(1, fade));
  }

  function Drift(w, h) {
    this.at = { x: 0, y: 0 };
    this.dir = { x: 1, y: 0 };
    this.target = { x: 0, y: 0 };
    this.started = false;
    this.w = w;
    this.h = h;
    this.speed = 0.34;
    this.turn = 0.0042;
  }
  Drift.prototype.resize = function (w, h) { this.w = w; this.h = h; };
  Drift.prototype.reseed = function (at) { this.at = { x: at.x, y: at.y }; this.started = true; this.retarget(); };
  Drift.prototype.retarget = function () {
    var m = 0.2;
    this.target = {
      x: (m + Math.random() * (1 - m * 2)) * this.w,
      y: (m + Math.random() * (1 - m * 2)) * this.h
    };
  };
  Drift.prototype.step = function (dt) {
    if (!this.started) {
      this.at = { x: this.w * 0.5, y: this.h * 0.5 };
      this.started = true;
      this.retarget();
    }
    var bx = this.target.x - this.at.x;
    var by = this.target.y - this.at.y;
    var bl = Math.hypot(bx, by) || 1;
    var fit = Math.min(1, Math.min(this.w / 528, this.h / 243)) || 1;
    var k = Math.min(1, (this.turn / fit) * dt);
    this.dir.x += (bx / bl - this.dir.x) * k;
    this.dir.y += (by / bl - this.dir.y) * k;
    var dl = Math.hypot(this.dir.x, this.dir.y) || 1;
    this.dir.x /= dl;
    this.dir.y /= dl;
    var speed = this.speed * fit;
    this.at.x += this.dir.x * speed * dt;
    this.at.y += this.dir.y * speed * dt;
    if (bl < Math.min(this.w, this.h) * 0.22) this.retarget();
    var pad = 0.2;
    if (this.at.x < this.w * pad || this.at.x > this.w * (1 - pad) ||
        this.at.y < this.h * pad || this.at.y > this.h * (1 - pad)) {
      this.target = { x: this.w * 0.5, y: this.h * 0.5 };
    }
    this.at.x = Math.max(0, Math.min(this.w, this.at.x));
    this.at.y = Math.max(0, Math.min(this.h, this.at.y));
    return { x: this.at.x, y: this.at.y };
  };

  function CodeTrail(host, names) {
    this.host = host;
    this.names = names && names.length ? names : ['matesu'];
    this.rows = [];
    this.head = { x: 0, y: 0 };
    this.lastPush = { x: 0, y: 0 };
    this.pointerInside = false;
    this.raf = 0;
    this.last = 0;
    this.running = false;
    this.seq = 0;
    this.w = 0; this.h = 0; this.line = 18; this.step = 26; this.font = 12; this.pad = 2;
    this.bag = makeBag(this.names);
    this.pairIndex = Math.floor(Math.random() * PAIRS.length);
    this.sinceUnderline = 0;
    this.sinceHot = 0;
    this.drift = new Drift(0, 0);
    this.resize();
    this.onPointer = this.onPointer.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.frame = this.frame.bind(this);
    host.addEventListener('pointermove', this.onPointer);
    host.addEventListener('pointerleave', this.onLeave);
  }

  CodeTrail.prototype.resize = function () {
    this.w = this.host.clientWidth;
    this.h = this.host.clientHeight;
    var font = Math.max(10, this.w * FONT_RATIO);
    this.font = font;
    this.line = font * LINE_RATIO;
    this.step = this.line * STEP_RATIO;
    this.pad = font * PAD_RATIO;
    this.drift.resize(this.w, this.h);
    this.paint();
  };

  CodeTrail.prototype.paintBadge = function (text) {
    var pair = PAIRS[this.pairIndex % PAIRS.length];
    this.pairIndex = (this.pairIndex + 5) % PAIRS.length;
    this.sinceUnderline++;
    this.sinceHot++;
    var underline = pair.underline === true || this.sinceUnderline >= 7;
    if (underline) this.sinceUnderline = 0;
    var hot = this.sinceHot >= 19;
    if (hot) this.sinceHot = 0;
    var shock = this.seq % 2 === 0
      ? { bg: '#0a0a0a', fg: '#ffffff' }
      : { bg: '#1544ba', fg: '#ffffff' };
    return {
      text: text,
      bg: hot ? shock.bg : pair.bg,
      fg: hot ? shock.fg : pair.fg,
      underline: underline
    };
  };

  CodeTrail.prototype.buildRow = function () {
    var badges = [];
    var n = 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) badges.push(this.paintBadge(this.bag()));

    var el = document.createElement('div');
    el.className = 'trail-row';
    for (var j = 0; j < badges.length; j++) {
      var b = badges[j];
      var s = document.createElement('span');
      s.className = 'trail-badge';
      s.textContent = b.text;
      s.setAttribute('data-name', b.text);
      s.style.background = b.bg;
      s.style.color = b.fg;
      s.style.height = this.line + 'px';
      s.style.lineHeight = this.line + 'px';
      s.style.fontSize = this.font + 'px';
      s.style.padding = '0 ' + this.pad + 'px';
      if (b.underline) s.style.textDecoration = 'underline';
      el.appendChild(s);
    }
    this.host.appendChild(el);
    this.seq++;
    return { id: this.seq, pos: { x: 0, y: 0 }, slot: 0, el: el };
  };

  CodeTrail.prototype.seed = function (still) {
    for (var i = 0; i < this.rows.length; i++) this.rows[i].el.remove();
    this.rows = [];
    for (var k = 0; k < ROWS; k++) {
      var r = this.buildRow();
      r.slot = k;
      r.pos = still
        ? { x: this.w * 0.72 - k * this.step, y: this.h * 0.16 + k * this.line }
        : { x: this.w * 0.62 - k * this.step, y: this.h * 0.28 + k * this.line };
      this.rows.push(r);
    }
    this.head = { x: this.w * 0.62, y: this.h * 0.28 };
    this.lastPush = { x: this.head.x, y: this.head.y };
    this.paint();
  };

  CodeTrail.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  };

  CodeTrail.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  CodeTrail.prototype.renderStill = function () {
    this.stop();
    this.seed(true);
  };

  CodeTrail.prototype.destroy = function () {
    this.stop();
    this.host.removeEventListener('pointermove', this.onPointer);
    this.host.removeEventListener('pointerleave', this.onLeave);
    for (var i = 0; i < this.rows.length; i++) this.rows[i].el.remove();
    this.rows = [];
  };

  CodeTrail.prototype.paint = function () {
    for (var i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      r.el.style.transform = 'translate3d(' + r.pos.x.toFixed(2) + 'px,' + r.pos.y.toFixed(2) + 'px,0)';
      var pr = presence(r.slot, ROWS);
      r.el.style.opacity = pr.toFixed(3);
      r.el.style.filter = 'saturate(' + (0.5 + pr * 0.5).toFixed(3) + ')';
      r.el.style.zIndex = String(ROWS - r.slot);
    }
  };

  CodeTrail.prototype.push = function () {
    var born = this.buildRow();
    born.pos = { x: this.head.x, y: this.head.y };
    born.slot = 0;
    var next = [born];
    for (var i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      if (r.slot + 1 >= ROWS) { r.el.remove(); continue; }
      r.slot += 1;
      next.push(r);
    }
    this.rows = next;
    this.paint();
  };

  CodeTrail.prototype.frame = function (now) {
    this.raf = 0;
    var dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    if (!this.pointerInside) this.head = this.drift.step(dt);

    var k = CHASE;
    for (var i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      var tx = i === 0 ? this.head.x : this.rows[i - 1].pos.x - this.step;
      var ty = i === 0 ? this.head.y : this.rows[i - 1].pos.y + this.line;
      r.pos.x += (tx - r.pos.x) * k;
      r.pos.y += (ty - r.pos.y) * k;
    }
    this.paint();

    var travelled = Math.hypot(this.head.x - this.lastPush.x, this.head.y - this.lastPush.y);
    if (travelled >= this.w * MIN_TRAVEL_RATIO) {
      this.lastPush = { x: this.head.x, y: this.head.y };
      this.push();
    }
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  };

  CodeTrail.prototype.onPointer = function (e) {
    if (!this.running) return;
    var rect = this.host.getBoundingClientRect();
    this.pointerInside = true;
    this.head = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  CodeTrail.prototype.onLeave = function () {
    this.pointerInside = false;
    this.drift.reseed(this.head);
  };

  window.CodeTrail = CodeTrail;
})();