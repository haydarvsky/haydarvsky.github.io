// ═══════════ رواق للنشر — منطق صفحة طلب القصص المخصّصة ═══════════
(() => {
  const C = RW_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#form');
  const files = {};                 // child1, child2, father, mother → File
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const toAr = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);
  const toEn = s => s.replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── القصص ──
  const storiesEl = $('#stories');
  C.STORIES.forEach((s, i) => {
    storiesEl.insertAdjacentHTML('beforeend', `
      <label class="story">
        <input type="radio" name="story" value="${s.id}" ${i === 0 ? 'checked' : ''}>
        <span class="s-arch"><img src="${s.img}" alt="" loading="lazy"></span>
        <span>
          <h3>${s.title}</h3>
          <p>${s.blurb}</p>
          <span class="value">القيمة التربوية: <b>${s.value}</b></span>
        </span>
        <span class="check" aria-hidden="true">✓</span>
      </label>`);
  });
  storiesEl.insertAdjacentHTML('beforeend', `<div class="story soon"><p>حكاياتٌ أخرى في الطريق إلى الرواق…</p></div>`);
  const story = () => C.STORIES.find(s => s.id === (form.story && form.querySelector('[name=story]:checked')?.value)) || C.STORIES[0];

  // ── الجنس ──
  const gender = () => form.querySelector('[name=gender]:checked')?.value || '';
  $$('[name=gender]').forEach(r => r.addEventListener('change', () => {
    const g = gender() === 'girl';
    document.body.classList.toggle('girl', g);
    $('#nameLegend').textContent = g ? 'اسم البطلة' : 'اسم البطل';
    $('#photoWho').textContent = g ? 'للطفلة' : 'للطفل';
    $('#childName').placeholder = g ? 'مثال: مريم' : 'مثال: يوسف';
    if (!$('#childName').value.trim()) $('#pvName').textContent = g ? 'بطلتنا' : 'بطلنا';
    refresh();
  }));

  // ── الاسم ──
  const AR_NAME = /^[ء-غف-يً-ْٰٱپچڤگیـ ]+$/;
  const nameVal = () => $('#childName').value.replace(/\s+/g, ' ').trim();
  const nameOk = () => nameVal().length >= 2 && AR_NAME.test(nameVal());
  $('#childName').addEventListener('input', () => {
    const v = nameVal();
    $('#pvName').textContent = v || (gender() === 'girl' ? 'بطلتنا' : 'بطلنا');
    refresh();
  });

  // ── الهاتف ──
  const phoneVal = () => toEn($('#phone').value).replace(/[^\d+]/g, '');
  const phoneOk = () => { const d = phoneVal().replace(/\D/g, ''); return d.length >= 8 && d.length <= 15; };
  $('#phone').addEventListener('input', refresh);
  $('#agree').addEventListener('change', () => refresh());

  // ── خانات الصور ──
  $$('.slot').forEach(slot => {
    const key = slot.dataset.key;
    const input = $('input', slot);
    const frame = $('.slot-frame', slot);
    input.addEventListener('change', () => {
      const f = input.files[0];
      if (!f) return;
      files[key] = f;
      $('img', frame)?.remove();
      const img = new Image();
      img.alt = '';
      img.src = URL.createObjectURL(f);
      frame.appendChild(img);
      slot.classList.add('has');
      refresh();
    });
    $('.slot-x', slot).addEventListener('click', e => {
      e.preventDefault();
      delete files[key];
      input.value = '';
      $('img', frame)?.remove();
      slot.classList.remove('has');
      refresh();
    });
  });

  // ── الوالدان ──
  const parentsOn = () => $('#parentsToggle').checked;
  $('#parentsToggle').addEventListener('change', () => { $('#parents').hidden = !parentsOn(); refresh(); });

  // ── التحقق ──
  const blocks = $$('.block');
  const checks = [
    () => !!story(),
    () => !!gender(),
    nameOk,
    () => !!(files.child1 && files.child2),
    () => !parentsOn() || !!(files.father || files.mother),
    phoneOk,
    () => $('#agree').checked
  ];
  let tried = false;
  function refresh() {
    blocks.forEach((b, i) => {
      const ok = checks[i]();
      b.classList.toggle('ok', ok && (i !== 4 || parentsOn()));
      if (tried) {
        b.classList.toggle('bad', !ok);
        $$('.err', b).forEach(e => e.classList.toggle('on', !ok));
      }
    });
    renderSum();
  }

  function photoCount() { return Object.keys(files).filter(k => parentsOn() || k.startsWith('child')).length; }

  function renderSum() {
    const sum = $('#sum');
    const any = gender() || nameVal() || Object.keys(files).length;
    sum.classList.toggle('on', !!any);
    if (!any) return;
    const rows = [
      ['القصة', story().title],
      ['البطل', gender() === 'girl' ? 'بنت' : gender() === 'boy' ? 'ولد' : '—'],
      ['الاسم', nameVal() ? esc(nameVal()) : '—'],
      ['الصور', toAr(photoCount())]
    ];
    if (C.PRICE) rows.push(['السعر', esc(C.PRICE)]);
    sum.innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('');
  }

  // ── ضغط الصورة قبل الرفع ──
  async function shrink(file, max = 2048) {
    try {
      const bmp = await createImageBitmap(file);
      const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (s === 1 && file.size < 3.5e6 && /jpe?g/i.test(file.type)) return file;
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s);
      c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.9));
    } catch { return file; }
  }

  function newId() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let r = '';
    for (let i = 0; i < 4; i++) r += abc[Math.floor(Math.random() * abc.length)];
    return `RW-${ymd}-${r}`;
  }

  // ── الإرسال إلى بوت تلقرام ──
  const tg = m => `https://api.telegram.org/bot${C.TG_TOKEN}/${m}`;
  const LABELS = { child1: 'صورة البطل ١', child2: 'صورة البطل ٢', father: 'صورة الأب', mother: 'صورة الأم' };

  function upload(fd, onProgress) {
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest();
      x.open('POST', tg('sendMediaGroup'));
      x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
      x.onload = () => { try { const j = JSON.parse(x.responseText); j.ok ? res(j) : rej(j); } catch (e) { rej(e); } };
      x.onerror = rej;
      x.send(fd);
    });
  }

  function orderText(id) {
    const g = gender() === 'girl' ? 'بنت' : 'ولد';
    return [
      `📚 <b>طلب قصة مخصّصة</b> — <code>${id}</code>`,
      ``,
      `القصة: <b>${story().title}</b>`,
      `القيمة: ${story().value}`,
      `البطل: ${g}`,
      `الاسم: <b>${esc(nameVal())}</b>`,
      `واتساب: ${esc(phoneVal())}`,
      `صور الوالدين: ${parentsOn() ? [files.father && 'الأب', files.mother && 'الأم'].filter(Boolean).join(' و') : 'لا'}`,
      `عدد الصور: ${photoCount()}`,
      `موافقة وليّ الأمر على الشروط: نعم — ${consentTime()}`
    ].join('\n');
  }

  const consentTime = () => new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuwait' });

  let lastId = null;
  async function send() {
    const ov = $('#overlay');
    ov.hidden = false;
    $('#panelSending').hidden = false;
    $('#panelDone').hidden = true;
    $('#panelFail').hidden = true;
    const bar = $('#bar'), txt = $('#progressText');
    bar.style.width = '4%';
    const id = lastId || (lastId = newId());
    try {
      if (!C.TG_TOKEN || !C.TG_CHAT) return fail(id, true);
      txt.textContent = 'نجهّز الصور';
      const keys = ['child1', 'child2'].concat(parentsOn() ? ['father', 'mother'] : []).filter(k => files[k]);
      const fd = new FormData();
      fd.append('chat_id', C.TG_CHAT);
      const media = [];
      for (const [i, k] of keys.entries()) {
        const blob = await shrink(files[k]);
        fd.append('f' + i, blob, `${id}-${k}.jpg`);
        media.push({ type: 'document', media: 'attach://f' + i, caption: `${LABELS[k]} — ${id}` });
        bar.style.width = (4 + 16 * (i + 1) / keys.length) + '%';
      }
      fd.append('media', JSON.stringify(media));

      txt.textContent = 'نُرسل بيانات الطلب';
      const r = await fetch(tg('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: C.TG_CHAT, text: orderText(id), parse_mode: 'HTML' })
      }).then(r => r.json());
      if (!r.ok) throw r;

      txt.textContent = 'نرفع الصور';
      await upload(fd, p => {
        bar.style.width = (25 + 73 * p) + '%';
        txt.textContent = `نرفع الصور ${toAr(Math.round(p * 100))}٪`;
      });
      bar.style.width = '100%';
      done(id);
    } catch (e) {
      console.error(e);
      fail(id);
    }
  }

  function done(id) {
    $('#panelSending').hidden = true;
    $('#panelDone').hidden = false;
    $('#orderId').textContent = id;
    const pay = $('#payBtn');
    if (C.PAY_URL) { pay.href = C.PAY_URL; pay.hidden = false; $('#payNote').hidden = true; }
    else { pay.hidden = true; $('#payNote').hidden = false; }
  }

  // viaWa: لا قناة استقبال بعد — يكتمل الطلب على واتساب رواق وتُرفق الصور هناك
  function fail(id, viaWa = false) {
    $('#panelSending').hidden = true;
    $('#panelFail').hidden = false;
    $('#failTitle').textContent = viaWa ? 'خطوةٌ أخيرة' : 'تعذّر الإرسال';
    $('#failText').textContent = viaWa
      ? `أرسل طلبك (${id}) على واتساب رواق، وأرفق معه الصور التي اخترتها.`
      : 'تحقّق من الإنترنت ثم أعد المحاولة، أو راسلنا على الواتساب.';
    $('#retryBtn').hidden = viaWa;
    $('#waBtn').textContent = viaWa ? 'أكمل الطلب على الواتساب' : 'راسلنا على الواتساب';
    $('#waBtn').classList.toggle('btn-lantern', viaWa);
    $('#waBtn').classList.toggle('btn-ghost', !viaWa);
    const parents = parentsOn() ? [files.father && 'الأب', files.mother && 'الأم'].filter(Boolean).join(' و') : 'لا';
    const msg = `السلام عليكم، أرغب بطلب قصة مخصّصة\nرقم الطلب: ${id}\nالقصة: ${story().title}\nالبطل: ${gender() === 'girl' ? 'بنت' : 'ولد'}\nالاسم: ${nameVal()}\nصور الوالدين: ${parents}\nواتساب: ${phoneVal()}\nموافقة وليّ الأمر على الشروط: نعم — ${consentTime()}\n\n(أرفق الصور بعد هذه الرسالة)`;
    $('#waBtn').href = `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  $('#retryBtn').addEventListener('click', send);
  $('#backBtn').addEventListener('click', () => { $('#overlay').hidden = true; });

  form.addEventListener('submit', e => {
    e.preventDefault();
    tried = true;
    refresh();
    const firstBad = blocks.find((b, i) => !checks[i]());
    if (firstBad) { firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    send();
  });

  refresh();
})();
