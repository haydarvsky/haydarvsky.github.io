/* ===== مدرستي — التطبيق: توجيهٌ بالهاش، التحضيرات، الفصول، المتابعةُ اليومية، لوحةُ القياس، الجدول ===== */
(function () {
  'use strict';
  var DB = FB.DB, Auth = FB.Auth;
  var OWNER = 'haydarvsky', REPO = 'haydarvsky.github.io', BRANCH = 'main', PREFIX = 'madrasa/';
  var TOKEN_KEYS = ['hv_token', 'ed_token', 'ar_token', 'br_token', 'vd_token', 'bg_token'];
  var TYPES = [
    { key: 'absent', label: 'غياب', color: 'var(--c-absent)', hex: '#A63D2F', ico: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/></svg>', single: true },
    { key: 'star', label: 'مشاركةٌ متميّزة', short: 'مشاركة', color: 'var(--c-star)', hex: '#D9A441', ico: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z"/></svg>' },
    { key: 'wc', label: 'خروجٌ للحمّام', short: 'خروج', color: 'var(--c-wc)', hex: '#1E7A46', ico: '<svg viewBox="0 0 24 24"><path d="M4 12h11"/><path d="M11 8l4 4-4 4"/><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/></svg>' },
    { key: 'bad', label: 'سلوكٌ غيرُ لائق', short: 'سلوك', color: 'var(--c-bad)', hex: '#5B4BB5', ico: '<svg viewBox="0 0 24 24"><path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 17.2v.3"/></svg>' },
    { key: 'note', label: 'ملاحظة', color: 'var(--c-note)', hex: '#7A6A58', ico: '<svg viewBox="0 0 24 24"><path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/></svg>' }
  ];
  var TYPE = {}; TYPES.forEach(function (t) { TYPE[t.key] = t; });
  var GRADES = { '10': 'الصفُّ العاشر', '11': 'الصفُّ الحاديَ عشر', '12': 'الصفُّ الثانيَ عشر' };
  var SEMS = { '1': 'الفصلُ الدراسيُّ الأوّل', '2': 'الفصلُ الدراسيُّ الثاني' };
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var ar = Charts.ar;
  var $ = function (id) { return document.getElementById(id); };
  var view = $('view');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function today() { return iso(new Date()); }
  function pd(s) { return new Date(s + 'T00:00:00'); }
  function addDays(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return iso(d); }
  function fmtDate(s, withDay) { var d = pd(s); return (withDay ? DAYS[d.getDay()] + ' ' : '') + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + ar(d.getFullYear()); }
  function hijri(d) { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { return ''; } }
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(msg, bad) { var t = $('toast'); t.textContent = msg; t.className = 'toast on' + (bad ? ' bad' : ''); clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = 'toast'; }, bad ? 4200 : 2400); }
  function initials(n) { return (n || '؟').trim().split(/\s+/).slice(0, 1).join('').slice(0, 2); }
  function firstTwo(n) { var p = (n || '').trim().split(/\s+/); return p.slice(0, 2).join(' '); }
  function fail(e) { console.error(e); toast(e && e.message || 'حدث خطأ', true); }

  /* ---------------- الحالة ---------------- */
  var S = { user: null, settings: null, classes: null, days: {}, prep: null, date: today(), dashFilter: 'term' };
  var LS = { get: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

  function defaultSettings() {
    var now = new Date(), y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      periods: 7,
      terms: [
        { id: 't1', name: 'الفصلُ الدراسيُّ الأوّل ' + ar(y) + '/' + ar(y + 1), start: y + '-09-01', end: (y + 1) + '-01-31' },
        { id: 't2', name: 'الفصلُ الدراسيُّ الثاني ' + ar(y) + '/' + ar(y + 1), start: (y + 1) + '-02-01', end: (y + 1) + '-06-30' }
      ],
      schedule: {}
    };
  }
  async function loadCore(force) {
    if (S.settings && S.classes && !force) return;
    var cached = LS.get('sc_core_v1');
    if (cached && !force) { S.settings = cached.settings; S.classes = cached.classes; }
    var [st, cls] = await Promise.all([DB.get('sc_meta', 'settings'), DB.list('sc_classes')]);
    S.settings = st ? Object.assign(defaultSettings(), st) : defaultSettings();
    if (!st) await DB.set('sc_meta', 'settings', S.settings).catch(function () { });
    S.classes = cls.filter(function (c) { return !c.archived; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(b.name, 'ar'); });
    LS.set('sc_core_v1', { settings: S.settings, classes: S.classes });
  }
  function currentTerm(d) {
    d = d || today(); var t = (S.settings.terms || []).filter(function (t) { return t.start <= d && d <= t.end; })[0];
    return t || (S.settings.terms || []).slice().sort(function (a, b) { return a.start < b.start ? 1 : -1; })[0] || null;
  }
  function cls(id) { return (S.classes || []).filter(function (c) { return c._id === id; })[0]; }
  function saveSettings() { LS.set('sc_core_v1', { settings: S.settings, classes: S.classes }); return DB.set('sc_meta', 'settings', S.settings); }

  /* أيامُ فصلٍ: ذاكرةٌ لكلِّ فصل (كلُّ أيّامِه) */
  async function loadDays(cid, force) {
    var c = S.days[cid];
    if (c && !force && Date.now() - c.at < 10 * 60 * 1000) return c.map;
    var rows = await DB.query('sc_days', [['cls', 'EQUAL', cid]]);
    var map = {}; rows.forEach(function (r) { map[r.date] = r; });
    S.days[cid] = { at: Date.now(), map: map };
    return map;
  }
  async function loadDay(cid, date) {
    var c = S.days[cid];
    if (c && c.map[date] !== undefined) return c.map[date];
    var d = await DB.get('sc_days', cid + '_' + date);
    if (!S.days[cid]) S.days[cid] = { at: 0, map: {} };
    S.days[cid].map[date] = d || null;
    return d;
  }
  async function saveDay(cid, date, doc) {
    var id = cid + '_' + date;
    if (!doc.ev.length) { await DB.del('sc_days', id); S.days[cid].map[date] = null; return; }
    doc.cls = cid; doc.date = date;
    await DB.set('sc_days', id, { cls: cid, date: date, ev: doc.ev });
    S.days[cid].map[date] = Object.assign({ _id: id }, doc);
  }

  /* ---------------- الترويسة ---------------- */
  function renderHeader() {
    var d = new Date();
    $('hdDate').innerHTML = '<b>' + DAYS[d.getDay()] + ' ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + ar(d.getFullYear()) + '</b>' + esc(hijri(d));
    var u = Auth.user();
    $('hdUser').innerHTML = u ? '<span class="dot"></span><span>' + esc(FB.demo ? 'وضعٌ تجريبيّ (محليّ)' : u.email) + '</span><button type="button" id="logout">خروج</button>' : '<span class="dot off"></span><span>غيرُ متّصل</span>';
    var lo = $('logout'); if (lo) lo.onclick = function () { Auth.signOut(); S.user = null; S.settings = null; S.classes = null; S.days = {}; localStorage.removeItem('sc_core_v1'); route(); };
  }

  /* ---------------- التوجيه ---------------- */
  function parts() { return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); }
  var ROUTES = {
    '': home, prep: prep, classes: classes, class: classView, student: studentDash, schedule: scheduleView, settings: settingsView
  };
  async function route() {
    var p = parts(), r = p[0] || '';
    document.querySelectorAll('#tabs a').forEach(function (a) {
      var on = a.dataset.r === r || (r === 'class' && a.dataset.r === 'classes') || (r === 'student' && a.dataset.r === 'classes');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    closeSheet();
    renderHeader();
    var fn = ROUTES[r] || home;
    var needsAuth = r !== 'prep';
    if (needsAuth && !Auth.user()) return loginView();
    try {
      view.innerHTML = '<div class="loading"><span class="spin"></span></div>';
      if (needsAuth) await loadCore();
      await fn(p.slice(1));
    } catch (e) { console.error(e); view.innerHTML = '<div class="err">' + esc(e.message || e) + '</div><p><a class="btn" href="#/">الرئيسة</a> <button class="btn" onclick="location.reload()">إعادةُ التحميل</button></p>'; }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------------- الدخول ---------------- */
  function loginView() {
    view.innerHTML = '<div class="login"><img src="/img/logo-dark.svg" alt=""><h2>مدرستي</h2><p>ادخلْ بحسابِك لتصلَ إلى فصولِك ومتابعةِ متعلّميك</p>'
      + '<div id="lerr"></div>'
      + '<div class="field"><label>البريدُ الإلكتروني</label><input id="lemail" type="email" autocomplete="username" value="' + esc(LS.get('sc_last_email', '')) + '"></div>'
      + '<div class="field"><label>كلمةُ المرور</label><input id="lpw" type="password" autocomplete="current-password"></div>'
      + '<button class="btn p" id="lgo" style="width:100%;justify-content:center;margin-top:6px">دخول</button>'
      + '<div class="alt">أوّلُ مرّة؟ <button type="button" id="lnew">أنشئْ حسابَ المعلّم</button> · <button type="button" id="lforgot">نسيتُ كلمةَ المرور</button></div>'
      + '<div class="alt" style="margin-top:22px;border-top:1px solid var(--line);padding-top:12px">أو <a href="#/prep" style="color:var(--green);font-weight:700">تصفّحِ التحضيرات</a> بلا دخول · <a href="?demo=1#/" style="color:var(--muted)">وضعٌ تجريبيّ</a></div></div>';
    var go = async function (mode) {
      var em = $('lemail').value.trim(), pw = $('lpw').value;
      $('lerr').innerHTML = '';
      if (!em || (mode !== 'forgot' && !pw)) { $('lerr').innerHTML = '<div class="err">أكملِ البريدَ وكلمةَ المرور</div>'; return; }
      $('lgo').disabled = true;
      try {
        if (mode === 'forgot') { await Auth.resetPassword(em); $('lerr').innerHTML = '<div class="ok">أُرسلت رسالةُ الاستعادةِ إلى بريدك</div>'; }
        else {
          if (mode === 'new' && em.toLowerCase() !== Auth.cfg.OWNER_EMAIL) { $('lerr').innerHTML = '<div class="err">هذا التطبيقُ لصاحبِه وحدَه — البريدُ المسموحُ في قواعدِ فايرستور هو ' + esc(Auth.cfg.OWNER_EMAIL) + '</div>'; $('lgo').disabled = false; return; }
          await (mode === 'new' ? Auth.signUp(em, pw) : Auth.signIn(em, pw));
          LS.set('sc_last_email', em);
          route();
        }
      } catch (e) { $('lerr').innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
      $('lgo').disabled = false;
    };
    $('lgo').onclick = function () { go('in'); };
    $('lnew').onclick = function () { go('new'); };
    $('lforgot').onclick = function () { go('forgot'); };
    $('lpw').addEventListener('keydown', function (e) { if (e.key === 'Enter') go('in'); });
  }

  /* ---------------- الرئيسة: اليوم ---------------- */
  async function home() {
    var d = new Date(), dow = d.getDay(), sched = (S.settings.schedule || {})[dow] || [];
    var nowMin = d.getHours() * 60 + d.getMinutes();
    var per = S.settings.periods || 7;
    var times = S.settings.times || [];
    var html = '<div class="ttl"><div><h2>' + DAYS[dow] + '</h2><p>' + esc(hijri(d)) + ' — ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + ar(d.getFullYear()) + '</p></div>'
      + '<div class="acts"><a class="btn" href="#/schedule">تعديلُ الجدول</a></div></div>';
    html += '<div class="today"><div>';
    if (dow === 5 || dow === 6) html += '<div class="empty"><b>عطلةُ نهايةِ الأسبوع</b>استرحْ يا أستاذ</div>';
    else if (!S.classes.length) html += '<div class="empty"><b>لا فصولَ بعد</b>أضفْ فصولَك أوّلاً من «متابعةُ المتعلّمين»</div>';
    else if (!sched.some(Boolean)) html += '<div class="empty"><b>الجدولُ فارغٌ لهذا اليوم</b><a class="btn p" href="#/schedule" style="margin-top:10px">رتّبِ الجدولَ الأسبوعي</a></div>';
    else {
      html += '<div class="periods">';
      for (var i = 0; i < per; i++) {
        var c = sched[i] ? cls(sched[i]) : null;
        var t = times[i] || null, isNow = false;
        if (t && t.s && t.e) { var s = t.s.split(':'), e = t.e.split(':'); isNow = nowMin >= (+s[0] * 60 + +s[1]) && nowMin < (+e[0] * 60 + +e[1]); }
        html += c ? '<a class="period' + (isNow ? ' now' : '') + '" href="#/class/' + c._id + '"><span class="n">' + ar(i + 1) + '</span><span class="c">' + esc(c.name) + '</span><span class="m">' + (t && t.s ? esc(t.s + '–' + t.e) : ar(c.students ? c.students.length : 0) + ' متعلّماً') + '</span></a>'
          : '<div class="period free"><span class="n">' + ar(i + 1) + '</span><span class="c">حصّةٌ فارغة</span></div>';
      }
      html += '</div>';
    }
    html += '</div><div class="grid">'
      + '<a class="card green" href="#/prep"><div class="ico"><svg viewBox="0 0 24 24"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14.5 3.5V8H19"/><path d="M8 12h8M8 15.5h8"/></svg></div><h3>التحضيرات</h3><p>ملفّاتُ تحضيرِك للصفوفِ الثلاثةِ بفصلَيها</p></a>'
      + '<a class="card gold" href="#/classes"><div class="ico"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M14.5 19a4.5 4.5 0 0 1 7-3.5"/></svg></div><span class="cnt">' + ar(S.classes.length) + ' فصول</span><h3>متابعةُ المتعلّمين</h3><p>غيابٌ ومشاركةٌ وسلوكٌ وملاحظاتٌ يوماً بيوم</p></a>';
    S.classes.slice(0, 6).forEach(function (c) {
      html += classCard(c);
    });
    html += '</div></div>';
    view.innerHTML = html;
  }

  /* ---------------- التحضيرات ---------------- */
  async function loadPrep(force) {
    if (S.prep && !force) return S.prep;
    var r = await fetch('data/prep.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).catch(function () { return { items: [] }; });
    S.prep = r; return r;
  }
  function ghToken() { for (var i = 0; i < TOKEN_KEYS.length; i++) { var v = localStorage.getItem(TOKEN_KEYS[i]); if (v) return v; } return ''; }
  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', '٫') + ' م.ب' : Math.max(1, Math.round(b / 1024)) + ' ك.ب'; }
  function safeName(n) { return n.replace(/[\/\\#?%*:|"<>]+/g, '-').replace(/\s+/g, ' ').trim(); }
  async function prep(p) {
    var m = await loadPrep();
    var g = p[0], s = p[1];
    var crumbs = '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span><a href="#/prep">التحضيرات</a>' + (g ? '<span class="sep">›</span><a href="#/prep/' + g + '">' + esc(GRADES[g]) + '</a>' : '') + (s ? '<span class="sep">›</span>' + esc(SEMS[s]) : '') + '</div>';
    if (!g) {
      var html = crumbs + '<div class="ttl"><div><h2>التحضيرات</h2><p>كلُّ تحضيراتِك مرتّبةً بالصفِّ ثمّ بالفصلِ الدراسي</p></div></div><div class="gradecards">';
      ['10', '11', '12'].forEach(function (k) {
        var n = m.items.filter(function (i) { return i.grade === k; }).length;
        html += '<a class="card hov" href="#/prep/' + k + '"><div class="big">' + ar(k) + '</div><h3>' + esc(GRADES[k]) + '</h3><p>' + (n ? ar(n) + ' تحضيراً' : 'لا ملفّاتَ بعد') + '</p></a>';
      });
      view.innerHTML = html + '</div>'; return;
    }
    if (!GRADES[g]) { location.hash = '#/prep'; return; }
    if (!s) {
      var html2 = crumbs + '<div class="ttl"><div><h2>' + esc(GRADES[g]) + '</h2><p>اخترِ الفصلَ الدراسي</p></div></div><div class="sems">';
      ['1', '2'].forEach(function (k) {
        var n = m.items.filter(function (i) { return i.grade === g && i.sem === k; }).length;
        html2 += '<a class="card hov" href="#/prep/' + g + '/' + k + '"><div class="kick">' + esc(GRADES[g]) + '</div><h3>' + esc(SEMS[k]) + '</h3><p>' + (n ? ar(n) + ' تحضيراً' : 'لا ملفّاتَ بعد') + '</p></a>';
      });
      view.innerHTML = html2 + '</div>'; return;
    }
    renderPrepFolder(g, s, crumbs);
  }
  function renderPrepFolder(g, s, crumbs) {
    var items = S.prep.items.filter(function (i) { return i.grade === g && i.sem === s; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.added).localeCompare(String(b.added)); });
    var canUp = !!ghToken();
    var html = crumbs + '<div class="ttl"><div><h2>' + esc(SEMS[s]) + '</h2><p>' + esc(GRADES[g]) + ' — ' + (items.length ? ar(items.length) + ' تحضيراً' : 'المجلّدُ فارغ') + '</p></div>'
      + '<div class="acts">' + (canUp ? '<button class="btn p" id="pickBtn">إضافةُ PDF</button>' : '<button class="btn" id="tokBtn">تفعيلُ الرفع</button>') + '</div></div>';
    if (canUp) html += '<div class="drop" id="drop"><b>أفلتْ ملفّاتَ PDF هنا</b>أو انقرْ للاختيار — يُرفَعُ الملفُّ إلى الموقعِ ويُحفَظُ باسمِه<input type="file" id="fileIn" accept="application/pdf" multiple hidden><div class="prog" id="prog" hidden><i></i></div></div>';
    else html += '<div id="tokBox" hidden class="panel"><h3>رمزُ الرفع</h3><div class="hint">ألصقْ رمزَ GitHub (Contents R/W على المستودع) مرّةً واحدة؛ يُحفَظُ في هذا المتصفّح كما في مركزِ التحكّم.</div><div class="inline-add"><input id="tokIn" type="password" placeholder="ghp_…"><button class="btn p" id="tokSave">حفظ</button></div></div>';
    html += '<div class="files" id="files">';
    if (!items.length) html += '<div class="empty"><b>لا تحضيراتَ بعد</b>' + (canUp ? 'أفلتْ أوّلَ ملفٍّ في المربّعِ أعلاه' : 'فعّلِ الرفعَ ثمّ أضفِ الملفّات') + '</div>';
    items.forEach(function (i) {
      var url = 'prep/' + g + '/' + s + '/' + encodeURIComponent(i.file);
      html += '<div class="file" data-id="' + i.id + '"><div class="pdf">PDF</div><div class="t"><b title="' + esc(i.title) + '">' + esc(i.title) + '</b><small>' + esc(i.file) + (i.size ? ' · ' + fmtSize(i.size) : '') + (i.added ? ' · أُضيف ' + fmtDate(i.added) : '') + '</small></div>'
        + '<div class="a"><a class="btn s" href="' + url + '" target="_blank" rel="noopener">عرض</a><a class="btn s p" href="' + url + '" download="' + esc(i.file) + '">تنزيل</a>'
        + (canUp ? '<button class="icon-btn" data-act="ren" title="تغييرُ الاسم"><svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/></svg></button><button class="icon-btn" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg></button>' : '') + '</div></div>';
    });
    view.innerHTML = html + '</div>';
    if ($('tokBtn')) { $('tokBtn').onclick = function () { $('tokBox').hidden = !$('tokBox').hidden; }; $('tokSave').onclick = function () { var v = $('tokIn').value.trim(); if (!v) return; localStorage.setItem('hv_token', v); localStorage.setItem('hv_owner', '1'); route(); }; }
    if (!canUp) return;
    var drop = $('drop'), fin = $('fileIn');
    $('pickBtn').onclick = function () { fin.click(); };
    drop.onclick = function (e) { if (e.target === drop || e.target.tagName === 'B') fin.click(); };
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { uploadFiles(g, s, Array.from(e.dataTransfer.files)); });
    fin.onchange = function () { uploadFiles(g, s, Array.from(fin.files)); fin.value = ''; };
    $('files').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.closest('.file').dataset.id, it = S.prep.items.filter(function (x) { return x.id === id; })[0]; if (!it) return;
      if (b.dataset.act === 'ren') { var t = prompt('الاسمُ الظاهرُ للتحضير:', it.title); if (t && t.trim() && t.trim() !== it.title) { it.title = t.trim(); commitPrep('تعديلُ اسمِ تحضير: ' + it.title, [], []).then(function () { renderPrepFolder(g, s, crumbsFor(g, s)); }); } }
      if (b.dataset.act === 'del') { if (!confirm('حذفُ «' + it.title + '» من الموقع نهائياً؟')) return; S.prep.items = S.prep.items.filter(function (x) { return x.id !== id; }); commitPrep('حذفُ تحضير: ' + it.title, [], [PREFIX + 'prep/' + g + '/' + s + '/' + it.file]).then(function () { renderPrepFolder(g, s, crumbsFor(g, s)); }); }
    });
  }
  function crumbsFor(g, s) { return '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span><a href="#/prep">التحضيرات</a><span class="sep">›</span><a href="#/prep/' + g + '">' + esc(GRADES[g]) + '</a><span class="sep">›</span>' + esc(SEMS[s]) + '</div>'; }
  function readB64(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(file); }); }
  async function commitPrep(message, files, deletes, onProgress) {
    var gh = new GhApi({ owner: OWNER, repo: REPO, branch: BRANCH, token: ghToken() });
    S.prep.updated = today();
    files.push({ path: PREFIX + 'data/prep.json', text: JSON.stringify(S.prep, null, 2) });
    try { await gh.commit({ message: message, files: files, deletes: deletes, onProgress: onProgress || function () { } }); toast('نُشر — يظهرُ على الموقعِ خلالَ دقيقة'); }
    catch (e) { fail(e); await loadPrep(true); throw e; }
  }
  async function uploadFiles(g, s, list) {
    list = list.filter(function (f) { return /pdf$/i.test(f.name) || f.type === 'application/pdf'; });
    if (!list.length) { toast('اخترْ ملفّاتَ PDF فقط', true); return; }
    var prog = $('prog'), bar = prog.querySelector('i'); prog.hidden = false; bar.style.width = '5%';
    var files = [], now = today();
    for (var i = 0; i < list.length; i++) {
      var f = list[i], name = safeName(f.name);
      var taken = S.prep.items.filter(function (x) { return x.grade === g && x.sem === s && x.file === name; })[0];
      if (taken) { S.prep.items = S.prep.items.filter(function (x) { return x !== taken; }); }
      files.push({ path: PREFIX + 'prep/' + g + '/' + s + '/' + name, base64: await readB64(f) });
      S.prep.items.push({ id: uid('p'), grade: g, sem: s, title: name.replace(/\.pdf$/i, ''), file: name, size: f.size, added: now, order: S.prep.items.length + 1 });
      bar.style.width = (5 + 35 * (i + 1) / list.length) + '%';
    }
    try {
      await commitPrep('تحضيرات: إضافةُ ' + ar(list.length) + ' ملفّاً إلى ' + GRADES[g] + ' / ' + SEMS[s], files, [], function (p) { if (p.stage === 'upload') bar.style.width = (40 + 50 * p.done / p.total) + '%'; if (p.stage === 'done') bar.style.width = '100%'; });
    } catch (e) { }
    renderPrepFolder(g, s, crumbsFor(g, s));
  }

  function classCard(c) {
    return '<div class="card hov cls-card"><span class="grade-badge">' + esc(GRADES[c.grade] || '') + '</span><h3><a href="#/class/' + c._id + '">' + esc(c.name) + '</a></h3><p class="students-n">' + ar((c.students || []).length) + ' متعلّماً</p>'
      + '<div class="crow"><a class="btn s p" href="#/class/' + c._id + '">المتابعةُ اليومية</a><a class="btn s g" href="#/class/' + c._id + '/report">تقريرُ الفصل</a><a class="btn s" href="#/class/' + c._id + '/students">المتعلّمون</a></div></div>';
  }
  /* ---------------- الفصول ---------------- */
  async function classes() {
    var html = '<div class="ttl"><div><h2>فصولي</h2><p>اخترْ فصلاً للمتابعةِ اليومية، أو أضفْ فصلاً جديداً</p></div></div>';
    html += '<div class="panel"><h3>إضافةُ فصل</h3><div class="row"><div class="field" style="flex:2"><label>اسمُ الفصل</label><input id="cName" placeholder="مثال: عاشر ٦"></div><div class="field"><label>الصفّ</label><select id="cGrade"><option value="10">العاشر</option><option value="11">الحاديَ عشر</option><option value="12">الثانيَ عشر</option></select></div><div class="field" style="flex:0 0 auto"><label>&nbsp;</label><button class="btn p" id="cAdd">إضافة</button></div></div></div>';
    html += '<div class="grid" id="clsGrid">';
    if (!S.classes.length) html += '<div class="empty" style="grid-column:1/-1"><b>لا فصولَ بعد</b>أضفْ أوّلَ فصلٍ من الأعلى — ثمّ أدخلْ أسماءَ متعلّميه</div>';
    S.classes.forEach(function (c) {
      html += classCard(c);
    });
    view.innerHTML = html + '</div>';
    $('cAdd').onclick = async function () {
      var n = $('cName').value.trim(); if (!n) { $('cName').focus(); return; }
      var id = uid('c'), doc = { name: n, grade: $('cGrade').value, order: S.classes.length + 1, students: [], created: today() };
      try { await DB.set('sc_classes', id, doc); S.classes.push(Object.assign({ _id: id }, doc)); LS.set('sc_core_v1', { settings: S.settings, classes: S.classes }); location.hash = '#/class/' + id + '/students'; } catch (e) { fail(e); }
    };
    $('cName').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('cAdd').click(); });
  }
  function classCrumb(c, extra) { return '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span><a href="#/classes">فصولي</a><span class="sep">›</span><a href="#/class/' + c._id + '">' + esc(c.name) + '</a>' + (extra ? '<span class="sep">›</span>' + extra : '') + '</div>'; }
  async function classView(p) {
    var c = cls(p[0]); if (!c) { location.hash = '#/classes'; return; }
    if (p[1] === 'report') return classReport(c);
    if (p[1] === 'students') return studentsManage(c);
    return dailyView(c);
  }
  async function saveClass(c) { var d = { name: c.name, grade: c.grade, order: c.order || 0, students: c.students || [], created: c.created || today() }; if (c.archived) d.archived = true; await DB.set('sc_classes', c._id, d); LS.set('sc_core_v1', { settings: S.settings, classes: S.classes }); }

  /* إدارةُ الطلاب */
  async function studentsManage(c) {
    c.students = c.students || [];
    function render() {
      var html = classCrumb(c, 'المتعلّمون') + '<div class="ttl"><div><h2>متعلّمو ' + esc(c.name) + '</h2><p>' + ar(c.students.length) + ' متعلّماً — أضفْ أو احذفْ أو عدّلِ الأسماءَ في مكانِها</p></div><div class="acts"><a class="btn p" href="#/class/' + c._id + '">المتابعةُ اليومية</a></div></div>';
      html += '<div class="panel"><h3>إضافةُ متعلّم</h3><div class="inline-add"><input id="sName" placeholder="اسمُ المتعلّم ثمّ Enter"><button class="btn p" id="sAdd">إضافة</button></div>'
        + '<details class="bulk"><summary style="cursor:pointer;color:var(--amber);font-size:15px">إضافةُ قائمةٍ كاملة (اسمٌ في كلِّ سطر)</summary><textarea id="sBulk" placeholder="علي حسين&#10;محمد جاسم&#10;…"></textarea><button class="btn" id="sBulkAdd" style="margin-top:8px">إضافةُ الكلّ</button></details></div>';
      html += '<div class="slist" id="slist">';
      c.students.forEach(function (s, i) { html += '<div class="srow" data-id="' + s.id + '"><span class="n num">' + ar(i + 1) + '</span><input value="' + esc(s.name) + '" data-act="edit"><button class="icon-btn" data-act="up" title="أعلى"><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button><button class="icon-btn" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg></button></div>'; });
      if (!c.students.length) html += '<div class="empty"><b>لا متعلّمينَ بعد</b>اكتبِ الأسماءَ أعلاه</div>';
      html += '</div><div class="manage"><details><summary>إعداداتُ الفصل</summary><div class="row" style="margin-top:12px"><div class="field"><label>اسمُ الفصل</label><input id="cRename" value="' + esc(c.name) + '"></div><div class="field"><label>الصفّ</label><select id="cGrade2">' + Object.keys(GRADES).map(function (k) { return '<option value="' + k + '"' + (k === c.grade ? ' selected' : '') + '>' + GRADES[k] + '</option>'; }).join('') + '</select></div><div class="field" style="flex:0 0 auto"><label>&nbsp;</label><button class="btn" id="cSave">حفظ</button></div></div><button class="btn d s" id="cDel">حذفُ الفصلِ كلِّه</button></details></div>';
      view.innerHTML = html;
      var add = async function (names) {
        names = names.map(function (n) { return n.trim(); }).filter(Boolean); if (!names.length) return;
        names.forEach(function (n) { c.students.push({ id: uid('s'), name: n }); });
        try { await saveClass(c); toast('أُضيف ' + ar(names.length)); } catch (e) { fail(e); }
        render(); $('sName').focus();
      };
      $('sAdd').onclick = function () { add([$('sName').value]); };
      $('sName').addEventListener('keydown', function (e) { if (e.key === 'Enter') add([$('sName').value]); });
      $('sBulkAdd').onclick = function () { add($('sBulk').value.split(/\n+/)); };
      $('slist').addEventListener('click', async function (e) {
        var b = e.target.closest('button[data-act]'); if (!b) return;
        var id = b.closest('.srow').dataset.id, i = c.students.findIndex(function (s) { return s.id === id; }); if (i < 0) return;
        if (b.dataset.act === 'del') { if (!confirm('حذفُ «' + c.students[i].name + '» من الفصل؟ (سجلُّه اليوميُّ يبقى في التقارير)')) return; c.students.splice(i, 1); }
        if (b.dataset.act === 'up' && i > 0) { var t = c.students[i - 1]; c.students[i - 1] = c.students[i]; c.students[i] = t; }
        try { await saveClass(c); } catch (err) { fail(err); } render();
      });
      $('slist').addEventListener('change', async function (e) {
        var inp = e.target.closest('input[data-act=edit]'); if (!inp) return;
        var id = inp.closest('.srow').dataset.id, s = c.students.filter(function (x) { return x.id === id; })[0];
        if (s && inp.value.trim()) { s.name = inp.value.trim(); try { await saveClass(c); toast('حُفظ'); } catch (err) { fail(err); } }
      });
      $('cSave').onclick = async function () { c.name = $('cRename').value.trim() || c.name; c.grade = $('cGrade2').value; try { await saveClass(c); toast('حُفظ'); render(); } catch (err) { fail(err); } };
      $('cDel').onclick = async function () { if (!confirm('حذفُ الفصلِ «' + c.name + '» بكلِّ متعلّميه؟ سجلُّه اليوميُّ يبقى مخفيّاً.')) return; c.archived = true; try { await saveClass(c); S.classes = S.classes.filter(function (x) { return x._id !== c._id; }); LS.set('sc_core_v1', { settings: S.settings, classes: S.classes }); location.hash = '#/classes'; } catch (err) { fail(err); } };
    }
    render();
  }

  /* ---------------- المتابعةُ اليومية ---------------- */
  async function dailyView(c) {
    c.students = c.students || [];
    var date = S.date;
    var doc = await loadDay(c._id, date);
    var ev = doc ? doc.ev : [];
    function evOf(sid) { return ev.filter(function (e) { return e.sid === sid; }); }
    var d = pd(date), isToday = date === today();
    var absN = ev.filter(function (e) { return e.type === 'absent'; }).length;
    var html = classCrumb(c) + '<div class="ttl"><div><h2>' + esc(c.name) + '</h2><p>' + ar(c.students.length) + ' متعلّماً · حاضرٌ ' + ar(c.students.length - absN) + (absN ? ' · غائبٌ ' + ar(absN) : '') + '</p></div>'
      + '<div class="acts"><a class="btn" href="#/class/' + c._id + '/students">المتعلّمون</a><a class="btn g" href="#/class/' + c._id + '/report">تقريرُ الفصل</a></div></div>';
    html += '<div class="datebar"><button class="icon-btn" id="dPrev" title="اليومُ التالي"><svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6"/></svg></button>'
      + '<label class="d" style="cursor:pointer;position:relative">' + DAYS[d.getDay()] + ' ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + '<small>' + esc(hijri(d)) + '</small><input type="date" id="dPick" value="' + date + '"></label>'
      + '<button class="icon-btn" id="dNext" title="اليومُ السابق"><svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg></button>' + (isToday ? '' : '<button class="btn s" id="dToday">اليوم</button>') + '</div>';
    if (d.getDay() === 5 || d.getDay() === 6) html += '<div class="ok" style="text-align:center">هذا اليومُ عطلةٌ — يمكنُك التسجيلُ مع ذلك</div>';
    if (!c.students.length) html += '<div class="empty"><b>لا متعلّمينَ في هذا الفصل</b><a class="btn p" href="#/class/' + c._id + '/students" style="margin-top:10px">أضفِ الأسماء</a></div>';
    html += '<div class="students" id="stuGrid">';
    c.students.forEach(function (s) {
      var es = evOf(s.id), abs = es.some(function (e) { return e.type === 'absent'; });
      var pips = TYPES.filter(function (t) { return t.key !== 'absent'; }).map(function (t) { var n = es.filter(function (e) { return e.type === t.key; }).length; return n ? '<span class="pip ' + t.key + '" title="' + t.label + '">' + ar(n) + '</span>' : ''; }).join('');
      html += '<button class="stu' + (abs ? ' absent' : '') + '" data-sid="' + s.id + '"><span class="av">' + esc(initials(s.name)) + '</span><span class="nm">' + esc(s.name) + '</span><span class="bd">' + pips + '</span></button>';
    });
    html += '</div><div class="legend">' + TYPES.map(function (t) { return '<span><i style="background:' + t.color + '"></i>' + t.label + '</span>'; }).join('') + '</div>';
    view.innerHTML = html;
    $('dPrev').onclick = function () { S.date = addDays(date, 1); route(); };
    $('dNext').onclick = function () { S.date = addDays(date, -1); route(); };
    $('dPick').onchange = function () { if ($('dPick').value) { S.date = $('dPick').value; route(); } };
    if ($('dToday')) $('dToday').onclick = function () { S.date = today(); route(); };
    $('stuGrid').addEventListener('click', function (e) { var b = e.target.closest('.stu'); if (!b) return; var s = c.students.filter(function (x) { return x.id === b.dataset.sid; })[0]; if (s) openStudentSheet(c, s, date); });
  }

  /* الورقةُ المنبثقة للمتعلّم */
  function closeSheet() { $('sheet').classList.remove('on'); $('sheetBg').classList.remove('on'); setTimeout(function () { $('sheet').hidden = true; $('sheetBg').hidden = true; }, 260); }
  $('sheetBg').onclick = closeSheet;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  async function openStudentSheet(c, s, date) {
    var sh = $('sheet'), bg = $('sheetBg');
    sh.hidden = false; bg.hidden = false; requestAnimationFrame(function () { sh.classList.add('on'); bg.classList.add('on'); });
    async function mutate(fn) {
      var doc = (await loadDay(c._id, date)) || { ev: [] }; doc.ev = doc.ev || [];
      fn(doc);
      try { await saveDay(c._id, date, doc); } catch (e) { fail(e); S.days[c._id].map[date] = undefined; }
      render(); refreshChip();
    }
    function refreshChip() {
      var b = document.querySelector('.stu[data-sid="' + s.id + '"]'); if (!b) return;
      var doc = S.days[c._id] && S.days[c._id].map[date]; var es = (doc ? doc.ev : []).filter(function (e) { return e.sid === s.id; });
      var abs = es.some(function (e) { return e.type === 'absent'; }); b.classList.toggle('absent', abs);
      b.querySelector('.bd').innerHTML = TYPES.filter(function (t) { return t.key !== 'absent'; }).map(function (t) { var n = es.filter(function (e) { return e.type === t.key; }).length; return n ? '<span class="pip ' + t.key + '">' + ar(n) + '</span>' : ''; }).join('');
      var all = (doc ? doc.ev : []).filter(function (e) { return e.type === 'absent'; }).length;
      var p = document.querySelector('.ttl p'); if (p) p.textContent = ar(c.students.length) + ' متعلّماً · حاضرٌ ' + ar(c.students.length - all) + (all ? ' · غائبٌ ' + ar(all) : '');
    }
    function render() {
      var doc = S.days[c._id] && S.days[c._id].map[date]; var es = (doc ? doc.ev : []).filter(function (e) { return e.sid === s.id; });
      var html = '<div class="hnd"></div><div class="who"><span class="av">' + esc(initials(s.name)) + '</span><div><h3>' + esc(s.name) + '</h3><small>' + esc(c.name) + ' — ' + fmtDate(date, true) + '</small></div><a class="btn s" style="margin-inline-start:auto" href="#/student/' + c._id + '/' + s.id + '">لوحةُ القياس</a></div>';
      html += '<div class="acts4">';
      TYPES.filter(function (t) { return t.key !== 'note'; }).forEach(function (t) {
        var n = es.filter(function (e) { return e.type === t.key; }).length;
        html += '<button class="act ' + t.key + (n ? ' on' : '') + '" data-t="' + t.key + '"><span class="ic">' + t.ico + '</span>' + t.label + (n && !t.single ? '<span class="cnt">' + ar(n) + '</span>' : '') + '</button>';
      });
      html += '</div>';
      if (es.length) {
        html += '<div class="evlist">' + es.slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); }).map(function (e) {
          var t = TYPE[e.type] || TYPE.note, tm = e.ts ? new Date(e.ts) : null;
          return '<div class="ev"><span class="pip ' + e.type + '">' + (t.short || t.label).slice(0, 1) + '</span><span class="t">' + esc(t.label) + (e.note ? ': ' + esc(e.note) : '') + (tm ? ' <small>' + ar(('0' + tm.getHours()).slice(-2) + ':' + ('0' + tm.getMinutes()).slice(-2)) + '</small>' : '') + '</span><button class="x" data-id="' + e.id + '" title="حذف">×</button></div>';
        }).join('') + '</div>';
      }
      html += '<div class="notebox"><textarea id="noteIn" placeholder="ملاحظةٌ على المتعلّم اليوم…"></textarea><button class="btn p" id="noteAdd">إضافة</button></div>';
      html += '<div class="foot"><small style="color:var(--muted)">النقرُ على الزرِّ يسجّلُ فوراً · × يحذف</small><button class="btn s" id="shClose">إغلاق</button></div>';
      sh.innerHTML = html;
      sh.querySelectorAll('.act').forEach(function (b) {
        b.onclick = function () {
          var t = b.dataset.t;
          mutate(function (doc) {
            if (t === 'absent') { var has = doc.ev.some(function (e) { return e.sid === s.id && e.type === 'absent'; }); doc.ev = doc.ev.filter(function (e) { return !(e.sid === s.id && e.type === 'absent'); }); if (!has) doc.ev.push({ id: uid('e'), sid: s.id, type: 'absent', ts: Date.now() }); }
            else doc.ev.push({ id: uid('e'), sid: s.id, type: t, ts: Date.now() });
          });
        };
      });
      sh.querySelectorAll('.ev .x').forEach(function (x) { x.onclick = function () { mutate(function (doc) { doc.ev = doc.ev.filter(function (e) { return e.id !== x.dataset.id; }); }); }; });
      $('noteAdd').onclick = function () { var v = $('noteIn').value.trim(); if (!v) return; mutate(function (doc) { doc.ev.push({ id: uid('e'), sid: s.id, type: 'note', note: v, ts: Date.now() }); }); };
      $('noteIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('noteAdd').click(); } });
      $('shClose').onclick = closeSheet;
    }
    render();
  }

  /* ---------------- لوحةُ القياس ---------------- */
  function periodRange() {
    var f = S.dashFilter, t = today();
    if (f === 'term') { var tm = currentTerm(); return tm ? { from: tm.start, to: tm.end < t ? tm.end : t, label: tm.name } : { from: addDays(t, -120), to: t, label: 'آخرُ أربعةِ أشهر' }; }
    if (f === '30') return { from: addDays(t, -29), to: t, label: 'آخرُ ٣٠ يوماً' };
    if (f === 'month') { var d = new Date(); return { from: iso(new Date(d.getFullYear(), d.getMonth(), 1)), to: t, label: MONTHS[d.getMonth()] + ' ' + ar(d.getFullYear()) }; }
    if (f === 'all') return { from: '2000-01-01', to: t, label: 'كلُّ المدّة' };
    if (f === 'custom') { var c = S.custom || { from: addDays(t, -60), to: t }; return { from: c.from, to: c.to, label: 'من ' + fmtDate(c.from) + ' إلى ' + fmtDate(c.to) }; }
    return { from: addDays(t, -29), to: t, label: '' };
  }
  function filtersHTML() {
    var opts = [['term', 'الفصلُ الحالي'], ['month', 'هذا الشهر'], ['30', 'آخرُ ٣٠ يوماً'], ['all', 'الكلّ'], ['custom', 'مدّةٌ مخصّصة']];
    var r = S.custom || { from: addDays(today(), -60), to: today() };
    return '<div class="filters noprint" id="filters">' + opts.map(function (o) { return '<button class="chip" data-f="' + o[0] + '" aria-pressed="' + (S.dashFilter === o[0]) + '">' + o[1] + '</button>'; }).join('')
      + (S.dashFilter === 'custom' ? '<input type="date" id="cFrom" value="' + r.from + '"> <input type="date" id="cTo" value="' + r.to + '">' : '') + '</div>';
  }
  function bindFilters(rerender) {
    $('filters').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; S.dashFilter = b.dataset.f; rerender(); });
    var cf = $('cFrom'), ct = $('cTo');
    if (cf) { var upd = function () { if (cf.value && ct.value && cf.value <= ct.value) { S.custom = { from: cf.value, to: ct.value }; rerender(); } }; cf.onchange = upd; ct.onchange = upd; }
  }
  function schoolDaysFor(cid, from, to) {
    var set = new Set(), sched = S.settings.schedule || {}, has = Object.keys(sched).some(function (k) { return (sched[k] || []).indexOf(cid) >= 0; });
    if (!has) return null;
    var t = today(); for (var d = from; d <= to && d <= t; d = addDays(d, 1)) { var dow = pd(d).getDay(); if ((sched[dow] || []).indexOf(cid) >= 0) set.add(d); }
    return set;
  }
  function eventsIn(map, from, to, sid) {
    var out = [];
    Object.keys(map).forEach(function (date) { var doc = map[date]; if (!doc || date < from || date > to) return; doc.ev.forEach(function (e) { if (!sid || e.sid === sid) out.push(Object.assign({ date: date }, e)); }); });
    return out;
  }
  function weekBuckets(evs, from, to) {
    var start = pd(from); start.setDate(start.getDate() - start.getDay()); /* الأحد */
    var b = [], cur = iso(start), end = to > today() ? today() : to, i = 0;
    while (cur <= end) {
      var wEnd = addDays(cur, 6), vals = {};
      evs.forEach(function (e) { if (e.date >= cur && e.date <= wEnd) vals[e.type] = (vals[e.type] || 0) + 1; });
      var d = pd(cur); b.push({ label: 'أسبوع ' + ar(i + 1), sub: ar(d.getDate()) + '/' + ar(d.getMonth() + 1), vals: vals });
      cur = addDays(cur, 7); i++;
    }
    return b;
  }
  function reportHead(title, sub) {
    return '<div class="report-head"><div style="display:flex;gap:12px;align-items:center"><img src="/img/logo-dark.svg" alt=""><div class="rt"><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p></div></div><div class="rd">أ. حيدر المعاتيق<br>' + fmtDate(today(), true) + '</div></div>';
  }
  async function studentDash(p) {
    var c = cls(p[0]); if (!c) { location.hash = '#/classes'; return; }
    var s = (c.students || []).filter(function (x) { return x.id === p[1]; })[0] || { id: p[1], name: 'متعلّمٌ محذوف' };
    var map = await loadDays(c._id);
    function render() {
      var R = periodRange(), evs = eventsIn(map, R.from, R.to, s.id), counts = {};
      TYPES.forEach(function (t) { counts[t.key] = evs.filter(function (e) { return e.type === t.key; }).length; });
      var school = schoolDaysFor(c._id, R.from, R.to);
      var attend = school ? Math.max(0, 100 - Math.round(100 * counts.absent / Math.max(1, school.size))) : null;
      var html = classCrumb(c, esc(s.name)) + reportHead('تقريرُ متابعة: ' + s.name, c.name + ' — ' + R.label);
      html += '<div class="ttl"><div><h2>' + esc(s.name) + '</h2><p>' + esc(c.name) + ' · ' + esc(R.label) + '</p></div><div class="acts"><a class="btn" href="#/class/' + c._id + '">المتابعةُ اليومية</a><button class="btn p" id="printBtn"><svg viewBox="0 0 24 24"><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 9V4h10v5M7 14h10v6H7z"/></svg>تصديرُ PDF</button></div></div>';
      html += filtersHTML();
      html += '<div class="tiles">';
      html += '<div class="tile hero"><div class="l">نسبةُ الحضور</div><div class="v">' + (attend === null ? '—' : ar(attend) + '<small>٪</small>') + '</div><div class="s">' + (school ? 'من ' + ar(school.size) + ' حصّةً بحسبِ الجدول' : 'رتّبِ الجدولَ الأسبوعيَّ لحسابِها') + '</div></div>';
      TYPES.forEach(function (t) { html += '<div class="tile" style="--tc:' + t.color + '"><div class="l"><i></i>' + t.label + '</div><div class="v">' + ar(counts[t.key]) + '</div><div class="s">' + (t.key === 'absent' ? 'يومَ غياب' : 'مرّة') + '</div></div>'; });
      html += '</div>';
      html += '<div class="panel"><h3>الإيقاعُ الأسبوعي</h3><div class="hint">عددُ التسجيلاتِ في كلِّ أسبوعٍ من المدّة، مكدَّسةً بنوعِها (الأقدمُ يميناً)</div><div class="chart" id="wk"></div><div class="legend">' + TYPES.map(function (t) { return '<span><i style="background:' + t.color + '"></i>' + t.label + '</span>'; }).join('') + '</div></div>';
      html += '<div class="panel"><h3>خريطةُ الأيّام</h3><div class="hint">الأحمرُ غياب، والنقاطُ تسجيلاتُ اليوم، والمظلَّلُ أيّامُ حصصِ الفصل</div><div class="cal" id="cal"></div></div>';
      var log = evs.slice().sort(function (a, b) { return a.date === b.date ? (b.ts || 0) - (a.ts || 0) : (a.date < b.date ? 1 : -1); });
      html += '<div class="panel"><h3>السجلُّ التفصيلي</h3><div class="hint">' + ar(log.length) + ' تسجيلاً</div>' + (log.length ? '<table class="log"><thead><tr><th>التاريخ</th><th>النوع</th><th>الملاحظة</th></tr></thead><tbody>' + log.map(function (e) { var t = TYPE[e.type] || TYPE.note; return '<tr><td class="num">' + fmtDate(e.date, true) + '</td><td><span class="ty"><i style="background:' + t.color + '"></i>' + t.label + '</span></td><td>' + esc(e.note || '') + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty" style="padding:20px">لا تسجيلاتَ في هذه المدّة</div>') + '</div>';
      view.innerHTML = html;
      bindFilters(render);
      $('printBtn').onclick = function () { window.print(); };
      Charts.stackedBars($('wk'), weekBuckets(evs, R.from, R.to), TYPES.map(function (t) { return { key: t.key, label: t.label, color: t.hex }; }), { aria: 'تسجيلاتُ ' + s.name + ' أسبوعياً' });
      var dm = {}; evs.forEach(function (e) { dm[e.date] = dm[e.date] || {}; dm[e.date][e.type] = (dm[e.date][e.type] || 0) + 1; });
      var colors = {}; TYPES.forEach(function (t) { colors[t.key] = t.hex; });
      var calFrom = R.from < '2020-01-01' ? (Object.keys(dm).sort()[0] || today()) : R.from;
      Charts.calendar($('cal'), calFrom, R.to, dm, colors, school);
    }
    render();
  }

  /* تقريرُ الفصل */
  async function classReport(c) {
    var map = await loadDays(c._id), students = c.students || [];
    function render() {
      var R = periodRange(), evs = eventsIn(map, R.from, R.to), school = schoolDaysFor(c._id, R.from, R.to);
      var rows = students.map(function (s) { var r = { s: s }; TYPES.forEach(function (t) { r[t.key] = evs.filter(function (e) { return e.sid === s.id && e.type === t.key; }).length; }); return r; });
      var known = {}; students.forEach(function (s) { known[s.id] = 1; });
      var ghosts = {}; evs.forEach(function (e) { if (!known[e.sid]) ghosts[e.sid] = 1; });
      Object.keys(ghosts).forEach(function (sid) { var r = { s: { id: sid, name: 'متعلّمٌ محذوف' }, ghost: true }; TYPES.forEach(function (t) { r[t.key] = evs.filter(function (e) { return e.sid === sid && e.type === t.key; }).length; }); rows.push(r); });
      var sortKey = S.rankSort || 'star';
      rows.sort(function (a, b) { return sortKey === 'name' ? a.s.name.localeCompare(b.s.name, 'ar') : (b[sortKey] - a[sortKey]) || a.s.name.localeCompare(b.s.name, 'ar'); });
      var tot = {}; TYPES.forEach(function (t) { tot[t.key] = evs.filter(function (e) { return e.type === t.key; }).length; });
      var recDays = Object.keys(map).filter(function (d) { return map[d] && d >= R.from && d <= R.to; }).length;
      var html = classCrumb(c, 'تقريرُ الفصل') + reportHead('تقريرُ الفصل: ' + c.name, R.label);
      html += '<div class="ttl"><div><h2>تقريرُ ' + esc(c.name) + '</h2><p>' + ar(students.length) + ' متعلّماً · ' + esc(R.label) + '</p></div><div class="acts"><a class="btn" href="#/class/' + c._id + '">المتابعةُ اليومية</a><button class="btn p" id="printBtn">تصديرُ PDF</button></div></div>';
      html += filtersHTML();
      html += '<div class="tiles"><div class="tile hero"><div class="l">أيّامٌ مسجَّلة</div><div class="v">' + ar(recDays) + '</div><div class="s">' + (school ? 'من ' + ar(school.size) + ' حصّةً بالجدول' : 'يومٌ فيه تسجيلٌ واحدٌ على الأقلّ') + '</div></div>';
      TYPES.forEach(function (t) { html += '<div class="tile" style="--tc:' + t.color + '"><div class="l"><i></i>' + t.label + '</div><div class="v">' + ar(tot[t.key]) + '</div><div class="s">في الفصلِ كلِّه</div></div>'; });
      html += '</div>';
      html += '<div class="panel"><h3>إيقاعُ الفصلِ الأسبوعي</h3><div class="hint">مجموعُ التسجيلاتِ لكلِّ المتعلّمين في كلِّ أسبوع</div><div class="chart" id="wk"></div><div class="legend">' + TYPES.map(function (t) { return '<span><i style="background:' + t.color + '"></i>' + t.label + '</span>'; }).join('') + '</div></div>';
      var maxStar = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r.star; }))), maxAbs = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r.absent; })));
      var topStar = rows.filter(function (r) { return r.star; }).sort(function (a, b) { return b.star - a.star; }).slice(0, 8), topAbs = rows.filter(function (r) { return r.absent; }).sort(function (a, b) { return b.absent - a.absent; }).slice(0, 8);
      html += '<div class="today" style="margin-bottom:0"><div class="panel"><h3>الأكثرُ مشاركةً</h3><div class="hint">مشاركاتٌ متميّزةٌ في المدّة</div>' + (topStar.length ? '<div class="hbars">' + topStar.map(function (r) { return '<div class="hbar"><span class="nm">' + esc(r.s.name) + '</span><span class="tr"><i style="width:' + (100 * r.star / maxStar) + '%"></i></span><span class="v">' + ar(r.star) + '</span></div>'; }).join('') + '</div>' : '<div class="empty" style="padding:16px">لا مشاركاتَ مسجَّلة</div>') + '</div>'
        + '<div class="panel"><h3>الأكثرُ غياباً</h3><div class="hint">أيّامُ الغياب في المدّة</div>' + (topAbs.length ? '<div class="hbars">' + topAbs.map(function (r) { return '<div class="hbar"><span class="nm">' + esc(r.s.name) + '</span><span class="tr"><i style="width:' + (100 * r.absent / maxAbs) + '%;background:var(--c-absent)"></i></span><span class="v">' + ar(r.absent) + '</span></div>'; }).join('') + '</div>' : '<div class="empty" style="padding:16px">لا غيابَ مسجَّلاً</div>') + '</div></div>';
      html += '<div class="panel"><h3>جدولُ المتعلّمين</h3><div class="hint">انقرِ العنوانَ للترتيب، والاسمَ لفتحِ لوحةِ المتعلّم</div><table class="rank"><thead><tr><th data-k="name" style="cursor:pointer">الاسم</th>' + TYPES.map(function (t) { return '<th data-k="' + t.key + '" style="cursor:pointer;color:' + (sortKey === t.key ? 'var(--green)' : '') + '">' + (t.short || t.label) + '</th>'; }).join('') + (school ? '<th>الحضور</th>' : '') + '</tr></thead><tbody>'
        + rows.map(function (r) { return '<tr><td><a href="#/student/' + c._id + '/' + r.s.id + '">' + esc(r.s.name) + '</a>' + (r.ghost ? ' <small style="color:var(--muted)">(محذوف)</small>' : '') + '</td>' + TYPES.map(function (t) { return '<td class="num">' + (r[t.key] ? ar(r[t.key]) : '<span style="opacity:.3">—</span>') + '</td>'; }).join('') + (school ? '<td class="num">' + ar(Math.max(0, 100 - Math.round(100 * r.absent / Math.max(1, school.size)))) + '٪</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>';
      view.innerHTML = html;
      bindFilters(render);
      $('printBtn').onclick = function () { window.print(); };
      view.querySelectorAll('.rank th[data-k]').forEach(function (th) { th.onclick = function () { S.rankSort = th.dataset.k; render(); }; });
      Charts.stackedBars($('wk'), weekBuckets(evs, R.from, R.to), TYPES.map(function (t) { return { key: t.key, label: t.label, color: t.hex }; }), { aria: 'تسجيلاتُ الفصل أسبوعياً' });
    }
    render();
  }

  /* ---------------- الجدولُ الأسبوعي ---------------- */
  async function scheduleView() {
    var st = S.settings; st.schedule = st.schedule || {}; st.times = st.times || [];
    var per = st.periods || 7;
    var html = '<div class="ttl"><div><h2>الجدولُ الأسبوعي</h2><p>ضعْ فصلَ كلِّ حصّةٍ — تظهرُ حصصُ اليومِ في الرئيسة وتُحسَبُ بها نسبةُ الحضور</p></div><div class="acts"><div class="field" style="margin:0;flex-direction:row;align-items:center;gap:8px"><label>عددُ الحصص</label><input type="number" id="perN" min="1" max="10" value="' + per + '" style="width:70px"></div><button class="btn p" id="schSave">حفظُ الجدول</button></div></div>';
    if (!S.classes.length) html += '<div class="err">أضفْ فصولَك أوّلاً من «متابعةُ المتعلّمين» ثمّ عُدْ إلى الجدول</div>';
    html += '<div class="panel" style="overflow-x:auto"><table class="tt"><thead><tr><th></th>' + [0, 1, 2, 3, 4].map(function (d) { return '<th>' + DAYS[d] + '</th>'; }).join('') + '<th style="width:150px">الوقت</th></tr></thead><tbody>';
    for (var i = 0; i < per; i++) {
      html += '<tr><td class="pn">' + ar(i + 1) + '</td>';
      [0, 1, 2, 3, 4].forEach(function (d) {
        var v = (st.schedule[d] || [])[i] || '';
        html += '<td><select data-d="' + d + '" data-i="' + i + '" class="' + (v ? '' : 'empty') + '"><option value="">—</option>' + S.classes.map(function (c) { return '<option value="' + c._id + '"' + (c._id === v ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></td>';
      });
      var t = st.times[i] || {};
      html += '<td><div style="display:flex;gap:4px"><input type="time" data-ti="' + i + '" data-k="s" value="' + esc(t.s || '') + '" style="flex:1;padding:6px;border:1px solid var(--line);border-radius:8px;font-size:13px"><input type="time" data-ti="' + i + '" data-k="e" value="' + esc(t.e || '') + '" style="flex:1;padding:6px;border:1px solid var(--line);border-radius:8px;font-size:13px"></div></td></tr>';
    }
    html += '</tbody></table></div><p style="color:var(--muted);font-size:14px">الجمعةُ والسبتُ عطلة. الوقتُ اختياريٌّ لتمييزِ الحصّةِ الجاريةِ في الرئيسة.</p>';
    view.innerHTML = html;
    view.querySelectorAll('select').forEach(function (s) { s.onchange = function () { s.classList.toggle('empty', !s.value); }; });
    $('perN').onchange = function () { st.periods = Math.max(1, Math.min(10, +$('perN').value || 7)); collect(); scheduleView(); };
    function collect() {
      var sch = {}; view.querySelectorAll('select[data-d]').forEach(function (s) { var d = s.dataset.d; sch[d] = sch[d] || []; sch[d][+s.dataset.i] = s.value || null; });
      Object.keys(sch).forEach(function (d) { for (var k = 0; k < sch[d].length; k++) if (sch[d][k] === undefined) sch[d][k] = null; });
      var times = []; view.querySelectorAll('input[data-ti]').forEach(function (inp) { var i = +inp.dataset.ti; times[i] = times[i] || { s: '', e: '' }; times[i][inp.dataset.k] = inp.value; });
      st.schedule = sch; st.times = times.map(function (t) { return t || { s: '', e: '' }; });
    }
    $('schSave').onclick = async function () { collect(); try { await saveSettings(); toast('حُفظ الجدول'); } catch (e) { fail(e); } };
  }

  /* ---------------- الإعدادات ---------------- */
  async function settingsView() {
    var st = S.settings;
    function render() {
      var html = '<div class="ttl"><div><h2>الإعدادات</h2><p>الفصولُ الدراسية والحساب</p></div></div>';
      html += '<div class="panel"><h3>الفصولُ الدراسية</h3><div class="hint">تُستعملُ مدّةُ الفصلِ الحاليِّ في لوحاتِ القياس ونسبِ الحضور</div><div class="terms" id="terms">';
      (st.terms || []).forEach(function (t, i) { html += '<div class="term" data-i="' + i + '"><input data-k="name" value="' + esc(t.name) + '" placeholder="اسمُ الفصل"><input type="date" data-k="start" value="' + t.start + '"><input type="date" data-k="end" value="' + t.end + '"><button class="icon-btn" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'; });
      html += '</div><div class="row" style="margin-top:12px"><button class="btn" id="tAdd" style="flex:0 0 auto">إضافةُ فصلٍ دراسي</button><button class="btn p" id="tSave" style="flex:0 0 auto">حفظ</button></div></div>';
      var u = Auth.user();
      html += '<div class="panel"><h3>الحساب</h3><div class="hint">' + esc(FB.demo ? 'وضعٌ تجريبيٌّ محليّ — البياناتُ في هذا المتصفّحِ فقط' : 'مسجَّلٌ بـ ' + (u ? u.email : '')) + '</div><div class="row"><button class="btn" id="refreshAll" style="flex:0 0 auto">إعادةُ تحميلِ البيانات</button>' + (FB.demo ? '<button class="btn d" id="wipeDemo" style="flex:0 0 auto">مسحُ بياناتِ التجربة</button><a class="btn" href="' + location.pathname + '#/" style="flex:0 0 auto">الخروجُ من التجربة</a>' : '') + '</div></div>';
      html += '<div class="panel"><h3>عن مدرستي</h3><p style="margin:0;color:var(--muted);font-size:15px">التحضيراتُ ملفّاتٌ في مستودعِ الموقعِ نفسِه (تُرفَعُ برمزِ GitHub)، ومتابعةُ المتعلّمين محفوظةٌ في Firestore ولا يقرؤها إلا حسابُك. البياناتُ تُخزَّنُ محلّياً أيضاً لتسريعِ الفتح.</p></div>';
      view.innerHTML = html;
      $('tAdd').onclick = function () { collect(); st.terms.push({ id: uid('t'), name: 'فصلٌ دراسيٌّ جديد', start: today(), end: addDays(today(), 120) }); render(); };
      $('terms').addEventListener('click', function (e) { var b = e.target.closest('[data-act=del]'); if (!b) return; collect(); st.terms.splice(+b.closest('.term').dataset.i, 1); render(); });
      $('tSave').onclick = async function () { collect(); try { await saveSettings(); toast('حُفظ'); } catch (err) { fail(err); } };
      $('refreshAll').onclick = async function () { S.days = {}; await loadCore(true); toast('حُدِّثت البيانات'); render(); };
      if ($('wipeDemo')) $('wipeDemo').onclick = function () { if (confirm('مسحُ بياناتِ التجربة؟')) { localStorage.removeItem('sc_demo_db_v1'); localStorage.removeItem('sc_core_v1'); location.reload(); } };
    }
    function collect() { var terms = []; view.querySelectorAll('.term').forEach(function (r) { var t = {}; r.querySelectorAll('[data-k]').forEach(function (i) { t[i.dataset.k] = i.value; }); t.id = (st.terms[+r.dataset.i] || {}).id || uid('t'); if (t.name && t.start && t.end) terms.push(t); }); st.terms = terms; }
    render();
  }

  /* ---------------- الوضعُ التجريبي: بذرة ---------------- */
  async function seedDemo() {
    if (!FB.demo || localStorage.getItem('sc_demo_db_v1')) return;
    var c1 = 'cdemo1', c2 = 'cdemo2', names1 = ['علي حسين', 'محمد جاسم', 'يوسف عبدالله', 'حسن الصالح', 'عبدالعزيز فهد', 'أحمد الكندري', 'سالم ناصر', 'خالد العنزي', 'فيصل مبارك', 'عمر السبيعي', 'بدر الشمري', 'ناصر العجمي'];
    var names2 = ['حمد راشد', 'جابر علي', 'مشاري سعد', 'طلال يوسف', 'ضاري فهد', 'عبدالرحمن صالح', 'راكان محمد', 'سعود عبدالله', 'نواف حسين', 'زيد الرشيدي'];
    var st1 = names1.map(function (n, i) { return { id: 'sd1' + i, name: n }; }), st2 = names2.map(function (n, i) { return { id: 'sd2' + i, name: n }; });
    await DB.set('sc_classes', c1, { name: 'عاشر ٦', grade: '10', order: 1, students: st1, created: today() });
    await DB.set('sc_classes', c2, { name: 'عاشر ٣', grade: '10', order: 2, students: st2, created: today() });
    var st = defaultSettings(); st.schedule = { 0: [c1, null, c2, null, null, null, null], 1: [null, c2, null, c1, null, null, null], 2: [c1, null, null, null, c2, null, null], 3: [null, c1, c2, null, null, null, null], 4: [c2, null, c1, null, null, null, null] };
    st.times = [{ s: '07:30', e: '08:15' }, { s: '08:15', e: '09:00' }, { s: '09:00', e: '09:45' }, { s: '10:05', e: '10:50' }, { s: '10:50', e: '11:35' }, { s: '11:35', e: '12:20' }, { s: '12:20', e: '13:05' }];
    st.terms[0].start = addDays(today(), -50);
    await DB.set('sc_meta', 'settings', st);
    var rnd = function (n) { return Math.floor(Math.random() * n); };
    for (var d = addDays(today(), -49); d <= today(); d = addDays(d, 1)) {
      var dow = pd(d).getDay(); if (dow === 5 || dow === 6) continue;
      [[c1, st1], [c2, st2]].forEach(function (pair) {
        if ((st.schedule[dow] || []).indexOf(pair[0]) < 0) return;
        var ev = []; pair[1].forEach(function (s, i) {
          if (Math.random() < (i === 3 ? .3 : .06)) ev.push({ id: uid('e'), sid: s.id, type: 'absent', ts: Date.now() });
          else { if (Math.random() < (i < 3 ? .45 : .15)) ev.push({ id: uid('e'), sid: s.id, type: 'star', ts: Date.now() }); if (Math.random() < .12) ev.push({ id: uid('e'), sid: s.id, type: 'wc', ts: Date.now() }); if (Math.random() < (i === 7 ? .25 : .04)) ev.push({ id: uid('e'), sid: s.id, type: 'bad', ts: Date.now() }); if (Math.random() < .05) ev.push({ id: uid('e'), sid: s.id, type: 'note', note: ['لم يُحضرِ الكتاب', 'تحسّنٌ ملحوظٌ في الخطّ', 'يحتاجُ متابعةً في الإملاء', 'قدّم واجبَه مبكّراً'][rnd(4)], ts: Date.now() }); }
        });
        if (ev.length) DB.set('sc_days', pair[0] + '_' + d, { cls: pair[0], date: d, ev: ev });
      });
    }
    await new Promise(function (r) { setTimeout(r, 300); });
  }

  /* ---------------- الإقلاع ---------------- */
  (async function boot() {
    await Auth.restore();
    if (FB.demo) await seedDemo();
    if (!location.hash) location.hash = '#/';
    route();
  })();
})();
