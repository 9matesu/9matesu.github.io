// Entrada/saída do portfólio e gerenciador de janelas.
var deskEl = document.getElementById("desktop");
var introCard = document.getElementById("intro-card");
var appWindow = document.getElementById("app-window");
var winClose = document.getElementById("win-close");
var introEnter = document.getElementById("intro-enter");
var viewportEl = document.getElementById("viewport");

var deskState = "intro";
var deskBusy = false;

// O nome vira letras soltas, cada uma com o seu atraso.
(function splitIntroName() {
  var name = document.querySelector(".intro-name");
  if (!name) return;
  var text = name.getAttribute("aria-label") || name.textContent;
  name.innerHTML = "";
  for (var i = 0; i < text.length; i++) {
    var span = document.createElement("span");
    span.textContent = text.charAt(i);
    span.style.setProperty("--i", i);
    span.setAttribute("aria-hidden", "true");
    name.appendChild(span);
  }
})();

function deskStagger() {
  if (!viewportEl) return;
  var cols = viewportEl.querySelectorAll("#stage .col");
  for (var c = 0; c < cols.length; c++) {
    cols[c].style.setProperty("--i", c);
    var items = cols[c].querySelectorAll(".item");
    for (var k = 0; k < items.length; k++) items[k].style.setProperty("--i", k);
  }
}

function deskSet(state) {
  deskState = state;
  if (deskEl) deskEl.className = "desk--" + state;
}

function openApp() {
  if (!appWindow || deskBusy || deskState === "app") return;
  deskBusy = true;
  if (introCard) introCard.classList.add("leaving");
  deskState = "app";
  if (deskEl) deskEl.className = "desk--app";
  appWindow.classList.add("enter-anim");
  deskStagger();
  if (typeof mapResize === "function") mapResize();

  setTimeout(function() {
    if (introCard) introCard.classList.remove("leaving");
    appWindow.classList.remove("enter-anim");
    deskBusy = false;
  }, 900);
}

function showIntro() {
  if (!introCard) return;
  deskSet("intro");
  introCard.classList.remove("leaving");
  var name = introCard.querySelector(".intro-name");
  if (name) {
    name.querySelectorAll("span").forEach(function(sp) {
      sp.style.animation = "none";
      void sp.offsetWidth;
      sp.style.animation = "";
    });
  }
}

function closeApp() {
  if (deskState !== "app") return;
  playClick("close");
  showIntro();
  if (typeof mapResize === "function") setTimeout(mapResize, 300);
}

if (introEnter) introEnter.addEventListener("click", function() {
  playClick("open");
  openApp();
});

if (winClose) winClose.addEventListener("click", function(e) {
  e.stopPropagation();
  closeApp();
});

// ---------------------------------------------------------------- janelas
var xpWindowsEl = document.getElementById("xp-windows");
var xpWindowSeq = 0;
var xpWindowZ = 30;
var xpOpenWindows = [];

function xpNextZ() {
  xpWindowZ += 1;
  return xpWindowZ;
}

var XP_ICONS = {
  folder: "img/xp/FolderOpen.png",
  folderClosed: "img/xp/Folder.png",
  file: "img/xp/Notepad.png",
  picture: "img/xp/Camera.png",
  music: "img/xp/Media.png",
  app: "img/xp/Wmp.png",
  computer: "img/xp/Computer.png",
  network: "img/xp/Network.png",
  drive: "img/xp/Drive.png",
  cd: "img/xp/CdRom.png"
};

function xpFocusWindow(win) {
  if (win && win.el) win.el.style.zIndex = String(xpNextZ());
}

function xpCloseWindowEl(el) {
  if (!el) return;
  var id = el.getAttribute("data-xp-id");
  xpOpenWindows = xpOpenWindows.filter(function(w) { return w.id !== id; });
  if (el.parentNode) el.parentNode.removeChild(el);
}

function xpCreateWindow(opts) {
  if (!xpWindowsEl) return null;
  var id = "xp-win-" + (++xpWindowSeq);
  var win = document.createElement("div");
  win.className = "xp-window";
  win.id = id;
  win.setAttribute("data-xp-id", id);
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", opts.title || "janela");
  win.style.left = (opts.left || 40) + "px";
  win.style.top = (opts.top || 40) + "px";
  win.style.width = (opts.width || 640) + "px";
  win.style.height = (opts.height || 420) + "px";
  win.style.zIndex = String(xpNextZ());

  var bar = document.createElement("div");
  bar.className = "xp-titlebar";
  var title = document.createElement("span");
  title.className = "xp-titlebar-title";
  title.textContent = opts.title || "";
  var controls = document.createElement("span");
  controls.className = "xp-titlebar-controls";
  var close = document.createElement("button");
  close.type = "button";
  close.className = "xp-titlebar-btn";
  close.setAttribute("aria-label", "fechar");
  close.textContent = "×";
  close.addEventListener("click", function(e) {
    e.stopPropagation();
    if (opts.onClose) opts.onClose();
    xpCloseWindowEl(win);
  });
  controls.appendChild(close);
  bar.appendChild(title);
  bar.appendChild(controls);

  var body = document.createElement("div");
  body.className = "xp-body";

  win.appendChild(bar);
  win.appendChild(body);
  xpWindowsEl.appendChild(win);

  var entry = {
    id: id,
    el: win,
    body: body,
    onClose: opts.onClose || null
  };
  xpOpenWindows.push(entry);

  win.addEventListener("pointerdown", function() { xpFocusWindow(entry); });
  if (opts.build) opts.build(entry, body);

  return entry;
}

function xpOpenExplorer(opts) {
  return xpCreateWindow({
    id: opts.id,
    title: opts.title,
    width: opts.width,
    height: opts.height,
    left: opts.left,
    top: opts.top,
    onClose: opts.onClose,
    build: function(win, body) {
      body.textContent = opts.address || opts.title || "";
    }
  });
}

function xpShowProperties(name) {
  showXpMenu(window.innerWidth / 2, window.innerHeight / 2, [
    { label: String(name || "matesu"), disabled: true },
    { separator: true },
    { label: "fechar", action: function() {} }
  ]);
}

var openXpMenu = null;

function closeXpMenu() {
  if (openXpMenu && openXpMenu.parentNode) openXpMenu.parentNode.removeChild(openXpMenu);
  openXpMenu = null;
}

function showXpMenu(x, y, items) {
  closeXpMenu();
  var menu = document.createElement("div");
  menu.className = "xp-menu";
  menu.setAttribute("role", "menu");
  items.forEach(function(item) {
    if (item.separator) {
      var sep = document.createElement("div");
      sep.className = "xp-menu-sep";
      menu.appendChild(sep);
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "xp-menu-item";
    btn.setAttribute("role", "menuitem");
    btn.textContent = item.label;
    if (item.disabled) {
      btn.setAttribute("aria-disabled", "true");
    } else {
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        closeXpMenu();
        if (item.action) item.action();
      });
    }
    menu.appendChild(btn);
  });
  document.body.appendChild(menu);
  var mw = menu.offsetWidth;
  var mh = menu.offsetHeight;
  menu.style.left = Math.max(4, Math.min(x, window.innerWidth - mw - 4)) + "px";
  menu.style.top = Math.max(4, Math.min(y, window.innerHeight - mh - 4)) + "px";
  openXpMenu = menu;
}

document.addEventListener("pointerdown", function(e) {
  if (openXpMenu && !e.target.closest(".xp-menu")) closeXpMenu();
}, true);

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    if (openXpMenu) { closeXpMenu(); return; }
    if (deskState === "app") { closeApp(); return; }
  }
});

window.xpCloseWindowEl = xpCloseWindowEl;