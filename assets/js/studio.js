/* matesu — estúdio. Navegador de trabalhos, sem dependências. */
(function () {
  'use strict';

  var TREE = [
    { title: 'BSE Tee, frente', meta: 'restock iran, 2025', img: 'img/bse/frente.png', link: 'https://plazaaaaa.com/product/2340', category: 'design', year: 2025 },
    { title: 'BSE Tee, costas', meta: 'restock iran, 2025', img: 'img/bse/costas.png', link: 'https://plazaaaaa.com/product/2340', category: 'design', year: 2025 },
    { title: 'BLACKMESA 2025', meta: 'identidade visual, 2025', img: 'img/logos/blackmesa.png', link: 'https://www.behance.net/gallery/226862609/BLACKMESA-2025', category: 'design', year: 2025, featured: true },
    { title: 'BLACKMESA 2024', meta: 'identidade visual, 2024', img: 'img/logos/blackmesa.png', link: 'https://www.behance.net/gallery/226860687/BLACKMESA-2024', category: 'design', year: 2024 },
    { title: 'LAGERHAUS I', meta: 'identidade visual, 2024', img: 'img/logos/bloodworm.png', link: 'https://www.behance.net/gallery/226864143/bloodworm-trax-LAGERHAUS-I', category: 'design', year: 2024 },
    { title: 'TRACKMESA', meta: 'flyer, 4 variações', img: 'img/trackmesa/1.png', images: ['img/trackmesa/1.png', 'img/trackmesa/2.png', 'img/trackmesa/3.png', 'img/trackmesa/4.png'], link: 'https://zig.tickets/eventos/trackmesa', category: 'design', year: 2026, featured: true },
    { title: 'Vault 2', meta: 'flyer, 17/12/2025', img: 'img/misc/vault2_FINAL_3.png', images: ['img/misc/vault2_FINAL_3.png'], link: '', category: 'design', year: 2025 },
    { title: 'Simpatia', meta: 'capa, 20/05/2025', img: 'img/simpatia/capa.png', images: ['img/simpatia/capa.png', 'img/simpatia/contracapa-1.png', 'img/simpatia/contracapa-2.png', 'img/simpatia/contracapa-3.png'], link: '', category: 'design', year: 2025, featured: true },
    { title: 'BLACKMESA', meta: 'coletivo artístico, são paulo', img: 'img/bmhz0/frente.png', link: 'https://instagram.com/blackmesaent', category: 'cultura', year: 2025 },
    { title: 'bloodworm trax', meta: 'selo musical', img: 'img/logos/bloodworm.png', link: 'https://bloodwormtrax.neocities.org', category: 'cultura', year: 2024 },
    { title: 'TRACKMESA', meta: '10/07/2026, Void Centro, São Paulo', img: 'img/trackmesa/1.png', link: 'https://zig.tickets/eventos/trackmesa', category: 'cultura', year: 2026 },
    { title: 'opcoda', meta: 'VST3, C++', img: 'img/github/opcoda.png', link: 'https://github.com/9matesu/Opcoda', category: 'código', year: 2025, featured: true },
    { title: 'minisynth32', meta: 'ESP32-S3, TypeScript', img: 'img/github/minisynth32.png', link: 'https://github.com/9matesu/minisynth32', category: 'código', year: 2025 },
    { title: 'catlas', meta: 'Python, documentação', img: 'img/github/catlas.png', link: 'https://github.com/9matesu/Catlas', category: 'código', year: 2024 },
    { title: 'wptools', meta: 'PowerShell, Windows', img: 'img/github/wptools.png', link: 'https://github.com/9matesu/WPtools', category: 'código', year: 2024 },
    { title: 'resuMe', meta: 'extensão, TypeScript', img: 'img/github/resuMe.png', link: 'https://github.com/9matesu/resume', category: 'código', year: 2026, featured: true },
    { title: 'matesuposting', meta: 'caderno de ideias, são paulo', img: 'fotos/BMV1-9.jpg', link: '', category: 'textos', year: 2026 }
  ];

  var DISCO = window.MATESU_DISCOGRAPHY || { items: [], covers: {} };
  var MUSIC = (DISCO.items || []).map(function (item) {
    var cover = (DISCO.covers && DISCO.covers[item.title] && DISCO.covers[item.title].local) || '';
    var tracks = (item.tracks || []).map(function (t) {
      return { title: t.title, duration: t.duration || '', spotify: t.spotify || '', artists: t.artists || [] };
    });
    return {
      title: item.title,
      meta: [item.artist, item.year].filter(Boolean).join(' · '),
      img: cover,
      link: item.spotify || item.url || (tracks[0] && tracks[0].spotify) || '',
      category: 'música',
      year: item.year || 0,
      roles: item.roles || [],
      artists: item.artists || [],
      tracks: tracks,
      featured: item.title === 'ON' && item.artist === 'Cassiel'
    };
  });

  var ALL = TREE.concat(MUSIC);

  var CATS = [
    { id: 'all', label: 'tudo', color: '#0a0a0a' },
    { id: 'design', label: 'design', color: '#1544ba' },
    { id: 'música', label: 'música', color: '#e63946' },
    { id: 'código', label: 'código', color: '#2a9d8f' },
    { id: 'cultura', label: 'cultura', color: '#ee7a2e' },
    { id: 'textos', label: 'textos', color: '#8757c9' },
    { id: 'sobre', label: 'sobre', color: '#0a0a0a' }
  ];

  var state = {
    category: 'all',
    query: '',
    sort: 'recent',
    selected: null
  };

  var els = {
    cats: document.getElementById('cats'),
    featured: document.getElementById('featured'),
    rows: document.getElementById('rows'),
    insp: document.getElementById('insp'),
    inspEmpty: document.getElementById('insp-empty'),
    inspector: document.getElementById('inspector'),
    search: document.getElementById('search'),
    count: document.getElementById('count'),
    crumb: document.getElementById('crumb'),
    sort: document.getElementById('sort'),
    browserNote: document.getElementById('browser-note'),
    statusLeft: document.getElementById('status-left'),
    statusRight: document.getElementById('status-right'),
    menuBtn: document.getElementById('menu-btn'),
    inspClose: document.getElementById('insp-close'),
    sidebar: document.querySelector('.sidebar'),
    about: document.getElementById('about'),
    featuredSection: document.querySelector('.featured'),
    browserSection: document.querySelector('.browser'),
    clock: document.getElementById('clock')
  };

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function catLabel(id) {
    var c = CATS.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : id;
  }

  function catColor(id) {
    var c = CATS.filter(function (x) { return x.id === id; })[0];
    return c ? c.color : '#0a0a0a';
  }

  function matches(p) {
    if (state.category !== 'all' && p.category !== state.category) return false;
    if (!state.query) return true;
    return norm(p.title + ' ' + p.meta + ' ' + (p.artists || []).join(' ')).indexOf(norm(state.query)) >= 0;
  }

  function visible() {
    var list = ALL.filter(matches);
    if (state.sort === 'az') {
      list.sort(function (a, b) { return a.title.localeCompare(b.title, 'pt-BR'); });
    } else if (state.sort === 'recent') {
      list.sort(function (a, b) { return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title, 'pt-BR'); });
    }
    return list;
  }

  function img(src, cls, alt) {
    var el = document.createElement('img');
    el.src = src;
    el.alt = alt || '';
    el.className = cls || '';
    el.loading = 'lazy';
    el.addEventListener('error', function () {
      el.style.display = 'none';
      if (el.parentNode) el.parentNode.classList.add('no-img');
    });
    return el;
  }

  function renderCats() {
    if (!els.cats) return;
    els.cats.innerHTML = '';
    CATS.forEach(function (cat) {
      var count = cat.id === 'all' ? ALL.length : cat.id === 'sobre' ? '—' : ALL.filter(function (p) { return p.category === cat.id; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat' + (state.category === cat.id ? ' active' : '');
      b.innerHTML = '<span class="cat-dot" style="background:' + cat.color + '"></span>' +
        '<span class="cat-name">' + cat.label + '</span>' +
        '<span class="cat-count">' + count + '</span>';
      b.addEventListener('click', function () {
        state.category = cat.id;
        state.selected = null;
        render();
        closeSidebar();
      });
      els.cats.appendChild(b);
    });
  }

  function featuredCard(p) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'fcard' + (state.selected === p ? ' active' : '');
    var media = document.createElement('div');
    media.className = 'fcard-media';
    if (p.img) media.appendChild(img(p.img, '', p.title));
    var body = document.createElement('div');
    body.className = 'fcard-body';
    var t = document.createElement('span');
    t.className = 'fcard-title';
    t.textContent = p.title;
    var m = document.createElement('span');
    m.className = 'fcard-meta';
    m.textContent = p.meta;
    body.appendChild(t);
    body.appendChild(m);
    card.appendChild(media);
    card.appendChild(body);
    card.addEventListener('click', function () { select(p); });
    card.addEventListener('dblclick', function () { openLink(p); });
    return card;
  }

  var FEATURED_IDS = ['Simpatia', 'opcoda', 'ON', 'BLACKMESA 2025', 'resuMe', 'TRACKMESA'];

  function renderFeatured() {
    if (!els.featured) return;
    els.featured.innerHTML = '';
    var pool = FEATURED_IDS.map(function (title) {
      return ALL.filter(function (p) {
        return p.title === title && (title !== 'TRACKMESA' || p.category === 'design');
      })[0];
    }).filter(Boolean);
    var list = pool.filter(matches);
    if (!list.length) list = ALL.filter(matches).slice(0, 3);
    list.slice(0, 3).forEach(function (p) { els.featured.appendChild(featuredCard(p)); });
  }

  function rowEl(p) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'row' + (state.selected === p ? ' active' : '');
    var thumb = document.createElement('div');
    thumb.className = 'row-thumb';
    if (p.img) {
      var im = img(p.img, '', '');
      im.className = 'row-thumb';
      row.appendChild(im);
    } else {
      thumb.classList.add('empty');
      thumb.textContent = '—';
      row.appendChild(thumb);
    }
    var main = document.createElement('div');
    main.className = 'row-main';
    var t = document.createElement('span');
    t.className = 'row-title';
  t.textContent = p.title;
    var m = document.createElement('span');
    m.className = 'row-meta';
    m.textContent = p.meta;
    main.appendChild(t);
    main.appendChild(m);
    row.appendChild(main);

    var cat = document.createElement('span');
    cat.className = 'row-cat';
    cat.textContent = catLabel(p.category);
    row.appendChild(cat);

    var year = document.createElement('span');
    year.className = 'row-year';
    year.textContent = p.year || '';
    row.appendChild(year);

    var arrow = document.createElement('span');
    arrow.className = 'row-arrow';
    arrow.textContent = '↗';
    row.appendChild(arrow);

    row.addEventListener('click', function () { select(p); });
    row.addEventListener('dblclick', function () { openLink(p); });
    return row;
  }

  function renderRows() {
    if (!els.rows) return;
    var list = visible();
    els.rows.innerHTML = '';
    if (!list.length) {
      var e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'nada aqui.';
      els.rows.appendChild(e);
    } else {
      list.forEach(function (p) { els.rows.appendChild(rowEl(p)); });
    }
    if (els.count) els.count.textContent = list.length + (list.length === 1 ? ' item' : ' itens');
    if (els.browserNote) els.browserNote.textContent = catLabel(state.category) + ' · ' + list.length;
    if (els.statusLeft) {
      els.statusLeft.textContent = state.selected
        ? state.selected.title + ' — ' + state.selected.meta
        : list.length + ' trabalhos · ' + catLabel(state.category);
    }
  }

  function renderInspector() {
    if (!els.insp || !els.inspEmpty) return;
    var p = state.selected;
    if (!p) {
      els.insp.innerHTML = '';
      els.inspEmpty.style.display = '';
      if (els.inspector) els.inspector.classList.remove('open');
      return;
    }
    els.inspEmpty.style.display = 'none';
    els.insp.innerHTML = '';

    if (p.images && p.images.length) {
      var gal = document.createElement('div');
      gal.className = 'insp-media';
      p.images.slice(0, 2).forEach(function (src) { gal.appendChild(img(src, '', p.title)); });
      els.insp.appendChild(gal);
    } else if (p.img) {
      var media = document.createElement('div');
      media.className = 'insp-media';
      media.appendChild(img(p.img, '', p.title));
      els.insp.appendChild(media);
    }

    var cat = document.createElement('span');
    cat.className = 'insp-cat';
    cat.textContent = catLabel(p.category);
    els.insp.appendChild(cat);

    var h = document.createElement('h2');
    h.className = 'insp-title';
    h.textContent = p.title;
    els.insp.appendChild(h);

    var meta = document.createElement('div');
    meta.className = 'insp-meta';
    meta.textContent = p.meta;
    els.insp.appendChild(meta);

    if (p.roles && p.roles.length) {
      var roles = document.createElement('div');
      roles.className = 'insp-meta';
      roles.textContent = p.roles.join(' · ');
      els.insp.appendChild(roles);
    }

    if (p.artists && p.artists.length) {
      var artists = document.createElement('div');
      artists.className = 'insp-meta';
      artists.textContent = p.artists.join(' · ');
      els.insp.appendChild(artists);
    }

    if (p.tracks && p.tracks.length) {
      var sec = document.createElement('div');
      sec.className = 'insp-section';
      var h4 = document.createElement('h4');
      h4.textContent = 'faixas';
      sec.appendChild(h4);
      p.tracks.forEach(function (t) {
        var tr = document.createElement('div');
        tr.className = 'track';
        var name = document.createElement('span');
        if (t.spotify) {
          var a = document.createElement('a');
          a.href = t.spotify;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = t.title;
          name.appendChild(a);
        } else {
          name.textContent = t.title;
        }
        var dur = document.createElement('span');
        dur.className = 'track-dur';
        dur.textContent = t.duration || '';
        tr.appendChild(name);
        tr.appendChild(dur);
        sec.appendChild(tr);
      });
      els.insp.appendChild(sec);
    }

    if (p.link) {
      var links = document.createElement('div');
      links.className = 'insp-links';
      var a = document.createElement('a');
      a.className = 'insp-link';
      a.href = p.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = '<span>' + (p.category === 'música' ? 'abrir no Spotify' : 'abrir projeto') + '</span><span>↗</span>';
      links.appendChild(a);
      els.insp.appendChild(links);
    }

    if (els.inspector) els.inspector.classList.add('open');
  }

  function select(p) {
    state.selected = p;
    renderRows();
    renderFeatured();
    renderInspector();
  }

  function openLink(p) {
    if (p && p.link) window.open(p.link, '_blank', 'noopener');
  }

  function render() {
    var about = state.category === 'sobre';
    if (about) state.selected = null;
    if (els.about) els.about.hidden = !about;
    if (els.featuredSection) els.featuredSection.hidden = about;
    if (els.browserSection) els.browserSection.hidden = about;

    renderCats();
    if (about) {
      if (els.count) els.count.textContent = '';
      if (els.browserNote) els.browserNote.textContent = '';
      if (els.statusLeft) els.statusLeft.textContent = 'sobre';
    } else {
      renderFeatured();
      renderRows();
    }
    renderInspector();
    if (els.crumb) els.crumb.textContent = catLabel(state.category);
    var main = document.getElementById('main');
    if (main) main.scrollTop = 0;
  }

  function closeSidebar() {
    if (els.sidebar) els.sidebar.classList.remove('open');
  }

  function init() {
    render();

    if (els.search) {
      els.search.addEventListener('input', function () {
        state.query = els.search.value.trim();
        renderFeatured();
        renderRows();
      });
    }

    if (els.sort) {
      els.sort.addEventListener('click', function () {
        state.sort = state.sort === 'recent' ? 'az' : 'recent';
        els.sort.textContent = state.sort === 'recent' ? 'recentes' : 'a–z';
        renderRows();
      });
    }

    if (els.menuBtn) {
      els.menuBtn.addEventListener('click', function () {
        if (els.sidebar) els.sidebar.classList.toggle('open');
      });
    }

    if (els.inspClose) {
      els.inspClose.addEventListener('click', function () {
        state.selected = null;
        renderRows();
        renderFeatured();
        renderInspector();
      });
    }

    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.target.blur();
          if (els.search && e.target === els.search) {
            els.search.value = '';
            state.query = '';
            renderFeatured();
            renderRows();
          }
        }
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        if (els.search) els.search.focus();
      } else if (e.key === 'Escape') {
        if (els.sidebar) els.sidebar.classList.remove('open');
        if (els.inspector) els.inspector.classList.remove('open');
        state.selected = null;
        renderRows();
        renderFeatured();
        renderInspector();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var list = visible();
        if (!list.length) return;
        var idx = state.selected ? list.indexOf(state.selected) : -1;
        var next = e.key === 'ArrowDown' ? Math.min(list.length - 1, idx + 1) : Math.max(0, idx - 1);
        e.preventDefault();
        select(list[next]);
        var row = els.rows && els.rows.children[next];
        if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
      }
    });

    function tickClock() {
      if (!els.clock) return;
      try {
        var t = new Date().toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour12: false
        });
        els.clock.textContent = 'SP ' + t;
      } catch (e) {
        els.clock.textContent = 'SP';
      }
    }
    tickClock();
    setInterval(tickClock, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MATESU_STUDIO = { all: ALL, select: select, state: state };
})();