// Mapa do portfólio. Cada seção vira uma linha de metrô; cada item, uma estação.
var MAP_NS = "http://www.w3.org/2000/svg";
var MAP_SEED = 20260211;

function mapNum(v) {
  return Math.round(v * 10) / 10;
}

function mapHash(x, y, seed) {
  var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 69069);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function mapNoise(x, y, seed) {
  var x0 = Math.floor(x);
  var y0 = Math.floor(y);
  var sx = x - x0;
  var sy = y - y0;
  sx = sx * sx * (3 - 2 * sx);
  sy = sy * sy * (3 - 2 * sy);
  var a = mapHash(x0, y0, seed);
  var b = mapHash(x0 + 1, y0, seed);
  var c = mapHash(x0, y0 + 1, seed);
  var d = mapHash(x0 + 1, y0 + 1, seed);
  var top = a + (b - a) * sx;
  var bot = c + (d - c) * sx;
  return top + (bot - top) * sy;
}

function mapFbm(x, y, seed, octaves) {
  var amp = 0.5;
  var freq = 1;
  var sum = 0;
  var norm = 0;
  for (var i = 0; i < octaves; i++) {
    sum += amp * mapNoise(x * freq, y * freq, seed + i * 131);
    norm += amp;
    amp *= 0.52;
    freq *= 2.03;
  }
  return sum / norm;
}

function mapRelief(u, v) {
  var x = u * (mapPaperW / 620);
  var y = v * (mapPaperH / 620);
  var soft = mapFbm(x, y, MAP_SEED, 4);
  var ridge = 1 - Math.abs(2 * mapFbm(x * 0.8 + 9.7, y * 0.8 + 3.3, MAP_SEED + 91, 3) - 1);
  var h = 0.5 * soft + 0.4 * ridge + 0.1 * (1 - v);
  return h < 0 ? 0 : h > 1 ? 1 : h;
}

function mapSvgEl(tag, cls) {
  var el = document.createElementNS(MAP_NS, tag);
  if (cls) el.setAttribute("class", cls);
  return el;
}

function mapContourLines(f, level, cols, rows, paperW, paperH) {
  cols = cols || 170;
  rows = rows || 70;
  paperW = paperW || mapPaperW;
  paperH = paperH || mapPaperH;

  var hCount = (rows + 1) * (cols + 1);
  var adj = new Map();
  var pts = new Map();

  function hp(x, y) {
    var id = y * (cols + 1) + x;
    var v0 = f[y * (cols + 1) + x];
    var v1 = f[y * (cols + 1) + x + 1];
    var t = (v1 - v0) === 0 ? 0.5 : (level - v0) / (v1 - v0);
    if (t < 0) t = 0; else if (t > 1) t = 1;
    pts.set(id, [x + t, y]);
    return id;
  }

  function vp(x, y) {
    var id = hCount + y * cols + x;
    var v0 = f[y * (cols + 1) + x];
    var v1 = f[(y + 1) * (cols + 1) + x];
    var t = (v1 - v0) === 0 ? 0.5 : (level - v0) / (v1 - v0);
    if (t < 0) t = 0; else if (t > 1) t = 1;
    pts.set(id, [x, y + t]);
    return id;
  }

  function link(a, b) {
    var la = adj.get(a);
    if (!la) { la = []; adj.set(a, la); }
    var lb = adj.get(b);
    if (!lb) { lb = []; adj.set(b, lb); }
    la.push(b);
    lb.push(a);
  }

  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var i0 = y * (cols + 1) + x;
      var i1 = i0 + 1;
      var i2 = i1 + (cols + 1);
      var i3 = i2 - 1;
      var va = f[i0], vb = f[i1], vc = f[i2], vd = f[i3];
      var code = (va > level ? 1 : 0) | (vb > level ? 2 : 0) | (vc > level ? 4 : 0) | (vd > level ? 8 : 0);
      if (code === 0 || code === 15) continue;

      switch (code) {
        case 1: link(hp(x, y), vp(x, y)); break;
        case 2: link(hp(x, y), vp(x + 1, y)); break;
        case 3: link(vp(x, y), vp(x + 1, y)); break;
        case 4: link(vp(x + 1, y), hp(x, y + 1)); break;
        case 5:
          var mid = (va + vb + vc + vd) / 4;
          if (mid > level) { link(hp(x, y), vp(x + 1, y)); link(hp(x, y + 1), vp(x, y)); }
          else { link(hp(x, y), vp(x, y)); link(vp(x + 1, y), hp(x, y + 1)); }
          break;
        case 6: link(hp(x, y), hp(x, y + 1)); break;
        case 7: link(vp(x, y), hp(x, y + 1)); break;
        case 8: link(hp(x, y + 1), vp(x, y)); break;
        case 9: link(hp(x, y), hp(x, y + 1)); break;
        case 10:
          var mid2 = (va + vb + vc + vd) / 4;
          if (mid2 > level) { link(hp(x, y), vp(x, y)); link(vp(x + 1, y), hp(x, y + 1)); }
          else { link(hp(x, y), vp(x + 1, y)); link(hp(x, y + 1), vp(x, y)); }
          break;
        case 11: link(vp(x + 1, y), hp(x, y + 1)); break;
        case 12: link(vp(x + 1, y), vp(x, y)); break;
        case 13: link(hp(x, y), vp(x + 1, y)); break;
        case 14: link(hp(x, y), vp(x, y)); break;
      }
    }
  }

  var used = new Set();
  var lines = [];

  adj.forEach(function(neis, start) {
    if (used.has(start)) return;
    used.add(start);
    var chain = [start];
    var prev = -1;
    var cur = start;
    for (var guard = 0; guard < 100000; guard++) {
      var list = adj.get(cur);
      var next = -1;
      for (var i = 0; i < list.length; i++) {
        if (list[i] !== prev && !used.has(list[i])) { next = list[i]; break; }
      }
      if (next < 0) break;
      used.add(next);
      chain.push(next);
      prev = cur;
      cur = next;
    }
    var line = [];
    for (var k = 0; k < chain.length; k++) {
      var p = pts.get(chain[k]);
      line.push([p[0] / cols * paperW, p[1] / rows * paperH]);
    }
    lines.push(line);
  });

  return lines;
}

function mapSmoothPath(pts) {
  if (!pts || pts.length < 2) return "";
  var d = "M" + mapNum(pts[0][0]) + " " + mapNum(pts[0][1]);
  for (var i = 1; i < pts.length - 1; i++) {
    var mx = (pts[i][0] + pts[i + 1][0]) / 2;
    var my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += "Q" + mapNum(pts[i][0]) + " " + mapNum(pts[i][1]) + " " + mapNum(mx) + " " + mapNum(my);
  }
  var last = pts[pts.length - 1];
  d += "L" + mapNum(last[0]) + " " + mapNum(last[1]);
  return d;
}

function mapContoursInto(group, cols, rows, w, h, relief) {
  var f = new Float32Array((cols + 1) * (rows + 1));
  var min = 2;
  var max = -1;
  for (var y = 0; y <= rows; y++) {
    for (var x = 0; x <= cols; x++) {
      var hgt = relief(x / cols, y / rows);
      f[y * (cols + 1) + x] = hgt;
      if (hgt < min) min = hgt;
      if (hgt > max) max = hgt;
    }
  }
  var levels = 7;
  var step = (max - min) / (levels + 1);
  var frag = document.createDocumentFragment();
  for (var l = 1; l <= levels; l++) {
    var level = min + step * l;
    var lines = mapContourLines(f, level, cols, rows, w, h);
    var d = "";
    for (var i = 0; i < lines.length; i++) d += mapSmoothPath(lines[i]);
    if (!d) continue;
    var path = mapSvgEl("path", "map-contour" + (l % 3 === 0 ? " major" : ""));
    path.setAttribute("d", d);
    frag.appendChild(path);
  }
  group.innerHTML = "";
  group.appendChild(frag);
}

// ------------------------------------------------- layout
function mapRootKeys() {
  return sortKeys(Object.keys(tree), 0);
}

var MAP_TRUNK = 260;
var MAP_BRANCH = 56;

var MAP_LINES = [
  { key: "design", x: 360, y: 700, line: 1 },
  { key: "música", x: 360, y: 1400, line: 2 },
  { key: "cultura", x: 360, y: 2100, line: 3 },
  { key: "desenvolvimento", x: 2200, y: 700, line: 4 },
  { key: "matesuposting", x: 2200, y: 1400, line: 5 }
];

function mapBuildLayout(tree, roots, newsPaths) {
  var items = [];
  var clusters = [];
  var newsSet = {};
  (newsPaths || []).forEach(function(p) { newsSet[p.join(" > ")] = true; });

  var posMap = {};

  function placeLine(spec) {
    if (!tree[spec.key]) return;
    var base = spec.key;
    var kids = Object.keys(tree[base]);
    posMap[base] = { x: spec.x, y: spec.y, slot: "left", lineNo: spec.line, cluster: base };

    kids.forEach(function(k, i) {
      var x = spec.x + MAP_TRUNK * (i + 1);
      var dir = i % 2 === 0 ? -1 : 1;
      var path = base + " > " + k;
      posMap[path] = {
        x: x,
        y: spec.y,
        slot: dir < 0 ? "down" : "up",
        lineNo: spec.line,
        cluster: base
      };

      var step = 0;
      (function walk(node, parentPath) {
        if (!node || typeof node !== "object" || isLeaf(node)) return;
        Object.keys(node).forEach(function(ck) {
          step += 1;
          var cp = parentPath + " > " + ck;
          posMap[cp] = {
            x: x,
            y: spec.y + dir * MAP_BRANCH * step,
            slot: "right",
            lineNo: spec.line,
            cluster: base
          };
          walk(node[ck], cp);
        });
      })(tree[base][k], path);
    });
  }

  MAP_LINES.forEach(placeLine);

  var extra = 0;
  (roots || []).forEach(function(rk) {
    var known = MAP_LINES.some(function(spec) { return spec.key === rk; });
    if (known || !tree[rk]) return;
    placeLine({ key: rk, x: 2200, y: 2100 + extra * 300, line: 1 });
    extra += 1;
  });

  function buildItem(p, parentItem) {
    var key = p[p.length - 1];
    var kStr = p.join(" > ");
    var pos = posMap[kStr] || { x: 1800, y: 1200, slot: "up", lineNo: 1, cluster: p[0] };
    var node = resolve(p);
    var it = {
      key: key,
      path: p,
      level: p.length - 1,
      node: node,
      isRoot: p.length === 1,
      isLeaf: !!isLeaf(node),
      isNews: !!newsSet[kStr],
      x: pos.x,
      y: pos.y,
      slot: pos.slot,
      dotR: [22, 18, 14, 10][p.length - 1] || 10,
      cluster: pos.cluster,
      lineNo: pos.lineNo,
      parent: parentItem ? {
        key: parentItem.key,
        path: parentItem.path,
        level: parentItem.level,
        isRoot: parentItem.isRoot,
        lineNo: parentItem.lineNo,
        x: parentItem.x,
        y: parentItem.y
      } : null
    };
    items.push(it);
    if (node && typeof node === "object" && !isLeaf(node)) {
      Object.keys(node).forEach(function(childKey) {
        buildItem(p.concat([childKey]), it);
      });
    }
  }

  roots.forEach(function(rk) { buildItem([rk], null); });

  roots.forEach(function(rk) {
    clusters.push({
      key: rk,
      items: items.filter(function(it) { return it.cluster === rk; })
    });
  });

  return { items: items, clusters: clusters };
}

// ------------------------------------------------- DOM
var mapSheet = document.getElementById("map-sheet");
var mapSvg = document.getElementById("map-canvas");
var mapCamera = document.getElementById("map-camera");
var mapContours = document.getElementById("map-contours");
var mapRoute = document.getElementById("map-route");
var mapRouteActive = document.getElementById("map-route-active");
var mapLinks = document.getElementById("map-links");
var mapMarks = document.getElementById("map-marks");

var mapPaperW = 3600;
var mapPaperH = 3000;
var MAP_PAN_X = 2200;
var MAP_PAN_Y = 800;

var mapCam = { cx: mapPaperW / 2, cy: mapPaperH / 2, z: 0.35 };
var mapCamRaf = null;
var mapMarkList = [];
var mapLayout = null;
var mapSig = "";
var mapPan = null;
var mapCamReady = false;
var mapCamUser = false;
var mapFitZ = 0;
var mapFitCx = 0;
var mapFitCy = 0;
var mapZoomStepSel = 1;
var mapReduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

var MAP_ZOOM_MIN = 0.25;
var MAP_ZOOM_MAX = 3;

function mapNewsPaths() {
  if (typeof collectNews !== "function") return [];
  return collectNews().slice(0, 6).map(function(entry) { return entry.path; });
}

function mapSignature(roots) {
  var parts = [];
  (function walk(node, keys) {
    if (!node || typeof node !== "object") return;
    Object.keys(node).forEach(function(k) {
      var c = node[k];
      if (!c || typeof c !== "object") return;
      var full = keys.concat([k]);
      parts.push(full.join(">"));
      if (!isLeaf(c)) walk(c, full);
    });
  })(tree, []);
  return roots.join(",") + "#" + parts.join("|");
}

function mapBaseScale(vw, vh) {
  return Math.max(vw / mapPaperW, vh / mapPaperH);
}

function mapSaveCam() {
  try {
    localStorage.setItem("matesu.mapcam.v2", JSON.stringify({
      cx: Math.round(mapCam.cx),
      cy: Math.round(mapCam.cy),
      z: mapCam.z
    }));
  } catch (e) {}
}

function mapClampCam(vw, vh, s) {
  var hw = vw / 2 / s;
  var hh = vh / 2 / s;
  var minX = -MAP_PAN_X + hw;
  var maxX = mapPaperW + MAP_PAN_X - hw;
  if (minX > maxX) mapCam.cx = mapPaperW / 2;
  else mapCam.cx = Math.max(minX, Math.min(maxX, mapCam.cx));

  var minY = -MAP_PAN_Y + hh;
  var maxY = mapPaperH + MAP_PAN_Y - hh;
  if (minY > maxY) mapCam.cy = mapPaperH / 2;
  else mapCam.cy = Math.max(minY, Math.min(maxY, mapCam.cy));
}

function mapApplyCam() {
  if (!mapCamera || !mapSvg) return;
  var vw = mapSvg.clientWidth || 1;
  var vh = mapSvg.clientHeight || 1;
  var s = mapBaseScale(vw, vh) * mapCam.z;
  mapClampCam(vw, vh, s);

  var tx = vw / 2 - mapCam.cx * s;
  var ty = vh / 2 - mapCam.cy * s;
  mapCamera.setAttribute("transform", "translate(" + tx.toFixed(2) + " " + ty.toFixed(2) + ") scale(" + s.toFixed(5) + ")");

  var inv = (1 / s).toFixed(5);
  var inners = mapSvg.querySelectorAll(".map-mark-in");
  for (var i = 0; i < inners.length; i++) {
    inners[i].setAttribute("transform", "scale(" + inv + ")");
  }

  mapSaveCam();
}

function mapLabelBox(it) {
  var off = it.isRoot ? 22 : it.level === 1 ? 18 : 14;
  var att = off + 6;
  switch (it.slot) {
    case "right": return { x: off, y: 0, anchor: "start" };
    case "left": return { x: -off, y: 0, anchor: "end" };
    case "down": return { x: 0, y: att, anchor: "middle" };
    default: return { x: 0, y: -att, anchor: "middle" };
  }
}

function mapOctoPath(a, b) {
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  var adx = Math.abs(dx);
  var ady = Math.abs(dy);
  if (!adx || !ady || adx === ady) return [[a.x, a.y], [b.x, b.y]];
  var sx = dx < 0 ? -1 : 1;
  var sy = dy < 0 ? -1 : 1;
  if (adx > ady) return [[a.x, a.y], [a.x + sx * ady, b.y], [b.x, b.y]];
  return [[a.x, a.y], [b.x, a.y + sy * adx], [b.x, b.y]];
}

function mapSegPath(a, b) {
  var pts = mapOctoPath(a, b);
  if (pts.length < 2) return "";
  var d = "M" + mapNum(pts[0][0]) + " " + mapNum(pts[0][1]);
  for (var i = 1; i < pts.length; i++) {
    d += "L" + mapNum(pts[i][0]) + " " + mapNum(pts[i][1]);
  }
  return d;
}

function mapRenderScene() {
  if (!mapRoute || !mapMarks || !mapLayout) return;

  var frag = document.createDocumentFragment();

  var kidsByParent = {};
  mapLayout.items.forEach(function(it) {
    if (!it.parent) return;
    var key = it.parent.path.join(">");
    if (!kidsByParent[key]) kidsByParent[key] = { parent: it.parent, kids: [] };
    kidsByParent[key].kids.push(it);
  });

  Object.keys(kidsByParent).forEach(function(key) {
    var g = kidsByParent[key];
    g.kids.sort(function(a, b) { return a.x - b.x; });
    var lineCls = " line-" + (g.parent.lineNo || 1);
    var cls = "map-route" + lineCls + (g.parent.level === 0 ? " trunk" : " branch");
    if (filterMode !== "all" && g.parent.cluster !== filterMode) cls += " is-dim";
    g.kids.forEach(function(kid) {
      var p = mapSvgEl("path", cls);
      p.setAttribute("d", mapSegPath(g.parent, kid));
      frag.appendChild(p);
    });
  });

  mapRoute.innerHTML = "";
  mapRoute.appendChild(frag);

  if (mapLinks) {
    var rootsChain = mapLayout.items.filter(function(it) {
      return it.level === 0 && isFinite(it.x) && isFinite(it.y);
    });
    if (rootsChain.length > 2) {
      var ax = 0, ay = 0;
      rootsChain.forEach(function(it) { ax += it.x; ay += it.y; });
      ax /= rootsChain.length;
      ay /= rootsChain.length;
      rootsChain.sort(function(a, b) {
        return Math.atan2(a.y - ay, a.x - ax) - Math.atan2(b.y - ay, b.x - ax);
      });
    }
    var rfrag = document.createDocumentFragment();
    for (var rj = 0; rj < rootsChain.length - 1; rj++) {
      var ra = rootsChain[rj];
      var rb = rootsChain[rj + 1];
      var rlink = mapSvgEl("path", "map-route map-link line-" + (rb.lineNo || 1));
      rlink.setAttribute("d", mapSegPath(ra, rb));
      rfrag.appendChild(rlink);
    }
    mapLinks.innerHTML = "";
    mapLinks.appendChild(rfrag);
  }

  var mfrag = document.createDocumentFragment();
  mapLayout.clusters.forEach(function(c) {
    c.items.forEach(function(it) {
      var lineCls = " line-" + (it.lineNo || 1);
      var cls = "map-mark" + lineCls + " l" + it.level +
        (it.isRoot ? " root" : it.isLeaf ? " leaf" : " branch") +
        (it.isNews ? " novidade" : "") +
        (filterMode !== "all" && it.cluster !== filterMode ? " is-dim" : "");
      var g = mapSvgEl("g", cls);
      g.setAttribute("transform", "translate(" + mapNum(it.x) + " " + mapNum(it.y) + ")");
      g.setAttribute("data-idx", String(mapLayout.items.indexOf(it)));
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");

      var title = mapSvgEl("title");
      title.textContent = it.isNews && it.node && it.node.title ? it.node.title : it.key;
      g.appendChild(title);

      var inner = mapSvgEl("g", "map-mark-in");
      g.appendChild(inner);

      inner.appendChild(mapSvgEl("circle", "map-mark-dot"));
      inner.appendChild(mapSvgEl("circle", "map-mark-core"));

      var tag = mapSvgEl("g", "map-mark-tag");
      inner.appendChild(tag);

      var box = mapLabelBox(it);
      var label = mapSvgEl("text", "map-mark-label");
      label.setAttribute("x", String(box.x));
      label.setAttribute("y", String(box.y));
      if (box.anchor !== "start") label.setAttribute("text-anchor", box.anchor);
      label.setAttribute("dominant-baseline", "middle");
      label.textContent = it.isNews && it.node && it.node.title ? it.node.title : it.key;
      tag.appendChild(label);

      if (it.isRoot) {
        var badge = mapSvgEl("g", "map-badge");
        var badgeRect = mapSvgEl("rect", "map-badge-rect");
        badgeRect.setAttribute("x", "-12");
        badgeRect.setAttribute("y", "-12");
        badgeRect.setAttribute("width", "24");
        badgeRect.setAttribute("height", "24");
        badgeRect.setAttribute("rx", "12");
        badge.appendChild(badgeRect);
        var badgeNum = mapSvgEl("text", "map-badge-num");
        badgeNum.setAttribute("text-anchor", "middle");
        badgeNum.setAttribute("dominant-baseline", "central");
        badgeNum.textContent = String(it.lineNo);
        badge.appendChild(badgeNum);
        inner.appendChild(badge);
      }

      mfrag.appendChild(g);
    });
  });
  mapMarks.innerHTML = "";
  mapMarks.appendChild(mfrag);
  mapMarkList = mapLayout.items;
}

function mapUpdateActive() {
  if (!mapLayout || !mapMarks) return;

  var frag = document.createDocumentFragment();
  for (var i = 0; i < path.length; i++) {
    var it = mapFindItem(path.slice(0, i + 1));
    if (!it || !it.parent) continue;
    var p = mapSvgEl("path", "map-route active line-" + (it.lineNo || 1));
    p.setAttribute("d", mapSegPath(it.parent, it));
    frag.appendChild(p);
  }
  mapRouteActive.innerHTML = "";
  mapRouteActive.appendChild(frag);

  var marks = mapMarks.children;
  for (var k = 0; k < marks.length; k++) {
    var it2 = mapMarkList[k];
    if (!it2) continue;
    var same = it2.path.length <= path.length;
    if (same) {
      for (var j = 0; j < it2.path.length; j++) {
        if (path[j] !== it2.path[j]) { same = false; break; }
      }
    }
    marks[k].classList.toggle("active", same);
    marks[k].classList.toggle("current", same && it2.path.length === path.length);
  }
}

function mapFindItem(targetPath) {
  var key = targetPath.join(">");
  for (var i = 0; i < mapMarkList.length; i++) {
    if (mapMarkList[i].path.join(">") === key) return mapMarkList[i];
  }
  return null;
}

function mapContentBox(pad) {
  var b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  mapLayout.items.forEach(function(it) {
    if (!isFinite(it.x) || !isFinite(it.y)) return;
    var r = (it.dotR || 12) + pad;
    if (it.x - r < b.minX) b.minX = it.x - r;
    if (it.y - r < b.minY) b.minY = it.y - r;
    if (it.x + r > b.maxX) b.maxX = it.x + r;
    if (it.y + r > b.maxY) b.maxY = it.y + r;
  });
  return b;
}

function mapFitCam() {
  if (!mapLayout || !mapLayout.items.length) return;
  var vw = mapSvg ? mapSvg.clientWidth : 0;
  var vh = mapSvg ? mapSvg.clientHeight : 0;
  if (!vw || !vh) { vw = mapPaperW; vh = mapPaperH; }
  var pad = vw < 640 ? 260 : 120;
  var b = mapContentBox(pad);
  var base = mapBaseScale(vw, vh);
  var zx = vw / Math.max(1, (b.maxX - b.minX) * base);
  var zy = vh / Math.max(1, (b.maxY - b.minY) * base);
  var z = Math.min(zx, zy);
  mapCam = {
    cx: (b.minX + b.maxX) / 2,
    cy: (b.minY + b.maxY) / 2,
    z: Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, z * 0.94))
  };
  mapFitZ = mapCam.z;
  mapFitCx = mapCam.cx;
  mapFitCy = mapCam.cy;
}

function mapPaintZoom() {
  if (!mapSheet) return;
  var btns = mapSheet.querySelectorAll("[data-map-zoom]");
  for (var i = 0; i < btns.length; i++) {
    var on = Number(btns[i].getAttribute("data-map-zoom")) === mapZoomStepSel;
    btns[i].classList.toggle("active", on);
    btns[i].setAttribute("aria-pressed", on ? "true" : "false");
  }
}

function mapRootCenter() {
  if (!mapLayout || !mapLayout.items.length) return { cx: mapCam.cx, cy: mapCam.cy };
  var sx = 0, sy = 0, n = 0;
  mapLayout.items.forEach(function(it) {
    if (!it.isRoot) return;
    sx += it.x;
    sy += it.y;
    n++;
  });
  if (!n) return { cx: mapCam.cx, cy: mapCam.cy };
  return { cx: sx / n, cy: sy / n };
}

function mapSetZoomStep(step) {
  if (!mapSvg || !step) return;
  if (!mapFitZ) mapFitCam();
  mapZoomStepSel = step;
  mapCamUser = true;
  var c = step === 1 ? { cx: mapFitCx, cy: mapFitCy } : mapRootCenter();
  mapGoTo({ cx: c.cx, cy: c.cy, z: mapFitZ * step }, true);
  mapPaintZoom();
}

function mapGoTo(target, animate) {
  if (!target) return;
  if (mapCamRaf) {
    cancelAnimationFrame(mapCamRaf);
    mapCamRaf = null;
  }
  if (!mapCamReady) {
    mapCamReady = true;
    animate = false;
  }
  target.z = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, target.z));
  if (!animate || mapReduce) {
    mapCam.cx = target.cx;
    mapCam.cy = target.cy;
    mapCam.z = target.z;
    mapApplyCam();
    return;
  }
  var from = { cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z };
  var start = (window.performance && performance.now) ? performance.now() : Date.now();
  var dur = 420;

  function tick(now) {
    var t = Math.min(1, (now - start) / dur);
    var e = 1 - Math.pow(1 - t, 3);
    mapCam.cx = from.cx + (target.cx - from.cx) * e;
    mapCam.cy = from.cy + (target.cy - from.cy) * e;
    mapCam.z = from.z + (target.z - from.z) * e;
    mapApplyCam();
    if (t < 1) mapCamRaf = requestAnimationFrame(tick);
    else mapCamRaf = null;
  }
  mapCamRaf = requestAnimationFrame(tick);
}

function mapRender() {
  if (!mapRoute || !mapMarks) return;
  var roots = mapRootKeys();
  var news = mapNewsPaths();
  var sig = mapSignature(roots) + "#" + news.join(";") + "#" + filterMode;

  if (sig !== mapSig) {
    mapSig = sig;
    mapLayout = mapBuildLayout(tree, roots, news);

    if (!mapCamReady) {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem("matesu.mapcam.v2") || "null"); } catch (e) {}
      if (saved && isFinite(saved.cx) && isFinite(saved.cy) && isFinite(saved.z)) {
        mapCam = { cx: saved.cx, cy: saved.cy, z: saved.z };
        mapCamUser = true;
      } else {
        mapFitCam();
      }
    }

    mapRenderScene();

    if (mapContours) {
      var cols = Math.max(24, Math.round(mapPaperW / 24));
      var rows = Math.max(20, Math.round(mapPaperH / 24));
      mapContoursInto(mapContours, cols, rows, mapPaperW, mapPaperH, mapRelief);
    }

    mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, !mapCamReady);
  }

  mapUpdateActive();
}

function mapOpenMark(g) {
  var marks = mapMarks.children;
  for (var k = 0; k < marks.length; k++) marks[k].classList.remove("selected");
  g.classList.add("selected");

  var idx = parseInt(g.getAttribute("data-idx"), 10);
  var it = mapMarkList[idx];
  if (!it || !it.path) return;

  if (deskState !== "app") openApp();
  path = it.path.slice();
  clearSearch();
  syncRender();
}

function mapFocusItem(it) {
  if (!it || !mapSvg) return;
  var vw = mapSvg.clientWidth || 1;
  var vh = mapSvg.clientHeight || 1;
  var s = mapBaseScale(vw, vh) * mapCam.z;
  var px = (it.x - mapCam.cx) * s + vw / 2;
  var py = (it.y - mapCam.cy) * s + vh / 2;
  var margin = 80;
  if (px > -margin && px < vw + margin && py > -margin && py < vh + margin) return;
  mapGoTo({ cx: it.x, cy: it.y, z: mapCam.z }, true);
}

if (mapSvg) {
  var mapPanRaf = 0;
  var mapPanNext = null;

  function mapPanFrame() {
    mapPanRaf = 0;
    if (!mapPanNext || !mapPan) return;
    var rect = mapSvg.getBoundingClientRect();
    var s = mapBaseScale(rect.width, rect.height) * mapCam.z;
    mapCam.cx = mapPan.cx - (mapPanNext.clientX - mapPan.x) / s;
    mapCam.cy = mapPan.cy - (mapPanNext.clientY - mapPan.y) / s;
    mapPanNext = null;
    mapApplyCam();
  }

  function mapPanEnd() {
    if (!mapPan) return;
    mapPan = null;
    mapPanNext = null;
    if (mapPanRaf) { cancelAnimationFrame(mapPanRaf); mapPanRaf = 0; }
    mapSvg.classList.remove("grabbing");
    mapSaveCam();
  }

  mapSvg.addEventListener("pointerdown", function(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest && e.target.closest(".map-mark")) return;
    mapPan = { x: e.clientX, y: e.clientY, cx: mapCam.cx, cy: mapCam.cy };
    mapCamUser = true;
    mapSvg.classList.add("grabbing");
    try { mapSvg.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });

  mapSvg.addEventListener("pointermove", function(e) {
    if (!mapPan) return;
    mapPanNext = e;
    if (!mapPanRaf) mapPanRaf = requestAnimationFrame(mapPanFrame);
  });

  mapSvg.addEventListener("pointerup", mapPanEnd);
  mapSvg.addEventListener("pointercancel", mapPanEnd);
  mapSvg.addEventListener("lostpointercapture", mapPanEnd);

  mapSvg.addEventListener("dblclick", function(e) {
    if (e.target.closest && e.target.closest(".map-mark")) return;
    mapCamUser = false;
    mapFitCam();
    mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, true);
  });
}

if (mapMarks) {
  mapMarks.addEventListener("click", function(e) {
    var g = e.target.closest ? e.target.closest(".map-mark") : null;
    if (!g) return;
    e.stopPropagation();
    mapOpenMark(g);
  });

  mapMarks.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var g = e.target.closest ? e.target.closest(".map-mark") : null;
    if (!g) return;
    e.preventDefault();
    mapOpenMark(g);
  });
}

if (mapSheet) {
  mapSheet.addEventListener("click", function(e) {
    var btn = e.target.closest ? e.target.closest("[data-map-zoom]") : null;
    if (!btn) return;
    e.stopPropagation();
    mapSetZoomStep(Number(btn.getAttribute("data-map-zoom")));
  });
  mapPaintZoom();
}

function mapResize() {
  if (!mapSvg || !mapSheet) return;
  var w = Math.max(1, Math.round(mapSheet.clientWidth));
  var h = Math.max(1, Math.round(mapSheet.clientHeight));
  mapSvg.setAttribute("viewBox", "0 0 " + w + " " + h);
  mapApplyCam();
}

function mapInit() {
  if (!mapSvg) return;
  mapResize();
  setTimeout(function() {
    mapRender();
  }, 40);
}

mapInit();

setTimeout(function() {
  if (mapLayout && !mapCamUser) {
    mapFitCam();
    mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, false);
  }
}, 600);

if (window.ResizeObserver && mapSheet) {
  var mapBoxW = 0;
  var mapBoxH = 0;
  var mapBoxObs = new ResizeObserver(function() {
    var w = mapSvg.clientWidth;
    var h = mapSvg.clientHeight;
    if (Math.abs(w - mapBoxW) < 24 && Math.abs(h - mapBoxH) < 24) return;
    mapBoxW = w;
    mapBoxH = h;
    mapResize();
    if (!mapCamUser && mapLayout) mapFitCam();
    mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, false);
  });
  mapBoxObs.observe(mapSheet);
}

// ------------------------------------------------- puxador do mapa
var grabber = document.getElementById("grabber");
var mapHeight = 0;
var dragState = null;

function mapMinHeight() { return 0; }
function mapMaxHeight() { return Math.max(180, Math.round(window.innerHeight * 0.82)); }
function mapDefaultHeight() { return Math.round(window.innerHeight * 0.42); }

function setMapHeight(px) {
  mapHeight = Math.max(mapMinHeight(), Math.min(mapMaxHeight(), Math.round(px)));
  document.documentElement.style.setProperty("--map-h", mapHeight + "px");
  if (mapSheet) {
    mapSheet.style.height = mapHeight + "px";
    void mapSheet.offsetHeight;
  }
  mapResize();
  if (mapLayout && !mapCamUser) {
    requestAnimationFrame(function() {
      mapFitCam();
      mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, false);
    });
  }
}

setMapHeight(mapDefaultHeight());

if (grabber) {
  grabber.addEventListener("pointerdown", function(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragState = { y: e.clientY, h: mapHeight, moved: false };
    grabber.classList.add("dragging");
    try { grabber.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });

  grabber.addEventListener("pointermove", function(e) {
    if (!dragState) return;
    var dy = dragState.y - e.clientY;
    if (Math.abs(dy) > 2) dragState.moved = true;
    setMapHeight(dragState.h + dy);
  });

  function endGrab() {
    if (!dragState) return;
    var moved = dragState.moved;
    dragState = null;
    grabber.classList.remove("dragging");
    if (!moved) setMapHeight(mapHeight > 8 ? 0 : mapDefaultHeight());
  }

  grabber.addEventListener("pointerup", endGrab);
  grabber.addEventListener("pointercancel", endGrab);

  grabber.addEventListener("dblclick", function(e) {
    e.preventDefault();
    var max = mapMaxHeight();
    setMapHeight(mapHeight > max - 24 ? mapDefaultHeight() : max);
  });
}

window.addEventListener("resize", function() {
  setMapHeight(mapHeight);
  mapResize();
});

// ------------------------------------------------- novidades
function nodeDate(node) {
  if (!node) return null;
  if (node.date) {
    var d = new Date(String(node.date) + "T12:00:00");
    if (!isNaN(d.getTime())) return d;
  }
  var hay = [node.title, node.meta, node.body].filter(Boolean).join(" ");
  var m = hay.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) {
    var dt = new Date(+m[3], +m[2] - 1, +m[1]);
    if (!isNaN(dt.getTime())) return dt;
  }
  var m2 = hay.match(/\b(19|20)\d{2}\b/);
  if (m2) {
    var y = new Date(+m2[0], 0, 1);
    if (!isNaN(y.getTime())) return y;
  }
  return null;
}

function collectNews() {
  var out = [];
  (function walk(node, keys) {
    if (!node || typeof node !== "object") return;
    if (isLeaf(node)) {
      var d = nodeDate(node);
      if (d) out.push({ node: node, path: keys, date: d });
      return;
    }
    Object.keys(node).forEach(function(k) {
      walk(node[k], keys.concat([k]));
    });
  })(tree, []);
  out.sort(function(a, b) { return b.date - a.date; });
  return out;
}

function revealColumn(el) {
  if (!el) return stage.scrollLeft;
  var left = el.offsetLeft;
  var right = left + el.offsetWidth;
  var view = stage.scrollLeft;
  var vw = stage.clientWidth;
  if (right <= view + vw) return view;
  if (left >= view + vw) return Math.max(view, left - 110);
  if (right - left <= vw - 80) return right - vw;
  return Math.max(view, left + 110);
}

// Exposto para o desktop.js
window.mapOpenMark = mapOpenMark;
window.mapResize = mapResize;