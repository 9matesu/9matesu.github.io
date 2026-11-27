(function () {
  'use strict';

  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var panels = [].slice.call(document.querySelectorAll('.statement'));
  var popup = document.getElementById('popup');
  var popupBody = popup ? popup.querySelector('.popup-body') : null;
  var popupPhoto = popup ? popup.querySelector('.popup-photo') : null;
  var popupClose = popup ? popup.querySelector('.popup-close') : null;
  var nameBox = document.querySelector('.name');

  /* Conteúdo puxado do portfólio anterior (commit f44c6b1). */
  var INFO = {
    matesu: {
      photo: false,
      text: 'sou matesu. faço design, som e código. são paulo.'
    },
    design: {
      text: 'faço identidade visual, flyers e capas. trabalhei com BLACKMESA, LAGERHAUS, TRACKMESA, Vault 2 e na estamparia da Bulgarian Stock Exchange.'
    },
    music: {
      text: 'produzo música eletrônica entre jungle, UK Garage, techno e ambiente. lancei pelo selo bloodworm trax e toquei na Rinse FM, NTS, Dekmantel, HÖR, Function!, Veneno, Foundation FM e Aaja Music.'
    },
    culture: {
      text: 'faço produção cultural e integro o coletivo artístico BLACKMESA. já colaborei com zonaEXP., SPEEDTEST, Leigo Records, Kenyon Sound e HyperX.'
    },
    engineer: {
      text: 'sou engenheiro de áudio desde 2015, com trabalho técnico em música eletrônica.'
    },
    mixing: {
      text: 'mixei trabalhos de kiddo, Cassiel, Godar, Bruno Kroz e Meio Feel.'
    },
    mastering: {
      text: 'masterizei lançamentos de kiddo, Cassiel, Meio Feel e Bruno Kroz.'
    },
    dj: {
      text: 'toquei na Rinse FM, NTS, Dekmantel, HÖR, Function!, Veneno, Foundation FM e Aaja Music.'
    },
    dev: {
      text: 'desenvolvi resuMe, Opcoda, minisynth32, Catlas e WPtools.'
    },
    about: {
      text: 'sou matesu, produtor musical e engenheiro de áudio desde 2015. transito entre as facetas da música eletrônica de forma técnica, com experimentação e turbulência, seja de maneira introspectiva ou não. acompanho e participo do desenvolvimento de nichos do substrato musical brasileiro, entre o jungle e o UK Garage, do techno ao ambiente.'
    },
    contact: {
      text: 'estou com agendas fechadas. qualquer ideia de trabalho é só escrever para contact@matesu.me.'
    }
  };

  function show(name) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-view') === name;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute('data-view') === name;
      panel.classList.toggle('is-active', on);
      panel.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      show(tab.getAttribute('data-view'));
    });
  });

  function openPopup(key) {
    var data = INFO[key];
    if (!data || !popup || !popupBody) return;
    popupBody.textContent = data.text;
    if (popupPhoto) popupPhoto.hidden = !data.photo;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    var frame = document.querySelector('.frame');
    if (frame) frame.classList.add('popup-open');
  }

  function closePopup() {
    if (!popup) return;
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    var frame = document.querySelector('.frame');
    if (frame) frame.classList.remove('popup-open');
    if (nameBox) nameBox.classList.remove('is-expanded');
  }

  [].slice.call(document.querySelectorAll('[data-popup]')).forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var key = el.getAttribute('data-popup');
      if (key === 'matesu' && nameBox) nameBox.classList.add('is-expanded');
      openPopup(key);
    });
  });

  if (popupClose) popupClose.addEventListener('click', closePopup);
  if (popup) {
    popup.addEventListener('click', function (e) {
      if (e.target === popup) closePopup();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePopup();
  });

  /* Popups para as duas abas, que também trocam o painel. */
  if (tabs.length) {
    tabs[0].setAttribute('data-popup', 'about');
    tabs[1].setAttribute('data-popup', 'contact');
    tabs[0].addEventListener('click', function () { openPopup('about'); });
    tabs[1].addEventListener('click', function () { openPopup('contact'); });
  }
})();
