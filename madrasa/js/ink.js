/* ===== مدرستي — أدواتُ الشرحِ على العروض: قلمٌ بأربعةِ ألوانٍ وثلاثِ سماكات، ليزرٌ بأثرٍ يتلاشى، ممحاة، تراجع، مسحُ رسمِ الشريحة =====
   ملفٌّ واحدٌ يحقنُ واجهتَه وأنماطَه بنفسِه، ويعملُ في العرضِ والدرسِ التفاعليِّ والعروضِ المرفوعةِ والنسخِ المنزَّلة.
   رسمُ كلِّ شريحةٍ يُحفَظُ في sessionStorage (للتبويبِ وحدَه) فلا ينتقلُ رسمُ فصلٍ إلى فصلٍ آخر.

     HVInk.init({ host, anchor })  اختياريّ: host عنصرٌ يُرسَمُ فوقَه وحدَه (لا تُغطّى أزرارُ الصفحة)،
                                   anchor: 'c' المحتوى يتوسّطُ الشاشةَ ويكبرُ معها · 't' صفحةٌ تُمرَّرُ من أعلاها
                                   (أو data-anchor على وسمِ السكربت). بلا استدعاءٍ يُقلِعُ وحدَه.
     HVInk.setKey('s3')            تستدعيه الصفحةُ عند تغيُّرِ الشريحة؛ وإلا اكتُشفتِ الشريحةُ الظاهرةُ وحدَها.

   الاختصارات: P القلم · L الليزر · E الممحاة · Esc المؤشّر · Z أو ⌘Z تراجع · X مسحُ رسمِ الشريحة · Shift+1…4 الألوان
   (لا تتعارضُ مع اختصاراتِ العرض: الأرقامُ وW R S C O F T N + −) */
(function () {
  'use strict';
  if (window.HVInk) return;
  /* داخلَ السبّورةِ الناطقةِ (إطار) لها أدواتُها — فلا شريطَ ثانياً */
  var FRAMED = false; try { FRAMED = window.top !== window; } catch (e) { FRAMED = true; }
  var ME = document.currentScript;

  var PENS = [['#15181A', 'أسود'], ['#FFFFFF', 'أبيض'], ['#2F6BF2', 'أزرق'], ['#E5383B', 'أحمر']];
  var PW = [3, 6, 11], PWN = ['رفيع', 'متوسّط', 'عريض'], ERW = 36;
  var O = { host: null, anchor: (ME && ME.dataset.anchor) || 'auto' };
  var SET = { pen: '#E5383B', pw: 1, open: true };
  try { var sv = JSON.parse(localStorage.getItem('hvink_set') || 'null'); if (sv) { if (PENS.some(function (p) { return p[0] === sv.pen; })) SET.pen = sv.pen; if (sv.pw >= 0 && sv.pw < 3) SET.pw = sv.pw; SET.open = sv.open !== false; } } catch (e) { }
  function saveSet() { try { localStorage.setItem('hvink_set', JSON.stringify(SET)); } catch (e) { } }

  var TOOL = 'pointer', KEY = 'page', MANUAL = false, BOOTED = false;
  var DOC = 'hvink:' + location.pathname + location.search;
  var DATA = {}; try { DATA = JSON.parse(sessionStorage.getItem(DOC) || '{}') || {}; } catch (e) { DATA = {}; }
  var UNDO = {};
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { sessionStorage.setItem(DOC, JSON.stringify(DATA)); } catch (e) { } }, 250); }
  function strokes() { return DATA[KEY] || (DATA[KEY] = []); }
  function undos() { return UNDO[KEY] || (UNDO[KEY] = []); }

  var CSS = ''
    + '.hvink-layer{position:fixed;inset:0;z-index:2147482000;pointer-events:none}'
    + '.hvink-layer.in-host{position:absolute;z-index:40}'
    + '.hvink-layer canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none}'
    + 'html.hvink-t-pen .hvink-cv{pointer-events:auto;cursor:var(--hvink-pen,crosshair)}'
    + 'html.hvink-t-eraser .hvink-cv{pointer-events:auto;cursor:var(--hvink-er,cell)}'
    + 'html.hvink-t-laser .hvink-lz{pointer-events:auto;cursor:none}'
    + 'html.hvink-t-pen,html.hvink-t-eraser,html.hvink-t-laser{-webkit-user-select:none;user-select:none}'
    + '.hvink-bar,.hvink-pens{position:fixed;left:clamp(8px,1.2vw,18px);top:50%;z-index:2147483000;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px;border-radius:20px;'
    + 'background:rgba(5,30,22,.72);border:1px solid rgba(226,176,79,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 18px 40px -22px rgba(0,0,0,.7);'
    + "font-family:'Sakkal Saad',system-ui,sans-serif;direction:rtl;color:#F4EEE1;transform:translateY(-50%);transition:opacity .35s,transform .3s cubic-bezier(.22,.61,.36,1)}"
    + '.hvink-bar *,.hvink-pens *{box-sizing:border-box}'
    + '.hvink-bar.idle{opacity:.32}.hvink-bar.idle:hover{opacity:1}'
    + ':where(.hvink-bar,.hvink-pens) button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.hvink-tb{width:clamp(34px,2.8vw,44px);height:clamp(34px,2.8vw,44px);border-radius:14px;display:grid!important;place-items:center;color:rgba(244,238,225,.78);position:relative;transition:background .2s,color .2s}'
    + '.hvink-tb svg{width:52%;height:52%;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}'
    + '.hvink-tb:hover{background:rgba(255,255,255,.1);color:#fff}'
    + '.hvink-tb[aria-pressed=true]{background:#E2B04F;color:#1F1505}'
    + '.hvink-tb .sw{position:absolute;bottom:5px;left:50%;width:15px;height:4px;margin-left:-7.5px;border-radius:3px;background:var(--hvink-c,#E5383B);box-shadow:0 0 0 1px rgba(0,0,0,.3)}'
    + '.hvink-tb .tip{position:absolute;left:calc(100% + 12px);top:50%;transform:translate(-4px,-50%);white-space:nowrap;background:#06261D;color:#F4EEE1;font-size:14px;line-height:1.5;padding:4px 10px 6px;border-radius:8px;border:1px solid rgba(226,176,79,.25);opacity:0;pointer-events:none;transition:.18s}'
    + '.hvink-tb .tip kbd{font:inherit;opacity:.6;margin-inline-start:7px}'
    + '.hvink-tb:hover .tip{opacity:1;transform:translate(0,-50%)}'
    + 'html.hvink-t-pen .hvink-bar .hvink-tb:hover .tip{opacity:0}'
    + '.hvink-sep{width:60%;height:1px;background:rgba(244,238,225,.14);margin:3px 0}'
    + '.hvink-bar .more{display:contents}'
    + '.hvink-bar.shut .more{display:none}'
    + '.hvink-bar.shut .hvink-fold svg{transform:rotate(180deg)}'
    + '.hvink-fold{height:22px!important;border-radius:9px!important}.hvink-fold svg{width:15px!important;transition:transform .25s}'
    + '.hvink-pens{left:calc(clamp(8px,1.2vw,18px) + clamp(34px,2.8vw,44px) + 24px);gap:7px;padding:10px 8px;border-radius:18px;opacity:0;pointer-events:none;transform:translate(-10px,-50%)}'
    + 'html.hvink-t-pen .hvink-pens{opacity:1;pointer-events:auto;transform:translate(0,-50%)}'
    + '.hvink-pc{width:28px;height:28px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 1px rgba(0,0,0,.3),inset 0 0 0 2px rgba(255,255,255,.08);transition:transform .15s,box-shadow .2s}'
    + '.hvink-pc:hover{transform:scale(1.1)}'
    + '.hvink-pc[aria-pressed=true]{box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),0 0 0 3px #0A3428,0 0 0 5px #E2B04F}'
    + '.hvink-pw{width:30px;height:24px;display:grid!important;place-items:center;border-radius:8px}'
    + '.hvink-pw i{display:block;width:var(--s);height:var(--s);border-radius:50%;background:rgba(244,238,225,.7)}'
    + '.hvink-pw[aria-pressed=true]{background:rgba(255,255,255,.1)}.hvink-pw[aria-pressed=true] i{background:#E2B04F}'
    + '.hvink-pens .hvink-sep{width:70%}'
    + ".hvink-toast{position:fixed;left:50%;bottom:clamp(70px,11vh,110px);z-index:2147483001;transform:translate(-50%,10px);opacity:0;pointer-events:none;background:#06261D;color:#F4EEE1;border:1px solid rgba(226,176,79,.35);border-radius:999px;padding:6px 18px 8px;font:700 16px/1.5 'Sakkal Saad',system-ui,sans-serif;direction:rtl;transition:.25s;box-shadow:0 14px 30px -18px #000}"
    + '.hvink-toast.on{opacity:1;transform:translate(-50%,0)}'
    + '@media print{.hvink-layer,.hvink-bar,.hvink-pens,.hvink-toast{display:none!important}}';

  var I = {
    pointer: '<path d="M6 3.5l12.5 7-5.6 1.6-2.4 5.6z"/>',
    pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
    laser: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    eraser: '<path d="M8.5 20H20M4.6 14.6l8.8-8.8a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L12 19.8H8.8z"/><path d="M9 10.2l4.8 4.8"/>',
    undo: '<path d="M9 7h6a5 5 0 0 1 0 10H8"/><path d="M12 4L9 7l3 3"/>',
    clear: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/>',
    fold: '<path d="M6 15l6-6 6 6"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; }
  function tb(attr, k, tip, kbd, extra) { return '<button type="button" class="hvink-tb" ' + attr + ' aria-label="' + tip + '">' + svg(k) + (extra || '') + '<span class="tip">' + tip + (kbd ? '<kbd>' + kbd + '</kbd>' : '') + '</span></button>'; }

  var layer, cv, g, lz, lg, bar, pens, toastEl;

  /* ---------- الهندسة: نقاطٌ بإحداثيّاتِ اللوحة، وكلُّ خطٍّ يحملُ مقاسَ لوحتِه ومرساتَه ---------- */
  function W() { return cv.clientWidth; } function H() { return cv.clientHeight; }
  function unit(w, h) { return Math.max(1, Math.min(w / 100, h / 56.25)); }
  function sy() { return O.host ? 0 : (window.scrollY || window.pageYOffset || 0); }
  function anchorNow() {
    if (O.anchor === 'c' || O.anchor === 't') return O.anchor;
    if (O.host) return 'c';
    var de = document.documentElement; return (de.scrollHeight > innerHeight + 8) ? 't' : 'c';
  }
  function mapper(st) {
    var w = W(), h = H();
    if (st.a === 't') { var dx = w / 2 - st.W / 2, oy = -sy(); return { k: 1, f: function (q) { return { x: q[0] + dx, y: q[1] + oy }; } }; }
    var k = unit(w, h) / unit(st.W, st.H);
    return { k: k, f: function (q) { return { x: w / 2 + (q[0] - st.W / 2) * k, y: h / 2 + (q[1] - st.H / 2) * k }; } };
  }
  function penStyle(c, st, k) {
    c.globalCompositeOperation = st.m === 'e' ? 'destination-out' : 'source-over';
    c.strokeStyle = c.fillStyle = st.m === 'e' ? '#000' : st.c;
    c.lineWidth = st.w * k; c.lineCap = 'round'; c.lineJoin = 'round';
  }
  function drawStroke(c, st) {
    var m = mapper(st), P = st.p.map(m.f); if (!P.length) return;
    penStyle(c, st, m.k);
    if (P.length === 1) { c.beginPath(); c.arc(P[0].x, P[0].y, st.w * m.k / 2, 0, Math.PI * 2); c.fill(); return; }
    c.beginPath(); c.moveTo(P[0].x, P[0].y);
    for (var i = 1; i < P.length; i++) { var a = P[i - 1], b = P[i]; c.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2); }
    c.lineTo(P[P.length - 1].x, P[P.length - 1].y); c.stroke();
  }
  function redraw() {
    if (!g) return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore();
    (DATA[KEY] || []).forEach(function (st) { drawStroke(g, st); });
    g.globalCompositeOperation = 'source-over';
  }
  function size() {
    if (!cv) return;
    var d = Math.min(2, window.devicePixelRatio || 1);
    [cv, lz].forEach(function (c) { c.width = Math.max(1, Math.round(c.clientWidth * d)); c.height = Math.max(1, Math.round(c.clientHeight * d)); c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); });
    redraw();
  }
  /* offsetX/Y بإحداثيّاتِ العنصرِ نفسِه — تصحُّ مع تدويرِ العرضِ ٩٠° */
  function pt(e) { return { x: e.offsetX, y: e.offsetY }; }

  /* ---------- القلمُ والممحاة ---------- */
  var D = { on: false };
  function stored(p, st) { return [Math.round(p.x * 10) / 10, Math.round((st.a === 't' ? p.y + sy() : p.y) * 10) / 10]; }
  function down(e) {
    if ((TOOL !== 'pen' && TOOL !== 'eraser') || e.button > 0) return;
    e.preventDefault(); e.stopPropagation(); try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    var p = pt(e), st = { m: TOOL === 'eraser' ? 'e' : 'p', c: SET.pen, w: TOOL === 'eraser' ? ERW : PW[SET.pw], a: anchorNow(), W: W(), H: H(), p: [] };
    st.p.push(stored(p, st));
    D = { on: true, id: e.pointerId, st: st, last: p, mid: p, key: KEY };
    penStyle(g, st, 1); g.beginPath(); g.arc(p.x, p.y, st.w / 2, 0, Math.PI * 2); g.fill();
  }
  function move(e) {
    if (!D.on || e.pointerId !== D.id) return;
    var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || []; if (!evs.length) evs = [e];
    penStyle(g, D.st, 1);
    evs.forEach(function (ev) {
      var p = pt(ev), dx = p.x - D.last.x, dy = p.y - D.last.y; if (dx * dx + dy * dy < 2) return;
      var m = { x: (D.last.x + p.x) / 2, y: (D.last.y + p.y) / 2 };
      g.beginPath(); g.moveTo(D.mid.x, D.mid.y); g.quadraticCurveTo(D.last.x, D.last.y, m.x, m.y); g.stroke();
      D.mid = m; D.last = p; D.st.p.push(stored(p, D.st));
    });
  }
  function up(e) {
    if (!D.on || (e && e.pointerId !== D.id)) return;
    D.on = false; penStyle(g, D.st, 1); g.beginPath(); g.moveTo(D.mid.x, D.mid.y); g.lineTo(D.last.x, D.last.y); g.stroke(); g.globalCompositeOperation = 'source-over';
    if (D.key !== KEY) return;
    strokes().push(D.st); undos().push({ k: 'add' }); save();
  }

  /* ---------- الليزر: أثرٌ أحمرُ متوهّجٌ يتلاشى ---------- */
  var LZ = { pts: [], head: null, raf: 0 };
  function lzClear() { LZ.head = null; LZ.pts = []; if (lg) { lg.save(); lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, lz.width, lz.height); lg.restore(); } }
  function lzMove(e) {
    if (TOOL !== 'laser') return;
    var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || []; if (!evs.length) evs = [e];
    var now = performance.now();
    evs.forEach(function (ev) { var p = pt(ev); p.t = now; LZ.pts.push(p); LZ.head = p; });
    if (!LZ.raf) LZ.raf = requestAnimationFrame(lzTick);
  }
  function lzTick(now) {
    var w = W(), h = H(), u = unit(w, h), life = 560;
    lg.clearRect(0, 0, w, h);
    LZ.pts = LZ.pts.filter(function (p) { return now - p.t < life; });
    lg.lineCap = 'round'; lg.lineJoin = 'round'; lg.shadowColor = 'rgba(255,30,30,.85)'; lg.shadowBlur = u * 1.1;
    for (var i = 1; i < LZ.pts.length; i++) {
      var a = LZ.pts[i - 1], b = LZ.pts[i], f = Math.max(0, 1 - (now - b.t) / life);
      lg.strokeStyle = 'rgba(255,' + Math.round(40 + 60 * f) + ',' + Math.round(40 + 40 * f) + ',' + (f * .9).toFixed(3) + ')';
      lg.lineWidth = Math.max(1, u * .62 * f); lg.beginPath(); lg.moveTo(a.x, a.y); lg.lineTo(b.x, b.y); lg.stroke();
    }
    if (LZ.head) {
      var hd = LZ.head, r = u * 1.05, gr = lg.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, r * 2.4);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.16, 'rgba(255,120,110,1)'); gr.addColorStop(.38, 'rgba(255,30,30,.6)'); gr.addColorStop(1, 'rgba(255,0,0,0)');
      lg.shadowBlur = 0; lg.fillStyle = gr; lg.beginPath(); lg.arc(hd.x, hd.y, r * 2.4, 0, Math.PI * 2); lg.fill();
    }
    LZ.raf = LZ.pts.length > 1 ? requestAnimationFrame(lzTick) : 0;
  }

  /* ---------- الأدوات ---------- */
  function cursorFor() {
    if (!layer) return;
    var d = Math.max(6, PW[SET.pw]), s = d + 8, c = s / 2;
    var a = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '"><circle cx="' + c + '" cy="' + c + '" r="' + (d / 2 + 1.5) + '" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1"/><circle cx="' + c + '" cy="' + c + '" r="' + d / 2 + '" fill="' + SET.pen + '" stroke="rgba(255,255,255,.9)" stroke-width="1"/></svg>';
    var e = ERW, s2 = e + 4, c2 = s2 / 2;
    var b = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s2 + '" height="' + s2 + '"><circle cx="' + c2 + '" cy="' + c2 + '" r="' + e / 2 + '" fill="rgba(255,255,255,.15)" stroke="rgba(0,0,0,.6)" stroke-width="1.5"/><circle cx="' + c2 + '" cy="' + c2 + '" r="' + (e / 2 - 1.5) + '" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="1"/></svg>';
    layer.style.setProperty('--hvink-pen', 'url("data:image/svg+xml,' + encodeURIComponent(a) + '") ' + c + ' ' + c + ', crosshair');
    layer.style.setProperty('--hvink-er', 'url("data:image/svg+xml,' + encodeURIComponent(b) + '") ' + c2 + ' ' + c2 + ', cell');
  }
  function setTool(t) {
    TOOL = (TOOL === t && t !== 'pointer') ? 'pointer' : t;
    var R = document.documentElement.classList;
    R.remove('hvink-t-pen', 'hvink-t-laser', 'hvink-t-eraser');
    if (TOOL !== 'pointer') { R.add('hvink-t-' + TOOL); if (bar && bar.classList.contains('shut')) fold(false); }
    if (bar) bar.querySelectorAll('[data-tool]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tool === TOOL ? 'true' : 'false'); });
    if (TOOL !== 'laser') lzClear();
    wake();
  }
  function penUI() {
    if (!bar) return;
    pens.querySelectorAll('[data-pen]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pen === SET.pen ? 'true' : 'false'); });
    pens.querySelectorAll('[data-pw]').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.pw === SET.pw ? 'true' : 'false'); });
    bar.style.setProperty('--hvink-c', SET.pen); cursorFor();
  }
  function setPen(c) { SET.pen = c; saveSet(); penUI(); if (TOOL !== 'pen') setTool('pen'); }
  function setPw(n) { SET.pw = n; saveSet(); penUI(); if (TOOL !== 'pen') setTool('pen'); }
  function undo() {
    var u = UNDO[KEY]; if (!u || !u.length) { toast('لا شيءَ للتراجع'); return false; }
    var a = u.pop();
    if (a.k === 'add') strokes().pop(); else DATA[KEY] = a.strokes;
    redraw(); save(); return true;
  }
  function clear() {
    var s = DATA[KEY]; if (!s || !s.length) { toast('لا رسمَ على هذه الشريحة'); return; }
    undos().push({ k: 'clear', strokes: s }); DATA[KEY] = []; redraw(); save();
    toast('مُسح رسمُ الشريحة — Z للتراجع');
  }
  var toastT = 0;
  function toast(m) {
    if (!toastEl) return;
    toastEl.textContent = m; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  }
  function fold(shut) { bar.classList.toggle('shut', shut); SET.open = !shut; saveSet(); if (shut) setTool('pointer'); }
  var idleT = 0;
  function wake() { if (!bar) return; bar.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { if (TOOL === 'pointer' && !bar.matches(':hover')) bar.classList.add('idle'); }, 2600); }

  /* ---------- مفتاحُ الشريحة ---------- */
  /* الصفحةُ قد تعيدُ بناءَ مضيفِها (innerHTML) فتُسقِطُ الطبقة — تُعادُ إليه */
  function ensure() {
    if (!layer || layer.isConnected) return;
    (O.host && O.host.isConnected ? O.host : document.body).appendChild(layer); size();
  }
  function setKey(k) {
    k = String(k == null ? 'page' : k);
    ensure();
    if (k === KEY) return;
    if (D.on) up();
    KEY = k; lzClear(); redraw();
  }
  var SEL = '.slide,.reveal .slides>section,[data-slide]';
  function autoKey() {
    var L = document.querySelectorAll(SEL), i, el;
    if (L.length > 1) {
      for (i = 0; i < L.length; i++) if (/(^|\s)(on|active|present|current)(\s|$)/.test(L[i].className && L[i].className.baseVal == null ? L[i].className : '')) return 'a' + i;
      var mid = innerHeight / 2;
      for (i = 0; i < L.length; i++) {
        el = L[i]; var r = el.getBoundingClientRect();
        if (r.width && r.height && r.top <= mid && r.bottom >= mid && r.left < innerWidth && r.right > 0) { var cs = getComputedStyle(el); if (cs.visibility !== 'hidden' && +cs.opacity > .05) return 'a' + i; }
      }
    }
    return /^#\/?\d/.test(location.hash) ? 'h' + location.hash : 'page';
  }
  var autoRaf = 0;
  function autoTick() { if (MANUAL || autoRaf) return; autoRaf = requestAnimationFrame(function () { autoRaf = 0; if (!MANUAL) setKey(autoKey()); }); }

  /* ---------- البناء ---------- */
  function mount() {
    if (BOOTED || FRAMED || !document.body) return;
    BOOTED = true;
    var st = document.createElement('style'); st.id = 'hvink-css'; st.textContent = CSS; document.head.appendChild(st);
    layer = document.createElement('div'); layer.className = 'hvink-layer' + (O.host ? ' in-host' : '');
    layer.innerHTML = '<canvas class="hvink-cv"></canvas><canvas class="hvink-lz"></canvas>';
    (O.host || document.body).appendChild(layer);
    cv = layer.firstChild; lz = layer.lastChild; g = cv.getContext('2d'); lg = lz.getContext('2d');
    /* لا يصلُ الرسمُ إلى الصفحة: لا نقرَ يقلبُ الشريحة ولا سحبَ يتنقّل */
    ['click', 'mousedown', 'touchstart', 'touchmove', 'touchend', 'dblclick', 'contextmenu'].forEach(function (t) { layer.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: t.indexOf('touch') < 0 }); });
    layer.addEventListener('touchstart', function (e) { if (TOOL !== 'pointer') e.preventDefault(); }, { passive: false });
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    lz.addEventListener('pointermove', lzMove);
    lz.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); lzMove(e); });
    lz.addEventListener('pointerleave', lzClear);
    lz.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { LZ.head = null; if (!LZ.raf) LZ.raf = requestAnimationFrame(lzTick); } });

    bar = document.createElement('div'); bar.className = 'hvink-bar' + (SET.open ? '' : ' shut'); bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'أدواتُ الشرح');
    bar.innerHTML = '<span class="more">'
      + tb('data-tool="pointer" aria-pressed="true"', 'pointer', 'المؤشّر', 'Esc')
      + tb('data-tool="pen" aria-pressed="false"', 'pen', 'القلم', 'P', '<i class="sw"></i>')
      + tb('data-tool="laser" aria-pressed="false"', 'laser', 'قلمُ الليزر', 'L')
      + tb('data-tool="eraser" aria-pressed="false"', 'eraser', 'الممحاة', 'E')
      + '<i class="hvink-sep"></i>'
      + tb('data-act="undo"', 'undo', 'تراجع', 'Z')
      + tb('data-act="clear"', 'clear', 'مسحُ رسمِ الشريحة', 'X')
      + '<i class="hvink-sep"></i></span>'
      + tb('data-act="fold"', 'fold', 'إخفاءُ الأدوات / إظهارُها', '').replace('hvink-tb"', 'hvink-tb hvink-fold"');
    pens = document.createElement('div'); pens.className = 'hvink-pens'; pens.setAttribute('aria-label', 'ألوانُ القلمِ وسُمكُه');
    pens.innerHTML = PENS.map(function (p, n) { return '<button type="button" class="hvink-pc" data-pen="' + p[0] + '" style="--c:' + p[0] + '" title="' + p[1] + ' (Shift+' + (n + 1) + ')" aria-label="' + p[1] + '"></button>'; }).join('')
      + '<i class="hvink-sep"></i>'
      + PW.map(function (w, n) { return '<button type="button" class="hvink-pw" data-pw="' + n + '" style="--s:' + [5, 9, 14][n] + 'px" title="' + PWN[n] + '" aria-label="' + PWN[n] + '"><i></i></button>'; }).join('');
    toastEl = document.createElement('div'); toastEl.className = 'hvink-toast'; toastEl.setAttribute('role', 'status');
    document.body.appendChild(bar); document.body.appendChild(pens); document.body.appendChild(toastEl);
    [bar, pens].forEach(function (el) {
      ['click', 'mousedown', 'pointerdown', 'touchstart', 'touchend'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
      el.addEventListener('mouseenter', wake); el.addEventListener('mouseleave', wake);
    });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; b.blur();
      if (b.dataset.tool) setTool(b.dataset.tool);
      else if (b.dataset.act === 'undo') undo();
      else if (b.dataset.act === 'clear') clear();
      else if (b.dataset.act === 'fold') fold(!bar.classList.contains('shut'));
    });
    pens.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; b.blur();
      if (b.dataset.pen) setPen(b.dataset.pen); else if (b.dataset.pw != null) setPw(+b.dataset.pw);
    });

    penUI(); size(); wake();
    addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(function () { size(); }).observe(cv);
    if (O.host && window.MutationObserver) new MutationObserver(ensure).observe(O.host, { childList: true });
    var scRaf = 0;
    addEventListener('scroll', function () { if (O.host || scRaf) return; scRaf = requestAnimationFrame(function () { scRaf = 0; redraw(); }); }, { passive: true });
    if (!MANUAL) {
      KEY = autoKey(); redraw();
      if (window.MutationObserver) new MutationObserver(autoTick).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
      addEventListener('hashchange', autoTick);
      addEventListener('scroll', autoTick, { passive: true });
      addEventListener('keyup', autoTick); addEventListener('click', autoTick);
    }
  }

  /* الاختصاراتُ في طورِ الالتقاط: تسبقُ الصفحة، ولا تأخذُ إلا ما تستعملُه */
  addEventListener('keydown', function (e) {
    if (!BOOTED) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    var c = e.code || '', mod = e.ctrlKey || e.metaKey, f = null;
    if (mod && !e.altKey && !e.shiftKey && c === 'KeyZ') { if (UNDO[KEY] && UNDO[KEY].length) { e.preventDefault(); e.stopImmediatePropagation(); undo(); } return; }
    if (mod || e.altKey) return;
    if (e.key === 'Escape') { if (TOOL !== 'pointer') f = function () { setTool('pointer'); }; }
    else if (e.shiftKey) { var n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[c]; if (n != null) f = function () { setPen(PENS[n][0]); }; }
    else f = { KeyP: function () { setTool('pen'); }, KeyL: function () { setTool('laser'); }, KeyE: function () { setTool('eraser'); }, KeyZ: undo, KeyX: clear }[c] || null;
    if (f) { e.preventDefault(); e.stopImmediatePropagation(); f(); }
  }, true);

  window.HVInk = {
    init: function (o) {
      o = o || {};
      if (o.host) O.host = o.host;
      if (o.anchor) O.anchor = o.anchor;
      if (o.key != null) { MANUAL = true; KEY = String(o.key); }
      mount(); return window.HVInk;
    },
    setKey: function (k) { MANUAL = true; if (!BOOTED) { KEY = String(k); return; } setKey(k); },
    tool: setTool, undo: undo, clear: clear,
    get active() { return TOOL !== 'pointer'; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); });
  else setTimeout(mount, 0);
})();
