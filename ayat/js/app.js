// التطبيق: الحالة، التنقّل بين المحطات، بطاقة كل محطة، البوابة والميزان
(function () {
const U = RX.U, C = U.C, E = RX.E, UI = RX.UI;
const $ = s => document.querySelector(s);
const KEY = "rx-ayat-v1";
const app = RX.app = {};
let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
app.state = Object.assign({ stamps: {}, name: "", avatar: null, unlockAll: false, startDone: false, lang: null, last: null, finalDone: false }, saved);
app.lang = (function () { try { return new URLSearchParams(location.search).get("lang"); } catch (e) { return null; } })() || app.state.lang || "ar";
app.save = () => { try { localStorage.setItem(KEY, JSON.stringify(app.state)); } catch (e) {} };
app.isOpen = id => { const i = RX.ORDER.indexOf(id); return app.state.unlockAll || (app.state.startDone && (i === 0 || !!app.state.stamps[RX.ORDER[i - 1]])); };
app.scenes = {};
const T = () => U.T();

// ---------- الأصول ----------
async function loadAssets() {
  const A = window.RX_ASSETS; if (A) return A;
  const img = { logo: "img/logo.jpg", avatar: "img/avatar.jpg", finger_h: "assets/finger_h.png", mount_h: "assets/mount_h.png", mount_sat: "assets/mount_sat.jpg" };
  for (const k of ["loop", "whorl", "arch"]) img["fp_" + k] = `img/fp_${k}.png`;
  for (const id of RX.ORDER) img["card_" + id] = `img/card_${id}.jpg`;
  for (const id of ["sea", "wind"]) { img[id + "_h"] = `assets/${id}_h.png`; img[id + "_sat"] = `assets/${id}_sat.jpg`; }
  const [meta, verses] = await Promise.all([fetch("assets/stations_meta.json").then(r => r.json()), fetch("assets/verses.json").then(r => r.json())]);
  const voice = {}, quran = {};
  try { const v = await fetch("audio/index.json").then(r => r.json()); for (const k of v.voice) voice[k] = `audio/${k}.mp3`; for (const k of v.quran) quran[k] = `audio/quran/${k}.mp3`; } catch (e) {}
  return { img, meta, verses, voice, quran };
}

// ---------- البدء ----------
app.boot = async function () {
  document.documentElement.lang = app.lang; document.documentElement.dir = T().dir;
  try { await Promise.all([document.fonts.load(`800 40px SS`), document.fonts.load(`700 40px SS`), document.fonts.load(`500 40px SS`), document.fonts.load(`40px QF`, "بسم")]); } catch (e) {}
  app.assets = await loadAssets();
  RX.A.voiceSrc = app.assets.voice || {}; RX.A.quranSrc = app.assets.quran || {};
  E.init($("#stage"));
  E.on((ev, v) => { if (ev === "mode") onMode(v); if (ev === "xr-support") hud(); if (ev === "recenter" && E.scene) UI.placePanel(E.scene, E.headYaw() + (app.lang === "ar" ? -0.35 : 0.35)); });
  buildHUD(); intro();
  app.scenes.gate = await RX.GATE.build(app.assets);
  $("#intro .go").disabled = false; $("#intro").classList.add("ready");
};

function intro() {
  const t = T(), el = $("#intro");
  el.innerHTML = `<div class="in-card">
    <div class="in-top"><img src="${app.assets.img.logo}" alt=""><div><b>${t.school}</b><small>${t.google}</small></div></div>
    <div class="in-main"><div class="in-av"><img src="${app.state.avatar || app.assets.img.avatar}" alt=""></div>
      <div class="in-txt"><h1>${t.app}</h1><h3>${t.appSub}</h3>
      <p class="in-verse" dir="rtl" lang="ar">﴿${app.assets.verses["41:53"].ar.split(" ").slice(0, 6).join(" ")}﴾</p>
      <p>${t.introText}</p>
      <div class="in-meta">${t.introMeta.map(m => `<span>${m}</span>`).join("")}</div></div></div>
    <div class="in-modes">
      <button class="go pri" data-m="board" disabled>${t.start}</button>
      <button class="go" data-m="tablet" ${hasGyro() ? "" : "hidden"}>${t.tablet}</button>
      <button class="go" data-m="cardboard" ${hasGyro() ? "" : "hidden"}>${t.cardboard}</button>
      <button class="go xr" data-m="xr" hidden>${t.enterVR}</button>
      <button class="lang" id="inLang">${app.lang === "ar" ? "English" : "العربية"}</button>
    </div>
    <div class="in-load">${t.loading}</div>
  </div>`;
  el.querySelectorAll(".go").forEach(b => b.onclick = () => begin(b.dataset.m));
  $("#inLang").onclick = () => switchLang();
  const showXR = () => { const b = el.querySelector(".xr"); if (b) b.hidden = !E.xrSupported; };
  showXR(); E.on(ev => { if (ev === "xr-support") showXR(); });
}
function hasGyro() { return "ontouchstart" in window && typeof DeviceOrientationEvent !== "undefined"; }
async function begin(mode) {
  RX.A.unlock();
  $("#intro").classList.add("gone"); setTimeout(() => $("#intro").style.display = "none", 700);
  if (mode === "xr") { await enterScene(app.scenes.gate); const ok = await E.enterXR(); if (!ok) E.setMode("board"); }
  else { E.setMode(mode); await enterScene(app.scenes.gate); }
  if (mode === "cardboard") goFullscreen();
}
function goFullscreen() { const d = document.documentElement; (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); try { screen.orientation.lock("landscape"); } catch (e) {} }

// ---------- الدخول إلى مشهد ----------
async function enterScene(sc) {
  RX.A.sfx("whoosh");
  await E.fade(1, 350);
  RX.A.stopVoice(); RX.A.stopRecite(); app.playing = false;
  E.setScene(sc);
  UI.hintOpen = false; UI.tab = "land";
  UI.attach3D(sc);
  RX.A.ambience(sc.ambience || { wind: 0.3 });
  app.state.last = sc.id; app.save();
  app.refresh(); hud();
  await E.fade(0, 600);
  const vkey = sc.id === "gate" ? (app.allStamps() && !app.state.finalDone ? "final" : (!app.state.startDone ? "start" : null)) : sc.id;
  if (vkey && !sc["spoken_" + vkey]) { sc["spoken_" + vkey] = true; setTimeout(() => RX.A.say(vkey), 500); }
}
app.goGate = async function () { await enterScene(app.scenes.gate); };
app.goStation = async function (id) {
  if (!app.isOpen(id)) { app.toast(T().lockedToast, null, "bad"); return; }
  if (!app.scenes[id]) {
    showLoading(true);
    try { app.scenes[id] = await RX.ST[id](app.assets); } finally { showLoading(false); }
  }
  await enterScene(app.scenes[id]);
  const nx = RX.ORDER[RX.ORDER.indexOf(id) + 1];
  if (nx && !app.scenes[nx]) setTimeout(async () => { if (!app.scenes[nx]) app.scenes[nx] = await RX.ST[nx](app.assets); }, 3000);
};
function showLoading(on) { $("#loading").classList.toggle("on", on); $("#loading").textContent = T().loading; }
app.allStamps = () => RX.ORDER.every(id => app.state.stamps[id]);

// ---------- التلاوة ----------
function verseSpec(keys, ref, rkey) {
  return { keys, ref, playing: app.playing === rkey, onPlay: () => {
    if (app.playing === rkey) { RX.A.stopRecite(); app.playing = false; app.refresh(); return; }
    RX.A.stopVoice(); app.playing = rkey; app.refresh();
    const sc = E.scene; if (sc && sc.onRecite) sc.onRecite();
    if (!RX.A.recite(rkey, () => { app.playing = false; app.refresh(); })) setTimeout(() => { app.playing = false; app.refresh(); }, 1500);
  } };
}

// ---------- البطاقة ----------
app.refresh = function () {
  const sc = E.scene; if (!sc) return;
  const spec = sc.id === "gate" ? gateSpec(sc) : stationSpec(sc);
  UI.show(spec); tool(sc); hud();
  requestAnimationFrame(() => {
    const c = $("#card"); const wide = window.innerWidth > 760 && c.classList.contains("on");
    E.viewShift = wide ? (c.offsetWidth + 14) / 2 * (app.lang === "ar" ? -1 : 1) : 0;
  });
};
app.toast = (a, b, k) => UI.toast(a, b, k);
app.stepDone = function (sc, i) {
  if (sc.steps[i]) { app.refresh(); return; }
  sc.steps[i] = true; RX.A.sfx("ok");
  if (sc.steps.every(Boolean) && sc.stage === "explore") { sc.stage = "q"; UI.tab = "trace"; sc.info = null; }
  app.refresh();
};
function stationSpec(sc) {
  const id = sc.id, s = T().stations[id];
  const steps = s.steps.map((label, i) => ({ label: (sc.stepLabel && sc.stepLabel(i)) || label, done: i < sc.steps.length ? sc.steps[i] : sc.stage === "done" }));
  const spec = { kicker: s.kicker, title: s.title, sub: s.sub, tabs: true,
    verse: verseSpec(s.verse, s.ref, id), tafsir: app.lang === "ar" ? s.tafsir : null, body: s.body,
    sci: s.sci, sciSrc: s.sciSrc, sciLocked: sc.stage === "explore",
    mission: s.mission, steps, hint: s.hint, real: sc.real || null, actions: (sc.actions ? sc.actions() : []), info: sc.info,
    gallery: sc.gallery ? sc.gallery() : null };
  const q2 = sc.question2 && sc.question2(); if (q2) spec.question = q2;
  if (sc.stage === "q") {
    spec.mission = null; spec.info = null; spec.actions = [];
    spec.question = sc.q || (sc.q = { q: s.q, choices: s.choices, label: id === "finger" ? T().bookQ : T().question, onCorrect: () => app.complete(sc) });
  }
  if (sc.stage === "done") {
    spec.mission = null; spec.actions = [];
    const nx = RX.ORDER[RX.ORDER.indexOf(id) + 1];
    spec.info = { title: "✓ " + T().stampEarned, text: `${T().wings[s.wing]}، ${s.ref}`.replace("، ", app.lang === "ar" ? "، " : " · ") };
    if (nx) spec.actions.push({ label: `${T().next}: ${T().stations[nx].title}`, primary: true, onClick: () => app.goStation(nx) });
    spec.actions.push({ label: app.allStamps() ? T().stations.final.title : T().map, primary: !nx, onClick: () => app.goGate() });
  }
  return spec;
}
app.complete = function (sc) {
  app.state.stamps[sc.id] = true; app.save(); sc.stage = "done";
  UI.stampFX(sc.id); app.refresh(); hud();
};

// ---------- البوابة: البداية، واختيار المحطة، والميزان ----------
function gateSpec(sc) {
  const t = T(), s = t.stations.gate;
  sc.onRecite = null; sc.onCard = null; sc.onGate = null;
  if (!app.state.startDone) {
    sc.S = sc.S || { steps: [false, false], placed: 0 };
    const S = sc.S;
    sc.onRecite = () => { if (!S.steps[0]) { S.steps[0] = true; RX.A.sfx("ok"); app.toast("✓ " + s.steps[0]); setTimeout(() => app.refresh(), 50); } };
    sc.onCard = id => { if (sc.cards[id].userData.placed) return; sc.sel = id; Object.values(sc.cards).forEach(m => { if (!m.userData.placed) m.position.y = m.userData.home.y; }); RX.A.sfx("click"); };
    sc.onGate = async k => {
      if (!sc.sel) { app.toast(s.pick, null, "bad"); return; }
      const id = sc.sel, want = id === "finger" ? "anfus" : "afaq";
      if (k !== want) { RX.A.sfx("bad"); app.toast(t.wings[k] + (app.lang === "ar" ? "؟" : "?"), s.bad[id], "bad"); sc.shake(sc.cards[id]); return; }
      sc.sel = null; RX.A.sfx("ok"); app.toast("✓ " + t.wings[k], s.ok[id]);
      await sc.placeCard(id, k); S.placed++;
      if (S.placed === 5) { S.steps[1] = true; app.refresh(); }
      else app.refresh();
    };
    const steps = s.steps.map((l, i) => ({ label: i === 1 ? `${l} (${U.num(S.placed)}/${U.num(5)})` : l, done: i < 2 ? S.steps[i] : false }));
    const spec = { kicker: s.kicker, title: s.title, sub: s.sub, tabs: true, verse: verseSpec(s.verse, s.ref, "gate"), tafsir: app.lang === "ar" ? s.tafsir : null, body: s.body,
      sci: s.sci, sciSrc: s.sciSrc, sciLocked: false, mission: s.mission, steps, hint: s.hint, actions: [] };
    if (S.steps[0] && !S.steps[1]) spec.info = { title: s.steps[1], text: s.pick };
    if (S.steps[0] && S.steps[1]) {
      spec.mission = null;
      spec.question = sc.q0 || (sc.q0 = { q: s.q, choices: s.choices, onCorrect: () => { app.state.startDone = true; app.save(); app.refresh(); hud(); RX.A.say("go"); } });
    }
    return spec;
  }
  if (app.allStamps()) return finalSpec(sc);
  // اختيار المحطة
  sc.rack.visible = false;
  const spec = { kicker: s.kicker, title: s.title, sub: t.appSub, tabs: true, verse: verseSpec(s.verse, s.ref, "gate"), tafsir: app.lang === "ar" ? s.tafsir : null,
    body: s.listChoose, sci: s.sci, sciSrc: s.sciSrc, sciLocked: false, actions: [], foot: false };
  RX.ORDER.forEach((id, i) => {
    const st = t.stations[id], done = !!app.state.stamps[id], open = app.isOpen(id);
    spec.actions.push({ label: `${done ? "✓" : U.num(i + 1)}  ${st.title} — ${t.wings[st.wing]}`, primary: open && !done, disabled: !open, onClick: () => app.goStation(id) });
  });
  return spec;
}
// الختام: ميزان التفسير
function finalSpec(sc) {
  const t = T(), f = t.stations.final;
  const F = RX.GATE.setupFinal(sc, n => { if (n === f.cards.length) { F.steps[0] = true; RX.A.sfx("ok"); app.toast("✓ " + f.balanced); } app.refresh(); });
  const steps = f.steps.map((l, i) => ({ label: i === 0 ? `${l} (${U.num(F.done)}/${U.num(f.cards.length)})` : l, done: F.steps[i] }));
  const spec = { kicker: f.kicker, title: f.title, sub: f.sub, tabs: false, body: f.body, mission: f.mission, steps, hint: f.hint, actions: [], foot: true };
  if (!F.steps[0]) spec.info = { title: f.steps[0], text: f.pick };
  else if (!F.steps[1]) {
    spec.mission = null;
    spec.question = sc.qF || (sc.qF = { q: f.q, choices: f.choices, onCorrect: () => { F.steps[1] = true; finish(sc); } });
  } else {
    spec.mission = null; spec.info = { title: f.complete, text: f.completeSub };
    spec.actions.push({ label: t.passport, primary: true, onClick: () => UI.passport(true) });
    spec.actions.push({ label: t.reset, onClick: () => resetAll() });
  }
  return spec;
}
function finish(sc) {
  app.state.finalDone = true; app.save(); app.refresh();
  RX.A.sfx("ok"); setTimeout(() => RX.A.say("end"), 600);
  confetti(); setTimeout(() => UI.passport(true), 1600);
}
function confetti() {
  const d = document.createElement("div"); d.className = "confetti"; document.body.appendChild(d);
  const cols = [C.gold, C.afaq, C.anfus, C.red, "#F6E7C3"];
  for (let i = 0; i < 90; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = cols[i % 5]; s.style.animationDelay = Math.random() * 0.8 + "s"; s.style.transform = `rotate(${Math.random() * 360}deg)`; d.appendChild(s); }
  setTimeout(() => d.remove(), 4200);
}
let resetArm = 0;
function resetAll() {
  if (Date.now() - resetArm > 4000) { resetArm = Date.now(); app.toast(app.lang === "ar" ? "اضغط مرة أخرى خلال ٤ ثوانٍ لمسح الأختام" : "Tap again within 4 s to clear the stamps", null, "bad"); return; }
  const lang = app.lang; try { localStorage.setItem(KEY, JSON.stringify({ lang })); } catch (e) {} location.reload();
}
async function switchLang() {
  app.lang = app.state.lang = app.lang === "ar" ? "en" : "ar"; app.save();
  document.documentElement.lang = app.lang; document.documentElement.dir = T().dir;
  buildHUD(); settings(false);
  if ($("#intro").style.display !== "none") { intro(); $("#intro .go").disabled = false; $("#intro").classList.add("ready"); }
  const cur = E.scene ? E.scene.id : "gate";
  RX.A.stopRecite(); app.playing = false;
  for (const id of RX.ORDER) delete app.scenes[id];
  // البوابة تُبنى من جديد بلغتها، مع حفظ تقدّم التصنيف
  const old = app.scenes.gate; app.scenes.gate = await RX.GATE.build(app.assets);
  if (old && old.S) { app.scenes.gate.S = old.S; for (const id of RX.ORDER) if (old.cards[id].userData.placed) await app.scenes.gate.placeCard(id, id === "finger" ? "anfus" : "afaq"); }
  if (cur !== "gate") { showLoading(true); try { app.scenes[cur] = await RX.ST[cur](app.assets); } finally { showLoading(false); } await enterScene(app.scenes[cur]); }
  else await enterScene(app.scenes.gate);
}

// ---------- الشريط السفلي ----------
function tool(sc) {
  const el = $("#tool"); let h = "";
  const sl = sc.slider && sc.slider();
  if (sl) h = `<div class="slider"><span>${sl.a}</span><input id="tslider" type="range" min="0" max="1000" value="${Math.round(sl.k * 1000)}"><span>${sl.b}</span></div>`;
  const hint = sc.toolHint && sc.toolHint();
  if (hint && !h) h = `<div class="thint">${hint}</div>`;
  el.innerHTML = h; el.classList.toggle("on", !!h);
  const r = $("#tslider"); if (r) r.oninput = () => sl.on(r.value / 1000);
}
app.syncSlider = k => { const r = $("#tslider"); if (r && document.activeElement !== r) r.value = Math.round(k * 1000); };

// ---------- الشريط العلوي ----------
function buildHUD() {
  const t = T();
  $("#hud").innerHTML = `<div class="brand"><img src="${app.assets ? app.assets.img.logo : "img/logo.jpg"}" alt=""><div><b>${t.app}</b><small>${t.appSub}</small></div></div>
    <div class="prog" id="prog"></div>
    <div class="btns">
      <button id="bMap">${t.map}</button><button id="bPass">${t.passport}</button>
      <button id="bVR" class="vr" hidden>${t.enterVR}</button>
      <button id="bLang">${app.lang === "ar" ? "EN" : "ع"}</button><button id="bSet" aria-label="${t.settings}">⚙</button>
    </div>`;
  $("#bMap").onclick = () => app.goGate();
  $("#bPass").onclick = () => UI.passport(true);
  $("#bLang").onclick = () => switchLang();
  $("#bSet").onclick = () => settings(true);
  $("#bVR").onclick = () => E.enterXR();
  $("#exitCb").onclick = () => { E.setMode("board"); try { document.exitFullscreen(); } catch (e) {} };
}
function hud() {
  const p = $("#prog"); if (!p) return;
  const cur = E.scene && E.scene.id;
  p.innerHTML = RX.ORDER.map((id, i) => {
    const done = app.state.stamps[id], open = app.isOpen(id), st = T().stations[id];
    return `<button class="pd ${done ? "done" : ""} ${open ? "open" : ""} ${cur === id ? "cur" : ""} ${st.wing}" data-id="${id}" title="${st.title}">${done ? "✓" : U.num(i + 1)}</button>`;
  }).join("");
  p.querySelectorAll(".pd").forEach(b => b.onclick = () => app.goStation(b.dataset.id));
  const vr = $("#bVR"); if (vr) vr.hidden = !E.xrSupported;
  const hint = $("#hint"); if (hint) hint.textContent = E.mode === "board" ? T().dragHint : E.mode === "tablet" ? T().gyroHint : E.mode === "cardboard" ? T().gazeHint : "";
}
function onMode(m) { document.body.dataset.mode = m; if (E.scene) { UI.attach3D(E.scene); app.refresh(); } }
function settings(open) {
  const el = $("#settings"); if (!open) { el.classList.remove("on"); return; }
  const t = T(), st = app.state;
  el.innerHTML = `<div class="set">
    <h3>${t.settings}</h3>
    <div class="row"><span>${t.mode}</span><div class="seg2">
      ${["board", "tablet", "cardboard"].map(m => `<button data-m="${m}" class="${E.mode === m ? "on" : ""}">${t[m]}</button>`).join("")}
      ${E.xrSupported ? `<button data-m="xr">${t.enterVR}</button>` : ""}</div></div>
    <label class="row"><span>${t.sound}</span><input type="checkbox" id="sSound" ${RX.A.on ? "checked" : ""}></label>
    <label class="row"><span>${t.narration}</span><input type="checkbox" id="sVoice" ${RX.A.voice ? "checked" : ""}></label>
    <label class="row"><span>${t.unlockAll}</span><input type="checkbox" id="sUnlock" ${st.unlockAll ? "checked" : ""}></label>
    <div class="row"><span>${t.language}</span><button id="sLang">${app.lang === "ar" ? "English" : "العربية"}</button></div>
    <div class="cred"><b>${t.credits}</b>${t.credText.map(x => `<p>${x}</p>`).join("")}</div>
    <div class="row end"><button class="btn" id="sReset">${t.reset}</button><button class="btn pri" id="sClose">${t.close}</button></div>
  </div>`;
  el.classList.add("on");
  el.querySelectorAll("[data-m]").forEach(b => b.onclick = async () => { settings(false); if (b.dataset.m === "xr") E.enterXR(); else { E.setMode(b.dataset.m); if (b.dataset.m === "cardboard") goFullscreen(); } });
  $("#sSound").onchange = e => RX.A.setOn(e.target.checked);
  $("#sVoice").onchange = e => { RX.A.voice = e.target.checked; if (!RX.A.voice) RX.A.stopVoice(); };
  $("#sUnlock").onchange = e => { st.unlockAll = e.target.checked; app.save(); if (st.unlockAll) st.startDone = true; app.refresh(); hud(); };
  $("#sLang").onclick = () => switchLang();
  $("#sReset").onclick = () => resetAll();
  $("#sClose").onclick = () => settings(false);
}

window.addEventListener("load", () => app.boot().catch(e => { console.error(e); const l = document.querySelector("#intro .in-load"); if (l) l.textContent = "⚠ " + e.message; }));
})();
