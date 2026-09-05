/* ===== مدرستي — التطبيق: توجيهٌ بالهاش، التحضيرات، الفصول، المتابعةُ اليومية، لوحاتُ القياس، الجدول، الطابورُ بلا إنترنت ===== */
(function () {
  'use strict';
  var DB = FB.DB, Auth = FB.Auth;
  var OWNER = 'haydarvsky', REPO = 'haydarvsky.github.io', BRANCH = 'main', PREFIX = 'madrasa/';
  var TOKEN_KEYS = ['hv_token', 'ed_token', 'ar_token', 'br_token', 'vd_token', 'bg_token'];
  var TYPES = [
    { key: 'absent', label: 'غياب', color: 'var(--c-absent)', hex: '#A63D2F', ico: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/></svg>', single: true },
    { key: 'star', label: 'مشاركةٌ متميّزة', short: 'مشاركة', color: 'var(--c-star)', hex: '#D9A441', ico: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z"/></svg>', cats: true },
    { key: 'wc', label: 'خروجٌ للحمّام', short: 'خروج', color: 'var(--c-wc)', hex: '#1E7A46', ico: '<svg viewBox="0 0 24 24"><path d="M4 12h11"/><path d="M11 8l4 4-4 4"/><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/></svg>' },
    { key: 'bad', label: 'سلوكٌ غيرُ لائق', short: 'سلوك', color: 'var(--c-bad)', hex: '#5B4BB5', ico: '<svg viewBox="0 0 24 24"><path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 17.2v.3"/></svg>', cats: true },
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
  function fail(e) { console.error(e); toast(e && e.message || 'حدث خطأ', true); }
  function fmtTs(ts) { var d = new Date(ts); return fmtDate(iso(d)) + ' ' + ar(('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2)); }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  /* ---------------- الحالة ---------------- */
  var S = { user: null, role: 'owner', settings: null, classes: null, allClasses: null, days: {}, prep: null, date: today(), dashFilter: 'term', quick: false, sort: 'manual' };
  var LS = { get: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del: function (k) { try { localStorage.removeItem(k); } catch (e) { } } };
  function RO() { return S.role !== 'owner'; }

  var DEFAULT_CATS = {
    star: ['إجابةٌ متميّزة', 'قراءةٌ جيّدة', 'عملٌ جماعي', 'مبادرة', 'واجبٌ نموذجي'],
    bad: ['تأخّر', 'لم يُحضرِ الكتاب', 'إزعاج', 'لم يحلَّ الواجب', 'استخدامُ الهاتف']
  };
  var DEFAULT_W = { absent: -3, star: 2, wc: 0, bad: -2, note: 0 };
  function defaultSettings() {
    var now = new Date(), y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      periods: 7,
      terms: [
        { id: 't1', name: 'الفصلُ الدراسيُّ الأوّل ' + ar(y) + '/' + ar(y + 1), start: y + '-09-01', end: (y + 1) + '-01-31' },
        { id: 't2', name: 'الفصلُ الدراسيُّ الثاني ' + ar(y) + '/' + ar(y + 1), start: (y + 1) + '-02-01', end: (y + 1) + '-06-30' }
      ],
      schedule: {}, times: [], cats: DEFAULT_CATS, weights: DEFAULT_W, absAlert: 3, badAlert: 3, viewers: []
    };
  }
  function normSettings(st) {
    var d = defaultSettings(); st = Object.assign(d, st || {});
    st.cats = Object.assign({}, DEFAULT_CATS, st.cats || {}); st.weights = Object.assign({}, DEFAULT_W, st.weights || {});
    if (!Array.isArray(st.viewers)) st.viewers = [];
    return st;
  }
  async function loadCore(force) {
    if (S.settings && S.classes && !force) return;
    var cached = LS.get('sc_core_v1');
    if (cached) { S.settings = normSettings(cached.settings); S.allClasses = cached.allClasses || cached.classes || []; splitClasses(); }
    if (!force && cached && !navigator.onLine) return;
    try {
      var res = await Promise.all([DB.get('sc_meta', 'settings'), DB.list('sc_classes')]);
      var st = res[0], cl = res[1];
      S.settings = normSettings(st);
      if (!st && !RO()) await DB.set('sc_meta', 'settings', S.settings).catch(function () { });
      S.allClasses = cl; splitClasses(); persistCore();
    } catch (e) { if (!cached || !FB.isNetErr(e)) throw e; }
  }
  function splitClasses() {
    S.classes = (S.allClasses || []).filter(function (c) { return !c.archived; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(b.name, 'ar'); });
  }
  function persistCore() { LS.set('sc_core_v1', { settings: S.settings, allClasses: S.allClasses }); }
  function currentTerm(d) {
    d = d || today(); var t = (S.settings.terms || []).filter(function (t) { return t.start <= d && d <= t.end; })[0];
    return t || (S.settings.terms || []).slice().sort(function (a, b) { return a.start < b.start ? 1 : -1; })[0] || null;
  }
  function cls(id) { return (S.allClasses || []).filter(function (c) { return c._id === id; })[0]; }
  function saveSettings() { persistCore(); return write('set', 'sc_meta', 'settings', S.settings); }

  /* ---------------- الطابورُ بلا إنترنت ---------------- */
  var QKEY = 'sc_queue_v1';
  function queue() { return LS.get(QKEY, []); }
  function setQueue(q) { LS.set(QKEY, q); renderNet(); }
  async function write(op, col, id, data) {
    if (RO()) throw new Error('حسابُك للقراءةِ فقط');
    if (queue().length || !navigator.onLine) { pushQ(op, col, id, data); flush(); return; }
    try { return await (op === 'del' ? DB.del(col, id) : DB.set(col, id, data)); }
    catch (e) { if (FB.isNetErr(e)) { pushQ(op, col, id, data); toast('لا شبكة — حُفظ محلّياً وسيُرسَلُ لاحقاً'); return; } throw e; }
  }
  function pushQ(op, col, id, data) { var q = queue().filter(function (x) { return !(x.col === col && x.id === id); }); q.push({ op: op, col: col, id: id, data: data, ts: Date.now() }); setQueue(q); }
  var flushing = false;
  async function flush() {
    if (flushing) return; var q = queue(); if (!q.length || !navigator.onLine) return;
    flushing = true;
    while (q.length) {
      var it = q[0];
      try { await (it.op === 'del' ? DB.del(it.col, it.id) : DB.set(it.col, it.id, it.data)); q.shift(); setQueue(q); }
      catch (e) { if (FB.isNetErr(e)) break; q.shift(); setQueue(q); toast('رُفض تسجيلٌ مؤجَّل: ' + e.message, true); }
    }
    flushing = false; renderNet(); if (!queue().length && q.length === 0) toast('أُرسلت التسجيلاتُ المؤجَّلة');
  }
  window.addEventListener('online', function () { renderNet(); flush(); });
  window.addEventListener('offline', renderNet);
  function renderNet() {
    var bar = $('netbar'); if (!bar) return;
    var n = queue().length;
    if (navigator.onLine && !n) { bar.hidden = true; return; }
    bar.hidden = false; bar.className = 'netbar' + (navigator.onLine ? ' ok' : '');
    bar.innerHTML = navigator.onLine ? '<span>' + ar(n) + ' تسجيلاً بانتظارِ الإرسال</span><button id="flushBtn">أرسلِ الآن</button>' : '<span>بلا إنترنت — التسجيلاتُ تُحفَظُ محلّياً' + (n ? ' (' + ar(n) + ' بانتظارِ الإرسال)' : '') + '</span>';
    var fb = $('flushBtn'); if (fb) fb.onclick = flush;
  }

  /* ---------------- سجلُّ التعديلات ---------------- */
  async function log(act, detail) {
    if (RO()) return;
    var id = 'log_' + today().slice(0, 7);
    var doc = S.logCache && S.logCache._id === id ? S.logCache : (await DB.get('sc_log', id).catch(function () { return null; })) || { items: [] };
    doc.items = (doc.items || []).concat([{ ts: Date.now(), act: act, d: String(detail || '') }]).slice(-500);
    S.logCache = Object.assign({ _id: id }, doc);
    write('set', 'sc_log', id, { items: doc.items }).catch(function () { });
  }

  /* أيامُ فصلٍ: ذاكرةٌ لكلِّ فصل + نسخةٌ محلّية للعملِ بلا شبكة */
  function persistDays(cid) { LS.set('sc_days_' + cid, S.days[cid]); }
  async function loadDays(cid, force) {
    var c = S.days[cid];
    if (c && !force && Date.now() - c.at < 10 * 60 * 1000) return c.map;
    var ls = LS.get('sc_days_' + cid);
    if (!navigator.onLine && ls) { S.days[cid] = ls; return ls.map; }
    try {
      var rows = await DB.query('sc_days', [['cls', 'EQUAL', cid]]);
      var map = {}; rows.forEach(function (r) { map[r.date] = r; });
      queue().forEach(function (q) { if (q.col === 'sc_days' && q.data && q.data.cls === cid) { if (q.op === 'del') delete map[q.data.date]; else map[q.data.date] = Object.assign({ _id: q.id }, q.data); } });
      S.days[cid] = { at: Date.now(), map: map }; persistDays(cid);
      return map;
    } catch (e) { if (ls) { S.days[cid] = ls; toast('عرضُ آخرِ نسخةٍ محفوظة'); return ls.map; } throw e; }
  }
  async function loadDay(cid, date) {
    var c = S.days[cid];
    if (c && c.map[date] !== undefined) return c.map[date];
    var ls = LS.get('sc_days_' + cid);
    if (!S.days[cid]) S.days[cid] = ls || { at: 0, map: {} };
    try {
      var d = await DB.get('sc_days', cid + '_' + date);
      S.days[cid].map[date] = d || null; persistDays(cid);
      return d;
    } catch (e) { if (FB.isNetErr(e)) return S.days[cid].map[date] || null; throw e; }
  }
  async function saveDay(cid, date, doc) {
    var id = cid + '_' + date;
    if (!S.days[cid]) S.days[cid] = { at: 0, map: {} };
    if (!doc.ev.length && !doc.taken) { S.days[cid].map[date] = null; persistDays(cid); await write('del', 'sc_days', id, { cls: cid, date: date }); return; }
    var data = { cls: cid, date: date, ev: doc.ev }; if (doc.taken) data.taken = true;
    S.days[cid].map[date] = Object.assign({ _id: id }, data); persistDays(cid);
    await write('set', 'sc_days', id, data);
  }

  /* ---------------- الترويسة ---------------- */
  function renderHeader() {
    var d = new Date();
    $('hdDate').innerHTML = '<b>' + DAYS[d.getDay()] + ' ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + ar(d.getFullYear()) + '</b>' + esc(hijri(d));
    var u = Auth.user(), n = queue().length;
    $('hdUser').innerHTML = u ? '<span class="dot' + (navigator.onLine ? '' : ' off') + '"></span><span>' + esc(FB.demo ? 'وضعٌ تجريبيّ (محليّ)' : u.email) + '</span>' + (RO() ? '<span class="ro">قراءةٌ فقط</span>' : '') + (n ? '<span class="q" title="تسجيلاتٌ بانتظارِ الإرسال">' + ar(n) + '</span>' : '') + '<button type="button" id="logout">خروج</button>' : '<span class="dot off"></span><span>غيرُ متّصل</span>';
    var lo = $('logout'); if (lo) lo.onclick = function () { if (queue().length && !confirm('هناك تسجيلاتٌ لم تُرسَلْ بعد — تبقى محفوظةً في هذا المتصفّح حتى تدخلَ ثانية. متابعةُ الخروج؟')) return; Auth.signOut(); S.user = null; S.settings = null; S.classes = null; S.allClasses = null; S.days = {}; LS.del('sc_core_v1'); route(); };
    renderNet();
  }

  /* ---------------- التوجيه ---------------- */
  function parts() { return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); }
  var ROUTES = { '': home, prep: prep, classes: classes, class: classView, student: studentDash, schedule: scheduleView, settings: settingsView, overview: overview, log: logView };
  async function route() {
    var p = parts(), r = p[0] || '';
    document.querySelectorAll('#tabs a').forEach(function (a) {
      var on = a.dataset.r === r || (['class', 'student', 'overview'].indexOf(r) >= 0 && a.dataset.r === 'classes') || (r === 'log' && a.dataset.r === 'settings');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    closeSheet(); document.body.classList.remove('brief');
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
      + '<div class="alt">أوّلُ مرّة؟ <button type="button" id="lnew">أنشئْ حسابَك</button> · <button type="button" id="lforgot">نسيتُ كلمةَ المرور</button></div>'
      + '<div class="alt" style="margin-top:22px;border-top:1px solid var(--line);padding-top:12px">أو <a href="#/prep" style="color:var(--green);font-weight:700">تصفّحِ التحضيرات</a> بلا دخول · <a href="?demo=1#/" style="color:var(--muted)">وضعٌ تجريبيّ</a></div></div>';
    var go = async function (mode) {
      var em = $('lemail').value.trim(), pw = $('lpw').value;
      $('lerr').innerHTML = '';
      if (!em || (mode !== 'forgot' && !pw)) { $('lerr').innerHTML = '<div class="err">أكملِ البريدَ وكلمةَ المرور</div>'; return; }
      $('lgo').disabled = true;
      try {
        if (mode === 'forgot') { await Auth.resetPassword(em); $('lerr').innerHTML = '<div class="ok">أُرسلت رسالةُ الاستعادةِ إلى بريدك</div>'; }
        else { await (mode === 'new' ? Auth.signUp(em, pw) : Auth.signIn(em, pw)); LS.set('sc_last_email', em); setRole(); route(); }
      } catch (e) { $('lerr').innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
      $('lgo').disabled = false;
    };
    $('lgo').onclick = function () { go('in'); };
    $('lnew').onclick = function () { go('new'); };
    $('lforgot').onclick = function () { go('forgot'); };
    $('lpw').addEventListener('keydown', function (e) { if (e.key === 'Enter') go('in'); });
  }
  function setRole() { var u = Auth.user(); S.role = (!u || FB.demo || (u.email || '').toLowerCase() === Auth.cfg.OWNER_EMAIL) ? 'owner' : 'viewer'; }

  /* ---------------- الرئيسة: اليوم ---------------- */
  async function home() {
    var d = new Date(), dow = d.getDay(), sched = (S.settings.schedule || {})[dow] || [];
    var nowMin = d.getHours() * 60 + d.getMinutes();
    var per = S.settings.periods || 7, times = S.settings.times || [];
    var prepM = await loadPrep().catch(function () { return { items: [] }; });
    var alerts = collectAlerts();
    var html = '<div class="ttl"><div><h2>' + DAYS[dow] + '</h2><p>' + esc(hijri(d)) + ' — ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + ar(d.getFullYear()) + '</p></div>'
      + '<div class="acts"><a class="btn" href="#/overview">مقارنةُ الفصول</a>' + (RO() ? '' : '<a class="btn" href="#/schedule">تعديلُ الجدول</a>') + '</div></div>';
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
        if (c) {
          var preps = prepM.items.filter(function (it) { return it.grade === c.grade && it.date === today(); });
          html += '<a class="period' + (isNow ? ' now' : '') + '" href="#/class/' + c._id + '"><span class="n">' + ar(i + 1) + '</span><span class="c">' + esc(c.name) + (preps.length ? '<span class="today-prep">' + preps.map(function (it) { return '<span>📄 ' + esc(it.title) + '</span>'; }).join('') + '</span>' : '') + '</span><span class="m">' + (t && t.s ? esc(t.s + '–' + t.e) : ar(c.students ? c.students.length : 0) + ' متعلّماً') + '</span></a>';
        } else html += '<div class="period free"><span class="n">' + ar(i + 1) + '</span><span class="c">حصّةٌ فارغة</span></div>';
      }
      html += '</div>';
      var todays = prepM.items.filter(function (it) { return it.date === today(); });
      if (todays.length) html += '<div class="panel" style="margin-top:12px"><h3>تحضيرُ اليوم</h3><div class="files">' + todays.map(function (it) { return '<a class="file" href="prep/' + it.grade + '/' + it.sem + '/' + encodeURIComponent(it.file) + '" target="_blank" rel="noopener"><div class="pdf">PDF</div><div class="t"><b>' + esc(it.title) + '</b><small>' + esc(GRADES[it.grade]) + (it.unit ? ' · الوحدة ' + esc(it.unit) : '') + (it.lesson ? ' · ' + esc(it.lesson) : '') + '</small></div></a>'; }).join('') + '</div></div>';
    }
    if (alerts.length) html += '<div class="panel" style="margin-top:12px"><h3>تنبيهات</h3><div class="hint">متعلّمون تجاوزوا حدَّ الغيابِ أو السلوك في الفصلِ الدراسيِّ الحالي</div><div class="alerts">' + alerts.slice(0, 8).map(alertHTML).join('') + '</div></div>';
    html += '</div><div class="grid">'
      + '<a class="card green" href="#/prep"><div class="ico"><svg viewBox="0 0 24 24"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14.5 3.5V8H19"/><path d="M8 12h8M8 15.5h8"/></svg></div><h3>التحضيرات</h3><p>ملفّاتُ تحضيرِك للصفوفِ الثلاثةِ بفصلَيها</p></a>'
      + '<a class="card gold" href="#/classes"><div class="ico"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M14.5 19a4.5 4.5 0 0 1 7-3.5"/></svg></div><span class="cnt">' + ar(S.classes.length) + ' فصول</span><h3>متابعةُ المتعلّمين</h3><p>غيابٌ ومشاركةٌ وسلوكٌ وملاحظاتٌ يوماً بيوم</p></a>';
    S.classes.slice(0, 6).forEach(function (c) { html += classCard(c); });
    html += '</div></div>';
    view.innerHTML = html;
  }
  function collectAlerts() {
    var out = [], tm = currentTerm(); if (!tm) return out;
    (S.classes || []).forEach(function (c) {
      var cache = S.days[c._id] || LS.get('sc_days_' + c._id); if (!cache) return;
      var evs = eventsIn(cache.map, tm.start, today());
      (c.students || []).forEach(function (s) {
        var a = evs.filter(function (e) { return e.sid === s.id && e.type === 'absent'; }).length, b = evs.filter(function (e) { return e.sid === s.id && e.type === 'bad'; }).length;
        if (a >= (S.settings.absAlert || 3)) out.push({ c: c, s: s, kind: 'absent', n: a });
        if (b >= (S.settings.badAlert || 3)) out.push({ c: c, s: s, kind: 'bad', n: b });
      });
    });
    return out.sort(function (x, y) { return y.n - x.n; });
  }
  function alertHTML(a) { return '<div class="al"><span class="pip ' + a.kind + '">!</span><span style="flex:1"><a href="#/student/' + a.c._id + '/' + a.s.id + '">' + esc(a.s.name) + '</a> <small style="color:var(--muted)">' + esc(a.c.name) + '</small></span><span>' + ar(a.n) + ' ' + (a.kind === 'absent' ? 'أيّامَ غياب' : 'تسجيلاتِ سلوك') + '</span></div>'; }

  /* ---------------- التحضيرات ---------------- */
  async function loadPrep(force) {
    if (S.prep && !force) return S.prep;
    var r = await fetch('data/prep.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).catch(function () { return LS.get('sc_prep_cache', { items: [] }); });
    S.prep = r; LS.set('sc_prep_cache', r); return r;
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
  function itemMeta(i) { var parts = []; if (i.unit) parts.push('الوحدة ' + i.unit); if (i.lesson) parts.push(i.lesson); if (i.week) parts.push('الأسبوع ' + ar(i.week)); if (i.date) parts.push('حصّة ' + fmtDate(i.date)); return parts.map(esc).join(' · '); }
  function crumbsFor(g, s) { return '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span><a href="#/prep">التحضيرات</a><span class="sep">›</span><a href="#/prep/' + g + '">' + esc(GRADES[g]) + '</a><span class="sep">›</span>' + esc(SEMS[s]) + '</div>'; }
  function renderPrepFolder(g, s, crumbs) {
    var q = (S.prepQ || '').trim();
    var items = S.prep.items.filter(function (i) { return i.grade === g && i.sem === s; }).sort(function (a, b) { return (num(a.week, 0) - num(b.week, 0)) || (a.order || 0) - (b.order || 0) || String(a.added).localeCompare(String(b.added)); });
    if (q) items = items.filter(function (i) { return [i.title, i.file, i.unit, i.lesson, i.week, i.date].join(' ').indexOf(q) >= 0; });
    var canUp = !!ghToken();
    var html = crumbs + '<div class="ttl"><div><h2>' + esc(SEMS[s]) + '</h2><p>' + esc(GRADES[g]) + ' — ' + (items.length ? ar(items.length) + ' تحضيراً' : 'المجلّدُ فارغ') + '</p></div>'
      + '<div class="acts">' + (canUp ? '<button class="btn p" id="pickBtn">إضافةُ PDF</button>' : '<button class="btn" id="tokBtn">تفعيلُ الرفع</button>') + '</div></div>';
    html += '<div class="searchbar"><input id="prepQ" placeholder="ابحثْ بالعنوانِ أو الوحدةِ أو الدرس…" value="' + esc(q) + '"></div>';
    if (canUp) html += '<div class="drop" id="drop"><b>أفلتْ ملفّاتَ PDF هنا</b>أو انقرْ للاختيار — يُرفَعُ الملفُّ إلى الموقعِ ويُحفَظُ باسمِه<input type="file" id="fileIn" accept="application/pdf" multiple hidden><div class="prog" id="prog" hidden><i></i></div></div>';
    else html += '<div id="tokBox" hidden class="panel"><h3>رمزُ الرفع</h3><div class="hint">ألصقْ رمزَ GitHub (Contents R/W على المستودع) مرّةً واحدة؛ يُحفَظُ في هذا المتصفّح كما في مركزِ التحكّم.</div><div class="inline-add"><input id="tokIn" type="password" placeholder="ghp_…"><button class="btn p" id="tokSave">حفظ</button></div></div>';
    html += '<div class="files" id="files">';
    if (!items.length) html += '<div class="empty"><b>' + (q ? 'لا نتائج' : 'لا تحضيراتَ بعد') + '</b>' + (q ? 'جرّبْ كلمةً أخرى' : canUp ? 'أفلتْ أوّلَ ملفٍّ في المربّعِ أعلاه' : 'فعّلِ الرفعَ ثمّ أضفِ الملفّات') + '</div>';
    items.forEach(function (i) {
      var url = 'prep/' + g + '/' + s + '/' + encodeURIComponent(i.file), meta = itemMeta(i);
      html += '<div class="file" data-id="' + i.id + '"><div class="pdf">PDF</div><div class="t"><b title="' + esc(i.title) + '">' + esc(i.title) + '</b><small>' + (meta ? meta + ' · ' : '') + esc(i.file) + (i.size ? ' · ' + fmtSize(i.size) : '') + '</small></div>'
        + '<div class="a"><a class="btn s" href="' + url + '" target="_blank" rel="noopener">عرض</a><a class="btn s p" href="' + url + '" download="' + esc(i.file) + '">تنزيل</a>'
        + (canUp ? '<button class="icon-btn" data-act="ren" title="تعديلُ البيانات"><svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/></svg></button><button class="icon-btn" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg></button>' : '') + '</div></div>';
    });
    view.innerHTML = html + '</div>';
    $('prepQ').oninput = function () { S.prepQ = this.value; var v = this.value; renderPrepFolder(g, s, crumbs); var i = $('prepQ'); i.focus(); i.setSelectionRange(v.length, v.length); };
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
      if (b.dataset.act === 'ren') editPrepItem(it, g, s);
      if (b.dataset.act === 'del') { if (!confirm('حذفُ «' + it.title + '» من الموقع نهائياً؟')) return; S.prep.items = S.prep.items.filter(function (x) { return x.id !== id; }); commitPrep('حذفُ تحضير: ' + it.title, [], [PREFIX + 'prep/' + g + '/' + s + '/' + it.file]).then(function () { renderPrepFolder(g, s, crumbs); }); }
    });
  }
  function editPrepItem(it, g, s) {
    openSheet('<div class="who"><div><h3>بياناتُ التحضير</h3><small>' + esc(it.file) + '</small></div></div>'
      + '<div class="field"><label>العنوانُ الظاهر</label><input id="pTitle" value="' + esc(it.title) + '"></div>'
      + '<div class="row"><div class="field"><label>الوحدة</label><input id="pUnit" value="' + esc(it.unit || '') + '" placeholder="١"></div><div class="field"><label>الدرس</label><input id="pLesson" value="' + esc(it.lesson || '') + '" placeholder="اسمُ الدرس"></div></div>'
      + '<div class="row"><div class="field"><label>الأسبوع</label><input id="pWeek" type="number" min="1" max="20" value="' + esc(it.week || '') + '"></div><div class="field"><label>تاريخُ الحصّة (يظهرُ في الرئيسة)</label><input id="pDate" type="date" value="' + esc(it.date || '') + '"></div></div>'
      + '<div class="foot"><button class="btn s" id="shClose">إلغاء</button><button class="btn p" id="pSave">حفظٌ ونشر</button></div>');
    $('shClose').onclick = closeSheet;
    $('pSave').onclick = function () {
      it.title = $('pTitle').value.trim() || it.title; it.unit = $('pUnit').value.trim(); it.lesson = $('pLesson').value.trim(); it.week = $('pWeek').value; it.date = $('pDate').value;
      closeSheet(); commitPrep('تعديلُ بياناتِ تحضير: ' + it.title, [], []).then(function () { renderPrepFolder(g, s, crumbsFor(g, s)); });
    };
  }
  function readB64(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(file); }); }
  async function commitPrep(message, files, deletes, onProgress) {
    var gh = new GhApi({ owner: OWNER, repo: REPO, branch: BRANCH, token: ghToken() });
    S.prep.updated = today();
    files.push({ path: PREFIX + 'data/prep.json', text: JSON.stringify(S.prep, null, 2) });
    try { await gh.commit({ message: message, files: files, deletes: deletes, onProgress: onProgress || function () { } }); LS.set('sc_prep_cache', S.prep); toast('نُشر — يظهرُ على الموقعِ خلالَ دقيقة'); }
    catch (e) { fail(e); await loadPrep(true); throw e; }
  }
  async function uploadFiles(g, s, list) {
    list = list.filter(function (f) { return /pdf$/i.test(f.name) || f.type === 'application/pdf'; });
    if (!list.length) { toast('اخترْ ملفّاتَ PDF فقط', true); return; }
    var prog = $('prog'), bar = prog.querySelector('i'); prog.hidden = false; bar.style.width = '5%';
    var files = [], now = today();
    for (var i = 0; i < list.length; i++) {
      var f = list[i], name = safeName(f.name);
      S.prep.items = S.prep.items.filter(function (x) { return !(x.grade === g && x.sem === s && x.file === name); });
      files.push({ path: PREFIX + 'prep/' + g + '/' + s + '/' + name, base64: await readB64(f) });
      S.prep.items.push({ id: uid('p'), grade: g, sem: s, title: name.replace(/\.pdf$/i, ''), file: name, size: f.size, added: now, order: S.prep.items.length + 1, unit: '', lesson: '', week: '', date: '' });
      bar.style.width = (5 + 35 * (i + 1) / list.length) + '%';
    }
    try {
      await commitPrep('تحضيرات: إضافةُ ' + ar(list.length) + ' ملفّاً إلى ' + GRADES[g] + ' / ' + SEMS[s], files, [], function (p) { if (p.stage === 'upload') bar.style.width = (40 + 50 * p.done / p.total) + '%'; if (p.stage === 'done') bar.style.width = '100%'; });
    } catch (e) { }
    renderPrepFolder(g, s, crumbsFor(g, s));
  }

  /* ---------------- الفصول ---------------- */
  function classCard(c) {
    return '<div class="card hov cls-card"><span class="grade-badge">' + esc(GRADES[c.grade] || '') + '</span><h3><a href="#/class/' + c._id + '">' + esc(c.name) + '</a></h3><p class="students-n">' + ar((c.students || []).length) + ' متعلّماً' + (c.archived ? ' · مؤرشف' + (c.year ? ' — ' + esc(c.year) : '') : '') + '</p>'
      + '<div class="crow">' + (c.archived ? '' : '<a class="btn s p" href="#/class/' + c._id + '">المتابعةُ اليومية</a>') + '<a class="btn s g" href="#/class/' + c._id + '/report">تقريرُ الفصل</a><a class="btn s" href="#/class/' + c._id + '/students">المتعلّمون</a></div></div>';
  }
  async function classes() {
    var html = '<div class="ttl"><div><h2>فصولي</h2><p>اخترْ فصلاً للمتابعةِ اليومية، أو أضفْ فصلاً جديداً</p></div><div class="acts"><a class="btn" href="#/overview">مقارنةُ الفصول</a></div></div>';
    if (!RO()) html += '<div class="panel"><h3>إضافةُ فصل</h3><div class="row"><div class="field" style="flex:2"><label>اسمُ الفصل</label><input id="cName" placeholder="مثال: عاشر ٦"></div><div class="field"><label>الصفّ</label><select id="cGrade"><option value="10">العاشر</option><option value="11">الحاديَ عشر</option><option value="12">الثانيَ عشر</option></select></div><div class="field" style="flex:0 0 auto"><label>&nbsp;</label><button class="btn p" id="cAdd">إضافة</button></div></div></div>';
    html += '<div class="grid" id="clsGrid">';
    if (!S.classes.length) html += '<div class="empty" style="grid-column:1/-1"><b>لا فصولَ بعد</b>أضفْ أوّلَ فصلٍ من الأعلى — ثمّ أدخلْ أسماءَ متعلّميه</div>';
    S.classes.forEach(function (c) { html += classCard(c); });
    html += '</div>';
    var arch = S.allClasses.filter(function (c) { return c.archived; });
    if (arch.length) html += '<div class="manage archived-list"><details><summary>الفصولُ المؤرشفة (' + ar(arch.length) + ')</summary><div class="grid" style="margin-top:14px">' + arch.map(classCard).join('') + '</div></details></div>';
    view.innerHTML = html;
    if ($('cAdd')) {
      $('cAdd').onclick = async function () {
        var n = $('cName').value.trim(); if (!n) { $('cName').focus(); return; }
        var id = uid('c'), doc = { name: n, grade: $('cGrade').value, order: S.classes.length + 1, students: [], created: today() };
        try { await write('set', 'sc_classes', id, doc); S.allClasses.push(Object.assign({ _id: id }, doc)); splitClasses(); persistCore(); log('إضافةُ فصل', n); location.hash = '#/class/' + id + '/students'; } catch (e) { fail(e); }
      };
      $('cName').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('cAdd').click(); });
    }
  }
  function classCrumb(c, extra) { return '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span><a href="#/classes">فصولي</a><span class="sep">›</span><a href="#/class/' + c._id + '">' + esc(c.name) + '</a>' + (extra ? '<span class="sep">›</span>' + extra : '') + '</div>'; }
  async function classView(p) {
    var c = cls(p[0]); if (!c) { location.hash = '#/classes'; return; }
    if (p[1] === 'report') return classReport(c);
    if (p[1] === 'students') return studentsManage(c);
    return dailyView(c);
  }
  async function saveClass(c, what) {
    var d = { name: c.name, grade: c.grade, order: c.order || 0, students: c.students || [], created: c.created || today() };
    if (c.archived) { d.archived = true; d.archivedAt = c.archivedAt || today(); if (c.year) d.year = c.year; }
    persistCore(); await write('set', 'sc_classes', c._id, d); if (what) log(what, c.name);
  }
  function sortedStudents(c) {
    var list = (c.students || []).slice();
    if (S.sort === 'alpha') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ar'); });
    else if (S.sort === 'no') list.sort(function (a, b) { return (num(a.no, 1e9) - num(b.no, 1e9)) || a.name.localeCompare(b.name, 'ar'); });
    return list;
  }

  /* إدارةُ الطلاب */
  async function studentsManage(c) {
    c.students = c.students || [];
    function render() {
      var ro = RO();
      var html = classCrumb(c, 'المتعلّمون') + '<div class="ttl"><div><h2>متعلّمو ' + esc(c.name) + '</h2><p>' + ar(c.students.length) + ' متعلّماً — ' + (ro ? 'قراءةٌ فقط' : 'أضفْ أو احذفْ أو عدّلِ الأسماءَ في مكانِها، واسحبْ ⋮⋮ للترتيب') + '</p></div><div class="acts">' + (c.archived ? '' : '<a class="btn p" href="#/class/' + c._id + '">المتابعةُ اليومية</a>') + '</div></div>';
      if (!ro && !c.archived) html += '<div class="panel"><h3>إضافةُ متعلّم</h3><div class="inline-add"><input id="sName" placeholder="اسمُ المتعلّم ثمّ Enter"><button class="btn p" id="sAdd">إضافة</button></div>'
        + '<details class="bulk"><summary style="cursor:pointer;color:var(--amber);font-size:15px">إضافةُ قائمةٍ كاملة (اسمٌ في كلِّ سطر)</summary><textarea id="sBulk" placeholder="علي حسين&#10;محمد جاسم&#10;…"></textarea><div class="row" style="margin-top:8px"><button class="btn" id="sBulkAdd" style="flex:0 0 auto">إضافةُ الكلّ</button><button class="btn" id="sAlpha" style="flex:0 0 auto">ترتيبٌ أبجديٌّ دائم</button></div></details></div>';
      html += '<div class="slist" id="slist">';
      c.students.forEach(function (s, i) { html += '<div class="srow" data-id="' + s.id + '" draggable="' + (!ro) + '">' + (ro ? '' : '<span class="grip" title="اسحبْ للترتيب">⋮⋮</span>') + '<span class="n num">' + ar(i + 1) + '</span><input value="' + esc(s.name) + '" data-act="edit"' + (ro ? ' readonly' : '') + '><input class="no" value="' + esc(s.no || '') + '" data-act="no" placeholder="رقم" title="رقمُ الجلوس"' + (ro ? ' readonly' : '') + '>' + (ro ? '' : '<button class="icon-btn" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg></button>') + '</div>'; });
      if (!c.students.length) html += '<div class="empty"><b>لا متعلّمينَ بعد</b>اكتبِ الأسماءَ أعلاه</div>';
      html += '</div>';
      if (!ro) html += '<div class="manage"><details><summary>إعداداتُ الفصل</summary><div class="row" style="margin-top:12px"><div class="field"><label>اسمُ الفصل</label><input id="cRename" value="' + esc(c.name) + '"></div><div class="field"><label>الصفّ</label><select id="cGrade2">' + Object.keys(GRADES).map(function (k) { return '<option value="' + k + '"' + (k === c.grade ? ' selected' : '') + '>' + GRADES[k] + '</option>'; }).join('') + '</select></div><div class="field" style="flex:0 0 auto"><label>&nbsp;</label><button class="btn" id="cSave">حفظ</button></div></div><div class="row">' + (c.archived ? '<button class="btn s" id="cUnarch" style="flex:0 0 auto">إعادةُ الفصلِ من الأرشيف</button>' : '<button class="btn s" id="cArch" style="flex:0 0 auto">أرشفةُ الفصل</button>') + '<button class="btn d s" id="cDel" style="flex:0 0 auto">حذفُ الفصلِ نهائياً</button></div></details></div>';
      view.innerHTML = html;
      if (ro) return;
      var add = async function (names) {
        names = names.map(function (n) { return n.trim(); }).filter(Boolean); if (!names.length) return;
        names.forEach(function (n) { c.students.push({ id: uid('s'), name: n, no: '' }); });
        try { await saveClass(c, 'إضافةُ متعلّمين (' + names.length + ')'); toast('أُضيف ' + ar(names.length)); } catch (e) { fail(e); }
        render(); var i = $('sName'); if (i) i.focus();
      };
      if ($('sAdd')) {
        $('sAdd').onclick = function () { add([$('sName').value]); };
        $('sName').addEventListener('keydown', function (e) { if (e.key === 'Enter') add([$('sName').value]); });
        $('sBulkAdd').onclick = function () { add($('sBulk').value.split(/\n+/)); };
        $('sAlpha').onclick = async function () { c.students.sort(function (a, b) { return a.name.localeCompare(b.name, 'ar'); }); try { await saveClass(c, 'ترتيبٌ أبجدي'); } catch (e) { fail(e); } render(); };
      }
      var list = $('slist');
      list.addEventListener('click', async function (e) {
        var b = e.target.closest('button[data-act]'); if (!b) return;
        var id = b.closest('.srow').dataset.id, i = c.students.findIndex(function (s) { return s.id === id; }); if (i < 0) return;
        if (b.dataset.act === 'del') { if (!confirm('حذفُ «' + c.students[i].name + '» من الفصل؟ (سجلُّه اليوميُّ يبقى في التقارير)')) return; var nm = c.students[i].name; c.students.splice(i, 1); try { await saveClass(c, 'حذفُ متعلّم: ' + nm); } catch (err) { fail(err); } render(); }
      });
      list.addEventListener('change', async function (e) {
        var inp = e.target.closest('input[data-act]'); if (!inp) return;
        var id = inp.closest('.srow').dataset.id, s = c.students.filter(function (x) { return x.id === id; })[0]; if (!s) return;
        if (inp.dataset.act === 'edit' && inp.value.trim()) { var old = s.name; s.name = inp.value.trim(); try { await saveClass(c, 'تعديلُ اسم: ' + old + ' ← ' + s.name); toast('حُفظ'); } catch (err) { fail(err); } }
        if (inp.dataset.act === 'no') { s.no = inp.value.trim(); try { await saveClass(c); toast('حُفظ'); } catch (err) { fail(err); } }
      });
      var dragId = null;
      list.addEventListener('dragstart', function (e) { var r = e.target.closest('.srow'); if (!r) return; dragId = r.dataset.id; r.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; });
      list.addEventListener('dragover', function (e) { e.preventDefault(); var r = e.target.closest('.srow'); if (!r || r.dataset.id === dragId) return; var rect = r.getBoundingClientRect(); var after = e.clientY > rect.top + rect.height / 2; var dr = list.querySelector('.srow[data-id="' + dragId + '"]'); if (dr) r.parentNode.insertBefore(dr, after ? r.nextSibling : r); });
      list.addEventListener('drop', function (e) { e.preventDefault(); });
      list.addEventListener('dragend', async function () {
        var order = Array.prototype.map.call(list.querySelectorAll('.srow'), function (r) { return r.dataset.id; });
        var changed = order.some(function (id, i) { return c.students[i] && c.students[i].id !== id; });
        if (changed) { c.students.sort(function (a, b) { return order.indexOf(a.id) - order.indexOf(b.id); }); try { await saveClass(c, 'إعادةُ ترتيبِ المتعلّمين'); } catch (err) { fail(err); } }
        render();
      });
      $('cSave').onclick = async function () { var old = c.name; c.name = $('cRename').value.trim() || c.name; c.grade = $('cGrade2').value; try { await saveClass(c, old !== c.name ? 'تعديلُ اسمِ فصل: ' + old + ' ← ' + c.name : 'تعديلُ فصل'); toast('حُفظ'); render(); } catch (err) { fail(err); } };
      var ab = $('cArch'); if (ab) ab.onclick = async function () { if (!confirm('أرشفةُ «' + c.name + '»؟ يختفي من القوائمِ اليومية ويبقى تقريرُه في الأرشيف.')) return; c.archived = true; c.archivedAt = today(); try { await saveClass(c, 'أرشفةُ فصل'); splitClasses(); persistCore(); location.hash = '#/classes'; } catch (err) { fail(err); } };
      var un = $('cUnarch'); if (un) un.onclick = async function () { c.archived = false; try { await saveClass(c, 'إعادةُ فصلٍ من الأرشيف'); splitClasses(); persistCore(); location.hash = '#/classes'; } catch (err) { fail(err); } };
      $('cDel').onclick = async function () { if (!confirm('حذفُ الفصلِ «' + c.name + '» نهائياً بكلِّ متعلّميه وسجلِّه اليومي؟ لا يمكنُ التراجع.')) return; if (!confirm('تأكيدٌ أخير: حذفٌ نهائي؟')) return; try { var map = await loadDays(c._id); for (var k in map) if (map[k]) await write('del', 'sc_days', c._id + '_' + k, { cls: c._id, date: k }); await write('del', 'sc_classes', c._id, {}); S.allClasses = S.allClasses.filter(function (x) { return x._id !== c._id; }); splitClasses(); persistCore(); LS.del('sc_days_' + c._id); log('حذفُ فصلٍ نهائياً', c.name); location.hash = '#/classes'; } catch (err) { fail(err); } };
    }
    render();
  }

  /* ---------------- المتابعةُ اليومية ---------------- */
  async function dailyView(c) {
    c.students = c.students || [];
    var date = S.date;
    var doc = await loadDay(c._id, date);
    var ev = doc ? doc.ev : [], taken = !!(doc && doc.taken);
    var d = pd(date), isToday = date === today(), ro = RO() || c.archived;
    var absN = ev.filter(function (e) { return e.type === 'absent'; }).length;
    var alerts = {}; collectAlerts().forEach(function (a) { if (a.c._id === c._id) alerts[a.s.id] = 1; });
    var q = (S.stuQ || '').trim();
    var html = classCrumb(c) + '<div class="ttl"><div><h2>' + esc(c.name) + '</h2><p>' + ar(c.students.length) + ' متعلّماً · حاضرٌ ' + ar(c.students.length - absN) + (absN ? ' · غائبٌ ' + ar(absN) : '') + (taken ? ' <span class="taken">✓ تمّ التحضير</span>' : '') + '</p></div>'
      + '<div class="acts"><a class="btn" href="#/class/' + c._id + '/students">المتعلّمون</a><a class="btn g" href="#/class/' + c._id + '/report">تقريرُ الفصل</a></div></div>';
    html += '<div class="datebar"><button class="icon-btn" id="dPrev" title="اليومُ التالي"><svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6"/></svg></button>'
      + '<label class="d" style="cursor:pointer;position:relative">' + DAYS[d.getDay()] + ' ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()] + '<small>' + esc(hijri(d)) + '</small><input type="date" id="dPick" value="' + date + '"></label>'
      + '<button class="icon-btn" id="dNext" title="اليومُ السابق"><svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg></button>' + (isToday ? '' : '<button class="btn s" id="dToday">اليوم</button>') + '</div>';
    if (d.getDay() === 5 || d.getDay() === 6) html += '<div class="ok" style="text-align:center">هذا اليومُ عطلةٌ — يمكنُك التسجيلُ مع ذلك</div>';
    if (c.archived) html += '<div class="err" style="text-align:center">فصلٌ مؤرشف — للعرضِ فقط</div>';
    html += '<div class="searchbar"><input id="stuQ" placeholder="ابحثْ باسمٍ أو حرف…" value="' + esc(q) + '"><div class="seg" id="sortSeg"><button data-s="manual" aria-pressed="' + (S.sort === 'manual') + '">ترتيبي</button><button data-s="alpha" aria-pressed="' + (S.sort === 'alpha') + '">أبجدي</button><button data-s="no" aria-pressed="' + (S.sort === 'no') + '">رقمُ الجلوس</button></div>'
      + (ro ? '' : '<div class="seg" id="modeSeg"><button data-m="sheet" aria-pressed="' + (!S.quick) + '">تسجيلٌ مفصّل</button><button data-m="quick" aria-pressed="' + (!!S.quick) + '">تحديدُ الغائبين</button></div>') + '</div>';
    if (S.quick && !ro) html += '<div class="quickhint"><span>وضعٌ سريع: انقرِ الاسمَ لتبديلِ الغياب — ثمّ اضغطْ «تمّ التحضير»</span><button class="btn s p" id="takenBtn">✓ تمّ التحضير' + (absN ? '' : ' — الكلُّ حاضر') + '</button></div>';
    if (!c.students.length) html += '<div class="empty"><b>لا متعلّمينَ في هذا الفصل</b><a class="btn p" href="#/class/' + c._id + '/students" style="margin-top:10px">أضفِ الأسماء</a></div>';
    html += '<div class="students" id="stuGrid">' + gridHTML(c, ev, alerts) + '</div><div class="legend">' + TYPES.map(function (t) { return '<span><i style="background:' + t.color + '"></i>' + t.label + '</span>'; }).join('') + '</div>';
    view.innerHTML = html;
    $('dPrev').onclick = function () { S.date = addDays(date, 1); route(); };
    $('dNext').onclick = function () { S.date = addDays(date, -1); route(); };
    $('dPick').onchange = function () { if ($('dPick').value) { S.date = $('dPick').value; route(); } };
    if ($('dToday')) $('dToday').onclick = function () { S.date = today(); route(); };
    $('stuQ').oninput = function () { S.stuQ = this.value; var dd = S.days[c._id] && S.days[c._id].map[date]; $('stuGrid').innerHTML = gridHTML(c, dd ? dd.ev : [], alerts); };
    $('sortSeg').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; S.sort = b.dataset.s; LS.set('sc_sort', S.sort); route(); };
    if ($('modeSeg')) $('modeSeg').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; S.quick = b.dataset.m === 'quick'; route(); };
    if ($('takenBtn')) $('takenBtn').onclick = async function () { var dd = (await loadDay(c._id, date)) || { ev: [] }; dd.ev = dd.ev || []; dd.taken = true; try { await saveDay(c._id, date, dd); toast('سُجّل التحضير'); log('تحضيرُ فصل', c.name + ' ' + date); route(); } catch (e) { fail(e); } };
    $('stuGrid').addEventListener('click', async function (e) {
      var b = e.target.closest('.stu'); if (!b) return; var s = c.students.filter(function (x) { return x.id === b.dataset.sid; })[0]; if (!s) return;
      if (S.quick && !ro) {
        var dd = (await loadDay(c._id, date)) || { ev: [] }; dd.ev = dd.ev || [];
        var has = dd.ev.some(function (x) { return x.sid === s.id && x.type === 'absent'; });
        dd.ev = dd.ev.filter(function (x) { return !(x.sid === s.id && x.type === 'absent'); }); if (!has) dd.ev.push({ id: uid('e'), sid: s.id, type: 'absent', ts: Date.now() });
        try { await saveDay(c._id, date, dd); } catch (err) { fail(err); }
        b.outerHTML = stuChip(c, s, dd.ev, alerts[s.id]); updatePresence(c, date);
      } else openStudentSheet(c, s, date, alerts);
    });
  }
  function gridHTML(c, ev, alerts) { var q = (S.stuQ || '').trim(); return sortedStudents(c).filter(function (s) { return !q || s.name.indexOf(q) >= 0; }).map(function (s) { return stuChip(c, s, ev, alerts[s.id]); }).join(''); }
  function stuChip(c, s, ev, alert) {
    var es = ev.filter(function (e) { return e.sid === s.id; }), abs = es.some(function (e) { return e.type === 'absent'; });
    var pips = TYPES.filter(function (t) { return t.key !== 'absent'; }).map(function (t) { var n = es.filter(function (e) { return e.type === t.key; }).length; return n ? '<span class="pip ' + t.key + '" title="' + t.label + '">' + ar(n) + '</span>' : ''; }).join('');
    return '<button class="stu' + (abs ? ' absent' : '') + (S.quick ? ' quick' : '') + '" data-sid="' + s.id + '">' + (s.no ? '<span class="no">' + esc(s.no) + '</span>' : '') + (alert ? '<span class="alert" title="تجاوز حدَّ التنبيه">!</span>' : '') + '<span class="av">' + esc(initials(s.name)) + '</span><span class="nm">' + esc(s.name) + '</span><span class="bd">' + pips + '</span></button>';
  }
  function updatePresence(c, date) {
    var doc = S.days[c._id] && S.days[c._id].map[date]; var all = (doc ? doc.ev : []).filter(function (e) { return e.type === 'absent'; }).length;
    var p = document.querySelector('.ttl p'); if (p) p.innerHTML = ar(c.students.length) + ' متعلّماً · حاضرٌ ' + ar(c.students.length - all) + (all ? ' · غائبٌ ' + ar(all) : '') + (doc && doc.taken ? ' <span class="taken">✓ تمّ التحضير</span>' : '');
  }

  /* الورقةُ المنبثقة */
  function openSheet(html) { var sh = $('sheet'), bg = $('sheetBg'); sh.innerHTML = '<div class="hnd"></div>' + html; sh.hidden = false; bg.hidden = false; requestAnimationFrame(function () { sh.classList.add('on'); bg.classList.add('on'); }); }
  function closeSheet() { $('sheet').classList.remove('on'); $('sheetBg').classList.remove('on'); setTimeout(function () { $('sheet').hidden = true; $('sheetBg').hidden = true; }, 260); }
  $('sheetBg').onclick = closeSheet;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  async function openStudentSheet(c, s, date, alerts) {
    var ro = RO() || c.archived, pendingCat = null; alerts = alerts || {};
    async function mutate(fn, what) {
      var doc = (await loadDay(c._id, date)) || { ev: [] }; doc.ev = doc.ev || [];
      fn(doc);
      try { await saveDay(c._id, date, doc); if (what) log(what, s.name + ' — ' + c.name + ' ' + date); } catch (e) { fail(e); }
      pendingCat = null; render(); refreshChip();
    }
    function refreshChip() {
      var b = document.querySelector('.stu[data-sid="' + s.id + '"]'); if (!b) return;
      var doc = S.days[c._id] && S.days[c._id].map[date];
      b.outerHTML = stuChip(c, s, doc ? doc.ev : [], alerts[s.id]); updatePresence(c, date);
    }
    function render() {
      var doc = S.days[c._id] && S.days[c._id].map[date]; var es = (doc ? doc.ev : []).filter(function (e) { return e.sid === s.id; });
      var html = '<div class="who"><span class="av">' + esc(initials(s.name)) + '</span><div><h3>' + esc(s.name) + '</h3><small>' + esc(c.name) + ' — ' + fmtDate(date, true) + '</small></div><a class="btn s" style="margin-inline-start:auto" href="#/student/' + c._id + '/' + s.id + '">لوحةُ القياس</a></div>';
      if (!ro) {
        html += '<div class="acts4">';
        TYPES.filter(function (t) { return t.key !== 'note'; }).forEach(function (t) {
          var n = es.filter(function (e) { return e.type === t.key; }).length;
          html += '<button class="act ' + t.key + (n ? ' on' : '') + '" data-t="' + t.key + '"><span class="ic">' + t.ico + '</span>' + t.label + (n && !t.single ? '<span class="cnt">' + ar(n) + '</span>' : '') + '</button>';
        });
        html += '</div>';
        if (pendingCat) { var cats = (S.settings.cats || {})[pendingCat] || []; html += '<div class="cats"><span class="lbl">' + TYPE[pendingCat].label + ' — ما نوعُها؟</span>' + cats.map(function (k) { return '<button data-cat="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '<button data-cat="">بلا تصنيف</button></div>'; }
      }
      if (es.length) {
        html += '<div class="evlist">' + es.slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); }).map(function (e) {
          var t = TYPE[e.type] || TYPE.note, tm = e.ts ? new Date(e.ts) : null;
          return '<div class="ev"><span class="pip ' + e.type + '">' + (t.short || t.label).slice(0, 1) + '</span><span class="t">' + esc(t.label) + (e.cat ? ' — ' + esc(e.cat) : '') + (e.note ? ': ' + esc(e.note) : '') + (tm ? ' <small>' + ar(('0' + tm.getHours()).slice(-2) + ':' + ('0' + tm.getMinutes()).slice(-2)) + '</small>' : '') + '</span>' + (ro ? '' : '<button class="x" data-id="' + e.id + '" title="حذف">×</button>') + '</div>';
        }).join('') + '</div>';
      } else if (ro) html += '<div class="empty" style="padding:16px">لا تسجيلاتَ لهذا اليوم</div>';
      if (!ro) html += '<div class="notebox"><textarea id="noteIn" placeholder="ملاحظةٌ على المتعلّم اليوم…"></textarea><button class="btn p" id="noteAdd">إضافة</button></div>';
      html += '<div class="foot"><small style="color:var(--muted)">' + (ro ? 'قراءةٌ فقط' : 'النقرُ على الزرِّ يسجّلُ فوراً · × يحذف') + '</small><button class="btn s" id="shClose">إغلاق</button></div>';
      openSheet(html);
      var sh = $('sheet');
      sh.querySelectorAll('.act').forEach(function (b) {
        b.onclick = function () {
          var t = b.dataset.t;
          if (t === 'absent') return mutate(function (doc) { var has = doc.ev.some(function (e) { return e.sid === s.id && e.type === 'absent'; }); doc.ev = doc.ev.filter(function (e) { return !(e.sid === s.id && e.type === 'absent'); }); if (!has) doc.ev.push({ id: uid('e'), sid: s.id, type: 'absent', ts: Date.now() }); });
          if (TYPE[t].cats && ((S.settings.cats || {})[t] || []).length) { pendingCat = pendingCat === t ? null : t; render(); return; }
          mutate(function (doc) { doc.ev.push({ id: uid('e'), sid: s.id, type: t, ts: Date.now() }); });
        };
      });
      sh.querySelectorAll('.cats button').forEach(function (b) { b.onclick = function () { var t = pendingCat, cat = b.dataset.cat; mutate(function (doc) { var e = { id: uid('e'), sid: s.id, type: t, ts: Date.now() }; if (cat) e.cat = cat; doc.ev.push(e); }); }; });
      sh.querySelectorAll('.ev .x').forEach(function (x) { x.onclick = function () { mutate(function (doc) { doc.ev = doc.ev.filter(function (e) { return e.id !== x.dataset.id; }); }, 'حذفُ تسجيل'); }; });
      if ($('noteAdd')) { $('noteAdd').onclick = function () { var v = $('noteIn').value.trim(); if (!v) return; mutate(function (doc) { doc.ev.push({ id: uid('e'), sid: s.id, type: 'note', note: v, ts: Date.now() }); }); }; $('noteIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('noteAdd').click(); } }); }
      $('shClose').onclick = closeSheet;
    }
    render();
  }

  /* ---------------- حساباتٌ مشتركة ---------------- */
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
    Object.keys(map).forEach(function (date) { var doc = map[date]; if (!doc || date < from || date > to) return; (doc.ev || []).forEach(function (e) { if (!sid || e.sid === sid) out.push(Object.assign({ date: date }, e)); }); });
    return out;
  }
  function score(evs) { var w = S.settings.weights || DEFAULT_W; return Math.round(evs.reduce(function (s, e) { return s + num(w[e.type], 0); }, 0) * 10) / 10; }
  function scoreHTML(v) { return '<span class="score ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : '') + '">' + (v > 0 ? '+' : '') + ar(v) + '</span>'; }
  function weekBuckets(evs, from, to) {
    var start = pd(from); start.setDate(start.getDate() - start.getDay());
    var b = [], cur = iso(start), end = to > today() ? today() : to, i = 0;
    while (cur <= end) {
      var wEnd = addDays(cur, 6), vals = {};
      evs.forEach(function (e) { if (e.date >= cur && e.date <= wEnd) vals[e.type] = (vals[e.type] || 0) + 1; });
      var d = pd(cur); b.push({ label: 'أسبوع ' + ar(i + 1), sub: ar(d.getDate()) + '/' + ar(d.getMonth() + 1), vals: vals });
      cur = addDays(cur, 7); i++;
    }
    return b;
  }
  function catBars(evs, type) {
    var m = {}; evs.filter(function (e) { return e.type === type; }).forEach(function (e) { var k = e.cat || 'بلا تصنيف'; m[k] = (m[k] || 0) + 1; });
    var keys = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }); if (!keys.length) return '';
    var max = m[keys[0]], t = TYPE[type];
    return '<div class="catbars">' + keys.map(function (k) { return '<div class="hbar"><span class="nm">' + esc(k) + '</span><span class="tr"><i style="width:' + (100 * m[k] / max) + '%;background:' + t.color + '"></i></span><span class="v">' + ar(m[k]) + '</span></div>'; }).join('') + '</div>';
  }
  function reportHead(title, sub) {
    return '<div class="report-head"><div style="display:flex;gap:12px;align-items:center"><img src="/img/logo-dark.svg" alt=""><div class="rt"><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p></div></div><div class="rd">أ. حيدر المعاتيق<br>' + fmtDate(today(), true) + '</div></div>';
  }
  var LEGEND = '<div class="legend">' + TYPES.map(function (t) { return '<span><i style="background:' + t.color + '"></i>' + t.label + '</span>'; }).join('') + '</div>';
  var SERIES = TYPES.map(function (t) { return { key: t.key, label: t.label, color: t.hex }; });

  /* ---------------- لوحةُ المتعلّم ---------------- */
  async function studentDash(p) {
    var c = cls(p[0]); if (!c) { location.hash = '#/classes'; return; }
    var s = (c.students || []).filter(function (x) { return x.id === p[1]; })[0] || { id: p[1], name: 'متعلّمٌ محذوف' };
    var map = await loadDays(c._id);
    function render() {
      var R = periodRange(), evs = eventsIn(map, R.from, R.to, s.id), counts = {};
      TYPES.forEach(function (t) { counts[t.key] = evs.filter(function (e) { return e.type === t.key; }).length; });
      var school = schoolDaysFor(c._id, R.from, R.to);
      var attend = school ? Math.max(0, 100 - Math.round(100 * counts.absent / Math.max(1, school.size))) : null;
      var sc = score(evs);
      var html = classCrumb(c, esc(s.name)) + reportHead('تقريرُ متابعة: ' + s.name, c.name + ' — ' + R.label);
      html += '<div class="ttl"><div><h2>' + esc(s.name) + '</h2><p>' + esc(c.name) + ' · ' + esc(R.label) + '</p></div><div class="acts"><a class="btn" href="#/class/' + c._id + '">المتابعةُ اليومية</a><button class="btn" id="parentBtn">رسالةٌ لوليِّ الأمر</button><button class="btn p" id="printBtn"><svg viewBox="0 0 24 24"><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 9V4h10v5M7 14h10v6H7z"/></svg>تصديرُ PDF</button></div></div>';
      html += filtersHTML();
      html += '<div class="tiles">';
      html += '<div class="tile hero"><div class="l">نسبةُ الحضور</div><div class="v">' + (attend === null ? '—' : ar(attend) + '<small>٪</small>') + '</div><div class="s">' + (school ? 'من ' + ar(school.size) + ' حصّةً بحسبِ الجدول' : 'رتّبِ الجدولَ الأسبوعيَّ لحسابِها') + '</div></div>';
      html += '<div class="tile" style="--tc:var(--green)"><div class="l"><i></i>درجةُ السلوك</div><div class="v sc">' + scoreHTML(sc) + '</div><div class="s">بأوزانِ الإعدادات</div></div>';
      TYPES.filter(function (t) { return t.key !== 'note'; }).forEach(function (t) { html += '<div class="tile" style="--tc:' + t.color + '"><div class="l"><i></i>' + t.label + '</div><div class="v">' + ar(counts[t.key]) + '</div><div class="s">' + (t.key === 'absent' ? 'يومَ غياب' : 'مرّة') + '</div></div>'; });
      html += '</div>';
      html += '<div class="panel nobrief"><h3>الإيقاعُ الأسبوعي</h3><div class="hint">عددُ التسجيلاتِ في كلِّ أسبوعٍ من المدّة، مكدَّسةً بنوعِها (الأقدمُ يميناً)</div><div class="chart" id="wk"></div>' + LEGEND + '</div>';
      var cb = catBars(evs, 'star'), bb = catBars(evs, 'bad');
      if (cb || bb) html += '<div class="today" style="margin-bottom:0"><div class="panel"><h3>أنواعُ المشاركة</h3>' + (cb || '<div class="hint">لا مشاركاتَ مصنّفة</div>') + '</div><div class="panel"><h3>أنواعُ السلوك</h3>' + (bb || '<div class="hint">لا تسجيلاتَ سلوك</div>') + '</div></div>';
      html += '<div class="panel nobrief"><h3>خريطةُ الأيّام</h3><div class="hint">الأحمرُ غياب، والنقاطُ تسجيلاتُ اليوم، والمظلَّلُ أيّامُ حصصِ الفصل</div><div class="cal" id="cal"></div></div>';
      var lg = evs.slice().sort(function (a, b) { return a.date === b.date ? (b.ts || 0) - (a.ts || 0) : (a.date < b.date ? 1 : -1); });
      html += '<div class="panel"><h3>السجلُّ التفصيلي</h3><div class="hint">' + ar(lg.length) + ' تسجيلاً</div>' + (lg.length ? '<table class="log"><thead><tr><th>التاريخ</th><th>النوع</th><th>التصنيف / الملاحظة</th></tr></thead><tbody>' + lg.map(function (e) { var t = TYPE[e.type] || TYPE.note; return '<tr><td class="num">' + fmtDate(e.date, true) + '</td><td><span class="ty"><i style="background:' + t.color + '"></i>' + t.label + '</span></td><td>' + esc([e.cat, e.note].filter(Boolean).join(' — ')) + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty" style="padding:20px">لا تسجيلاتَ في هذه المدّة</div>') + '</div>';
      view.innerHTML = html;
      bindFilters(render);
      $('printBtn').onclick = function () { document.body.classList.remove('brief'); window.print(); };
      $('parentBtn').onclick = function () { parentMessage(c, s, R, counts, attend, sc, lg); };
      Charts.stackedBars($('wk'), weekBuckets(evs, R.from, R.to), SERIES, { aria: 'تسجيلاتُ ' + s.name + ' أسبوعياً' });
      var dm = {}; evs.forEach(function (e) { dm[e.date] = dm[e.date] || {}; dm[e.date][e.type] = (dm[e.date][e.type] || 0) + 1; });
      var colors = {}; TYPES.forEach(function (t) { colors[t.key] = t.hex; });
      var calFrom = R.from < '2020-01-01' ? (Object.keys(dm).sort()[0] || today()) : R.from;
      Charts.calendar($('cal'), calFrom, R.to, dm, colors, school);
    }
    render();
  }
  function parentMessage(c, s, R, counts, attend, sc, lg) {
    var notes = lg.filter(function (e) { return e.note || e.cat; }).slice(0, 5).map(function (e) { return '• ' + fmtDate(e.date) + ': ' + TYPE[e.type].label + (e.cat ? ' (' + e.cat + ')' : '') + (e.note ? ' — ' + e.note : ''); });
    var txt = 'السلامُ عليكم ورحمةُ الله\nوليَّ أمرِ المتعلّم ' + s.name + ' — ' + c.name + '\n\nهذا ملخّصُ متابعتِه في ' + R.label + ':\n'
      + (attend !== null ? '• نسبةُ الحضور: ' + ar(attend) + '٪\n' : '') + '• أيّامُ الغياب: ' + ar(counts.absent) + '\n• المشاركاتُ المتميّزة: ' + ar(counts.star) + '\n• تسجيلاتُ السلوك: ' + ar(counts.bad) + '\n• درجةُ السلوك: ' + (sc > 0 ? '+' : '') + ar(sc) + '\n'
      + (notes.length ? '\nأبرزُ الملاحظات:\n' + notes.join('\n') + '\n' : '') + '\nنشكرُ تعاونَكم ومتابعتَكم.\nأ. حيدر المعاتيق — معلّمُ اللغةِ العربية';
    openSheet('<div class="who"><div><h3>رسالةٌ لوليِّ الأمر</h3><small>' + esc(s.name) + ' — عدّلِ النصَّ ثمّ انسخْه أو أرسلْه</small></div></div><textarea class="msgbox" id="pmsg">' + esc(txt) + '</textarea>'
      + '<div class="foot" style="flex-wrap:wrap"><button class="btn s" id="shClose">إغلاق</button><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="pmBrief">PDF صفحةٍ واحدة</button><button class="btn" id="pmCopy">نسخُ النصّ</button><a class="btn p" id="pmWa" target="_blank" rel="noopener">إرسالٌ بواتساب</a></div></div>');
    var wa = $('pmWa'); var upd = function () { wa.href = 'https://wa.me/?text=' + encodeURIComponent($('pmsg').value); }; upd(); $('pmsg').oninput = upd;
    $('shClose').onclick = closeSheet;
    $('pmCopy').onclick = function () { var v = $('pmsg').value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('نُسخ'); }, function () { $('pmsg').select(); document.execCommand('copy'); toast('نُسخ'); }); };
    $('pmBrief').onclick = function () { closeSheet(); document.body.classList.add('brief'); setTimeout(function () { window.print(); document.body.classList.remove('brief'); }, 300); };
  }

  /* ---------------- تقريرُ الفصل ---------------- */
  async function classReport(c) {
    var map = await loadDays(c._id), students = c.students || [];
    function render() {
      var R = periodRange(), evs = eventsIn(map, R.from, R.to), school = schoolDaysFor(c._id, R.from, R.to);
      var rows = students.map(function (s) { var r = { s: s, evs: evs.filter(function (e) { return e.sid === s.id; }) }; TYPES.forEach(function (t) { r[t.key] = r.evs.filter(function (e) { return e.type === t.key; }).length; }); r.score = score(r.evs); return r; });
      var known = {}; students.forEach(function (s) { known[s.id] = 1; });
      var ghosts = {}; evs.forEach(function (e) { if (!known[e.sid]) ghosts[e.sid] = 1; });
      Object.keys(ghosts).forEach(function (sid) { var r = { s: { id: sid, name: 'متعلّمٌ محذوف' }, ghost: true, evs: evs.filter(function (e) { return e.sid === sid; }) }; TYPES.forEach(function (t) { r[t.key] = r.evs.filter(function (e) { return e.type === t.key; }).length; }); r.score = score(r.evs); rows.push(r); });
      var sortKey = S.rankSort || 'score';
      rows.sort(function (a, b) { return sortKey === 'name' ? a.s.name.localeCompare(b.s.name, 'ar') : (b[sortKey] - a[sortKey]) || a.s.name.localeCompare(b.s.name, 'ar'); });
      var tot = {}; TYPES.forEach(function (t) { tot[t.key] = evs.filter(function (e) { return e.type === t.key; }).length; });
      var recDays = Object.keys(map).filter(function (d) { return map[d] && d >= R.from && d <= R.to; }).length;
      var alerts = collectAlerts().filter(function (a) { return a.c._id === c._id; });
      var real = rows.filter(function (r) { return !r.ghost; });
      var html = classCrumb(c, 'تقريرُ الفصل') + reportHead('تقريرُ الفصل: ' + c.name, R.label);
      html += '<div class="ttl"><div><h2>تقريرُ ' + esc(c.name) + '</h2><p>' + ar(students.length) + ' متعلّماً · ' + esc(R.label) + '</p></div><div class="acts">' + (c.archived ? '' : '<a class="btn" href="#/class/' + c._id + '">المتابعةُ اليومية</a>') + '<button class="btn" id="csvBtn">Excel (CSV)</button><button class="btn p" id="printBtn">تصديرُ PDF</button></div></div>';
      html += filtersHTML();
      html += '<div class="tiles"><div class="tile hero"><div class="l">أيّامٌ مسجَّلة</div><div class="v">' + ar(recDays) + '</div><div class="s">' + (school ? 'من ' + ar(school.size) + ' حصّةً بالجدول' : 'يومٌ فيه تسجيلٌ واحدٌ على الأقلّ') + '</div></div>';
      html += '<div class="tile" style="--tc:var(--green)"><div class="l"><i></i>متوسّطُ الدرجة</div><div class="v sc">' + scoreHTML(real.length ? Math.round(real.reduce(function (a, r) { return a + r.score; }, 0) / real.length * 10) / 10 : 0) + '</div><div class="s">لكلِّ متعلّم</div></div>';
      TYPES.filter(function (t) { return t.key !== 'note'; }).forEach(function (t) { html += '<div class="tile" style="--tc:' + t.color + '"><div class="l"><i></i>' + t.label + '</div><div class="v">' + ar(tot[t.key]) + '</div><div class="s">في الفصلِ كلِّه</div></div>'; });
      html += '</div>';
      if (alerts.length) html += '<div class="panel"><h3>تنبيهات</h3><div class="hint">تجاوزوا حدَّ الغياب (' + ar(S.settings.absAlert) + ') أو السلوك (' + ar(S.settings.badAlert) + ') في الفصلِ الدراسيِّ الحالي</div><div class="alerts">' + alerts.map(alertHTML).join('') + '</div></div>';
      html += '<div class="panel"><h3>إيقاعُ الفصلِ الأسبوعي</h3><div class="hint">مجموعُ التسجيلاتِ لكلِّ المتعلّمين في كلِّ أسبوع</div><div class="chart" id="wk"></div>' + LEGEND + '</div>';
      var maxStar = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r.star; }))), maxAbs = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r.absent; })));
      var topStar = rows.filter(function (r) { return r.star; }).sort(function (a, b) { return b.star - a.star; }).slice(0, 8), topAbs = rows.filter(function (r) { return r.absent; }).sort(function (a, b) { return b.absent - a.absent; }).slice(0, 8);
      html += '<div class="today" style="margin-bottom:0"><div class="panel"><h3>الأكثرُ مشاركةً</h3><div class="hint">مشاركاتٌ متميّزةٌ في المدّة</div>' + (topStar.length ? '<div class="hbars">' + topStar.map(function (r) { return '<div class="hbar"><span class="nm">' + esc(r.s.name) + '</span><span class="tr"><i style="width:' + (100 * r.star / maxStar) + '%"></i></span><span class="v">' + ar(r.star) + '</span></div>'; }).join('') + '</div>' : '<div class="empty" style="padding:16px">لا مشاركاتَ مسجَّلة</div>') + '</div>'
        + '<div class="panel"><h3>الأكثرُ غياباً</h3><div class="hint">أيّامُ الغياب في المدّة</div>' + (topAbs.length ? '<div class="hbars">' + topAbs.map(function (r) { return '<div class="hbar"><span class="nm">' + esc(r.s.name) + '</span><span class="tr"><i style="width:' + (100 * r.absent / maxAbs) + '%;background:var(--c-absent)"></i></span><span class="v">' + ar(r.absent) + '</span></div>'; }).join('') + '</div>' : '<div class="empty" style="padding:16px">لا غيابَ مسجَّلاً</div>') + '</div></div>';
      var cb = catBars(evs, 'star'), bb = catBars(evs, 'bad');
      if (cb || bb) html += '<div class="today" style="margin-bottom:0"><div class="panel"><h3>أنواعُ المشاركة في الفصل</h3>' + (cb || '<div class="hint">—</div>') + '</div><div class="panel"><h3>أنواعُ السلوك في الفصل</h3>' + (bb || '<div class="hint">—</div>') + '</div></div>';
      html += '<div class="panel"><h3>جدولُ المتعلّمين</h3><div class="hint">انقرِ العنوانَ للترتيب، والاسمَ لفتحِ لوحةِ المتعلّم</div><table class="rank"><thead><tr><th data-k="name" style="cursor:pointer">الاسم</th><th data-k="score" style="cursor:pointer;color:' + (sortKey === 'score' ? 'var(--green)' : '') + '">الدرجة</th>' + TYPES.map(function (t) { return '<th data-k="' + t.key + '" style="cursor:pointer;color:' + (sortKey === t.key ? 'var(--green)' : '') + '">' + (t.short || t.label) + '</th>'; }).join('') + (school ? '<th>الحضور</th>' : '') + '</tr></thead><tbody>'
        + rows.map(function (r) { return '<tr><td><a href="#/student/' + c._id + '/' + r.s.id + '">' + esc(r.s.name) + '</a>' + (r.ghost ? ' <small style="color:var(--muted)">(محذوف)</small>' : '') + '</td><td class="num">' + scoreHTML(r.score) + '</td>' + TYPES.map(function (t) { return '<td class="num">' + (r[t.key] ? ar(r[t.key]) : '<span style="opacity:.3">—</span>') + '</td>'; }).join('') + (school ? '<td class="num">' + ar(Math.max(0, 100 - Math.round(100 * r.absent / Math.max(1, school.size)))) + '٪</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>';
      view.innerHTML = html;
      bindFilters(render);
      $('printBtn').onclick = function () { window.print(); };
      $('csvBtn').onclick = function () { downloadCSV(c.name + ' — ' + R.label + '.csv', [['الاسم', 'رقم الجلوس', 'الدرجة'].concat(TYPES.map(function (t) { return t.label; })).concat(school ? ['نسبة الحضور'] : [])].concat(rows.map(function (r) { return [r.s.name, r.s.no || '', r.score].concat(TYPES.map(function (t) { return r[t.key]; })).concat(school ? [Math.max(0, 100 - Math.round(100 * r.absent / Math.max(1, school.size)))] : []); }))); };
      view.querySelectorAll('.rank th[data-k]').forEach(function (th) { th.onclick = function () { S.rankSort = th.dataset.k; render(); }; });
      Charts.stackedBars($('wk'), weekBuckets(evs, R.from, R.to), SERIES, { aria: 'تسجيلاتُ الفصل أسبوعياً' });
    }
    render();
  }
  function downloadCSV(name, rows) {
    var csv = '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
    downloadBlob(name, csv, 'text/csv;charset=utf-8');
  }
  function downloadBlob(name, content, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }

  /* ---------------- مقارنةُ الفصول ---------------- */
  async function overview() {
    var maps = {}; for (var i = 0; i < S.classes.length; i++) maps[S.classes[i]._id] = await loadDays(S.classes[i]._id);
    function render() {
      var R = periodRange();
      var rows = S.classes.map(function (c) {
        var evs = eventsIn(maps[c._id], R.from, R.to), n = Math.max(1, (c.students || []).length), school = schoolDaysFor(c._id, R.from, R.to), r = { c: c, n: (c.students || []).length };
        TYPES.forEach(function (t) { r[t.key] = evs.filter(function (e) { return e.type === t.key; }).length; });
        r.attend = school ? Math.max(0, 100 - Math.round(100 * r.absent / Math.max(1, school.size * n))) : null;
        r.avg = Math.round(score(evs) / n * 10) / 10; r.starPer = Math.round(r.star / n * 10) / 10; r.badPer = Math.round(r.bad / n * 10) / 10;
        return r;
      });
      var html = '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span>مقارنةُ الفصول</div>' + reportHead('مقارنةُ الفصول', R.label) + '<div class="ttl"><div><h2>مقارنةُ الفصول</h2><p>' + esc(R.label) + ' — أيُّ فصلٍ يحتاجُ جهداً أكبر</p></div><div class="acts"><button class="btn p" id="printBtn">تصديرُ PDF</button></div></div>' + filtersHTML();
      if (!rows.length) { html += '<div class="empty"><b>لا فصولَ بعد</b></div>'; view.innerHTML = html; bindFilters(render); $('printBtn').onclick = function () { window.print(); }; return; }
      var maxStar = Math.max(0.1, Math.max.apply(null, rows.map(function (r) { return r.starPer; }))), maxBad = Math.max(0.1, Math.max.apply(null, rows.map(function (r) { return r.badPer; })));
      html += '<div class="today" style="margin-bottom:0"><div class="panel"><h3>المشاركةُ لكلِّ متعلّم</h3><div class="hint">مشاركاتٌ متميّزة ÷ عددِ المتعلّمين</div><div class="hbars">' + rows.slice().sort(function (a, b) { return b.starPer - a.starPer; }).map(function (r) { return '<div class="hbar"><span class="nm">' + esc(r.c.name) + '</span><span class="tr"><i style="width:' + (100 * r.starPer / maxStar) + '%"></i></span><span class="v">' + ar(r.starPer) + '</span></div>'; }).join('') + '</div></div>'
        + '<div class="panel"><h3>السلوكُ لكلِّ متعلّم</h3><div class="hint">تسجيلاتُ السلوك ÷ عددِ المتعلّمين</div><div class="hbars">' + rows.slice().sort(function (a, b) { return b.badPer - a.badPer; }).map(function (r) { return '<div class="hbar"><span class="nm">' + esc(r.c.name) + '</span><span class="tr"><i style="width:' + (100 * r.badPer / maxBad) + '%;background:var(--c-bad)"></i></span><span class="v">' + ar(r.badPer) + '</span></div>'; }).join('') + '</div></div></div>';
      html += '<div class="panel"><h3>الجدولُ الشامل</h3><table class="rank ovtable"><thead><tr><th>الفصل</th><th>المتعلّمون</th><th>متوسّطُ الدرجة</th><th>الحضور</th>' + TYPES.map(function (t) { return '<th>' + (t.short || t.label) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + rows.map(function (r) { return '<tr><td><a href="#/class/' + r.c._id + '/report">' + esc(r.c.name) + '</a></td><td class="num">' + ar(r.n) + '</td><td class="num">' + scoreHTML(r.avg) + '</td><td class="num">' + (r.attend === null ? '—' : ar(r.attend) + '٪') + '</td>' + TYPES.map(function (t) { return '<td class="num">' + ar(r[t.key]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      view.innerHTML = html; bindFilters(render); $('printBtn').onclick = function () { window.print(); };
    }
    render();
  }

  /* ---------------- الجدولُ الأسبوعي ---------------- */
  async function scheduleView() {
    if (RO()) { view.innerHTML = '<div class="err">حسابُك للقراءةِ فقط — الجدولُ يُعدَّلُ من حسابِ المعلّم</div>'; return; }
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
    $('schSave').onclick = async function () { collect(); try { await saveSettings(); log('حفظُ الجدول'); toast('حُفظ الجدول'); } catch (e) { fail(e); } };
  }

  /* ---------------- الإعدادات ---------------- */
  async function settingsView() {
    var st = S.settings, ro = RO();
    function chips(type) { return '<div class="chipedit" data-type="' + type + '">' + (st.cats[type] || []).map(function (k) { return '<span>' + esc(k) + (ro ? '' : '<b data-rm="' + esc(k) + '">×</b>') + '</span>'; }).join('') + (ro ? '' : '<input placeholder="تصنيفٌ جديد ثمّ Enter" data-add="' + type + '">') + '</div>'; }
    function render() {
      var html = '<div class="ttl"><div><h2>الإعدادات</h2><p>الفصولُ الدراسية والتصنيفاتُ والأوزانُ والحساب</p></div><div class="acts"><a class="btn" href="#/log">سجلُّ التعديلات</a></div></div>';
      html += '<div class="panel"><h3>الفصولُ الدراسية</h3><div class="hint">تُستعملُ مدّةُ الفصلِ الحاليِّ في لوحاتِ القياس ونسبِ الحضور</div><div class="terms" id="terms">';
      (st.terms || []).forEach(function (t, i) { html += '<div class="term" data-i="' + i + '"><input data-k="name" value="' + esc(t.name) + '" placeholder="اسمُ الفصل"' + (ro ? ' readonly' : '') + '><input type="date" data-k="start" value="' + t.start + '"' + (ro ? ' readonly' : '') + '><input type="date" data-k="end" value="' + t.end + '"' + (ro ? ' readonly' : '') + '>' + (ro ? '' : '<button class="icon-btn" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>') + '</div>'; });
      html += '</div>' + (ro ? '' : '<div class="row" style="margin-top:12px"><button class="btn" id="tAdd" style="flex:0 0 auto">إضافةُ فصلٍ دراسي</button></div>') + '</div>';
      html += '<div class="panel"><h3>تصنيفاتُ المشاركة</h3><div class="hint">تظهرُ كأزرارٍ عند تسجيلِ مشاركةٍ متميّزة</div>' + chips('star') + '<h3 style="margin-top:14px">تصنيفاتُ السلوك</h3><div class="hint">تظهرُ عند تسجيلِ سلوكٍ غيرِ لائق</div>' + chips('bad') + '</div>';
      html += '<div class="panel"><h3>أوزانُ درجةِ السلوك والتنبيهات</h3><div class="hint">درجةُ المتعلّم = مجموعُ أوزانِ تسجيلاتِه في المدّة</div><div class="weights">' + TYPES.map(function (t) { return '<label>' + t.label + '<input type="number" step="0.5" data-w="' + t.key + '" value="' + esc(st.weights[t.key]) + '"' + (ro ? ' readonly' : '') + '></label>'; }).join('') + '<label>تنبيهُ الغياب (أيّام)<input type="number" min="1" id="absAlert" value="' + esc(st.absAlert) + '"' + (ro ? ' readonly' : '') + '></label><label>تنبيهُ السلوك (تسجيلات)<input type="number" min="1" id="badAlert" value="' + esc(st.badAlert) + '"' + (ro ? ' readonly' : '') + '></label></div></div>';
      if (!ro) html += '<div class="row" style="margin-bottom:18px"><button class="btn p" id="tSave" style="flex:0 0 auto">حفظُ الإعدادات</button></div>';
      var u = Auth.user();
      html += '<div class="panel"><h3>الحساب</h3><div class="hint">' + esc(FB.demo ? 'وضعٌ تجريبيٌّ محليّ — البياناتُ في هذا المتصفّحِ فقط' : 'مسجَّلٌ بـ ' + (u ? u.email : '') + (ro ? ' (قراءةٌ فقط)' : ' (المعلّم)')) + '</div>'
        + (ro ? '' : '<div class="hint">مشرفٌ قارئ: يرى كلَّ شيءٍ ولا يعدِّل. أضفْ بريدَه هنا واضغطْ «حفظُ الإعدادات»؛ ثمّ يُنشئُ هو حسابَه من صفحةِ الدخول بالبريدِ نفسِه.</div><div class="chipedit" id="viewers">' + (st.viewers || []).map(function (v) { return '<span>' + esc(v) + '<b data-rmv="' + esc(v) + '">×</b></span>'; }).join('') + '<input type="email" placeholder="بريدُ المشرف ثمّ Enter" id="viewerAdd" style="width:240px"></div>')
        + '<div class="row" style="margin-top:8px"><button class="btn" id="refreshAll" style="flex:0 0 auto">إعادةُ تحميلِ البيانات</button>' + (FB.demo ? '<button class="btn d" id="wipeDemo" style="flex:0 0 auto">مسحُ بياناتِ التجربة</button><a class="btn" href="' + location.pathname + '#/" style="flex:0 0 auto">الخروجُ من التجربة</a>' : '') + '</div></div>';
      html += '<div class="panel"><h3>النسخُ الاحتياطي</h3><div class="hint">JSON كاملٌ يُستعادُ منه كلُّ شيء، وExcel (CSV) بكلِّ التسجيلات</div><div class="row"><button class="btn p" id="bkJson" style="flex:0 0 auto">تنزيلُ نسخةٍ كاملة (JSON)</button><button class="btn" id="bkCsv" style="flex:0 0 auto">تنزيلُ كلِّ التسجيلات (Excel CSV)</button>' + (ro ? '' : '<label class="btn" style="flex:0 0 auto">استعادةٌ من JSON<input type="file" id="bkIn" accept="application/json" hidden></label>') + '</div></div>';
      if (!ro) html += '<div class="panel"><h3>أرشفةُ العامِ الدراسي</h3><div class="hint">تنقلُ كلَّ الفصولِ الحاليةِ إلى الأرشيف بسجلِّها (تبقى تقاريرُها في «فصولي ← المؤرشفة»)، وتفرغُ الجدول، وتقترحُ فصلَينِ دراسيَّينِ جديدَين لتبدأَ سنةً بيضاء.</div><button class="btn d" id="archYear">أرشفةُ العامِ الدراسيِّ الحالي</button></div>';
      html += '<div class="panel"><h3>عن مدرستي</h3><p style="margin:0;color:var(--muted);font-size:15px">التحضيراتُ ملفّاتٌ في مستودعِ الموقعِ نفسِه، ومتابعةُ المتعلّمين محفوظةٌ في Firestore ولا يقرؤها إلا حسابُك (والمشرفونَ الذين تُضيفهم). التطبيقُ يعملُ بلا إنترنت ويُثبَّتُ على الهاتف من قائمةِ المتصفّح «إضافة إلى الشاشةِ الرئيسية».</p></div>';
      view.innerHTML = html;
      $('refreshAll').onclick = async function () { S.days = {}; await loadCore(true); toast('حُدِّثت البيانات'); render(); };
      if ($('wipeDemo')) $('wipeDemo').onclick = function () { if (confirm('مسحُ بياناتِ التجربة؟')) { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('sc_') === 0) localStorage.removeItem(k); }); location.reload(); } };
      $('bkJson').onclick = backupJSON; $('bkCsv').onclick = backupCSV;
      if (ro) return;
      $('tAdd').onclick = function () { collect(); st.terms.push({ id: uid('t'), name: 'فصلٌ دراسيٌّ جديد', start: today(), end: addDays(today(), 120) }); render(); };
      $('terms').addEventListener('click', function (e) { var b = e.target.closest('[data-act=del]'); if (!b) return; collect(); st.terms.splice(+b.closest('.term').dataset.i, 1); render(); });
      view.querySelectorAll('.chipedit[data-type]').forEach(function (box) {
        var type = box.dataset.type;
        box.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; collect(); st.cats[type] = st.cats[type].filter(function (k) { return k !== b.dataset.rm; }); render(); });
        box.querySelector('input[data-add]').addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; var v = this.value.trim(); if (!v) return; collect(); if (st.cats[type].indexOf(v) < 0) st.cats[type].push(v); render(); });
      });
      $('viewers').addEventListener('click', function (e) { var b = e.target.closest('[data-rmv]'); if (!b) return; collect(); st.viewers = st.viewers.filter(function (v) { return v !== b.dataset.rmv; }); render(); });
      $('viewerAdd').addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; var v = this.value.trim().toLowerCase(); if (!v || !/@/.test(v)) return; collect(); if (st.viewers.indexOf(v) < 0) st.viewers.push(v); render(); });
      $('tSave').onclick = async function () { collect(); try { await saveSettings(); await write('set', 'sc_meta', 'access', { viewers: st.viewers }); log('حفظُ الإعدادات'); toast('حُفظ'); } catch (err) { fail(err); } };
      $('bkIn').onchange = function () { var f = this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { restoreJSON(r.result); }; r.readAsText(f); };
      $('archYear').onclick = archiveYear;
    }
    function collect() {
      var terms = [];
      view.querySelectorAll('.term').forEach(function (r) { var t = {}; r.querySelectorAll('[data-k]').forEach(function (i) { t[i.dataset.k] = i.value; }); t.id = (st.terms[+r.dataset.i] || {}).id || uid('t'); if (t.name && t.start && t.end) terms.push(t); }); st.terms = terms;
      view.querySelectorAll('input[data-w]').forEach(function (i) { st.weights[i.dataset.w] = num(i.value, 0); });
      if ($('absAlert')) { st.absAlert = Math.max(1, num($('absAlert').value, 3)); st.badAlert = Math.max(1, num($('badAlert').value, 3)); }
    }
    render();
  }
  async function allDaysDump() {
    var out = {};
    for (var i = 0; i < S.allClasses.length; i++) { var c = S.allClasses[i]; var m; try { m = await loadDays(c._id, true); } catch (e) { m = (LS.get('sc_days_' + c._id) || { map: {} }).map; } out[c._id] = Object.keys(m).filter(function (k) { return m[k]; }).sort().map(function (k) { var d = m[k]; return { date: d.date, ev: d.ev || [], taken: !!d.taken }; }); }
    return out;
  }
  async function backupJSON() {
    toast('يُجمَعُ…'); var days = await allDaysDump();
    var dump = { app: 'madrasa', v: 1, at: new Date().toISOString(), settings: S.settings, classes: S.allClasses.map(function (c) { var x = Object.assign({}, c); delete x._path; return x; }), days: days };
    downloadBlob('مدرستي-نسخة-' + today() + '.json', JSON.stringify(dump, null, 1), 'application/json'); log('نسخةٌ احتياطية');
  }
  async function backupCSV() {
    toast('يُجمَعُ…'); var days = await allDaysDump(), rows = [['الفصل', 'المتعلّم', 'رقم الجلوس', 'التاريخ', 'النوع', 'التصنيف', 'الملاحظة', 'الوقت']];
    S.allClasses.forEach(function (c) { var by = {}; (c.students || []).forEach(function (s) { by[s.id] = s; }); (days[c._id] || []).forEach(function (d) { d.ev.forEach(function (e) { var s = by[e.sid] || { name: 'محذوف', no: '' }; rows.push([c.name, s.name, s.no || '', d.date, TYPE[e.type] ? TYPE[e.type].label : e.type, e.cat || '', e.note || '', e.ts ? new Date(e.ts).toTimeString().slice(0, 5) : '']); }); }); });
    downloadCSV('مدرستي-التسجيلات-' + today() + '.csv', rows);
  }
  async function restoreJSON(text) {
    var d; try { d = JSON.parse(text); } catch (e) { return toast('ملفٌّ غيرُ صالح', true); }
    if (!d || d.app !== 'madrasa') return toast('ليس ملفَّ نسخةٍ من مدرستي', true);
    if (!confirm('استعادةُ ' + ar((d.classes || []).length) + ' فصلاً وتسجيلاتِها من نسخةِ ' + (d.at || '').slice(0, 10) + '؟ تُكتَبُ فوقَ ما يطابقُها ولا يُحذَفُ غيرُها.')) return;
    try {
      if (d.settings) { S.settings = normSettings(d.settings); await saveSettings(); }
      for (var i = 0; i < (d.classes || []).length; i++) { var c = d.classes[i], id = c._id; var x = Object.assign({}, c); delete x._id; delete x._path; await write('set', 'sc_classes', id, x); var ex = cls(id); if (ex) Object.assign(ex, x); else S.allClasses.push(Object.assign({ _id: id }, x)); }
      splitClasses(); persistCore();
      var n = 0, cids = Object.keys(d.days || {});
      for (var k = 0; k < cids.length; k++) { var list = d.days[cids[k]]; for (var j = 0; j < list.length; j++) { var day = list[j], data = { cls: cids[k], date: day.date, ev: day.ev || [] }; if (day.taken) data.taken = true; await write('set', 'sc_days', cids[k] + '_' + day.date, data); n++; } LS.del('sc_days_' + cids[k]); }
      S.days = {}; log('استعادةُ نسخةٍ احتياطية', n + ' يوماً'); toast('استُعيدت النسخة — ' + ar(n) + ' يوماً'); setTimeout(route, 600);
    } catch (e) { fail(e); }
  }
  async function archiveYear() {
    if (!S.classes.length) return toast('لا فصولَ حاليةً', true);
    var yy = new Date().getFullYear();
    var y = prompt('اسمُ العامِ الدراسيِّ المؤرشف (يظهرُ في الأرشيف):', 'العامُ الدراسيُّ ' + ar(yy - 1) + '/' + ar(yy)); if (!y) return;
    if (!confirm('أرشفةُ ' + ar(S.classes.length) + ' فصلاً؟ تختفي من القوائمِ اليومية وتبقى تقاريرُها.')) return;
    try {
      var list = S.classes.slice();
      for (var i = 0; i < list.length; i++) { var c = list[i]; c.archived = true; c.archivedAt = today(); c.year = y; await saveClass(c); }
      S.settings.schedule = {};
      S.settings.terms = [{ id: uid('t'), name: 'الفصلُ الدراسيُّ الأوّل ' + ar(yy) + '/' + ar(yy + 1), start: yy + '-09-01', end: (yy + 1) + '-01-31' }, { id: uid('t'), name: 'الفصلُ الدراسيُّ الثاني ' + ar(yy) + '/' + ar(yy + 1), start: (yy + 1) + '-02-01', end: (yy + 1) + '-06-30' }];
      await saveSettings(); splitClasses(); persistCore(); log('أرشفةُ العامِ الدراسي', y); toast('أُرشف العام — أضفْ فصولَ السنةِ الجديدة'); location.hash = '#/classes';
    } catch (e) { fail(e); }
  }

  /* ---------------- سجلُّ التعديلات ---------------- */
  async function logView() {
    var d = new Date(), items = [];
    for (var i = 0; i < 6 && items.length < 300; i++) { var m = iso(new Date(d.getFullYear(), d.getMonth() - i, 1)).slice(0, 7); var doc = await DB.get('sc_log', 'log_' + m).catch(function () { return null; }); if (doc && doc.items) items = items.concat(doc.items); }
    items.sort(function (a, b) { return b.ts - a.ts; });
    view.innerHTML = '<div class="crumb"><a href="#/">الرئيسة</a><span class="sep">›</span><a href="#/settings">الإعدادات</a><span class="sep">›</span>سجلُّ التعديلات</div><div class="ttl"><div><h2>سجلُّ التعديلات</h2><p>آخرُ ' + ar(Math.min(items.length, 300)) + ' عمليةً: ما أُضيف أو حُذف أو عُدِّل ومتى</p></div></div>'
      + '<div class="panel">' + (items.length ? items.slice(0, 300).map(function (it) { return '<div class="logrow"><span class="t">' + fmtTs(it.ts) + '</span><span><b>' + esc(it.act) + '</b>' + (it.d ? ' — ' + esc(it.d) : '') + '</span></div>'; }).join('') : '<div class="empty">لا عملياتَ مسجَّلة</div>') + '</div>';
  }

  /* ---------------- الوضعُ التجريبي: بذرة ---------------- */
  async function seedDemo() {
    if (!FB.demo || localStorage.getItem('sc_demo_db_v1')) return;
    var c1 = 'cdemo1', c2 = 'cdemo2', names1 = ['علي حسين', 'محمد جاسم', 'يوسف عبدالله', 'حسن الصالح', 'عبدالعزيز فهد', 'أحمد الكندري', 'سالم ناصر', 'خالد العنزي', 'فيصل مبارك', 'عمر السبيعي', 'بدر الشمري', 'ناصر العجمي'];
    var names2 = ['حمد راشد', 'جابر علي', 'مشاري سعد', 'طلال يوسف', 'ضاري فهد', 'عبدالرحمن صالح', 'راكان محمد', 'سعود عبدالله', 'نواف حسين', 'زيد الرشيدي'];
    var st1 = names1.map(function (n, i) { return { id: 'sd1' + i, name: n, no: String(i + 1) }; }), st2 = names2.map(function (n, i) { return { id: 'sd2' + i, name: n, no: String(i + 1) }; });
    await DB.set('sc_classes', c1, { name: 'عاشر ٦', grade: '10', order: 1, students: st1, created: today() });
    await DB.set('sc_classes', c2, { name: 'عاشر ٣', grade: '10', order: 2, students: st2, created: today() });
    var st = defaultSettings(); st.schedule = { 0: [c1, null, c2, null, null, null, null], 1: [null, c2, null, c1, null, null, null], 2: [c1, null, null, null, c2, null, null], 3: [null, c1, c2, null, null, null, null], 4: [c2, null, c1, null, null, null, null] };
    st.times = [{ s: '07:30', e: '08:15' }, { s: '08:15', e: '09:00' }, { s: '09:00', e: '09:45' }, { s: '10:05', e: '10:50' }, { s: '10:50', e: '11:35' }, { s: '11:35', e: '12:20' }, { s: '12:20', e: '13:05' }];
    st.terms[0].start = addDays(today(), -50);
    await DB.set('sc_meta', 'settings', st);
    var rnd = function (n) { return Math.floor(Math.random() * n); }, pick = function (a) { return a[rnd(a.length)]; };
    for (var d = addDays(today(), -49); d <= today(); d = addDays(d, 1)) {
      var dow = pd(d).getDay(); if (dow === 5 || dow === 6) continue;
      [[c1, st1], [c2, st2]].forEach(function (pair) {
        if ((st.schedule[dow] || []).indexOf(pair[0]) < 0) return;
        var ev = []; pair[1].forEach(function (s, i) {
          if (Math.random() < (i === 3 ? .3 : .06)) ev.push({ id: uid('e'), sid: s.id, type: 'absent', ts: Date.now() });
          else { if (Math.random() < (i < 3 ? .45 : .15)) ev.push({ id: uid('e'), sid: s.id, type: 'star', cat: pick(DEFAULT_CATS.star), ts: Date.now() }); if (Math.random() < .12) ev.push({ id: uid('e'), sid: s.id, type: 'wc', ts: Date.now() }); if (Math.random() < (i === 7 ? .25 : .04)) ev.push({ id: uid('e'), sid: s.id, type: 'bad', cat: pick(DEFAULT_CATS.bad), ts: Date.now() }); if (Math.random() < .05) ev.push({ id: uid('e'), sid: s.id, type: 'note', note: pick(['لم يُحضرِ الكتاب', 'تحسّنٌ ملحوظٌ في الخطّ', 'يحتاجُ متابعةً في الإملاء', 'قدّم واجبَه مبكّراً']), ts: Date.now() }); }
        });
        DB.set('sc_days', pair[0] + '_' + d, { cls: pair[0], date: d, ev: ev, taken: true });
      });
    }
    await new Promise(function (r) { setTimeout(r, 300); });
  }

  /* ---------------- الإقلاع ---------------- */
  (async function boot() {
    S.sort = LS.get('sc_sort', 'manual');
    await Auth.restore(); setRole();
    if (FB.demo) await seedDemo();
    if ('serviceWorker' in navigator && !FB.demo && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(function () { }); }
    if (!location.hash) location.hash = '#/';
    route(); flush();
  })();
})();
