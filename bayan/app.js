// ═══════════ بيان للألعاب التعليمية — منطق صفحة الطلب ═══════════
(() => {
  const C = BY_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#form');
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const toAr = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);
  const toEn = s => s.replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = n => `${toAr(n)} ${C.CURRENCY}`;

  const ICONS = {
    ar: '<span class="glyph">ض</span>',
    en: '<span class="glyph ltr">Aa</span>',
    sci: '<svg viewBox="0 0 32 32"><path d="M12 4h8M13.5 4v8L6.8 24.2A2.5 2.5 0 0 0 9 28h14a2.5 2.5 0 0 0 2.2-3.8L18.5 12V4"/><path d="M9.5 19h13"/><circle cx="14" cy="23" r="1.3" class="fill"/><circle cx="19" cy="22" r="1" class="fill"/></svg>',
    math: '<svg viewBox="0 0 32 32"><path d="M9 5v8M5 9h8M19 9h8M6 20l6 6M12 20l-6 6M19 21h8M19 25h8"/></svg>',
    soc: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c-3.5 3-5 7-5 11s1.5 8 5 11c3.5-3 5-7 5-11s-1.5-8-5-11z"/></svg>',
    isl: '<svg viewBox="0 0 32 32"><path d="M6 27h20M8 27V17a8 8 0 0 1 16 0v10"/><path d="M16 9V5"/><path d="M17.8 3.6a2.2 2.2 0 1 0 0 3.2 2.8 2.8 0 1 1 0-3.2z" class="fill"/><path d="M13 27v-5a3 3 0 0 1 6 0v5"/></svg>'
  };

  // ── المستويات ──
  const levelsEl = $('#levels');
  C.LEVELS.forEach(l => {
    const stars = [1, 2, 3].map(i => `<i class="${i <= l.stars ? '' : 'off'}"></i>`).join('');
    levelsEl.insertAdjacentHTML('beforeend', `
      <label class="level">
        <input type="radio" name="level" value="${l.id}" required>
        <span class="lv-face">
          <span class="lv-stars">${stars}</span>
          <span class="lv-num">${l.short}</span>
          <span class="lv-name">${l.name}</span>
        </span>
      </label>`);
  });
  const level = () => C.LEVELS.find(l => l.id === form.querySelector('[name=level]:checked')?.value);

  // ── المواد ──
  const subjEl = $('#subjects');
  C.SUBJECTS.forEach(s => {
    subjEl.insertAdjacentHTML('beforeend', `
      <label class="subj" style="--tint:${s.tint}">
        <input type="checkbox" name="subject" value="${s.id}">
        <span class="sj-ico">${ICONS[s.icon] || ''}</span>
        <span class="sj-name">${s.name}</span>
        <span class="sj-price">${money(C.PRICE_EACH)}</span>
        <span class="sj-check" aria-hidden="true"></span>
      </label>`);
  });
  const subjBoxes = $$('[name=subject]');
  const chosen = () => C.SUBJECTS.filter(s => subjBoxes.find(b => b.value === s.id).checked);
  const total = () => { const n = chosen().length; return n === C.SUBJECTS.length ? C.PRICE_ALL : n * C.PRICE_EACH; };

  const allToggle = $('#allToggle');
  allToggle.addEventListener('change', () => { subjBoxes.forEach(b => b.checked = allToggle.checked); refresh(); });
  subjBoxes.forEach(b => b.addEventListener('change', refresh));
  $$('[name=level]').forEach(r => r.addEventListener('change', refresh));

  // ── الاسم ──
  const nameVal = () => $('#childName').value.replace(/\s+/g, ' ').trim();
  const nameOk = () => nameVal().length >= 2;
  const paintName = () => {
    const v = nameVal();
    $$('.js-name').forEach(el => el.textContent = v || (el.closest('.device') ? 'يوسف' : 'بطلنا'));
  };
  $('#childName').addEventListener('input', () => { paintName(); refresh(); });

  // ── الهاتف ──
  const phoneVal = () => toEn($('#phone').value).replace(/[^\d+]/g, '');
  const phoneOk = () => { const d = phoneVal().replace(/\D/g, ''); return d.length >= 8 && d.length <= 15; };
  $('#phone').addEventListener('input', refresh);

  // ── الموافقة ──
  const agreed = () => $('#agree').checked;
  $('#agree').addEventListener('change', refresh);

  // ── التحقق ──
  const blocks = $$('.block');
  const checks = [() => !!level(), () => chosen().length > 0, nameOk, phoneOk, agreed];
  let tried = false;
  function refresh() {
    const n = chosen().length;
    allToggle.checked = n === C.SUBJECTS.length;
    $('#bundle').classList.toggle('on', allToggle.checked);
    $('#nudge').hidden = n !== C.SUBJECTS.length - 1;
    blocks.forEach((b, i) => {
      const ok = checks[i]();
      b.classList.toggle('ok', ok);
      if (tried) {
        b.classList.toggle('bad', !ok);
        $$('.err', b).forEach(e => e.classList.toggle('on', !ok));
      }
    });
    renderSum();
  }

  function priceHtml() {
    const n = chosen().length;
    const full = n * C.PRICE_EACH;
    return full !== total() ? `<s>${money(full)}</s> ${money(total())}` : money(total());
  }

  function renderSum() {
    const n = chosen().length;
    const sum = $('#sum');
    const any = level() || n || nameVal();
    sum.classList.toggle('on', !!any);
    const dock = $('#dock');
    dock.classList.toggle('on', n > 0);
    $('#dCount').textContent = n ? (n === C.SUBJECTS.length ? 'الباقة الكاملة' : `${toAr(n)} ${n === 1 ? 'مادة' : n === 2 ? 'مادتان' : 'مواد'}`) : '';
    $('#dTotal').innerHTML = n ? priceHtml() : '';
    if (!any) return;
    const rows = [
      ['المستوى', level() ? level().name : '—'],
      ['المواد', n ? chosen().map(s => s.name).join('، ') : '—'],
      ['الاسم', nameVal() ? esc(nameVal()) : '—']
    ];
    sum.innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('')
      + `<div class="row tot"><span>المجموع</span><b>${n ? priceHtml() : '—'}</b></div>`;
  }

  // يختفي الشريط الثابت حين يظهر زرّ الإرسال
  const io = new IntersectionObserver(es => es.forEach(e => $('#dock').classList.toggle('hide', e.isIntersecting)));
  io.observe($('.submit'));
  io.observe($('.hero'));

  function newId() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let r = '';
    for (let i = 0; i < 4; i++) r += abc[Math.floor(Math.random() * abc.length)];
    return `BY-${ymd}-${r}`;
  }

  function payLink(id) {
    const amt = total();
    const url = (C.PAY_LINKS && C.PAY_LINKS[amt]) || C.PAY_URL || '';
    return url.replace('{amount}', amt).replace('{id}', encodeURIComponent(id));
  }

  function orderLines(id) {
    return [
      `رقم الطلب: ${id}`,
      `المستوى: ${level().name}`,
      `المواد: ${chosen().map(s => s.name).join('، ')}`,
      `المجموع: ${total()} ${C.CURRENCY}`,
      `اسم الطفل: ${nameVal()}`,
      `واتساب: ${phoneVal()}`,
      `موافقة وليّ الأمر على الشروط: نعم — ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuwait' })}`
    ];
  }

  let lastId = null;
  async function send() {
    $('#overlay').hidden = false;
    $('#panelSending').hidden = false;
    $('#panelDone').hidden = true;
    $('#panelFail').hidden = true;
    const id = lastId || (lastId = newId());
    if (!C.TG_TOKEN || !C.TG_CHAT) return C.WHATSAPP ? fail(id, true) : done(id);
    try {
      const text = `🎮 <b>طلب لعبة تعليمية — بيان</b>\n\n` + orderLines(id).map(esc).join('\n');
      const r = await fetch(`https://api.telegram.org/bot${C.TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: C.TG_CHAT, text, parse_mode: 'HTML' })
      }).then(r => r.json());
      if (!r.ok) throw r;
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
    $('#doneTotal').innerHTML = `المبلغ: <b>${priceHtml()}</b>`;
    const pay = $('#payBtn'), link = payLink(id);
    pay.hidden = !link;
    if (link) pay.href = link;
    $('#payNote').hidden = !!link;
  }

  // viaWa: لا قناة استقبال بعد — يكتمل الطلب على واتساب GoCode
  function fail(id, viaWa = false) {
    $('#panelSending').hidden = true;
    $('#panelFail').hidden = false;
    $('#failTitle').textContent = viaWa ? 'خطوةٌ أخيرة' : 'تعذّر الإرسال';
    $('#failText').textContent = viaWa
      ? `أرسل طلبك (${id}) على الواتساب، ونردّ عليك برابط الدفع.`
      : 'تحقّق من الإنترنت ثم أعد المحاولة، أو راسلنا على الواتساب.';
    $('#retryBtn').hidden = viaWa;
    const wa = $('#waBtn');
    wa.hidden = !C.WHATSAPP;
    wa.textContent = viaWa ? 'أكمل الطلب على الواتساب' : 'راسلنا على الواتساب';
    wa.classList.toggle('btn-go', viaWa);
    wa.classList.toggle('btn-ghost', !viaWa);
    const msg = ['السلام عليكم، أرغب بطلب لعبة تعليمية من بيان', ...orderLines(id)].join('\n');
    wa.href = `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg)}`;
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

  // ── التذييل ──
  const links = [];
  if (C.WHATSAPP) links.push(`<a href="https://wa.me/${C.WHATSAPP}" target="_blank" rel="noopener"><span class="ltr">+${C.WHATSAPP}</span></a>`);
  if (C.INSTAGRAM) links.push(`<a href="https://instagram.com/${C.INSTAGRAM}" target="_blank" rel="noopener"><span class="ltr">@${C.INSTAGRAM}</span></a>`);
  $('#footLinks').innerHTML = links.join('');

  paintName();
  refresh();
})();
