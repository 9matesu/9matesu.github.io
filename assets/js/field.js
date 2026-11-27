(function () {
  'use strict';

  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var panels = [].slice.call(document.querySelectorAll('.statement'));
  var popup = document.getElementById('popup');
  var popupBody = popup ? popup.querySelector('.popup-body') : null;
  var popupClose = popup ? popup.querySelector('.popup-close') : null;
  var nameBox = document.querySelector('.name');
  var W = 'img/work/';

  /* Trabalhos puxados do portfólio anterior (commit f44c6b1). */
  var INFO = {
    design: {
      title: 'design gráfico',
      items: [
        { title: 'BSE Tee, frente', meta: 'estampa têxtil · 2025', img: W + 'img_bse_frente.webp', link: 'https://plazaaaaa.com/product/2340' },
        { title: 'BSE Tee, costas', meta: 'estampa têxtil · 2025', img: W + 'img_bse_costas.webp', link: 'https://plazaaaaa.com/product/2340' },
        { title: 'BLACKMESA', meta: 'identidade visual · 2025', img: W + 'img_logos_blackmesa.webp', link: 'https://behance.net/gallery/226862609/BLACKMESA-2025' },
        { title: 'BLACKMESA', meta: 'identidade visual · 2024', img: W + 'img_logos_blackmesa.webp', link: 'https://behance.net/gallery/226860687/BLACKMESA-2024' },
        { title: 'LAGERHAUS I', meta: 'direção de arte · 2024', img: W + 'img_logos_bloodworm.webp', link: 'https://behance.net/gallery/226864143/bloodworm-trax-LAGERHAUS-I' },
        { title: 'TRACKMESA', meta: 'flyer · 10/07/2026', img: W + 'img_trackmesa_1.webp' },
        { title: 'Vault 2', meta: 'flyer · 17/12/2025', img: W + 'img_misc_vault2_FINAL_3.webp' },
        { title: 'Simpatia', meta: 'capa e contracapas · 20/05/2025', img: W + 'img_simpatia_capa.webp' }
      ]
    },
    music: {
      title: 'produção musical',
      items: [
        { title: 'Antologia', meta: 'álbum · 2026 · ambient, downtempo' },
        { title: 'refix.pak', meta: 'álbum · 2026 · grime' },
        { title: 'SP-150', meta: 'álbum · 2026 · garage, dubstep' },
        { title: 'carnagarage', meta: 'álbum · 2025 · UK garage, speed garage' },
        { title: 'Qa', meta: 'álbum · 2023 · jungle, grime, dubstep' },
        { title: 'Rarer Demons', meta: 'álbum · 2022 · drum and bass, jungle' },
        { title: 'No Format', meta: 'álbum · 2021 · grime, electronic' },
        { title: 'International Flux', meta: 'álbum · 2021 · jungle' }
      ]
    },
    culture: {
      title: 'produção cultural',
      items: [
        { title: 'BLACKMESA', meta: 'coletivo artístico · são paulo', img: W + 'img_bmhz0_frente.webp', link: 'https://instagram.com/blackmesaent' },
        { title: 'bloodworm trax', meta: 'selo musical · são paulo', img: W + 'img_logos_bloodworm.webp', link: 'https://bloodwormtrax.neocities.org' },
        { title: 'TRACKMESA', meta: 'evento · 10/07/2026 · Void Centro', img: W + 'img_trackmesa_1.webp', link: 'https://zig.tickets/eventos/trackmesa' }
      ]
    },
    engineer: {
      title: 'engenharia de áudio',
      items: [
        { title: 'ON', meta: 'mixagem e masterização · 2026 · Cassiel' },
        { title: 'intrínseca city', meta: 'mixagem e masterização · 2026 · kiddo' },
        { title: 'simpatia', meta: 'mixagem e masterização · 2026 · kiddo' },
        { title: 'Calor', meta: 'mixagem e masterização · 2024 · Godar' },
        { title: 'Qual a Lei', meta: 'mixagem e masterização · 2024 · Bruno Kroz' }
      ]
    },
    mixing: {
      title: 'mixagem',
      items: [
        { title: 'ON', meta: '2026 · Cassiel' },
        { title: 'VELUDO', meta: '2026 · Meio Feel' },
        { title: 'Toda Noite Busco o Sol', meta: '2025 · Godar' },
        { title: 'Insônia Kurt', meta: '2024 · Bruno Kroz' },
        { title: 'Trilha Sonora', meta: '2022 · Godar' }
      ]
    },
    mastering: {
      title: 'masterização',
      items: [
        { title: 'intrínseca city', meta: '2026 · kiddo' },
        { title: 'simpatia', meta: '2026 · kiddo' },
        { title: 'VELUDO', meta: '2026 · Meio Feel' },
        { title: 'Renc Renc', meta: '2023 · kiddo' },
        { title: 'Ameaça Detectada', meta: '2021 · Bruno Kroz' }
      ]
    },
    dj: {
      title: 'dj',
      items: [
        { title: 'Rinse FM', meta: 'rádio · londres' },
        { title: 'NTS', meta: 'rádio · londres' },
        { title: 'Dekmantel', meta: 'plataforma · amsterdã' },
        { title: 'HÖR', meta: 'rádio · berlim' },
        { title: 'Function!', meta: 'rádio · nova york' },
        { title: 'Foundation FM', meta: 'rádio · londres' },
        { title: 'Aaja Music', meta: 'plataforma' }
      ]
    },
    dev: {
      title: 'desenvolvimento',
      items: [
        { title: 'opcoda', meta: 'VST3, C++ · sintetizador granular', img: W + 'img_github_opcoda.webp', link: 'https://github.com/9matesu/Opcoda' },
        { title: 'minisynth32', meta: 'ESP32-S3, TypeScript', img: W + 'img_github_minisynth32.webp', link: 'https://github.com/9matesu/minisynth32' },
        { title: 'catlas', meta: 'Python, documentação', img: W + 'img_github_catlas.webp', link: 'https://github.com/9matesu/Catlas' },
        { title: 'wptools', meta: 'PowerShell, Windows', img: W + 'img_github_wptools.webp', link: 'https://github.com/9matesu/WPtools' },
        { title: 'resuMe', meta: 'extensão, TypeScript', img: W + 'img_github_resuMe.webp', link: 'https://github.com/9matesu/resume' }
      ]
    },
    about: {
      title: 'matesuposting',
      items: [
        { title: 'matesuposting', meta: 'caderno de ideias · são paulo', link: '' }
      ]
    },
    contact: {
      title: 'contato',
      items: [
        { title: 'contact@matesu.me', meta: 'email' }
      ]
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

  function render(key) {
    var data = INFO[key];
    var ul = document.createElement('ul');
    ul.className = 'work-list';
    (data.items || []).forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'work-item';
      if (it.img) {
        var im = document.createElement('img');
        im.className = 'work-img';
        im.src = it.img;
        im.alt = '';
        li.appendChild(im);
      }
      var body = document.createElement('div');
      body.className = 'work-text';
      var meta = document.createElement('span');
      meta.className = 'work-meta';
      meta.textContent = it.meta;
      var title = document.createElement('span');
      title.className = 'work-title';
      if (it.link) {
        var a = document.createElement('a');
        a.href = it.link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = it.title;
        title.appendChild(a);
      } else {
        title.textContent = it.title;
      }
      body.appendChild(meta);
      body.appendChild(title);
      li.appendChild(body);
      ul.appendChild(li);
    });
    return ul;
  }

  function openPopup(key) {
    var data = INFO[key];
    if (!data || !popup || !popupBody) return;
    popupBody.innerHTML = '';
    var h = document.createElement('h2');
    h.className = 'popup-title';
    h.textContent = data.title;
    popupBody.appendChild(h);
    popupBody.appendChild(render(key));
    popup.dataset.key = key;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    var frame = document.querySelector('.frame');
    if (frame) frame.classList.add('popup-open');
  }

  function closePopup() {
    if (!popup) return;
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    delete popup.dataset.key;
    var frame = document.querySelector('.frame');
    if (frame) frame.classList.remove('popup-open');
    if (nameBox) nameBox.classList.remove('is-expanded');
  }

  [].slice.call(document.querySelectorAll('[data-popup]')).forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var key = el.getAttribute('data-popup');
      var isOpen = popup && popup.classList.contains('is-open') && popup.dataset.key === key;
      if (isOpen) { closePopup(); return; }
      if (key === 'matesu' && nameBox) nameBox.classList.toggle('is-expanded');
      else openPopup(key);
    });
  });

  if (popupClose) popupClose.addEventListener('click', closePopup);
  document.addEventListener('click', function (e) {
    if (!popup || !popup.classList.contains('is-open')) return;
    var t = e.target;
    if (t.closest && (t.closest('.popup') || t.closest('[data-popup]'))) return;
    closePopup();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePopup();
  });

  if (tabs.length) {
    tabs[0].textContent = 'matesuposting';
  }
})();
