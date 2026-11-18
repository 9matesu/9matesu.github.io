// matesu — card. Dot-cut animado em cima, frases que passam devagar.
(function () {
  // Fundo: dot-cut (design.how) animado, paleta escura.
  function mountDotCut() {
    if (!window.DotCut || !window.DOTCUT_SCENES) return;

    if (window.DOTCUT_PALETTES) {
      window.DOTCUT_PALETTES.length = 0;
      [
        { circle: '#ffe800', back: '#0a0a0a' },
        { circle: '#8f9df5', back: '#0a0a0a' },
        { circle: '#f1eee7', back: '#0a0a0a' },
        { circle: '#ffe800', back: '#141414' },
        { circle: '#8f9df5', back: '#141414' },
        { circle: '#f1eee7', back: '#141414' }
      ].forEach(function (p) { window.DOTCUT_PALETTES.push(p); });
    }

    var host = document.getElementById('dotcut');
    if (!host) return;
    try {
      var engine = new window.DotCut(host);
      if (engine.ok && !engine.ok()) return;
      engine.sceneIdx = 0;
      engine.prevScene = 0;
      engine.applyScene(window.DOTCUT_SCENES[0], true);
      if (engine.reduce) {
        engine.renderStill();
      } else {
        engine.start();
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) engine.stop();
          else engine.start();
        });
      }
      window.__dotcut = engine;
    } catch (e) {}
  }
  mountDotCut();

  var PHRASES = [
    'construindo coisas',
    'criando',
    'enrolando',
    'sonhando',
    'construindo coisas',
    'criando',
    'de marola',
    'enrolando',
    'sonhando'
  ];

  var el = document.getElementById('phrase');
  if (!el) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0;

  function next() {
    if (reduce) {
      i = (i + 1) % PHRASES.length;
      el.textContent = PHRASES[i];
      return;
    }
    el.classList.add('out');
    window.setTimeout(function () {
      i = (i + 1) % PHRASES.length;
      el.textContent = PHRASES[i];
      el.classList.remove('out');
      // reinicia a entrada
      void el.offsetWidth;
      el.classList.add('in');
      window.setTimeout(function () { el.classList.remove('in'); }, 30);
    }, 900);
  }

  if (reduce) {
    window.setInterval(next, 4200);
  } else {
    window.setInterval(next, 3800);
  }
})();