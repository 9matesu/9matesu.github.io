/* matesu — campo de cards, code trail e arquivo. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  var TREE = [
    { title: 'Bulgarian Stock Exchange', meta: 'estamparia e vestuário · 2025', img: 'img/bse/frente.png', images: ['img/bse/frente.png', 'img/bse/costas.png'], link: 'https://plazaaaaa.com/product/2340', category: 'design', year: 2025, desc: 'Projeto de estamparia e vestuário. Peças com a identidade da bolsa búlgara, impressas em serigrafia, com estudo de tipografia, textura e acabamento.' },
    { title: 'BLACKMESA 2025', meta: 'identidade visual, 2025', img: 'img/logos/blackmesa.png', link: 'https://www.behance.net/gallery/226862609/BLACKMESA-2025', category: 'design', year: 2025 },
    { title: 'BLACKMESA 2024', meta: 'identidade visual, 2024', img: 'img/logos/blackmesa.png', link: 'https://www.behance.net/gallery/226860687/BLACKMESA-2024', category: 'design', year: 2024 },
    { title: 'LAGERHAUS I', meta: 'identidade visual, 2024', img: 'img/logos/bloodworm.png', link: 'https://www.behance.net/gallery/226864143/bloodworm-trax-LAGERHAUS-I', category: 'design', year: 2024 },
    { title: 'TRACKMESA', meta: 'flyer, 10/07/2026 · Void Centro', img: 'img/trackmesa/1.png', images: ['img/trackmesa/1.png', 'img/trackmesa/2.png', 'img/trackmesa/3.png', 'img/trackmesa/4.png'], link: 'https://zig.tickets/eventos/trackmesa', category: 'design', year: 2026 },
    { title: 'Vault 2', meta: 'flyer, 17/12/2025', img: 'img/misc/vault2_FINAL_3.png', images: ['img/misc/vault2_FINAL_3.png'], link: '', category: 'design', year: 2025 },
    { title: 'Simpatia (capa)', meta: 'capa + contracapas, 20/05/2025', img: 'img/simpatia/capa.png', images: ['img/simpatia/capa.png', 'img/simpatia/contracapa-1.png', 'img/simpatia/contracapa-2.png', 'img/simpatia/contracapa-3.png'], link: '', category: 'design', year: 2025 },
    { title: 'opcoda', meta: 'VST3, C++', img: 'img/github/opcoda.png', link: 'https://github.com/9matesu/Opcoda', category: 'código', year: 2025 },
    { title: 'minisynth32', meta: 'ESP32-S3, TypeScript', img: 'img/github/minisynth32.png', link: 'https://github.com/9matesu/minisynth32', category: 'código', year: 2025 },
    { title: 'catlas', meta: 'Python, documentação', img: 'img/github/catlas.png', link: 'https://github.com/9matesu/Catlas', category: 'código', year: 2024 },
    { title: 'wptools', meta: 'PowerShell, Windows', img: 'img/github/wptools.png', link: 'https://github.com/9matesu/WPtools', category: 'código', year: 2024 },
    { title: 'resuMe', meta: 'extensão, TypeScript', img: 'img/github/resuMe.png', link: 'https://github.com/9matesu/resume', category: 'código', year: 2026 },
    { title: 'matesuposting', meta: 'caderno de ideias, são paulo', img: 'fotos/BMV1-9.jpg', link: '', category: 'textos', year: 2026 }
  ];

  var DISCO = window.MATESU_DISCOGRAPHY || { items: [], covers: {} };
  var MUSIC = (DISCO.items || []).map(function (item) {
    var cover = (DISCO.covers && DISCO.covers[item.title] && DISCO.covers[item.title].local) || '';
    return {
      title: item.title,
      meta: [item.artist, item.year, (item.roles || []).join(' / ')].filter(Boolean).join(' · '),
      img: cover,
      link: item.spotify || item.url || '',
      category: 'música',
      year: item.year || 0,
      roles: item.roles || [],
      artists: item.artists || [],
      tracks: item.tracks || []
    };
  });

  var ALL = TREE.concat(MUSIC);

  var CATS = {
    design: 'design',
    música: 'música',
    código: 'código',
    textos: 'textos'
  };

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /* ----------------------------------------------------------- estive aqui */
  var HERE_EXTRA = ['bloodworm trax', 'BLACKMESA', 'Festa Salada', 'Dekmantel', 'HÖR', 'Veneno Live', 'Rinse FM', 'NTS', 'Function!', 'Foundation FM', 'Aaja Music', 'Leigo Records', 'Kenyon Sound', 'HyperX', 'zonaEXP.'];

  var COLLAB_LINKS = {
    'bloodworm trax': 'https://bloodwormtrax.neocities.org',
    'BLACKMESA': 'https://instagram.com/blackmesaent',
    'Rinse FM': 'https://rinse.fm',
    'NTS': 'https://www.nts.live',
    'Dekmantel': 'https://dekmantel.com',
    'HÖR': 'https://hor.io',
    'HyperX': 'https://hyperx.com',
    'Foundation FM': 'https://foundationfm.co.uk',
    'Leigo Records': 'https://leigorecords.com',
    'Aaja Music': 'https://aajamusic.com',
    'Festa Salada': 'https://www.google.com/search?q=Festa+Salada+Sao+Paulo',
    'SPEEDTEST': 'https://open.spotify.com/search/SPEEDTEST',
    'Kenyon Sound': 'https://www.google.com/search?q=Kenyon+Sound',
    'Function!': 'https://www.google.com/search?q=Function+radio',
    'Veneno Live': 'https://www.google.com/search?q=Veneno+Live',
    'zonaEXP.': 'https://www.google.com/search?q=zonaEXP'
  };

  var COLLAB_LINKS_NORM = {};
  Object.keys(COLLAB_LINKS).forEach(function (k) { COLLAB_LINKS_NORM[norm(k)] = COLLAB_LINKS[k]; });

  function collabLink(name) {
    if (COLLAB_LINKS[name]) return COLLAB_LINKS[name];
    var byNorm = COLLAB_LINKS_NORM[norm(name)];
    if (byNorm) return byNorm;
    return 'https://open.spotify.com/search/' + encodeURIComponent(name);
  }

  function renderCollabs() {
    var host = document.getElementById('collab-cols');
    if (!host) return;
    var names = [];
    var seen = {};
    function add(name) {
      if (!name) return;
      var key = norm(name);
      if (!key || key === 'matesu' || seen[key]) return;
      seen[key] = 1;
      names.push(name);
    }
    HERE_EXTRA.forEach(add);
    MUSIC.forEach(function (p) { (p.artists || []).forEach(add); });
    names.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    host.textContent = '';
    names.forEach(function (name) {
      var a = document.createElement('a');
      a.className = 'collab-link';
      a.href = collabLink(name);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = name;
      host.appendChild(a);
    });
  }

  /* ------------------------------------------------------------- archive */
  var archiveState = { query: '', category: 'all' };
  var archiveSearch = document.getElementById('archive-search');
  var archiveFilters = document.getElementById('archive-filters');
  var archiveCols = document.getElementById('archive-cols');
  var archiveSide = document.getElementById('archive-side');
  var archiveDetail = document.getElementById('archive-detail');

  function archiveFiltered() {
    var q = norm(archiveState.query);
    return ALL.filter(function (p) {
      if (archiveState.category !== 'all' && p.category !== archiveState.category) return false;
      if (!q) return true;
      return norm(p.title + ' ' + p.meta + ' ' + (p.artists || []).join(' ')).indexOf(q) >= 0;
    });
  }

  var tagPairs = window.CODE_TRAIL_PAIRS || [];
  var tagStyles = {};
  var tagPairIdx = 0;
  var tagSinceUnderline = 0;

  /* same generation as the code-trail bars: stride 5, underline every 7 */
  function nextTagStyle() {
    if (!tagPairs.length) return null;
    var pair = tagPairs[tagPairIdx % tagPairs.length];
    tagPairIdx = (tagPairIdx + 5) % tagPairs.length;
    tagSinceUnderline++;
    var underline = pair.underline === true || tagSinceUnderline >= 7;
    if (underline) tagSinceUnderline = 0;
    return { bg: pair.bg, fg: pair.fg, underline: underline };
  }

  function buildTagStyles(cats) {
    tagStyles = {};
    tagPairIdx = Math.floor(Math.random() * (tagPairs.length || 1));
    tagSinceUnderline = 0;
    cats.forEach(function (c) {
      var st = nextTagStyle();
      if (st) tagStyles[c.id] = st;
    });
  }

  function renderArchiveFilters() {
    if (!archiveFilters) return;
    var cats = [{ id: 'all', label: 'tudo' }].concat(Object.keys(CATS).map(function (k) {
      return { id: k, label: CATS[k] };
    }));
    if (!Object.keys(tagStyles).length) buildTagStyles(cats);
    archiveFilters.innerHTML = '';
    cats.forEach(function (c) {
      var count = c.id === 'all' ? ALL.length : ALL.filter(function (p) { return p.category === c.id; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = archiveState.category === c.id ? 'active' : '';
      b.textContent = c.label + ' ' + count;
      var st = tagStyles[c.id];
      if (st) {
        b.style.background = st.bg;
        b.style.color = st.fg;
        if (st.underline) {
          b.style.textDecoration = 'underline';
          b.style.textUnderlineOffset = '2px';
        }
      }
      b.addEventListener('click', function () {
        archiveState.category = c.id;
        renderArchiveFilters();
        renderArchiveCols();
      });
      archiveFilters.appendChild(b);
    });
  }

  function renderArchiveCols() {
    if (!archiveCols) return;
    var list = archiveFiltered();
    archiveCols.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('div');
      empty.className = 'archive-empty';
      empty.textContent = 'nada aqui.';
      archiveCols.appendChild(empty);
      return;
    }
    var cols = [[], [], []];
    list.forEach(function (p, i) { cols[i % 3].push(p); });
    cols.forEach(function (col) {
      var div = document.createElement('div');
      div.className = 'archive-col';
      col.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'arow';
        var text = document.createElement('span');
        text.className = 'arow-text';
        var t = document.createElement('span');
        t.className = 'arow-title';
        t.textContent = p.title;
        var m = document.createElement('span');
        m.className = 'arow-meta';
        m.textContent = p.meta;
        text.appendChild(t);
        text.appendChild(m);
        b.appendChild(text);
        b.addEventListener('click', function () { openArchiveSide(p); });
        div.appendChild(b);
      });
      archiveCols.appendChild(div);
    });
  }

  function openArchiveSide(p) {
    if (!archiveSide || !archiveDetail) return;
    archiveDetail.innerHTML = '';
    var imgs = p.images && p.images.length ? p.images : (p.img ? [p.img] : []);
    imgs.forEach(function (src, i) {
      var im = document.createElement('img');
      im.src = src;
      im.alt = p.title + (imgs.length > 1 ? ' ' + (i + 1) : '');
      im.loading = i === 0 ? 'eager' : 'lazy';
      archiveDetail.appendChild(im);
    });
    var cat = document.createElement('span');
    cat.className = 'mono';
    cat.textContent = CATS[p.category] || p.category;
    archiveDetail.appendChild(cat);
    var h = document.createElement('h3');
    h.textContent = p.title;
    archiveDetail.appendChild(h);
    var meta = document.createElement('span');
    meta.className = 'mono';
    meta.textContent = p.meta;
    archiveDetail.appendChild(meta);
    if (p.desc) {
      var desc = document.createElement('p');
      desc.className = 'archive-desc';
      desc.textContent = p.desc;
      archiveDetail.appendChild(desc);
    }
    if (p.link) {
      var a = document.createElement('a');
      a.className = 'btn btn-accent';
      a.href = p.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'abrir';
      archiveDetail.appendChild(a);
    }
    archiveSide.hidden = false;
    requestAnimationFrame(function () { archiveSide.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }

  function closeArchiveSide() {
    if (!archiveSide || archiveSide.hidden) return;
    archiveSide.classList.remove('open');
    window.setTimeout(function () {
      archiveSide.hidden = true;
      if (document.getElementById('howto') === null) document.body.style.overflow = '';
    }, 300);
  }

  if (archiveSearch) {
    archiveSearch.addEventListener('input', function () {
      archiveState.query = archiveSearch.value.trim();
      renderArchiveCols();
    });
  }
  var archiveClose = document.querySelector('.archive-close');
  if (archiveClose) archiveClose.addEventListener('click', closeArchiveSide);

  /* ------------------------------------------------------------- posting */
  var postToggles = [].slice.call(document.querySelectorAll('.post-toggle'));
  postToggles.forEach(function (btn) {
    btn.setAttribute('data-label', btn.textContent);
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.post-toggle') : null;
    if (!btn) return;
    var post = btn.closest('[data-post]');
    if (!post) return;
    var open = post.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'fechar' : (btn.getAttribute('data-label') || 'ler');
  });

  var subscribe = document.getElementById('subscribe');
  if (subscribe) {
    subscribe.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('subscribe-email');
      var note = document.getElementById('subscribe-note');
      var value = email ? email.value.trim() : '';
      if (!value || value.indexOf('@') < 0 || value.indexOf('.') < 0) {
        if (note) {
          note.textContent = 'email inválido.';
          note.classList.add('error');
        }
        return;
      }
      if (note) {
        note.textContent = 'ok. te aviso quando sair texto novo.';
        note.classList.remove('error');
      }
      if (email) email.value = '';
    });
  }


  /* -------------------------------------------------------------- gallery */
  var GALLERY = window.MATESU_GALLERY || [];
  var galleryState = { cat: 'all' };
  var galleryGrid = document.getElementById('gallery-grid');
  var galleryFilters = document.getElementById('gallery-filters');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxTitle = document.getElementById('lightbox-title');
  var lightboxMeta = document.getElementById('lightbox-meta');
  var lightboxPrev = document.querySelector('.lightbox-prev');
  var lightboxNext = document.querySelector('.lightbox-next');
  var lightboxItems = [];
  var lightboxIndex = 0;
  var galleryTagStyle = {};

  function galleryFiltered() {
    if (galleryState.cat === 'all') return GALLERY;
    return GALLERY.filter(function (g) { return g.cat === galleryState.cat; });
  }

  function buildGroups(list) {
    var map = {};
    var order = [];
    list.forEach(function (g) {
      var key, title;
      if (g.cat === 'blackmesa') { key = 'blackmesa'; title = 'BLACKMESA'; }
      else if (g.cat === 'salada') { key = 'salada'; title = 'Salada'; }
      else if (g.cat === 'agenda') { key = 'agenda'; title = 'Agenda Aberta'; }
      else if (g.cat === 'bse') { key = 'bse'; title = 'Bulgarian Stock Exchange'; }
      else if (/^Ramon/i.test(g.title)) { key = 'ramon'; title = 'Ramon'; }
      else if (/^SKT Camp/i.test(g.title)) { key = 'sktcamp'; title = 'SKT Camp'; }
      else { key = g.title; title = g.title; }
      if (!map[key]) { map[key] = { key: key, title: title, items: [] }; order.push(key); }
      map[key].items.push(g);
    });
    return order.map(function (k) { return map[k]; });
  }

  function renderGalleryFilters() {
    if (!galleryFilters) return;
    galleryFilters.innerHTML = '';
    var cats = [{ id: 'all', label: 'tudo' }].concat(['blackmesa', 'salada', 'agenda', 'flyers', 'bse'].map(function (c) {
      return { id: c, label: c };
    }));
    cats.forEach(function (c) {
      var count = c.id === 'all' ? GALLERY.length : GALLERY.filter(function (g) { return g.cat === c.id; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = galleryState.cat === c.id ? 'active' : '';
      b.textContent = c.label + ' ' + count;
      if (!galleryTagStyle[c.id]) {
        galleryTagStyle[c.id] = {
          fs: 8 + Math.floor(Math.random() * 3),
          px: 4 + Math.floor(Math.random() * 8)
        };
      }
      b.style.fontSize = galleryTagStyle[c.id].fs + 'px';
      b.style.padding = '1px ' + galleryTagStyle[c.id].px + 'px';
      b.addEventListener('click', function () {
        galleryState.cat = c.id;
        renderGalleryFilters();
        renderGalleryGrid();
      });
      galleryFilters.appendChild(b);
    });
  }

  function renderGalleryGrid() {
    if (!galleryGrid) return;
    var groups = buildGroups(galleryFiltered());
    galleryGrid.innerHTML = '';
    groups.forEach(function (gr) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gallery-group';
      var im = document.createElement('img');
      im.src = gr.items[0].src;
      im.alt = gr.title;
      im.loading = 'lazy';
      var cap = document.createElement('span');
      cap.className = 'g-meta';
      var t = document.createElement('span');
      t.textContent = gr.title;
      var c = document.createElement('span');
      c.textContent = gr.items.length + (gr.items.length === 1 ? ' img' : ' imgs');
      cap.appendChild(t);
      cap.appendChild(c);
      b.appendChild(im);
      b.appendChild(cap);
      b.addEventListener('click', function () { openLightbox(gr.items, 0); });
      galleryGrid.appendChild(b);
    });
  }

  function showLightbox() {
    if (!lightboxItems.length) return;
    var g = lightboxItems[lightboxIndex];
    lightboxImg.src = g.src;
    lightboxImg.alt = g.title;
    lightboxTitle.textContent = g.title;
    lightboxMeta.textContent = g.meta + ' · ' + g.roles + ' · ' + (lightboxIndex + 1) + '/' + lightboxItems.length;
  }

  function openLightbox(items, index) {
    if (!lightbox) return;
    lightboxItems = items;
    lightboxIndex = index || 0;
    showLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function stepLightbox(dir) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
    showLightbox();
  }

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  var lbClose = document.querySelector('.lightbox-close');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { stepLightbox(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { stepLightbox(1); });

  renderGalleryFilters();
  renderGalleryGrid();

  /* ---------------------------------------------------------- code trail */
  var trailHost = document.getElementById('trail');
  var trail = null;
  if (trailHost && window.CodeTrail) {
    trail = new window.CodeTrail(trailHost, ALL.map(function (p) { return p.title; }));
    if (reduce) {
      trail.renderStill();
    } else {
      trail.seed();
      trail.start();
    }
    window.addEventListener('resize', function () { if (trail) trail.resize(); });
    document.addEventListener('visibilitychange', function () {
      if (!trail) return;
      if (document.hidden) trail.stop();
      else if (!reduce) trail.start();
    });
    trailHost.addEventListener('click', function (e) {
      var badge = e.target.closest ? e.target.closest('.trail-badge') : null;
      if (!badge) return;
      var name = badge.getAttribute('data-name');
      var p = ALL.filter(function (x) { return x.title === name; })[0];
      if (p) openArchiveSide(p);
    });
    if (window.IntersectionObserver) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (!reduce) trail.start();
          } else {
            trail.stop();
          }
        });
      }, { threshold: 0.02 });
      tio.observe(trailHost);
    }
  }

  /* --------------------------------------------------------------- phrase */
  var PHRASES = ['construindo coisas', 'criando', 'enrolando', 'sonhando', 'de marola'];
  var phraseEl = document.getElementById('phrase');
  var phraseIdx = 0;
  if (phraseEl && !reduce) {
    window.setInterval(function () {
      phraseEl.classList.add('out');
      window.setTimeout(function () {
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        phraseEl.textContent = PHRASES[phraseIdx];
        phraseEl.classList.remove('out');
        void phraseEl.offsetWidth;
        phraseEl.classList.add('in');
        window.setTimeout(function () { phraseEl.classList.remove('in'); }, 30);
      }, 900);
    }, 3800);
  }

  /* --------------------------------------------------------------- dotcut */
  function mountDotCut() {
    if (!window.DotCut || !window.DOTCUT_SCENES) return;
    if (window.DOTCUT_PALETTES) {
      window.DOTCUT_PALETTES.length = 0;
      [
        { circle: '#ff3b30', back: '#0a0a0a' },
        { circle: '#00e5ff', back: '#0a0a0a' },
        { circle: '#ff2d95', back: '#16000f' },
        { circle: '#7cff4f', back: '#0a0a0a' },
        { circle: '#ff7a00', back: '#0a0a0a' },
        { circle: '#ffffff', back: '#1544ba' }
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
      if (engine.reduce) engine.renderStill();
      else engine.start();

      var card = document.querySelector('.hero-card');
      var fine = window.matchMedia('(pointer: fine)').matches;
      if (fine && card && !engine.reduce) {
        card.addEventListener('pointermove', function (e) {
          var r = host.getBoundingClientRect();
          engine.setPointer(engine.toCell(e.clientX - r.left, e.clientY - r.top));
        });
        card.addEventListener('pointerleave', function () { engine.setPointer(null); });
        card.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('a, button')) return;
          var r = host.getBoundingClientRect();
          engine.randomize(engine.toCell(e.clientX - r.left, e.clientY - r.top));
        });
      }

      /* pause the canvas when the card is off screen */
      if (window.IntersectionObserver) {
        var dio = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              if (!engine.reduce) engine.start();
            } else {
              engine.stop();
            }
          });
        }, { threshold: 0.02 });
        dio.observe(card || host);
      }
    } catch (e) {}
  }

  /* ------------------------------------------------------------- stack type */
  function mountStackType() {
    var host = document.getElementById('stack-bg');
    if (!host || !window.StackType) return;
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(canvas);

    var phrases = ['PRODUÇÃO MUSICAL', 'ENGENHARIA DE AUDIO', 'TRACKS', 'SOUND DESIGN', 'COPRODUÇÃO', 'DIREÇÃO DE ARTE', 'PRODUÇÃO CULTURAL', 'FOTOGRAFIA'].map(function (t) {
      return { text: t, ground: '#1544ba', ink: '#ffffff' };
    });

    var engine = new window.StackType(canvas, {
      family: '"Switzer", "Helvetica Neue", Helvetica, Arial, sans-serif',
      phrases: phrases,
      weight: 700,
      look: { drum: true, outline: true, scramble: true }
    });
    if (!engine.ok) return;

    if (reduce) engine.renderStill();
    else engine.start();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { engine.measure(); });
    }

    var rt = 0;
    window.addEventListener('resize', function () {
      if (rt) window.clearTimeout(rt);
      rt = window.setTimeout(function () { engine.resize(); }, 150);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) engine.stop();
      else if (!reduce) engine.start();
    });

    var sec = document.getElementById('estive');
    if (window.IntersectionObserver && sec) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (!reduce) engine.start();
          } else {
            engine.stop();
          }
        });
      }, { threshold: 0.02 });
      sio.observe(sec);
    }
  }

  /* --------------------------------------------------------------- reveal */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* --------------------------------------------------------------- pager */
  var sections = [].slice.call(document.querySelectorAll('section[data-page]:not([hidden])'));
  var pager = document.getElementById('pager');
  var pagerBtns = [];
  var current = 0;
  var locked = false;
  var sectionTops = [];
  var sectionBottoms = [];
  var maxScroll = 1;

  function measure() {
    var y = window.pageYOffset;
    sectionTops = [];
    sectionBottoms = [];
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      sectionTops.push(r.top + y);
      sectionBottoms.push(r.bottom + y);
    }
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  var ANIM_SEL = '.hero-card, .trail-head, .trail-host, .archive-head, .archive-filters, .arow, .post, .subscribe, .about-top, .about-body > p, .about-cols, .about-more, .collab-link, .flag-card, .flags-note, .disclaimer';

  function animItems(sec) {
    var items = [].slice.call(sec.querySelectorAll(ANIM_SEL));
    items = items.filter(function (el) {
      for (var i = 0; i < items.length; i++) {
        if (items[i] !== el && items[i].contains(el)) return false;
      }
      return true;
    });
    items.forEach(function (el, i) {
      el.classList.add('anim-item');
      el.style.setProperty('--i', Math.min(i, 14));
    });
  }

  function playTransition(from, to, dir) {
    if (reduce || from === to) return;
    var outSec = sections[from];
    var inSec = sections[to];
    if (outSec) {
      animItems(outSec);
      outSec.classList.remove('anim-out-up', 'anim-out-down');
      void outSec.offsetWidth;
      outSec.classList.add(dir > 0 ? 'anim-out-up' : 'anim-out-down');
      window.setTimeout(function () {
        outSec.classList.remove('anim-out-up', 'anim-out-down');
      }, 700);
    }
    if (inSec) {
      animItems(inSec);
      inSec.classList.remove('anim-in-up', 'anim-in-down');
      void inSec.offsetWidth;
      inSec.classList.add(dir > 0 ? 'anim-in-up' : 'anim-in-down');
      window.setTimeout(function () {
        inSec.classList.remove('anim-in-up', 'anim-in-down');
      }, 1000);
    }
  }

  function goTo(i) {
    if (!sections.length) return;
    i = Math.max(0, Math.min(sections.length - 1, i));
    var from = current;
    var top = sectionTops[i] || 0;
    if (reduce) {
      window.scrollTo(0, top);
      current = i;
      paintDots();
      onScroll();
      return;
    }
    current = i;
    locked = true;
    paintDots();
    playTransition(from, i, i > from ? 1 : -1);
    animateTo(top, 620);
  }

  function nudge(top) {
    if (reduce) {
      window.scrollTo(0, top);
      onScroll();
      return;
    }
    locked = true;
    animateTo(top, 620);
  }

  /* one gesture = one page. Tall sections page through before moving on. */
  function step(dir) {
    if (locked || !sections.length) return;
    var i = current;
    var top = sectionTops[i];
    var bottom = sectionBottoms[i];
    var vh = window.innerHeight;
    var y = window.pageYOffset;
    var tall = bottom - top > vh + 4;

    if (tall) {
      if (dir > 0) {
        if (y >= bottom - vh - 4) {
          if (i < sections.length - 1) goTo(i + 1);
          return;
        }
        nudge(Math.min(bottom - vh, y + vh));
      } else {
        if (y <= top + 4) {
          if (i > 0) goTo(i - 1);
          return;
        }
        nudge(Math.max(top, y - vh));
      }
      return;
    }

    if (dir > 0) {
      if (i < sections.length - 1) goTo(i + 1);
    } else if (i > 0) {
      goTo(i - 1);
    }
  }

  function paintDots() {
    if (pagerBtns.length) {
      pagerBtns.forEach(function (b, i) { b.classList.toggle('active', i === current); });
    }
  }

  if (pager) {
    sections.forEach(function (sec, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'ir para a seção ' + (i + 1));
      b.addEventListener('click', function () { goTo(i); });
      pager.appendChild(b);
      pagerBtns.push(b);
    });
  }

  var progress = document.querySelector('.progress');
  function onScroll() {
    var y = window.pageYOffset;
    if (progress) {
      var p = y / maxScroll;
      progress.style.width = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '%';
    }

    var probe = y + window.innerHeight * 0.35;
    var active = 0;
    for (var i = 0; i < sectionTops.length; i++) {
      if (sectionTops[i] <= probe) active = i;
    }
    if (active !== current && !locked) {
      current = active;
      paintDots();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); onScroll(); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }

  /* --------------------------------------------------------- scroll anim */
  var scrollRaf = 0;
  function animateTo(top, dur) {
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    var from = window.pageYOffset;
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 4);
      window.scrollTo(0, from + (top - from) * e);
      if (p < 1) {
        scrollRaf = requestAnimationFrame(tick);
      } else {
        scrollRaf = 0;
        locked = false;
        onScroll();
      }
    }
    scrollRaf = requestAnimationFrame(tick);
  }

  /* --------------------------------------------------------- scroll hijack */
  function inScrollable(target) {
    if (!target || !target.closest) return false;
    if (target.closest('.lightbox')) return true;
    var el = target.closest('dialog, .archive-side, .archive-cols');
    if (el) return el.scrollHeight > el.clientHeight + 1;
    return false;
  }

  function normalizeWheel(e) {
    var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= window.innerHeight;
    return d;
  }

  window.addEventListener('wheel', function (e) {
    if (reduce || !sections.length || coarse) return;
    if (inScrollable(e.target)) return;

    var delta = normalizeWheel(e);
    if (Math.abs(delta) < 1) return;
    var dir = delta > 0 ? 1 : -1;

    e.preventDefault();
    if (locked) return;
    step(dir);
  }, { passive: false, capture: true });

  var touchY = null;
  window.addEventListener('touchstart', function (e) {
    if (!sections.length) return;
    if (coarse) { touchY = null; return; }
    if (e.touches.length !== 1) { touchY = null; return; }
    if (inScrollable(e.target)) { touchY = null; return; }
    touchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (coarse) { touchY = null; return; }
    if (touchY == null || !e.touches.length) return;
    if (inScrollable(e.target)) { touchY = null; return; }

    var dy = touchY - e.touches[0].clientY;
    if (Math.abs(dy) < 22) { e.preventDefault(); return; }
    e.preventDefault();
    if (locked) return;

    var dir = dy > 0 ? 1 : -1;
    touchY = null;
    step(dir);
  }, { passive: false });

  window.addEventListener('touchend', function () { touchY = null; }, { passive: true });

  /* Lançamentos: a discografia do Matesu no Bandcamp (própria, com capas).
     `date` é a data de lançamento (ISO) puxada de cada página do Bandcamp. */
  var LANCH = [
    { title: 'refix.pak', date: '2026-11-06', cover: 'img/covers/bc-refix-pak.jpg', url: 'https://matesu.bandcamp.com/album/refix-pak' },
    { title: 'Paramore - Decode (Matesu Remix)', date: '2026-09-04', cover: 'img/covers/bc-paramore-decode.jpg', url: 'https://matesu.bandcamp.com/track/paramore-decode-matesu-remix' },
    { title: 'SP-150', date: '2026-04-24', cover: 'img/covers/bc-sp-150.jpg', url: 'https://matesu.bandcamp.com/album/sp-150' },
    { title: 'xrc no 130', date: '2026-02-13', cover: 'img/covers/bc-xrc-no-130.jpg', url: 'https://matesu.bandcamp.com/track/xrc-no-130-2' },
    { title: 'carnagarage', date: '2025-02-27', cover: 'img/covers/bc-carnagarage.jpg', url: 'https://matesu.bandcamp.com/album/carnagarage' },
    { title: "mixed seeds archival ('19-'23)", date: '2023-10-06', cover: 'img/covers/bc-mixed-seeds.jpg', url: 'https://matesu.bandcamp.com/album/mixed-seeds-archival-19-23' },
    { title: 'Qa', date: '2023-05-01', cover: 'img/covers/bc-qa.jpg', url: 'https://matesu.bandcamp.com/album/qa' },
    { title: 'Rarer Demons', date: '2022-01-21', cover: 'img/covers/bc-rarer-demons.jpg', url: 'https://matesu.bandcamp.com/album/rarer-demons' },
    { title: 'No Format', date: '2021-10-01', cover: 'img/covers/bc-no-format.jpg', url: 'https://matesu.bandcamp.com/album/no-format' },
    { title: 'virtualsoundscape.net', date: '2021-04-02', cover: 'img/covers/bc-virtualsoundscape.jpg', url: 'https://matesu.bandcamp.com/album/virtualsoundscape-net' },
    { title: 'Half Life', date: '2021-03-05', cover: 'img/covers/bc-half-life.jpg', url: 'https://matesu.bandcamp.com/track/half-life' },
    { title: 'International Flux', date: '2021-02-05', cover: 'img/covers/bc-international-flux.jpg', url: 'https://matesu.bandcamp.com/album/international-flux' },
    { title: 'Tenacity', date: '2020-10-02', cover: 'img/covers/bc-tenacity.jpg', url: 'https://matesu.bandcamp.com/album/tenacity' },
    { title: 'Worldwide Stream', date: '2020-09-04', cover: 'img/covers/bc-worldwide-stream.jpg', url: 'https://matesu.bandcamp.com/album/worldwide-stream' },
    { title: 'Rare Demons Minitapes Deluxe', date: '2020-04-15', cover: 'img/covers/bc-rare-demons-minitapes.jpg', url: 'https://matesu.bandcamp.com/album/rare-demons-minitapes-deluxe' }
  ];

  var MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + ' ' + (MONTHS[Number(p[1]) - 1] || '') + ' ' + p[0];
  }

  function renderLancamentos() {
    var grid = document.getElementById('lanc-grid');
    if (!grid) return;
    var items = LANCH.slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
    grid.innerHTML = '';
    items.forEach(function (it) {
      var card = document.createElement('a');
      card.className = 'lanc-card';
      card.href = it.url;
      card.target = '_blank';
      card.rel = 'noopener';
      var im = document.createElement('img');
      im.className = 'lanc-cover';
      im.src = it.cover;
      im.alt = it.title;
      im.loading = 'lazy';
      card.appendChild(im);
      var body = document.createElement('div');
      body.className = 'lanc-body';
      var h = document.createElement('h3');
      h.className = 'lanc-title';
      h.textContent = it.title;
      var meta = document.createElement('p');
      meta.className = 'lanc-meta';
      meta.textContent = fmtDate(it.date);
      body.appendChild(h);
      body.appendChild(meta);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* Alterna arquivo/lançamentos na mesma posição, com crossfade. */
  function switchView(name) {
    var tabs = [].slice.call(document.querySelectorAll('.view-tab'));
    var panels = [].slice.call(document.querySelectorAll('.view-panel'));
    var search = document.getElementById('archive-search');
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-view') === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      var on = p.getAttribute('data-panel') === name;
      p.classList.toggle('active', on);
      p.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    if (search) search.style.display = name === 'arquivo' ? '' : 'none';
  }

  function mountViewTabs() {
    var tabs = [].slice.call(document.querySelectorAll('.view-tab'));
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        switchView(t.getAttribute('data-view'));
      });
    });
  }

  /* --------------------------------------------------------------- init */
  function init() {
    renderArchiveFilters();
    renderArchiveCols();
    renderLancamentos();
    mountViewTabs();
    renderCollabs();
    mountDotCut();
    mountStackType();
    measure();
    onScroll();

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (lightbox && !lightbox.hidden) { closeLightbox(); return; }
        if (archiveSide && !archiveSide.hidden) { closeArchiveSide(); return; }
      }
      if (lightbox && !lightbox.hidden) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); return; }
      }
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (e.key === 'Home') {
        e.preventDefault(); goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault(); goTo(sections.length - 1);
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault(); step(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); step(-1);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();