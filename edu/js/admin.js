/* ===== لوحةُ تحكّم المكتبةِ التعليمية: الموادُّ والأقسامُ ومفتاحُ الحقيبة — نشرٌ بالتزامٍ واحد ===== */
(function () {
  'use strict';
  var OWNER = 'haydarvsky', REPO = 'haydarvsky.github.io', BRANCH = 'main';
  var PREFIX = 'edu/';               /* المكتبةُ تعيشُ داخلَ مستودعِ الرئيسة تحت edu/ */
  var KEYS = ['ed_token', 'hv_token', 'ar_token', 'br_token', 'vd_token', 'bg_token'];
  var DATA_PATH = 'data/edu.json';   /* نسبيٌّ للمكتبة؛ يُسبَقُ بـPREFIX عند القراءةِ والنشر */
  var NAV = 'https://haydarvsky.github.io/nav/nav.js';
  var EDITOR = 'https://haydarvsky.github.io/admin/editor.html?repo=haydarvsky.github.io&path=' + encodeURIComponent(PREFIX);
  var KINDS = { lesson: 'درس', slides: 'شرائح', game: 'لعبة', exercise: 'تمارين', review: 'مراجعة', tool: 'أداةٌ حيّة', doc: 'كتيّب', site: 'موقع' };
  var MOCK = /[?&]mock=1/.test(location.search);
  var gh = null;
  var state = { data: null, items: [], sections: [], pending: {}, deletes: [], editing: null, dirty: false, filterSec: '' };
  var $ = function (id) { return document.getElementById(id); };
  var el = {};
  ['gate', 'app', 'token', 'tokenSave', 'tryMock', 'who', 'save', 'dirty', 'mock', 'rows', 'newBtn', 'nItems', 'fsec',
    'secs', 'newSec', 'addSec', 'newKey', 'setKey', 'hint',
    'edTitle', 'drop', 'file', 'fname', 'title', 'section', 'kind', 'grade', 'meta', 'desc', 'tags', 'url', 'screen', 'cta', 'id',
    'cov', 'covBtn', 'covClear', 'covThumb', 'featured', 'hidden', 'apply', 'cancel', 'editText', 'del', 'pcard', 'status'].forEach(function (k) { el[k] = $(k); });

  var AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function arNum(n) { return String(n).replace(/[0-9]/g, function (d) { return AR[+d]; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function slugify(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40) || ('item-' + Date.now().toString(36));
  }
  function say(msg, kind) {
    el.status.textContent = msg; el.status.className = 'status show' + (kind ? ' ' + kind : '');
    if (kind) setTimeout(function () { el.status.className = 'status'; }, 5200);
  }
  function markDirty(v) { state.dirty = v; el.dirty.hidden = !v; el.save.disabled = !v; }
  function secOf(id) { return state.sections.filter(function (s) { return s.id === id; })[0]; }
  function sha256(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  /* ---------------- التبويبات ---------------- */
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      ['items', 'secs', 'lock'].forEach(function (k) { $('tab-' + k).hidden = (t.dataset.tab !== k); });
    });
  });

  /* ---------------- الإقلاع ---------------- */
  function getToken() { for (var i = 0; i < KEYS.length; i++) { var v = localStorage.getItem(KEYS[i]); if (v) return v; } return ''; }
  function boot() {
    if (MOCK) return startMock();
    var t = getToken();
    if (!t) { el.gate.hidden = false; return; }
    connect(t);
  }
  function startMock() {
    el.mock.hidden = false; el.gate.hidden = true; el.app.hidden = false;
    el.who.textContent = 'تجربةٌ محلّية — لا يُنشَرُ شيء';
    fetch(DATA_PATH, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(setData).catch(function () { setData({}); });
  }
  function connect(token) {
    gh = new GhApi({ owner: OWNER, repo: REPO, branch: BRANCH, token: token });
    say('جارٍ التحقّقُ من الرمز…');
    gh.check().then(function (info) {
      if (!info.canPush) throw new Error('الرمزُ لا يملكُ صلاحيةَ الكتابةِ في المستودع');
      localStorage.setItem('ed_token', token); localStorage.setItem('hv_owner', '1');
      el.gate.hidden = true; el.app.hidden = false;
      el.who.textContent = (info.user ? info.user + ' · ' : '') + info.repo;
      say('متّصل ✓', 'ok');
      return gh.readText(PREFIX + DATA_PATH).then(function (f) { setData(f ? JSON.parse(f.text) : {}); });
    }).catch(function (e) { el.gate.hidden = false; el.app.hidden = true; say('تعذّرَ الاتصال: ' + e.message, 'bad'); });
  }
  el.tokenSave.addEventListener('click', function () { var t = el.token.value.trim(); if (!t) { el.token.focus(); return; } connect(t); });
  el.token.addEventListener('keydown', function (e) { if (e.key === 'Enter') el.tokenSave.click(); });
  el.tryMock.addEventListener('click', function () { location.search = '?mock=1'; });

  function setData(d) {
    state.data = d || {};
    state.items = state.data.items || []; state.sections = state.data.sections || [];
    if (!state.data.lock) state.data.lock = { hash: '', hint: '' };
    el.hint.value = state.data.lock.hint || '';
    renderSecs(); renderRows(); fillSelects(); newItem();
  }

  /* ---------------- الموادّ ---------------- */
  function itemsSorted() { return state.items.map(function (a, i) { return { a: a, i: i }; }).sort(function (x, y) { return (x.a.order || 0) - (y.a.order || 0); }); }
  function renderRows() {
    var list = itemsSorted().filter(function (x) { return !state.filterSec || x.a.section === state.filterSec; });
    el.nItems.textContent = '(' + arNum(state.items.length) + ')';
    if (!list.length) { el.rows.innerHTML = '<p class="hint">لا مادّةَ هنا — ابدأْ بـ«مادّةٌ جديدة».</p>'; return; }
    var lastSec = null, out = '';
    list.forEach(function (x) {
      var a = x.a, i = x.i, s = secOf(a.section);
      if (!state.filterSec && a.section !== lastSec) { lastSec = a.section; out += '<p class="hint" style="margin:10px 0 4px;font-weight:700;color:var(--green)">' + esc(s ? s.title : a.section) + (s && s.locked ? ' <span class="lockbadge">مقفل</span>' : '') + '</p>'; }
      out += '<div class="row' + (state.editing === i ? ' sel' : '') + (a.hidden ? ' hid' : '') + '" draggable="true" data-i="' + i + '">'
        + '<span class="grip" title="اسحبْ للترتيب">⠿</span>'
        + '<span class="tx"><b>' + esc(a.title || '(بلا عنوان)') + '</b>'
        + '<i><span class="kindbadge">' + esc(KINDS[a.kind] || a.kind || '') + '</span>' + esc(a.file || a.url || '—') + '</i></span>'
        + '<span class="acts">'
        + '<button class="icobtn star' + (a.featured ? ' star-on' : '') + '" data-act="feat" title="ابدأْ من هنا"><svg viewBox="0 0 24 24" ' + (a.featured ? 'fill="currentColor" stroke="none"' : '') + '><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/></svg></button>'
        + '<button class="icobtn" data-act="hide" title="' + (a.hidden ? 'أظهرْ' : 'أخفِ') + '">' + (a.hidden
          ? '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.3A8 8 0 0 1 21 12a17 17 0 0 1-2.2 2.8M6.2 6.6A16 16 0 0 0 3 12a8 8 0 0 0 11 6.6"/></svg>'
          : '<svg viewBox="0 0 24 24"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/></svg>') + '</button>'
        + '<button class="icobtn" data-act="edit" title="عدّلْ"><svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button>'
        + '<button class="icobtn del" data-act="del" title="احذفْ"><svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/></svg></button>'
        + '</span></div>';
    });
    el.rows.innerHTML = out;
  }
  el.fsec.addEventListener('change', function () { state.filterSec = el.fsec.value; renderRows(); });
  el.rows.addEventListener('click', function (e) {
    var row = e.target.closest('.row'); if (!row) return;
    var i = +row.dataset.i, btn = e.target.closest('[data-act]'), act = btn && btn.dataset.act;
    if (act === 'feat') { state.items.forEach(function (a, k) { a.featured = (k === i) ? !a.featured : false; }); markDirty(true); renderRows(); return; }
    if (act === 'hide') { state.items[i].hidden = !state.items[i].hidden; markDirty(true); renderRows(); return; }
    if (act === 'del') { removeItem(i); return; }
    edit(i);
  });
  function removeItem(i) {
    var a = state.items[i];
    if (!confirm('حذفُ «' + (a.title || '') + '» من المكتبة؟' + (a.file ? '\nسيُحذَفُ ملفُّها ' + a.file + ' من المستودع أيضاً.' : ''))) return;
    if (a.file && !state.pending[a.file]) state.deletes.push(a.file);
    if (a.cover && !/^https?:/.test(a.cover)) state.deletes.push(a.cover);
    delete state.pending[a.file];
    state.items.splice(i, 1); normalizeOrder(); state.editing = null; markDirty(true); renderRows(); newItem();
  }
  /* السحبُ للترتيب */
  var dragI = null;
  el.rows.addEventListener('dragstart', function (e) { var r = e.target.closest('.row'); if (!r) return; dragI = +r.dataset.i; r.classList.add('drag'); });
  el.rows.addEventListener('dragover', function (e) { e.preventDefault(); var r = e.target.closest('.row'); if (!r) return; [].forEach.call(el.rows.querySelectorAll('.row'), function (c) { c.classList.remove('over'); }); r.classList.add('over'); });
  el.rows.addEventListener('drop', function (e) {
    e.preventDefault(); var r = e.target.closest('.row'); if (!r || dragI == null) return;
    var to = +r.dataset.i; if (to === dragI) return;
    var sorted = itemsSorted().map(function (x) { return x.i; });
    var from = sorted.indexOf(dragI), toPos = sorted.indexOf(to);
    sorted.splice(from, 1); sorted.splice(toPos, 0, dragI);
    sorted.forEach(function (idx, pos) { state.items[idx].order = pos; });
    dragI = null; markDirty(true); renderRows();
  });
  el.rows.addEventListener('dragend', function () { [].forEach.call(el.rows.querySelectorAll('.row'), function (c) { c.classList.remove('drag', 'over'); }); dragI = null; });
  function normalizeOrder() { itemsSorted().forEach(function (x, pos) { x.a.order = pos; }); }

  /* ---------------- الأقسام ---------------- */
  function secCount(id) { return state.items.filter(function (a) { return a.section === id; }).length; }
  function renderSecs() {
    el.secs.innerHTML = state.sections.map(function (s, i) {
      return '<div class="secrow" draggable="true" data-i="' + i + '">'
        + '<span class="grip">⠿</span>'
        + '<div><input type="text" data-f="title" value="' + esc(s.title) + '" aria-label="عنوان القسم">'
        + '<textarea data-f="desc" aria-label="وصف القسم">' + esc(s.desc || '') + '</textarea>'
        + '<div class="sid">' + esc(s.id) + ' · ' + arNum(secCount(s.id)) + ' مادّة</div>'
        + '<label class="lockt"><input type="checkbox" data-f="locked"' + (s.locked ? ' checked' : '') + '> داخلَ الحقيبةِ التدريبية (مقفل)</label></div>'
        + '<button class="icobtn del" data-rm="' + i + '" title="احذفِ القسم"><svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/></svg></button>'
        + '</div>';
    }).join('') || '<p class="hint">لا قسمَ بعد.</p>';
  }
  el.secs.addEventListener('input', function (e) {
    var r = e.target.closest('.secrow'); if (!r) return;
    var s = state.sections[+r.dataset.i], f = e.target.dataset.f;
    if (f === 'title') s.title = e.target.value; if (f === 'desc') s.desc = e.target.value;
    markDirty(true); fillSelects();
  });
  el.secs.addEventListener('change', function (e) {
    var r = e.target.closest('.secrow'); if (!r || e.target.dataset.f !== 'locked') return;
    state.sections[+r.dataset.i].locked = e.target.checked; markDirty(true); renderRows(); fillSelects();
  });
  el.secs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var i = +b.dataset.rm, s = state.sections[i], n = secCount(s.id);
    if (n) { say('لا يُحذَفُ «' + s.title + '» وفيه ' + arNum(n) + ' مادّة — انقلْها إلى قسمٍ آخرَ أوّلاً', 'bad'); return; }
    if (!confirm('حذفُ القسم «' + s.title + '»؟')) return;
    state.sections.splice(i, 1); markDirty(true); renderSecs(); fillSelects();
  });
  var dragS = null;
  el.secs.addEventListener('dragstart', function (e) { var r = e.target.closest('.secrow'); if (!r || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') { e.preventDefault(); return; } dragS = +r.dataset.i; r.classList.add('drag'); });
  el.secs.addEventListener('dragover', function (e) { e.preventDefault(); var r = e.target.closest('.secrow'); if (!r) return; [].forEach.call(el.secs.children, function (c) { c.classList.remove('over'); }); r.classList.add('over'); });
  el.secs.addEventListener('drop', function (e) {
    e.preventDefault(); var r = e.target.closest('.secrow'); if (!r || dragS == null) return;
    var m = state.sections.splice(dragS, 1)[0]; state.sections.splice(+r.dataset.i, 0, m);
    dragS = null; markDirty(true); renderSecs(); fillSelects(); renderRows();
  });
  el.secs.addEventListener('dragend', function () { [].forEach.call(el.secs.children, function (c) { c.classList.remove('drag', 'over'); }); dragS = null; });
  el.addSec.addEventListener('click', function () {
    var v = el.newSec.value.trim(); if (!v) { el.newSec.focus(); return; }
    var id = 'sec-' + Date.now().toString(36);
    state.sections.push({ id: id, title: v, desc: '', icon: 'def', locked: false });
    el.newSec.value = ''; markDirty(true); renderSecs(); fillSelects();
    say('أُضيفَ القسمُ «' + v + '»', 'ok');
  });
  el.newSec.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); el.addSec.click(); } });

  /* ---------------- مفتاحُ الحقيبة ---------------- */
  el.setKey.addEventListener('click', function () {
    var v = el.newKey.value.trim(); if (!v) { el.newKey.focus(); return; }
    sha256(v).then(function (h) { state.data.lock.hash = h; el.newKey.value = ''; markDirty(true); say('اعتُمِدَ المفتاحُ الجديد — انشرْ ليسري', 'ok'); });
  });
  el.hint.addEventListener('input', function () { state.data.lock.hint = el.hint.value.trim(); markDirty(true); });

  /* ---------------- النموذج ---------------- */
  var draft = null;
  function fillSelects() {
    var cur = draft ? draft.section : '';
    el.section.innerHTML = state.sections.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === cur ? ' selected' : '') + '>' + esc(s.title) + (s.locked ? ' 🔒' : '') + '</option>'; }).join('');
    el.kind.innerHTML = Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + (draft && draft.kind === k ? ' selected' : '') + '>' + KINDS[k] + '</option>'; }).join('');
    var fs = el.fsec.value;
    el.fsec.innerHTML = '<option value="">كلُّ الأقسام</option>' + state.sections.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === fs ? ' selected' : '') + '>' + esc(s.title) + '</option>'; }).join('');
  }
  function blank() {
    return { id: '', section: (state.sections[0] || {}).id || '', kind: 'lesson', title: '', desc: '', grade: '', meta: '', tags: [], file: '', url: '', screen: '', cta: '', cover: '', featured: false, hidden: false, order: state.items.length };
  }
  function newItem() { state.editing = null; draft = blank(); fill(); renderRows(); }
  function edit(i) { state.editing = i; draft = JSON.parse(JSON.stringify(state.items[i])); fill(); renderRows(); }
  function fill() {
    el.edTitle.textContent = state.editing == null ? 'مادّةٌ جديدة' : 'تعديلُ مادّة';
    el.del.hidden = state.editing == null;
    el.title.value = draft.title || ''; el.grade.value = draft.grade || ''; el.meta.value = draft.meta || '';
    el.desc.value = draft.desc || ''; el.tags.value = (draft.tags || []).join('، ');
    el.url.value = draft.url || ''; el.screen.value = draft.screen || ''; el.cta.value = draft.cta || ''; el.id.value = draft.id || '';
    el.featured.checked = !!draft.featured; el.hidden.checked = !!draft.hidden;
    fillSelects();
    el.fname.hidden = !draft.file; el.fname.textContent = draft.file ? 'الملفّ: ' + draft.file : '';
    el.drop.classList.toggle('has', !!draft.file);
    el.editText.hidden = !(draft.file && !state.pending[draft.file] && !MOCK);
    el.editText.href = EDITOR + encodeURIComponent(draft.file || '');
    setCovThumb(coverSrc()); preview();
  }
  function coverSrc() {
    if (!draft.cover) return '';
    var p = state.pending[draft.cover]; if (!p) return draft.cover;
    return 'data:image/' + (/\.png$/i.test(draft.cover) ? 'png' : 'jpeg') + ';base64,' + p.base64;
  }
  function setCovThumb(src) {
    if (src) { el.covThumb.src = src; el.covThumb.style.visibility = 'visible'; el.covClear.hidden = false; }
    else { el.covThumb.removeAttribute('src'); el.covThumb.style.visibility = 'hidden'; el.covClear.hidden = true; }
  }
  function readForm() {
    draft.title = el.title.value.trim(); draft.section = el.section.value; draft.kind = el.kind.value;
    draft.grade = el.grade.value.trim(); draft.meta = el.meta.value.trim(); draft.desc = el.desc.value.trim();
    draft.tags = el.tags.value.split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    draft.url = el.url.value.trim(); draft.screen = el.screen.value.trim(); draft.cta = el.cta.value.trim();
    draft.id = el.id.value.trim() || slugify(draft.title);
    draft.featured = el.featured.checked; draft.hidden = el.hidden.checked;
  }
  function preview() {
    readForm();
    var m = []; if (draft.meta) m.push(draft.meta); (draft.tags || []).slice(0, 2).forEach(function (t) { m.push(t); });
    var cs = coverSrc();
    el.pcard.innerHTML = (cs ? '<div class="pstrip"><img src="' + esc(cs) + '" alt=""></div>' : '')
      + '<div class="tags"><span class="catbadge">' + esc(KINDS[draft.kind] || '') + '</span>' + (draft.grade ? '<span>' + esc(draft.grade) + '</span>' : '') + '</div>'
      + '<h4>' + esc(draft.title || 'عنوانُ المادّة') + '</h4>'
      + (draft.desc ? '<p class="t">' + esc(draft.desc) + '</p>' : '')
      + (m.length ? '<div class="m">' + esc(m.join(' · ')) + '</div>' : '');
  }
  ['title', 'grade', 'meta', 'desc', 'tags', 'url', 'screen', 'cta', 'id'].forEach(function (k) { el[k].addEventListener('input', preview); });
  ['section', 'kind'].forEach(function (k) { el[k].addEventListener('change', preview); });
  el.featured.addEventListener('change', preview); el.hidden.addEventListener('change', preview);

  el.apply.addEventListener('click', function () {
    readForm();
    if (!draft.title) { el.title.classList.add('err'); el.title.focus(); say('العنوانُ مطلوب', 'bad'); return; }
    el.title.classList.remove('err');
    if (!draft.file && !draft.url) { say('ارفعْ ملفَّ HTML أو ضعْ رابطاً', 'bad'); return; }
    if (draft.featured) state.items.forEach(function (a) { a.featured = false; });
    if (state.editing == null) { draft.order = state.items.length; state.items.push(draft); state.editing = state.items.length - 1; }
    else state.items[state.editing] = draft;
    normalizeOrder(); markDirty(true); renderRows(); renderSecs();
    say('أُثبِتَ التعديلُ — اضغطْ «حفظٌ ونشر» ليظهرَ في المكتبة', 'ok');
    draft = JSON.parse(JSON.stringify(state.items[state.editing])); fill();
  });
  el.cancel.addEventListener('click', newItem);
  el.newBtn.addEventListener('click', newItem);
  el.del.addEventListener('click', function () { if (state.editing != null) removeItem(state.editing); });

  /* ---------------- ملفُّ المادّة ---------------- */
  el.drop.addEventListener('click', function () { el.file.click(); });
  el.drop.addEventListener('dragover', function (e) { e.preventDefault(); el.drop.classList.add('on'); });
  el.drop.addEventListener('dragleave', function () { el.drop.classList.remove('on'); });
  el.drop.addEventListener('drop', function (e) { e.preventDefault(); el.drop.classList.remove('on'); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) takeHtml(f); });
  el.file.addEventListener('change', function () { if (el.file.files[0]) takeHtml(el.file.files[0]); });

  /* يُحقَنُ شريطُ التنقّلِ الموحَّد في الملفِّ المرفوع إن لم يكن فيه */
  function withNav(text, title, locked) {
    if (text.indexOf('nav/nav.js') > -1) return text;
    var tags = '\n<meta name="hv-nav" content="mini">' + (title ? '\n<meta name="hv-title" content="' + esc(title) + '">' : '')
      + (locked ? '\n<meta name="hv-parent" content="/edu/haqiba.html">\n<meta name="hv-parent-title" content="الحقيبةُ التدريبية">\n<meta name="robots" content="noindex,nofollow">' : '')
      + '\n<script src="' + NAV + '" defer></script>\n';
    var m = /<\/head>/i.exec(text);
    if (m) return text.slice(0, m.index) + tags + text.slice(m.index);
    var h = /<html[^>]*>/i.exec(text);
    return h ? text.slice(0, h.index + h[0].length) + '<head>' + tags + '</head>' + text.slice(h.index + h[0].length) : tags + text;
  }
  function takeHtml(file) {
    if (!/\.html?$/i.test(file.name)) { say('المطلوبُ ملفُ HTML', 'bad'); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var text = String(fr.result);
      readForm();
      var base = slugify(file.name.replace(/\.html?$/i, ''));
      if (!el.id.value.trim() || /^item-/.test(el.id.value.trim())) el.id.value = base;
      draft.id = el.id.value.trim();
      var t = (text.match(/<title>(.*?)<\/title>/i) || [])[1];
      if (t && !el.title.value.trim()) el.title.value = t.replace(/\s*[—·|-]\s*(إعداد )?(أ\. )?حيدر المعاتيق\s*$/, '').trim();
      var sec = secOf(el.section.value), locked = !!(sec && sec.locked);
      var path = 'content/' + (locked ? 'h-7k2p/' : '') + draft.id + '.html';
      if (draft.file && draft.file !== path) delete state.pending[draft.file];
      draft.file = path;
      state.pending[path] = { text: withNav(text, el.title.value.trim(), locked) };
      el.fname.hidden = false; el.fname.textContent = 'الملفّ: ' + path + ' · ' + ImgTools.fmtSize(text.length);
      el.drop.classList.add('has'); el.editText.hidden = true;
      markDirty(true); preview();
      say('قُرئَ الملفُّ وأُضيفَ إليه شريطُ التنقّل — راجعِ البياناتِ ثمّ «أثبِتِ التعديل»', 'ok');
    };
    fr.readAsText(file, 'utf-8');
  }

  /* ---------------- الغلاف ---------------- */
  el.covBtn.addEventListener('click', function () { el.cov.click(); });
  el.covClear.addEventListener('click', function () {
    if (draft.cover && !state.pending[draft.cover] && !/^https?:/.test(draft.cover)) state.deletes.push(draft.cover);
    delete state.pending[draft.cover]; draft.cover = ''; setCovThumb(''); markDirty(true); preview();
  });
  el.cov.addEventListener('change', function () {
    var f = el.cov.files[0]; if (!f) return;
    ImgTools.compress(f, { maxEdge: 1200, quality: .86 }).then(function (r) {
      readForm();
      var path = 'covers/' + (draft.id || slugify(draft.title) || 'item') + '-' + Date.now().toString(36) + '.jpg';
      draft.cover = path; state.pending[path] = { base64: r.base64 };
      setCovThumb(coverSrc()); markDirty(true); preview();
    }).catch(function (e) { say('تعذّرت قراءةُ الصورة: ' + e.message, 'bad'); });
  });

  /* ---------------- الحفظُ والنشر ---------------- */
  el.save.addEventListener('click', function () {
    if (MOCK) { say('وضعُ التجربة — لا يُنشَرُ شيء', 'ok'); markDirty(false); return; }
    normalizeOrder();
    var out = state.data; out.items = state.items; out.sections = state.sections;
    var d = new Date(); out.updated = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var files = [{ path: PREFIX + DATA_PATH, text: JSON.stringify(out, null, 2) + '\n' }];
    Object.keys(state.pending).forEach(function (p) { var v = state.pending[p]; files.push(v.text != null ? { path: PREFIX + p, text: v.text } : { path: PREFIX + p, base64: v.base64 }); });
    el.save.disabled = true; say('جارٍ النشر…');
    gh.tree().then(function (tree) {
      var dels = state.deletes.map(function (p) { return PREFIX + p; }).filter(function (p) { return tree.has(p); });
      return gh.commit({
        message: 'المكتبةُ التعليمية: تحديثٌ من لوحةِ التحكّم', files: files, deletes: dels,
        onProgress: function (p) { if (p.stage === 'upload') say('رفعُ الملفّات ' + arNum(p.done) + '/' + arNum(p.total) + '…'); if (p.stage === 'commit') say('إتمامُ الالتزام…'); }
      });
    }).then(function () {
      state.pending = {}; state.deletes = []; markDirty(false); fill();
      say('نُشِرت ✓ — تظهرُ في المكتبةِ خلالَ نحوِ دقيقة', 'ok');
    }).catch(function (e) { el.save.disabled = false; say('تعذّرَ النشر: ' + e.message, 'bad'); });
  });
  window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  boot();
})();
