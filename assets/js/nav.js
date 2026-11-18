// Scroll horizontal do stage. Um motor só.
var targetScrollLeft = 0;
var isScrolling = false;
var scrollAnim = null;

function clampScroll(x) {
  var max = Math.max(0, stage.scrollWidth - stage.clientWidth);
  return Math.max(0, Math.min(max, x));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

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
    stage.scrollLeft = scrollAnim.from + (scrollAnim.to - scrollAnim.from) * easeOutCubic(p);
    if (p < 1) requestAnimationFrame(scrollTick);
    else {
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

  var el = e.target;
  while (el && el !== stage) {
    if ((el.classList.contains("col") || el.classList.contains("detail-view")) && el.scrollHeight > el.clientHeight) {
      var atTop = el.scrollTop <= 0 && delta < 0;
      var atBottom = (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) && delta > 0;
      if (!atTop && !atBottom) return;
    }
    el = el.parentElement;
  }

  e.preventDefault();
  scrollAnim = null;
  targetScrollLeft = clampScroll((isScrolling ? targetScrollLeft : stage.scrollLeft) + delta * 1.2);
  if (!isScrolling) {
    isScrolling = true;
    requestAnimationFrame(scrollTick);
  }
}, { passive: false });

var stageDrag = null;
var suppressStageClick = false;

function stageDragStart(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  var t = e.target;
  if (!t) return;
  if (t.tagName === "IMG") t.draggable = false;
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
  var now = (window.performance && performance.now) ? performance.now() : Date.now();
  var dt = now - stageDrag.lastT;
  if (dt > 0) {
    stageDrag.samples.push((e.clientX - stageDrag.lastX) / dt);
    if (stageDrag.samples.length > 4) stageDrag.samples.shift();
    stageDrag.lastT = now;
    stageDrag.lastX = e.clientX;
  }
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

  suppressStageClick = true;
  var v = 0;
  if (d.samples.length) {
    v = d.samples.reduce(function(a, b) { return a + b; }, 0) / d.samples.length;
    v = Math.max(-2.2, Math.min(2.2, v));
  }
  if (Math.abs(v) > 0.05) animateScrollTo(stage.scrollLeft - v * 240, 620);
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
  if (el) {
    el.classList.remove("push");
    void el.offsetWidth;
    el.classList.add("push");
  }
  if (path[colIndex] === key) path = path.slice(0, colIndex);
  else {
    path = path.slice(0, colIndex);
    path.push(key);
  }
  syncRender();
}

function deskSavePath() {
  try {
    localStorage.setItem("matesu.path", JSON.stringify({ path: path, filter: filterMode }));
  } catch (e) {}
}

function deskRestorePath() {
  try {
    var raw = localStorage.getItem("matesu.path");
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.path)) return;
    var node = tree;
    var clean = [];
    for (var i = 0; i < saved.path.length; i++) {
      if (!node || typeof node !== "object" || !(saved.path[i] in node)) break;
      clean.push(saved.path[i]);
      node = node[saved.path[i]];
    }
    path = clean;
    if (saved.filter && saved.filter !== "all" && tree[saved.filter]) filterMode = saved.filter;
  } catch (e) {}
  if (filterSelect) filterSelect.value = filterMode;
  deskPathReady = true;
}

function syncRender() {
  assignThumbs();
  if (deskPathReady && !searchQuery) deskSavePath();
  if (typeof mapRender === "function") mapRender();

  if (searchQuery) {
    renderResults();
    return;
  }

  var rootKeys = Object.keys(tree);
  if (filterMode !== "all") rootKeys = rootKeys.filter(function(k) { return k === filterMode; });

  var targetLevels = [{
    type: "column",
    keys: sortKeys(rootKeys, 0),
    activeKey: path[0] || null
  }];

  var leafNode = null;
  for (var i = 0; i < path.length; i++) {
    var node = resolve(path.slice(0, i + 1));
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

  if (stage.children.length > targetLevels.length) {
    var toRemove = Array.prototype.slice.call(stage.children).slice(targetLevels.length);
    toRemove.forEach(function(el) {
      el.classList.add("leaving");
      el.style.position = "absolute";
      el.style.left = el.offsetLeft + "px";
      el.style.top = el.offsetTop + "px";
      el.style.width = el.offsetWidth + "px";
      el.style.height = el.offsetHeight + "px";
    });
    setTimeout(function() {
      toRemove.forEach(function(el) {
        if (el.parentNode === stage) stage.removeChild(el);
      });
      applyLevels(targetLevels, true);
    }, 200);
  } else {
    applyLevels(targetLevels, false);
  }
}

function applyLevels(targetLevels) {
  targetLevels.forEach(function(lvl, colIdx) {
    var existing = stage.children[colIdx];
    if (!existing || !existing.classList.contains("col")) {
      var newCol = renderColumnEl(lvl.keys, colIdx, lvl.activeKey);
      if (existing) stage.replaceChild(newCol, existing);
      else stage.appendChild(newCol);
    } else {
      updateColumnEl(existing, lvl.keys, colIdx, lvl.activeKey);
    }
  });
}

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
      var item = document.createElement("button");
      item.type = "button";
      item.className = "item result-item";
      item.dataset.key = m.key;
      item.textContent = resultLabel(m);
      if (m.path.length > 1) item.title = m.path.slice(0, -1).join(" › ");
      item.addEventListener("click", function() { openMatch(m); });
      col.appendChild(item);
    });
  }

  stage.innerHTML = "";
  stage.appendChild(col);
  stage.scrollLeft = 0;
  targetScrollLeft = 0;
  if (resultsCount) {
    resultsCount.hidden = false;
    resultsCount.textContent = matches.length === 1 ? "1 resultado" : matches.length + " resultados";
  }
}

function openMatch(m) {
  if (filterMode !== "all" && filterMode !== m.path[0]) {
    filterMode = "all";
    if (filterSelect) filterSelect.value = "all";
  }
  path = m.path.slice();
  clearSearch();
  syncRender();
}

function clearSearch() {
  searchQuery = "";
  if (searchInput) searchInput.value = "";
  if (searchClear) searchClear.hidden = true;
  if (resultsCount) {
    resultsCount.hidden = true;
    resultsCount.textContent = "";
  }
}

function getItemCount(colIndex, key) {
  var node = resolve(path.slice(0, colIndex).concat([key]));
  if (node && typeof node === "object" && !isLeaf(node)) {
    var count = Object.keys(node).length;
    return count > 0 ? String(count) : null;
  }
  return null;
}

function thumbFor(src) {
  if (!src) return null;
  return THUMB_MAP[src] || src;
}

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
  return thumbFor(assignedThumb(path.slice(0, colIndex).concat([key])));
}

function makeThumb(src) {
  var thumb = document.createElement("img");
  thumb.className = "item-thumb";
  thumb.src = src;
  thumb.alt = "";
  thumb.loading = "lazy";
  thumb.decoding = "async";
  thumb.width = 22;
  thumb.height = 22;
  thumb.onerror = function() { thumb.style.display = "none"; };
  return thumb;
}

function renderColumnEl(keys, colIndex, activeKey) {
  var col = document.createElement("div");
  col.className = "col";
  keys.forEach(function(key) {
    var item = document.createElement("button");
    item.type = "button";
    item.className = "item" + (key === activeKey ? " active" : "");
    item.dataset.key = key;

    var label = document.createElement("span");
    label.className = "item-label";
    label.textContent = key;
    item.appendChild(label);

    var count = getItemCount(colIndex, key);
    if (count) {
      var countEl = document.createElement("span");
      countEl.className = "item-count";
      countEl.textContent = count;
      item.appendChild(countEl);
    }

    var thumbSrc = getItemThumb(colIndex, key);
    if (thumbSrc) item.appendChild(makeThumb(thumbSrc));

    item.addEventListener("click", function() { onItemClick(colIndex, key, item); });
    col.appendChild(item);
  });
  return col;
}

function updateColumnEl(col, keys, colIndex, activeKey) {
  var currentItems = Array.prototype.slice.call(col.children);
  var currentKeys = currentItems.map(function(el) { return el.dataset.key; });

  if (currentKeys.join("|") !== keys.join("|")) {
    var fresh = renderColumnEl(keys, colIndex, activeKey);
    col.innerHTML = "";
    while (fresh.firstChild) col.appendChild(fresh.firstChild);
    return;
  }

  currentItems.forEach(function(el) {
    el.classList.toggle("active", el.dataset.key === activeKey);
    var want = getItemThumb(colIndex, el.dataset.key);
    var img = el.querySelector(".item-thumb");
    if (want) {
      if (!img) el.appendChild(makeThumb(want));
      else if (img.getAttribute("src") !== want) img.src = want;
    } else if (img) {
      el.removeChild(img);
    }
  });
}

var detailPanel = document.getElementById("detail-panel");
var panelScroll = document.getElementById("panel-scroll");
var panelClose = document.getElementById("panel-close");
var panelOpenPath = null;

function showDetail(node, nodePath) {
  if (!detailPanel || !panelScroll) return;
  if (!node) {
    if (panelOpenPath === null) return;
    panelOpenPath = null;
    detailPanel.classList.remove("open");
    detailPanel.setAttribute("inert", "");
    setTimeout(function() {
      if (!detailPanel.classList.contains("open")) panelScroll.innerHTML = "";
    }, 220);
    return;
  }

  var key = nodePath.join(" > ");
  if (panelOpenPath === key && detailPanel.classList.contains("open")) return;
  var hadOpen = detailPanel.classList.contains("open");
  panelOpenPath = key;
  panelScroll.innerHTML = "";

  var crumb = document.createElement("div");
  crumb.className = "panel-crumb";
  crumb.textContent = nodePath.join(" › ");
  panelScroll.appendChild(crumb);
  panelScroll.appendChild(renderDetailEl(node));

  detailPanel.classList.add("open");
  detailPanel.removeAttribute("inert");
  panelScroll.scrollTop = 0;

  if (hadOpen) {
    void panelScroll.offsetWidth;
    panelScroll.classList.add("panel-swap");
  }
}

if (panelClose) {
  panelClose.addEventListener("click", function() {
    path = path.slice(0, -1);
    syncRender();
  });
}

function renderDetailEl(node) {
  var detail = document.createElement("div");
  detail.className = "detail-view";

  if (node.title) {
    var t = document.createElement("h2");
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
      var img = document.createElement("img");
      img.src = src;
      img.alt = (node.title || "") + " " + (idx + 1);
      img.loading = "lazy";
      img.onerror = function() { img.style.display = "none"; };
      gal.appendChild(img);
    });
    detail.appendChild(gal);
  } else if (node.img) {
    var img = document.createElement("img");
    img.className = "detail-media";
    img.src = node.img;
    img.alt = node.title || "";
    img.loading = "lazy";
    img.onerror = function() { img.style.display = "none"; };
    detail.appendChild(img);
  }

  if (node.body) {
    var body = document.createElement("p");
    body.className = "detail-body";
    body.textContent = node.body;
    detail.appendChild(body);
  }

  if (node.tracks && node.tracks.length) {
    var trackSection = document.createElement("div");
    trackSection.className = "detail-section";
    trackSection.appendChild(sectionHead("faixas"));
    trackSection.appendChild(trackListEl(node.tracks));
    detail.appendChild(trackSection);
  }

  if (node.links && node.links.length) {
    var linkSection = document.createElement("div");
    linkSection.className = "detail-section";
    linkSection.appendChild(sectionHead("links"));
    linkSection.appendChild(linksEl(node.links));
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

function sectionHead(text) {
  var head = document.createElement("div");
  head.className = "section-head";
  var h = document.createElement("h4");
  h.textContent = text;
  head.appendChild(h);
  return head;
}

function trackListEl(tracks) {
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
    title.textContent = t.title || "";
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

    row.appendChild(main);

    var side = document.createElement("div");
    side.className = "track-side";
    if (t.duration) {
      var dur = document.createElement("span");
      dur.className = "track-dur";
      dur.textContent = t.duration;
      side.appendChild(dur);
    }
    row.appendChild(side);
    list.appendChild(row);
  });
  return list;
}

function linksEl(links) {
  var boxes = document.createElement("div");
  boxes.className = "link-boxes";
  links.forEach(function(l) {
    var a = document.createElement("a");
    a.className = "link-box";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label;
    boxes.appendChild(a);
  });
  return boxes;
}

if (searchInput) {
  searchInput.addEventListener("input", function() {
    searchQuery = this.value.trim();
    if (searchClear) searchClear.hidden = !searchQuery;
    if (searchQuery) renderResults();
    else syncRender();
  });
}

if (searchClear) {
  searchClear.addEventListener("click", function() {
    clearSearch();
    if (searchInput) searchInput.focus();
    syncRender();
  });
}

if (filterSelect) {
  filterSelect.addEventListener("change", function() {
    filterMode = this.value;
    path = [];
    if (searchQuery) renderResults();
    else syncRender();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", function() {
    sortMode = this.value;
    if (searchQuery) renderResults();
    else syncRender();
  });
}

document.addEventListener("keydown", function(e) {
  var tag = document.activeElement ? document.activeElement.tagName : "";
  var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  if (e.key === "/" && !typing && searchInput) {
    e.preventDefault();
    searchInput.focus();
  }

  if (e.key === "Escape" && document.activeElement === searchInput) {
    clearSearch();
    if (searchInput) searchInput.blur();
    syncRender();
  }
});