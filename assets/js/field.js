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
        { title: 'material TRACKMESA', meta: '27/08/2026', img: W + 'ig_DcPIMLuIGC7.webp', link: 'https://instagram.com/p/DcPIMLuIGC7/' },
        { title: 'gvlpvomesa 07.08', meta: '07/08/2026', img: W + 'ig_Db4CVuZkXt7.webp', link: 'https://instagram.com/p/Db4CVuZkXt7/' },
        { title: 'GVLPVOMESA Alt', meta: '07/08/2026', img: W + 'ig_Dbod1kuieBg.webp', link: 'https://instagram.com/p/Dbod1kuieBg/' },
        { title: 'GVLPVOMESA Card', meta: '07/08/2026', img: W + 'ig_DbWdqgpkVVJ.webp', link: 'https://instagram.com/p/DbWdqgpkVVJ/' },
        { title: "ANIVERSÁRIO DO OD1N", meta: "flyer 10/07/2026", img: W + 'bm_aniversario-od1n-10-07.webp' },

        { title: "VILELA BADAY", meta: "flyer 05/06/2026", img: W + 'bm_vilela-baday-05-06.webp' },
        { title: "KEROSENE X BLACKMESA", meta: "flyer 09/05/2026", img: W + 'bm_blackmesa-09-09.webp' },

        { title: "BLACKMESA LABS", meta: "flyer 07/03/2026", img: W + 'bm_labs-07-03.webp' },
        { title: "BLACKMESA: O ÚLTIMO DO ANO", meta: "flyer 20/12/2025", img: W + 'bm_ultimo-do-ano-20-12.webp' },
        { title: "BLACKMESA VAULT 2", meta: "flyer 01/11/2025", img: W + 'bm_vault-2-20-09.webp' },
        { title: "BLACKMESA LABS", meta: "flyer 27/09/2025", img: W + 'bm_labs-27-09.webp' },
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
})();
