/* ===== المحرّرُ المرئي: يجلبُ HTML الصفحةِ من المستودع، يُحرِّرُه في مكانِه (designMode)، ويُعيدُ نشرَه بالتزامٍ واحد ===== */
(function () {
  'use strict';
  var ROOT = 'https://haydarvsky.github.io';
  var OWNER = 'haydarvsky';
  var KEYS = ['hv_token', 'ar_token', 'br_token', 'vd_token', 'bg_token', 'ed_token'];
  var ALLOWED = ['haydarvsky.github.io', 'articles', 'books', 'brand', 'videos', 'CCUAi', 'TOT'];
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var REPO = q.get('repo') || '', PATH = q.get('path') || '';
  var gh, original = '', doctype = '<!DOCTYPE html>', sha = '', dirty = false, loadedOnce = false;

  function say(msg, kind) {
    var s = $('status'); s.textContent = msg; s.className = 'status show' + (kind ? ' ' + kind : '');
    if (kind) setTimeout(function () { s.className = 'status'; }, 5200);
  }
  function getToken() { for (var i = 0; i < KEYS.length; i++) { var v = localStorage.getItem(KEYS[i]); if (v) return v; } return ''; }
  function liveUrl() { return REPO === 'haydarvsky.github.io' ? ROOT + '/' + PATH : ROOT + '/' + REPO + '/' + PATH; }
  function baseUrl() { var u = liveUrl(); return u.slice(0, u.lastIndexOf('/') + 1); }
  function markDirty(v) { dirty = v; $('dirty').hidden = !v; $('save').disabled = !v; }

  if (!REPO || !PATH || ALLOWED.indexOf(REPO) < 0) { $('veil').innerHTML = 'لم تُحدَّدْ صفحة.<small>ارجعْ إلى مركزِ التحكّم واخترْ ملفّاً.</small>'; return; }
  var token = getToken();
  if (!token) { location.href = './'; return; }
  gh = new GhApi({ owner: OWNER, repo: REPO, token: token });
  $('path').textContent = REPO + ' / ' + PATH;
  $('live').href = liveUrl();
  $('who').textContent = REPO;
  document.title = 'تحرير ' + PATH + ' — المحرّر المرئي';

  /* ---- جلبُ الملفّ (عبر الكائن blob فلا حدَّ للحجم) ---- */
  function fetchFile() {
    $('veil').hidden = false;
    return gh.tree().then(function (m) {
      sha = m.get(PATH);
      if (!sha) throw new Error('الملفُّ غيرُ موجودٍ في المستودع: ' + PATH);
      return gh.req('GET', '/git/blobs/' + sha);
    }).then(function (b) {
      original = GhApi.b64ToUtf8(b.content || '');
      var m = original.match(/<!DOCTYPE[^>]*>/i); doctype = m ? m[0] : '<!DOCTYPE html>';
      return original;
    });
  }

  /* ---- تجهيزُ النسخةِ القابلةِ للتحرير ---- */
  function prepare(html, runScripts) {
    var s = html;
    /* السكربتاتُ تُعطَّلُ افتراضياً كي لا تتصارعَ مع الكتابة (تُستعادُ عند الحفظ) */
    if (!runScripts) s = s.replace(/<script\b([^>]*)>/gi, function (_, a) { return '<script data-hv-off="1" data-hv-attrs="' + encodeURIComponent(a) + '" type="text/plain">'; });
    /* المراجعُ النسبية (خطوط، صور، أوراق ستايل) تُحلُّ على النسخةِ الحيّة */
    var base = '<base data-hv="1" href="' + baseUrl() + '">';
    if (/<head[^>]*>/i.test(s)) s = s.replace(/<head[^>]*>/i, function (m) { return m + base; });
    else s = s.replace(/<html[^>]*>/i, function (m) { return m + '<head>' + base + '</head>'; });
    /* شريطُ التنقّلِ الموحَّد لا يُحمَّلُ داخلَ المحرّر */
    s = s.replace(/<script[^>]*nav\/nav\.js[^>]*><\/script>/gi, function (m) { return '<!--HVNAV' + encodeURIComponent(m) + '-->'; });
    return s;
  }
  /* ---- إعادةُ النسخةِ النهائيةِ من DOM المحرَّر ---- */
  function serialize(doc) {
    var html = doc.documentElement.outerHTML;
    html = html.replace(/<base data-hv="1"[^>]*>/i, '');
    html = html.replace(/<script data-hv-off="1" data-hv-attrs="([^"]*)" type="text\/plain">/gi, function (_, a) { return '<script' + decodeURIComponent(a) + '>'; });
    html = html.replace(/<!--HVNAV([^>]*?)-->/g, function (_, a) { return decodeURIComponent(a); });
    return doctype + '\n' + html + '\n';
  }

  var frame = $('frame');
  function load() {
    fetchFile().then(function (html) {
      frame.srcdoc = prepare(html, $('scripts').checked);
    }).catch(function (e) { $('veil').innerHTML = 'تعذّرَ الجلب<small>' + e.message + '</small>'; });
  }
  frame.addEventListener('load', function () {
    var doc = frame.contentDocument; if (!doc || !doc.documentElement) return;
    try { doc.designMode = 'on'; } catch (e) { }
    $('ttl').value = doc.title || '';
    $('veil').hidden = true; loadedOnce = true;
    if (!dirty) markDirty(false);
    doc.addEventListener('input', function () { markDirty(true); });
    doc.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); $('save').click(); } });
    /* تعطيلُ التنقّلِ بالروابطِ والنماذجِ أثناءَ التحرير */
    doc.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a,button[type=submit]'); if (a) e.preventDefault(); }, true);
    doc.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  });

  $('ttl').addEventListener('input', function () { var d = frame.contentDocument; if (d) { d.title = $('ttl').value; markDirty(true); } });
  function cmd(c) { var d = frame.contentDocument; if (!d) return; d.execCommand(c, false, null); markDirty(true); }
  $('undo').addEventListener('click', function () { cmd('undo'); });
  $('redo').addEventListener('click', function () { cmd('redo'); });
  $('bold').addEventListener('click', function () { cmd('bold'); });
  $('clear').addEventListener('click', function () { cmd('removeFormat'); });
  $('scripts').addEventListener('change', function () {
    if (dirty && !confirm('إعادةُ التحميلِ ستُلغي التعديلاتِ غيرَ المحفوظة. أُكمل؟')) { $('scripts').checked = !$('scripts').checked; return; }
    markDirty(false); load();
  });
  $('reload').addEventListener('click', function () {
    if (dirty && !confirm('إعادةُ التحميلِ ستُلغي التعديلاتِ غيرَ المحفوظة. أُكمل؟')) return;
    markDirty(false); load();
  });
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); $('save').click(); } });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  $('save').addEventListener('click', function () {
    var doc = frame.contentDocument; if (!doc || !loadedOnce) return;
    var out = serialize(doc);
    if (out.length < original.length * 0.5) {
      if (!confirm('الصفحةُ الناتجةُ أصغرُ بكثيرٍ من الأصل — هل حُذفَ جزءٌ كبيرٌ عن قصد؟')) return;
    }
    $('save').disabled = true; say('جارٍ النشر…');
    gh.commit({
      message: 'تحرير ' + PATH + ' من المحرّر المرئي',
      files: [{ path: PATH, text: out }],
      onProgress: function (p) { if (p.stage === 'upload') say('رفعُ الملفّ…'); if (p.stage === 'commit') say('إتمامُ الالتزام…'); }
    }).then(function () {
      original = out; markDirty(false);
      say('نُشِرت ✓ — تظهرُ على الموقعِ خلالَ نحوِ دقيقة', 'ok');
    }).catch(function (e) { $('save').disabled = false; say('تعذّرَ النشر: ' + e.message, 'bad'); });
  });

  load();
})();
