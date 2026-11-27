(function () {
  'use strict';
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var panels = [].slice.call(document.querySelectorAll('.statement'));

  function show(name) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-panel') === name;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var on = panel.id === name;
      panel.classList.toggle('is-active', on);
      panel.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      show(tab.getAttribute('data-panel'));
    });
  });
})();
