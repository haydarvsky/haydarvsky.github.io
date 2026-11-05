// المحرّك: العارض، الكاميرا، طرق العرض الأربع، التفاعل، الصوت، أدوات الرسم على اللوحة
(function () {
const E = RX.E = {};
const V3 = THREE.Vector3;
E.EYE = 1.62;
E.mode = "board";              // board | tablet | cardboard | xr
E.yaw = 0; E.pitch = 0;        // نظر المستخدم في السبورة/اللوحي
E.listeners = [];
E.interactives = [];
E.time = 0;

E.init = function (canvas) {
  const r = E.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.setSize(window.innerWidth, window.innerHeight, false);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.xr.enabled = true; r.xr.setReferenceSpaceType("local-floor");
  E.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 40000);
  E.dolly = new THREE.Group(); E.dolly.add(E.camera);
  E.stereo = new THREE.StereoCamera(); E.stereo.eyeSep = 0.064;
  E.raycaster = new THREE.Raycaster();
  E.clock = new THREE.Clock();
  // ستارة التلاشي حول الرأس
  E.fader = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x120d08, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  E.fader.renderOrder = 9999; E.camera.add(E.fader);
  // مؤشّر النظر (للكرتون)
  const rg = new THREE.Group();
  const ringBg = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.016, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false }));
  const ringFill = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.016, 32, 1, Math.PI / 2, 0.0001), new THREE.MeshBasicMaterial({ color: 0xB3312A, depthTest: false }));
  rg.add(ringBg, ringFill); rg.position.z = -1; rg.visible = false; rg.renderOrder = 9998;
  ringBg.renderOrder = ringFill.renderOrder = 9998;
  E.camera.add(rg); E.reticle = rg; E.reticleFill = ringFill;
  setupPointer(canvas);
  setupXR();
  window.addEventListener("resize", E.resize);
  r.setAnimationLoop(loop);
};

E.resize = function () {
  const w = window.innerWidth, h = window.innerHeight;
  E.renderer.setSize(w, h, false);
  E.camera.aspect = w / h; E.camera.updateProjectionMatrix();
};

// ---------- المشاهد ----------
E.scene = null;
E.setScene = function (sc) {
  if (E.scene && E.scene.root) E.scene.root.remove(E.dolly);
  E.scene = sc;
  sc.root.add(E.dolly);
  E.interactives = sc.interactives || (sc.interactives = []);
  E.placeView();
};
E.placeView = function () {
  const v = E.scene.view;
  E.dolly.position.copy(v.pos);
  E.dolly.rotation.set(0, 0, 0);
  E.yaw = v.yaw; E.pitch = v.pitch || 0;
  if (E.mode === "xr") { E.dolly.rotation.y = v.yaw; }
  E.gyroYawOffset = null;
};
E.on = function (fn) { E.listeners.push(fn); };

// ---------- التلاشي ----------
E.fade = function (to, ms) {
  return new Promise(res => {
    const m = E.fader.material, from = m.opacity, t0 = performance.now();
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / ms);
      m.opacity = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step); else res();
    })();
  });
};

// ---------- التفاعل ----------
E.addInteractive = function (obj, opts) {
  obj.userData.ia = opts; opts.obj = obj;
  obj.traverse(o => { o.userData.iaRoot = obj; });
  (E.scene && E.scene.interactives === E.interactives ? E.interactives : (opts.scene ? opts.scene.interactives : E.interactives)).push(obj);
  return obj;
};
E.addTo = function (scene, obj, opts) {
  obj.userData.ia = opts; opts.obj = obj;
  obj.traverse(o => { o.userData.iaRoot = obj; });
  (scene.interactives || (scene.interactives = [])).push(obj);
  return obj;
};
E.removeInteractive = function (scene, obj) {
  const a = scene.interactives; const i = a.indexOf(obj); if (i >= 0) a.splice(i, 1);
};
function pick(ray, only) {
  E.raycaster.ray.copy(ray);
  E.raycaster.camera = E.mode === "xr" ? E.renderer.xr.getCamera(E.camera) : E.camera;
  E.raycaster.far = 30000;
  const list = only ? [only] : E.interactives.filter(o => o.visible && o.userData.ia && !o.userData.ia.disabled && visibleUp(o));
  const hits = E.raycaster.intersectObjects(list, true);
  for (const h of hits) {
    const root = h.object.userData.iaRoot; if (!root) continue;
    if (!visibleUp(h.object)) continue;
    h.root = root; h.ia = root.userData.ia;
    if (h.ia.regionAt) h.region = h.ia.regionAt(h);
    return h;
  }
  return null;
}
E.pick = pick;
function visibleUp(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

// المؤشّر: فأرة/لمس (السبورة واللوحي)
const P = { down: false, look: null, drag: null, hover: null, x: 0, y: 0, moved: 0 };
function rayFromScreen(x, y) {
  const r = new THREE.Ray();
  const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  E.raycaster.setFromCamera(ndc, E.camera);
  r.copy(E.raycaster.ray); return r;
}
function setupPointer(cv) {
  cv.addEventListener("pointerdown", e => {
    if (E.mode === "cardboard" && gyro && gyro.ok) return;
    RX.A && RX.A.unlock();
    cv.setPointerCapture(e.pointerId);
    P.down = true; P.x = e.clientX; P.y = e.clientY; P.moved = 0;
    const h = pick(rayFromScreen(e.clientX, e.clientY));
    P.downHit = h;
    if (h && h.ia.onDrag) { P.drag = h; h.ia.onDrag(h, "start"); }
    else P.look = { x: e.clientX, y: e.clientY, yaw: E.yaw, pitch: E.pitch };
  });
  cv.addEventListener("pointermove", e => {
    if (E.mode === "cardboard" && gyro && gyro.ok) return;
    const dx = e.clientX - P.x, dy = e.clientY - P.y;
    if (P.down) P.moved = Math.max(P.moved, Math.hypot(dx, dy));
    if (P.drag) {
      const h = pick(rayFromScreen(e.clientX, e.clientY), P.drag.root);
      P.drag.ia.onDrag(h, "move");
    } else if (P.look) {
      const k = (E.camera.fov / window.innerHeight) * Math.PI / 180;
      E.yaw = P.look.yaw + (e.clientX - P.look.x) * k * (E.scene && E.scene.dragSign || 1);
      E.pitch = Math.max(-1.35, Math.min(1.2, P.look.pitch + (e.clientY - P.look.y) * k));
    } else {
      setHover(pick(rayFromScreen(e.clientX, e.clientY)));
    }
  });
  const up = e => {
    if (E.mode === "cardboard" && gyro && gyro.ok) return;
    if (P.drag) { P.drag.ia.onDrag(null, "end"); }
    else if (P.downHit && P.moved < 8) {
      const h = pick(rayFromScreen(e.clientX, e.clientY));
      if (h && h.root === P.downHit.root && h.ia.onSelect) { h.ia.onSelect(h); RX.A && RX.A.sfx("click"); }
    }
    P.down = false; P.look = null; P.drag = null; P.downHit = null;
  };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => {
    if (E.mode !== "board") return;
    e.preventDefault();
    E.camera.fov = Math.max(28, Math.min(80, E.camera.fov + e.deltaY * 0.03)); E.camera.updateProjectionMatrix();
  }, { passive: false });
}
function setHover(h) {
  const prev = P.hover;
  const same = prev && h && prev.root === h.root && prev.region === h.region;
  if (!same) {
    if (prev && prev.ia.onHover) prev.ia.onHover(false, prev);
    if (h && h.ia.onHover) h.ia.onHover(true, h);
  } else if (h && h.ia.onHoverMove) h.ia.onHoverMove(h);
  P.hover = h;
  E.renderer.domElement.style.cursor = h ? (h.ia.onDrag ? "crosshair" : "pointer") : (P.look ? "grabbing" : "grab");
}

// ---------- الواقع الافتراضي WebXR ----------
E.xrSupported = false;
function setupXR() {
  if (navigator.xr && navigator.xr.isSessionSupported) {
    navigator.xr.isSessionSupported("immersive-vr").then(ok => { E.xrSupported = ok; E.listeners.forEach(f => f("xr-support", ok)); }).catch(() => {});
  }
  E.controllers = [];
  for (let i = 0; i < 2; i++) {
    const c = E.renderer.xr.getController(i);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(0, 0, 0), new V3(0, 0, -1)]),
      new THREE.LineBasicMaterial({ color: 0xFFF3D6, transparent: true, opacity: 0.8 }));
    line.scale.z = 3; c.add(line);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: 0xB3312A }));
    c.add(dot); dot.visible = false;
    c.userData = { line, dot, hover: null, drag: null, pressed: null };
    c.addEventListener("selectstart", () => {
      RX.A && RX.A.unlock();
      const h = c.userData.hover;
      if (h && h.ia.onDrag) { c.userData.drag = h; h.ia.onDrag(h, "start"); }
      else c.userData.pressed = h;
    });
    c.addEventListener("selectend", () => {
      if (c.userData.drag) { c.userData.drag.ia.onDrag(null, "end"); c.userData.drag = null; return; }
      const p = c.userData.pressed, h = c.userData.hover;
      if (p && h && p.root === h.root && h.ia.onSelect) { h.ia.onSelect(h); RX.A && RX.A.sfx("click"); }
      c.userData.pressed = null;
    });
    c.addEventListener("squeezestart", () => { E.listeners.forEach(f => f("recenter")); });
    c.addEventListener("connected", e => { c.userData.src = e.data; c.visible = e.data.targetRayMode !== "gaze"; });
    c.addEventListener("disconnected", () => { c.visible = false; });
    E.dolly.add(c); E.controllers.push(c);
  }
}
E.enterXR = async function () {
  if (!navigator.xr) return false;
  try {
    const s = await navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"] });
    await E.renderer.xr.setSession(s);
    E.prevMode = E.mode; E.setMode("xr");
    s.addEventListener("end", () => { E.setMode(E.prevMode === "xr" ? "board" : E.prevMode); });
    return true;
  } catch (e) { console.warn(e); return false; }
};
E.setMode = function (m) {
  E.mode = m;
  E.reticle.visible = (m === "cardboard");
  if (m !== "xr") { E.dolly.rotation.set(0, 0, 0); E.camera.position.set(0, 0, 0); }
  if (m === "tablet" || m === "cardboard") startGyro(); else stopGyro();
  if (E.scene) E.placeView();
  E.resize();
  E.listeners.forEach(f => f("mode", m));
};

// ---------- الجيروسكوب (اللوحي والكرتون) ----------
let gyro = null;
function startGyro() {
  if (gyro) return;
  gyro = { alpha: 0, beta: 90, gamma: 0, orient: 0, ok: false };
  const h = e => { if (e.alpha == null) return; gyro.alpha = e.alpha; gyro.beta = e.beta; gyro.gamma = e.gamma; gyro.ok = true; };
  const o = () => { gyro.orient = (screen.orientation && screen.orientation.angle) || window.orientation || 0; };
  gyro.h = h; gyro.o = o; o();
  const go = () => { window.addEventListener("deviceorientation", h); window.addEventListener("orientationchange", o); };
  if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
    DeviceOrientationEvent.requestPermission().then(r => { if (r === "granted") go(); }).catch(go);
  } else go();
}
function stopGyro() {
  if (!gyro) return;
  window.removeEventListener("deviceorientation", gyro.h); window.removeEventListener("orientationchange", gyro.o); gyro = null;
}
const zee = new V3(0, 0, 1), euler = new THREE.Euler(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
function gyroQuat(out) {
  const a = THREE.MathUtils.degToRad(gyro.alpha), b = THREE.MathUtils.degToRad(gyro.beta), g = THREE.MathUtils.degToRad(gyro.gamma), o = THREE.MathUtils.degToRad(gyro.orient);
  euler.set(b, a, -g, "YXZ"); out.setFromEuler(euler); out.multiply(q1); out.multiply(q0.setFromAxisAngle(zee, -o));
  return out;
}

// ---------- الحلقة ----------
const tmpQ = new THREE.Quaternion(), yawQ = new THREE.Quaternion(), yAxis = new V3(0, 1, 0);
let gazeT = 0, gazeKey = null;
function loop() {
  const dt = Math.min(0.1, E.clock.getDelta()); E.time += dt;
  const cam = E.camera;
  if (E.mode === "board" || (E.mode === "tablet" && !(gyro && gyro.ok))) {
    cam.position.set(0, E.EYE, 0);
    cam.rotation.set(E.pitch, E.yaw, 0, "YXZ");
  } else if ((E.mode === "tablet" || E.mode === "cardboard") && gyro && gyro.ok) {
    gyroQuat(tmpQ);
    if (E.gyroYawOffset == null) {   // اجعل الاتجاه الحالي للجهاز = اتجاه المشهد الابتدائي
      const fw = new V3(0, 0, -1).applyQuaternion(tmpQ); E.gyroYawOffset = E.scene.view.yaw - Math.atan2(-fw.x, -fw.z);
    }
    yawQ.setFromAxisAngle(yAxis, E.gyroYawOffset + (E.yaw - E.scene.view.yaw));
    cam.quaternion.copy(yawQ).multiply(tmpQ);
    cam.position.set(0, E.EYE, 0);
  } else if (E.mode === "cardboard") {
    cam.position.set(0, E.EYE, 0); cam.rotation.set(E.pitch, E.yaw, 0, "YXZ");
  }
  // تحديث المشهد
  if (E.scene && E.scene.update) E.scene.update(dt, E.time);
  E.listeners.forEach(f => f("frame", dt));
  // نظر الكرتون
  if (E.mode === "cardboard" && E.scene) {
    const r = new THREE.Ray(); cam.getWorldPosition(r.origin); cam.getWorldDirection(r.direction);
    const h = pick(r);
    setHover(h);
    const key = h ? (h.root.id + ":" + (h.region || "")) : null;
    if (h && h.ia.onDrag) { h.ia.onDrag(h, gazeKey === key ? "move" : "start"); gazeT = 0; }
    else if (h && h.ia.onSelect && (!h.ia.regionAt || h.region)) {
      gazeT = key === gazeKey ? gazeT + dt : 0;
      if (gazeT > 1.25) { h.ia.onSelect(h); RX.A && RX.A.sfx("click"); gazeT = -0.8; }
    } else gazeT = 0;
    gazeKey = key;
    const k = Math.max(0, Math.min(1, gazeT / 1.25));
    E.reticleFill.geometry.dispose();
    E.reticleFill.geometry = new THREE.RingGeometry(0.010, 0.016, 32, 1, Math.PI / 2, Math.max(0.0001, k * Math.PI * 2));
    E.reticle.scale.setScalar(h ? 1.25 : 1);
  }
  // يدا النظارة
  if (E.mode === "xr") {
    for (const c of E.controllers) {
      if (!c.visible) continue;
      const r = new THREE.Ray(); c.getWorldPosition(r.origin);
      r.direction.set(0, 0, -1).applyQuaternion(c.getWorldQuaternion(tmpQ));
      const ud = c.userData;
      if (ud.drag) { const h = pick(r, ud.drag.root); ud.drag.ia.onDrag(h, "move"); if (h) { ud.dot.visible = true; ud.dot.position.set(0, 0, -h.distance); ud.line.scale.z = h.distance; } continue; }
      const h = pick(r);
      if (!(ud.hover && h && ud.hover.root === h.root && ud.hover.region === h.region)) {
        if (ud.hover && ud.hover.ia.onHover) ud.hover.ia.onHover(false, ud.hover);
        if (h && h.ia.onHover) h.ia.onHover(true, h);
      }
      ud.hover = h;
      ud.dot.visible = !!h; ud.line.scale.z = h ? h.distance : 4;
      if (h) ud.dot.position.set(0, 0, -h.distance);
    }
  }
  render();
}
const size = new THREE.Vector2();
function render() {
  const r = E.renderer, sc = E.scene; if (!sc) return;
  if (E.mode === "cardboard") {
    r.getSize(size);
    E.camera.updateMatrixWorld();
    E.stereo.aspect = 0.5; E.stereo.update(E.camera);
    r.setScissorTest(true);
    r.setScissor(0, 0, size.x / 2, size.y); r.setViewport(0, 0, size.x / 2, size.y); r.render(sc.root, E.stereo.cameraL);
    r.setScissor(size.x / 2, 0, size.x / 2, size.y); r.setViewport(size.x / 2, 0, size.x / 2, size.y); r.render(sc.root, E.stereo.cameraR);
    r.setScissorTest(false); r.setViewport(0, 0, size.x, size.y);
  } else {
    const sh = (E.mode === "board" || E.mode === "tablet") ? (E.viewShift || 0) : 0;
    if (sh) { r.getSize(size); E.camera.setViewOffset(size.x, size.y, sh, 0, size.x, size.y); }
    else if (E.camera.view && E.camera.view.enabled) E.camera.clearViewOffset();
    r.render(sc.root, E.camera);
  }
}

// اتجاه نظر المستخدم الحالي (زاوية أفقية) — لوضع اللوحات أمامه
E.headYaw = function () {
  const c = E.mode === "xr" ? E.renderer.xr.getCamera(E.camera) : E.camera;
  const d = new V3(); c.getWorldDirection(d);
  return Math.atan2(-d.x, -d.z);
};
E.headPos = function () {
  const c = E.mode === "xr" ? E.renderer.xr.getCamera(E.camera) : E.camera;
  const p = new V3(); c.getWorldPosition(p); return p;
};
})();

// ---------- أدوات الرسم والنص ----------
(function () {
const U = RX.U = {};
U.FONT = "'SS', 'Sakkal Saad', 'Geeza Pro', 'Noto Naskh Arabic', serif";
U.C = { paper: "#FBF7EE", ink: "#172338", brown: "#22375A", sand: "#E7E0CF", sand2: "#D3C7AE", red: "#0F6B6B", green: "#2E7D55", blue: "#2C6E8F", gold: "#B98E2E", mute: "#6C7385", bad: "#A6362B", anfus: "#A8473A", afaq: "#2A6F8F" };
U.QFONT = "'QF', 'Amiri Quran', serif";
// رقم الآية المزخرف: ٥٣ داخل علامة نهاية الآية
U.ayah = k => "\u06DD" + String(k.split(":")[1]).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
U.lang = () => RX.app ? RX.app.lang : "ar";
U.T = () => RX.TEXT[U.lang()];
U.num = s => U.lang() === "ar" ? String(s).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]) : String(s);
U.isAr = s => /[؀-ۿ]/.test(s);
// لفّ النص على أسطر
U.wrap = function (ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur); return lines;
};
// لافتة نصية ثلاثية الأبعاد (Sprite) بخلفية كبسولة
U.label = function (text, o = {}) {
  const fs = o.size || 44, pad = o.pad == null ? fs * 0.45 : o.pad;
  const cv = document.createElement("canvas"); const ctx = cv.getContext("2d");
  const font = `${o.weight || 700} ${fs}px ${U.FONT}`; ctx.font = font;
  const lines = String(text).split("\n");
  const sub = o.sub ? String(o.sub) : null; const sfs = fs * 0.62;
  let w = Math.max(...lines.map(l => ctx.measureText(l).width));
  if (sub) { ctx.font = `600 ${sfs}px ${U.FONT}`; w = Math.max(w, ctx.measureText(sub).width); }
  const dot = o.dot ? fs * 0.75 : 0;
  const W = Math.ceil(w + pad * 2 + (dot ? dot + fs * 0.35 : 0)), H = Math.ceil(lines.length * fs * 1.25 + (sub ? sfs * 1.3 : 0) + pad * 1.2);
  cv.width = W * 2; cv.height = H * 2; ctx.scale(2, 2);
  if (o.bg !== false) {
    ctx.fillStyle = o.bg || "rgba(255,252,244,0.94)"; ctx.strokeStyle = o.stroke || U.C.brown; ctx.lineWidth = o.lw || 3;
    const rr = Math.min(H / 2, fs * 0.6); rrect(ctx, 2, 2, W - 4, H - 4, o.square ? 10 : rr); ctx.fill(); if (o.lw !== 0) ctx.stroke();
  }
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  const cx = (W + (U.isAr(text) ? -dot : dot) * 0) / 2;
  let y = pad * 0.6 + fs * 0.62;
  ctx.fillStyle = o.color || U.C.ink; ctx.font = font; ctx.direction = U.isAr(text) ? "rtl" : "ltr";
  const tx = dot ? (U.isAr(text) ? (W - dot - fs * 0.35) / 2 : (W + dot + fs * 0.35) / 2) : W / 2;
  for (const l of lines) { ctx.fillText(l, tx, y); y += fs * 1.25; }
  if (sub) { ctx.font = `600 ${sfs}px ${U.FONT}`; ctx.fillStyle = o.subColor || U.C.mute; ctx.direction = U.isAr(sub) ? "rtl" : "ltr"; ctx.fillText(sub, tx, y - fs * 0.2); }
  if (dot) {
    ctx.fillStyle = o.dot; const dx = U.isAr(text) ? W - pad - dot / 2 : pad + dot / 2;
    ctx.beginPath(); ctx.arc(dx, H / 2, dot / 2, 0, Math.PI * 2); ctx.fill();
    if (o.dotText) { ctx.fillStyle = "#fff"; ctx.font = `800 ${fs * 0.6}px ${U.FONT}`; ctx.fillText(o.dotText, dx, H / 2 + 2); }
  }
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: o.depthTest !== false, transparent: true, sizeAttenuation: o.attenuate !== false });
  const sp = new THREE.Sprite(mat);
  const hh = o.height || 0.1; sp.scale.set(hh * W / H, hh, 1);
  sp.center.set(0.5, o.anchorBottom ? 0 : 0.5);
  sp.renderOrder = o.renderOrder || 10;
  sp.userData.aspect = W / H;
  return sp;
};
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
U.rrect = rrect;
// نسيج إجرائي بالضجيج
U.noiseCanvas = function (w, h, fn) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const ctx = cv.getContext("2d");
  const id = ctx.createImageData(w, h); fn(id.data, w, h); ctx.putImageData(id, 0, 0); return cv;
};
U.rand = (function () { let s = 1234567; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
U.loadImage = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
U.tween = function (ms, fn, ease) {
  ease = ease || (k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  return new Promise(res => { const t0 = performance.now(); (function s() { const k = Math.min(1, (performance.now() - t0) / ms); fn(ease(k)); if (k < 1) requestAnimationFrame(s); else res(); })(); });
};
U.wait = ms => new Promise(r => setTimeout(r, ms));
// تحويل خط الطول/العرض إلى إحداثيات محلية بالمتر حول نقطة
U.ll2local = function (lat0, lon0, lat, lon) {
  return { x: (lon - lon0) * 111320 * Math.cos(lat0 * Math.PI / 180), z: -(lat - lat0) * 110574 };
};
})();
