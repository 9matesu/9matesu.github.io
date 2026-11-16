// =====================================================================
//  MONTAGEM DA ÁREA DE TRABALHO
//  Cada ícone abre sua janela. O "Meu Computador" reúne os atalhos,
//  Documentos e Imagens mostram o conteúdo do portfólio, e Música abre
//  o Windows Media Player com os lançamentos.
// =====================================================================

// Converte a árvore do site em entradas de arquivo do explorer.
function xpEntriesFromTree(node) {
  if (!node || typeof node !== "object") return [];
  return Object.keys(node).map(function(key) {
    var child = node[key];
    var isFolder = child && typeof child === "object" && !isLeaf(child);
    return {
      name: key,
      type: isFolder ? "folder" : "file",
      node: isFolder ? child : null,
      date: child && child.meta ? child.meta : "",
      size: "",
      typeName: isFolder ? "Pasta de arquivos" : "Documento",
      leaf: isFolder ? null : child,
      path: null
    };
  });
}

// Percorre a árvore e devolve todas as folhas com o caminho completo.
function xpLeafPaths(node, prefix) {
  var out = [];
  var keys = Object.keys(node || {});
  keys.forEach(function(key) {
    var child = node[key];
    var path = prefix.concat([key]);
    if (child && typeof child === "object" && !isLeaf(child)) {
      out = out.concat(xpLeafPaths(child, path));
    } else {
      out.push({ key: key, node: child, path: path });
    }
  });
  return out;
}

// Abre o item do portfólio dentro da janela de documentos.
function xpOpenPortfolioPath(pathArr) {
  // primeiro abre o app para o mapa e a coluna fazerem sentido
  if (deskState !== "app") openApp();
  setTimeout(function() {
    path = pathArr.slice();
    syncRender();
  }, 240);
}

// ------------------------------------------------- meu computador
function xpOpenMyComputer() {
  var root = {
    label: "Meu Computador",
    icon: XP_ICONS.computer,
    children: []
  };

  var win = xpOpenExplorer({
    id: "xp-computer",
    title: "Meu Computador",
    icon: XP_ICONS.computer,
    width: 580,
    height: 400,
    left: 110,
    top: 56,
    address: "Meu Computador",
    tree: root
  });

  win.go(root, "Meu Computador");
  return win;
}

// ------------------------------------------------- ligar os ícones
function xpWireDesktop() {
  var icons = {
    "icon-portfolio": function() {
      // portfólio abre só a janela grande, sem o Meu Computador junto
      openApp();
    },
    "icon-sobre": function() {
      if (deskState === "intro") return;
      showIntro(false);
    },
    "icon-player": xpOpenPlayer
  };

  var all = deskIconsEl.querySelectorAll(".desk-icon");
  for (var i = 0; i < all.length; i++) {
    (function(icon) {
      var open = icons[icon.id];
      var lastClick = 0;

      // duplo clique abre, como no XP
      if (open) {
        icon.addEventListener("dblclick", function(e) {
          e.preventDefault();
          e.stopPropagation();
          playClick("dblclick");
          open();
        });
      }

      // clique simples seleciona e faz o estalo do XP
      icon.addEventListener("click", function(e) {
        if (deskIconSuppressClick) return;
        e.stopPropagation();
        var now = Date.now();
        var isDouble = now - lastClick < 420;
        lastClick = now;
        if (isDouble) return; // o dblclick cuida
        if (e.ctrlKey) {
          var sel = Array.prototype.slice.call(deskIconsEl.querySelectorAll(".desk-icon.selected"));
          if (sel.indexOf(icon) < 0) sel.push(icon);
          deskSelectIcons(sel);
        } else {
          deskSelectIcons([icon]);
        }
        deskIconSpin(icon);
      });

      icon.addEventListener("pointerdown", function(e) {
        deskIconPointerDown(e);
      });

      // roda do mouse: manda o ícone para a frente ou para trás
      icon.addEventListener("wheel", function(e) {
        e.preventDefault();
        deskIconDepth(icon, e.deltaY < 0 ? 1 : -1);
      }, { passive: false });

      // menu de contexto do XP no ícone
      icon.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        e.stopPropagation();
        deskSelectIcons([icon]);
        var name = icon.querySelector(".desk-icon-label");
        showXpMenu(e.clientX, e.clientY, [
          { label: "Abrir", action: function() { if (open) open(); } },
          { separator: true },
          { label: "Recortar", disabled: true },
          { label: "Copiar", disabled: true },
          { label: "Cortar", disabled: true },
          { separator: true },
          { label: "Excluir", disabled: true },
          { separator: true },
          { label: "Renomear", disabled: true },
          { label: "Propriedades", action: function() { xpShowProperties(name ? name.textContent : icon.id); } }
        ]);
      });
    })(all[i]);
  }

  // botão direito no fundo da mesa
  deskEl.addEventListener("contextmenu", function(e) {
    if (e.target.closest(".desk-icon, .window, #taskbar, #start-menu, .xp-menu, #xp-windows")) return;
    e.preventDefault();
    deskSelectIcons([]);
    showXpMenu(e.clientX, e.clientY, [
      { label: "Atualizar", action: function() { deskLayoutIcons(); playClick("open"); } },
      { separator: true },
      { label: "Novo", disabled: true },
      { separator: true },
      { label: "Propriedades", action: function() { xpShowProperties("Área de Trabalho"); } }
    ]);
  });

  // arrastar o retângulo de seleção
  deskEl.addEventListener("pointerdown", function(e) {
    if (e.button !== 0) return;
    if (e.target.closest(".desk-icon, .window, #taskbar, #start-menu, .xp-menu")) return;
    deskMarqueeStart(e);
  });

  // soltar o clique no fundo limpa a seleção
  deskEl.addEventListener("click", function(e) {
    if (e.target.closest(".desk-icon, .window, #taskbar, #start-menu, .xp-menu")) return;
    deskSelectIcons([]);
  });

  deskLayoutIcons();
  window.addEventListener("resize", function() {
    deskLayoutIcons();
  });
}

// ------------------------------------------------- propriedades
function xpShowProperties(name) {
  var win = xpCreateWindow({
    id: "xp-props",
    kind: "explorer",
    title: name + " Propriedades",
    icon: "img/xp/Information.png",
    width: 320,
    height: 230,
    left: 260,
    top: 140,
    build: function(win, body) {
      body.style.display = "block";
      body.style.padding = "14px";
      body.style.background = "#ece9d8";
      body.style.overflow = "auto";

      var h = document.createElement("div");
      h.style.fontWeight = "700";
      h.style.marginBottom = "10px";
      h.textContent = name;
      body.appendChild(h);

      [
        ["Tipo", name === "Área de Trabalho" ? "Pasta de sistema" : "Arquivo"],
        ["Local", "C:\\matesu\\Área de Trabalho"],
        ["Tamanho", "12,0 KB"],
        ["Modificado", "09/11/2026 12:00"]
      ].forEach(function(row) {
        var line = document.createElement("div");
        line.style.display = "flex";
        line.style.gap = "8px";
        line.style.padding = "3px 0";
        var k = document.createElement("span");
        k.textContent = row[0];
        k.style.width = "86px";
        k.style.color = "#444";
        var v = document.createElement("span");
        v.textContent = row[1];
        line.appendChild(k);
        line.appendChild(v);
        body.appendChild(line);
      });
    }
  });
  return win;
}

// ------------------------------------------------- barra de acesso rápido
// Os atalhos da barra de tarefas abrem as mesmas janelas dos ícones da
// área de trabalho.
function xpWireQuickLaunch() {
  var host = document.querySelector(".quick-launch");
  if (!host) return;

  var actions = {
    "computer": function() { xpOpenMyComputer(); },
    "player": function() { xpOpenPlayer(); },
    "search": function() {
      // a busca do XP abre uma janela de pesquisa
      xpShowSearch();
    },
    "desktop": function() {
      // "mostrar área de trabalho" minimiza tudo
      var any = false;
      xpOpenWindows.forEach(function(w) {
        if (!w.minimized) { xpMinimizeWindow(w); any = true; }
      });
      if (appWindow && !appWindow.classList.contains("minimized")) {
        minimizeApp();
        any = true;
      }
      if (!any) xpPlay("restore", 0.35);
    }
  };

  var btns = host.querySelectorAll(".ql-btn");
  for (var i = 0; i < btns.length; i++) {
    (function(btn) {
      var act = actions[btn.dataset.ql];
      if (!act) return;
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        act();
      });
    })(btns[i]);
  }
}

// A janela de pesquisa do XP, filtrando os itens do portfólio.
function xpShowSearch() {
  var win = xpCreateWindow({
    id: "xp-search",
    kind: "explorer",
    title: "Pesquisar: resultados",
    icon: "img/xp/Search.png",
    width: 460,
    height: 330,
    left: 240,
    top: 120,
    build: function(win, body) {
      body.style.display = "block";
      body.style.padding = "12px";
      body.style.background = "#ece9d8";
      body.style.overflow = "auto";

      var label = document.createElement("div");
      label.style.marginBottom = "8px";
      label.style.fontWeight = "700";
      label.textContent = "procurar em matesu: portfólio";
      body.appendChild(label);

      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = "nome ou palavra";
      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.style.padding = "3px 5px";
      input.style.border = "1px solid #7f9db9";
      input.style.fontFamily = "var(--font-xp)";
      input.style.fontSize = "12px";
      body.appendChild(input);

      var results = document.createElement("div");
      results.style.marginTop = "10px";
      body.appendChild(results);

      function render(q) {
        results.innerHTML = "";
        var needle = normalizeText(q);
        var hits = [];
        xpLeafPaths(tree, []).forEach(function(leaf) {
          if (!needle) return;
          var node = leaf.node || {};
          var hay = normalizeText([leaf.key, node.title, node.meta, node.body].filter(Boolean).join(" "));
          if (hay.indexOf(needle) >= 0) hits.push(leaf);
        });

        if (!needle) {
          var hint = document.createElement("div");
          hint.className = "xp-wmp-empty";
          hint.style.color = "#555";
          hint.textContent = "digite para procurar no portfólio.";
          results.appendChild(hint);
          return;
        }
        if (!hits.length) {
          var none = document.createElement("div");
          none.className = "xp-wmp-empty";
          none.style.color = "#555";
          none.textContent = "nenhum item encontrado.";
          results.appendChild(none);
          return;
        }

        hits.forEach(function(leaf) {
          var row = document.createElement("button");
          row.type = "button";
          row.className = "xp-file";
          var ico = document.createElement("img");
          ico.src = XP_ICONS.folder;
          ico.alt = "";
          row.appendChild(ico);
          var name = document.createElement("span");
          name.className = "xp-file-name";
          name.textContent = leaf.path.join(" > ");
          row.appendChild(name);
          row.addEventListener("click", function() {
            playClick("dblclick");
            xpOpenPortfolioPath(leaf.path);
            xpCloseWindow(win);
          });
          results.appendChild(row);
        });
      }

      render("");
      input.addEventListener("input", function() { render(input.value); });
      setTimeout(function() { input.focus(); }, 60);
    }
  });
  return win;
}

// ------------------------------------------------- iniciar
window.addEventListener("pointerdown", deskImpactArm, { passive: true });
window.addEventListener("keydown", deskImpactArm, { passive: true });

if (deskIconsEl) {
  xpWireDesktop();
  xpWireQuickLaunch();
  xpStartupOnEntry();
}

// a biblioteca do player carrega independente do chrome do XP
wmpLoadLibrary();

// ------------------------------------------------- menu iniciar
// Documentos recentes e programas: saem da mesma árvore do site, então o
// menu nunca leva para um lugar que não existe.
var START_RECENT = [
  { label: "BLACKMESA Hz", path: ["design", "arte", "blackmesa hz"] },
  { label: "TRACKMESA", path: ["design", "flyers", "trackmesa"] },
  { label: "Simpatia", path: ["design", "flyers", "simpatia"] },
  { label: "bse (iran tee)", path: ["design", "vestuário", "bse (iran tee)", "frente"] }
];

function startMenuSet(open) {
  if (!startMenu || !startBtn) return;
  var wasOpen = startMenu.classList.contains("open");
  startMenu.classList.toggle("open", open);
  startBtn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open && !wasOpen) xpPlay("start", 0.55);
}

function startMenuClose() {
  startMenuSet(false);
}

// ------------------------------------------------- balão, som e energia
var balloonEl = document.getElementById("xp-balloon");
var balloonTitle = document.getElementById("balloon-title");
var balloonText = document.getElementById("balloon-text");
var balloonTimer = null;

function hideBalloon() {
  if (balloonEl) balloonEl.classList.remove("show");
}

function showBalloon(title, text, ms) {
  if (!balloonEl) return;
  if (balloonTitle) balloonTitle.textContent = title;
  if (balloonText) balloonText.textContent = text;
  balloonEl.classList.add("show");
  xpPlay("balloon", 0.55);
  clearTimeout(balloonTimer);
  balloonTimer = setTimeout(hideBalloon, ms || 4200);
}

var balloonClose = document.getElementById("balloon-close");
if (balloonClose) balloonClose.addEventListener("click", function(e) {
  e.stopPropagation();
  hideBalloon();
});

// O mudo vive nos ajustes (swiss.js); aqui não há mais tray do XP.

var shutdownScreen = document.getElementById("shutdown-screen");
var shutdownTimer = null;

function xpShutdown() {
  if (!shutdownScreen) return;
  startMenuClose();
  hideBalloon();
  var msg = document.getElementById("shutdown-msg");
  var sub = document.getElementById("shutdown-sub");
  shutdownScreen.hidden = false;
  shutdownScreen.onclick = null;
  if (msg) msg.textContent = "o Windows está sendo desligado...";
  if (sub) sub.textContent = "aguarde";
  xpPlay("shutdown", 0.6);
  clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(function() {
    if (msg) msg.textContent = "é seguro desligar o computador";
    if (sub) sub.textContent = "clique em qualquer lugar para reiniciar";
    shutdownScreen.onclick = function() {
      shutdownScreen.onclick = null;
      location.reload();
    };
  }, 3300);
}

var logoffScreen = document.getElementById("logoff-screen");
var welcomeTile = document.getElementById("welcome-tile");
var logoffReady = false;
var logoffTimer = null;

function xpLogoff() {
  if (!logoffScreen) return;
  startMenuClose();
  hideBalloon();
  logoffReady = false;
  var msg = logoffScreen.querySelector(".power-msg");
  if (msg) msg.textContent = "fazendo logoff...";
  if (welcomeTile) {
    welcomeTile.style.opacity = "0.35";
    welcomeTile.style.pointerEvents = "none";
  }
  logoffScreen.hidden = false;
  xpPlay("logoff", 0.6);
  clearTimeout(logoffTimer);
  logoffTimer = setTimeout(function() {
    logoffReady = true;
    if (msg) msg.textContent = "bem-vindo";
    if (welcomeTile) {
      welcomeTile.style.opacity = "";
      welcomeTile.style.pointerEvents = "";
      welcomeTile.focus();
    }
  }, 2100);
}

function xpWelcome() {
  if (!logoffReady || !logoffScreen) return;
  logoffReady = false;
  logoffScreen.hidden = true;
  xpStartupPlayed = true;
  xpPlay("startup", 0.4);
  showIntro(true);
}

if (welcomeTile) {
  welcomeTile.addEventListener("click", function(e) {
    e.stopPropagation();
    xpWelcome();
  });
  welcomeTile.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      xpWelcome();
    }
  });
}

// ------------------------------------------------- flyouts do menu
function startFlyRow(label, opts) {
  opts = opts || {};
  var row = document.createElement("div");
  row.className = "start-flyout-row";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "start-item";
  btn.setAttribute("role", "menuitem");
  if (opts.filter) btn.setAttribute("data-filter", opts.filter);
  if (opts.path) btn.setAttribute("data-path", opts.path.join("|"));
  if (opts.action) btn.setAttribute("data-start", opts.action);

  var img = document.createElement("img");
  img.className = "start-ico start-ico--sm";
  img.src = opts.icon || "img/xp/FolderOpened.png";
  img.alt = "";

  var txt = document.createElement("span");
  txt.className = "start-txt";
  var b = document.createElement("b");
  b.textContent = label;
  txt.appendChild(b);

  btn.appendChild(img);
  btn.appendChild(txt);

  if (opts.kids && opts.kids.length) {
    btn.setAttribute("aria-haspopup", "true");
    var arrow = document.createElement("span");
    arrow.className = "start-arrow";
    arrow.setAttribute("aria-hidden", "true");
    btn.appendChild(arrow);

    var sub = document.createElement("div");
    sub.className = "start-flyout";
    sub.setAttribute("role", "menu");
    opts.kids.forEach(function(kid) {
      sub.appendChild(startFlyRow(kid.label, kid));
    });
    row.appendChild(btn);
    row.appendChild(sub);
    return row;
  }

  row.appendChild(btn);
  return row;
}

(function buildStartFlyouts() {
  var all = document.querySelector(".js-all-programs");
  if (all) {
    Object.keys(tree).forEach(function(cat) {
      var kids = Object.keys(tree[cat] || {}).map(function(kid) {
        return { label: kid, path: [cat, kid] };
      });
      all.appendChild(startFlyRow(cat, {
        filter: cat,
        kids: kids
      }));
    });
  }

  var recent = document.querySelector(".js-recent-docs");
  if (recent) {
    START_RECENT.forEach(function(rec) {
      recent.appendChild(startFlyRow(rec.label, {
        path: rec.path,
        icon: "img/xp/FolderOpened.png"
      }));
    });
  }
})();

// ------------------------------------------------- ações do menu
function startMenuRun(item) {
  var action = item.getAttribute("data-start");
  var dataPath = item.getAttribute("data-path");
  var dataFilter = item.getAttribute("data-filter");

  if (action === "shutdown") { xpShutdown(); return; }
  if (action === "logoff") { xpLogoff(); return; }

  startMenuClose();
  xpPlay("menu", 0.7);

  if (dataPath) {
    deskEnsureOpen();
    path = dataPath.split("|");
    if (filterMode !== "all" && filterMode !== path[0]) {
      filterMode = "all";
      if (filterSelect) filterSelect.value = "all";
    }
    clearSearch();
    syncRender();
    return;
  }

  if (dataFilter) {
    deskEnsureOpen();
    path = [];
    filterMode = dataFilter;
    if (filterSelect) filterSelect.value = dataFilter;
    clearSearch();
    syncRender();
    return;
  }

  if (action === "portfolio") {
    openApp();
    return;
  }

  if (action === "sobre" || action === "help") {
    showIntro(true);
    return;
  }

  if (action === "email") {
    window.location.href = "mailto:matesubeats@gmail.com";
    return;
  }

  if (action === "settings") {
    deskEnsureOpen();
    setTimeout(function() { toggleSettings(true); }, 80);
    return;
  }

  if (action === "search") {
    deskEnsureOpen();
    setTimeout(function() {
      clearSearch();
      if (searchInput) searchInput.focus();
    }, 100);
    return;
  }

  if (action === "network") {
    showBalloon("conectar-se", "A rede sem fio não está disponível agora.");
    return;
  }

  if (action === "printer") {
    showBalloon("impressoras e fax", "Nenhuma impressora instalada neste computador.");
    return;
  }

  if (action === "run") {
    showBalloon("executar", "Nenhum programa foi especificado.");
  }
}

if (startBtn) startBtn.addEventListener("click", function(e) {
  e.stopPropagation();
  startMenuSet(!(startMenu && startMenu.classList.contains("open")));
});

if (startMenu) {
  startMenu.addEventListener("click", function(e) {
    var item = e.target.closest("[data-start], [data-path], [data-filter]");
    if (!item) return;
    startMenuRun(item);
  });
}

document.addEventListener("click", function(e) {
  if (!startMenu || !startMenu.classList.contains("open")) return;
  if (startMenu.contains(e.target) || startBtn.contains(e.target)) return;
  startMenuClose();
});

document.addEventListener("keydown", function(e) {
  if (e.key !== "Escape") return;
  if (startMenu && startMenu.classList.contains("open")) {
    startMenuClose();
    if (startBtn) startBtn.focus();
    return;
  }
  if (deskState === "app" && appWindow.classList.contains("maximized")) {
    maximizeApp();
  }
});

if (taskApp) taskApp.addEventListener("click", function() {
  if (deskState === "app") minimizeApp();
  else openApp();
});

if (iconSobre) iconSobre.addEventListener("dblclick", function() {
  if (deskState === "intro") return;
  playClick("dblclick");
  showIntro(false);
});

// Entrar pelo teclado: no cartão, Enter ou espaço abre a janela.
document.addEventListener("keydown", function(e) {
  if (deskState !== "intro") return;
  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
    e.preventDefault();
    openApp();
  }
});

// Relógio da barra de tarefas
function deskClock() {
  if (!taskClock) return;
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  taskClock.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}
deskClock();
setInterval(deskClock, 15000);

// O mapa pode abrir a janela quando o usuário clica numa estação na mesa
function deskEnsureOpen() {
  if (deskState !== "app") openApp();
}

deskRestorePath();
syncRender();
