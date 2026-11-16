/* matesu — som do shell. O tema vive nos ajustes; aqui só há o mudo. */
(function () {
  "use strict";

  var onBtn = document.getElementById("sound-on");
  var offBtn = document.getElementById("sound-off");

  function soundOn() {
    return !window.xpMuted;
  }

  function paintSound() {
    var on = soundOn();
    if (onBtn) {
      onBtn.classList.toggle("active", on);
      onBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (offBtn) {
      offBtn.classList.toggle("active", !on);
      offBtn.setAttribute("aria-pressed", on ? "false" : "true");
    }
  }

  function setSound(on) {
    window.xpMuted = !on;
    try { localStorage.setItem("xpMuted", window.xpMuted ? "1" : "0"); } catch (e) {}
    paintSound();
    if (on && typeof xpPlay === "function") xpPlay("start", 0.4);
  }

  if (onBtn) onBtn.addEventListener("click", function () { setSound(true); });
  if (offBtn) offBtn.addEventListener("click", function () { setSound(false); });

  paintSound();
})();
