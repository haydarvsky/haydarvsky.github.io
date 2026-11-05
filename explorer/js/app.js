// التطبيق: الحالة، التنقّل بين المحطات، بطاقة كل محطة، البداية والختام
(function () {
const U = RX.U, C = U.C, E = RX.E, UI = RX.UI;
const $ = s => document.querySelector(s);
const KEY = "rx-explorer-v1";
const app = RX.app = {};
let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
app.state = Object.assign({ stamps: {}, name: "", avatar: null, unlockAll: false, startDone: false, lang: null, last: null, finalDone: false }, saved);
app.lang = (function () { try { return new URLSearchParams(location.search).get("lang"); } catch (e) { return null; } })() || app.state.lang || "ar";
app.save = () => { try { const s = Object.assign({}, app.state); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
app.isOpen = id => { const i = RX.ORDER.indexOf(id); return app.state.unlockAll || i === 0 || !!app.state.stamps[RX.ORDER[i - 1]]; };
app.scenes = {};
const T = () => U.T();

// ---------- الأصول ----------
async function loadAssets() {
  const A = window.RX_ASSETS;      // في الحزمة الواحدة تأتي مضمَّنة
  if (A) return A;
  const img = {};
  for (const k of ["map_h", "shaqaya_flood"]) img[k] = `assets/${k}.png`;
  img.map_tex = "assets/map_tex.jpg";
  for (const id of RX.ORDER) { img[id + "_h"] = `assets/${id}_h.png`; img[id + "_sat"] = `assets/${id}_sat.jpg`; }
  img.logo = "img/logo.jpg"; img.avatar = "img/avatar.jpg";
  const [meta, flow] = await Promise.all([fetch("assets/stations_meta.json").then(r => r.json()), fetch("assets/flow.json").then(r => r.json())]);
  const voice = {};
  try { const v = await fetch("audio/index.json").then(r => r.json()); for (const k of v) voice[k] = `audio/${k}.mp3`; } catch (e) {}
  return { img, meta, flow, voice };
}

// ---------- البدء ----------
app.boot = async function () {
  document.documentElement.lang = app.lang; document.documentElement.dir = T().dir;
  try { await Promise.all([document.fonts.load(`800 40px SS`), document.fonts.load(`700 40px SS`), document.fonts.load(`500 40px SS`)]); } catch (e) {}
  app.assets = await loadAssets();
  RX.A.voiceSrc = app.assets.voice || {};
  E.init($("#stage"));
  E.on((ev, v) => { if (ev === "mode") onMode(v); if (ev === "xr-support") hud(); if (ev === "recenter" && E.scene) UI.placePanel(E.scene, E.headYaw() + (app.lang === "ar" ? -0.35 : 0.35)); });
  buildHUD(); intro();
  // نبني غرفة الخرائط مبكراً
  app.scenes.map = await RX.MAP.build(app.assets);
  app.scenes.map.buildLabels();
  $("#intro .go").disabled = false; $("#intro").classList.add("ready");
};

function intro() {
  const t = T(), el = $("#intro");
  el.innerHTML = `<div class="in-card">
    <div class="in-top"><img src="${app.assets.img.logo}" alt=""><div><b>${t.school}</b><small>${t.google}</small></div></div>
    <div class="in-main"><div class="in-av"><img src="${app.state.avatar || app.assets.img.avatar}" alt=""></div>
      <div class="in-txt"><h1>${t.app}</h1><h3>${t.appSub}</h3>
      <p>${app.lang === "ar" ? "درسٌ بطلُه أنت: تمشي على سطح الكويت من بيانات ارتفاعٍ حقيقية، وتكتشف تحت كل معلمٍ حضارةً عاشت عليه." : "A lesson where you are the hero: walk Kuwait's real terrain and uncover the civilisation beneath each landmark."}</p>
      <div class="in-meta"><span>${app.lang === "ar" ? "الاجتماعيات، الصف العاشر" : "Social Studies · Grade 10"}</span><span>${app.lang === "ar" ? "ص٣٨–٤١، ص٩٥–٩٩" : "pp. 38–41 · 95–99"}</span></div></div></div>
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
  if (mode === "xr") { await enterScene(app.scenes.map); const ok = await E.enterXR(); if (!ok) E.setMode("board"); }
  else { E.setMode(mode); await enterScene(app.scenes.map); }
  if (mode === "cardboard") goFullscreen();
  const last = app.state.last;
  if (last && last !== "map" && app.isOpen(last) && !app.state.stamps[last]) { /* يبقى في الخريطة ليختار */ }
}
function goFullscreen() { const d = document.documentElement; (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); try { screen.orientation.lock("landscape"); } catch (e) {} }

// ---------- الدخول إلى مشهد ----------
async function enterScene(sc) {
  RX.A.sfx("whoosh");
  await E.fade(1, 350);
  RX.A.stopVoice();
  E.setScene(sc);
  UI.hintOpen = false;
  UI.attach3D(sc);
  RX.A.ambience(sc.ambience || { tent: 0.6 });
  app.state.last = sc.id; app.save();
  app.refresh(); hud();
  await E.fade(0, 600);
  const vkey = sc.id === "map" ? (app.allStamps() && !app.state.finalDone ? "final" : (!app.state.startDone ? "start" : null)) : sc.id;
  if (vkey && !sc.spoken) { sc.spoken = true; setTimeout(() => RX.A.say(vkey), 500); }
}
app.goMap = async function () { await enterScene(app.scenes.map); };
app.goStation = async function (id) {
  if (!app.isOpen(id)) { app.toast(T().lockedToast, null, "bad"); return; }
  if (!app.scenes[id]) {
    showLoading(true);
    try { app.scenes[id] = await RX.ST[id](app.assets); } finally { showLoading(false); }
  }
  await enterScene(app.scenes[id]);
  // نجهّز المحطة التالية في الخلفية
  const nx = RX.ORDER[RX.ORDER.indexOf(id) + 1];
  if (nx && !app.scenes[nx]) setTimeout(async () => { if (!app.scenes[nx]) app.scenes[nx] = await RX.ST[nx](app.assets); }, 2500);
};
function showLoading(on) { $("#loading").classList.toggle("on", on); $("#loading").textContent = T().loading; }
app.allStamps = () => RX.ORDER.every(id => app.state.stamps[id]);

// ---------- البطاقة ----------
app.refresh = function () {
  const sc = E.scene; if (!sc) return;
  const spec = sc.id === "map" ? mapSpec(sc) : stationSpec(sc);
  UI.show(spec); tool(sc); hud();
  requestAnimationFrame(() => {   // أزِح مركز المشهد بعيداً عن البطاقة
    const c = $("#card"); const wide = window.innerWidth > 760 && c.classList.contains("on");
    E.viewShift = wide ? (c.offsetWidth + 14) / 2 * (app.lang === "ar" ? -1 : 1) : 0;
  });
};
app.toast = (a, b, k) => UI.toast(a, b, k);
app.info = function (sc, title, text) { sc.info = { title, text }; app.refresh(); };
app.stepDone = function (sc, i) {
  if (sc.steps[i]) { app.refresh(); return; }
  sc.steps[i] = true; RX.A.sfx("ok");
  const st = T().stations[sc.id] || T().stations.start;
  app.toast("✓ " + st.steps[i], null);
  if (sc.steps.every(Boolean)) sc.stage = "q";
  app.refresh();
};
function coordStr(m) { return `${m.lat.toFixed(4)}°N  ${m.lon.toFixed(4)}°E`; }
function earthURL(m) { return `https://earth.google.com/web/@${m.lat},${m.lon},${Math.round(m.h0 || 0)}a,1200d,35y,0h,60t,0r`; }
function stationSpec(sc) {
  const id = sc.id, s = T().stations[id], meta = app.assets.meta[id];
  const steps = s.steps.map((label, i) => ({ label: (sc.stepLabel && sc.stepLabel(i)) || label, done: i < sc.steps.length ? sc.steps[i] : sc.stage === "done" }));
  const spec = { kicker: s.kicker, title: s.title, sub: s.sub, tabs: true, land: s.land, trace: s.trace, pages: s.pages, place: s.place,
    coords: coordStr(meta), mission: s.mission, steps, hint: s.hint, real: earthURL(meta), actions: [], info: sc.info,
    note: sc.id === "kazma" ? s.noFigures : null };
  if (sc.id === "wara") { spec.quote = `«${s.verse1} … ${s.verse2}» — ${s.poet}`; }
  // أزرار خاصة بكل محطة
  if (id === "wara") {
    if (!sc.steps[0]) spec.actions.push({ label: "▶ " + T().listen, primary: true, onClick: () => sc.playVerse() });
    else if (!sc.steps[1]) spec.actions.push({ label: (app.lang === "ar" ? "التفت نحو " : "Turn toward ") + s.ahmadi, primary: true, onClick: () => { sc.turnToAhmadi(); } });
  }
  if (id === "kazma" && !sc.steps[0]) spec.actions.push({ label: s.play, primary: true, onClick: () => sc.playBattle() });
  if (id === "kazma" && sc.lifted && !sc.playing) spec.actions.push({ label: app.lang === "ar" ? "انزل إلى حافة جال الزور" : "Back down to the edge", onClick: () => sc.lift(false) });
  if (id === "kazma" && !sc.lifted && sc.steps[0]) spec.actions.push({ label: app.lang === "ar" ? "اصعد إلى منصّة المراقبة" : "Rise to the lookout", onClick: () => sc.lift(true) });
  if (id === "shaqaya" && !sc.steps[1]) spec.actions.push({ label: s.rain, primary: !!sc.steps[0], onClick: () => sc.startRain() });
  if (id === "shaqaya" && sc.lifted && !sc.raining) spec.actions.push({ label: app.lang === "ar" ? "انزل إلى أعلى نقطة" : "Back down to the summit", onClick: () => sc.lift(false) });
  if (sc.stage === "q") {
    spec.mission = null; spec.info = null;
    spec.question = sc.q || (sc.q = { q: s.q, choices: s.choices, label: id === "shaqaya" ? T().bookQ : T().question, onCorrect: () => app.complete(sc) });
  }
  if (sc.stage === "done") {
    spec.mission = null;
    const nx = RX.ORDER[RX.ORDER.indexOf(id) + 1];
    spec.info = { title: "✓ " + T().stampEarned, text: s.stamp + (app.lang === "ar" ? "، " : " · ") + s.era };
    if (nx) spec.actions.push({ label: `${T().next}: ${T().stations[nx].title}`, primary: true, onClick: () => app.goStation(nx) });
    spec.actions.push({ label: T().map, primary: !nx, onClick: () => app.goMap() });
  }
  spec.onTab = tab => { if (sc.onTab) sc.onTab(tab); };
  return spec;
}
app.complete = function (sc) {
  app.state.stamps[sc.id] = true; app.save(); sc.stage = "done";
  UI.stampFX(sc.id); app.refresh(); hud();
  if (app.scenes.map) app.scenes.map.pinsDirty = true;
};

// ---------- غرفة الخرائط: البداية والختام ----------
function mapSpec(sc) {
  if (sc.pinsDirty !== false) { sc.buildPins(app.state, id => pickPin(id)); sc.pinsDirty = false; }
  const t = T(), s = t.stations.start;
  if (!app.state.startDone) {
    sc.startSteps = sc.startSteps || [false, false];
    const steps = s.steps.map((l, i) => ({ label: l, done: i < 2 ? sc.startSteps[i] : false }));
    const spec = { kicker: s.kicker, title: s.title, sub: s.sub, tabs: true, land: s.land, trace: s.trace, mission: s.mission, steps, hint: s.hint, actions: [], foot: true,
      onTab: tab => { sc.setLayer(tab); if (tab === "trace" && !sc.startSteps[1]) { sc.startSteps[1] = true; RX.A.sfx("ok"); app.toast("✓ " + s.steps[1]); app.refresh(); } } };
    if (sc.startSteps[0]) spec.quote = s.conclusion;
    if (!sc.startSteps[0]) spec.actions.push({ label: s.rain, primary: true, onClick: () => { if (sc.rainBusy) return; sc.rainBusy = true; sc.startRain(); RX.A.ambience({ tent: 0.5, rain: 0.5 }); setTimeout(() => { sc.showSlope(); }, 5200); } });
    if (sc.startSteps[0] && sc.startSteps[1]) {
      spec.mission = null;
      spec.question = sc.q0 || (sc.q0 = { q: s.q, choices: s.choices, onCorrect: () => { app.state.startDone = true; app.save(); sc.pinsDirty = true; app.refresh(); RX.A.say("go"); } });
    }
    sc.onRainEnd = () => { sc.rainBusy = false; RX.A.ambience({ tent: 0.6 }); if (!sc.startSteps[0]) { sc.startSteps[0] = true; RX.A.sfx("ok"); app.toast("✓ " + s.steps[0], s.slope); app.refresh(); } };
    return spec;
  }
  if (app.allStamps()) return finalSpec(sc);
  // اختيار المحطة
  const spec = { kicker: t.startSt, title: app.lang === "ar" ? "خريطة الرحلة" : "Journey map", sub: t.appSub, tabs: true, land: s.land, trace: s.trace, actions: [], foot: false,
    onTab: tab => sc.setLayer(tab), body: null };
  spec.land = app.lang === "ar" ? "اختر المحطة المفتوحة على الخريطة أو من القائمة. المحطات مرتّبة على خط الزمن، وكل محطة تفتح التي بعدها." : "Pick an open station on the map or below. Stations follow the timeline; each one unlocks the next.";
  RX.ORDER.forEach((id, i) => {
    const st = t.stations[id], done = !!app.state.stamps[id], open = app.isOpen(id);
    spec.actions.push({ label: `${done ? "✓" : U.num(i + 1)}  ${st.title} — ${st.era}`, primary: open && !done, disabled: !open, onClick: () => app.goStation(id) });
  });
  return spec;
}
function pickPin(id) {
  if (!app.state.startDone) { app.toast(app.lang === "ar" ? "أكمل مهمة البداية أولاً" : "Finish the start mission first", null, "bad"); return; }
  app.goStation(id);
}

// الختام «خريطتي»
function finalSpec(sc) {
  const t = T(), f = t.stations.final;
  setupFinal(sc);
  const F = sc.F;
  const steps = f.steps.map((l, i) => ({ label: l, done: F.steps[i] }));
  const spec = { kicker: f.kicker, title: f.title, sub: f.sub, tabs: false, body: f.land, mission: f.mission, steps, hint: f.hint, actions: [], foot: true };
  if (!F.steps[0]) spec.info = { title: f.place1, text: Object.keys(f.sym).map(k => (F.symText[k]) + " " + f.sym[k]).join(app.lang === "ar" ? "، " : " · ") };
  else if (!F.steps[1]) spec.info = { title: f.order, text: f.orderHelp };
  else if (!F.steps[2]) {
    spec.mission = null;
    spec.multi = sc.multi || (sc.multi = { q: f.q, items: f.multi, sel: [], okMsg: f.multiOk, badMsg: f.multiBad, onCorrect: () => { F.steps[2] = true; finish(sc); } });
    spec.actions.push({ label: f.check, primary: true, onClick: () => UI.checkMulti() });
  } else {
    spec.mission = null; spec.info = { title: f.complete, text: f.completeSub };
    spec.actions.push({ label: t.passport, primary: true, onClick: () => UI.passport(true) });
    spec.actions.push({ label: t.reset, onClick: () => resetAll() });
  }
  return spec;
}
function setupFinal(sc) {
  if (sc.F) return;
  const f = T().stations.final, M = RX.MAP;
  const F = sc.F = { steps: [false, false, false], sel: null, placed: {}, order: [], symText: { ubaid: "●", hellen: "▲", wara: "■" } };
  sc.pinsDirty = true;
  const root = sc.root, edge = sc.MH / 2 + 0.09, TOP = sc.TOP;
  const target = { ubaid: RX.GEO.hist.sabiya, hellen: RX.GEO.hist.failaka, wara: RX.GEO.hist.wara };
  const geoms = { ubaid: new THREE.SphereGeometry(0.03, 20, 14), hellen: new THREE.ConeGeometry(0.035, 0.06, 3), wara: new THREE.BoxGeometry(0.05, 0.05, 0.05) };
  const ar = app.lang === "ar";
  F.tokens = {};
  ["ubaid", "hellen", "wara"].forEach((k, i) => {
    const m = new THREE.Mesh(geoms[k], new THREE.MeshStandardMaterial({ color: k === "ubaid" ? 0x2E7D55 : k === "hellen" ? 0x2C6E8F : 0xB3312A, roughness: 0.5, emissive: 0 }));
    const x = (ar ? 1 : -1) * (0.55 - i * 0.24);
    m.position.set(x, TOP + 0.08, edge + 0.0); m.castShadow = true; root.add(m); F.tokens[k] = m; m.userData.home = m.position.clone();
    const lab = U.label(f.sym[k], { size: 36, height: 0.03 }); lab.position.set(x, TOP + 0.15, edge); root.add(lab); m.userData.lab = lab;
    E.addTo(sc, m, { onSelect: () => { if (F.steps[0] || F.placed[k]) return; F.sel = k; Object.values(F.tokens).forEach(t => t.material.emissive.setHex(0)); m.material.emissive.setHex(0x553300); RX.A.sfx("click"); } });
  });
  E.addTo(sc, sc.mapMesh, {
    onSelect: h => {
      if (!F.sel || F.steps[0]) return;
      const k = F.sel, ll = M.map2ll(h.point.x, h.point.z), tg = { lon: target[k][0], lat: target[k][1] };
      const d = M.km(ll, tg);
      if (d < 24) {
        const p = M.ll2map(tg.lon, tg.lat); const m = F.tokens[k]; const p0 = m.position.clone();
        U.tween(700, q => { m.position.set(p0.x + (p.x - p0.x) * q, p0.y + (TOP + 0.09 - p0.y) * q + Math.sin(q * Math.PI) * 0.12, p0.z + (p.z - p0.z) * q); });
        m.userData.lab.position.set(p.x, TOP + 0.17, p.z);
        F.placed[k] = true; F.sel = null; m.material.emissive.setHex(0); RX.A.sfx("ok"); app.toast(f.sym[k], f.placed);
        if (Object.keys(F.placed).length === 3) { F.steps[0] = true; showOrder(sc); app.refresh(); }
      } else { RX.A.sfx("bad"); app.toast(f.sym[k], f.farAway, "bad"); }
    }
  });
}
function showOrder(sc) {
  const F = sc.F, f = T().stations.final, root = sc.root, TOP = sc.TOP, edge = sc.MH / 2 + 0.09, ar = app.lang === "ar";
  const sh = ["kazma", "sabiya", "shaqaya", "failaka", "wara"];
  F.stamps = {};
  // خط الزمن: لوح قائم خلف الإطار القريب
  const tcv = document.createElement("canvas"); tcv.width = 2048; tcv.height = 300; const tc = tcv.getContext("2d");
  tc.fillStyle = "rgba(255,252,244,0.92)"; U.rrect(tc, 6, 6, 2036, 288, 40); tc.fill(); tc.strokeStyle = C.brown; tc.lineWidth = 6; tc.stroke();
  tc.fillStyle = C.brown; tc.fillRect(120, 236, 1808, 6);
  tc.font = `800 44px ${U.FONT}`; tc.textAlign = "center"; tc.fillStyle = C.mute; tc.direction = ar ? "rtl" : "ltr";
  RX.ORDER.forEach((id, i) => { const x = ar ? 1840 - i * 420 : 208 + i * 420; tc.fillText(T().stations[id].era, x, 278 - 4); tc.beginPath(); tc.arc(x, 239, 10, 0, 7); tc.fill(); });
  tc.fillStyle = C.ink; tc.font = `800 40px ${U.FONT}`; tc.fillText(ar ? "الأقدم ←   خط الزمن   ← الأحدث" : "Oldest →   Timeline   → Newest", 1024, 46);
  const TW = 1.7; const tl = new THREE.Mesh(new THREE.PlaneGeometry(TW, TW * 300 / 2048), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tcv), transparent: true, side: THREE.DoubleSide }));
  const far = -(sc.MH / 2 + 0.2); tl.position.set(0, TOP + 0.36, far); tl.rotation.x = 0; root.add(tl);
  const easel = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.06, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0x3D2A1A })); easel.position.set(0, TOP + 0.23, far - 0.01); root.add(easel);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.03), easel.material); p.position.set(s * (TW / 2 + 0.02), TOP + 0.21, far - 0.02); root.add(p); }
  const slotX = i => (ar ? 1 : -1) * (0.637 - i * 0.328) * TW / 1.6;
  sh.forEach((id, i) => {
    const t = new THREE.CanvasTexture(UI.stampCanvas(id, 256));
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.055, 40), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
    m.rotation.x = -0.55; m.position.set((ar ? -0.58 : -0.86) + i * 0.16, TOP + 0.15, sc.MH / 2 - 0.12); root.add(m); F.stamps[id] = m;
    E.addTo(sc, m, { onSelect: () => {
      if (F.steps[1] || m.userData.placed) return;
      const want = RX.ORDER[F.order.length];
      if (id === want) {
        m.userData.placed = true; const k = F.order.length; F.order.push(id); RX.A.sfx("stamp");
        const p0 = m.position.clone(), r0 = m.rotation.x;
        const far = -(sc.MH / 2 + 0.2) + 0.012; U.tween(800, q => { m.position.set(p0.x + (slotX(k) - p0.x) * q, p0.y + (TOP + 0.375 - p0.y) * q + Math.sin(q * Math.PI) * 0.12, p0.z + (far - p0.z) * q); m.rotation.x = r0 * (1 - q); });
        if (F.order.length === 5) { F.steps[1] = true; app.toast(f.orderOk, null); app.refresh(); }
      } else { RX.A.sfx("bad"); app.toast(f.orderBad, T().stations[id].era, "bad"); const x0 = m.position.x; U.tween(400, q => m.position.x = x0 + Math.sin(q * Math.PI * 6) * 0.012); }
    } });
  });
}
function finish(sc) {
  app.state.finalDone = true; app.save(); app.refresh();
  RX.A.sfx("ok"); setTimeout(() => RX.A.say("end"), 600);
  confetti(); setTimeout(() => UI.passport(true), 1600);
}
function confetti() {
  const d = document.createElement("div"); d.className = "confetti"; document.body.appendChild(d);
  const cols = [C.red, C.green, C.gold, C.blue, C.brown];
  for (let i = 0; i < 90; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = cols[i % 5]; s.style.animationDelay = Math.random() * 0.8 + "s"; s.style.transform = `rotate(${Math.random() * 360}deg)`; d.appendChild(s); }
  setTimeout(() => d.remove(), 4200);
}
let resetArm = 0;
function resetAll(btn) {
  // تأكيد داخل الصفحة (الإطار المعزول يرفض confirm)
  if (Date.now() - resetArm > 4000) { resetArm = Date.now(); app.toast(app.lang === "ar" ? "اضغط مرة أخرى خلال ٤ ثوانٍ لمسح الأختام" : "Tap again within 4 s to clear the stamps", null, "bad"); return; }
  const lang = app.lang; try { localStorage.setItem(KEY, JSON.stringify({ lang })); } catch (e) {} location.reload();
}
async function switchLang() {
  // تبديل اللغة داخل الصفحة: تُعاد بناء الواجهة واللافتات، وتبقى الأختام
  app.lang = app.state.lang = app.lang === "ar" ? "en" : "ar"; app.save();
  document.documentElement.lang = app.lang; document.documentElement.dir = T().dir;
  buildHUD(); settings(false);
  if ($("#intro").style.display !== "none") { intro(); $("#intro .go").disabled = false; $("#intro").classList.add("ready"); }
  const cur = E.scene ? E.scene.id : "map";
  for (const id of RX.ORDER) delete app.scenes[id];
  const m = app.scenes.map; m.buildLabels(); m.pinsDirty = true; m.spoken = false;
  if (cur !== "map") { showLoading(true); try { app.scenes[cur] = await RX.ST[cur](app.assets); } finally { showLoading(false); } await enterScene(app.scenes[cur]); }
  else app.refresh();
}

// ---------- شريط الأدوات السفلي (مقبض الزمن في السبورة) ----------
function tool(sc) {
  const el = $("#tool"); let h = "";
  if (sc.id === "failaka" && !UI.immersive()) {
    const s = T().stations.failaka;
    h = `<div class="slider"><span>${s.now}</span><input id="tslider" type="range" min="0" max="1000" value="${Math.round(sc.time * 1000)}"><span>${s.then}</span></div>`;
  }
  const hint = sc.toolHint && sc.toolHint();
  if (hint && !h) h = `<div class="thint">${hint}</div>`;
  el.innerHTML = h; el.classList.toggle("on", !!h);
  const r = $("#tslider"); if (r) r.oninput = () => sc.setTime(r.value / 1000);
}
app.syncSlider = t => { const r = $("#tslider"); if (r && document.activeElement !== r) r.value = Math.round(t * 1000); };

// ---------- الشريط العلوي ----------
function buildHUD() {
  const t = T();
  $("#hud").innerHTML = `<div class="brand"><img src="${app.assets.img.logo}" alt=""><div><b>${t.app}</b><small>${t.appSub}</small></div></div>
    <div class="prog" id="prog"></div>
    <div class="btns">
      <button id="bMap">${t.map}</button><button id="bPass">${t.passport}</button>
      <button id="bVR" class="vr" hidden>${t.enterVR}</button>
      <button id="bLang">${app.lang === "ar" ? "EN" : "ع"}</button><button id="bSet" aria-label="${t.settings}">⚙</button>
    </div>`;
  $("#bMap").onclick = () => app.goMap();
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
    const done = app.state.stamps[id], open = app.isOpen(id);
    return `<button class="pd ${done ? "done" : ""} ${open ? "open" : ""} ${cur === id ? "cur" : ""} ${T().stations[id].env}" data-id="${id}" title="${T().stations[id].title}">${done ? "✓" : U.num(i + 1)}</button>`;
  }).join("");
  p.querySelectorAll(".pd").forEach(b => b.onclick = () => app.goStation(b.dataset.id));
  const vr = $("#bVR"); if (vr) vr.hidden = !E.xrSupported;
  const hint = $("#hint"); if (hint) hint.textContent = E.mode === "board" ? T().dragHint : E.mode === "tablet" ? T().gyroHint : E.mode === "cardboard" ? T().gazeHint : "";
}
function onMode(m) {
  document.body.dataset.mode = m;
  if (E.scene) { UI.attach3D(E.scene); app.refresh(); }
}
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
    <div class="cred"><b>${t.credits}</b>${t.credText.map(x => `<p>${x}</p>`).join("")}<p>${t.exag}.</p></div>
    <div class="row end"><button class="btn" id="sReset">${t.reset}</button><button class="btn pri" id="sClose">${t.close}</button></div>
  </div>`;
  el.classList.add("on");
  el.querySelectorAll("[data-m]").forEach(b => b.onclick = async () => { settings(false); if (b.dataset.m === "xr") E.enterXR(); else { E.setMode(b.dataset.m); if (b.dataset.m === "cardboard") goFullscreen(); } });
  $("#sSound").onchange = e => RX.A.setOn(e.target.checked);
  $("#sVoice").onchange = e => { RX.A.voice = e.target.checked; if (!RX.A.voice) RX.A.stopVoice(); };
  $("#sUnlock").onchange = e => { st.unlockAll = e.target.checked; app.save(); if (app.scenes.map) app.scenes.map.pinsDirty = true; if (st.unlockAll) st.startDone = true; app.refresh(); };
  $("#sLang").onclick = () => switchLang();
  $("#sReset").onclick = () => resetAll();
  $("#sClose").onclick = () => settings(false);
}

window.addEventListener("load", () => app.boot().catch(e => { console.error(e); const l = document.querySelector("#intro .in-load"); if (l) l.textContent = "⚠ " + e.message; }));
})();
