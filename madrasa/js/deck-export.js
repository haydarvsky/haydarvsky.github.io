/* ===== مدرستي — تنزيلُ العرضِ التقديميِّ ملفَّ HTML واحداً يعملُ بلا إنترنتٍ وبلا دخول =====
   يأخذُ deck.html نفسَه، ويضمِّنُ فيه بياناتِ العرضِ والخطوطَ والشعار،
   ويُسقِطُ سكربتاتِ الدخولِ والبصمة، ويضعُ قائمةَ فصولِ المعلّمِ للمنتقي العشوائي. */
(function () {
  'use strict';
  var FONTS = ['sakkal-400', 'sakkal-700', 'poster-700', 'poster-900'];

  function b64(buf) {
    var bytes = new Uint8Array(buf), out = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) out += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(out);
  }
  function get(url, as) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('تعذّر تحميلُ ' + url);
      return as === 'buf' ? r.arrayBuffer() : as === 'json' ? r.json() : r.text();
    });
  }
  /* JSON آمنٌ داخلَ <script> */
  function js(v) { return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
  function safeName(n) { return String(n || 'العرض').replace(/[\/\\#?%*:|"<>\n]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80); }

  function classes() {
    if (!(window.FB && FB.DB && FB.teacher && (FB.teacher() || FB.demo))) return Promise.resolve([]);
    return FB.DB.list('sc_classes' + (FB.ws ? FB.ws() : '')).then(function (l) {
      return (l || []).filter(function (c) { return !c.archived; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function (c) { return { _id: c._id, name: c.name, order: c.order || 0, students: (c.students || []).map(function (s) { return { id: s.id, name: s.name, no: s.no || '' }; }) }; });
    }).catch(function () { return []; });
  }

  /* توقيتُ حصصِ المعلّم — لتعملَ ساعةُ العرضِ في النسخةِ المنزَّلةِ كما تعملُ في الموقع */
  function times() {
    try {
      var core = JSON.parse(localStorage.getItem('sc_core_v1' + (FB.ws ? FB.ws() : '')) || 'null');
      var st = core && core.settings;
      if (!st) return null;
      return { times: st.times || null, marks: st.marks || null };
    } catch (e) { return null; }
  }

  function build(id, base) {
    base = base || '';
    return Promise.all([
      get(base + 'deck.html'),
      get(base + 'data/decks/' + encodeURIComponent(id) + '.json', 'json'),
      Promise.all(FONTS.map(function (f) { return get('/fonts/' + f + '.woff2', 'buf'); })),
      get('/img/logo-cream.svg'),
      classes()
    ]).then(function (r) {
      var html = r[0], deck = r[1], fonts = r[2], logo = r[3], cls = r[4];
      var me = (window.FB && FB.profile) ? FB.profile() : null;
      FONTS.forEach(function (f, i) { html = html.split("url('/fonts/" + f + ".woff2')").join("url(data:font/woff2;base64," + b64(fonts[i]) + ")"); });
      var logoURI = 'data:image/svg+xml;base64,' + b64(new TextEncoder().encode(logo));
      html = html.split('/img/logo-cream.svg').join(logoURI);
      /* لا دخولَ ولا بصمةَ في الملفِّ المنزَّل */
      html = html.replace(/<script src="js\/(fb|bio)\.js[^"]*"><\/script>\s*/g, '');
      var env = { deck: deck, id: id, me: me ? { name: me.name, short: me.short, school: me.school } : null, classes: cls, settings: times(), at: new Date().toISOString() };
      html = html.replace('<script>\n(function(){', '<script>window.__DECK_OFFLINE__=' + js(env) + ';</script>\n<script>\n(function(){');
      if (html.indexOf('__DECK_OFFLINE__') < 0) throw new Error('بنيةُ ملفِّ العرضِ تغيّرت — تعذّر التضمين');
      return { html: html, name: 'عرض — ' + safeName(deck.title || id) + '.html' };
    });
  }

  function download(id, opts) {
    opts = opts || {};
    return build(id, opts.base).then(function (out) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([out.html], { type: 'text/html;charset=utf-8' }));
      a.download = out.name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      return out;
    });
  }

  window.DeckExport = { build: build, download: download };
})();
