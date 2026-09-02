/* ===== المكتبةُ التعليمية: الأقسامُ والموادُّ والبحثُ والحقيبةُ المقفلة ===== */
(function () {
  'use strict';
  var PAGE = document.body.dataset.page || 'lib';   /* lib | haqiba */
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function arNum(n) { return String(n).replace(/[0-9]/g, function (d) { return AR[+d]; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  var KIND = {
    lesson:   { t: 'درس',      go: 'افتحِ الدرس',      i: '<svg viewBox="0 0 24 24"><path d="M4 5.5h5.5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2H4z"/><path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z"/></svg>' },
    slides:   { t: 'شرائح',    go: 'افتحِ الشرائح',    i: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/></svg>' },
    game:     { t: 'لعبة',     go: 'العبِ الآن',       i: '<svg viewBox="0 0 24 24"><path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1l-2-2H9l-2 2H6a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.5" r=".9" fill="currentColor"/></svg>' },
    exercise: { t: 'تمارين',   go: 'ابدأِ التمارين',   i: '<svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/><path d="M14 20h6"/></svg>' },
    review:   { t: 'مراجعة',   go: 'راجعْ سريعاً',     i: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' },
    tool:     { t: 'أداةٌ حيّة', go: 'افتحِ الأداة',   i: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>' },
    doc:      { t: 'كتيّب',    go: 'افتحِ الكتيّب',    i: '<svg viewBox="0 0 24 24"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14.5 3.5V8H19"/><path d="M8 12h8M8 15.5h8M8 8.5h3"/></svg>' },
    site:     { t: 'موقع',     go: 'افتحِ الموقع',     i: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/></svg>' }
  };
  var SICO = {
    nahw:    '<svg viewBox="0 0 24 24"><path d="M12 20V9M12 9c-1-3-4-4-7-4 0 4 3 6 7 7M12 9c1-3 4-4 7-4 0 4-3 6-7 7"/><path d="M8 20h8"/></svg>',
    balagha: '<svg viewBox="0 0 24 24"><path d="M19 4c-6 1-10 5-12 11l-2 5 5-2c6-2 10-6 11-12z"/><path d="M7 15l6-6"/></svg>',
    arabic:  '<svg viewBox="0 0 24 24"><path d="M4 15c2 3 6 4 10 3 3-1 5-3 6-6-2 1-4 1-6 0-2-1-5-1-7 1M14 7c1-1 3-1 4 0"/><circle cx="16.5" cy="4.5" r=".9" fill="currentColor"/></svg>',
    games:   '<svg viewBox="0 0 24 24"><path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1l-2-2H9l-2 2H6a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.5" r=".9" fill="currentColor"/></svg>',
    tadrib:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M12 3.5V7M12 17v3.5M3.5 12H7M17 12h3.5"/></svg>',
    tot:     '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    ccuai:   '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    muallim: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8M8 10l2 2 4-4"/></svg>',
    tasmim:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="8.6" r="1.5"/><circle cx="8.8" cy="13.4" r="1.5"/><circle cx="15.2" cy="13.4" r="1.5"/></svg>',
    def:     '<svg viewBox="0 0 24 24"><path d="M12 4.5L21 9l-9 4.5L3 9z"/><path d="M6.5 11v4.6c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4V11"/></svg>'
  };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6"/></svg>';

  var els = {
    chips: document.getElementById('chips'), q: document.getElementById('q'), count: document.getElementById('count'),
    feat: document.getElementById('feat'), secs: document.getElementById('secs'), empty: document.getElementById('empty'),
    reset: document.getElementById('reset'), gate: document.getElementById('gate'), content: document.getElementById('content')
  };
  var D = null, SECS = [], ITEMS = [], activeSec = '';

  fetch('data/edu.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    D = d;
    SECS = (d.sections || []).filter(function (s) { return PAGE === 'haqiba' ? s.locked : !s.locked; });
    ITEMS = (d.items || []).filter(function (a) { return !a.hidden && (a.file || a.url); })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (PAGE === 'haqiba') initGate(); else start();
  }).catch(function () {
    if (els.secs) els.secs.innerHTML = '<div class="empty"><b>تعذَّر تحميلُ المكتبة</b>أعِدْ تحديثَ الصفحة بعد قليل.</div>';
  });

  function start() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    if (h && SECS.some(function (s) { return s.id === h; })) activeSec = h;
    buildChips(); render();
    if (activeSec) setTimeout(function () { var t = document.getElementById('sec-' + activeSec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
  }

  /* ---------- الشرائح ---------- */
  function countIn(id) { return ITEMS.filter(function (a) { return a.section === id; }).length; }
  function buildChips() {
    if (!els.chips) return;
    var secs = SECS.filter(function (s) { return countIn(s.id); });
    if (secs.length < 2) { els.chips.innerHTML = ''; return; }
    els.chips.innerHTML = '<button class="chip" type="button" data-sec="" aria-pressed="' + (!activeSec) + '">الكلّ</button>'
      + secs.map(function (s) {
        return '<button class="chip" type="button" data-sec="' + esc(s.id) + '" aria-pressed="' + (activeSec === s.id) + '">' + esc(s.title) + ' <span class="n">' + arNum(countIn(s.id)) + '</span></button>';
      }).join('');
    els.chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      activeSec = b.dataset.sec || '';
      [].forEach.call(els.chips.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      if (history.replaceState) history.replaceState(null, '', activeSec ? '#' + activeSec : location.pathname);
      render();
    });
  }

  /* ---------- البطاقات ---------- */
  function match(a, q) {
    if (activeSec && a.section !== activeSec) return false;
    if (!q) return true;
    var sec = SECS.filter(function (s) { return s.id === a.section; })[0];
    var hay = [a.title, a.desc, a.grade, a.meta, sec && sec.title, KIND[a.kind] && KIND[a.kind].t].concat(a.tags || []).join(' ');
    return hay.indexOf(q) > -1;
  }
  function href(a) { return a.file || a.url || '#'; }
  function ext(a) { return !a.file && a.url && a.url.indexOf('haydarvsky.github.io') < 0; }
  function kindHtml(a) { var k = KIND[a.kind] || KIND.lesson; return '<span class="kind ' + esc(a.kind || 'lesson') + '">' + k.i + esc(k.t) + '</span>'; }
  function metaHtml(a) {
    var bits = [];
    if (a.meta) bits.push('<b>' + esc(a.meta) + '</b>');
    if (a.minutes) bits.push('<b>' + arNum(a.minutes) + ' دقيقة</b>');
    (a.tags || []).slice(0, 2).forEach(function (t) { bits.push('<b>' + esc(t) + '</b>'); });
    return bits.length ? '<div class="meta">' + bits.join('<span class="dot"></span>') + '</div>' : '';
  }
  function cardHtml(a, i) {
    var k = KIND[a.kind] || KIND.lesson;
    var strip = a.cover ? '<span class="strip"><img src="' + esc(a.cover) + '" alt="" loading="lazy" onerror="var s=this.closest(\'.strip\'),c=s.closest(\'.item\');c.classList.add(\'no-strip\');s.remove()"></span>' : '';
    var top = '<div class="top">' + kindHtml(a) + (a.grade ? '<span class="grade">' + esc(a.grade) + '</span>' : '') + '</div>';
    var body = strip + top + '<h3>' + esc(a.title) + '</h3>' + (a.desc ? '<p class="teaser">' + esc(a.desc) + '</p>' : '') + metaHtml(a);
    var d = ' data-in style="--d:' + (Math.min(i, 8) * 55) + 'ms"';
    if (a.screen) {
      /* أداةٌ حيّة: رابطٌ للمشارك ورابطٌ لشاشةِ العرض */
      return '<div class="item box' + (a.cover ? '' : ' no-strip') + '"' + d + '>' + body
        + '<div class="links"><a class="go" href="' + esc(href(a)) + '">' + esc(a.cta || k.go) + ' ' + ARROW + '</a>'
        + '<a class="go alt" href="' + esc(a.screen) + '">' + esc(a.screenTitle || 'شاشةُ العرض') + ' ' + ARROW + '</a></div></div>';
    }
    return '<a class="item' + (a.cover ? '' : ' no-strip') + '" href="' + esc(href(a)) + '"' + (ext(a) ? ' target="_blank" rel="noopener"' : '') + d + '>' + body
      + '<span class="go">' + esc(a.cta || k.go) + ' ' + ARROW + '</span></a>';
  }
  function featHtml(a) {
    var k = KIND[a.kind] || KIND.lesson;
    var cover = a.cover ? '<div class="cover"><img src="' + esc(a.cover) + '" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>'
      : '<div class="cover"><span class="big">' + k.i + '</span></div>';
    return '<a class="feat has-cover" href="' + esc(href(a)) + '" data-in><div class="body">'
      + '<span class="star"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/></svg>ابدأْ من هنا</span>'
      + '<div class="top">' + kindHtml(a) + (a.grade ? '<span class="grade">' + esc(a.grade) + '</span>' : '') + '</div>'
      + '<h2>' + esc(a.title) + '</h2>'
      + (a.desc ? '<p class="teaser">' + esc(a.desc) + '</p>' : '')
      + metaHtml(a)
      + '<span class="go">' + esc(a.cta || k.go) + ' ' + ARROW + '</span>'
      + '</div>' + cover + '</a>';
  }
  function secHtml(s, list) {
    return '<section class="sec" id="sec-' + esc(s.id) + '">'
      + '<div class="sec-h" data-in><span class="sico">' + (SICO[s.icon || s.id] || SICO.def) + '</span>'
      + '<div class="tx"><h2>' + esc(s.title) + '</h2>' + (s.desc ? '<p>' + esc(s.desc) + '</p>' : '') + '</div>'
      + '<span class="sn">' + arNum(list.length) + ' ' + (list.length === 1 ? 'مادّة' : (list.length === 2 ? 'مادّتان' : (list.length <= 10 ? 'موادّ' : 'مادّة'))) + '</span></div>'
      + '<div class="list">' + list.map(cardHtml).join('') + '</div></section>';
  }

  function render() {
    var q = els.q ? (els.q.value || '').trim() : '';
    var shown = ITEMS.filter(function (a) { return match(a, q); });
    var featured = (PAGE === 'lib' && !q && !activeSec) ? shown.filter(function (a) { return a.featured; })[0] : null;
    if (els.feat) els.feat.innerHTML = featured ? featHtml(featured) : '';
    var rest = featured ? shown.filter(function (a) { return a !== featured; }) : shown;
    els.secs.innerHTML = SECS.map(function (s) {
      var l = rest.filter(function (a) { return a.section === s.id; });
      return l.length ? secHtml(s, l) : '';
    }).join('');
    if (els.empty) els.empty.hidden = shown.length > 0;
    if (els.count) els.count.textContent = shown.length ? arNum(shown.length) + ' ' + (shown.length === 1 ? 'مادّة' : (shown.length === 2 ? 'مادّتان' : (shown.length <= 10 ? 'موادّ' : 'مادّة'))) + (activeSec ? ' في «' + (SECS.filter(function (s) { return s.id === activeSec; })[0] || {}).title + '»' : '') : '';
    animateIn(); if (FINE) glow();
  }

  /* ---------- الحركة ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function animateIn() {
    var fresh = document.querySelectorAll('main [data-in]:not(.in)');
    if (!io) { fresh.forEach(function (el) { el.classList.add('in'); }); return; }
    fresh.forEach(function (el) { io.observe(el); });
    setTimeout(function () { fresh.forEach(function (el) { el.classList.add('in'); }); }, 2600);
  }
  function glow() {
    document.querySelectorAll('.item:not([data-glow]),.feat:not([data-glow])').forEach(function (c) {
      c.setAttribute('data-glow', '1');
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }
  var headIns = document.querySelectorAll('.head [data-in]');
  function enterHead() {
    headIns.forEach(function (el) { el.classList.add('in'); });
    var rule = document.querySelector('.head .rule'); if (rule) rule.classList.add('in');
    setTimeout(function () { headIns.forEach(function (el) { el.style.setProperty('--d', '0ms'); }); }, 1400);
  }
  var started = false;
  function startOnce() { if (started) return; started = true; requestAnimationFrame(enterHead); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(startOnce);
  setTimeout(startOnce, 900);
  var bar = document.querySelector('.progress i'), ticking = false;
  if (bar) addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min((scrollY || 0) / max, 1) : 0) + ')';
      ticking = false;
    });
  }, { passive: true });

  /* ---------- البحث ---------- */
  if (els.q) {
    var t;
    els.q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(render, 140); });
    els.q.addEventListener('keydown', function (e) { if (e.key === 'Escape') { els.q.value = ''; render(); } });
  }
  if (els.reset) els.reset.addEventListener('click', function () {
    if (els.q) els.q.value = ''; activeSec = '';
    if (els.chips) [].forEach.call(els.chips.children, function (c) { c.setAttribute('aria-pressed', String(!c.dataset.sec)); });
    render(); if (els.q) els.q.focus();
  });

  /* ---------- بوّابةُ الحقيبة ---------- */
  function sha256(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function unlock() {
    try { sessionStorage.setItem('ed_haq', '1'); } catch (e) { }
    els.gate.hidden = true; els.content.hidden = false; start();
  }
  function initGate() {
    var opened = false;
    try { opened = sessionStorage.getItem('ed_haq') === '1'; } catch (e) { }
    var k = new URLSearchParams(location.search).get('k');
    if (opened) return unlock();
    var form = els.gate.querySelector('form'), inp = els.gate.querySelector('input'), err = els.gate.querySelector('.err');
    function tryKey(v) {
      if (!v) return;
      var hash = (D.lock && D.lock.hash) || '';
      sha256(v.trim()).then(function (h) {
        if (h === hash) { unlock(); if (history.replaceState) history.replaceState(null, '', location.pathname); }
        else { err.textContent = 'المفتاحُ غيرُ صحيح — حاولْ مرّةً أخرى.'; els.gate.classList.remove('shake'); void els.gate.offsetWidth; els.gate.classList.add('shake'); inp.select(); }
      });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); tryKey(inp.value); });
    if (D.lock && D.lock.hint) els.gate.querySelector('.hint').textContent = D.lock.hint;
    if (k) tryKey(k); else inp.focus();
    var lockBtn = document.getElementById('relock');
    if (lockBtn) lockBtn.addEventListener('click', function () { try { sessionStorage.removeItem('ed_haq'); } catch (e) { } location.reload(); });
  }
})();
