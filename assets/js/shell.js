// Shell mínimo do portfólio. Sem XP.
function playClick() {}
function playOpenSound() {}

var xpMuted = true;
try {
  var mutedPref = localStorage.getItem("xpMuted");
  if (mutedPref != null) xpMuted = mutedPref === "1";
} catch (e) {}

var xpSoundCache = {};
var xpStartupPlayed = false;

function xpPlay(name, vol) {
  if (xpMuted) return;
  var audio = xpSoundCache[name];
  if (!audio) {
    audio = new Audio("sfx/" + name + ".wav");
    audio.preload = "auto";
    xpSoundCache[name] = audio;
  }
  try {
    var clone = audio.cloneNode();
    clone.volume = vol == null ? 0.5 : vol;
    var playing = clone.play();
    if (playing && playing.catch) playing.catch(function() {});
  } catch (e) {}
}

function xpOpenPortfolioPath(pathArr) {
  if (deskState !== "app") openApp();
  setTimeout(function() {
    path = pathArr.slice();
    syncRender();
  }, 240);
}

function xpOpenExplorer(opts) { return xpCreateWindow(opts); }
function xpMinimizeWindow() {}
function xpShowSearch() {}

if (deskEl) {
  deskEl.addEventListener("contextmenu", function(e) {
    if (e.target.closest(".window, .xp-menu, #xp-windows")) return;
    e.preventDefault();
    showXpMenu(e.clientX, e.clientY, [
      { label: "abrir portfólio", action: openApp },
      { separator: true },
      { label: "email", action: function() { location.href = "mailto:matesubeats@gmail.com"; } },
      { label: "github", action: function() { window.open("https://github.com/9matesu", "_blank", "noopener"); } }
    ]);
  });
}

// Bootstrap: restaura o caminho salvo e monta o stage na primeira renderização.
if (typeof deskRestorePath === "function") deskRestorePath();
if (typeof syncRender === "function") syncRender();