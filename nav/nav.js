/* ===== شريطُ التنقّل الموحَّد لصفحاتِ حيدر المعاتيق =====
   يُحمَّل بسطرٍ واحد في أيِّ صفحة:
   <script src="https://haydarvsky.github.io/nav/nav.js" defer></script>
   وسومٌ اختيارية في <head>:
   <meta name="hv-nav" content="bar|mini|off">      نمطُ الشريط (الافتراضي bar)
   <meta name="hv-title" content="…">                عنوانُ الصفحة في المسار
   <meta name="hv-parent" content="/edu/haqiba.html"> الصفحةُ الأمّ (للرجوع والمسار)
   <meta name="hv-parent-title" content="…">
   <meta name="hv-section" content="edu">            القسمُ يدوياً
*/
(function () {
  'use strict';
  if (window.HVNav) return;
  var ROOT = 'https://haydarvsky.github.io';
  var LOGO = ROOT + '/img/logo-cream.svg';
  var STORE = 'https://haydarvsky.gumroad.com/';

  var I = {
    home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14.5 3.5V8H19"/><path d="M8 12h8M8 15.5h8M8 8.5h3"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5.5h5.5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2H4z"/><path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z"/></svg>',
    brand: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="8.6" r="1.5"/><circle cx="8.8" cy="13.4" r="1.5"/><circle cx="15.2" cy="13.4" r="1.5"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M14 12l-4-2.4v4.8z"/></svg>',
    edu: '<svg viewBox="0 0 24 24"><path d="M12 4.5L21 9l-9 4.5L3 9z"/><path d="M6.5 11v4.6c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4V11"/></svg>',
    harf: '<svg viewBox="0 0 24 24"><path d="M5 18c3-1 5-4 6-8M9 6c2 5 5 9 10 10"/><circle cx="12" cy="4.5" r="1" fill="currentColor"/></svg>',
    store: '<svg viewBox="0 0 24 24"><path d="M4.5 8h15l-1.2 11.5H5.7z"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
    out: '<svg class="hv-out" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    tot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    ai: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>'
  };

  var SEC = {
    '':        { t: 'الرئيسة',            p: '/',           admin: '/admin/',            ico: 'home' },
    articles:  { t: 'المقالات',           p: '/articles/',  admin: '/articles/admin.html', ico: 'doc',   d: 'قراءاتٌ وتحقيقات' },
    books:     { t: 'معرضُ الكتب',        p: '/books/',     admin: '/books/admin.html',  ico: 'book',  d: 'أغلفةٌ وتنضيد' },
    brand:     { t: 'معرضُ الهويات',      p: '/brand/',     admin: '/brand/admin.html',  ico: 'brand', d: 'شعاراتٌ وأنظمةُ هوية' },
    videos:    { t: 'المكتبةُ المرئية',   p: '/videos/',    admin: '/videos/admin.html', ico: 'video', d: 'محاضراتٌ ولقاءات' },
    edu:       { t: 'المكتبةُ التعليمية', p: '/edu/',       admin: '/edu/admin.html',    ico: 'edu',   d: 'دروسٌ وألعابٌ وحقائب' },
    alharf:    { t: 'محرّكُ الحرف',       p: '/alharf/',    ico: 'harf', d: 'عرضُ مجمعِ الملكِ سلمان' },
    TOT:       { t: 'دورةُ إعدادِ مدرِّب', p: '/edu/haqiba.html', ico: 'tot', hide: true },
    CCUAi:     { t: 'دورةُ صناعةِ المحتوى', p: '/CCUAi/',   ico: 'ai',  hide: true },
    admin:     { t: 'لوحةُ التحكّم',      p: '/admin/',     ico: 'gear', hide: true }
  };
  var MENU = ['', 'articles', 'books', 'brand', 'videos', 'edu', 'alharf'];

  function meta(n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? (m.getAttribute('content') || '').trim() : ''; }
  function isOwner() {
    try {
      return !!(localStorage.getItem('hv_owner') || localStorage.getItem('hv_token') || localStorage.getItem('ar_token')
        || localStorage.getItem('br_token') || localStorage.getItem('vd_token') || localStorage.getItem('bg_token') || localStorage.getItem('ed_token'));
    } catch (e) { return false; }
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function clean(t) { return String(t || '').replace(/\s*[—|·-]\s*(حيدر المعاتيق|أ\. حيدر المعاتيق|إعداد أ\. حيدر المعاتيق|حيدر)\s*$/, '').replace(/\s+/g, ' ').trim(); }

  function build() {
    if (document.querySelector('.hv-nav')) return;
    var mode = meta('hv-nav') || 'bar';
    if (mode === 'off') return;
    try { if (/[?&]nav=0/.test(location.search)) return; } catch (e) { }

    /* ورقةُ التنسيق */
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = ROOT + '/nav/nav.css';
    document.head.appendChild(css);
    /* أيقونةُ التبويب إن لم تكن للصفحةِ أيقونة (يمنعُ طلبَ favicon.ico الفاشل) */
    if (!document.querySelector('link[rel~="icon"]')) { var ic = document.createElement('link'); ic.rel = 'icon'; ic.href = LOGO; document.head.appendChild(ic); }

    var path = location.pathname;
    var seg = meta('hv-section') || (path.split('/')[1] || '');
    if (!SEC[seg]) seg = '';
    var sec = SEC[seg];
    var atSecRoot = (path === sec.p) || (path === sec.p + 'index.html') || (seg === '' && (path === '/' || path === '/index.html'));
    var parent = meta('hv-parent'), parentTitle = meta('hv-parent-title');
    /* عنوانُ الصفحةِ في المسار: الوسمُ ثمّ h1 (إن كان قصيراً) ثمّ عنوانُ التبويب */
    var h1 = document.querySelector('h1'), h1t = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
    var pageTitle = meta('hv-title') || ((h1t && h1t.length <= 70) ? h1t : clean(document.title));
    var backUrl = parent ? (parent.charAt(0) === '/' ? ROOT + parent : parent) : (seg ? ROOT + sec.p : ROOT + '/');
    var adminUrl = ROOT + (sec.admin || '/admin/');

    /* المسار */
    var crumbs = '<li><a href="' + ROOT + '/">' + esc(SEC[''].t) + '</a></li>';
    if (seg) crumbs += '<li>' + (atSecRoot ? '<span aria-current="page">' + esc(sec.t) + '</span>' : '<a href="' + ROOT + sec.p + '">' + esc(sec.t) + '</a>') + '</li>';
    if (parent && parentTitle) crumbs += '<li><a href="' + esc(backUrl) + '">' + esc(parentTitle) + '</a></li>';
    if (!atSecRoot && pageTitle && pageTitle !== sec.t) crumbs += '<li><span aria-current="page" title="' + esc(pageTitle) + '">' + esc(pageTitle) + '</span></li>';

    /* قائمةُ الأقسام */
    var items = MENU.map(function (k) {
      var s = SEC[k];
      return '<a href="' + ROOT + s.p + '"' + (k === seg ? ' aria-current="page"' : '') + '><span class="hv-i">' + I[s.ico] + '</span><span>' + esc(s.t) + (s.d ? '<small>' + esc(s.d) + '</small>' : '') + '</span></a>';
    }).join('')
      + '<a class="hv-ext" href="' + STORE + '" target="_blank" rel="noopener"><span class="hv-i">' + I.store + '</span><span>متجرُ السكربتات<small>أدواتُ إنديزاين</small></span>' + I.out + '</a>'
      + (isOwner() ? '<span class="hv-sep"></span><a href="' + ROOT + '/admin/"' + (seg === 'admin' ? ' aria-current="page"' : '') + '><span class="hv-i">' + I.gear + '</span><span>لوحةُ التحكّم<small>كلُّ الأقسامِ من مكانٍ واحد</small></span></a>' : '');

    var acts = '<button type="button" class="hv-btn hv-back"><span class="hv-tx">رجوع</span>' + I.back + '</button>'
      + '<div class="hv-menu"><button type="button" class="hv-btn hv-menu-btn" aria-haspopup="true" aria-expanded="false" aria-controls="hv-pop">' + I.grid + '<span class="hv-tx">الأقسام</span></button>'
      + '<div class="hv-pop" id="hv-pop" role="menu">' + items + '</div></div>'
      + (isOwner() ? '<a class="hv-btn hv-gear" href="' + adminUrl + '" title="لوحةُ التحكّم" aria-label="لوحةُ التحكّم">' + I.gear + '</a>' : '');

    var nav;
    if (mode === 'mini') {
      nav = el('<nav class="hv-nav hv-mini" aria-label="التنقّل في الموقع"><div class="hv-in">'
        + '<div class="hv-pill"><button type="button" class="hv-toggle" aria-expanded="false" aria-label="قائمةُ التنقّل"><img src="' + LOGO + '" alt=""></button>'
        + '<div class="hv-chips"><a class="hv-btn" href="' + ROOT + '/">' + I.home + '<span class="hv-tx">الرئيسة</span></a>'
        + (seg ? '<a class="hv-btn" href="' + esc(backUrl) + '">' + I[sec.ico] + '<span class="hv-tx">' + esc(parentTitle || sec.t) + '</span></a>' : '')
        + '<div class="hv-acts">' + acts + '</div></div></div>'
        + '</div></nav>');
      document.body.appendChild(nav);
      var pill = nav.querySelector('.hv-pill'), tg = nav.querySelector('.hv-toggle');
      tg.addEventListener('click', function () { var on = !pill.classList.contains('on'); pill.classList.toggle('on', on); tg.setAttribute('aria-expanded', String(on)); if (!on) closePop(); });
    } else {
      nav = el('<nav class="hv-nav" aria-label="التنقّل في الموقع"><div class="hv-in">'
        + '<a class="hv-logo" href="' + ROOT + '/" aria-label="الصفحةُ الرئيسة"><img src="' + LOGO + '" alt=""></a>'
        + '<ol class="hv-crumbs" aria-label="مسارُ الصفحة">' + crumbs + '</ol>'
        + '<div class="hv-acts">' + acts + '</div>'
        + '</div></nav>');
      document.body.insertBefore(nav, document.body.firstChild);
      /* عناصرُ الصفحةِ اللاصقةُ في الأعلى تنزلُ تحتَ الشريط — يُقاسُ ارتفاعُه بعد وصولِ ورقتِه لا قبلَها */
      var fixed = false;
      function fixSticky() {
        if (fixed) return; fixed = true;
        var h = Math.min(nav.offsetHeight || 53, 80);
        Array.prototype.forEach.call(document.body.children, function (c) {
          if (c === nav) return;
          var cs = getComputedStyle(c);
          if (cs.position === 'sticky' && parseInt(cs.top, 10) === 0) c.style.top = h + 'px';
        });
      }
      css.addEventListener('load', function () { requestAnimationFrame(fixSticky); });
      css.addEventListener('error', function () { fixed = true; });
      setTimeout(function () { if (!fixed && css.sheet) fixSticky(); }, 2500);
    }

    /* الرجوع: إلى الصفحةِ السابقةِ إن كانت من الموقع، وإلا إلى الأمّ */
    nav.querySelector('.hv-back').addEventListener('click', function () {
      var ref = document.referrer || '';
      var sameSite = ref.indexOf(location.origin) === 0 && ref !== location.href;
      if (sameSite && history.length > 1) history.back(); else location.href = backUrl;
    });

    /* القائمة */
    var btn = nav.querySelector('.hv-menu-btn'), pop = nav.querySelector('.hv-pop');
    function openPop() { pop.classList.add('on'); btn.setAttribute('aria-expanded', 'true'); var f = pop.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
    function closePop() { pop.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); pop.classList.contains('on') ? closePop() : openPop(); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closePop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop.classList.contains('on')) { closePop(); btn.focus(); } });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });

    window.HVNav = { section: seg, back: backUrl, admin: adminUrl, nav: nav };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
