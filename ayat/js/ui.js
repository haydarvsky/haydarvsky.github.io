// الواجهة: بطاقة المحطة (HTML للسبورة واللوحي، ولوحة داخل المشهد للنظارة والكرتون)، الجواز، الإشعارات
(function () {
const UI = RX.UI = {};
const U = RX.U, C = U.C;
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
UI.spec = null; UI.tab = "land";

UI.immersive = () => RX.E.mode === "xr" || RX.E.mode === "cardboard";

// ======== عرض البطاقة ========
UI.show = function (spec) {
  UI.spec = spec; if (spec.tab) UI.tab = spec.tab;
  renderDOM(); render3D();
};
UI.refresh = function () { if (UI.spec) { renderDOM(); render3D(); } };
UI.hide = function () { UI.spec = null; $("#card").classList.remove("on"); if (UI.p3) UI.p3.visible = false; };

// كتلة الآية: بالرسم العثماني دائماً، وتحتها ترجمة المعاني في النسخة الإنجليزية
function verseHTML(v) {
  const V = RX.app.assets.verses, en = U.lang() === "en";
  const ar = v.keys.map(k => `${V[k].ar} <span class="vn">${U.ayah(k)}</span>`).join(" ");
  let h = `<div class="verse"><p class="qv" dir="rtl" lang="ar">﴿${ar}﴾</p><div class="vref"><span>${esc(v.ref)}</span>`;
  if (v.onPlay) h += `<button class="recite ${v.playing ? "on" : ""}" data-recite="1">${v.playing ? "◼ " + U.T().reciting : "▶ " + U.T().recite}</button>`;
  h += `</div>`;
  if (en) h += `<p class="ven">${v.keys.map(k => esc(V[k].en)).join(" ")}</p>`;
  return h + `</div>`;
}
function stepsHTML(steps) {
  return `<ol class="steps">${steps.map((s, i) => `<li class="${s.done ? "done" : ""}${s.active ? " act" : ""}"><i>${s.done ? "✓" : U.num(i + 1)}</i><span>${esc(s.label)}</span></li>`).join("")}</ol>`;
}
function renderDOM() {
  const s = UI.spec, card = $("#card"); if (!s) return;
  const T = U.T();
  let h = `<div class="c-head">`;
  if (s.kicker) h += `<div class="kick">${esc(s.kicker)}</div>`;
  h += `<h2>${esc(s.title)}</h2>`;
  if (s.sub) h += `<div class="sub">${esc(s.sub)}</div>`;
  if (s.coords) h += `<div class="coords" dir="ltr">${esc(s.coords)}</div>`;
  h += `</div>`;
  if (s.tabs) {
    h += `<div class="seg"><button data-tab="land" class="${UI.tab === "land" ? "on" : ""}"><b class="dl"></b>${T.tabVerse}</button><button data-tab="trace" class="${UI.tab === "trace" ? "on" : ""}"><b class="dt"></b>${T.tabSci}${s.sciLocked ? " 🔒" : ""}</button></div>`;
    if (UI.tab === "land") {
      if (s.verse) h += verseHTML(s.verse);
      if (s.tafsir) h += `<div class="tafsir"><b>${T.tafsir}</b><p>${esc(s.tafsir)}</p></div>`;
      if (s.body) h += `<p class="body">${esc(s.body)}</p>`;
    } else {
      h += s.sciLocked ? `<p class="locked">${esc(T.sciLocked)}</p>` : `<div class="sci"><p>${esc(s.sci)}</p><small>${esc(s.sciSrc || "")}</small></div>`;
    }
  } else { if (s.verse) h += verseHTML(s.verse); if (s.body) h += `<p class="body">${esc(s.body)}</p>`; }
  if (s.place) h += `<p class="place">${esc(s.place)}</p>`;
  if (s.quote) h += `<blockquote>${esc(s.quote)}</blockquote>`;
  if (s.info) h += `<div class="info"><b>${esc(s.info.title)}</b><span>${esc(s.info.text)}</span></div>`;
  if (s.mission) h += `<div class="mission"><div class="mh">${T.mission}</div><p>${esc(s.mission)}</p>${s.steps ? stepsHTML(s.steps) : ""}</div>`;
  if (s.gallery) {
    const g = s.gallery;
    h += `<div class="gal"><div class="qh">${esc(g.q)}</div><div class="gal-row">${g.items.map((it, i) => `<button class="gi ${it.state || ""}" data-gal="${i}"><img src="${it.img}" alt=""><span>${esc(it.label)}</span></button>`).join("")}</div></div>`;
  }
  if (s.question) {
    const q = s.question;
    h += `<div class="q"><div class="qh">${esc(q.label || T.question)}</div><p class="qt">${esc(q.q)}</p><div class="choices">`;
    q.choices.forEach((c, i) => {
      const st = q.state && q.state[i];
      h += `<button class="ch ${st || ""}" data-ch="${i}"><i>${"أبجد"[i] && U.lang() === "ar" ? "أبجد"[i] : "ABCD"[i]}</i><span>${esc(c[0])}</span></button>`;
      if (st && q.why && q.why[i]) h += `<div class="why ${st}">${esc(q.why[i])}</div>`;
    });
    h += `</div></div>`;
  }
  if (s.multi) {
    const m = s.multi;
    h += `<div class="q"><div class="qh">${esc(m.label || T.bookQ)}</div><p class="qt">${esc(m.q)}</p><div class="choices multi">`;
    m.items.forEach((c, i) => {
      const sel = m.sel[i], res = m.result ? (c[1] ? (sel ? "ok" : "miss") : (sel ? "bad" : "")) : "";
      h += `<button class="ch ${sel ? "sel" : ""} ${res}" data-mu="${i}"><i>${sel ? "✓" : ""}</i><span>${esc(c[0])}</span></button>`;
    });
    h += `</div>${m.msg ? `<div class="why ${m.ok ? "ok" : "bad"}">${esc(m.msg)}</div>` : ""}</div>`;
  }
  if (s.actions && s.actions.length) {
    h += `<div class="acts">`;
    s.actions.forEach((a, i) => { h += `<button class="btn ${a.primary ? "pri" : ""} ${a.disabled ? "dis" : ""}" data-act="${i}">${esc(a.label)}</button>`; });
    h += `</div>`;
  }
  if (s.foot !== false) {
    h += `<div class="c-foot">`;
    if (s.hint) h += `<button class="lnk" data-foot="hint">${T.guide}</button>`;
    if (s.real) h += `<a class="lnk" href="${s.real}" target="_blank" rel="noopener">${T.real} ↗</a>`;
    if (s.note) h += `<span class="note">${esc(s.note)}</span>`;
    h += `</div>`;
  }
  if (UI.hintOpen && s.hint) h += `<div class="hint"><b>${T.guideTitle}</b><p>${esc(s.hint)}</p><small>${T.guideNote}</small><a href="https://gemini.google.com/" target="_blank" rel="noopener">${T.guideLink} ↗</a></div>`;
  card.innerHTML = h;
  card.classList.toggle("on", !UI.immersive());
  card.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { UI.tab = b.dataset.tab; RX.A.sfx("click"); s.onTab && s.onTab(UI.tab); UI.refresh(); });
  card.querySelectorAll("[data-ch]").forEach(b => b.onclick = () => choose(+b.dataset.ch));
  card.querySelectorAll("[data-mu]").forEach(b => b.onclick = () => toggleMulti(+b.dataset.mu));
  card.querySelectorAll("[data-act]").forEach(b => b.onclick = () => act(+b.dataset.act));
  card.querySelectorAll("[data-gal]").forEach(b => b.onclick = () => { RX.A.sfx("click"); s.gallery.onPick(+b.dataset.gal); });
  card.querySelectorAll("[data-recite]").forEach(b => b.onclick = () => { s.verse.onPlay(); });
  const hb = card.querySelector("[data-foot=hint]"); if (hb) hb.onclick = () => { UI.hintOpen = !UI.hintOpen; RX.A.sfx("click"); UI.refresh(); };
}
function act(i) { const a = UI.spec.actions[i]; if (!a || a.disabled) return; RX.A.sfx("click"); a.onClick && a.onClick(); }
function choose(i) {
  const q = UI.spec.question; if (!q || q.solved) return;
  q.state = q.state || []; q.why = q.why || [];
  const c = q.choices[i];
  if (c[1]) { q.state[i] = "ok"; q.why[i] = c[2]; q.solved = true; RX.A.sfx("ok"); UI.refresh(); q.onCorrect && setTimeout(q.onCorrect, 900); }
  else { q.state[i] = "bad"; q.why[i] = c[2]; RX.A.sfx("bad"); q.wrongs = (q.wrongs || 0) + 1; UI.refresh(); }
}
function toggleMulti(i) {
  const m = UI.spec.multi; if (m.done) return; m.sel[i] = !m.sel[i]; m.result = false; m.msg = null; RX.A.sfx("click"); UI.refresh();
}
UI.checkMulti = function () {
  const m = UI.spec.multi; m.result = true;
  const ok = m.items.every((c, i) => !!c[1] === !!m.sel[i]);
  m.ok = ok; m.msg = ok ? m.okMsg : m.badMsg; RX.A.sfx(ok ? "ok" : "bad");
  if (ok) { m.done = true; UI.refresh(); m.onCorrect && setTimeout(m.onCorrect, 900); } else UI.refresh();
};

// ======== اللوحة داخل المشهد (النظارة والكرتون) ========
const PW = 1000;            // عرض اللوحة بالبكسل
let cv3 = null, ctx3 = null, tex3 = null, regions = [], hoverRegion = null;
UI.panelWidthM = 1.05;
function ensure3D() {
  if (UI.p3) return;
  cv3 = document.createElement("canvas"); cv3.width = PW; cv3.height = 1400; ctx3 = cv3.getContext("2d");
  tex3 = new THREE.CanvasTexture(cv3); tex3.anisotropy = 8; tex3.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex3, transparent: true, side: THREE.DoubleSide, depthTest: true, fog: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.renderOrder = 50;
  UI.p3 = m; m.visible = false;
}
UI.attach3D = function (scene) {
  ensure3D();
  if (UI.p3.parent) UI.p3.parent.remove(UI.p3);
  scene.root.add(UI.p3);
  RX.E.removeInteractive(scene, UI.p3);
  RX.E.addTo(scene, UI.p3, {
    regionAt: h => { const r = regionAtUV(h.uv); return r ? r.id : null; },
    onSelect: h => { const r = regionAtUV(h.uv); if (r) r.fn(); },
    onHover: (on, h) => { hoverRegion = on && h ? h.region : null; render3D(); },
    onHoverMove: h => { if (h.region !== hoverRegion) { hoverRegion = h.region; render3D(); } }
  });
  UI.placePanel(scene);
};
function regionAtUV(uv) {
  if (!uv) return null;
  const x = uv.x * PW, y = (1 - uv.y) * UI.p3H;
  return regions.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;
}
UI.placePanel = function (scene, yaw) {
  if (!UI.p3) return;
  const v = scene.view, E = RX.E;
  const ay = yaw != null ? yaw : (v.panelYaw != null ? v.panelYaw : v.yaw + (U.lang() === "ar" ? -0.62 : 0.62));
  const d = v.panelDist || 1.25;
  const base = E.mode === "xr" ? new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z) : v.pos;
  UI.p3.position.set(base.x - Math.sin(ay) * d, base.y + (v.panelY || 1.38), base.z - Math.cos(ay) * d);
  UI.p3.rotation.set(-0.12, ay, 0, "YXZ");
};
function render3D() {
  if (!UI.p3) return;
  const s = UI.spec; UI.p3.visible = !!s && UI.immersive();
  if (!UI.p3.visible) return;
  const T = U.T(), ar = U.lang() === "ar";
  const ctx = ctx3; regions = [];
  // قياس ثم رسم
  const pad = 46, w = PW - pad * 2;
  const R = ar ? PW - pad : pad;
  ctx.textAlign = ar ? "right" : "left"; ctx.direction = ar ? "rtl" : "ltr";
  const ops = []; let y = pad;
  const text = (str, font, color, lh, maxW) => {
    ctx.font = font; const ls = U.wrap(ctx, str, maxW || w);
    ls.forEach(l => { ops.push({ t: "text", s: l, font, color, x: R, y: y + lh * 0.8 }); y += lh; });
  };
  const button = (id, label, fn, o = {}) => {
    ctx.font = `700 34px ${U.FONT}`; const ls = U.wrap(ctx, label, (o.w || w) - 90);
    const hgt = Math.max(70, ls.length * 42 + 30), bw = o.w || w;
    const x = o.x != null ? o.x : pad;
    regions.push({ id, x, y, w: bw, h: hgt, fn });
    ops.push({ t: "btn", id, x, y, w: bw, h: hgt, ls, o });
    if (!o.inline) y += hgt + 14; return hgt;
  };
  if (s.kicker) text(s.kicker, `700 30px ${U.FONT}`, C.red, 42);
  text(s.title, `800 64px ${U.FONT}`, C.ink, 76);
  if (s.sub) text(s.sub, `600 32px ${U.FONT}`, C.mute, 44);
  y += 10;
  if (s.tabs) {
    const tw = (w - 16) / 2; const y0 = y;
    const t1 = { id: "tab-land", label: T.tabVerse, on: UI.tab === "land", c: C.gold }, t2 = { id: "tab-trace", label: T.tabSci, on: UI.tab === "trace", c: C.green };
    [t1, t2].forEach((t, i) => {
      const x = ar ? PW - pad - tw - i * (tw + 16) : pad + i * (tw + 16);
      regions.push({ id: t.id, x, y: y0, w: tw, h: 66, fn: () => { UI.tab = i ? "trace" : "land"; s.onTab && s.onTab(UI.tab); UI.refresh(); } });
      ops.push({ t: "tab", x, y: y0, w: tw, h: 66, label: t.label, on: t.on, c: t.c, id: t.id });
    });
    y += 84;
    if (UI.tab === "land") {
      if (s.verse) verse3D(s.verse);
      if (s.tafsir) { text(T.tafsir, `800 26px ${U.FONT}`, C.gold, 38); text(s.tafsir, `600 30px ${U.FONT}`, C.ink, 44); y += 6; }
      if (s.body) text(s.body, `500 32px ${U.FONT}`, C.ink, 48);
    } else if (s.sciLocked) text(T.sciLocked, `700 32px ${U.FONT}`, C.mute, 46);
    else { text(s.sci, `600 32px ${U.FONT}`, C.ink, 48); if (s.sciSrc) text(s.sciSrc, `700 26px ${U.FONT}`, C.green, 38); }
  } else { if (s.verse) verse3D(s.verse); if (s.body) text(s.body, `500 34px ${U.FONT}`, C.ink, 50); }
  function verse3D(v) {
    const V = RX.app.assets.verses; const y0 = y; y += 16;
    const str = "﴿" + v.keys.map(k => V[k].ar + " " + U.ayah(k)).join(" ") + "﴾";
    ctx.save(); ctx.direction = "rtl"; ctx.textAlign = "right"; ctx.font = `44px ${U.QFONT}`;
    U.wrap(ctx, str, w - 50).forEach(l => { ops.push({ t: "text", s: l, font: `44px ${U.QFONT}`, color: "#1B2B44", x: PW - pad - 25, y: y + 58, rtl: true }); y += 84; });
    ctx.restore(); y += 4;
    text(v.ref, `700 26px ${U.FONT}`, C.gold, 36, w - 40);
    if (U.lang() === "en") text(v.keys.map(k => V[k].en).join(" "), `italic 500 28px ${U.FONT}`, C.mute, 40, w - 40);
    ops.unshift({ t: "box", x: pad, y: y0, w, h: y - y0 + 10, c: "rgba(196,154,58,0.10)", b: C.gold });
    y += 18;
    if (v.onPlay) button("recite", (v.playing ? "◼ " + T.reciting : "▶ " + T.recite), () => v.onPlay(), { ghost: true });
  }
  if (s.place) { y += 6; text(s.place, `600 30px ${U.FONT}`, C.brown, 44); }
  if (s.quote) { y += 6; text(s.quote, `600 32px ${U.FONT}`, C.green, 46); }
  if (s.info) { y += 10; const y0 = y; y += 16; text(s.info.title, `800 34px ${U.FONT}`, C.green, 46, w - 40); text(s.info.text, `500 30px ${U.FONT}`, C.ink, 44, w - 40); ops.push({ t: "box", x: pad, y: y0, w, h: y - y0 + 12, c: "rgba(46,125,85,0.10)", b: C.green }); y += 20; }
  if (s.mission) {
    y += 14; const y0 = y; y += 18;
    text(T.mission, `800 30px ${U.FONT}`, C.red, 42, w - 40);
    text(s.mission, `600 32px ${U.FONT}`, C.ink, 46, w - 40);
    (s.steps || []).forEach((st, i) => text((st.done ? "✓  " : U.num(i + 1) + ".  ") + st.label, `${st.done ? 700 : 500} 30px ${U.FONT}`, st.done ? C.green : C.mute, 44, w - 40));
    ops.unshift({ t: "box", x: pad, y: y0, w, h: y - y0 + 14, c: "rgba(179,49,42,0.06)", b: "rgba(179,49,42,0.35)" });
    y += 30;
  }
  if (s.gallery) {
    const g = s.gallery; text(g.q, `800 32px ${U.FONT}`, C.red, 44); y += 6;
    const n = g.items.length, gw = (w - 20 * (n - 1)) / n, gh = gw + 56;
    g.items.forEach((it, i) => { const x = ar ? PW - pad - (i + 1) * gw - i * 20 : pad + i * (gw + 20);
      regions.push({ id: "gal" + i, x, y, w: gw, h: gh, fn: () => g.onPick(i) }); ops.push({ t: "gal", x, y, w: gw, h: gh, src: it.img, label: it.label, state: it.state, id: "gal" + i }); });
    y += gh + 18;
  }
  if (s.question) {
    const q = s.question;
    text(q.label || T.question, `800 30px ${U.FONT}`, C.red, 42);
    text(q.q, `700 36px ${U.FONT}`, C.ink, 50); y += 8;
    q.choices.forEach((c, i) => {
      const st = q.state && q.state[i];
      button("ch" + i, c[0], () => choose(i), { state: st });
      if (st && q.why && q.why[i]) text(q.why[i], `600 28px ${U.FONT}`, st === "ok" ? C.green : C.bad, 40);
    });
  }
  if (s.multi) {
    const m = s.multi;
    text(m.label || T.bookQ, `800 30px ${U.FONT}`, C.red, 42);
    text(m.q, `700 34px ${U.FONT}`, C.ink, 48); y += 6;
    m.items.forEach((c, i) => {
      const sel = m.sel[i]; const res = m.result ? (c[1] ? (sel ? "ok" : "miss") : (sel ? "bad" : "")) : "";
      button("mu" + i, (sel ? "✓ " : "") + c[0], () => toggleMulti(i), { state: res || (sel ? "sel" : "") });
    });
    if (m.msg) text(m.msg, `700 28px ${U.FONT}`, m.ok ? C.green : C.red, 40);
  }
  (s.actions || []).forEach((a, i) => { if (!a.disabled) button("a" + i, a.label, () => act(i), { primary: a.primary }); });
  if (s.hint) {
    const bw = (w - 16) / 2; const y0 = y;
    button("hint", T.guide, () => { UI.hintOpen = !UI.hintOpen; UI.refresh(); }, { w: bw, x: ar ? PW - pad - bw : pad, inline: true, ghost: true });
    y = y0 + 84;
    if (UI.hintOpen) { text(s.hint, `600 30px ${U.FONT}`, C.blue, 44); text(T.guideNote, `500 24px ${U.FONT}`, C.mute, 34); }
  }
  y += pad * 0.6;
  const H = Math.ceil(y);
  if (cv3.height !== H) { cv3.height = H; }
  UI.p3H = H;
  // رسم فعلي
  ctx.clearRect(0, 0, PW, H);
  ctx.fillStyle = "rgba(255,252,244,0.97)"; U.rrect(ctx, 4, 4, PW - 8, H - 8, 34); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = C.brown; ctx.stroke();
  ctx.fillStyle = C.red; ctx.fillRect(ar ? PW - 16 : 8, 40, 8, 120);
  ctx.textAlign = ar ? "right" : "left"; ctx.direction = ar ? "rtl" : "ltr";
  for (const o of ops) {
    if (o.t === "box") { ctx.fillStyle = o.c; U.rrect(ctx, o.x, o.y, o.w, o.h, 18); ctx.fill(); ctx.strokeStyle = o.b; ctx.lineWidth = 2; ctx.stroke(); }
  }
  for (const o of ops) {
    if (o.t === "text") { ctx.font = o.font; ctx.fillStyle = o.color; const r = o.rtl || ar; ctx.direction = r ? "rtl" : "ltr"; ctx.textAlign = r ? "right" : "left"; ctx.fillText(o.s, o.x, o.y); ctx.direction = ar ? "rtl" : "ltr"; }
    else if (o.t === "tab") {
      const hov = hoverRegion === o.id;
      ctx.fillStyle = o.on ? C.ink : (hov ? C.sand2 : C.sand); U.rrect(ctx, o.x, o.y, o.w, o.h, 33); ctx.fill();
      ctx.fillStyle = o.on ? "#fff" : C.ink; ctx.font = `800 34px ${U.FONT}`; ctx.textAlign = "center"; ctx.fillText(o.label, o.x + o.w / 2 + (ar ? -14 : 14), o.y + 45);
      ctx.fillStyle = o.c; ctx.beginPath(); ctx.arc(ar ? o.x + o.w / 2 + ctx.measureText(o.label).width / 2 + 4 : o.x + o.w / 2 - ctx.measureText(o.label).width / 2 - 4, o.y + 34, 9, 0, 7); ctx.fill();
    } else if (o.t === "gal") {
      const hov = hoverRegion === o.id; ctx.fillStyle = o.state === "bad" ? "rgba(166,54,43,0.12)" : "#F3EBDC"; U.rrect(ctx, o.x, o.y, o.w, o.h, 20); ctx.fill();
      ctx.lineWidth = hov ? 6 : 2; ctx.strokeStyle = hov ? C.red : C.sand2; ctx.stroke();
      const im = imgCache(o.src); if (im) ctx.drawImage(im, o.x + 10, o.y + 10, o.w - 20, o.w - 20);
      ctx.fillStyle = C.ink; ctx.font = `800 34px ${U.FONT}`; ctx.textAlign = "center"; ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h - 16);
    } else if (o.t === "btn") {
      const hov = hoverRegion === o.id, st = o.o.state;
      let bg = o.o.primary ? C.red : (o.o.ghost ? "rgba(44,110,143,0.10)" : "#F3EBDC"), fg = o.o.primary ? "#fff" : (o.o.ghost ? C.blue : C.ink);
      if (st === "ok") { bg = "rgba(46,125,85,0.16)"; fg = C.green; } if (st === "bad") { bg = "rgba(166,54,43,0.12)"; fg = C.bad; }
      if (st === "sel") { bg = "#E9DCC2"; } if (st === "miss") { bg = "rgba(200,150,62,0.25)"; }
      ctx.fillStyle = bg; U.rrect(ctx, o.x, o.y, o.w, o.h, 22); ctx.fill();
      if (hov) { ctx.lineWidth = 5; ctx.strokeStyle = o.o.primary ? C.ink : C.red; ctx.stroke(); }
      ctx.fillStyle = fg; ctx.font = `700 34px ${U.FONT}`; ctx.textAlign = ar ? "right" : "left";
      o.ls.forEach((l, k) => ctx.fillText(l, ar ? o.x + o.w - 30 : o.x + 30, o.y + 46 + k * 42 + (o.h - 30 - o.ls.length * 42) / 2));
    }
  }
  tex3.needsUpdate = true;
  const mw = UI.panelWidthM; UI.p3.scale.set(mw, mw * H / PW, 1);
}
UI.render3D = render3D;
const _imgs = {};
function imgCache(src) { if (_imgs[src]) return _imgs[src].ok ? _imgs[src].im : null; const im = new Image(); _imgs[src] = { im, ok: false }; im.onload = () => { _imgs[src].ok = true; render3D(); }; im.src = src; return null; }

// ======== الإشعارات ========
UI.toast = function (title, text, kind) {
  const t = el("div", "toast " + (kind || ""), `<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ""}`);
  while ($("#toasts").children.length > 2) $("#toasts").firstChild.remove();
  $("#toasts").appendChild(t); setTimeout(() => t.classList.add("on"), 20);
  setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 500); }, 3600);
  if (UI.immersive() && RX.E.scene) toast3D(title, text, kind);
};
function toast3D(title, text, kind) {
  const sc = RX.E.scene; const sp = U.label(title, { sub: text, size: 46, height: 0.16, bg: kind === "bad" ? "rgba(255,240,236,0.96)" : "rgba(240,250,244,0.97)", stroke: kind === "bad" ? C.bad : C.green, depthTest: false, renderOrder: 80 });
  const yaw = RX.E.headYaw(), p = RX.E.headPos();
  sp.position.set(p.x - Math.sin(yaw) * 1.4, p.y + 0.32, p.z - Math.cos(yaw) * 1.4);
  sc.root.add(sp);
  U.tween(3200, k => { sp.material.opacity = k < 0.1 ? k * 10 : k > 0.85 ? (1 - k) / 0.15 : 1; sp.position.y += 0.0004; }, k => k).then(() => sc.root.remove(sp));
}

// ======== الختم ========
UI.stampSVG = function (id, opts = {}) {
  const T = U.T(), s = T.stations[id], n = RX.ORDER.indexOf(id) + 1;
  const col = s.wing === "anfus" ? C.anfus : C.afaq;
  const rot = opts.rot != null ? opts.rot : [-9, 6, -4, 8, -6][n - 1];
  return `<svg viewBox="0 0 200 200" class="stamp" style="transform:rotate(${rot}deg)">
   <defs><filter id="ink${id}"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${n * 7}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.25"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
   <g filter="url(#ink${id})" fill="none" stroke="${col}">
    <circle cx="100" cy="100" r="92" stroke-width="7"/><circle cx="100" cy="100" r="78" stroke-width="2.5"/>
    <text x="100" y="62" text-anchor="middle" fill="${col}" stroke="none" font-family="SS, Sakkal Saad, serif" font-weight="800" font-size="30">${U.num(n)}</text>
    <text x="100" y="108" text-anchor="middle" fill="${col}" stroke="none" font-family="SS, Sakkal Saad, serif" font-weight="800" font-size="${s.title.length > 9 ? 25 : 32}">${esc(s.title)}</text>
    <text x="100" y="140" text-anchor="middle" fill="${col}" stroke="none" font-family="SS, Sakkal Saad, serif" font-weight="700" font-size="19">${esc(s.stamp)}</text>
    <line x1="52" y1="152" x2="148" y2="152" stroke-width="2"/>
    <text x="100" y="172" text-anchor="middle" fill="${col}" stroke="none" font-family="SS, Sakkal Saad, serif" font-weight="700" font-size="15">${esc(s.era)}</text>
   </g></svg>`;
};
// ختم مرسوم على لوحة (للمشهد)
UI.stampCanvas = function (id, px) {
  px = px || 256; const T = U.T(), s = T.stations[id], n = RX.ORDER.indexOf(id) + 1;
  const col = s.wing === "anfus" ? C.anfus : C.afaq;
  const cv = document.createElement("canvas"); cv.width = cv.height = px; const c = cv.getContext("2d"); const k = px / 200;
  c.scale(k, k); c.strokeStyle = col; c.fillStyle = col;
  c.lineWidth = 7; c.beginPath(); c.arc(100, 100, 92, 0, 7); c.stroke(); c.lineWidth = 2.5; c.beginPath(); c.arc(100, 100, 78, 0, 7); c.stroke();
  c.textAlign = "center"; c.direction = U.lang() === "ar" ? "rtl" : "ltr";
  c.font = `800 30px ${U.FONT}`; c.fillText(U.num(n), 100, 66);
  c.font = `800 ${s.title.length > 9 ? 25 : 32}px ${U.FONT}`; c.fillText(s.title, 100, 110);
  c.font = `700 19px ${U.FONT}`; c.fillText(s.stamp, 100, 140);
  c.fillRect(52, 151, 96, 2); c.font = `700 15px ${U.FONT}`; c.fillText(s.era, 100, 173);
  // تآكل الحبر
  const id2 = c.getImageData(0, 0, px, px); const d = id2.data;
  for (let i = 3; i < d.length; i += 4) if (Math.random() < 0.08) d[i] *= 0.45;
  c.putImageData(id2, 0, 0);
  return cv;
};

// ======== الجواز ========
UI.passport = function (open) {
  const m = $("#passport");
  if (open === false) { m.classList.remove("on"); return; }
  const T = U.T(), st = RX.app.state;
  const slots = RX.ORDER.map((id, i) => {
    const got = st.stamps[id];
    return `<div class="slot ${got ? "got" : ""}"><div class="sn">${U.num(i + 1)} — ${esc(T.stations[id].title)}</div>${got ? UI.stampSVG(id) : `<div class="empty">${U.num(i + 1)}</div>`}</div>`;
  }).join("");
  m.innerHTML = `<div class="pp">
    <div class="pp-cover">
      <div class="pp-top"><img src="${RX.app.assets.img.logo}" alt=""><div><b>${T.passport}</b><small>${esc(T.app)} — ${esc(T.appSub)}</small></div></div>
      <div class="pp-av"><img id="ppAv" src="${st.avatar || RX.app.assets.img.avatar}" alt=""></div>
      <label class="pp-name"><span>${T.yourName}</span><input id="ppName" value="${esc(st.name || "")}" maxlength="40"></label>
      <label class="pp-up">${T.changeAvatar}<input id="ppFile" type="file" accept="image/*"></label>
      <div class="pp-school">${esc(T.school)}</div>
    </div>
    <div class="pp-pages"><div class="pp-h">${U.num(Object.keys(st.stamps).length)} / ${U.num(5)}</div><div class="slots">${slots}</div>
      <div class="pp-acts"><button class="btn" id="ppPrint">${T.printPassport}</button><button class="btn pri" id="ppClose">${T.close}</button></div></div>
  </div>`;
  m.classList.add("on");
  $("#ppClose").onclick = () => UI.passport(false);
  $("#ppPrint").onclick = () => { try { window.print(); } catch (e) {} };
  $("#ppName").oninput = e => { st.name = e.target.value; RX.app.save(); };
  $("#ppFile").onchange = e => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = async () => { const img = await U.loadImage(r.result); const c = document.createElement("canvas"); const s = 360; c.width = c.height = s;
      const k = Math.max(s / img.width, s / img.height); const cx = c.getContext("2d"); cx.drawImage(img, (s - img.width * k) / 2, (s - img.height * k) / 2, img.width * k, img.height * k);
      st.avatar = c.toDataURL("image/jpeg", 0.85); RX.app.save(); $("#ppAv").src = st.avatar; };
    r.readAsDataURL(f);
  };
};
// ختم يُطبع بحركة على الشاشة
UI.stampFX = function (id) {
  const T = U.T();
  const d = el("div", "stampfx", `<div class="sfx-in">${UI.stampSVG(id, { rot: -8 })}<b>${T.stampEarned}</b></div>`);
  document.body.appendChild(d); RX.A.sfx("stamp");
  setTimeout(() => d.classList.add("on"), 30); setTimeout(() => { d.classList.remove("on"); setTimeout(() => d.remove(), 600); }, 2300);
};
})();
