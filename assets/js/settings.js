// Ajustes do portfólio. Dois temas, sem dependências.
var THEMES = [
  { id: "branco", name: "branco", bg: "#ffffff", fg: "#141414", dark: false },
  { id: "preto", name: "preto", bg: "#0a0a0a", fg: "#f1eee7", dark: true }
];

var ajustes = {
  theme: "branco"
};

function hexToRgb(hex) {
  var h = String(hex).replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mixColors(a, b, t) {
  var A = hexToRgb(a);
  var B = hexToRgb(b);
  return "rgb(" + [0, 1, 2].map(function(i) { return Math.round(A[i] * t + B[i] * (1 - t)); }).join(",") + ")";
}

function isLightColor(hex) {
  var c = hexToRgb(hex);
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.55;
}

function currentTheme() {
  return THEMES.filter(function(t) { return t.id === ajustes.theme; })[0] || THEMES[0];
}

function applyPalette() {
  var t = currentTheme();
  var bg = t.bg;
  var fg = t.fg;
  var light = isLightColor(bg);
  var root = document.documentElement.style;

  root.setProperty("--paper", bg);
  root.setProperty("--ink", fg);
  root.setProperty("--muted", mixColors(fg, bg, 0.58));
  root.setProperty("--faint", mixColors(fg, bg, 0.4));
  root.setProperty("--line", light ? "rgba(20,20,20,0.12)" : "rgba(241,238,231,0.14)");
  root.setProperty("--line-2", light ? "rgba(20,20,20,0.28)" : "rgba(241,238,231,0.28)");

  document.body.classList.toggle("dark", !!t.dark);
}

// Foto: hover mostra a versão com bolinhas; clique fixa; botão direito alterna.
var photoWrap = document.getElementById("bio-photo");
var photoState = { dots: false, blocked: false, mode: "normal", saved: 50, live: 50, pan: 25 };

function photoThresholdAt(clientX) {
  if (!photoWrap) return 50;
  var r = photoWrap.getBoundingClientRect();
  return Math.max(0, Math.min(100, Math.round(((clientX - r.left) / Math.max(1, r.width)) * 100)));
}

function photoBrightness(t) {
  var cut = 0.92 - 0.84 * (t / 100);
  return 0.5 / cut;
}

function applyPhoto() {
  if (!photoWrap) return;
  photoWrap.classList.toggle("threshold", photoState.mode === "threshold");
  photoWrap.classList.toggle("dots-on", photoState.dots);
  photoWrap.classList.toggle("dots-blocked", photoState.blocked);
  photoWrap.style.setProperty("--photo-b", photoBrightness(photoState.live).toFixed(3));
  photoWrap.style.setProperty("--photo-pan", photoState.pan + "%");
}

if (photoWrap) {
  photoWrap.addEventListener("mouseenter", function() { photoWrap.classList.add("hovered"); });
  photoWrap.addEventListener("mouseleave", function() {
    photoWrap.classList.remove("hovered");
    if (photoState.mode === "threshold") {
      photoState.mode = "normal";
      photoState.live = photoState.saved;
    }
    applyPhoto();
  });
  photoWrap.addEventListener("mousemove", function(e) {
    if (photoState.mode !== "threshold") return;
    photoState.live = photoThresholdAt(e.clientX);
    applyPhoto();
  });
  photoWrap.addEventListener("click", function(e) {
    if (e.button !== 0 || photoState.blocked) return;
    photoState.dots = !photoState.dots;
    applyPhoto();
  });
  photoWrap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (photoState.mode === "threshold") {
      photoState.mode = "normal";
      photoState.saved = photoState.live;
    } else if (photoState.dots) {
      photoState.dots = false;
      photoState.blocked = true;
    } else {
      photoState.blocked = false;
      photoState.mode = "threshold";
    }
    applyPhoto();
  });
  photoWrap.addEventListener("wheel", function(e) {
    e.preventDefault();
    photoState.pan = Math.max(0, Math.min(100, photoState.pan + (e.deltaY > 0 ? 4 : -4)));
    applyPhoto();
  }, { passive: false });
}

var themeList = document.getElementById("theme-list");

function paintThemes() {
  if (!themeList) return;
  themeList.innerHTML = "";
  THEMES.forEach(function(t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-swatch" + (ajustes.theme === t.id ? " active" : "");
    b.innerHTML = '<span class="theme-pair"><i style="background:' + t.bg + '"></i><i style="background:' + t.fg + '"></i></span><span>' + t.name + '</span>';
    b.addEventListener("click", function() {
      ajustes.theme = t.id;
      try { localStorage.setItem("matesu_theme", t.id); } catch (e) {}
      applyPalette();
      paintThemes();
      if (typeof xpPlay === "function") xpPlay("click", 0.35);
    });
    themeList.appendChild(b);
  });
}

try {
  var savedTheme = localStorage.getItem("matesu_theme");
  if (savedTheme && THEMES.some(function(t) { return t.id === savedTheme; })) ajustes.theme = savedTheme;
} catch (e) {}

var settingsBtn = document.getElementById("settings-btn");
var settingsPanel = document.getElementById("settings-panel");
var settingsClose = document.getElementById("settings-close");

function setSettings(open) {
  if (!settingsPanel) return;
  settingsPanel.classList.toggle("open", open);
  if (settingsBtn) settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open && typeof xpPlay === "function") xpPlay("click", 0.35);
}

if (settingsBtn) settingsBtn.addEventListener("click", function(e) {
  e.stopPropagation();
  setSettings(!settingsPanel.classList.contains("open"));
});
if (settingsClose) settingsClose.addEventListener("click", function() { setSettings(false); });
document.addEventListener("click", function(e) {
  if (!settingsPanel || !settingsPanel.classList.contains("open")) return;
  if (e.target.closest && e.target.closest("#settings-panel, #settings-btn")) return;
  setSettings(false);
});

var soundOn = document.getElementById("sound-on");
var soundOff = document.getElementById("sound-off");

function paintSound() {
  var on = !window.xpMuted;
  if (soundOn) {
    soundOn.classList.toggle("active", on);
    soundOn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  if (soundOff) {
    soundOff.classList.toggle("active", !on);
    soundOff.setAttribute("aria-pressed", on ? "false" : "true");
  }
}

function setSound(on) {
  window.xpMuted = !on;
  try { localStorage.setItem("xpMuted", window.xpMuted ? "1" : "0"); } catch (e) {}
  paintSound();
  if (on && typeof xpPlay === "function") xpPlay("start", 0.4);
}

if (soundOn) soundOn.addEventListener("click", function() { setSound(true); });
if (soundOff) soundOff.addEventListener("click", function() { setSound(false); });

applyPalette();
paintThemes();
applyPhoto();
paintSound();

window.toggleSidebar = function() {};
window.applyPalette = applyPalette;
window.applyPhoto = applyPhoto;