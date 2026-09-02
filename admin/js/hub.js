/* ===== مركزُ التحكّم: رمزٌ واحدٌ لكلِّ اللوحات + بوّابةُ المحرّرِ المرئي ===== */
(function () {
  'use strict';
  var ROOT = 'https://haydarvsky.github.io';
  var OWNER = 'haydarvsky';
  var KEYS = ['hv_token', 'ar_token', 'br_token', 'vd_token', 'bg_token', 'ed_token'];
  var AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function arNum(n) { return String(n).replace(/[0-9]/g, function (d) { return AR[+d]; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  var $ = function (id) { return document.getElementById(id); };

  var I = {
    home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14.5 3.5V8H19"/><path d="M8 12h8M8 15.5h8M8 8.5h3"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5.5h5.5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2H4z"/><path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z"/></svg>',
    brand: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="8.6" r="1.5"/><circle cx="8.8" cy="13.4" r="1.5"/><circle cx="15.2" cy="13.4" r="1.5"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M14 12l-4-2.4v4.8z"/></svg>',
    edu: '<svg viewBox="0 0 24 24"><path d="M12 4.5L21 9l-9 4.5L3 9z"/><path d="M6.5 11v4.6c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4V11"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    open: '<svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
  };

  /* الأقسامُ ومستودعاتُها */
  var CARDS = [
    { key: 'home', repo: 'haydarvsky.github.io', ico: 'home', title: 'الصفحةُ الرئيسة', desc: 'النبذةُ والأدوارُ وبطاقاتُ الأقسام وروابطُ التواصل — عدِّلْ نصوصَها في مكانِها.', view: ROOT + '/', edit: 'index.html' },
    { key: 'articles', repo: 'articles', ico: 'doc', title: 'المقالات', desc: 'فهرسُ المقالات: إضافةٌ وترتيبٌ وتصنيفٌ وأغلفة، وتحريرُ نصِّ أيِّ مقالةٍ في مكانِه.', view: ROOT + '/articles/', admin: ROOT + '/articles/admin.html', data: 'data/articles.json', count: 'articles', unit: ['مقالة', 'مقالتان', 'مقالات'] },
    { key: 'books', repo: 'books', ico: 'book', title: 'معرضُ الكتب', desc: 'الرفُّ ثلاثيُّ الأبعاد: الأغلفةُ والكعوبُ وفتحاتُ التنضيد وفلسفةُ الغلاف.', view: ROOT + '/books/', admin: ROOT + '/books/admin.html', data: 'data/books.json', count: 'books', unit: ['كتاب', 'كتابان', 'كتب'] },
    { key: 'brand', repo: 'brand', ico: 'brand', title: 'معرضُ الهويات', desc: 'الشعاراتُ ولوحاتُ الألوانِ والخطوطُ وما سُلِّم لكلِّ علامة.', view: ROOT + '/brand/', admin: ROOT + '/brand/admin.html', data: 'data/brands.json', count: 'brands', unit: ['هوية', 'هويتان', 'هويات'] },
    { key: 'videos', repo: 'videos', ico: 'video', title: 'المكتبةُ المرئية', desc: 'مقاطعُ يوتيوب بأغلفتِها وتصنيفاتِها — ألصقِ الرابطَ فيُجلَبُ العنوانُ والغلاف.', view: ROOT + '/videos/', admin: ROOT + '/videos/admin.html', data: 'data/videos.json', count: 'videos', unit: ['مقطع', 'مقطعان', 'مقاطع'] },
    { key: 'edu', repo: 'haydarvsky.github.io', ico: 'edu', title: 'المكتبةُ التعليمية', desc: 'الدروسُ والألعابُ والتمارين بأقسامِها، والحقيبةُ التدريبيةُ المقفلةُ بمفتاح.', view: ROOT + '/edu/', admin: ROOT + '/edu/admin.html', data: 'edu/data/edu.json', count: 'items', edit: 'edu/index.html', unit: ['مادّة', 'مادّتان', 'موادّ'] },
    { key: 'haqiba', repo: 'CCUAi', ico: 'lock', title: 'الحقيبةُ التدريبية', dark: true, desc: 'دورةُ إعدادِ مدرِّب (TOT) ودورةُ صناعةِ المحتوى (CCUAi) وورشةُ المعلِّم الذكي — تُدارُ موادُّها من لوحةِ المكتبةِ التعليمية، وصفحاتُ الدورتين تُحرَّرُ من هنا.', view: ROOT + '/edu/haqiba.html', links: [{ t: 'موقعُ CCUAi', u: ROOT + '/CCUAi/' }, { t: 'أدواتُ TOT', u: ROOT + '/TOT/' }], edit: 'index.html' }
  ];
  var REPOS = ['haydarvsky.github.io', 'articles', 'books', 'brand', 'videos', 'CCUAi', 'TOT'];

  function say(msg, kind) {
    var s = $('status'); s.textContent = msg; s.className = 'status show' + (kind ? ' ' + kind : '');
    if (kind) setTimeout(function () { s.className = 'status'; }, 5200);
  }
  function getToken() { for (var i = 0; i < KEYS.length; i++) { var v = localStorage.getItem(KEYS[i]); if (v) return v; } return ''; }
  function setToken(t) { KEYS.forEach(function (k) { localStorage.setItem(k, t); }); localStorage.setItem('hv_owner', '1'); }

  function boot() {
    var t = getToken();
    if (!t) { $('gate').hidden = false; return; }
    connect(t, true);
  }
  function connect(token, quiet) {
    var gh = new GhApi({ owner: OWNER, repo: 'haydarvsky.github.io', token: token });
    if (!quiet) say('جارٍ التحقّقُ من الرمز…');
    gh.check().then(function (info) {
      if (!info.canPush) throw new Error('الرمزُ لا يملكُ صلاحيةَ الكتابة');
      setToken(token);
      $('gate').hidden = true; $('app').hidden = false; $('forget').hidden = false;
      $('who').textContent = info.user ? ('متّصلٌ باسم ' + info.user) : 'متّصل';
      if (!quiet) say('اتّصلَ الرمزُ وحُفِظَ لكلِّ اللوحات ✓', 'ok');
      renderHub(); loadCounts(); initPicker(token);
    }).catch(function (e) {
      $('gate').hidden = false; $('app').hidden = true;
      say('تعذّرَ الاتصال: ' + e.message, 'bad');
    });
  }
  $('tokenSave').addEventListener('click', function () { var t = $('token').value.trim(); if (!t) { $('token').focus(); return; } connect(t); });
  $('token').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('tokenSave').click(); });
  $('forget').addEventListener('click', function () {
    if (!confirm('حذفُ الرمزِ من هذا المتصفّح؟ ستحتاجُ إلى إدخالِه من جديد.')) return;
    KEYS.forEach(function (k) { localStorage.removeItem(k); }); localStorage.removeItem('hv_owner');
    location.reload();
  });

  function editUrl(repo, path) { return 'editor.html?repo=' + encodeURIComponent(repo) + '&path=' + encodeURIComponent(path); }

  function renderHub() {
    $('hub').innerHTML = CARDS.map(function (c) {
      var acts = '';
      if (c.admin) acts += '<a class="btn btn-gold" href="' + c.admin + '">' + I.gear + ' لوحةُ القسم</a>';
      if (c.edit) acts += '<a class="btn btn-line" href="' + editUrl(c.repo, c.edit) + '">' + I.edit + ' تحريرُ النصوص</a>';
      else acts += '<a class="btn btn-line" href="' + editUrl(c.repo, 'index.html') + '">' + I.edit + ' تحريرُ صفحةِ القسم</a>';
      acts += '<a class="btn btn-line" href="' + c.view + '" target="_blank" rel="noopener">عرض ' + I.open + '</a>';
      (c.links || []).forEach(function (l) { acts += '<a class="btn btn-line" href="' + l.u + '" target="_blank" rel="noopener">' + esc(l.t) + ' ' + I.open + '</a>'; });
      return '<article class="hcard' + (c.dark ? ' dark' : '') + '" id="card-' + c.key + '">'
        + '<span class="ico">' + I[c.ico] + '</span>'
        + '<h2>' + esc(c.title) + '</h2>'
        + '<span class="n" id="n-' + c.key + '"></span>'
        + '<p>' + esc(c.desc) + '</p>'
        + '<div class="acts">' + acts + '</div></article>';
    }).join('');
  }

  function unitOf(n, u) { return n === 1 ? u[0] : (n === 2 ? u[1] : u[2]); }
  function loadCounts() {
    CARDS.forEach(function (c) {
      if (!c.data) return;
      var base = c.repo === 'haydarvsky.github.io' ? ROOT + '/' : ROOT + '/' + c.repo + '/';
      fetch(base + c.data, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
        var arr = d[c.count] || [];
        var n = arr.length, hid = arr.filter(function (x) { return x.hidden; }).length;
        $('n-' + c.key).innerHTML = '<b>' + arNum(n) + '</b> ' + unitOf(n, c.unit) + (hid ? ' — منها ' + arNum(hid) + ' مخفيّة' : '') + (d.updated ? ' · آخرُ تحديث ' + arNum(d.updated) : '');
      }).catch(function () { $('n-' + c.key).textContent = ''; });
    });
  }

  /* بوّابةُ المحرّر: قائمةُ ملفّاتِ HTML في المستودع */
  var treeCache = {};
  function initPicker(token) {
    var sel = $('repo');
    sel.innerHTML = REPOS.map(function (r) { return '<option value="' + r + '">' + r + '</option>'; }).join('');
    function load() {
      var repo = sel.value;
      $('files').innerHTML = '<span class="tip">جارٍ القراءة…</span>';
      var p = treeCache[repo] || (treeCache[repo] = new GhApi({ owner: OWNER, repo: repo, token: token }).tree());
      p.then(function (m) {
        var list = Array.from(m.keys()).filter(function (x) { return /\.html?$/i.test(x); }).sort();
        var q = $('fq').value.trim();
        var shown = q ? list.filter(function (x) { return x.indexOf(q) > -1; }) : list;
        $('fcount').textContent = arNum(shown.length) + ' ملفّاً';
        $('files').innerHTML = shown.slice(0, 400).map(function (x) {
          return '<a href="' + editUrl(repo, x) + '" dir="ltr">' + esc(x) + '</a>';
        }).join('') || '<span class="tip">لا ملفَّ يُطابق</span>';
      }).catch(function (e) { $('files').innerHTML = '<span class="tip">تعذّرت القراءة: ' + esc(e.message) + '</span>'; });
    }
    sel.addEventListener('change', load);
    var t; $('fq').addEventListener('input', function () { clearTimeout(t); t = setTimeout(load, 160); });
    load();
  }

  boot();
})();
