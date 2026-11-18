// Monta o player de áudio dentro da janela.
var wmpState = {
  releases: [],
  release: null,
  track: null,
  audio: null,
  win: null,
  volume: 0.8,
  seeking: false
};

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

function xpOpenPlayer() {
  var existing = document.getElementById("xp-player");
  if (existing) {
    var found = xpOpenWindows.filter(function(w) { return w.id === "xp-player"; })[0];
    if (found) xpFocusWindow(found);
    return found;
  }

  var w = Math.min(720, Math.max(320, window.innerWidth - 48));
  var h = Math.min(480, Math.max(320, window.innerHeight - 96));

  var win = xpCreateWindow({
    id: "xp-player",
    title: "player",
    width: w,
    height: h,
    left: Math.max(12, Math.round((window.innerWidth - w) / 2)),
    top: Math.max(12, Math.round((window.innerHeight - h) / 2)),
    onClose: function() {
      if (wmpState.audio) wmpState.audio.pause();
      wmpState.win = null;
    },
    build: function(entry, body) {
      wmpState.win = entry;
      body.innerHTML = "";

      var player = wmpEl("div", "player");

      var relList = wmpEl("div", "pl-release");
      relList.setAttribute("role", "list");
      relList.setAttribute("aria-label", "releases");
      player.appendChild(relList);

      var tracks = wmpEl("div", "pl-tracks");
      var head = wmpEl("div", "pl-head");
      head.appendChild(wmpEl("span", "pl-head-title", "releases"));
      head.appendChild(wmpEl("span", "pl-head-meta", ""));
      tracks.appendChild(head);

      var rows = wmpEl("div", "pl-rows");
      rows.setAttribute("role", "list");
      tracks.appendChild(rows);
      player.appendChild(tracks);

      var transport = wmpEl("div", "pl-transport");

      var bPrev = wmpEl("button", "tp-btn");
      bPrev.type = "button";
      bPrev.setAttribute("aria-label", "anterior");
      bPrev.innerHTML = wmpGlyph("prev");
      transport.appendChild(bPrev);

      var bPlay = wmpEl("button", "tp-btn tp-play");
      bPlay.type = "button";
      bPlay.setAttribute("aria-label", "reproduzir");
      bPlay.innerHTML = wmpGlyph("play");
      transport.appendChild(bPlay);

      var bNext = wmpEl("button", "tp-btn");
      bNext.type = "button";
      bNext.setAttribute("aria-label", "próxima");
      bNext.innerHTML = wmpGlyph("next");
      transport.appendChild(bNext);

      var bStop = wmpEl("button", "tp-btn");
      bStop.type = "button";
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

      player.appendChild(transport);
      body.appendChild(player);

      var releases = (window.MATESU_DISCOGRAPHY && window.MATESU_DISCOGRAPHY.items) || [];
      var grouped = {};
      releases.forEach(function(item) {
        var key = item.releaseDate || item.year || "outros";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      Object.keys(grouped).sort().reverse().forEach(function(key) {
        relList.appendChild(wmpEl("div", "pl-year", key));
        grouped[key].forEach(function(item) {
          var row = wmpEl("button", "pl-rel");
          row.type = "button";
          row.innerHTML = '<span class="pl-rel-title"></span><span class="pl-rel-n"></span>';
          row.querySelector(".pl-rel-title").textContent = item.title || "sem título";
          row.querySelector(".pl-rel-n").textContent = (item.tracks || []).length;
          row.addEventListener("click", function() {
            wmpState.release = item;
            renderTracks(item);
          });
          relList.appendChild(row);
        });
      });

      function renderTracks(release) {
        rows.innerHTML = "";
        head.querySelector(".pl-head-title").textContent = release.title || "releases";
        head.querySelector(".pl-head-meta").textContent = release.artist || "";
        var tracks = release.tracks || [];
        if (!tracks.length) {
          rows.appendChild(wmpEl("div", "pl-empty", "sem faixas"));
          return;
        }
        tracks.forEach(function(track, index) {
          var row = wmpEl("button", "pl-row");
          row.type = "button";
          row.innerHTML = '<span class="pl-row-n"></span><span class="pl-row-title"></span><span class="pl-row-dur"></span>';
          row.querySelector(".pl-row-n").textContent = String(index + 1).padStart(2, "0");
          row.querySelector(".pl-row-title").textContent = track.title || "faixa";
          row.querySelector(".pl-row-dur").textContent = track.duration || "";
          row.addEventListener("click", function() { playTrack(release, track, row); });
          rows.appendChild(row);
        });
      }

      function playTrack(release, track, row) {
        if (wmpState.audio) wmpState.audio.pause();
        var audio = new Audio(wmpAudioUrl(release, track));
        audio.volume = wmpState.volume;
        wmpState.audio = audio;
        wmpState.track = { release: release, track: track };

        rows.querySelectorAll(".pl-row").forEach(function(el) { el.classList.remove("active"); });
        if (row) row.classList.add("active");

        audio.addEventListener("loadedmetadata", function() {
          time.textContent = "0:00 / " + wmpFormatTime(audio.duration);
        });
        audio.addEventListener("timeupdate", function() {
          var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
          fill.style.width = pct + "%";
          time.textContent = wmpFormatTime(audio.currentTime) + " / " + wmpFormatTime(audio.duration);
        });
        audio.addEventListener("ended", function() {
          bPlay.innerHTML = wmpGlyph("play");
          bPlay.setAttribute("aria-label", "reproduzir");
        });

        audio.play().then(function() {
          bPlay.innerHTML = wmpGlyph("pause");
          bPlay.setAttribute("aria-label", "pausar");
        }).catch(function() {
          bPlay.innerHTML = wmpGlyph("play");
          bPlay.setAttribute("aria-label", "reproduzir");
        });
      }

      bPlay.addEventListener("click", function() {
        if (!wmpState.audio) return;
        if (wmpState.audio.paused) {
          wmpState.audio.play();
          bPlay.innerHTML = wmpGlyph("pause");
          bPlay.setAttribute("aria-label", "pausar");
        } else {
          wmpState.audio.pause();
          bPlay.innerHTML = wmpGlyph("play");
          bPlay.setAttribute("aria-label", "reproduzir");
        }
      });

      bStop.addEventListener("click", function() {
        if (!wmpState.audio) return;
        wmpState.audio.pause();
        wmpState.audio.currentTime = 0;
        fill.style.width = "0%";
        bPlay.innerHTML = wmpGlyph("play");
      });

      seek.addEventListener("click", function(e) {
        if (!wmpState.audio || !wmpState.audio.duration) return;
        var rect = seek.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        wmpState.audio.currentTime = pct * wmpState.audio.duration;
      });
    }
  });

  wmpState.win = win;
  return win;
}