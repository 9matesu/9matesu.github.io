// =====================================================================
//  WINDOWS MEDIA PLAYER
//  A biblioteca fica em pastas por ano. Cada pasta abre a lista de
//  faixas; o player toca o áudio e oferece o download do release.
// =====================================================================

var wmpState = {
  releases: [],       // lançamentos do discography.json
  covers: {},         // capas do sidecar
  folder: null,       // ano selecionado
  track: null,        // faixa em reprodução
  live: false,        // tocando stream "ao vivo"
  audio: null,
  win: null,          // janela aberta
  query: "",          // busca atual
  volume: 0.8,
  seeking: false
};

// Ícone de MP3 para as faixas
var WMP_TRACK_ICON = "img/xp/WindowsMediaPlayer10.png";

// Base dos áudios. O catálogo guarda o caminho relativo de cada faixa em
// track.path; se o arquivo local faltar (404), o player tenta a mesma
// trilha no Internet Archive antes de avisar que o áudio não está no host.
var WMP_AUDIO_BASE = "";
var WMP_AUDIO_REMOTE = "https://archive.org/download/matesu-discografia/";

function wmpAudioUrl(release, track) {
  if (track && track.path) return WMP_AUDIO_BASE + track.path;
  var artist = (release.artist || "desconhecido").toLowerCase();
  var title = (track.title || "faixa").toLowerCase();
  var safe = function(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  };
  return WMP_AUDIO_BASE + "audio/" + safe(artist) + "/" + safe(title) + ".mp3";
}

function wmpDownloadUrl(release, track) {
  if (track && track.path) return WMP_AUDIO_BASE + track.path;
  if (track && track.preview) return track.preview;
  if (release.download) return release.download;
  if (track && track.spotify) return track.spotify;
  return null;
}

function wmpFormatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  var m = Math.floor(sec / 60);
  var s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

// ------------------------------------------------- construir o player
function wmpEl(tag, cls, text) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}

function wmpSvg(inner) {
  return '<svg viewBox="0 0 16 16" aria-hidden="true">' + inner + "</svg>";
}

function wmpGlyph(kind) {
  if (kind === "prev") return wmpSvg('<path d="M4 3h2v10H4zM13 3v10L6 8z"/>');
  if (kind === "next") return wmpSvg('<path d="M10 3h2v10h-2zM3 3l7 5-7 5z"/>');
  if (kind === "pause") return wmpSvg('<path d="M5 3h2v10H5zM9 3h2v10H9z"/>');
  if (kind === "stop") return wmpSvg('<path d="M4 4h8v8H4z"/>');
  return wmpSvg('<path d="M4 3l9 5-9 5z"/>');
}

function wmpToolbarIcon(kind) {
  if (kind === "back") {
    return '<svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5"/></svg>';
  }
  if (kind === "home") {
    return '<svg viewBox="0 0 16 16"><path d="M2.5 7.5L8 3l5.5 4.5M4 6.5V13h8V6.5"/></svg>';
  }
  return '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2L14 14"/></svg>';
}

function wmpChevronSvg() {
  return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4z"/></svg>';
}

function wmpNoteSvg() {
  return wmpSvg('<path d="M6 12.2V4.4l6-1.2v7.4"/><circle cx="4.4" cy="12.4" r="1.7"/><circle cx="10.4" cy="11.2" r="1.7"/>');
}

function wmpHue(text) {
  var h = 0;
  var s = String(text || "wmp");
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function wmpFillCover(box, release) {
  box.innerHTML = "";
  if (!release) {
    box.classList.add("wmp-cover-ph");
    box.textContent = "WMP";
    return;
  }
  box.classList.remove("wmp-cover-ph");
  var cover = wmpState.covers[release.title];
  if (cover && cover.local) {
    var img = document.createElement("img");
    img.src = cover.local;
    img.alt = "";
    box.appendChild(img);
    return;
  }
  var letter = wmpEl("span", "wmp-cover-letter", String(release.title || "?").charAt(0).toUpperCase());
  var hue = wmpHue(release.title);
  letter.style.background = "linear-gradient(135deg, hsl(" + hue + " 58% 52%), hsl(" + ((hue + 38) % 360) + " 64% 30%))";
  box.appendChild(letter);
}

function xpOpenPlayer() {
  var existing = document.getElementById("xp-player");
  if (existing) {
    var found = xpOpenWindows.filter(function(w) { return w.id === "xp-player"; })[0];
    if (found) xpFocusWindow(found);
    return found;
  }

  var win = xpCreateWindow({
    id: "xp-player",
    kind: "wmp",
    title: "Windows Media Player",
    icon: "img/xp/WindowsMediaPlayer10.png",
    width: 800,
    height: 500,
    left: 70,
    top: 40,
    build: function(win, body) {
      body.innerHTML = "";

      var app = wmpEl("div", "wmp-app");
      var nav = wmpEl("nav", "wmp-nav");
      nav.setAttribute("aria-label", "modos do player");

      var navSpecs = [
        ["now", "Player", "agora tocando"],
        ["skin", "Temas", "skins"],
        ["viz", "Visualizador", "barras"],
        ["live", "Ao vivo", "stream"]
      ];

      var navButtons = {};
      navSpecs.forEach(function(spec) {
        var b = wmpEl("button", "wmp-nav-btn");
        b.type = "button";
        b.appendChild(document.createTextNode(spec[1]));
        b.appendChild(wmpEl("small", null, spec[2]));
        b.addEventListener("click", function() {
          wmpGo(win, spec[0]);
        });
        navButtons[spec[0]] = b;
        nav.appendChild(b);
      });

      var main = wmpEl("div", "wmp-main");

      var toolbar = wmpEl("div", "wmp-toolbar");

      function toolbarButton(kind, label) {
        var b = wmpEl("button", "wmp-tb-btn");
        b.type = "button";
        b.title = label;
        b.setAttribute("aria-label", label);
        b.innerHTML = wmpToolbarIcon(kind);
        return b;
      }

      var bBack = toolbarButton("back", "ver todas as faixas");
      bBack.addEventListener("click", function() {
        wmpState.folder = null;
        wmpState.query = "";
        win.wmp.search.value = "";
        wmpRenderLibrary(win);
        wmpRenderList(win);
      });
      toolbar.appendChild(bBack);

      var bHome = toolbarButton("home", "inicio da biblioteca");
      bHome.addEventListener("click", function() {
        wmpState.folder = null;
        wmpState.query = "";
        win.wmp.search.value = "";
        wmpRenderLibrary(win);
        wmpRenderList(win);
      });
      toolbar.appendChild(bHome);

      var search = wmpEl("label", "wmp-search");
      search.innerHTML = wmpToolbarIcon("search");
      var input = document.createElement("input");
      input.type = "search";
      input.placeholder = "pesquisar faixas";
      input.setAttribute("aria-label", "pesquisar faixas");
      input.addEventListener("input", function() {
        wmpState.query = input.value;
        wmpRenderList(win);
      });
      search.appendChild(input);
      toolbar.appendChild(search);

      var chip = wmpEl("div", "wmp-view");
      chip.appendChild(document.createTextNode("Biblioteca"));
      var chipSvg = document.createElement("span");
      chipSvg.innerHTML = wmpChevronSvg();
      chip.appendChild(chipSvg);
      toolbar.appendChild(chip);
      main.appendChild(toolbar);

      var content = wmpEl("div", "wmp-content");
      var side = wmpEl("aside", "xp-wmp-side");
      side.setAttribute("aria-label", "biblioteca por ano");
      content.appendChild(side);

      var listWrap = wmpEl("div", "wmp-list-wrap");
      var listHead = wmpEl("div", "wmp-list-head");
      listHead.setAttribute("aria-hidden", "true");
      ["#", "", "Titulo", "Artista", "Album", "Genero", "Tempo", "Bit rate", ""].forEach(function(label, i) {
        var cell = wmpEl("span", i === 0 || i === 6 || i === 7 ? "wmp-h-num" : null, label);
        listHead.appendChild(cell);
      });
      listWrap.appendChild(listHead);

      var list = wmpEl("div", "xp-wmp-list");
      list.setAttribute("role", "list");
      listWrap.appendChild(list);
      content.appendChild(listWrap);
      var panel = wmpEl("div", "wmp-view-panel");
      panel.style.display = "none";
      content.appendChild(panel);
      main.appendChild(content);

      app.appendChild(nav);
      app.appendChild(main);
      body.appendChild(app);

      var status = wmpEl("div", "xp-wmp-status");
      var cover = wmpEl("div", "xp-wmp-cover");
      status.appendChild(cover);
      var meta = wmpEl("div", "xp-wmp-meta");
      var song = wmpEl("b", null, "Song: nada tocando");
      var det = wmpEl("span", null, "escolha uma faixa na biblioteca");
      meta.appendChild(song);
      meta.appendChild(det);
      status.appendChild(meta);
      var statusRight = wmpEl("span", "wmp-status-right", "Item(s): 0");
      status.appendChild(statusRight);
      body.appendChild(status);

      var seekrow = wmpEl("div", "wmp-seekrow");
      var seek = wmpEl("div", "xp-wmp-seek");
      seek.setAttribute("role", "slider");
      seek.setAttribute("aria-label", "posicao da faixa");
      var fill = wmpEl("div", "xp-wmp-seek-fill");
      var knob = wmpEl("div", "xp-wmp-seek-knob");
      seek.appendChild(fill);
      seek.appendChild(knob);
      seekrow.appendChild(seek);
      var time = wmpEl("span", "xp-wmp-time", "0:00 / 0:00");
      seekrow.appendChild(time);
      body.appendChild(seekrow);

      var now = wmpEl("div", "xp-wmp-now");
      var bPrev = wmpEl("button", "xp-wmp-btn");
      bPrev.type = "button";
      bPrev.title = "anterior";
      bPrev.setAttribute("aria-label", "anterior");
      bPrev.innerHTML = wmpGlyph("prev");
      now.appendChild(bPrev);

      var bPlay = wmpEl("button", "xp-wmp-btn wmp-play");
      bPlay.type = "button";
      bPlay.title = "reproduzir";
      bPlay.setAttribute("aria-label", "reproduzir");
      bPlay.innerHTML = wmpGlyph("play");
      now.appendChild(bPlay);

      var bNext = wmpEl("button", "xp-wmp-btn");
      bNext.type = "button";
      bNext.title = "proxima";
      bNext.setAttribute("aria-label", "proxima");
      bNext.innerHTML = wmpGlyph("next");
      now.appendChild(bNext);

      var bStop = wmpEl("button", "xp-wmp-btn");
      bStop.type = "button";
      bStop.title = "parar";
      bStop.setAttribute("aria-label", "parar");
      bStop.innerHTML = wmpGlyph("stop");
      now.appendChild(bStop);

      var vol = wmpEl("label", "wmp-vol");
      vol.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 5.5c1.2 1.4 1.2 3.6 0 5"/></svg>';
      var volInput = document.createElement("input");
      volInput.type = "range";
      volInput.min = "0";
      volInput.max = "100";
      volInput.value = String(Math.round((wmpState.volume == null ? 0.8 : wmpState.volume) * 100));
      volInput.setAttribute("aria-label", "volume");
      volInput.addEventListener("input", function() {
        wmpState.volume = Number(volInput.value) / 100;
        if (wmpState.audio) wmpState.audio.volume = wmpState.volume;
      });
      vol.appendChild(volInput);
      now.appendChild(vol);

      var brand = wmpEl("span", "wmp-brand", "WMP");
      now.appendChild(brand);
      body.appendChild(now);

      win.wmp = {
        nav: nav,
        navButtons: navButtons,
        side: side,
        list: list,
        listHead: listHead,
        cover: cover,
        meta: meta,
        song: song,
        det: det,
        statusRight: statusRight,
        seek: seek,
        fill: fill,
        knob: knob,
        time: time,
        search: input,
        listWrap: listWrap,
        content: content,
        panel: panel,
        bPlay: bPlay,
        bPrev: bPrev,
        bNext: bNext,
        bStop: bStop
      };
      if (win.el) win.el.wmp = win.wmp;

      wmpState.win = win;

      bPlay.addEventListener("click", function() { wmpTogglePlay(win); });
      bStop.addEventListener("click", function() { wmpStop(win); });
      bPrev.addEventListener("click", function() { wmpStep(win, -1); });
      bNext.addEventListener("click", function() { wmpStep(win, 1); });

      function seekTo(e) {
        var a = wmpState.audio;
        if (!a || !isFinite(a.duration) || !a.duration) return;
        var r = seek.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        a.currentTime = ratio * a.duration;
        wmpUpdateTime(win);
      }
      seek.addEventListener("pointerdown", function(e) {
        wmpState.seeking = true;
        seek.setPointerCapture && seek.setPointerCapture(e.pointerId);
        seekTo(e);
      });
      seek.addEventListener("pointermove", function(e) {
        if (wmpState.seeking) seekTo(e);
      });
      seek.addEventListener("pointerup", function() { wmpState.seeking = false; });
      seek.addEventListener("pointercancel", function() { wmpState.seeking = false; });

      wmpRenderLibrary(win);
      wmpRenderList(win);
      wmpRenderStatus(win);
      wmpUpdatePlayButton(win);
      wmpUpdateTime(win);
    }
  });

  return win;
}

// --------------------------------------------------------------- biblioteca
function wmpRenderLibrary(win) {
  if (!win || !win.wmp) return;
  var side = win.wmp.side;
  side.innerHTML = "";

  function folderButton(label, iconSrc, folderValue, count) {
    var b = wmpEl("button", "xp-wmp-folder");
    b.type = "button";
    if (wmpState.folder === folderValue) b.classList.add("active");
    var ico = document.createElement("img");
    ico.src = iconSrc;
    ico.alt = "";
    b.appendChild(ico);
    b.appendChild(wmpEl("span", null, label));
    b.appendChild(wmpEl("span", "xp-wmp-count", String(count)));
    b.addEventListener("click", function() {
      wmpState.folder = folderValue;
      wmpRenderLibrary(win);
      wmpRenderList(win);
    });
    side.appendChild(b);
  }

  side.appendChild(wmpEl("div", "wmp-side-head", "Media Library"));

  var total = 0;
  wmpState.releases.forEach(function(r) { total += r.tracks.length; });
  folderButton("All Music", XP_ICONS.music, null, total);

  var years = {};
  wmpState.releases.forEach(function(r) {
    var y = String(r.year || "----");
    if (!years[y]) years[y] = 0;
    years[y] += r.tracks.length;
  });
  Object.keys(years).sort().reverse().forEach(function(y) {
    folderButton(y, XP_ICONS.folderClosed, y, years[y]);
  });
}

// ------------------------------------------------------------ lista de faixas
function wmpTrackMatches(rel, track, query) {
  if (!query) return true;
  var hay = [
    track.title,
    rel.title,
    rel.artist,
    rel.year,
    (rel.genres || []).join(" "),
    track.genre || ""
  ].join(" ").toLowerCase();
  return hay.indexOf(query) >= 0;
}

function wmpVisibleReleases() {
  return wmpState.releases.filter(function(r) {
    if (wmpState.folder === null) return true;
    return String(r.year) === wmpState.folder;
  });
}

function wmpQueue() {
  var q = String(wmpState.query || "").toLowerCase();
  var out = [];
  wmpVisibleReleases().forEach(function(rel) {
    rel.tracks.forEach(function(track) {
      if (wmpTrackMatches(rel, track, q)) out.push({ release: rel, track: track });
    });
  });
  return out;
}

function wmpBitrateLabel(track) {
  if (!track || !track._seconds || !track.size) return "\u2014";
  var kbps = Math.round((track.size * 8) / track._seconds / 1000);
  return kbps > 0 ? kbps + " kbps" : "\u2014";
}

function wmpRenderList(win) {
  if (!win || !win.wmp) return;
  var list = win.wmp.list;
  var keepScroll = list.scrollTop;
  list.innerHTML = "";

  var q = String(wmpState.query || "").toLowerCase();
  var releases = wmpVisibleReleases();
  var count = 0;

  releases.forEach(function(rel) {
    var tracks = rel.tracks.filter(function(track) {
      return wmpTrackMatches(rel, track, q);
    });
    if (!tracks.length) return;

    var head = wmpEl("div", "wmp-group");
    var grpCover = wmpEl("span", "wmp-group-cover");
    wmpFillCover(grpCover, rel);
    head.appendChild(grpCover);
    head.appendChild(wmpEl("span", "wmp-group-title", rel.title));
    head.appendChild(wmpEl("span", "wmp-group-meta", rel.artist + " \u00b7 " + rel.year));
    head.appendChild(wmpEl("span", "wmp-group-count", tracks.length + (tracks.length === 1 ? " faixa" : " faixas")));
    list.appendChild(head);

    tracks.forEach(function(track, i) {
      var playing = !!(wmpState.track &&
        wmpState.track.release === rel &&
        wmpState.track.track === track);

      var row = wmpEl("button", "xp-wmp-track" + (count % 2 ? " alt" : "") + (playing ? " playing" : ""));
      row.type = "button";
      row.setAttribute("role", "listitem");
      row.setAttribute("aria-label", "tocar " + track.title);
      row.title = track.title + " \u2014 " + rel.artist;

      row.appendChild(wmpEl("span", "wmp-num", String(i + 1)));

      var ico = wmpEl("span", "wmp-ico");
      if (playing) {
        ico.innerHTML = wmpNoteSvg();
      } else {
        var ti = document.createElement("img");
        ti.src = WMP_TRACK_ICON;
        ti.alt = "";
        ico.appendChild(ti);
      }
      row.appendChild(ico);

      row.appendChild(wmpEl("span", "wmp-title", track.title));
      row.appendChild(wmpEl("span", "wmp-artist", rel.artist || "\u2014"));
      row.appendChild(wmpEl("span", "wmp-album", rel.title));
      row.appendChild(wmpEl("span", "wmp-genre", (rel.genres && rel.genres[0]) || "\u2014"));
      row.appendChild(wmpEl("span", "wmp-len", track.duration || "\u2014"));
      row.appendChild(wmpEl("span", "wmp-br", wmpBitrateLabel(track)));

      var dlCell = wmpEl("span", "wmp-dl-cell");
      var dlUrl = wmpDownloadUrl(rel, track);
      if (dlUrl) {
        var dlA = document.createElement("a");
        dlA.className = "xp-wmp-dl";
        dlA.href = dlUrl;
        dlA.setAttribute("download", "");
        dlA.title = "baixar " + track.title;
        dlA.setAttribute("aria-label", "baixar " + track.title);
        dlA.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        dlA.addEventListener("click", function(e) { e.stopPropagation(); });
        dlCell.appendChild(dlA);
      }
      row.appendChild(dlCell);

      row.addEventListener("click", function() {
        wmpPlayTrack(win, rel, track);
      });

      row.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        e.stopPropagation();
        showXpMenu(e.clientX, e.clientY, [
          { label: "Reproduzir", action: function() { wmpPlayTrack(win, rel, track); } },
          { separator: true },
          { label: "Baixar", disabled: !wmpDownloadUrl(rel, track), action: function() {
              var u = wmpDownloadUrl(rel, track);
              if (u) window.open(u, "_blank", "noopener");
            } }
        ]);
      });

      list.appendChild(row);
      count++;
    });
  });

  if (!count) {
    var empty = wmpEl("div", "xp-wmp-empty");
    empty.textContent = q
      ? "nenhuma faixa encontrada para \u201c" + wmpState.query + "\u201d."
      : "nenhum lancamento nesta pasta.";
    list.appendChild(empty);
  }

  list.scrollTop = keepScroll;
  win.wmp.statusRight.textContent = "Item(s): " + count;
}

// ------------------------------------------------- roteador de páginas do wmp
function wmpGo(win, mode) {
  if (!win || !win.wmp) return;  wmpState.mode = mode || "library";

  // abas e botões laterais
  var navBtns = win.wmp.navButtons || {};
  for (var k in navBtns) {
    navBtns[k].classList.toggle("active", k === mode);
  }

  var side = win.wmp.side;
  var listWrap = win.wmp.listWrap;
  var panel = win.wmp.panel;
  if (!panel) return;

  if (mode === "library") {
    side.style.display = "";
    listWrap.style.display = "";
    panel.style.display = "none";
    wmpRenderLibrary(win);
    wmpRenderList(win);
    return;
  }

  side.style.display = "none";
  listWrap.style.display = "none";
  panel.style.display = "block";
  panel.innerHTML = "";

  if (mode === "now") wmpRenderNowPlaying(win);
  else if (mode === "skin") wmpRenderSkins(win);
  else if (mode === "viz") wmpRenderViz(win);
  else if (mode === "live") wmpRenderLive(win);
}

// ------------------------------------------------- 1. Now Playing
function wmpRenderNowPlaying(win) {
  var p = win.wmp.panel;
  var cur = wmpState.track;
  var isPlaying = !!(wmpState.audio && !wmpState.audio.paused && cur);

  var layout = wmpEl("div", "wmp-now-layout");

  // Painel esquerdo: Capa grande, visualizador e informações da faixa
  var art = wmpEl("div", "wmp-now-artpane");
  var bigCover = wmpEl("div", "wmp-big-cover");
  if (cur) {
    wmpFillCover(bigCover, cur.release);
  } else {
    bigCover.innerHTML = '<span class="wmp-big-letter">WMP</span>';
  }
  art.appendChild(bigCover);

  var mini = document.createElement("canvas");
  mini.className = "wmp-viz-canvas wmp-viz-mini";
  mini._vizBars = 20;
  art.appendChild(mini);
  wmpVizRegister(mini);

  var tTitle = wmpEl("div", "wmp-now-meta-title", cur ? cur.track.title : "Nenhuma faixa em reproducao");
  var tSub = wmpEl("div", "wmp-now-meta-sub", cur ? (cur.release.artist + " \u2014 " + cur.release.title + " (" + cur.release.year + ")") : "Escolha uma faixa na fila ou biblioteca");
  art.appendChild(tTitle);
  art.appendChild(tSub);
  layout.appendChild(art);

  // Painel direito: Fila de reprodução ativa
  var qPane = wmpEl("div", "wmp-now-queuepane");
  var qHead = wmpEl("div", "wmp-q-head", "Fila de Reproducao (" + wmpQueue().length + " faixas)");
  qPane.appendChild(qHead);

  var qList = wmpEl("div", "wmp-q-list");
  var queue = wmpQueue();
  queue.forEach(function(item, idx) {
    var active = !!(cur && cur.release === item.release && cur.track === item.track);
    var row = wmpEl("button", "wmp-q-item" + (active ? " active" : ""));
    row.type = "button";
    row.textContent = (idx + 1) + ". " + item.track.title;
    row.addEventListener("click", function() {
      wmpPlayTrack(win, item.release, item.track);
      wmpRenderNowPlaying(win);
    });
    qList.appendChild(row);
  });
  if (!queue.length) {
    var empty = wmpEl("div", null, "Fila vazia.");
    empty.style.padding = "8px";
    empty.style.color = "#7c9fc7";
    qList.appendChild(empty);
  }
  qPane.appendChild(qList);
  layout.appendChild(qPane);

  p.appendChild(layout);
}

// ------------------------------------------------- visualizador chapado
// AnalyserNode real sobre o elemento de audio. Uma fonte por elemento:
// criar MediaElementSource duas vezes no mesmo Audio mata o som.
var wmpViz = { ctx: null, analyser: null, srcEl: null, raf: 0, canvases: [] };

function wmpVizEnsure() {
  var a = wmpState.audio;
  if (!a) return null;
  try {
    if (!wmpViz.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      wmpViz.ctx = new AC();
    }
    if (wmpViz.ctx.state === "suspended") wmpViz.ctx.resume();
    if (wmpViz.srcEl !== a) {
      var src = wmpViz.ctx.createMediaElementSource(a);
      wmpViz.analyser = wmpViz.ctx.createAnalyser();
      wmpViz.analyser.fftSize = 256;
      wmpViz.analyser.smoothingTimeConstant = 0.72;
      src.connect(wmpViz.analyser);
      wmpViz.analyser.connect(wmpViz.ctx.destination);
      wmpViz.srcEl = a;
    }
    return wmpViz.analyser;
  } catch (e) {
    return null;
  }
}

function wmpVizRegister(canvas) {
  if (wmpViz.canvases.indexOf(canvas) < 0) wmpViz.canvases.push(canvas);
  wmpVizEnsure();
  wmpVizKick();
}

function wmpVizKick() {
  if (!wmpViz.raf) wmpViz.raf = requestAnimationFrame(wmpVizFrame);
}

function wmpVizFrame() {
  wmpViz.raf = 0;
  var cvs = wmpViz.canvases.filter(function(c) { return c.isConnected; });
  wmpViz.canvases = cvs;
  if (!cvs.length) return;

  var a = wmpState.audio;
  var playing = !!(a && !a.paused);
  var data = null;
  if (playing) {
    if (wmpVizEnsure() && wmpViz.srcEl === a) {
      data = new Uint8Array(wmpViz.analyser.frequencyBinCount);
      try { wmpViz.analyser.getByteFrequencyData(data); } catch (e) { data = null; }
    }
  }

  cvs.forEach(function(cv) {
    var cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    var g = cv.getContext("2d");
    var n = cv._vizBars || 32;
    var gap = 2;
    var bw = Math.max(2, Math.floor((cw - gap * (n - 1)) / n));
    var st = getComputedStyle(cv);
    var color = st.color && st.color !== "rgba(0, 0, 0, 0)" ? st.color : "#4cc94c";
    g.clearRect(0, 0, cw, ch);
    g.fillStyle = color;
    if (!cv._vizLevel || cv._vizLevel.length !== n) {
      cv._vizLevel = [];
      for (var z = 0; z < n; z++) cv._vizLevel.push(0);
    }
    for (var i = 0; i < n; i++) {
      var v = 0;
      if (data) {
        // escala log: primeiras barras graves, ultimas agudos
        var lo = Math.floor(Math.pow(i / n, 1.6) * data.length);
        var hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / n, 1.6) * data.length));
        var sum = 0;
        for (var j = lo; j < hi; j++) sum += data[j];
        v = sum / (hi - lo) / 255;
      }
      v = Math.pow(v, 0.8);
      var lvl = cv._vizLevel;
      lvl[i] = v > lvl[i] ? v : lvl[i] * 0.86 + v * 0.14;
      var h = Math.max(2, Math.round(lvl[i] * (ch - 2)));
      g.fillRect(i * (bw + gap), ch - h, bw, h);
    }
  });
  wmpViz.raf = requestAnimationFrame(wmpVizFrame);
}

// ------------------------------------------------- Visualizador (view)
function wmpRenderViz(win) {
  var p = win.wmp.panel;
  var cur = wmpState.track;
  var head = wmpEl("div", "wmp-page-title");
  head.appendChild(document.createTextNode("Visualizador \u2014 Barras Chapadas"));
  head.appendChild(wmpEl("span", "wmp-page-sub", "reativo ao audio de verdade"));
  p.appendChild(head);

  var stage = wmpEl("div", "wmp-viz-stage");
  var cv = document.createElement("canvas");
  cv.className = "wmp-viz-canvas";
  cv._vizBars = 48;
  cv.style.color = "#4cc94c";
  stage.appendChild(cv);
  p.appendChild(stage);
  wmpVizRegister(cv);

  var meta = wmpEl("div", "wmp-now-meta-sub", cur
    ? cur.track.title + " \u2014 " + cur.release.title
    : "toque uma faixa na biblioteca para o visualizador reagir");
  meta.style.marginTop = "8px";
  p.appendChild(meta);
}

// ------------------------------------------------- Ao vivo (view)
// Sem estacoes inventadas: uma URL de stream real, salva e tocada
// pelo mesmo pipeline de audio do player.
function wmpRenderLive(win) {
  var p = win.wmp.panel;
  var head = wmpEl("div", "wmp-page-title");
  head.appendChild(document.createTextNode("Ao vivo"));
  head.appendChild(wmpEl("span", "wmp-page-sub", "radio do matesu \u2014 em breve"));
  p.appendChild(head);

  var saved = "";
  try { saved = localStorage.getItem("matesu.wmp.liveUrl") || ""; } catch (e) {}

  var box = wmpEl("div", "wmp-live-box");

  var row = wmpEl("div", "wmp-live-row");
  var input = document.createElement("input");
  input.type = "url";
  input.className = "wmp-live-url";
  input.placeholder = "cole a URL do stream (mp3/aac/ogg, icecast ou shoutcast)";
  input.value = saved;
  row.appendChild(input);

  var bPlay = wmpEl("button", "wmp-btn-action", "Tocar");
  bPlay.type = "button";
  row.appendChild(bPlay);
  var bStop = wmpEl("button", "wmp-btn-action", "Parar");
  bStop.type = "button";
  row.appendChild(bStop);
  box.appendChild(row);

  var status = wmpEl("div", "wmp-live-status", saved ? "" : "o stream ainda nao existe; quando a radio estiver no ar, a URL entra aqui.");
  box.appendChild(status);
  p.appendChild(box);

  bPlay.addEventListener("click", function() {
    var url = input.value.trim();
    if (!url) {
      status.textContent = "cole uma URL primeiro.";
      return;
    }
    try { localStorage.setItem("matesu.wmp.liveUrl", url); } catch (e) {}
    var a = wmpGetAudio(win);
    if (!a) return;
    wmpState.live = true;
    wmpState.track = null;
    a.src = url;
    a.volume = wmpState.volume == null ? 0.8 : wmpState.volume;
    status.textContent = "conectando...";
    a.addEventListener("playing", function() {
      if (wmpState.live) status.textContent = "no ar: " + url;
    }, { once: true });
    a.addEventListener("error", function() {
      if (wmpState.live) status.textContent = "stream indisponivel: " + url;
    }, { once: true });
    var pr = a.play();
    if (pr && pr.catch) {
      pr.catch(function() {
        wmpState.live = false;
        status.textContent = "stream indisponivel: " + url;
      });
    }
    wmpUpdatePlayButton(win);
  });

  bStop.addEventListener("click", function() {
    wmpState.live = false;
    var a = wmpState.audio;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
    status.textContent = "parado.";
    wmpUpdatePlayButton(win);
    wmpUpdateTime(win);
  });
}

// ------------------------------------------------- 7. Skin Chooser
function wmpRenderSkins(win) {
  var p = win.wmp.panel;
  var head = wmpEl("div", "wmp-page-title");
  head.appendChild(document.createTextNode("Skin Chooser \u2014 Escolha a Skin do Player"));
  p.appendChild(head);

  var skins = [
    { id: "luna", name: "Windows Media Player 9 (Padrao Luna)", cls: "luna", desc: "Visual classico azul Luna do Windows XP." },
    { id: "royale", name: "Royale / Energy Blue (Media Center 2005)", cls: "royale", desc: "Tema escovado e tons de azul cobalto profundo." },
    { id: "zune", name: "Zune / Obsidian Dark (Matesu Dark)", cls: "zune", desc: "Edicao preta fosca com detalhes em laranja." },
    { id: "classic", name: "Classic 2000 (Corporativo Neutro)", cls: "classic", desc: "Barra cinza neutra inspirada no Windows 2000." }
  ];

  var currentSkin = localStorage.getItem("wmp_skin") || "luna";

  var grid = wmpEl("div", "wmp-skin-list");
  skins.forEach(function(s) {
    var card = wmpEl("div", "wmp-skin-card" + (s.id === currentSkin ? " active" : ""));
    var thumb = wmpEl("div", "wmp-skin-thumb " + s.cls);
    card.appendChild(thumb);

    var nm = wmpEl("b", null, s.name);
    card.appendChild(nm);

    var dc = wmpEl("span", null, s.desc);
    dc.style.color = "#9ec2eb";
    dc.style.fontSize = "10px";
    dc.style.margin = "4px 0 8px";
    card.appendChild(dc);

    var bApply = wmpEl("button", "wmp-btn-action", s.id === currentSkin ? "Em Uso" : "Aplicar");
    bApply.type = "button";
    if (s.id === currentSkin) bApply.disabled = true;
    bApply.addEventListener("click", function() {
      localStorage.setItem("wmp_skin", s.id);
      wmpApplySkin(s.id);
      wmpRenderSkins(win);
    });
    card.appendChild(bApply);
    grid.appendChild(card);
  });

  p.appendChild(grid);
}

function wmpApplySkin(skinId) {
  var player = document.getElementById("xp-player");
  if (!player) return;
  player.classList.remove("wmp-skin-royale", "wmp-skin-zune", "wmp-skin-classic");
  if (skinId === "royale") player.classList.add("wmp-skin-royale");
  else if (skinId === "zune") player.classList.add("wmp-skin-zune");
  else if (skinId === "classic") player.classList.add("wmp-skin-classic");
}

// --------------------------------------------------------------- reproducao
function wmpSetStatus(win, title, sub) {
  if (!win || !win.wmp) return;
  win.wmp.song.textContent = title;
  win.wmp.det.textContent = sub;
}

function wmpShowError(win) {
  var cur = wmpState.track;
  if (!win || !cur) return;
  var url = wmpAudioUrl(cur.release, cur.track);
  wmpSetStatus(win, "Song: " + cur.track.title, "audio indisponivel neste host \u2014 " + url);
}

function wmpRenderStatus(win) {
  if (!win || !win.wmp) return;
  if (!wmpState.track) {
    wmpFillCover(win.wmp.cover, null);
    wmpSetStatus(win, wmpState.live ? "Song: ao vivo" : "Song: nada tocando",
      wmpState.live ? "stream" : "escolha uma faixa na biblioteca");
    return;
  }
  var rel = wmpState.track.release;
  var track = wmpState.track.track;
  wmpFillCover(win.wmp.cover, rel);
  wmpSetStatus(win, "Song: " + track.title, rel.title + " \u00b7 " + rel.artist);
}

function wmpApplyTrackMeta(win) {
  var track = wmpState.track && wmpState.track.track;
  if (!track || !win || !win.wmp) return;
  var row = win.wmp.list.querySelector(".xp-wmp-track.playing");
  if (!row) return;
  var len = row.querySelector(".wmp-len");
  if (len) len.textContent = track.duration || "\u2014";
  var br = row.querySelector(".wmp-br");
  if (br) br.textContent = wmpBitrateLabel(track);
}

function wmpGetAudio(win) {
  if (wmpState.audio) return wmpState.audio;
  var audio = new Audio();
  audio.preload = "metadata";
  audio.addEventListener("timeupdate", function() { wmpUpdateTime(wmpState.win); });
  audio.addEventListener("ended", function() { wmpStep(wmpState.win, 1); });
  audio.addEventListener("loadedmetadata", function() {
    var t = wmpState.track && wmpState.track.track;
    if (t) {
      t._seconds = audio.duration;
      t.duration = isFinite(audio.duration) ? wmpFormatTime(audio.duration) : t.duration;
    }
    wmpApplyTrackMeta(wmpState.win);
    wmpUpdateTime(wmpState.win);
  });
  audio.addEventListener("error", function() {
    // local faltou: tenta a mesma trilha no Internet Archive antes de desistir
    var cur = wmpState.track;
    var remote = cur && cur.track && cur.track.path ? WMP_AUDIO_REMOTE + cur.track.path : null;
    if (remote && audio.src.indexOf(remote) !== 0) {
      audio.src = remote;
      return;
    }
    wmpShowError(wmpState.win);
    wmpUpdatePlayButton(wmpState.win);
  });
  wmpState.audio = audio;
  return audio;
}

function wmpPlayTrack(win, release, track) {
  var url = wmpAudioUrl(release, track);
  win = win || wmpState.win;
  wmpState.win = win;
  wmpState.track = { release: release, track: track };
  wmpState.live = false;

  var audio = wmpGetAudio(win);

  wmpState.audio.src = url;
  wmpState.audio.volume = wmpState.volume == null ? 0.8 : wmpState.volume;

  var play = wmpState.audio.play();
  if (play && play.catch) {
    play.catch(function() { wmpShowError(win); wmpUpdatePlayButton(win); });
  }

  wmpRenderStatus(win);
  wmpRenderList(win);
  wmpUpdatePlayButton(win);
  wmpUpdateTime(win);
}

function wmpTogglePlay(win) {
  var a = wmpState.audio;
  if (!a || (!wmpState.track && !wmpState.live)) return;
  if (a.paused) {
    var p = a.play();
    if (p && p.catch) p.catch(function() { wmpShowError(win); });
  } else {
    a.pause();
  }
  wmpUpdatePlayButton(win);
}

function wmpStop(win) {
  var a = wmpState.audio;
  if (!a) return;
  a.pause();
  a.currentTime = 0;
  wmpUpdatePlayButton(win);
  wmpUpdateTime(win);
}

function wmpStep(win, dir) {
  if (!wmpState.track) return;
  win = win || wmpState.win;
  var queue = wmpQueue();
  var idx = -1;
  for (var i = 0; i < queue.length; i++) {
    if (queue[i].release === wmpState.track.release && queue[i].track === wmpState.track.track) {
      idx = i;
      break;
    }
  }

  if (idx < 0) {
    var tracks = wmpState.track.release.tracks;
    var current = tracks.indexOf(wmpState.track.track);
    var next = current + dir;
    if (next >= 0 && next < tracks.length) {
      wmpPlayTrack(win, wmpState.track.release, tracks[next]);
    } else {
      wmpStop(win);
    }
    return;
  }

  var target = idx + dir;
  if (target < 0 || target >= queue.length) {
    wmpStop(win);
    return;
  }
  wmpPlayTrack(win, queue[target].release, queue[target].track);
}

function wmpUpdatePlayButton(win) {
  var a = wmpState.audio;
  var b = win && win.wmp ? win.wmp.bPlay : null;
  if (!b) return;
  var playing = !!(a && !a.paused && (wmpState.track || wmpState.live));
  b.innerHTML = wmpGlyph(playing ? "pause" : "play");
  b.setAttribute("aria-label", playing ? "pausar" : "reproduzir");
  b.title = playing ? "pausar" : "reproduzir";
}

function wmpUpdateTime(win) {
  var a = wmpState.audio;
  if (!win || !win.wmp) return;
  var t = win.wmp.time;
  if (!t) return;
  if (!a) {
    t.textContent = "0:00 / 0:00";
    win.wmp.fill.style.width = "0%";
    win.wmp.knob.style.left = "0%";
    return;
  }
  if (!wmpState.track) {
    t.textContent = wmpState.live && !a.paused ? "ao vivo" : "0:00 / 0:00";
    win.wmp.fill.style.width = "0%";
    win.wmp.knob.style.left = "0%";
    return;
  }
  var cur = a.currentTime || 0;
  var dur = isFinite(a.duration) ? a.duration : 0;
  t.textContent = wmpFormatTime(cur) + " / " + wmpFormatTime(dur);
  if (dur > 0) {
    var ratio = Math.max(0, Math.min(1, cur / dur));
    win.wmp.fill.style.width = (ratio * 100) + "%";
    win.wmp.knob.style.left = (ratio * 100) + "%";
  }
  wmpUpdatePlayButton(win);
}

// ------------------------------------------------- carregar a discografia
// O player lê o catálogo autoral gerado a partir da pasta de trabalho
// (discografia-autoral.json). Nada de áudio é copiado nem convertido:
// cada faixa já traz o path relativo que vai existir no host.
// O catálogo autoral viaja com o site (assets/js/data-discography.js).
// Nada de áudio é copiado nem convertido: cada faixa traz o path relativo.
function wmpLoadLibrary() {
  var data = window.MATESU_DISCOGRAPHY || {};
  var items = data.autoral || [];
  wmpState.covers = {};
  wmpState.releases = items.map(function(item) {
    return {
      title: item.title,
      artist: item.artist || "",
      year: item.year || "----",
      genres: item.genres || [],
      slug: item.slug,
      tracks: (item.tracks || []).map(function(t) {
        return {
          title: t.title,
          path: t.path,
          source: t.source,
          ext: t.ext,
          size: t.size,
          duration: ""
        };
      })
    };
  });
  var win = document.getElementById("xp-player");
  if (win) {
    var found = xpOpenWindows.filter(function(w) { return w.id === "xp-player"; })[0];
    if (found) {
      wmpRenderLibrary(found);
      wmpRenderList(found);
      wmpRenderStatus(found);
    }
  }
}


