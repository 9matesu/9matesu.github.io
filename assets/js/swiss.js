/* matesu OS — shell Swiss: barra, dock, relógio, som e troca de tema. */
(function () {
  "use strict";

  var root = document.documentElement;
  var xpLink = document.getElementById("xp-css");
  var soundButton = document.getElementById("swiss-sound");
  var shellButton = document.getElementById("swiss-theme");
  var clockTop = document.getElementById("swiss-clock");
  var clockDock = document.getElementById("dock-clock");
  var statusText = document.getElementById("dock-status-text");

  function currentShell() {
    return root.getAttribute("data-shell") === "xp" ? "xp" : "swiss";
  }

  function paintShellButtons() {
    var buttons = document.querySelectorAll("[data-shell-set]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("active", buttons[i].getAttribute("data-shell-set") === currentShell());
    }
  }

  function setStatus(text) {
    if (statusText) statusText.textContent = text;
  }

  function setShell(next, persist) {
    next = next === "xp" ? "xp" : "swiss";
    root.setAttribute("data-shell", next);
    if (xpLink) xpLink.media = next === "xp" ? "all" : "not all";
    document.body.classList.toggle("shell-xp", next === "xp");
    document.body.classList.toggle("shell-swiss", next === "swiss");

    if (persist !== false) {
      try { localStorage.setItem("matesu.shell", next); } catch (e) {}
    }

    if (typeof applyPalette === "function") applyPalette();
    if (typeof applyFont === "function") applyFont();
    if (typeof applyCursor === "function") applyCursor();

    if (typeof setMapHeight === "function" && typeof mapDefaultHeight === "function") {
      if (next === "swiss" && mapHeight > Math.round(window.innerHeight * 0.4)) {
        setMapHeight(mapDefaultHeight());
      } else if (next === "xp" && mapHeight < Math.round(window.innerHeight * 0.4)) {
        setMapHeight(Math.round(window.innerHeight * 0.46));
      }
    }

    if (shellButton) shellButton.textContent = next === "xp" ? "swiss" : "xp";
    paintShellButtons();
    setStatus(next === "xp" ? "windows xp" : "matesu os");
  }

  function soundOn() {
    return !window.xpMuted;
  }

  function paintSound() {
    if (!soundButton) return;
    var on = soundOn();
    soundButton.setAttribute("aria-pressed", on ? "true" : "false");
    soundButton.textContent = on ? "som" : "mudo";
    soundButton.title = on ? "desligar som" : "ligar som";
  }

  function toggleSound() {
    window.xpMuted = soundOn();
    try { localStorage.setItem("xpMuted", window.xpMuted ? "1" : "0"); } catch (e) {}
    paintSound();
    if (!window.xpMuted && typeof xpPlay === "function") xpPlay("start", 0.4);
  }

  function tickClock() {
    var text = "--:--";
    try {
      text = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).format(new Date());
    } catch (e) {
      var d = new Date();
      text = (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    }
    if (clockTop) clockTop.textContent = text;
    if (clockDock) clockDock.textContent = text;
  }

  function pulseMap() {
    var sheet = document.getElementById("map-sheet");
    if (!sheet) return;
    sheet.classList.add("is-target");
    setTimeout(function () { sheet.classList.remove("is-target"); }, 1200);
  }

  function act(name) {
    switch (name) {
      case "home":
      case "about":
        if (typeof showIntro === "function") showIntro(false);
        setStatus("capa");
        break;
      case "portfolio":
        if (typeof openApp === "function") openApp();
        setStatus("portfólio");
        break;
      case "map":
        if (typeof openApp === "function") openApp();
        setStatus("mapa");
        setTimeout(pulseMap, 260);
        break;
      case "player":
        if (typeof openApp === "function") openApp();
        setStatus("player");
        setTimeout(function () {
          if (typeof xpOpenPlayer === "function") xpOpenPlayer();
        }, 280);
        break;
      case "index":
        if (typeof openApp === "function") openApp();
        setStatus("índice");
        setTimeout(function () {
          var input = document.getElementById("search");
          if (input) input.focus();
        }, 280);
        break;
      default:
        break;
    }
  }

  document.addEventListener("click", function (e) {
    var target = e.target.closest ? e.target.closest("[data-swiss]") : null;
    if (!target) return;
    e.preventDefault();
    act(target.getAttribute("data-swiss"));
  });

  var shellSetButtons = document.querySelectorAll("[data-shell-set]");
  for (var si = 0; si < shellSetButtons.length; si++) {
    shellSetButtons[si].addEventListener("click", function () {
      setShell(this.getAttribute("data-shell-set"));
    });
  }

  if (shellButton) {
    shellButton.addEventListener("click", function () {
      setShell(currentShell() === "swiss" ? "xp" : "swiss");
    });
  }

  if (soundButton) {
    soundButton.addEventListener("click", toggleSound);
  }

  setShell(currentShell(), false);
  paintShellButtons();
  paintSound();
  tickClock();
  setInterval(tickClock, 15000);
  setInterval(paintSound, 1000);
})();