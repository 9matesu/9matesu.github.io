// ---------------------------------------------------------------- ajustes
// Cada tema é um par de cores: fundo e tinta. O resto da paleta é
// derivado desses dois tons, então o site inteiro continua legível.
var THEMES = [
  { id: "papel", name: "papel e tinta", bg: "#f1eee7", fg: "#111111" },
  { id: "tinta", name: "tinta e papel", bg: "#111111", fg: "#f1eee7" },
  { id: "noite", name: "preto e branco", bg: "#141414", fg: "#f5f5f7" },
  { id: "azul-forte", name: "azul forte e branco acinzentado", bg: "#0b2f6b", fg: "#eef1f5" },
  { id: "modo-claro", name: "modo claro", bg: "#f5f5f7", fg: "#1d1d1f" },
  { id: "branco-azul", name: "branco e azul", bg: "#ffffff", fg: "#1450d8" },
  { id: "branco-vermelho", name: "branco e vermelho", bg: "#ffffff", fg: "#cf2020" },
  { id: "creme-preto", name: "creme e preto", bg: "#f2ede3", fg: "#17150f" },
  { id: "verde", name: "verde e verde claro", bg: "#0e1a13", fg: "#b7f7d0" },
  { id: "roxo", name: "roxo e lilás", bg: "#2a1145", fg: "#eadcff" }
];

// A fonte escolhida vale só para o conteúdo do portfólio.
// O chrome do XP (mesa, menus, janelas) usa sempre --font-xp.
var FONTS = [
  { id: "switzer", name: "switzer", stack: '"Switzer", Verdana, Geneva, sans-serif' },
  { id: "tahoma", name: "tahoma", stack: 'Tahoma, Geneva, Verdana, sans-serif' },
  { id: "verdana", name: "verdana", stack: "Verdana, Geneva, Tahoma, sans-serif" },
  { id: "helvetica", name: "helvetica", stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: "arial", name: "arial", stack: 'Arial, Helvetica, sans-serif' },
  { id: "colibri", name: "colibri", stack: 'Colibri, Verdana, Geneva, sans-serif' },
  { id: "segoe", name: "segoe ui", stack: '"Segoe UI", Verdana, Tahoma, sans-serif' },
  { id: "times", name: "times", stack: '"Times New Roman", Times, serif' },
  { id: "georgia", name: "georgia", stack: 'Georgia, "Times New Roman", serif' },
  { id: "courier", name: "courier", stack: '"Courier New", Courier, monospace' }
];

// Cursores do XP de verdade: cada opção aponta para os .cur extraídos.
// Sem coordenadas de hotspot — o arquivo embute o ponto correto.
// "canvas" é a mão sobre a carta; "item" é a seta/link sobre os clicáveis.
var CURSORS = [
  { id: "padrao", name: "padrão",  canvas: 'url("img/xp/cursors/default_link.cur"), grab',     item: 'url("img/xp/cursors/default_arrow.cur"), default' },
  { id: "mao",    name: "mão",     canvas: 'url("img/xp/cursors/default_link.cur"), pointer',  item: 'url("img/xp/cursors/default_link.cur"), pointer' },
  { id: "cruz",   name: "cruz",    canvas: 'url("img/xp/cursors/cross.cur"), crosshair',       item: 'url("img/xp/cursors/cross.cur"), crosshair' },
  { id: "mover",  name: "mover",   canvas: 'url("img/xp/cursors/default_move.cur"), move',     item: 'url("img/xp/cursors/default_move.cur"), move' },
  { id: "texto",  name: "texto",   canvas: 'url("img/xp/cursors/default_ibeam.cur"), text',    item: 'url("img/xp/cursors/default_ibeam.cur"), text' },
  { id: "espera", name: "espera",  canvas: 'url("img/xp/cursors/default_wait.cur"), wait',     item: 'url("img/xp/cursors/default_wait.cur"), wait' }
];

var ajustes = {
  theme: "papel",
  light: false,
  font: "switzer",
  fontCustom: "",
  cursor: "padrao",
  grain: 0,
  hue: 0
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

// A mesma cor com transparência, para o vidro sobre o céu
function withAlpha(hex, alpha) {
  var c = hexToRgb(hex);
  return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
}

function currentTheme() {
  var found = THEMES.filter(function(t) { return t.id === ajustes.theme; })[0];
  return found || THEMES[0];
}

function currentFont() {
  if (ajustes.font === "custom" && ajustes.fontCustom) {
    return { id: "custom", name: ajustes.fontCustom, stack: '"' + ajustes.fontCustom + '", Verdana, Geneva, sans-serif' };
  }
  var found = FONTS.filter(function(f) { return f.id === ajustes.font; })[0];
  return found || FONTS[0];
}

function currentCursor() {
  var found = CURSORS.filter(function(c) { return c.id === ajustes.cursor; })[0];
  return found || CURSORS[0];
}

// Paleta do par de cores escolhido, na ordem de leitura do site.
function themePair() {
  var t = currentTheme();
  // O par sempre na ordem fundo/tinta; o modo invertido troca os dois.
  return ajustes.light ? { bg: t.fg, fg: t.bg } : { bg: t.bg, fg: t.fg };
}

function applyPalette() {
  var shell = document.documentElement.getAttribute("data-shell");

  if (shell === "swiss") {
    var spair = themePair();
    var sbg = spair.bg;
    var sfg = spair.fg;
    var sroot = document.documentElement.style;
    var slight = isLightColor(sbg);

    sroot.setProperty("--paper", sbg);
    sroot.setProperty("--ink", sfg);
    sroot.setProperty("--ink-soft", mixColors(sfg, sbg, 0.78));
    sroot.setProperty("--muted", mixColors(sfg, sbg, 0.62));
    sroot.setProperty("--line", withAlpha(sfg, slight ? 0.16 : 0.22));
    sroot.setProperty("--line-strong", withAlpha(sfg, slight ? 0.42 : 0.56));
    sroot.setProperty("--accent", slight ? "#e8380d" : "#ff5a36");
    sroot.setProperty("--bg-main", sbg);
    sroot.setProperty("--bg-sidebar", sbg);
    sroot.setProperty("--text-bright", sfg);
    sroot.setProperty("--text-active", sfg);
    sroot.setProperty("--text-body", mixColors(sfg, sbg, 0.78));
    sroot.setProperty("--text-muted", mixColors(sfg, sbg, 0.62));
    sroot.setProperty("--text-dim", mixColors(sfg, sbg, 0.46));
    sroot.setProperty("--text-faint", mixColors(sfg, sbg, 0.30));
    sroot.setProperty("--border-subtle", withAlpha(sfg, 0.16));
    sroot.setProperty("--border-link", withAlpha(sfg, 0.42));
    sroot.setProperty("--field-bg", "transparent");
    sroot.setProperty("--field-bg-focus", sbg);
    sroot.setProperty("--bg-glass", sbg);
    sroot.setProperty("--bg-glass-strong", sbg);

    ["--map-paper", "--map-ink", "--map-ink-2", "--map-ink-3", "--map-ink-4",
     "--map-grid", "--map-shade", "--map-accent"].forEach(function(v) {
      sroot.removeProperty(v);
    });

    document.body.classList.toggle("light", slight);

    var sbtn = document.getElementById("theme-btn");
    if (sbtn) sbtn.textContent = slight ? "tinta" : "papel";

    var shellBtn = document.getElementById("swiss-theme");
    if (shellBtn) shellBtn.textContent = "xp";

    return;
  }

  var pair = themePair();
  var bg = pair.bg;
  var fg = pair.fg;
  var root = document.documentElement.style;

  // O tema claro inverte a logo de tinta preta, o escuro não
  var light = isLightColor(bg);

  root.setProperty("--bg-main", bg);
  root.setProperty("--bg-sidebar", bg);
  root.setProperty("--text-bright", fg);
  root.setProperty("--text-active", fg);
  root.setProperty("--text-body", mixColors(fg, bg, 0.78));
  root.setProperty("--text-muted", mixColors(fg, bg, 0.62));
  root.setProperty("--text-dim", mixColors(fg, bg, 0.46));
  root.setProperty("--text-faint", mixColors(fg, bg, 0.30));
  root.setProperty("--border-subtle", mixColors(fg, bg, 0.14));
  root.setProperty("--border-link", mixColors(fg, bg, 0.32));
  root.setProperty("--field-bg", mixColors(fg, bg, 0.08));
  root.setProperty("--field-bg-focus", mixColors(fg, bg, 0.14));
  root.setProperty("--bg-glass", withAlpha(bg, light ? 0.74 : 0.42));
  root.setProperty("--bg-glass-strong", withAlpha(bg, light ? 0.86 : 0.62));

  // A carta do metrô NÃO segue o tema do site: papel branco, tinta
  // preta e grid cinza são fixos, definidos no :root. Limpamos qualquer
  // valor inline que um boot anterior possa ter gravado, para o mapa
  // nunca escurecer quando o usuário troca de tema.
  ["--map-paper", "--map-ink", "--map-ink-2", "--map-ink-3", "--map-ink-4",
   "--map-grid", "--map-shade", "--map-accent"].forEach(function(v) {
    root.removeProperty(v);
  });

  document.body.classList.toggle("light", light);

  var btn = document.getElementById("theme-btn");
  if (btn) btn.textContent = light ? "escuro" : "claro";
}

function applyFont() {
  if (document.documentElement.getAttribute("data-shell") === "swiss") {
    document.documentElement.style.setProperty("--font-base", '"Switzer", "Helvetica Neue", Helvetica, Arial, sans-serif');
    return;
  }
  document.documentElement.style.setProperty("--font-base", currentFont().stack);
}

function applyCursor() {
  if (document.documentElement.getAttribute("data-shell") === "swiss") {
    document.documentElement.style.setProperty("--cursor-canvas", "default");
    document.documentElement.style.setProperty("--cursor-item", "pointer");
    return;
  }
  var c = currentCursor();
  document.documentElement.style.setProperty("--cursor-canvas", c.canvas);
  document.documentElement.style.setProperty("--cursor-item", c.item);
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

function applyGrain() {
  var el = document.getElementById("grain");
  if (!el) return;
  el.style.opacity = String((ajustes.grain / 100) * 0.42);
  var out = document.getElementById("grain-value");
  if (out) out.textContent = ajustes.grain + "%";
}

function applyHue() {
  var vp = document.getElementById("viewport");
  if (!vp) return;
  vp.style.filter = ajustes.hue ? "hue-rotate(" + ajustes.hue + "deg)" : "";
  var out = document.getElementById("hue-value");
  if (out) out.textContent = ajustes.hue + "°";
}

function saveAjustes() {
  try {
    localStorage.setItem("matesu_canvas", JSON.stringify(ajustes));
  } catch(e) {}
}

function loadAjustes() {
  try {
    var saved = localStorage.getItem("matesu_canvas");
    if (saved) {
      var data = JSON.parse(saved);
      if (data && typeof data === "object") {
        if (data.theme) ajustes.theme = data.theme;
        if (data.font) ajustes.font = data.font;
        if (typeof data.fontCustom === "string") ajustes.fontCustom = data.fontCustom;
        if (data.cursor) ajustes.cursor = data.cursor;
        if (typeof data.grain === "number") ajustes.grain = data.grain;
        if (typeof data.hue === "number") ajustes.hue = data.hue;
        if (typeof data.light === "boolean") ajustes.light = data.light;
      }
      return;
    }
    // Preferência antiga, só claro/escuro
    var antigo = localStorage.getItem("matesu_theme");
    if (antigo === "light") {
      ajustes.theme = "modo-claro";
      ajustes.light = true;
    }
  } catch(e) {}
}

function buildAjustesUI() {
  var themeList = document.getElementById("theme-list");
  if (themeList) {
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
        ajustes.light = false;
        applyPalette();
        markAjustes();
        saveAjustes();
      });
      themeList.appendChild(b);
    });
  }

  var fontList = document.getElementById("font-list");
  if (fontList) {
    fontList.innerHTML = "";
    FONTS.forEach(function(f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "font-btn";
      b.dataset.font = f.id;
      b.style.fontFamily = f.stack;
      b.textContent = f.name;
      b.addEventListener("click", function() {
        ajustes.font = f.id;
        applyFont();
        markAjustes();
        saveAjustes();
      });
      fontList.appendChild(b);
    });
  }

  // Fonte livre: o usuário digita o nome de qualquer família instalada
  var customInput = document.getElementById("font-custom-input");
  var customBtn = document.getElementById("font-custom-btn");
  function aplicarFonteLivre() {
    if (!customInput) return;
    var nome = (customInput.value || "").trim();
    if (!nome) return;
    ajustes.fontCustom = nome;
    ajustes.font = "custom";
    applyFont();
    markAjustes();
    saveAjustes();
  }
  if (customBtn) customBtn.addEventListener("click", aplicarFonteLivre);
  if (customInput) {
    customInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        aplicarFonteLivre();
      }
    });
  }

  var cursorList = document.getElementById("cursor-list");
  if (cursorList) {
    cursorList.innerHTML = "";
    CURSORS.forEach(function(c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "font-btn";
      b.dataset.cursor = c.id;
      b.textContent = c.name;
      b.addEventListener("click", function() {
        ajustes.cursor = c.id;
        applyCursor();
        markAjustes();
        saveAjustes();
      });
      cursorList.appendChild(b);
    });
  }
}

function markAjustes() {
  var swatches = document.querySelectorAll(".theme-swatch");
  for (var i = 0; i < swatches.length; i++) {
    swatches[i].classList.toggle("active", swatches[i].dataset.theme === ajustes.theme);
  }
  var fonts = document.querySelectorAll(".font-btn");
  for (var j = 0; j < fonts.length; j++) {
    var isCursor = fonts[j].dataset.cursor != null;
    var on = isCursor
      ? fonts[j].dataset.cursor === ajustes.cursor
      : fonts[j].dataset.font === ajustes.font;
    fonts[j].classList.toggle("active", on);
  }
  var customInput = document.getElementById("font-custom-input");
  if (customInput && document.activeElement !== customInput) {
    customInput.value = ajustes.fontCustom || "";
  }
}

function toggleTheme() {
  playClick("open");
  ajustes.light = !ajustes.light;
  applyPalette();
  markAjustes();
  saveAjustes();
}

function toggleSettings(force) {
  var panel = document.getElementById("settings-panel");
  var btn = document.getElementById("settings-btn");
  if (!panel) return;
  var open = force != null ? force : !panel.classList.contains("open");
  panel.classList.toggle("open", open);
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  // O painel agora é uma janela do XP: minimizar, maximizar e fechar
  var bar = panel.querySelector(".win-bar");
  if (bar) {
    var maxBtn = bar.querySelector(".win-max");
    var minBtn = bar.querySelector(".win-min");
    if (maxBtn) maxBtn.style.display = open ? "" : "none";
    if (minBtn) minBtn.style.display = open ? "" : "none";
  }
  if (open) xpPlay("restore", 0.45);
}

(function initAjustes() {
  loadAjustes();
  try {
    if (localStorage.getItem("matesu.os.migrated") !== "1") {
      ajustes.theme = "papel";
      ajustes.light = false;
      localStorage.setItem("matesu.os.migrated", "1");
      saveAjustes();
    }
  } catch (e) {}
  applyPalette();
  applyFont();
  applyCursor();
  buildAjustesUI();
  markAjustes();
  applyGrain();
  applyHue();

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

    // Os botões da barra de título, como em qualquer janela do XP
    var sClose = document.getElementById("settings-close");
    if (sClose) sClose.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleSettings(false);
    });

    var sMin = document.getElementById("settings-min");
    if (sMin) sMin.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleSettings(false);
    });

    var sMax = document.getElementById("settings-max");
    if (sMax) sMax.addEventListener("click", function(e) {
      e.stopPropagation();
      var on = panel.classList.toggle("maximized");
      sMax.setAttribute("aria-label", on ? "restaurar ajustes" : "maximizar ajustes");
      // maximizado: some o offset que centraliza a janela
      panel.style.transform = on ? "none" : "";
      xpPlay(on ? "minimize" : "restore", 0.45);
    });

    var sBar = panel.querySelector(".win-bar");
    if (sBar) sBar.addEventListener("dblclick", function(e) {
      if (e.target.closest(".win-btn")) return;
      if (sMax) sMax.click();
    });
  }

  var grain = document.getElementById("grain-range");
  if (grain) {
    grain.value = ajustes.grain;
    grain.addEventListener("input", function() {
      ajustes.grain = parseInt(this.value, 10) || 0;
      applyGrain();
      saveAjustes();
    });
    // Dois cliques zeram o grão
    grain.addEventListener("dblclick", function() {
      ajustes.grain = 0;
      this.value = 0;
      applyGrain();
      saveAjustes();
    });
  }

  var hue = document.getElementById("hue-range");
  if (hue) {
    hue.value = ajustes.hue;
    hue.addEventListener("input", function() {
      ajustes.hue = parseInt(this.value, 10) || 0;
      applyHue();
      saveAjustes();
    });
    // Dois cliques zeram a matiz
    hue.addEventListener("dblclick", function() {
      ajustes.hue = 0;
      this.value = 0;
      applyHue();
      saveAjustes();
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

