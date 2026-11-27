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
        { title: 'festa da firma', meta: '05/12/2026', img: W + 'ig_DgI5Ea_oPcd.webp', link: 'https://instagram.com/p/DgI5Ea_oPcd/' },
        { title: '10 de outubro', meta: '10/10/2026', img: W + 'ig_Dd7TPm6m1Cm.webp', link: 'https://instagram.com/p/Dd7TPm6m1Cm/' },
        { title: 'organizar e ocupar', meta: '08/10/2026', img: W + 'ig_DeQM8rikfPl.webp', link: 'https://instagram.com/p/DeQM8rikfPl/' },
        { title: 'concreticidade BM006', meta: '31/08/2026', img: W + 'ig_DctdvyuolnS.webp', link: 'https://instagram.com/p/DctdvyuolnS/' },
        { title: 'concreticidade V.A.', meta: '27/08/2026', img: W + 'ig_DcjMOgfkeyS.webp', link: 'https://instagram.com/p/DcjMOgfkeyS/' },
        { title: 'material V.A. Concreticidade', meta: '27/08/2026', img: W + 'ig_DcPIMLuIGC7.webp', link: 'https://instagram.com/p/DcPIMLuIGC7/' },
        { title: 'gvlpvomesa 07.08', meta: '07/08/2026', img: W + 'ig_Db4CVuZkXt7.webp', link: 'https://instagram.com/p/Db4CVuZkXt7/' },
        { title: 'GVLPVOMESA Alt', meta: '07/08/2026', img: W + 'ig_Dbod1kuieBg.webp', link: 'https://instagram.com/p/Dbod1kuieBg/' },
        { title: 'GVLPVOMESA Card', meta: '07/08/2026', img: W + 'ig_DbWdqgpkVVJ.webp', link: 'https://instagram.com/p/DbWdqgpkVVJ/' },
        { title: "TRACKMESA", meta: "flyer 10/07/2026", img: W + 'bm_aniversario-od1n-10-07.webp' },

        { title: "VILELA BADAY", meta: "flyer 05/06/2026", img: W + 'bm_vilela-baday-05-06.webp' },
        { title: "KEROSENE X BLACKMESA", meta: "flyer 09/05/2026", img: W + 'bm_blackmesa-09-09.webp' },

        { title: "BLACKMESA LABS", meta: "flyer 07/03/2026", img: W + 'bm_labs-07-03.webp' },
        { title: "BLACKMESA: O ÚLTIMO DO ANO", meta: "flyer 20/12/2025", img: W + 'bm_ultimo-do-ano-20-12.webp' },
        { title: "BLACKMESA VAULT 2", meta: "flyer 01/11/2025", img: W + 'bm_vault-2-20-09.webp' },
        { title: "BLACKMESA LABS 303", meta: "flyer 27/09/2025", img: W + 'bm_labs-27-09.webp' },
        { title: "BLACKMESA VAULT", meta: "flyer 12/09/2025", img: W + 'bm_vault-17-07.webp' },
        { title: "BLACKMESA LABS III", meta: "flyer 19/07/2025", img: W + 'bm_bases-ii-19-07.webp' },
        { title: 'Iran Tee', meta: 'Bulgarian Stock Exchange 30/06/2025', imgs: [W + 'img_bse_frente.webp', W + 'img_bse_costas.webp'], link: 'https://plazaaaaa.com/product/2340' },
        { title: "TACITURNO MEETS BLACKMESA", meta: "flyer 18/05/2025", img: W + 'bm_taciturno-18-05.webp' },
        { title: "BLACKMESA LABS II", meta: "flyer 03/05/2025", img: W + 'bm_labs-03-05.webp' },
        { title: "BLACKMESA LABS I", meta: "flyer 29/03/2025", img: W + 'bm_labs-29-03.webp' },
        { title: "A ÚLTIMA DO ANO", meta: "flyer 14/12/2024", img: W + 'bm_ultima-do-ano-14-12.webp' },
        { title: "PRAFRENTEX", meta: "flyer 07/12/2024", img: W + 'bm_prafrontenx-07-12.webp' },
        { title: "HALLOWGRIME", meta: "flyer 26/10/2024", img: W + 'bm_hallowgrime-26-10.webp' },
        { title: "BLACKMESA CRIA", meta: "flyer 28/09/2024", img: W + 'bm_cria-28-09.webp' },
        { title: "V. MADALENA", meta: "flyer 20/09/2024", img: W + 'bm_v-madalena-20-09.webp' },
        { title: "BLACKMESA TAKEOVER", meta: "flyer 07/09/2024", img: W + 'bm_takeover-07-09.webp' },
      ]
    },
    music: {
      title: 'produção musical',
      items: [
        { title: "Antologia", meta: "2026 lançamento" },
        { title: "refix.pak", meta: "2026 lançamento", img: W + 'au_refix-pak.webp' },
        { title: "SP-150", meta: "2026 lançamento", img: W + 'au_sp-150.webp' },
        { title: "carnagarage", meta: "2025 lançamento", img: W + 'au_carnagarage.webp' },
        { title: "mixed seeds archival ('19-'23)", meta: "2023 lançamento", img: W + 'au_mixed-seeds.webp' },
        { title: "Qa", meta: "2023 lançamento", img: W + 'au_qa.webp' },
        { title: "K-Drill Repack", meta: "2022 lançamento" },
        { title: "Rarer Demons", meta: "2022 lançamento", img: W + 'au_rarer-demons.webp' },
        { title: "Altered State", meta: "2021 lançamento" },
        { title: "Half Life", meta: "2021 lançamento" },
        { title: "International Flux", meta: "2021 lançamento" },
        { title: "No Format", meta: "2021 lançamento" },
        { title: "Overtones", meta: "2021 lançamento" },
        { title: "virtualsoundscape.net", meta: "2021 lançamento" },
        { title: "Almost Dusk", meta: "2020 lançamento" },
        { title: "Boladona Flip", meta: "2020 lançamento" },
        { title: "Digital Disk", meta: "2020 lançamento" },
        { title: "Ekranoplan", meta: "2020 lançamento" },
        { title: "Leftover Selected Works I", meta: "2020 lançamento" },
        { title: "Panelada", meta: "2020 lançamento" },
        { title: "Rare Demons Minitapes Deluxe", meta: "2020 lançamento" },
        { title: "Resolutions", meta: "2020 lançamento" },
        { title: "Set of Tools Vol.1", meta: "2020 lançamento" },
        { title: "Tenacity", meta: "2020 lançamento" },
        { title: "Worldwide Stream", meta: "2020 lançamento" },
        { title: "Cachorrada (Jersey Club Edit)", meta: "2019 lançamento" },
        { title: "Unreleased", meta: "lançamento" },
        { title: "ON", meta: "2026 produção", img: W + 'rel_on.webp' },
        { title: "xrc no 130", meta: "2026 produção", img: W + 'rel_xrc-no-130.webp' },
        { title: "VOLT-AMPÈRE", meta: "2025 produção", img: W + 'rel_volt-ampere.webp' },
        { title: "monocromia", meta: "2025 produção", img: W + 'rel_monocromia.webp' },
        { title: "Toda Noite Busco o Sol", meta: "2025 produção", img: W + 'rel_toda-noite-busco-o-sol.webp' },
        { title: "Calor", meta: "2024 produção", img: W + 'rel_calor.webp' },
        { title: "VOLT MIX: O Retorno", meta: "2024 produção", img: W + 'rel_volt-mix-o-retorno.webp' },
        { title: "Insônia Kurt", meta: "2024 coprodução", img: W + 'rel_insonia-kurt.webp' },
        { title: "Trilha Sonora", meta: "2022 produção", img: W + 'rel_trilha-sonora.webp' },
        { title: "FAT KEP", meta: "2022 produção", img: W + 'rel_fat-kep.webp' },
        { title: "Begonia", meta: "2022 produção remix", img: W + 'rel_begonia.webp' },
        { title: "Ameaça Detectada", meta: "2021 coprodução", img: W + 'rel_ameaca-detectada.webp' },
        { title: "Intraterreno", meta: "2020 produção remix", img: W + 'rel_intraterreno.webp' },
      ]
    },
    culture: {
      title: 'produção cultural',
      intro: 'produção de eventos pelo @blackmesaent, são paulo. co-fundador do selo @bloodwormtrax. dj na @festa.salada, cruzeiro.',
      links: [
        { label: '@blackmesaent', url: 'https://instagram.com/blackmesaent' },
        { label: '@bloodwormtrax', url: 'https://instagram.com/bloodwormtrax' }
      ]
    },
    engineer: {
      title: 'engenharia de mixagem e masterização',
      items: [
        { title: "intrínseca city", meta: "2026 mixagem masterização", img: W + 'rel_intrinseca-city.webp' },
        { title: "ON", meta: "2026 mixagem masterização", img: W + 'rel_on.webp' },
        { title: "VELUDO", meta: "2026 mixagem masterização", img: W + 'rel_veludo.webp' },
        { title: "xrc no 130", meta: "2026 mixagem masterização", img: W + 'rel_xrc-no-130.webp' },
        { title: "então pede! (mãe de pet)", meta: "2025 mixagem masterização", img: W + 'rel_entao-pede-mae-de-pet.webp' },
        { title: "VOLT-AMPÈRE", meta: "2025 mixagem", img: W + 'rel_volt-ampere.webp' },
        { title: "Toda Noite Busco o Sol", meta: "2025 mixagem masterização", img: W + 'rel_toda-noite-busco-o-sol.webp' },
        { title: "Contratempo", meta: "2025 mixagem masterização", img: W + 'rel_contratempo.webp' },
        { title: "MODO MOLA", meta: "2024 masterização", img: W + 'rel_modo-mola.webp' },
        { title: "Calor", meta: "2024 mixagem masterização", img: W + 'rel_calor.webp' },
        { title: "Insônia Kurt", meta: "2024 mixagem masterização", img: W + 'rel_insonia-kurt.webp' },
        { title: "Qual a Lei", meta: "2024 mixagem masterização", img: W + 'rel_qual-a-lei.webp' },
        { title: "Intro 2024", meta: "2024 mixagem masterização", img: W + 'rel_intro-2024.webp' },
        { title: "Rtmz #001", meta: "2023 mixagem masterização", img: W + 'rel_rtmz-001.webp' },
        { title: "Renc Renc", meta: "2023 mixagem masterização", img: W + 'rel_renc-renc.webp' },
        { title: "Baby I'm Bleeding", meta: "2022 mixagem masterização", img: W + 'rel_baby-i-m-bleeding.webp' },
        { title: "Evangeline Blue", meta: "2022 mixagem masterização", img: W + 'rel_evangeline-blue.webp' },
        { title: "Vida Bagunçada", meta: "2022 mixagem masterização", img: W + 'rel_vida-baguncada.webp' },
      ]
    },
    dj: {
      title: 'dj',
      items: []
    },
    dev: {
      title: 'desenvolvimento',
      items: [
        { title: 'opcoda', meta: 'VST3, C++ sintetizador granular', img: W + 'dev_opcoda.webp', link: 'https://github.com/9matesu/Opcoda' },
        { title: 'minisynth32', meta: 'ESP32-S3, TypeScript', img: W + 'img_github_minisynth32.webp', link: 'https://github.com/9matesu/minisynth32' },
        { title: 'catlas', meta: 'Python, documentação', img: W + 'img_github_catlas.webp', link: 'https://github.com/9matesu/Catlas' },
        { title: 'wptools', meta: 'PowerShell, Windows', img: W + 'img_github_wptools.webp', link: 'https://github.com/9matesu/WPtools' },
        { title: 'resuMe', meta: 'extensão, TypeScript', img: W + 'img_github_resuMe.webp', link: 'https://github.com/9matesu/resume' }
      ]
    },
    about: {
      title: 'matesuposting',
      items: [
        { title: 'matesuposting', meta: 'caderno de ideias são paulo', link: '' }
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
      var images = it.imgs || (it.img ? [it.img] : []);
      if (images.length) {
        var gallery = document.createElement('span');
        gallery.className = 'work-imgs';
        images.forEach(function (src) {
          var im = document.createElement('img');
          im.className = 'work-img';
          im.src = src;
          im.alt = '';
          gallery.appendChild(im);
        });
        li.appendChild(gallery);
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
    if (data.intro) {
      var introEl = document.createElement('p');
      introEl.className = 'popup-intro';
      if (data.links) {
        var parts = data.intro.split(/(\@[a-z0-9._]+)/gi);
        parts.forEach(function (part) {
          var link = (data.links || []).find(function (l) { return l.label === part; });
          if (link) {
            var a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = part;
            introEl.appendChild(a);
          } else {
            introEl.appendChild(document.createTextNode(part));
          }
        });
      } else {
        introEl.textContent = data.intro;
      }
      popupBody.appendChild(introEl);
    }
    if (data.photos) {
      var strip = document.createElement('div');
      strip.className = 'photo-strip';
      data.photos.forEach(function (src) {
        var im = document.createElement('img');
        im.src = src;
        im.alt = '';
        im.loading = 'lazy';
        strip.appendChild(im);
      });
      popupBody.appendChild(strip);
    } else if (data.items) {
      popupBody.appendChild(render(key));
    }
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

  /* arraste livre do nome, das abas, dos blocos de texto e do popup. */
  var DRAG_KEY = 'matesu-drag-v1';
  var DRAG_SEL = '.name, .tab, .statement, .popup';
  var positions = {};
  try { positions = JSON.parse(localStorage.getItem(DRAG_KEY) || '{}') || {}; } catch (e) { positions = {}; }

  function dragId(el) {
    if (el.classList.contains('name')) return 'name';
    if (el.classList.contains('popup')) return 'popup';
    if (el.classList.contains('tab')) return 'tab-' + (el.getAttribute('data-view') || 'about');
    return 'statement-' + (el.getAttribute('data-view') || 'about');
  }
  function pin(el, left, top) {
    el.classList.add('is-dragged');
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }
  [].slice.call(document.querySelectorAll(DRAG_SEL)).forEach(function (el) {
    var p = positions[dragId(el)];
    if (p) pin(el, p.left, p.top);
  });

  var moving = null;
  document.addEventListener('pointerdown', function (e) {
    if (!e.target || !e.target.closest) return;
    if (e.target.closest('a, .popup-close')) return;
    var el = e.target.closest(DRAG_SEL);
    if (!el) return;
    if (el.classList.contains('popup') && !el.classList.contains('is-open')) return;
    var r = el.getBoundingClientRect();
    if (!el.classList.contains('is-dragged')) pin(el, r.left, r.top);
    moving = { el: el, sx: e.clientX, sy: e.clientY, x: r.left, y: r.top, moved: false };
    e.preventDefault();
  });
  document.addEventListener('pointermove', function (e) {
    if (!moving) return;
    var dx = e.clientX - moving.sx;
    var dy = e.clientY - moving.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moving.moved = true;
    if (!moving.moved) return;
    moving.el.style.left = (moving.x + dx) + 'px';
    moving.el.style.top = (moving.y + dy) + 'px';
  });
  function finishDrag() {
    if (!moving) return;
    var m = moving;
    moving = null;
    if (!m.moved) return;
    positions[dragId(m.el)] = { left: parseFloat(m.el.style.left), top: parseFloat(m.el.style.top) };
    try { localStorage.setItem(DRAG_KEY, JSON.stringify(positions)); } catch (e) {}
    m.el.addEventListener('click', function block(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      m.el.removeEventListener('click', block, true);
    }, true);
  }
  document.addEventListener('pointerup', finishDrag);
  document.addEventListener('pointercancel', finishDrag);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'R' || !e.shiftKey) return;
    positions = {};
    try { localStorage.removeItem(DRAG_KEY); } catch (err) {}
    [].slice.call(document.querySelectorAll(DRAG_SEL)).forEach(function (el) {
      el.classList.remove('is-dragged');
      el.style.left = '';
      el.style.top = '';
    });
  });

  /* malha e hachuras procedurais, sorteadas a cada carregamento. */
  (function () {
    var grid = document.querySelector('.grid');
    var layer = document.querySelector('.layer');
    if (!grid || !layer) return;
    var cols = 9 + Math.floor(Math.random() * 4);
    var rows = 6 + Math.floor(Math.random() * 4);
    [].slice.call(grid.querySelectorAll('.cell')).forEach(function (c) {
      c.parentNode.removeChild(c);
    });
    function weights(n) {
      var out = [];
      for (var i = 0; i < n; i++) out.push(0.7 + Math.random() * 0.9);
      return out;
    }
    function cssWeights(a) {
      return a.map(function (v) { return v.toFixed(2) + 'fr'; }).join(' ');
    }
    var root = document.documentElement;
    var cw = weights(cols);
    var rh = weights(rows);
    root.style.setProperty('--cols', cssWeights(cw));
    root.style.setProperty('--rows', cssWeights(rh));
    var frameEl = document.querySelector('.frame');
    var fw = frameEl ? frameEl.clientWidth : 1440;
    var fh = frameEl ? frameEl.clientHeight : 900;
    var totalW = cw.reduce(function (a, b) { return a + b; }, 0);
    var totalH = rh.reduce(function (a, b) { return a + b; }, 0);
    function ratioOf(r, c, h, w) {
      var sw = 0;
      var sh = 0;
      for (var i = c; i < c + w; i++) sw += cw[i] || 0;
      for (var j = r; j < r + h; j++) sh += rh[j] || 0;
      return (sw / totalW * fw) / (sh / totalH * fh);
    }
    function ratioArea(r, c, h, w) {
      var a = area(r, c, r + h, c + w).split(' / ').map(Number);
      return ratioOf(a[0] - 1, a[1] - 1, a[2] - a[0], a[3] - a[1]);
    }
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell' + (c === cols - 1 ? ' edge-r' : '') + (r === rows - 1 ? ' edge-b' : '');
        grid.appendChild(cell);
      }
    }
    function scale(v, base, total) {
      return Math.max(1, Math.min(total + 1, Math.round((v - 1) / base * total) + 1));
    }
    function area(r1, c1, r2, c2) {
      var a = [scale(r1, 8, rows), scale(c1, 12, cols), scale(r2, 8, rows), scale(c2, 12, cols)];
      if (a[2] <= a[0]) a[2] = Math.min(rows + 1, a[0] + 1);
      if (a[3] <= a[1]) a[3] = Math.min(cols + 1, a[1] + 1);
      return a.join(' / ');
    }
    [
      ['.name', [1, 1, 3, 5]],
      ['.tab-about', [1, 11, 2, 13]],
      ['.tab-contact', [7, 11, 9, 13]],
      ['.statement', [4, 4, 6, 11]],
      ['.popup', [2, 3, 8, 11]]
    ].forEach(function (pair) {
      [].slice.call(document.querySelectorAll(pair[0])).forEach(function (el) {
        el.style.gridArea = area.apply(null, pair[1]);
      });
    });
    [].slice.call(layer.querySelectorAll('.hatch')).forEach(function (h) {
      h.parentNode.removeChild(h);
    });
    var count = 5 + Math.floor(Math.random() * 4);
    var used = [];
    function freeBox(r1, c1, r2, c2) {
      return !used.some(function (b) {
        return !(r2 <= b[0] || r1 >= b[2] || c2 <= b[1] || c1 >= b[3]);
      });
    }
    for (var k = 0; k < count; k++) {
      var hr, hc, hh, hw, tries = 0;
      do {
        hr = Math.floor(Math.random() * Math.max(1, rows - 2));
        hc = Math.floor(Math.random() * Math.max(1, cols - 2));
        hh = 2 + Math.floor(Math.random() * Math.min(2, rows - hr + 1));
        hw = 2 + Math.floor(Math.random() * Math.min(2, cols - hc + 1));
        tries++;
      } while ((!freeBox(hr, hc, hr + hh, hc + hw) || ratioArea(hr, hc, hh, hw) < 0.62 || ratioArea(hr, hc, hh, hw) > 1.65) && tries < 60);
      if (!freeBox(hr, hc, hr + hh, hc + hw)) continue;
      if (ratioArea(hr, hc, hh, hw) < 0.62 || ratioArea(hr, hc, hh, hw) > 1.65) continue;
      used.push([hr, hc, hr + hh, hc + hw]);
      var h = document.createElement('div');
      h.className = 'hatch';
      h.setAttribute('aria-hidden', 'true');
      h.dataset.angle = [-60, -45, -30, 30, 45, 60][Math.floor(Math.random() * 6)];
      h.dataset.gap = '14';
      h.style.gridArea = area(hr, hc, hr + hh, hc + hw);
      layer.insertBefore(h, layer.firstChild);
    }
  })();

  /* hachura como cordas: SVG inline com Verlet, empurradas pelo ponteiro. */
  var hatches = [].slice.call(document.querySelectorAll('.hatch'));
  if (hatches.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var NS = 'http://www.w3.org/2000/svg';
    var GAP = 14;
    var N = 9;
    var DAMP = 0.78;
    var SPRING = 0.12;
    var CONTACT = 9;
    var PLUCK = 0.55;
    var MAX_PLUCK = 4;
    var ropes = [];
    var pointer = { x: 0, y: 0, vx: 0, vy: 0, on: false };
    var frameId = 0;
    var still = 0;
    var resizeTimer = null;

    function clip(px, py, dx, dy, w, h) {
      var t0 = 0;
      var t1 = Infinity;
      function cut(p, q) {
        if (p === 0) return q >= 0;
        var r = q / p;
        if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
        else { if (r < t0) return false; if (r < t1) t1 = r; }
        return true;
      }
      if (!cut(-dx, px) || !cut(dx, w - px) || !cut(-dy, py) || !cut(dy, h - py)) return null;
      if (t1 - t0 < 12) return null;
      return { x0: px + dx * t0, y0: py + dy * t0, x1: px + dx * t1, y1: py + dy * t1 };
    }

    function buildRopes() {
      if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
      ropes.forEach(function (r) { r.svg.parentNode.removeChild(r.svg); });
      ropes = [];
      hatches.forEach(function (el) {
        var w = Math.round(el.clientWidth);
        var h = Math.round(el.clientHeight);
        if (w < 12 || h < 12) return;
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');
        var gap = parseFloat(el.dataset.gap) || GAP;
        var step = gap * Math.SQRT2;
        var families = [
          { dx: Math.SQRT1_2, dy: Math.SQRT1_2, from: -w, to: h, vertical: true },
          { dx: Math.SQRT1_2, dy: -Math.SQRT1_2, from: 0, to: w + h, vertical: false }
        ];
        var strings = [];
        families.forEach(function (f) {
          for (var c = f.from; c <= f.to; c += step) {
            var line = clip(0, c, f.dx, f.dy, w, h);
            if (!line) continue;
            var pts = [];
            var rest = 0;
            for (var i = 0; i < N; i++) {
              var t = i / (N - 1);
              var x = line.x0 + (line.x1 - line.x0) * t;
              var y = line.y0 + (line.y1 - line.y0) * t;
              if (i) rest = Math.sqrt((x - pts[i - 1].x) * (x - pts[i - 1].x) + (y - pts[i - 1].y) * (y - pts[i - 1].y));
              pts.push({ x: x, y: y, px: x, py: y, rx: x, ry: y, pin: i === 0 || i === N - 1 });
            }
            var path = document.createElementNS(NS, 'path');
            svg.appendChild(path);
            strings.push({ path: path, pts: pts, rest: rest });
          }
        });
        el.appendChild(svg);
        el.classList.add('has-strings');
        ropes.push({ box: svg.getBoundingClientRect(), w: w, h: h, strings: strings, svg: svg });
      });
      draw();
    }

    function draw() {
      var maxMove = 0;
      ropes.forEach(function (r) {
        var mx = pointer.x - r.box.left;
        var my = pointer.y - r.box.top;
        r.strings.forEach(function (s) {
          var pts = s.pts;
          var i;
          for (i = 1; i < N - 1; i++) {
            var p = pts[i];
            var vx = (p.x - p.px) * DAMP;
            var vy = (p.y - p.py) * DAMP;
            p.px = p.x;
            p.py = p.y;
            p.x += vx + (p.rx - p.x) * SPRING;
            p.y += vy + (p.ry - p.y) * SPRING;
          }
          if (pointer.on && Math.abs(pointer.vx) + Math.abs(pointer.vy) > 0.4) {
            for (i = 1; i < N; i++) {
              var c0 = pts[i - 1];
              var c1 = pts[i];
              var sx = c1.x - c0.x;
              var sy = c1.y - c0.y;
              var len2 = sx * sx + sy * sy;
              if (len2 < 1) continue;
              var t = ((mx - c0.x) * sx + (my - c0.y) * sy) / len2;
              if (t < 0 || t > 1) continue;
              var dx = mx - (c0.x + sx * t);
              var dy = my - (c0.y + sy * t);
              if (dx * dx + dy * dy > CONTACT * CONTACT) continue;
              var len = Math.sqrt(len2);
              var nx = -sy / len;
              var ny = sx / len;
              var force = (pointer.vx * nx + pointer.vy * ny) * PLUCK;
              if (force > MAX_PLUCK) force = MAX_PLUCK;
              if (force < -MAX_PLUCK) force = -MAX_PLUCK;
              if (!c0.pin) { c0.x += nx * force * (1 - t); c0.y += ny * force * (1 - t); }
              if (!c1.pin) { c1.x += nx * force * t; c1.y += ny * force * t; }
            }
          }
          for (var k = 0; k < 2; k++) {
            for (i = 1; i < N; i++) {
              var a = pts[i - 1];
              var b = pts[i];
              var dx = b.x - a.x;
              var dy = b.y - a.y;
              var dist = Math.sqrt(dx * dx + dy * dy) || 1;
              var diff = (dist - s.rest) / dist;
              if (a.pin && !b.pin) { b.x -= dx * diff; b.y -= dy * diff; }
              else if (!a.pin && b.pin) { a.x += dx * diff; a.y += dy * diff; }
              else if (!a.pin && !b.pin) {
                a.x += dx * diff * 0.5; a.y += dy * diff * 0.5;
                b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5;
              }
            }
          }
          for (i = 1; i < N - 1; i++) {
            var q = pts[i];
            if (q.x < 0) q.x = 0; else if (q.x > r.w) q.x = r.w;
            if (q.y < 0) q.y = 0; else if (q.y > r.h) q.y = r.h;
          }
          var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
          for (i = 1; i < N; i++) {
            d += 'L' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1);
            var away = Math.abs(pts[i].x - pts[i].rx) + Math.abs(pts[i].y - pts[i].ry);
            if (away > maxMove) maxMove = away;
          }
          s.path.setAttribute('d', d);
        });
      });
      var active = Math.abs(pointer.vx) + Math.abs(pointer.vy) > 0.4;
      still = (!active && maxMove < 0.2) ? still + 1 : 0;
      pointer.vx *= 0.55;
      pointer.vy *= 0.55;
      if (still > 30) { frameId = 0; return; }
      frameId = requestAnimationFrame(draw);
    }

    function wake() {
      still = 0;
      if (!frameId) frameId = requestAnimationFrame(draw);
    }
    document.addEventListener('pointermove', function (e) {
      pointer.vx = Math.max(-20, Math.min(20, e.clientX - pointer.x));
      pointer.vy = Math.max(-20, Math.min(20, e.clientY - pointer.y));
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = true;
      wake();
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.vx = 0;
      pointer.vy = 0;
      pointer.on = true;
      wake();
    }, { passive: true });
    document.addEventListener('pointerup', function (e) {
      if (e.pointerType !== 'mouse') pointer.on = false;
      wake();
    }, { passive: true });
    document.addEventListener('pointercancel', function () { pointer.on = false; wake(); });
    window.addEventListener('blur', function () { pointer.on = false; wake(); });
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildRopes, 160);
    });

    buildRopes();
  }

  /* caixas pequenas e arrastáveis. O tema escuro so muda ao arrastar uma caixa. */
  (function () {
    var palette = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];
    var themes = [
      { bg: '#FFFFFF', ink: '#FF595E', accent: '#FF595E' },
      { bg: '#2A2A2A', ink: '#FFCA3A', accent: '#FFCA3A' },
      { bg: '#2A2A2A', ink: '#8AC926', accent: '#8AC926' },
      { bg: '#FFFFFF', ink: '#1982C4', accent: '#1982C4' },
      { bg: '#FFFFFF', ink: '#6A4C93', accent: '#6A4C93' }
    ];
    var root = document.documentElement;
    var shapes = [];
    var currentAccent = null;
    function colorize() {
      shapes.forEach(function (s) {
        s.setAttribute('fill', currentAccent || palette[+s.getAttribute('data-palette-index')]);
      });
    }

    function soft(hex, a) {
      var v = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
    }
    function applyTheme(t) {
      root.style.setProperty('--bg', t.bg);
      root.style.setProperty('--ink', t.ink);
      root.style.setProperty('--rule', t.ink);
      root.style.setProperty('--muted', t.ink);
      root.style.setProperty('--rule-soft', soft(t.ink, 0.16));
      root.style.setProperty('--hatch', 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 14 14\'%3E%3Cpath d=\'M0 0L14 14M14 0L0 14\' stroke=\'%23' + t.ink.slice(1) + '\' stroke-width=\'1\' fill=\'none\'/%3E%3C/svg%3E")');
      currentAccent = t.accent;
      colorize();
    }
    function randomTheme() {
      applyTheme(themes[Math.floor(Math.random() * themes.length)]);
    }

    var frame = document.querySelector('.frame');
    if (!frame) return;
    var box = frame.getBoundingClientRect();
    var w = Math.max(1, Math.round(box.width));
    var h = Math.max(1, Math.round(box.height));
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'gen-squares');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var count = 6 + Math.floor(Math.random() * 7);
    for (var i = 0; i < count; i++) {
      var span = 16 + Math.random() * 44;
      var rx = span / 2;
      var ry = rx;
      var shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      shape.setAttribute('cx', (rx + Math.random() * Math.max(1, w - span)).toFixed(1));
      shape.setAttribute('cy', (ry + Math.random() * Math.max(1, h - ry * 2)).toFixed(1));
      shape.setAttribute('rx', rx.toFixed(1));
      shape.setAttribute('ry', ry.toFixed(1));
      shape.setAttribute('data-palette-index', i % palette.length);
      shape.setAttribute('fill', palette[i % palette.length]);
      svg.appendChild(shape);
      shapes.push(shape);
    }
    frame.appendChild(svg);

    var drag = null;
    [].slice.call(svg.querySelectorAll('ellipse')).forEach(function (shape) {
      shape.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        randomTheme();
        drag = {
          shape: shape,
          sx: e.clientX,
          sy: e.clientY,
          x: parseFloat(shape.getAttribute('cx')),
          y: parseFloat(shape.getAttribute('cy'))
        };
      });
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return;
      drag.shape.setAttribute('cx', (drag.x + e.clientX - drag.sx).toFixed(1));
      drag.shape.setAttribute('cy', (drag.y + e.clientY - drag.sy).toFixed(1));
    });
    document.addEventListener('pointerup', function () { drag = null; });
    document.addEventListener('pointercancel', function () { drag = null; });
  })();
})();
