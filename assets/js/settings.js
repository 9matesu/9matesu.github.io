// ---------------------------------------------------------------- ajustes
// Dois temas, um par de cores cada. O resto da paleta é derivado do par,
// então o site inteiro continua legível em qualquer um deles.
var THEMES = [
  { id: "tinta", name: "tinta", bg: "#111110", fg: "#f1eee7" },
  { id: "papel", name: "papel", bg: "#f1eee7", fg: "#111110" }
];

var ajustes = {
  theme: "tinta"
};

function hexToRgb(hex) {
  var h = String(hex).replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Mistura duas cores. t é o peso da primeira.
function mixColors(a, b, t) {
  var A = hexToRgb(a);
  var B = hexToRgb(b);
  var c = [0, 1, 2].map(function(i) {
    return Math.round(A[i] * t + B[i] * (1 - t));
  });
  return "rgb(" + c.join(",") + ")";
}

// Uma cor é clara quando o olho não precisa se adaptar a ela
function isLightColor(hex) {
  var c = hexToRgb(hex);
  var lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  return lum > 0.55;
}

function currentTheme() {
  var found = THEMES.filter(function(t) { return t.id === ajustes.theme; })[0];
  return found || THEMES[0];
}

// Aplica o par de cores nos tokens que o CSS lê.
function applyPalette() {
  var t = currentTheme();
  var bg = t.bg;
  var fg = t.fg;
  var light = isLightColor(bg);
  var root = document.documentElement.style;

  root.setProperty("--paper", bg);
  root.setProperty("--ink", fg);
  root.setProperty("--ink-soft", mixColors(fg, bg, 0.78));
  root.setProperty("--muted", mixColors(fg, bg, 0.58));
  root.setProperty("--faint", mixColors(fg, bg, 0.40));
  root.setProperty("--line", light ? "rgba(17,17,16,0.16)" : "rgba(241,238,231,0.14)");
  root.setProperty("--line-2", light ? "rgba(17,17,16,0.32)" : "rgba(241,238,231,0.28)");
  root.setProperty("--accent", light ? "#e8380d" : "#ff4a1c");

  // tokens legados que core.css e detail.css ainda leem
  root.setProperty("--bg-main", bg);
  root.setProperty("--bg-sidebar", bg);
  root.setProperty("--text-bright", fg);
  root.setProperty("--text-active", fg);
  root.setProperty("--text-body", mixColors(fg, bg, 0.78));
  root.setProperty("--text-muted", mixColors(fg, bg, 0.58));
  root.setProperty("--text-dim", mixColors(fg, bg, 0.46));
  root.setProperty("--text-faint", mixColors(fg, bg, 0.40));
  root.setProperty("--border-subtle", light ? "rgba(17,17,16,0.16)" : "rgba(241,238,231,0.14)");
  root.setProperty("--border-link", light ? "rgba(17,17,16,0.32)" : "rgba(241,238,231,0.28)");
  root.setProperty("--field-bg", "transparent");
  root.setProperty("--field-bg-focus", bg);
  root.setProperty("--bg-glass", bg);
  root.setProperty("--bg-glass-strong", bg);

  document.body.classList.toggle("light", light);
}

// ------------------------------------------------- foto do perfil
// O hover mostra a versão com as bolinhas vermelhas. O clique
// esquerdo deixa a bolinha fixa. O botão direito abre o threshold
// chapado, que segue o mouse dentro da caixa, e o segundo clique
// direito salva o estado e sai da caixa. O scroll move a foto.
var photoWrap = document.getElementById("bio-photo");
var photoState = {
  dots: false,       // bolinha fixa
  blocked: false,    // bolinha escondida depois de removida
  mode: "normal",    // normal | threshold
  saved: 50,         // limiar salvo
  live: 50,          // limiar em edição
  pan: 25            // posição vertical da foto dentro da caixa
};

// O limiar sai da posição horizontal do mouse dentro da caixa
function photoThresholdAt(clientX) {
  if (!photoWrap) return 50;
  var r = photoWrap.getBoundingClientRect();
  var p = (clientX - r.left) / Math.max(1, r.width);
  return Math.max(0, Math.min(100, Math.round(p * 100)));
}

// Brilho que coloca o corte do threshold onde ele deve ficar
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
  photoWrap.addEventListener("mouseenter", function() {
    photoWrap.classList.add("hovered");
  });

  photoWrap.addEventListener("mouseleave", function() {
    photoWrap.classList.remove("hovered");
    // da próxima vez que o mouse entrar, a bolinha volta a ser mostrada
    photoState.blocked = false;
    applyPhoto();
  });

  // Mouse dentro da caixa troca o valor do limiar
  photoWrap.addEventListener("mousemove", function(e) {
    if (photoState.mode !== "threshold") return;
    photoState.live = photoThresholdAt(e.clientX);
    applyPhoto();
  });

  // Scroll dentro da caixa sobe e desce a foto original
  photoWrap.addEventListener("wheel", function(e) {
    e.preventDefault();
    var d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    photoState.pan = Math.max(0, Math.min(100, photoState.pan + d * 0.16));
    applyPhoto();
  }, { passive: false });

  // Botão esquerdo: adiciona a bolinha, ou tira se ela estiver na caixa
  photoWrap.addEventListener("click", function(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    var showing = photoState.dots ||
      (photoWrap.classList.contains("hovered") && !photoState.blocked);
    if (showing) {
      photoState.dots = false;
      photoState.blocked = true;
    } else {
      photoState.dots = true;
      photoState.blocked = false;
    }
    applyPhoto();
  });

  // Botão direito: o limiar. O segundo clique salva e sai da caixa
  photoWrap.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if (photoState.mode === "normal") {
      photoState.mode = "threshold";
      photoState.live = photoState.saved;
    } else {
      photoState.saved = photoState.live;
      photoState.mode = "normal";
    }
    applyPhoto();
  });
}

function saveAjustes() {
  try {
    localStorage.setItem("matesu_canvas", JSON.stringify(ajustes));
  } catch (e) {}
}

function loadAjustes() {
  try {
    var saved = localStorage.getItem("matesu_canvas");
    if (!saved) return;
    var data = JSON.parse(saved);
    if (!data || typeof data !== "object") return;
    if (data.theme === "papel") ajustes.theme = "papel";
    else ajustes.theme = "tinta";
  } catch (e) {}
}

function buildAjustesUI() {
  var themeList = document.getElementById("theme-list");
  if (!themeList) return;
  themeList.innerHTML = "";
  THEMES.forEach(function(t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-swatch";
    b.dataset.theme = t.id;
    b.title = t.name;

    var pair = document.createElement("span");
    pair.className = "theme-pair";
    var a = document.createElement("i");
    a.style.background = t.bg;
    var c = document.createElement("i");
    c.style.background = t.fg;
    pair.appendChild(a);
    pair.appendChild(c);

    var label = document.createElement("span");
    label.textContent = t.name;

    b.appendChild(pair);
    b.appendChild(label);
    b.addEventListener("click", function() {
      ajustes.theme = t.id;
      applyPalette();
      markAjustes();
      saveAjustes();
    });
    themeList.appendChild(b);
  });
}

function markAjustes() {
  var swatches = document.querySelectorAll(".theme-swatch");
  for (var i = 0; i < swatches.length; i++) {
    swatches[i].classList.toggle("active", swatches[i].dataset.theme === ajustes.theme);
  }
}

function toggleSettings(force) {
  var panel = document.getElementById("settings-panel");
  var btn = document.getElementById("settings-btn");
  if (!panel) return;
  var open = force != null ? force : !panel.classList.contains("open");
  panel.classList.toggle("open", open);
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) xpPlay("restore", 0.45);
}

(function initAjustes() {
  loadAjustes();
  applyPalette();
  buildAjustesUI();
  markAjustes();

  var btn = document.getElementById("settings-btn");
  if (btn) {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleSettings();
    });
  }

  var panel = document.getElementById("settings-panel");
  if (panel) {
    panel.addEventListener("click", function(e) { e.stopPropagation(); });

    var sClose = document.getElementById("settings-close");
    if (sClose) sClose.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleSettings(false);
    });
  }

  document.addEventListener("click", function(e) {
    var panelEl = document.getElementById("settings-panel");
    if (!panelEl || !panelEl.classList.contains("open")) return;
    if (panelEl.contains(e.target)) return;
    if (e.target.closest && e.target.closest("#settings-btn")) return;
    toggleSettings(false);
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") toggleSettings(false);
  });
})();
