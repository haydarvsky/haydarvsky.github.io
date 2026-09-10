/* ===== تنبيهُ بصمةِ التواجد =====
   بين ٩:١٠ و١٠:١٠ يصبحُ الموقعُ أحمرَ ويظهرُ شريطُ تذكيرٍ حتى يؤكّدَ المعلّمُ التسجيل.
   التأكيدُ يُحفَظُ ليومِه فقط. يُحمَّلُ بسطرٍ واحد في أيِّ صفحةٍ من مدرستي. */
(function () {
  'use strict';
  var FROM = 9 * 60 + 10, TO = 10 * 60 + 10;   /* ٠٩:١٠ ← ١٠:١٠ */
  var KEY = 'sc_bio_done';

  var CSS = ''
    + '.biobar{position:relative;z-index:57;background:#B3261E;color:#fff;display:flex;align-items:center;justify-content:center;'
    + 'gap:14px;flex-wrap:wrap;padding:9px 16px;font-size:16px;font-weight:700;text-align:center;'
    + 'box-shadow:0 10px 30px -18px rgba(179,38,30,.9);animation:bioIn .45s cubic-bezier(.22,.61,.36,1)}'
    + '@keyframes bioIn{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}'
    + '.biobar .ic{width:22px;height:22px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;animation:bioP 1.8s ease-in-out infinite}'
    + '@keyframes bioP{0%,100%{opacity:1}50%{opacity:.45}}'
    + '.biobar .t{font-size:14px;font-weight:400;opacity:.9}'
    + '.biobar button{background:#fff;color:#B3261E;border:none;border-radius:100px;padding:4px 18px;'
    + 'font:inherit;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap}'
    + '.biobar button:hover{background:#FFECEA}'
    + 'body.bio .hd,body.bio .tabs{background:#7F1D1A}'
    + 'body.bio .hd::before{background:radial-gradient(60% 80% at 85% 0%,rgba(255,180,170,.22),transparent 60%)}'
    + 'body.bio .tabs a[aria-current]{color:#FFD9D5;border-bottom-color:#FFD9D5}'
    + 'body.bio .hd .date b{color:#FFD9D5}'
    + 'body.bio .bar{background:#7F1D1A}'          /* شريطُ أدواتِ ورقةِ التحضير */
    + 'body.bio .lh{background:#7F1D1A}'
    + '@media print{.biobar{display:none!important}body.bio .lh{background:var(--green-deep)}}';

  var ICON = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3.5c-2.6 0-4.8 1.5-5.9 3.7"/>'
    + '<path d="M4.6 10.6A7.4 7.4 0 0 1 12 6.5a7.4 7.4 0 0 1 7.4 7.4"/>'
    + '<path d="M8.6 12.5A3.4 3.4 0 0 1 12 9.5a3.4 3.4 0 0 1 3.4 3.4v2.6"/>'
    + '<path d="M12 13v3.4M4.5 15.5v2M19.4 17.5v2"/></svg>';

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function done() { try { return localStorage.getItem(KEY) === todayKey(); } catch (e) { return false; } }
  function markDone() { try { localStorage.setItem(KEY, todayKey()); } catch (e) { } }

  function inWindow() {
    var d = new Date();
    if (d.getDay() === 5 || d.getDay() === 6) return false;   /* الجمعةُ والسبتُ عطلة */
    var m = d.getHours() * 60 + d.getMinutes();
    return m >= FROM && m < TO;
  }
  function left() {
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    return Math.max(0, TO - m);
  }
  function ar(n) { return String(n).replace(/\d/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'[x]; }); }

  var bar = null;
  function build() {
    if (bar) return bar;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    bar = document.createElement('div'); bar.className = 'biobar'; bar.id = 'biobar';
    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }
  function render() {
    var show = inWindow() && !done();
    document.body.classList.toggle('bio', show);
    if (!show) { if (bar) bar.remove(), bar = null; return; }
    build().innerHTML = ICON
      + '<span>تأكّدْ من تسجيلِ بصمةِ التواجد</span>'
      + '<span class="t">يُغلَقُ التسجيلُ الساعةَ ١٠:١٠ — بقيَ ' + ar(left()) + ' دقيقة</span>'
      + '<button type="button">سجّلتُ البصمة</button>';
    bar.querySelector('button').onclick = function () { markDone(); render(); };
  }

  function start() { render(); setInterval(render, 30000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
