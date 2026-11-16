// ------------------------------------------------- mapa topográfico
// A carta agora é uma flora de linhas: cada seção da árvore é uma linha
// de metô. O relevo fica no fundo, apagado; o que se lê é a malha amarela
// com as estações. Toda linha é linear: estações enfileiradas por fila,
// raiz no topo, filhos na fila de baixo, alinhados no eixo do próprio
// ramo.

var MAP_NS = "http://www.w3.org/2000/svg";

var MAP_SEED = 20260211;

var MAP_COLS = 170;
var MAP_ROWS = 70;
var MAP_LEVELS = 9;
var MAP_NEWS_COUNT = 7;

// ------------------------------------------------- ruído e relevo
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

// Altitude do terreno, normalizada entre 0 e 1
function mapRelief(u, v) {
  var x = u * (mapPaperW / 620);
  var y = v * (mapPaperH / 620);
  var soft = mapFbm(x, y, MAP_SEED, 4);
  var ridge = 1 - Math.abs(2 * mapFbm(x * 0.8 + 9.7, y * 0.8 + 3.3, MAP_SEED + 91, 3) - 1);
  var h = 0.5 * soft + 0.4 * ridge + 0.1 * (1 - v);
  return h < 0 ? 0 : h > 1 ? 1 : h;
}

function mapRandom(seed) {
  var a = seed >>> 0;
  return function() {
    a += 0x6D2B79F5;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Curvas de nível por marching squares, com os trechos unidos em polilinhas
function mapContourLines(f, level, cols, rows, paperW, paperH) {
  cols = cols || MAP_COLS;
  rows = rows || MAP_ROWS;
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
      var top, right, bottom, left, mid;
      switch (code) {
        case 1: link(hp(x, y), vp(x, y)); break;
        case 2: link(hp(x, y), vp(x + 1, y)); break;
        case 3: link(vp(x, y), vp(x + 1, y)); break;
        case 4: link(vp(x + 1, y), hp(x, y + 1)); break;
        case 5:
          mid = (va + vb + vc + vd) / 4;
          top = hp(x, y); left = vp(x, y); right = vp(x + 1, y); bottom = hp(x, y + 1);
          if (mid > level) { link(top, right); link(bottom, left); }
          else { link(top, left); link(right, bottom); }
          break;
        case 6: link(hp(x, y), hp(x, y + 1)); break;
        case 7: link(vp(x, y), hp(x, y + 1)); break;
        case 8: link(hp(x, y + 1), vp(x, y)); break;
        case 9: link(hp(x, y), hp(x, y + 1)); break;
        case 10:
          mid = (va + vb + vc + vd) / 4;
          top = hp(x, y); left = vp(x, y); right = vp(x + 1, y); bottom = hp(x, y + 1);
          if (mid > level) { link(top, left); link(right, bottom); }
          else { link(top, right); link(bottom, left); }
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
    lines.push(mapWobble(line));
  });

  return lines;
}

// Um desvio pequeno na normal da curva: dá o tremor de linha feita à mão
function mapWobble(pts) {
  var out = [];
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    var a = pts[Math.max(0, i - 1)];
    var b = pts[Math.min(pts.length - 1, i + 1)];
    var tx = b[0] - a[0];
    var ty = b[1] - a[1];
    var len = Math.sqrt(tx * tx + ty * ty) || 1;
    var w = (mapNoise(p[0] * 0.03, p[1] * 0.03, MAP_SEED + 31) - 0.5) * 5;
    out.push([p[0] - ty / len * w, p[1] + tx / len * w]);
  }
  return out;
}

// Curva suave por pontos médios
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

function mapSvgEl(tag, cls) {
  var el = document.createElementNS(MAP_NS, tag);
  if (cls) el.setAttribute("class", cls);
  return el;
}

// Desenha as curvas de nível de um campo qualquer dentro de um grupo SVG
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
  var step = (max - min) / (MAP_LEVELS + 1);
  var frag = document.createDocumentFragment();
  for (var l = 1; l <= MAP_LEVELS; l++) {
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

// O relevo topográfico: as curvas de nível são desenhadas no espaço do
// mundo (o tamanho da folha), dentro da câmera. Assim o relevo anda
// junto com o pan e o zoom, como o papel de verdade sob o diagrama.
function mapBuildTerrain() {
  if (!mapContours || !mapSvg) return;
  mapBuilt = true;
  if (mapTerrainSize && mapTerrainSize[0] === mapPaperW && mapTerrainSize[1] === mapPaperH) return;
  mapTerrainSize = [mapPaperW, mapPaperH];

  var cols = Math.max(24, Math.round(mapPaperW / 24));
  var rows = Math.max(20, Math.round(mapPaperH / 24));
  mapContoursInto(mapContours, cols, rows, mapPaperW, mapPaperH, mapRelief);
}

// ------------------------------------------------- núcleo do mapa
// ================================================================
//  Núcleo do mapa: onde cada item da árvore vira uma estação de metô.
//  Puro, sem DOM: o navegador desenha, o terminal confere.
// ================================================================

// As raízes visíveis no mapa: sempre todas. O filtro da navegação não
// apaga um distrito do mapa — ele só apaga o foco dos outros. Sumir com
// música ao filtrar design escondia justamente a discografia.
function mapRootKeys() {
  return sortKeys(Object.keys(tree), 0);
}

// ------------------------------------------------- montagem completa (Metrô de SP)
// Distribuição por quadrantes e ângulos octilineares (45°), sem sobreposição de linhas
function mapBuildLayout(tree, roots, newsPaths) {
  var items = [];
  var clusters = [];
  var newsSet = {};
  (newsPaths || []).forEach(function(p) { newsSet[p.join(" > ")] = true; });

  // A folha é dimensionada uma única vez, no topo do motor (mapPaperW/H).
  // Aqui só sincronizamos o cache do relevo — nada de mudar o tamanho,
  // senão a câmera e o papel passam a discordar em pleno pan.
  if (!mapPaperDims || mapPaperDims[0] !== mapPaperW || mapPaperDims[1] !== mapPaperH) {
    mapPaperDims = [mapPaperW, mapPaperH];
  }
  var CX = mapPaperW / 2, CY = mapPaperH / 2;

  var posMap = {};

  // 1. Linha 1 - Azul (design) - Quadrante Noroeste (Top-Left)
  if (tree['design']) {
    posMap['design'] = { x: 1400, y: 800, slot: 'down', lineNo: 1, cluster: 'design' };
    var subs = Object.keys(tree['design']);
    var startY = 700;
    subs.forEach(function(subKey, idx) {
      var subPath = 'design > ' + subKey;
      var sy = startY - idx * 160;
      posMap[subPath] = { x: 1200, y: sy, slot: 'left', lineNo: 1, cluster: 'design' };
      var subNode = tree['design'][subKey];
      if (subNode && typeof subNode === 'object' && !isLeaf(subNode)) {
        var leaves = Object.keys(subNode);
        leaves.forEach(function(lk, lidx) {
          var lp = subPath + ' > ' + lk;
          // Cada ramo desce em passo próprio: as fileiras nunca formam
          // colunas alinhadas de estação (aquilo lia como planilha).
          var lx = 1050 - lidx * 145 - (idx % 2) * 45;
          var lyy = sy;
          posMap[lp] = { x: lx, y: lyy, slot: (lidx % 2 === 0 ? 'down' : 'up'), lineNo: 1, cluster: 'design' };
          var lNode = subNode[lk];
          if (lNode && typeof lNode === 'object' && !isLeaf(lNode)) {
            var subLeaves = Object.keys(lNode);
            subLeaves.forEach(function(slk, slidx) {
              posMap[lp + ' > ' + slk] = { x: lx - 70, y: lyy + (slidx === 0 ? -46 : 46), slot: (slidx === 0 ? 'up' : 'down'), lineNo: 1, cluster: 'design' };
            });
          }
        });
      }
    });
  }

  // 2. Linha 3 - Vermelha (cultura) - Quadrante Nordeste Alto (Top-Right)
  if (tree['cultura']) {
    posMap['cultura'] = { x: 2150, y: 700, slot: 'right', lineNo: 3, cluster: 'cultura' };
    var ckeys = Object.keys(tree['cultura']);
    ckeys.forEach(function(ck, cidx) {
      var cp = 'cultura > ' + ck;
      var cy = 550 - cidx * 150;
      posMap[cp] = { x: 2400, y: cy, slot: 'up', lineNo: 3, cluster: 'cultura' };
      var cNode = tree['cultura'][ck];
      if (cNode && typeof cNode === 'object' && !isLeaf(cNode)) {
        Object.keys(cNode).forEach(function(sck, scidx) {
          posMap[cp + ' > ' + sck] = { x: 2580 + scidx * 160, y: cy, slot: 'down', lineNo: 3, cluster: 'cultura' };
        });
      }
    });
  }

  // 3. Linha 2 - Verde (música) - Quadrante Leste / Sudeste (Mid & Lower Right)
  if (tree['música']) {
    posMap['música'] = { x: 2200, y: 1200, slot: 'left', lineNo: 2, cluster: 'música' };
    var m = tree['música'];
    if (m['sobre mim']) {
      posMap['música > sobre mim'] = { x: 2450, y: 1080, slot: 'up', lineNo: 2, cluster: 'música' };
    }
    if (m['diretrizes técnicas']) {
      posMap['música > diretrizes técnicas'] = { x: 2450, y: 1220, slot: 'up', lineNo: 2, cluster: 'música' };
      var dkeys = Object.keys(m['diretrizes técnicas']);
      dkeys.forEach(function(dk, didx) {
        posMap['música > diretrizes técnicas > ' + dk] = { x: 2650 + didx * 150, y: 1220, slot: (didx % 2 === 0 ? 'down' : 'up'), lineNo: 2, cluster: 'música' };
      });
    }
    if (m['participações']) {
      // O tronco dos anos desce em zigue-zague de 45°: cada ano avança ou
      // recua na horizontal, então as faixas nunca formam colunas alinhadas.
      posMap['música > participações'] = { x: 2330, y: 1380, slot: 'left', lineNo: 2, cluster: 'música' };
      var partYears = Object.keys(m['participações']);
      var py = 1470;
      partYears.forEach(function(yk, pidx) {
        var yp = 'música > participações > ' + yk;
        var px = 2330 + (pidx % 2 ? 110 : 0);
        posMap[yp] = { x: px, y: py, slot: 'left', lineNo: 2, cluster: 'música' };
        var tracks = m['participações'][yk];
        if (tracks && typeof tracks === 'object') {
          // O leque de cada ano abre para cima ou para baixo: as faixas
          // formam uma espinha de peixe, não uma escada de colunas iguais.
          var pdir = pidx % 2 === 0 ? 1 : -1;
          Object.keys(tracks).forEach(function(tk, tidx) {
            posMap[yp + ' > ' + tk] = { x: px + 190 + tidx * 122, y: py + pdir * tidx * 20, slot: (tidx % 2 === 0 ? 'up' : 'down'), lineNo: 2, cluster: 'música' };
          });
        }
        py += 126;
      });
    }
    if (m['lançamentos']) {
      // Mesmo desenho, mas deslocado: as faixas dos dois grupos nunca
      // coincidem em altura, e as capas nunca caem nas mesmas colunas.
      var lxStart = 3260;
      posMap['música > lançamentos'] = { x: lxStart, y: 1200, slot: 'right', lineNo: 2, cluster: 'música' };
      var years = Object.keys(m['lançamentos']);
      var ly = 1300;
      years.forEach(function(yk, yidx) {
        var yp = 'música > lançamentos > ' + yk;
        var lx = lxStart + (yidx % 2 ? 110 : 0);
        posMap[yp] = { x: lx, y: ly, slot: 'left', lineNo: 2, cluster: 'música' };
        var albums = m['lançamentos'][yk];
        if (albums && typeof albums === 'object') {
          var ldir = yidx % 2 === 0 ? -1 : 1;
          Object.keys(albums).forEach(function(ak, aidx) {
            posMap[yp + ' > ' + ak] = { x: lx + 175 + aidx * 118, y: ly + ldir * aidx * 18, slot: (aidx % 2 === 0 ? 'down' : 'up'), lineNo: 2, cluster: 'música' };
          });
        }
        ly += 140;
      });
    }
  }

  // 4. Linha 5 - Lilás (matesuposting) - Quadrante Sul Puro (Down)
  if (tree['matesuposting']) {
    posMap['matesuposting'] = { x: 1800, y: 1550, slot: 'leftUp', lineNo: 5, cluster: 'matesuposting' };
    var mpkeys = Object.keys(tree['matesuposting']);
    mpkeys.forEach(function(mpk, mpidx) {
      posMap['matesuposting > ' + mpk] = { x: 1800, y: 1750 + mpidx * 150, slot: 'right', lineNo: 5, cluster: 'matesuposting' };
    });
  }

  // 5. Linha 4 - Amarela (desenvolvimento) - Quadrante Sudoeste (Bottom-Left)
  if (tree['desenvolvimento']) {
    posMap['desenvolvimento'] = { x: 1400, y: 1600, slot: 'left', lineNo: 4, cluster: 'desenvolvimento' };
    var dkeys = Object.keys(tree['desenvolvimento']);
    dkeys.forEach(function(dk, didx) {
      var dp = 'desenvolvimento > ' + dk;
      var dy = 1750 + didx * 160;
      posMap[dp] = { x: 1200, y: dy, slot: 'up', lineNo: 4, cluster: 'desenvolvimento' };
      var dNode = tree['desenvolvimento'][dk];
      if (dNode && typeof dNode === 'object' && !isLeaf(dNode)) {
        Object.keys(dNode).forEach(function(sdk, sdidx) {
          posMap[dp + ' > ' + sdk] = { x: 1040 - sdidx * 160, y: dy, slot: 'down', lineNo: 4, cluster: 'desenvolvimento' };
        });
      }
    });
  }

  // Montar items com hierarchy
  function buildItem(p, parentItem) {
    var key = p[p.length - 1];
    var kStr = p.join(" > ");
    var pos = posMap[kStr] || { x: 1800, y: 1200, slot: 'up', lineNo: 1, cluster: p[0] };
    var node = resolve(p);
    var it = {
      key: key,
      path: p,
      level: p.length - 1,
      node: node,
      isRoot: p.length === 1,
      isLeaf: !!isLeaf(node),
      isNews: !!newsSet[kStr],
      isHub: kStr === "música > participações" || kStr === "música > lançamentos",
      x: pos.x,
      y: pos.y,
      slot: pos.slot,
      dotR: MAP_DOT_R[p.length - 1] || 12,
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
    if (node && typeof node === 'object' && !isLeaf(node)) {
      Object.keys(node).forEach(function(childKey) {
        buildItem(p.concat([childKey]), it);
      });
    }
  }

  roots.forEach(function(rk) {
    buildItem([rk], null);
  });

  roots.forEach(function(rk) {
    clusters.push({
      key: rk,
      items: items.filter(function(it) { return it.cluster === rk; })
    });
  });

  return { items: items, clusters: clusters };
}

// Raio de tela de cada nível, em unidades da folha
var MAP_DOT_R = [26, 20, 16, 12];

// ------------------------------------------------- desenho da carta
var mapSheet = document.getElementById("map-sheet");
var mapSvg = document.getElementById("map-canvas");
var mapCamera = document.getElementById("map-camera");
var mapPaperRect = document.querySelector("#map-camera .map-paper-fill");
var mapContours = document.getElementById("map-contours");
var mapRoute = document.getElementById("map-route");
var mapRouteActive = document.getElementById("map-route-active");
var mapLinks = document.getElementById("map-links");
var mapMarks = document.getElementById("map-marks");

// Tamanho da folha: único valor, usado por câmera, relevo e rect de papel.
// Larga o bastante para o passeio horizontal; o grid de fundo é CSS e
// contínuo, então ir além da folha nunca mostra um vazio sem carta.
var mapPaperW = 3600;
var mapPaperH = 3000;

// Até onde a câmera pode sair da folha antes do limite duro.
// Horizontal generoso ("explorar pra direita e esquerda"), vertical
// contido. Livre, mas não infinito: a câmera sempre para nessas bordas.
var MAP_PAN_X = 2400;
var MAP_PAN_Y = 900;

var mapPaperDims = [];
var mapNewsPathsCache = [];
var mapTerrainSize = null;

// Zoom: longe mostra as raízes e os ramos; perto, todos os nomes
var MAP_ZOOM_MID = 1.9;
var MAP_ZOOM_NEAR = 3.1;
var MAP_ZOOM_DETAIL = 5.2;
var MAP_ZOOM_MIN = 0.4; // a folha inteira cobrindo a viewport (com folga p/ enquadrar)
var MAP_ZOOM_MAX = 9;

var mapCam = { cx: 0, cy: 0, z: MAP_ZOOM_MIN };
var mapCamFrom = null;
var mapCamTo = null;
var mapCamStart = 0;
var mapCamRaf = null;
var mapMarkList = [];
var mapLayout = null;
var mapSig = "";
var mapPan = null;
var mapBuilt = false;
var mapCamReady = false;
var mapCamUser = false;   // o visitante já enquadrou o mapa com as próprias mãos
var mapFitItems = 0;
var mapFitViewW = 0;
var mapFitViewH = 0;
var mapLastScale = 0;
var mapInners = [];
var mapLabels = [];
var mapBadges = [];
var mapReduce = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

// A trilha das novidades: entram na carta com destaque, mas ficam no
// lugar que é delas na árvore
function mapNewsPaths() {
  if (typeof collectNews !== "function") return [];
  return collectNews().slice(0, MAP_NEWS_COUNT).map(function(entry) {
    return entry.path;
  });
}

// Assinatura do desenho: muda quando a árvore ou as novidades mudam
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

// ------------------------------------------------- câmera da folha
function mapBaseScale(vw, vh) {
  return Math.max(vw / mapPaperW, vh / mapPaperH);
}

// A câmera anda junto: salva com debounce para o drag não martelar o
// localStorage. Recarregar a página devolve o mesmo enquadramento.
var mapCamTimer = null;
function mapSaveCam() {
  if (mapCamTimer) return;
  mapCamTimer = setTimeout(function() {
    mapCamTimer = null;
    try {
      localStorage.setItem("matesu.mapcam.v2", JSON.stringify({
        cx: Math.round(mapCam.cx), cy: Math.round(mapCam.cy), z: mapCam.z
      }));
    } catch (e) {}
  }, 400);
}

// A câmera passeia horizontalmente para além da folha com folga, mas
// encontra um limite duro: não é infinito. Como o grid é CSS contínuo,
// nunca aparece borda vazia — só mais carta para explorar. No eixo Y
// o passeio é contido para o diagrama não se perder de vista.
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

// Contra-escala: as etiquetas mantêm o corpo na tela, os pontos seguem o zoom
function mapApplyCam() {
  if (!mapCamera || !mapSvg) return;
  var vw = mapSvg.clientWidth || 1;
  var vh = mapSvg.clientHeight || 1;
  if (mapLayout && (Math.abs(vw - mapFitViewW) > 40 || Math.abs(vh - mapFitViewH) > 40)) {
    mapFitViewW = vw;
    mapFitViewH = vh;
    mapFitCam();
  }
  var s = mapBaseScale(vw, vh) * mapCam.z;
  mapClampCam(vw, vh, s);
  var tx = vw / 2 - mapCam.cx * s;
  var ty = vh / 2 - mapCam.cy * s;
  mapCamera.setAttribute("transform", "translate(" + tx.toFixed(2) + " " + ty.toFixed(2) + ") scale(" + s.toFixed(5) + ")");

  // Câmera persistida: o save é debounced, então o pan não martela o storage.
  mapSaveCam();

  if (!mapLastScale || s !== mapLastScale) {
    mapLastScale = s;
    var inv = (1 / s).toFixed(5);
    for (var i = 0; i < mapInners.length; i++) {
      mapInners[i].setAttribute("transform", "scale(" + inv + ")");
    }
  }

  var z = mapCam.z;
  var level = z >= MAP_ZOOM_DETAIL ? "detail"
    : z >= MAP_ZOOM_NEAR ? "near"
    : z >= MAP_ZOOM_MID ? "mid"
    : "far";
  if (mapSvg.getAttribute("data-zoom") !== level) mapSvg.setAttribute("data-zoom", level);
}

// ------------------------------------------------- desenho das marcas
// O rótulo vive num grupo contra-escalado (1/s): x/y e o respiro vêm em
// pixels de tela CONSTANTES. Nada depende do zoom, então o zoom não
// bagunça mais a posição de cada etiqueta individual.
function mapLabelBox(it) {
  var off = it.isRoot ? 26 : it.level === 1 ? 20 : 16;
  var att = off + 7;
  switch (it.slot) {
    case "right": return { x: off, y: 0, anchor: "start" };
    case "left": return { x: -off, y: 0, anchor: "end" };
    // Rótulo à esquerda e acima: usa o vazio entre dois distritos quando a
    // etiqueta à direita cairia em cima das linhas do vizinho.
    case "leftUp": return { x: -off, y: -att, anchor: "end" };
    case "down": return { x: 0, y: att + 4, anchor: "middle" };
    default: return { x: 0, y: -att, anchor: "middle" };
  }
}

// O trecho entre duas estações: uma diagonal de 45° e um trecho reto,
// como as linhas do Metrô de SP dobram no meio do mapa. Nunca curves
// arbitrárias: só 0°, 45° ou 90°.
function mapOctoPath(a, b) {
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  var adx = Math.abs(dx);
  var ady = Math.abs(dy);
  if (!adx || !ady || adx === ady) return [[a.x, a.y], [b.x, b.y]];
  var sx = dx < 0 ? -1 : 1;
  var sy = dy < 0 ? -1 : 1;
  if (adx > ady) {
    return [[a.x, a.y], [a.x + sx * ady, b.y], [b.x, b.y]];
  }
  return [[a.x, a.y], [b.x, a.y + sy * adx], [b.x, b.y]];
}

// Polylinha com quinas cortadas: cada vértice interno ganha um arco
// curto, do jeito que o metrô dobra o cano na esquina.
function mapRoundPath(pts, r) {
  if (!pts || pts.length < 2) return "";
  var d = "M" + mapNum(pts[0][0]) + " " + mapNum(pts[0][1]);
  var last = pts[0];
  for (var i = 1; i < pts.length - 1; i++) {
    var p0 = pts[i - 1];
    var p1 = pts[i];
    var p2 = pts[i + 1];
    if (p1[0] === last[0] && p1[1] === last[1]) continue;
    var l1 = Math.sqrt((p1[0] - p0[0]) * (p1[0] - p0[0]) + (p1[1] - p0[1]) * (p1[1] - p0[1]));
    var l2 = Math.sqrt((p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]));
    var cut = Math.min(r, l1 * 0.5, l2 * 0.5);
    if (cut < 1) {
      d += "L" + mapNum(p1[0]) + " " + mapNum(p1[1]);
      last = p1;
      continue;
    }
    var e1 = [p1[0] + (p0[0] - p1[0]) / l1 * cut, p1[1] + (p0[1] - p1[1]) / l1 * cut];
    var e2 = [p1[0] + (p2[0] - p1[0]) / l2 * cut, p1[1] + (p2[1] - p1[1]) / l2 * cut];
    if (e1[0] !== last[0] || e1[1] !== last[1]) {
      d += "L" + mapNum(e1[0]) + " " + mapNum(e1[1]);
    }
    d += "Q" + mapNum(p1[0]) + " " + mapNum(p1[1]) + " " + mapNum(e2[0]) + " " + mapNum(e2[1]);
    last = e2;
  }
  var fin = pts[pts.length - 1];
  if (fin[0] !== last[0] || fin[1] !== last[1]) {
    d += "L" + mapNum(fin[0]) + " " + mapNum(fin[1]);
  }
  return d;
}

// Raio do arredondamento das esquinas. Zero: o diagrama dobra em ângulo
// reto e diagonal de 45°, sem curva nenhuma entre os trechos.
var MAP_ELBOW = 0;

// O cano pai → estação, já dobrado (sem arredondamento)
function mapSegPath(parent, child) {
  return mapRoundPath(mapOctoPath(parent, child), MAP_ELBOW);
}

function mapRenderScene() {
  if (!mapRoute || !mapMarks || !mapLayout) return;

  var frag = document.createDocumentFragment();

  // As linhas coloridas: cada estação recebe o seu trecho até o pai,
  // dobrado só em ângulos retos. Trechos de irmãos que correm na
  // mesma rampa se cobrem e viram um cano só, como num diagrama real.
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
    var cls = "map-route" + lineCls + (g.parent.level === 0 ? " trunk" : g.parent.level >= 2 ? " branch" : "");
    if (filterMode !== "all" && g.parent.cluster !== filterMode) cls += " is-dim";
    for (var i = 0; i < g.kids.length; i++) {
      var p = mapSvgEl("path", cls);
      p.setAttribute("d", mapSegPath(g.parent, g.kids[i]));
      frag.appendChild(p);
    }
  });
  mapRoute.innerHTML = "";
  mapRoute.appendChild(frag);

  // Ligação entre sistemas: uma única linha de integração liga as raízes
  // numa corrente, sem atravessar os ramos. Traço contínuo, na cor de
  // quem chega — não é uma linha à parte, é o mesmo mapa.
  if (mapLinks) {
    var rootsChain = mapLayout.items.filter(function(it) {
      return it.level === 0 && isFinite(it.x) && isFinite(it.y);
    });
    // Ordena em volta do centro do desenho: as ligações correm pela borda
    // do mapa em vez de atravessar as linhas por dentro.
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

  // Marcas
  var mfrag = document.createDocumentFragment();
  mapInners = [];
  mapLabels = [];
  mapBadges = [];
  mapLayout.clusters.forEach(function(c) {
    c.items.forEach(function(it, idx) {
      var lineCls = " line-" + (it.lineNo || 1);
      var cls = "map-mark" + lineCls + " l" + it.level +
        (it.isRoot ? " root" : it.isLeaf ? " leaf" : " branch") +
        (it.isNews ? " novidade" : "") +
        (it.isHub ? " map-hub" : "") +
        (filterMode !== "all" && it.cluster !== filterMode ? " is-dim" : "");
      var g = mapSvgEl("g", cls);
      g.setAttribute("transform", "translate(" + mapNum(it.x) + " " + mapNum(it.y) + ")");
      g.setAttribute("data-idx", String(mapLayout.items.indexOf(it)));
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");

      var title = mapSvgEl("title");
      title.textContent = it.isNews ? (it.node.title || it.key) : it.key;
      g.appendChild(title);

      // Tudo que tem tamanho em tela vive no grupo contra-escalado:
      // bolinha, badge e rótulo mantêm o corpo em qualquer zoom.
      var inner = mapSvgEl("g", "map-mark-in");
      g.appendChild(inner);
      mapInners.push(inner);

      inner.appendChild(mapSvgEl("circle", "map-mark-dot"));
      // miolo branco: dá o desenho de "parada" e recebe a cor no clique
      inner.appendChild(mapSvgEl("circle", "map-mark-core"));

      var tag = mapSvgEl("g", "map-mark-tag");
      inner.appendChild(tag);

      var box = mapLabelBox(it);
      var label = mapSvgEl("text", "map-mark-label");
      label.setAttribute("x", String(box.x));
      label.setAttribute("y", String(box.y));
      if (box.anchor !== "start") label.setAttribute("text-anchor", box.anchor);
      label.setAttribute("dominant-baseline", "middle");
      label.textContent = it.isNews ? (it.node.title || it.key) : it.key;
      tag.appendChild(label);

      mapLabels.push({ label: label, tag: tag, item: it, boxed: it.isNews });

      // A raiz ganha o número da linha, em círculo como nas placas do Metrô de SP
      if (it.isRoot) {
        var badge = mapSvgEl("g", "map-badge");
        var badgeRect = mapSvgEl("rect", "map-badge-rect");
        badgeRect.setAttribute("x", "-13");
        badgeRect.setAttribute("y", "-13");
        badgeRect.setAttribute("width", "26");
        badgeRect.setAttribute("height", "26");
        badgeRect.setAttribute("rx", "13");
        badge.appendChild(badgeRect);
        var badgeNum = mapSvgEl("text", "map-badge-num");
        badgeNum.setAttribute("text-anchor", "middle");
        badgeNum.setAttribute("dominant-baseline", "central");
        badgeNum.textContent = String(it.lineNo);
        badge.appendChild(badgeNum);
        inner.appendChild(badge);
        mapBadges.push({ el: badge, item: it });
      }

      mfrag.appendChild(g);
    });
  });
  mapMarks.innerHTML = "";
  mapMarks.appendChild(mfrag);

  mapMarkList = mapLayout.items;
}

// Marca o caminho aberto na navegação
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

// Enquadramento: a câmera abre com o desenho inteiro no quadro e uma
// folga para os rótulos. Nada de nascer cortando um canto do mapa.
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
  // Telas estreitas precisam de mais folga: os rótulos têm corpo fixo em
  // pixels e, sem isso, encostam nas bordas da folha.
  var pad = vw < 640 ? 1000 : 150;
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
}

// ------------------------------------------------- zoom em três passos
// Sem roda do mouse e sem sequestrar a rolagem: o mapa tem três degraus
// fixos (1x, 2x, 3x) sobre o enquadramento da folha inteira.
var mapFitZ = 0;
var mapZoomStepSel = 1;

function mapPaintZoom() {
  if (!mapSheet) return;
  var btns = mapSheet.querySelectorAll("[data-map-zoom]");
  for (var i = 0; i < btns.length; i++) {
    var on = Number(btns[i].getAttribute("data-map-zoom")) === mapZoomStepSel;
    btns[i].classList.toggle("active", on);
    btns[i].setAttribute("aria-pressed", on ? "true" : "false");
  }
}

function mapSetZoomStep(step) {
  if (!mapSvg || !step) return;
  if (!mapFitZ) mapFitCam();
  mapZoomStepSel = step;
  mapCamUser = true;
  mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapFitZ * step }, true);
  mapPaintZoom();
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

// Desenha a rota e as marcas do caminho atual
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
    } else if (!mapCamUser && mapLayout.items.length !== mapFitItems) {
      // a árvore cresceu (ou mudou) depois do primeiro desenho: reenquadra,
      // desde que o visitante ainda não tenha enquadrado o mapa por conta própria
      mapFitCam();
    }
    mapFitItems = mapLayout.items.length;
    mapRenderScene();
    mapBuildTerrain();
    mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, !mapCamReady);
  }
  mapUpdateActive();
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
  mapCamFrom = { cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z };
  mapCamTo = target;
  mapCamStart = (window.performance && performance.now) ? performance.now() : Date.now();
  var dur = 520;
  function tick(now) {
    var t = Math.min(1, (now - mapCamStart) / dur);
    var e = 1 - Math.pow(1 - t, 3);
    mapCam.cx = mapCamFrom.cx + (mapCamTo.cx - mapCamFrom.cx) * e;
    mapCam.cy = mapCamFrom.cy + (mapCamTo.cy - mapCamFrom.cy) * e;
    mapCam.z = mapCamFrom.z + (mapCamTo.z - mapCamFrom.z) * e;
    mapApplyCam();
    if (t < 1) mapCamRaf = requestAnimationFrame(tick);
    else mapCamRaf = null;
  }
  mapCamRaf = requestAnimationFrame(tick);
}

function mapPointerPos(e) {
  var rect = mapSvg.getBoundingClientRect();
  var s = mapBaseScale(rect.width, rect.height) * mapCam.z;
  return {
    x: (e.clientX - rect.left - rect.width / 2) / s + mapCam.cx,
    y: (e.clientY - rect.top - rect.height / 2) / s + mapCam.cy
  };
}

// Abrir uma marca: preenche a bolinha e leva o item para a sidebar.
// A câmera só corre atrás da estação se ela estiver fora da tela.
function mapOpenMark(g) {
  var wasSelected = g.classList.contains("selected");
  var marks = mapMarks.children;
  for (var k = 0; k < marks.length; k++) {
    marks[k].classList.remove("selected");
  }
  if (!wasSelected) g.classList.add("selected");

  var idx = parseInt(g.getAttribute("data-idx"), 10);
  var it = mapMarkList[idx];
  if (!it || !it.path) return;
  deskEnsureOpen();
  path = it.path.slice();
  clearSearch();
  syncRender();
  mapFocusItem(it);
}

function mapFocusItem(it) {
  if (!it || !mapSvg) return;
  var vw = mapSvg.clientWidth || 1;
  var vh = mapSvg.clientHeight || 1;
  var s = mapBaseScale(vw, vh) * mapCam.z;
  var px = (it.x - mapCam.cx) * s + vw / 2;
  var py = (it.y - mapCam.cy) * s + vh / 2;
  var margin = 90;
  if (px > -margin && px < vw + margin && py > -margin && py < vh + margin) return;
  mapGoTo({ cx: it.x, cy: it.y, z: mapCam.z }, true);
}

if (mapSvg) {
  // arrastar anda pela folha, sem sair dela. O move é coalescido num
  // requestAnimationFrame: um pan por frame, sem engasgo.
  var mapPanRaf = 0;
  var mapPanNext = null;

  function mapPanFrame() {
    mapPanRaf = 0;
    if (!mapPanNext) return;
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
    try { mapSvg.setPointerCapture(e.pointerId); } catch(err) {}
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

  // dois cliques reenquadram o desenho inteiro
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

function mapResize() {
  if (!mapSvg || !mapSheet) return;
  var w = Math.max(1, Math.round(mapSheet.clientWidth));
  var h = Math.max(1, Math.round(mapSheet.clientHeight));
  mapSvg.setAttribute("viewBox", "0 0 " + w + " " + h);
  mapLastScale = 0;
  mapApplyCam();
}

// O relevo é pesado: entra logo depois da primeira pintura
function mapInit() {
  if (!mapSvg) return;
  mapResize();
  setTimeout(function() {
    mapRender();
    mapBuildTerrain();
  }, 40);
}

mapInit();

setTimeout(function () {
  if (mapLayout && !mapCamUser) {
    mapFitCam();
    mapGoTo({ cx: mapCam.cx, cy: mapCam.cy, z: mapCam.z }, false);
  }
}, 600);

// O mapa muda de largura quando o painel de detalhe abre: refaz o viewBox
// e, se o visitante ainda não mexeu na câmera, reenquadra a rede.
if (window.ResizeObserver && mapSheet) {
  var mapBoxW = 0;
  var mapBoxH = 0;
  var mapBoxObs = new ResizeObserver(function () {
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

document.addEventListener("visibilitychange", function() {
  if (mapSheet) mapSheet.classList.toggle("paused", document.hidden);
});

// ------------------------------------------------- puxador do mapa
// O grabber abre e fecha a folha do mapa: arrastar para cima aumenta,
// arrastar para baixo encolhe até sumir.
var grabber = document.getElementById("grabber");
var mapHeight = 0;
var dragState = null;

function mapMinHeight() {
  return 0;
}

function mapMaxHeight() {
  return Math.max(180, Math.round(window.innerHeight * 0.82));
}

function mapDefaultHeight() {
  return Math.round(window.innerHeight * 0.44);
}

function setMapHeight(px) {
  mapHeight = Math.max(mapMinHeight(), Math.min(mapMaxHeight(), Math.round(px)));
  document.documentElement.style.setProperty("--map-h", mapHeight + "px");
  void mapSheet.offsetHeight;
  mapResize();
  if (mapLayout && !mapCamUser) {
    requestAnimationFrame(function () {
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
    try { grabber.setPointerCapture(e.pointerId); } catch(err) {}
    e.preventDefault();
  });

  grabber.addEventListener("pointermove", function(e) {
    if (!dragState) return;
    var dy = dragState.y - e.clientY;
    if (Math.abs(dy) > 2) dragState.moved = true;
    setMapHeight(dragState.h + dy);
  });

  function endGrab(e) {
    if (!dragState) return;
    var moved = dragState.moved;
    dragState = null;
    grabber.classList.remove("dragging");
    if (!moved) {
      setMapHeight(mapHeight > 8 ? 0 : mapDefaultHeight());
    }
  }

  // Duplo clique vai ao máximo da folha, como uma janela maximizada
  grabber.addEventListener("dblclick", function(e) {
    e.preventDefault();
    var max = mapMaxHeight();
    setMapHeight(mapHeight > max - 24 ? mapDefaultHeight() : max);
  });

  grabber.addEventListener("pointerup", endGrab);
  grabber.addEventListener("pointercancel", endGrab);
}

window.addEventListener("resize", function() {
  setMapHeight(mapHeight);
  mapResize();
});

// ------------------------------------------------- novidades do site
// A lista que alimenta o mapa: as novidades aparecem dentro da carta.
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

// ------------------------------------------------- scroll que não prende
// Ao abrir uma coluna, a tela se move só o suficiente para ela aparecer.
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

