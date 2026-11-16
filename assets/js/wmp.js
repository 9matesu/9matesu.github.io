// =====================================================================
//  PLAYER
//  Uma tela só: releases à esquerda, faixas do release à direita e o
//  transporte embaixo. O motor de áudio é o mesmo de sempre.
// =====================================================================

var wmpState = {
  releases: [],       // catálogo autoral
  release: null,      // release aberto na coluna da direita
  track: null,        // { release, track } em reprodução
  audio: null,
  win: null,          // janela aberta
  volume: 0.8,
  seeking: false
};

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

function wmpDownloadIcon() {
  return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

// ------------------------------------------------- abrir a janela
function xpOpenPlayer() {
  var existing = document.getElementById("xp-player");
  if (existing) {
    var found = xpOpenWindows.filter(function(w) { return w.id === "xp-player"; })[0];
    if (found) xpFocusWindow(found);
    return found;
  }

  var w = Math.min(780, Math.max(320, window.innerWidth - 48));
  var h = Math.min(500, Math.max(300, window.innerHeight - 96));

  var win = xpCreateWindow({
    id: "xp-player",
    kind: "wmp",
    title: "player",
    width: w,
    height: h,
    left: Math.max(12, Math.round((window.innerWidth - w) / 2)),
    top: Math.max(12, Math.round((window.innerHeight - h) / 2)),
    onClose: function() {
      if (wmpState.audio) wmpState.audio.pause();
      wmpState.win = null;
    },
    build: function(win, body) {
      body.innerHTML = "";

      var player = wmpEl("div", "player");

      // --- releases
      var relList = wmpEl("div", "pl-release");
      relList.setAttribute("role", "list");
      relList.setAttribute("aria-label", "releases");
      player.appendChild(relList);

      // --- faixas
      var tracks = wmpEl("div", "pl-tracks");
      var head = wmpEl("div", "pl-head");
      var headTitle = wmpEl("span", "pl-head-title", "releases");
      var headMeta = wmpEl("span", "pl-head-meta", "");
      head.appendChild(headTitle);
      head.appendChild(headMeta);
      tracks.appendChild(head);

      var rows = wmpEl("div", "pl-rows");
      rows.setAttribute("role", "list");
      tracks.appendChild(rows);
      player.appendChild(tracks);

      // --- transporte
      var transport = wmpEl("div", "pl-transport");

      var bPrev = wmpEl("button", "tp-btn");
      bPrev.type = "button";
      bPrev.title = "anterior";
      bPrev.setAttribute("aria-label", "anterior");
      bPrev.innerHTML = wmpGlyph("prev");
      transport.appendChild(bPrev);

      var bPlay = wmpEl("button", "tp-btn tp-play");
      bPlay.type = "button";
      bPlay.title = "reproduzir";
      bPlay.setAttribute("aria-label", "reproduzir");
      bPlay.innerHTML = wmpGlyph("play");
      transport.appendChild(bPlay);

      var bNext = wmpEl("button", "tp-btn");
      bNext.type = "button";
      bNext.title = "próxima";
      bNext.setAttribute("aria-label", "próxima");
      bNext.innerHTML = wmpGlyph("next");
      transport.appendChild(bNext);

      var bStop = wmpEl("button", "tp-btn");
      bStop.type = "button";
      bStop.title = "parar";
      bStop.setAttribute("aria-label", "parar");
      bStop.innerHTML = wmpGlyph("stop");
      transport.appendChild(bStop);

      var time = wmpEl("span", "tp-time", "0:00 / 0:00");
      transport.appendChild(time);

      var seek = wmpEl("div", "tp-seek");
      seek.setAttribute("role", "slider");
      seek.setAttribute("aria-label", "posição da faixa");
      seek.tabIndex = 0;
      var fill = wmpEl("div", "tp-fill");
      seek.appendChild(fill);
      transport.appendChild(seek);

      var now = wmpEl("span", "tp-now", "nada tocando");
      transport.appendChild(now);

      player.appendChild(transport);
      body.appendChild(player);

      win.wmp = {
        relList: relList,
        headTitle: headTitle,
        headMeta: headMeta,
        rows: rows,
        time: time,
        fill: fill,
        seek: seek,
        now: now,
        bPlay: bPlay,
        bPrev: bPrev,
        bNext: bNext,
        bStop: bStop
      };
      win.el.wmp = win.wmp;
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
        if (seek.setPointerCapture) seek.setPointerCapture(e.pointerId);
        seekTo(e);
      });
      seek.addEventListener("pointermove", function(e) {
        if (wmpState.seeking) seekTo(e);
      });
      seek.addEventListener("pointerup", function() { wmpState.seeking = false; });
      seek.addEventListener("pointercancel", function() { wmpState.seeking = false; });

      if (!wmpState.release && wmpState.releases.length) {
        wmpState.release = wmpState.releases[0];
      }
      wmpRenderReleases(win);
      wmpRenderTracks(win);
      wmpUpdateNow(win);
      wmpUpdatePlayButton(win);
      wmpUpdateTime(win);
    }
  });

  return win;
}

// ------------------------------------------------- releases
function wmpRenderReleases(win) {
  if (!win || !win.wmp) return;
  var host = win.wmp.relList;
  host.innerHTML = "";

  var years = {};
  wmpState.releases.forEach(function(rel) {
    var y = String(rel.year || "----");
    if (!years[y]) years[y] = [];
    years[y].push(rel);
  });

  Object.keys(years).sort().reverse().forEach(function(y) {
    host.appendChild(wmpEl("div", "pl-year", y));
    years[y].forEach(function(rel) {
      var b = wmpEl("button", "pl-rel" + (rel === wmpState.release ? " active" : ""));
      b.type = "button";
      b.setAttribute("role", "listitem");
      b.title = rel.title;
      b.appendChild(wmpEl("span", "pl-rel-title", rel.title));
      b.appendChild(wmpEl("span", "pl-rel-n", String(rel.tracks.length)));
      b.addEventListener("click", function() {
        wmpSelectRelease(win, rel);
      });
      host.appendChild(b);
    });
  });
}

function wmpSelectRelease(win, rel) {
  wmpState.release = rel;
  wmpRenderReleases(win);
  wmpRenderTracks(win);
}

// ------------------------------------------------- faixas
function wmpRenderTracks(win) {
  if (!win || !win.wmp) return;
  var rel = wmpState.release;
  var rows = win.wmp.rows;
  rows.innerHTML = "";

  if (!rel) {
    win.wmp.headTitle.textContent = "releases";
    win.wmp.headMeta.textContent = "";
    rows.appendChild(wmpEl("div", "pl-empty", "selecione um release."));
    return;
  }

  win.wmp.headTitle.textContent = rel.title;
  var metaBits = [];
  if (rel.artist) metaBits.push(rel.artist);
  if (rel.year) metaBits.push(rel.year);
  metaBits.push(rel.tracks.length + (rel.tracks.length === 1 ? " faixa" : " faixas"));
  win.wmp.headMeta.textContent = metaBits.join(" \u00b7 ");

  rel.tracks.forEach(function(track, i) {
    var playing = !!(wmpState.track &&
      wmpState.track.release === rel &&
      wmpState.track.track === track);

    var row = wmpEl("div", "pl-row" + (playing ? " playing" : ""));
    row.setAttribute("role", "listitem");
    row.tabIndex = 0;
    row.setAttribute("aria-label", "tocar " + track.title);
    row.title = track.title;

    row.appendChild(wmpEl("span", "pl-num", String(i + 1)));
    row.appendChild(wmpEl("span", "pl-name", track.title));
    row.appendChild(wmpEl("span", "pl-len", track.duration || "\u2014"));

    var dl = wmpDownloadUrl(rel, track);
    if (dl) {
      var a = document.createElement("a");
      a.className = "pl-dl";
      a.href = dl;
      a.setAttribute("download", "");
      a.title = "baixar " + track.title;
      a.setAttribute("aria-label", "baixar " + track.title);
      a.innerHTML = wmpDownloadIcon();
      a.addEventListener("click", function(e) { e.stopPropagation(); });
      row.appendChild(a);
    } else {
      var ph = wmpEl("span", "pl-dl");
      ph.setAttribute("aria-hidden", "true");
      row.appendChild(ph);
    }

    function play() { wmpPlayTrack(win, rel, track); }
    row.addEventListener("click", play);
    row.addEventListener("keydown", function(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      play();
    });

    rows.appendChild(row);
  });
}

// ------------------------------------------------- transporte
function wmpUpdateNow(win) {
  if (!win || !win.wmp) return;
  if (!wmpState.track) {
    win.wmp.now.textContent = "nada tocando";
    win.wmp.now.removeAttribute("title");
    return;
  }
  var t = wmpState.track.track;
  win.wmp.now.textContent = t.title;
  win.wmp.now.title = t.title;
}

function wmpUpdatePlayButton(win) {
  var a = wmpState.audio;
  var b = win && win.wmp ? win.wmp.bPlay : null;
  if (!b) return;
  var playing = !!(a && !a.paused && wmpState.track);
  b.innerHTML = wmpGlyph(playing ? "pause" : "play");
  b.setAttribute("aria-label", playing ? "pausar" : "reproduzir");
  b.title = playing ? "pausar" : "reproduzir";
}

function wmpUpdateTime(win) {
  var a = wmpState.audio;
  if (!win || !win.wmp) return;
  if (!a || !wmpState.track) {
    win.wmp.time.textContent = "0:00 / 0:00";
    win.wmp.fill.style.width = "0%";
    wmpUpdatePlayButton(win);
    return;
  }
  var cur = a.currentTime || 0;
  var dur = isFinite(a.duration) ? a.duration : 0;
  win.wmp.time.textContent = wmpFormatTime(cur) + " / " + wmpFormatTime(dur);
  var ratio = dur > 0 ? Math.max(0, Math.min(1, cur / dur)) : 0;
  win.wmp.fill.style.width = (ratio * 100) + "%";
  wmpUpdatePlayButton(win);
}

// ------------------------------------------------- reprodução
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

function wmpShowError(win) {
  if (!win || !win.wmp) return;
  var cur = wmpState.track;
  win.wmp.now.textContent = "áudio indisponível";
  win.wmp.now.title = cur ? wmpAudioUrl(cur.release, cur.track) : "";
}

function wmpApplyTrackMeta(win) {
  var track = wmpState.track && wmpState.track.track;
  if (!track || !win || !win.wmp) return;
  var row = win.wmp.rows.querySelector(".pl-row.playing");
  if (!row) return;
  var len = row.querySelector(".pl-len");
  if (len) len.textContent = track.duration || "\u2014";
}

function wmpPlayTrack(win, release, track) {
  win = win || wmpState.win;
  if (!win) return;
  wmpState.win = win;
  wmpState.track = { release: release, track: track };

  if (release !== wmpState.release) {
    wmpState.release = release;
    wmpRenderReleases(win);
  }

  var audio = wmpGetAudio(win);
  audio.src = wmpAudioUrl(release, track);
  audio.volume = wmpState.volume == null ? 0.8 : wmpState.volume;

  var play = audio.play();
  if (play && play.catch) {
    play.catch(function() { wmpShowError(win); wmpUpdatePlayButton(win); });
  }

  wmpRenderTracks(win);
  wmpUpdateNow(win);
  wmpUpdatePlayButton(win);
  wmpUpdateTime(win);
}

function wmpTogglePlay(win) {
  var a = wmpState.audio;
  if (!a || !wmpState.track) return;
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

// Fila plana: o catálogo na ordem em que aparece na coluna da esquerda.
function wmpQueue() {
  var out = [];
  wmpState.releases.forEach(function(rel) {
    rel.tracks.forEach(function(track) {
      out.push({ release: rel, track: track });
    });
  });
  return out;
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
  if (idx < 0) return;
  var target = idx + dir;
  if (target < 0 || target >= queue.length) {
    wmpStop(win);
    return;
  }
  wmpPlayTrack(win, queue[target].release, queue[target].track);
}

// ------------------------------------------------- carregar a discografia
// O catálogo autoral viaja com o site (assets/js/data-discography.js).
// Nada de áudio é copiado nem convertido: cada faixa traz o path relativo.
function wmpLoadLibrary() {
  var data = window.MATESU_DISCOGRAPHY || {};
  var items = (data.autoral || []).filter(function(item) {
    return (item.tracks || []).length > 0;
  });
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

  if (!wmpState.release && wmpState.releases.length) {
    wmpState.release = wmpState.releases[0];
  }

  var win = document.getElementById("xp-player");
  if (win) {
    var found = xpOpenWindows.filter(function(w) { return w.id === "xp-player"; })[0];
    if (found) {
      wmpRenderReleases(found);
      wmpRenderTracks(found);
      wmpUpdateNow(found);
    }
  }
}
