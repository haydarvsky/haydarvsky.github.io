/* ===== تنبيهُ بصمةِ التواجد =====
   بين ٩:١٠ و١٠:١٠ يصبحُ الموقعُ أحمرَ ويظهرُ شريطُ تذكيرٍ حتى يؤكّدَ المعلّمُ التسجيل.
   وفي آخرِ ١٠ دقائقَ بلا تأكيد: وضعُ الخطر — وميضٌ في الشريطِ والترويسةِ وإطارِ الصفحة، وعدٌّ تنازليٌّ بالثواني،
   وعنوانُ التبويبِ يومض، ومنبّهٌ صوتيٌّ (Web Audio) كلَّ ١٢ ثانية مع اهتزازٍ في الجوال.
   التأكيدُ يُحفَظُ ليومِه فقط، وكتمُ الصوتِ كذلك. يُحمَّلُ بسطرٍ واحد في أيِّ صفحةٍ من مدرستي. */
(function () {
  'use strict';
  var KEY = 'sc_bio_done', MUTE = 'sc_bio_mute';
  /* الوقتُ من إعداداتِ المعلّم (يكتبُها التطبيقُ في sc_bio_cfg)، والافتراضيُّ ٠٩:١٠ ← ١٠:١٠، ووضعُ الخطرِ في آخرِ ١٠ دقائق */
  function cfg() {
    var c = { on: true, from: '09:10', to: '10:10', alarm: 10 };
    try { var j = JSON.parse(localStorage.getItem('sc_bio_cfg') || 'null'); if (j) c = Object.assign(c, j); } catch (e) { }
    return c;
  }
  function mins(t) { var p = String(t || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }

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
    /* وضعُ الخطر: وميضٌ مرّةً في الثانية (أقلُّ من حدِّ الوميضِ الخطِر) */
    + '.biobar.urgent{position:sticky;top:0;z-index:9999;padding:11px 16px;font-size:17px;animation:bioFlash 1s steps(1,end) infinite}'
    + '@keyframes bioFlash{0%{background:#E0261C}50%{background:#6E0F0B}}'
    + '.biobar.urgent .h{font-size:19px}'
    + '.biobar.urgent .t{font-size:15px;opacity:1}'
    + '.biobar.urgent .t b{font-size:20px;font-variant-numeric:tabular-nums;margin-inline-start:4px}'
    + '.biobar.urgent .ic{width:26px;height:26px;animation:bioShake .5s ease-in-out infinite}'
    + '@keyframes bioShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}'
    + '.biobar .mute{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.55)}'
    + '.biobar .mute:hover{background:rgba(255,255,255,.26)}'
    + 'body.bio-urgent .hd,body.bio-urgent .tabs,body.bio-urgent .bar,body.bio-urgent .lh{animation:bioBg 1s steps(1,end) infinite}'
    + '@keyframes bioBg{0%{background:#7F1D1A}50%{background:#B3261E}}'
    + 'body.bio-urgent::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:9998;box-shadow:inset 0 0 0 7px #E0261C;animation:bioEdge 1s steps(1,end) infinite}'
    + '@keyframes bioEdge{50%{box-shadow:inset 0 0 0 7px rgba(224,38,28,.15)}}'
    + '@media print{.biobar{display:none!important}body.bio .lh{background:var(--green-deep)}body.bio-urgent::after{display:none}}';

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
  function isMuted() { try { return localStorage.getItem(MUTE) === todayKey(); } catch (e) { return false; } }
  function setMuted(on) { try { if (on) localStorage.setItem(MUTE, todayKey()); else localStorage.removeItem(MUTE); } catch (e) { } }

  function inWindow() {
    var c = cfg(); if (!c.on) return false;
    var d = new Date();
    if (d.getDay() === 5 || d.getDay() === 6) return false;   /* الجمعةُ والسبتُ عطلة */
    var m = d.getHours() * 60 + d.getMinutes();
    return m >= mins(c.from) && m < mins(c.to);
  }
  function leftSec() {
    var d = new Date();
    return Math.max(0, mins(cfg().to) * 60 - (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()));
  }
  function fmt(t) { var p = String(t || '').split(':'); var h = +p[0] || 0, mm = p[1] || '00'; return ar((h % 12) || 12) + ':' + ar(mm); }
  function ar(n) { return String(n).replace(/\d/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'[x]; }); }
  function mmss(s) { return ar(('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2)); }

  /* ---------- المنبّهُ الصوتي: نغمتانِ متناوبتان ثلاثَ مرّات ---------- */
  var ctx = null, lastBeep = 0;
  function getCtx() {
    if (ctx) return ctx;
    var A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    try { ctx = new A(); } catch (e) { ctx = null; }
    return ctx;
  }
  function audioReady() { return !!ctx && ctx.state === 'running'; }
  /* المتصفّحاتُ لا تسمحُ بالصوتِ قبلَ تفاعلٍ في الصفحة — أيُّ نقرةٍ أثناءَ فترةِ البصمةِ تفتحُه */
  function unlock() {
    if (!document.body || !document.body.classList.contains('bio')) return;
    var c = getCtx(); if (c && c.state === 'suspended') c.resume().then(function () { state = ''; render(); }).catch(function () { });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { passive: true, capture: true }); });
  function tone(c, f, at, d) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + d);
    o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + d + 0.03);
  }
  function alarm() {
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([320, 160, 320, 160, 320]); } catch (e) { }
    var c = getCtx(); if (!c) return;
    if (c.state === 'suspended') c.resume().catch(function () { });
    var t0 = c.currentTime + 0.05;
    for (var i = 0; i < 3; i++) { tone(c, 988, t0 + i * 0.5, 0.22); tone(c, 740, t0 + i * 0.5 + 0.24, 0.22); }
  }

  /* ---------- وميضُ عنوانِ التبويب ---------- */
  var baseTitle = null, flip = false;
  function flashTitle() { if (baseTitle === null) baseTitle = document.title; flip = !flip; document.title = flip ? '⚠️ البصمة! بقيَ ' + mmss(leftSec()) : baseTitle; }
  function stopTitle() { if (baseTitle !== null) { document.title = baseTitle; baseTitle = null; } }

  var bar = null, state = '';
  function build() {
    if (bar) return bar;
    if (!document.getElementById('bioCss')) { var st = document.createElement('style'); st.id = 'bioCss'; st.textContent = CSS; document.head.appendChild(st); }
    bar = document.createElement('div'); bar.className = 'biobar'; bar.id = 'biobar';
    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }
  function render() {
    var show = inWindow() && !done(), sec = leftSec(), urgent = show && sec <= (+cfg().alarm || 10) * 60;
    document.body.classList.toggle('bio', show);
    document.body.classList.toggle('bio-urgent', urgent);
    if (!show) { if (bar) { bar.remove(); bar = null; } state = ''; stopTitle(); return; }
    var key = (urgent ? 'u' : 'n') + (urgent ? (isMuted() ? 'm' : audioReady() ? 'a' : 's') : '');
    if (!bar || state !== key) {
      state = key;
      build().className = 'biobar' + (urgent ? ' urgent' : '');
      bar.innerHTML = ICON
        + '<span class="h">' + (urgent ? 'خطر: لم تُسجِّلْ بصمةَ التواجدِ بعد!' : 'تأكّدْ من تسجيلِ بصمةِ التواجد') + '</span>'
        + '<span class="t"></span>'
        + '<button type="button" class="ok">سجّلتُ البصمة</button>'
        + (urgent ? '<button type="button" class="mute">' + (isMuted() ? '🔕 تشغيلُ المنبّه' : audioReady() ? '🔔 كتمُ الصوت' : '🔔 تفعيلُ الصوت') + '</button>' : '');
      bar.querySelector('.ok').onclick = function () { markDone(); stopTitle(); render(); };
      var mb = bar.querySelector('.mute');
      if (mb) mb.onclick = function () {
        if (isMuted()) { setMuted(false); alarm(); lastBeep = Date.now(); }
        else if (!audioReady()) { alarm(); lastBeep = Date.now(); }
        else setMuted(true);
        setTimeout(function () { state = ''; render(); }, 150);
      };
    }
    var close = fmt(cfg().to);
    bar.querySelector('.t').innerHTML = urgent
      ? 'يُغلَقُ التسجيلُ الساعةَ ' + close + ' — بقيَ<b>' + mmss(sec) + '</b>'
      : 'يُغلَقُ التسجيلُ الساعةَ ' + close + ' — بقيَ ' + ar(Math.ceil(sec / 60)) + ' دقيقة';
    if (urgent) {
      flashTitle();
      if (!isMuted() && Date.now() - lastBeep > 12000) { lastBeep = Date.now(); alarm(); }
    } else stopTitle();
  }

  function start() { render(); setInterval(render, 1000); }
  window.HVBio = { refresh: render, alarm: alarm, state: function () { return { show: document.body.classList.contains('bio'), urgent: document.body.classList.contains('bio-urgent'), audio: ctx ? ctx.state : 'none', muted: isMuted(), left: leftSec() }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
