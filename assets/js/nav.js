// Scroll horizontal do stage. Um motor só: nada de scrollTo nativo
// brigando com o requestAnimationFrame.
var targetScrollLeft = stage.scrollLeft;
var isScrolling = false;
var scrollAnim = null;

function clampScroll(x) {
  var max = Math.max(0, stage.scrollWidth - stage.clientWidth);
  return Math.max(0, Math.min(max, x));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Animação programática com duração fixa, para abrir e fechar colunas
function animateScrollTo(to, duration) {
  var dest = clampScroll(to);
  targetScrollLeft = dest;
  scrollAnim = {
    from: stage.scrollLeft,
    to: dest,
    start: (window.performance && performance.now) ? performance.now() : Date.now(),
    duration: duration || 340
  };
  if (!isScrolling) {
    isScrolling = true;
    requestAnimationFrame(scrollTick);
  }
}

function scrollTick(now) {
  if (scrollAnim) {
    var p = scrollAnim.duration > 0
      ? Math.min(1, (now - scrollAnim.start) / scrollAnim.duration)
      : 1;
    var eased = easeOutCubic(p);
    stage.scrollLeft = scrollAnim.from + (scrollAnim.to - scrollAnim.from) * eased;
    if (p < 1) {
      requestAnimationFrame(scrollTick);
    } else {
      stage.scrollLeft = scrollAnim.to;
      scrollAnim = null;
      isScrolling = false;
    }
    return;
  }

  var diff = targetScrollLeft - stage.scrollLeft;
  if (Math.abs(diff) > 0.5) {
    stage.scrollLeft += diff * 0.16;
    requestAnimationFrame(scrollTick);
  } else {
    stage.scrollLeft = targetScrollLeft;
    isScrolling = false;
  }
}

stage.addEventListener("wheel", function(e) {
  var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (!delta) return;

  // Se o cursor estiver sobre uma coluna/detalhe que tem scroll vertical próprio, verifica limites
  var el = e.target;
  while (el && el !== stage) {
    if ((el.classList.contains("col") || el.classList.contains("detail-view")) && el.scrollHeight > el.clientHeight) {
      var atTop = el.scrollTop <= 0 && delta < 0;
      var atBottom = (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) && delta > 0;
      if (!atTop && !atBottom) {
        return; // Mantém scroll vertical nativo da coluna
      }
    }
    el = el.parentElement;
  }

  e.preventDefault();
  // A roda assume o controle e cancela qualquer animação em curso
  scrollAnim = null;
  targetScrollLeft = clampScroll((isScrolling ? targetScrollLeft : stage.scrollLeft) + delta * 1.2);

  if (!isScrolling) {
    isScrolling = true;
    requestAnimationFrame(scrollTick);
  }
}, { passive: false });

// ------------------------------------------------- arrastar o palco
// A tela central é livre: pega com a mão de grab, solta com inércia.
var stageDrag = null;
var suppressStageClick = false;

function stageDragStart(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  var t = e.target;
  if (!t) return;
  if (t.tagName === "IMG") t.draggable = false;
  // Links e controles reais continuam clicáveis
  if (t.closest && t.closest("a[href], input, select, textarea, button")) return;

  stageDrag = {
    id: e.pointerId,
    x: e.clientX,
    from: stage.scrollLeft,
    lastX: e.clientX,
    lastT: (window.performance && performance.now) ? performance.now() : Date.now(),
    samples: [],
    moved: false
  };
}

function stageDragMove(e) {
  if (!stageDrag || e.pointerId !== stageDrag.id) return;
  var dx = e.clientX - stageDrag.x;

  if (!stageDrag.moved) {
    if (Math.abs(dx) < 5) return;
    stageDrag.moved = true;
    stage.classList.add("grabbing");
    scrollAnim = null;
    isScrolling = false;
    var sel = document.getSelection ? document.getSelection() : null;
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
  }

  // Velocidade do gesto, para a inércia
  var now = (window.performance && performance.now) ? performance.now() : Date.now();
  var dt = now - stageDrag.lastT;
  if (dt > 0) {
    stageDrag.samples.push((e.clientX - stageDrag.lastX) / dt);
    if (stageDrag.samples.length > 4) stageDrag.samples.shift();
    stageDrag.lastT = now;
    stageDrag.lastX = e.clientX;
  }

  scrollAnim = null;
  var next = clampScroll(stageDrag.from - dx * 1.15);
  stage.scrollLeft = next;
  targetScrollLeft = next;
  if (e.cancelable) e.preventDefault();
}

function stageDragEnd(e) {
  if (!stageDrag || e.pointerId !== stageDrag.id) return;
  var d = stageDrag;
  stageDrag = null;
  stage.classList.remove("grabbing");
  if (!d.moved) return;

  // O arrasto não conta como clique
  suppressStageClick = true;

  // Inércia: a velocidade suavizada projeta onde o palco deveria parar
  var v = 0;
  if (d.samples.length) {
    v = d.samples.reduce(function(a, b) { return a + b; }, 0) / d.samples.length;
    v = Math.max(-2.2, Math.min(2.2, v));
  }
  if (Math.abs(v) > 0.05) {
    animateScrollTo(stage.scrollLeft - v * 240, 620);
  }
}

stage.addEventListener("pointerdown", stageDragStart);
window.addEventListener("pointermove", stageDragMove, { passive: false });
window.addEventListener("pointerup", stageDragEnd);
window.addEventListener("pointercancel", stageDragEnd);

stage.addEventListener("click", function(e) {
  if (!suppressStageClick) return;
  suppressStageClick = false;
  e.preventDefault();
  e.stopPropagation();
}, true);

function onItemClick(colIndex, key, el) {
  // Push leve no item: mostra a ação sem prender a tela
  if (el) {
    el.classList.remove("push");
    void el.offsetWidth;
    el.classList.add("push");
  }

  if (path[colIndex] === key) {
    // Clicar no mesmo item recolhe tudo à direita
    playClick("close");
    path = path.slice(0, colIndex);
  } else {

    // Trunca até a coluna atual e ativa novo item
    playClick("open");
    path = path.slice(0, colIndex);
    path.push(key);
  }
  syncRender();
}

// ------------------------------------------------- memória do caminho
// Guarda o item aberto e o filtro, para recarregar a página no mesmo lugar.
function deskSavePath() {
  try {
    localStorage.setItem("matesu.path", JSON.stringify({
      path: path,
      filter: filterMode
    }));
  } catch (e) {}
}

function deskRestorePath() {
  try {
    var raw = localStorage.getItem("matesu.path");
    if (raw) {
      var saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.path)) {
        var node = tree;
        var clean = [];
        for (var i = 0; i < saved.path.length; i++) {
          if (!node || typeof node !== "object" || !(saved.path[i] in node)) break;
          clean.push(saved.path[i]);
          node = node[saved.path[i]];
        }
        path = clean;
        var flt = saved.filter;
        if (flt && flt !== "all" && tree[flt]) filterMode = flt;
        else if (!flt || flt === "all") filterMode = "all";
        if (filterMode !== "all" && path[0] !== filterMode) filterMode = "all";
      }
    }
  } catch (e) {}
  if (filterSelect) filterSelect.value = filterMode;
  deskPathReady = true;
}

// Atualização com animação de saída ao fechar colunas
function syncRender() {
  assignThumbs();

  // O caminho aberto é o "lugar" da página: recarregar volta pra ele.
  // Busca é estado transitório, então não sobrescreve o que foi guardado.
  if (deskPathReady && !searchQuery) deskSavePath();

  // A rota do mapa acompanha o caminho aberto na navegação
  mapRender();

  if (searchQuery) {
    renderResults();
    return;
  }

  var targetLevels = [];

  // Nível 0: raiz
  var rootKeys = Object.keys(tree);
  if (filterMode !== "all") {
    rootKeys = rootKeys.filter(function(k) { return k === filterMode; });
  }
  targetLevels.push({
    type: "column",
    keys: sortKeys(rootKeys, 0),
    activeKey: path[0] || null
  });

  // Níveis intermediários: o item final não vira coluna no palco, ele
  // abre na coluna fixa da direita
  var leafNode = null;
  for (var i = 0; i < path.length; i++) {
    var subPath = path.slice(0, i + 1);
    var node = resolve(subPath);

    if (node && isLeaf(node)) {
      leafNode = node;
      break;
    } else if (node && typeof node === "object") {
      targetLevels.push({
        type: "column",
        keys: sortKeys(Object.keys(node), i + 1),
        activeKey: path[i + 1] || null
      });
    }
  }

  showDetail(leafNode, path);

  // Se estamos fechando/recolhendo colunas
  if (stage.children.length > targetLevels.length) {
    var toRemove = Array.from(stage.children).slice(targetLevels.length);

    // As colunas que saem saem do fluxo antes de animar. Assim o conteúdo
    // que fica não se move quando elas são apagadas e o scroll não trava
    // no limite antigo.
    toRemove.forEach(function(el) {
      var left = el.offsetLeft;
      var top = el.offsetTop;
      var height = el.offsetHeight;
      el.classList.add("leaving");
      el.style.position = "absolute";
      el.style.left = left + "px";
      el.style.top = top + "px";
      el.style.height = height + "px";
      el.style.width = el.offsetWidth + "px";
    });

    // Um único scroll, animado junto com a saída das colunas.
    // A tela fica onde está: só corrige se o conteúdo encolher demais.
    requestAnimationFrame(function() {
      var max = Math.max(0, stage.scrollWidth - stage.clientWidth);
      animateScrollTo(Math.min(stage.scrollLeft, max), 300);
    });

    setTimeout(function() {
      toRemove.forEach(function(el) {
        if (el.parentNode === stage) stage.removeChild(el);
      });
      // O conteúdo restante agora é menor: o alvo é re-ajustado ao limite novo
      var max2 = Math.max(0, stage.scrollWidth - stage.clientWidth);
      animateScrollTo(Math.min(targetScrollLeft, max2), 240);
      applyLevels(targetLevels, true);
    }, 200);
  } else {
    applyLevels(targetLevels, false);
  }
}

function applyLevels(targetLevels, isRecoil) {
  targetLevels.forEach(function(lvl, colIdx) {
    var existing = stage.children[colIdx];

    if (lvl.type === "column") {
      if (!existing || !existing.classList.contains("col")) {
        var newCol = renderColumnEl(lvl.keys, colIdx, lvl.activeKey);
        if (existing) {
          stage.replaceChild(newCol, existing);
        } else {
          stage.appendChild(newCol);
        }
      } else {
        updateColumnEl(existing, lvl.keys, colIdx, lvl.activeKey);
      }
    }
  });

  if (!isRecoil) {
    requestAnimationFrame(function() {
      var last = stage.lastElementChild;
      var left = pendingScrollLeft != null ? pendingScrollLeft : revealColumn(last);
      pendingScrollLeft = null;
      animateScrollTo(left, 360);
    });
  }
}

// Vista de resultados da busca
function renderResults() {
  assignThumbs();
  var matches = collectMatches();
  showDetail(null);

  var col = document.createElement("div");
  col.className = "col results-col";

  if (!matches.length) {
    var note = document.createElement("div");
    note.className = "empty-note";
    note.textContent = "nada encontrado";
    col.appendChild(note);
  } else {
    matches.forEach(function(m) {
      var item = document.createElement("a");
      item.className = "item result-item";
      item.dataset.key = m.key;

      var label = document.createElement("span");
      label.className = "item-label";
      label.textContent = resultLabel(m);
      item.appendChild(label);

      var thumbSrc = thumbFor(assignedThumb(m.path));
      if (thumbSrc) item.appendChild(makeThumb(thumbSrc));

      if (m.path.length > 1) {
        var breadcrumb = document.createElement("span");
        breadcrumb.className = "result-path";
        breadcrumb.textContent = m.path.slice(0, -1).join(" › ");
        item.appendChild(breadcrumb);
      }

      item.onclick = function() { openMatch(m); };
      col.appendChild(item);
    });
  }

  while (stage.firstChild) stage.removeChild(stage.firstChild);
  stage.appendChild(col);
  stage.scrollLeft = 0;
  targetScrollLeft = 0;

  resultsCount.hidden = false;
  resultsCount.textContent = matches.length === 1
    ? "1 resultado"
    : matches.length + " resultados";
}

function openMatch(m) {
  playClick("open");

  // O resultado precisa ficar visível dentro do filtro atual
  if (filterMode !== "all" && filterMode !== m.path[0]) {
    filterMode = "all";
    filterSelect.value = "all";
  }

  path = m.path.slice();
  clearSearch();
  syncRender();
}

function clearSearch() {
  searchQuery = "";
  searchInput.value = "";
  searchClear.hidden = true;
  resultsCount.hidden = true;
  resultsCount.textContent = "";
}

function toSuperDigits(num) {
  var map = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
  };
  return String(num).split("").map(function(d) { return map[d] || d; }).join("");
}

function getItemCount(colIndex, key) {
  var targetPath = path.slice(0, colIndex).concat([key]);
  var node = resolve(targetPath);
  if (node && typeof node === "object" && !isLeaf(node)) {
    var count = Object.keys(node).length;
    return count > 0 ? toSuperDigits(count) : null;
  }
  return null;
}

function thumbFor(src) {
  if (!src) return null;
  return THUMB_MAP[src] || src;
}

// Lista, em ordem, a imagem de cada folha dentro de um nó
function leafImages(node) {
  var out = [];
  if (!node || typeof node !== "object") return out;
  if (isLeaf(node)) {
    var own = node.img || (node.images && node.images.length ? node.images[0] : null);
    if (own) out.push(own);
    return out;
  }
  Object.keys(node).forEach(function(key) {
    out = out.concat(leafImages(node[key]));
  });
  return out;
}

// Toda label ganha uma imagem. Pastas recebem a primeira imagem da sua
// subárvore que ainda não foi usada por um ancestral, então irmãs nunca
// repetem a mesma foto. Sem opção livre, a pasta repete a do primeiro filho.
var thumbAssignments = {};

function assignThumbs() {
  thumbAssignments = {};

  function walk(node, keys, taken) {
    if (!node || typeof node !== "object") return;

    if (isLeaf(node)) {
      var own = node.img || (node.images && node.images.length ? node.images[0] : null);
      if (own) thumbAssignments[keys.join("|")] = own;
      return;
    }

    var images = leafImages(node);
    var pick = null;
    for (var i = 0; i < images.length; i++) {
      if (!taken[images[i]]) { pick = images[i]; break; }
    }
    if (!pick && images.length) pick = images[0];

    var childTaken = taken;
    if (pick) {
      thumbAssignments[keys.join("|")] = pick;
      childTaken = {};
      Object.keys(taken).forEach(function(k) { childTaken[k] = true; });
      childTaken[pick] = true;
    }

    Object.keys(node).forEach(function(key) {
      walk(node[key], keys.concat([key]), childTaken);
    });
  }

  walk(tree, [], {});
}

function assignedThumb(pathKeys) {
  return thumbAssignments[pathKeys.join("|")] || null;
}

function getItemThumb(colIndex, key) {
  var targetPath = path.slice(0, colIndex).concat([key]);
  return thumbFor(assignedThumb(targetPath));
}

function makeThumb(src) {
  var thumb = document.createElement("img");
  thumb.className = "item-thumb";
  if (assetNeedsInvert(src)) thumb.classList.add("ink-dark");
  thumb.src = src;
  thumb.alt = "";
  thumb.loading = "lazy";
  thumb.decoding = "async";
  thumb.width = 24;
  thumb.height = 24;
  thumb.onerror = function() { thumb.style.display = "none"; };
  return thumb;
}

function renderColumnEl(keys, colIndex, activeKey) {
  var col = document.createElement("div");
  col.className = "col";
  keys.forEach(function(key) {
    var item = document.createElement("a");
    item.className = "item" + (key === activeKey ? " active" : "");
    item.dataset.key = key;

    var label = document.createElement("span");
    label.className = "item-label";
    label.textContent = key;
    item.appendChild(label);

    var count = getItemCount(colIndex, key);
    if (count) {
      var sup = document.createElement("span");
      sup.className = "item-count";
      sup.textContent = count;
      item.appendChild(sup);
    }

    var thumbSrc = getItemThumb(colIndex, key);
    if (thumbSrc) item.appendChild(makeThumb(thumbSrc));

    item.onclick = function() { onItemClick(colIndex, key, item); };
    col.appendChild(item);
  });
  return col;
}

function updateColumnEl(col, keys, colIndex, activeKey) {
  var currentItems = Array.from(col.children);
  var currentKeys = currentItems.map(function(el) { return el.dataset.key; });

  // Se as chaves mudaram, reconstrói a coluna
  if (currentKeys.join("|") !== keys.join("|")) {
    col.innerHTML = "";
    keys.forEach(function(key) {
      var item = document.createElement("a");
      item.className = "item" + (key === activeKey ? " active" : "");
      item.dataset.key = key;

      var label = document.createElement("span");
      label.className = "item-label";
      label.textContent = key;
      item.appendChild(label);

      var count = getItemCount(colIndex, key);
      if (count) {
        var sup = document.createElement("span");
        sup.className = "item-count";
        sup.textContent = count;
        item.appendChild(sup);
      }

      var thumbSrc = getItemThumb(colIndex, key);
      if (thumbSrc) item.appendChild(makeThumb(thumbSrc));

      item.onclick = function() { onItemClick(colIndex, key, item); };
      col.appendChild(item);
    });
  } else {
    // Atualiza a classe active e o thumbnail sem reconstruir o DOM
    currentItems.forEach(function(el) {
      if (el.dataset.key === activeKey) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }

      // O thumb pode ter mudado depois, por exemplo quando a discografia carrega
      var want = getItemThumb(colIndex, el.dataset.key);
      var img = el.querySelector(".item-thumb");
      if (want) {
        if (!img) {
          el.appendChild(makeThumb(want));
        } else if (img.getAttribute("src") !== want) {
          img.src = want;
          img.classList.toggle("ink-dark", assetNeedsInvert(want));
        }
      } else if (img) {
        el.removeChild(img);
      }
    });
  }
}

// Cabeçalho de seção: título em caixa alta e um fio que estica até o fim
function detailSectionHead(text) {
  var head = document.createElement("div");
  head.className = "section-head";
  var h = document.createElement("h4");
  h.textContent = text;
  head.appendChild(h);
  var rule = document.createElement("span");
  rule.className = "section-rule";
  head.appendChild(rule);
  return head;
}

// Ficha técnica: uma caixa por dado, com ícone e rótulo
function detailSpecEl(spec) {
  var grid = document.createElement("div");
  grid.className = "spec-grid";
  // Com número ímpar de caixas a última ocupa a linha inteira
  var wide = spec.length % 2 === 1;
  spec.forEach(function(s, i) {
    var box = document.createElement("div");
    box.className = "spec-box" + (wide && i === spec.length - 1 ? " wide" : "");
    box.appendChild(discIcon(s.icon, "spec-icon"));
    var text = document.createElement("span");
    text.className = "spec-text";
    var label = document.createElement("span");
    label.className = "spec-label";
    label.textContent = s.label;
    var value = document.createElement("span");
    value.className = "spec-value";
    value.textContent = s.value;
    text.appendChild(label);
    text.appendChild(value);
    box.appendChild(text);
    grid.appendChild(box);
  });
  return grid;
}

// Lista de faixas com duração, crédito, ISRC e link
function detailTracksEl(tracks) {
  var list = document.createElement("div");
  list.className = "track-list";
  tracks.forEach(function(t, i) {
    var row = document.createElement("div");
    row.className = "track-row";

    var num = document.createElement("span");
    num.className = "track-num";
    num.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
    row.appendChild(num);

    var main = document.createElement("div");
    main.className = "track-main";

    var title = document.createElement("div");
    title.className = "track-title";
    var name = document.createElement("span");
    name.textContent = t.title;
    title.appendChild(name);
    if (t.explicit) {
      var ex = document.createElement("span");
      ex.className = "track-explicit";
      ex.textContent = "E";
      ex.title = "conteúdo explícito";
      title.appendChild(ex);
    }
    main.appendChild(title);

    if (t.artists && t.artists.length) {
      var art = document.createElement("div");
      art.className = "track-sub";
      art.textContent = discJoin(t.artists);
      main.appendChild(art);
    }
    if (t.roles && t.roles.length) {
      var roles = document.createElement("div");
      roles.className = "track-roles";
      roles.textContent = discJoin(t.roles);
      main.appendChild(roles);
    }
    if (t.isrc) {
      var isrc = document.createElement("div");
      isrc.className = "track-isrc";
      isrc.textContent = "ISRC " + t.isrc;
      main.appendChild(isrc);
    }
    row.appendChild(main);

    var side = document.createElement("div");
    side.className = "track-side";
    if (t.duration) {
      var dur = document.createElement("span");
      dur.className = "track-dur";
      dur.textContent = t.duration;
      side.appendChild(dur);
    }
    if (t.spotify) {
      var link = document.createElement("a");
      link.className = "track-play";
      link.href = t.spotify;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "abrir " + t.title + " no spotify");
      link.appendChild(discIcon("play"));
      side.appendChild(link);
    }
    row.appendChild(side);

    list.appendChild(row);
  });
  return list;
}

// Caixas de link externo
function detailLinksEl(links) {
  var boxes = document.createElement("div");
  boxes.className = "link-boxes";
  links.forEach(function(l) {
    var a = document.createElement("a");
    a.className = "link-box";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(discIcon("link"));
    var span = document.createElement("span");
    span.textContent = l.label;
    a.appendChild(span);
    boxes.appendChild(a);
  });
  return boxes;
}

// ------------------------------------------------- coluna fixa da direita
// O item final abre numa coluna fixa, do topo ao rodapé. Ela sai do fluxo
// do viewport, então tudo o que está à esquerda encolhe e é empurrado.
var detailPanel = document.getElementById("detail-panel");
var panelScroll = document.getElementById("panel-scroll");
var panelClose = document.getElementById("panel-close");
var panelOpenPath = null;

function showDetail(node, nodePath) {
  if (!detailPanel || !panelScroll) return;

  if (!node) {
    if (panelOpenPath === null) return;
    panelOpenPath = null;
    panelScroll.classList.remove("panel-swap");
    detailPanel.classList.remove("open");
    detailPanel.setAttribute("inert", "");
    // O conteúdo sai depois da transição, para não cortar a animação
    setTimeout(function() {
      if (!detailPanel.classList.contains("open")) panelScroll.innerHTML = "";
    }, 320);
    return;
  }

  var key = nodePath.join(" > ");
  if (panelOpenPath === key && detailPanel.classList.contains("open")) return;
  var hadOpen = detailPanel.classList.contains("open");
  panelOpenPath = key;

  panelScroll.classList.remove("panel-swap");
  panelScroll.innerHTML = "";

  var crumb = document.createElement("div");
  crumb.className = "panel-crumb";
  crumb.textContent = nodePath.join(" › ");
  panelScroll.appendChild(crumb);

  panelScroll.appendChild(renderDetailEl(node));

  detailPanel.classList.add("open");
  detailPanel.removeAttribute("inert");
  panelScroll.scrollTop = 0;

  // Item trocado com a coluna já aberta: o miolo entra num passo curto.
  // Na primeira abertura a própria coluna já faz a animação de largura.
  if (hadOpen) {
    void panelScroll.offsetWidth;
    panelScroll.classList.add("panel-swap");
  }

  // O palco encolheu: o scroll se reajusta ao novo limite
  requestAnimationFrame(function() {
    var max = Math.max(0, stage.scrollWidth - stage.clientWidth);
    if (stage.scrollLeft > max) animateScrollTo(max, 300);
  });
}

if (panelClose) {
  panelClose.addEventListener("click", function() {
    playClick("close");
    path = path.slice(0, -1);
    syncRender();
  });
}

function renderDetailEl(node) {
  var detail = document.createElement("div");
  detail.className = "detail-view";

  if (node.title) {
    var t = document.createElement("div");
    t.className = "detail-title";
    t.textContent = node.title;
    detail.appendChild(t);
  }

  if (node.meta) {
    var m = document.createElement("div");
    m.className = "detail-meta";
    m.textContent = node.meta;
    detail.appendChild(m);
  }

  if (node.images && Array.isArray(node.images)) {
    var gal = document.createElement("div");
    gal.className = "gallery-grid";
    node.images.forEach(function(src, idx) {
      var it = document.createElement("div");
      it.className = "gallery-item";
      var img = document.createElement("img");
      img.className = "detail-media";
      if (assetNeedsInvert(src)) img.classList.add("ink-dark");
      img.src = src;
      img.alt = (node.title || "") + " " + (idx + 1);
      img.loading = "lazy";
      img.onerror = function() { it.style.display = "none"; };
      it.appendChild(img);
      gal.appendChild(it);
    });
    detail.appendChild(gal);
  } else if (node.img) {
    var img = document.createElement("img");
    img.className = node.spec ? "detail-media detail-cover" : "detail-media";
    if (assetNeedsInvert(node.img)) img.classList.add("ink-dark");
    img.src = node.img;
    img.alt = node.title || "";
    img.loading = "lazy";
    img.onerror = function() { img.style.display = "none"; };
    detail.appendChild(img);
  }

  // Ficha técnica
  if (node.spec && node.spec.length) {
    var specSection = document.createElement("div");
    specSection.className = "detail-section";
    specSection.appendChild(detailSectionHead("ficha técnica"));
    specSection.appendChild(detailSpecEl(node.spec));
    detail.appendChild(specSection);
  }

  // Descrição
  if (node.body) {
    var bodySection = document.createElement("div");
    bodySection.className = "detail-section";
    if (node.spec) {
      bodySection.appendChild(detailSectionHead("descrição"));
      var box = document.createElement("div");
      box.className = "desc-box";
      box.textContent = node.body;
      bodySection.appendChild(box);
    } else {
      var b = document.createElement("div");
      b.className = "detail-body";
      b.textContent = node.body;
      bodySection.appendChild(b);
    }
    detail.appendChild(bodySection);
  }

  // Faixas
  if (node.tracks && node.tracks.length) {
    var trackSection = document.createElement("div");
    trackSection.className = "detail-section";
    trackSection.appendChild(detailSectionHead("faixas"));
    trackSection.appendChild(detailTracksEl(node.tracks));
    detail.appendChild(trackSection);
  }

  // Links
  if (node.links && node.links.length) {
    var linkSection = document.createElement("div");
    linkSection.className = "detail-section";
    linkSection.appendChild(detailSectionHead("links"));
    linkSection.appendChild(detailLinksEl(node.links));
    detail.appendChild(linkSection);
  } else if (node.link) {
    var l = document.createElement("a");
    l.className = "detail-link";
    l.href = node.link;
    l.target = "_blank";
    l.rel = "noopener noreferrer";
    l.textContent = "abrir link ↗";
    detail.appendChild(l);
  }

  return detail;
}

// Eventos do header
searchInput.addEventListener("input", function() {
  searchQuery = this.value.trim();
  searchClear.hidden = !searchQuery;
  if (searchQuery) {
    renderResults();
  } else {
    resultsCount.hidden = true;
    resultsCount.textContent = "";
    syncRender();
  }
});

searchClear.addEventListener("click", function() {
  clearSearch();
  searchInput.focus();
  syncRender();
});

filterSelect.addEventListener("change", function() {
  filterMode = this.value;
  path = [];
  if (searchQuery) renderResults(); else syncRender();
});

sortSelect.addEventListener("change", function() {
  sortMode = this.value;
  pendingScrollLeft = stage.scrollLeft;
  if (searchQuery) {
    renderResults();
  } else {
    syncRender();
  }
});

document.addEventListener("keydown", function(e) {
  var tag = document.activeElement ? document.activeElement.tagName : "";
  var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  if (e.key === "/" && !typing) {
    e.preventDefault();
    searchInput.focus();
    return;
  }

  if (e.key === "Escape" && document.activeElement === searchInput) {
    clearSearch();
    searchInput.blur();
    syncRender();
  }
});

