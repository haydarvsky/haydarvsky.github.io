// بوابة الآية (البداية) وميزان التفسير (الختام): ساحةٌ عند الفجر، بوابتا الآفاق والأنفس، ولوح الآية
(function () {
const G = RX.GATE = {};
const U = RX.U, C = U.C, W = RX.W, E = RX.E;
const V3 = THREE.Vector3;

// نقش هندسي (نجمة ثمانية) للأرضية والإطارات
function girih(size, bg, line, n) {
  const cv = document.createElement("canvas"); cv.width = cv.height = size; const c = cv.getContext("2d");
  c.fillStyle = bg; c.fillRect(0, 0, size, size);
  const s = size / n; c.strokeStyle = line; c.lineWidth = size / 220;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const cx = (i + 0.5) * s, cy = (j + 0.5) * s, r = s * 0.46, r2 = s * 0.2;
    c.beginPath();
    for (let k = 0; k <= 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? r2 / Math.cos(Math.PI / 8) * 0.95 : r; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    c.stroke();
    c.beginPath(); c.arc(cx, cy, r2 * 0.55, 0, 7); c.stroke();
    c.strokeRect(i * s, j * s, s, s);
  }
  const id = c.getImageData(0, 0, size, size); const d = id.data;
  for (let k = 0; k < d.length; k += 4) { const v = (Math.random() - 0.5) * 14; d[k] += v; d[k + 1] += v; d[k + 2] += v; }
  c.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
// قوسٌ مدبّب: إطار حجري بفتحة
function arch(w, h, ow, oh, depth, mat) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  const hole = new THREE.Path(); const sp = oh - ow * 0.62;   // بداية التقويس
  hole.moveTo(-ow / 2, 0); hole.lineTo(-ow / 2, sp);
  hole.quadraticCurveTo(-ow / 2, sp + ow * 0.42, 0, oh);
  hole.quadraticCurveTo(ow / 2, sp + ow * 0.42, ow / 2, sp);
  hole.lineTo(ow / 2, 0); hole.closePath(); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, mat);
}
// لوح نصّي (كنفس) على مستطيل
function tablet(drawFn, wpx, hpx, wm) {
  const cv = document.createElement("canvas"); cv.width = wpx; cv.height = hpx; const c = cv.getContext("2d"); drawFn(c, wpx, hpx);
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wm, wm * hpx / wpx), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  m.userData.redraw = fn => { c.clearRect(0, 0, wpx, hpx); (fn || drawFn)(c, wpx, hpx); t.needsUpdate = true; };
  return m;
}
function frame(c, w, h, r, fill, stroke, lw) { c.fillStyle = fill; U.rrect(c, lw, lw, w - lw * 2, h - lw * 2, r); c.fill(); c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }

G.build = async function (assets) {
  const T = U.T(), ar = U.lang() === "ar";
  const root = new THREE.Scene();
  const hor = new THREE.Color(0xE9C7A0);
  root.background = hor; root.fog = new THREE.Fog(hor, 40, 380);
  const sc = { id: "gate", root, interactives: [], view: { pos: new V3(0, 0, 2.6), yaw: 0, pitch: 0.02, panelDist: 1.35 } };
  // السماء والنجوم
  const sky = W.sky({ zenith: 0x1C2E52, horizon: 0xE9C7A0 }); root.add(sky);
  const sg = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 1400; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2; const y = Math.abs(u) * 0.9 + 0.1; const r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 2500, y * 2500, Math.sin(a) * r * 2500); }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xFFF6E0, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false }));
  root.add(stars);
  // الإضاءة
  root.add(new THREE.HemisphereLight(0xE9E2FF, 0x8A6F52, 0.7));
  const sun = new THREE.DirectionalLight(0xFFD9A8, 0.85); sun.position.set(-30, 18, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 }); sun.shadow.bias = -0.0008;
  root.add(sun); root.add(sun.target);
  // الأرض: رمل بعيد + ساحة منقوشة
  const sandT = new THREE.CanvasTexture(W.groundCanvas(0xD3B48A, "sand")); sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(120, 120);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const floorT = girih(1024, "#D9C5A0", "rgba(120,92,60,0.55)", 6); floorT.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 72), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.012; floor.receiveShadow = true; root.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(10, 0.12, 8, 96), new THREE.MeshStandardMaterial({ color: 0x8C6B45, roughness: 0.8 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.04; root.add(rim);
  // البوابتان
  const stoneT = W.texStone(0xD8BD92, "#B79C72", 96, 48); stoneT.repeat.set(0.6, 0.6);
  const stoneM = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9 });
  const sideAfaq = ar ? 1 : -1;
  sc.gates = {};
  [["afaq", sideAfaq], ["anfus", -sideAfaq]].forEach(([k, sd]) => {
    const g = new THREE.Group(); g.position.set(sd * 3.5, 0, -6.6); g.rotation.y = -sd * 0.42; root.add(g);
    const a = arch(3.1, 4.7, 1.95, 3.7, 0.7, stoneM); W.cast(a); g.add(a);
    // شريط زخرفي فوق الفتحة
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.32, 0.78), new THREE.MeshStandardMaterial({ map: girih(512, k === "afaq" ? "#2A6F8F" : "#A8473A", "rgba(255,240,210,0.7)", 4), roughness: 0.6 }));
    band.position.y = 4.55; g.add(band);
    // لوح اسم الجناح
    const lab = tablet((c, w, h) => { frame(c, w, h, 40, "rgba(23,35,56,0.92)", "#C49A3A", 10); c.fillStyle = "#F6E7C3"; c.font = `800 120px ${U.FONT}`; c.textAlign = "center"; c.direction = ar ? "rtl" : "ltr"; c.fillText(T.wings[k], w / 2, h * 0.68); }, 1024, 240, 2.3);
    lab.position.set(0, 5.15, 0.42); g.add(lab);
    // ما خلف الفتحة: الآفاق سماءٌ وأفق، والأنفس بصمةٌ مضيئة
    if (k === "anfus") {
      const fpT = new THREE.Texture(); U.loadImage(assets.img.fp_whorl).then(im => { fpT.image = im; fpT.needsUpdate = true; });
      const fp = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshBasicMaterial({ map: fpT, color: 0xF3E3C0 }));
      fp.position.set(0, 3.05, -0.36); g.add(fp);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.035, 8, 48), new THREE.MeshStandardMaterial({ color: 0xC49A3A, metalness: 0.5, roughness: 0.35 })); ring.position.copy(fp.position); g.add(ring);
    }
    // مصباحان
    for (const s2 of [-1, 1]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshBasicMaterial({ color: 0xFFD58A })); lamp.position.set(s2 * 1.25, 2.45, 0.5); g.add(lamp);
      const pl = new THREE.PointLight(0xFFC070, 0.5, 5); pl.position.copy(lamp.position); g.add(pl);
    }
    // خانات البطاقات داخل الفتحة
    g.userData.slots = k === "afaq" ? [[-0.43, 0.85], [0.43, 0.85], [-0.43, 1.62], [0.43, 1.62]] : [[0, 1.3]];
    g.userData.used = 0; g.userData.k = k;
    sc.gates[k] = g;
    E.addTo(sc, g, { onSelect: () => sc.onGate && sc.onGate(k), onHover: on => band.material.emissive && band.material.emissive.setHex(on ? 0x332211 : 0) });
  });
  // لوح الآية بخط المصحف
  const V = assets.verses["41:53"];
  const vt = tablet((c, w, h) => {
    frame(c, w, h, 60, "rgba(23,35,56,0.95)", "#C49A3A", 14);
    c.strokeStyle = "rgba(196,154,58,0.55)"; c.lineWidth = 4; U.rrect(c, 40, 40, w - 80, h - 80, 40); c.stroke();
    c.fillStyle = "#F7EBCF"; c.direction = "rtl"; c.textAlign = "center"; c.font = `88px ${U.QFONT}`;
    const lines = U.wrap(c, "﴿" + V.ar + " " + U.ayah("41:53") + "﴾", w - 220);
    lines.forEach((l, i) => c.fillText(l, w / 2, 190 + i * 150));
    c.fillStyle = "#C49A3A"; c.font = `800 46px ${U.FONT}`; c.direction = ar ? "rtl" : "ltr"; c.fillText(T.stations.gate.ref, w / 2, h - 70);
  }, 2048, 720, 4.6);
  vt.position.set(0, 2.85, -8.6); root.add(vt);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.9, 1.75, 0.3), stoneM); plinth.position.set(0, 2.85, -8.8); W.cast(plinth); root.add(plinth);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.0, 0.25), stoneM); legs.position.set(0, 1.0, -8.8); W.cast(legs); root.add(legs);
  // بطاقات المحطات الخمس على حامل
  sc.cards = {};
  const rack = new THREE.Group(); rack.position.set(0, 0, -2.5); root.add(rack); sc.rack = rack;
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.06, 0.42), new THREE.MeshStandardMaterial({ color: 0x3A2A1C, roughness: 0.7 })); shelf.position.y = 0.86; W.cast(shelf); rack.add(shelf);
  for (const s2 of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.86, 0.06), shelf.material); l.position.set(s2 * 1.38, 0.43, 0); rack.add(l); }
  for (let i = 0; i < RX.ORDER.length; i++) {
    const id = RX.ORDER[i];
    const im = await U.loadImage(assets.img["card_" + id]);
    const m = tablet((c, w, h) => {
      frame(c, w, h, 26, "#FBF7EE", "#22375A", 8);
      c.save(); U.rrect(c, 22, 22, w - 44, 300, 16); c.clip(); c.drawImage(im, 22, 22, w - 44, 300); c.restore();
      c.fillStyle = "#172338"; c.font = `800 50px ${U.FONT}`; c.textAlign = "center"; c.direction = ar ? "rtl" : "ltr"; c.fillText(T.stations.gate.cards[id], w / 2, 384);
    }, 512, 420, 0.5);
    const x = (ar ? 1 : -1) * (1.1 - i * 0.55);
    m.position.set(x, 1.1, 0.0); m.rotation.x = -0.38; rack.add(m);
    m.userData.home = m.position.clone(); m.userData.id = id;
    sc.cards[id] = m;
    E.addTo(sc, m, { onSelect: () => sc.onCard && sc.onCard(id), onHover: on => { if (!m.userData.placed) m.scale.setScalar(on ? 1.06 : 1); } });
  }
  sc.ambience = { wind: 0.25 };
  sc.update = function (dt, t) {
    stars.material.opacity = 0.65 + 0.2 * Math.sin(t * 0.7);
    if (sc.sel && sc.cards[sc.sel] && !sc.cards[sc.sel].userData.placed) { const m = sc.cards[sc.sel]; m.position.y = m.userData.home.y + 0.06 + Math.sin(t * 4) * 0.015; }
    if (sc.balance) sc.balance(dt, t);
  };
  // ---- التصنيف ----
  sc.placeCard = function (id, k) {
    const m = sc.cards[id], g = sc.gates[k]; const slot = g.userData.slots[g.userData.used++];
    m.userData.placed = true;
    const p0 = new V3(); m.getWorldPosition(p0); const q0 = new THREE.Quaternion(); m.getWorldQuaternion(q0);
    rack.remove(m); root.add(m); m.position.copy(p0); m.quaternion.copy(q0);
    const p1 = new V3(slot[0], slot[1], 0.4); g.localToWorld(p1); const q1 = new THREE.Quaternion(); g.getWorldQuaternion(q1);
    return U.tween(900, k2 => { m.position.lerpVectors(p0, p1, k2); m.position.y += Math.sin(k2 * Math.PI) * 0.5; m.quaternion.slerpQuaternions(q0, q1, k2); m.scale.setScalar(1 - 0.22 * k2); });
  };
  sc.shake = function (m) { const x0 = m.position.x; return U.tween(420, k => m.position.x = x0 + Math.sin(k * Math.PI * 6) * 0.03, k => k); };
  return sc;
};

// ---------- ميزان التفسير ----------
G.setupFinal = function (sc, onPlaced) {
  if (sc.F) return sc.F;
  const T = U.T(), f = T.stations.final, ar = U.lang() === "ar", root = sc.root;
  const F = sc.F = { done: 0, sel: null, cards: [], baskets: [], steps: [false, false] };
  sc.rack.visible = false;
  sc.view.pos.set(0, 0, 0.5); sc.view.pitch = -0.18; E.placeView();
  // الطاولة والسلال
  const tbl = new THREE.Group(); tbl.position.set(0, 0, -3.3); root.add(tbl);
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 1.0), new THREE.MeshStandardMaterial({ color: 0x3A2A1C, roughness: 0.7 })); top.position.y = 0.78; W.cast(top); tbl.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.07), top.material); l.position.set(sx * 2.7, 0.39, sz * 0.42); tbl.add(l); }
  const weave = (function () { const cv = document.createElement("canvas"); cv.width = cv.height = 256; const c = cv.getContext("2d"); c.fillStyle = "#B98A4E"; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 32) { c.fillStyle = (y / 16) % 2 ? "#9C6F3A" : "#C99A5C"; c.fillRect(x + ((y / 16) % 2) * 16, y, 16, 16); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1); return t; })();
  const cols = [C.gold, C.green, C.blue, C.bad];
  f.baskets.forEach((name, i) => {
    const x = (ar ? 1 : -1) * (2.1 - i * 1.4);
    const b = new THREE.Group(); b.position.set(x, 0.82, 0); tbl.add(b);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.36, 28, 1, true), new THREE.MeshStandardMaterial({ map: weave, roughness: 0.9, side: THREE.DoubleSide }));
    body.position.y = 0.18; W.cast(body); b.add(body);
    const rimB = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 32), new THREE.MeshStandardMaterial({ color: 0x7A5531 })); rimB.rotation.x = Math.PI / 2; rimB.position.y = 0.36; b.add(rimB);
    const lab = U.label(name, { sub: f.basketSub[i], size: 44, height: 0.26, stroke: cols[i], lw: 4 }); lab.position.set(0, 0.86, 0); b.add(lab);
    b.userData.i = i; b.userData.count = 0; F.baskets.push(b);
    E.addTo(sc, b, { onSelect: () => onBasket(i), onHover: on => rimB.material.emissive && rimB.material.emissive.setHex(on ? 0x553300 : 0) });
  });
  // البطاقات الثماني على صفّين
  const rk = new THREE.Group(); rk.position.set(0, 0, -1.95); root.add(rk);
  f.cards.forEach((cd, i) => {
    const m = tablet((c, w, h) => {
      frame(c, w, h, 24, "#FBF7EE", "#22375A", 7);
      c.fillStyle = "#172338"; c.font = `800 46px ${U.FONT}`; c.textAlign = "center"; c.direction = ar ? "rtl" : "ltr";
      const ls = U.wrap(c, cd[0], w - 60); const y0 = h / 2 - (ls.length - 1) * 29 + 14;
      ls.forEach((l, k) => c.fillText(l, w / 2, y0 + k * 58));
    }, 560, 320, 0.62);
    const r = Math.floor(i / 4), cI = i % 4;
    m.position.set((ar ? 1 : -1) * (0.99 - cI * 0.66), 1.42 - r * 0.4, r * 0.14); m.rotation.x = -0.28;
    m.userData.home = m.position.clone(); m.userData.i = i; rk.add(m); F.cards.push(m);
    E.addTo(sc, m, { onSelect: () => { if (m.userData.placed || F.steps[0]) return; F.sel = i; F.cards.forEach(o => o.scale.setScalar(o.userData.placed ? o.scale.x : 1)); m.scale.setScalar(1.1); RX.A.sfx("click"); },
      onHover: on => { if (!m.userData.placed && F.sel !== i) m.scale.setScalar(on ? 1.05 : 1); } });
  });
  // الميزان: يعتدل كلما وُضعت بطاقةٌ في سلّتها
  const bal = new THREE.Group(); bal.position.set(0, 0, -5.4); root.add(bal);
  const brass = new THREE.MeshStandardMaterial({ color: 0xC49A3A, metalness: 0.6, roughness: 0.35 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.6, 16), brass); post.position.y = 1.3; bal.add(post);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.12, 24), brass); base.position.y = 0.06; bal.add(base);
  const beam = new THREE.Group(); beam.position.y = 2.6; bal.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.06), brass); beam.add(bar);
  const pans = [];
  for (const s2 of [-1, 1]) {
    const hang = new THREE.Group(); hang.position.x = s2 * 1.25; beam.add(hang);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), brass); cord.position.y = -0.45; hang.add(cord);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.08, 28), brass); pan.position.y = -0.92; hang.add(pan);
    pans.push(hang);
  }
  W.cast(bal);
  sc.balance = function (dt, t) {
    const want = 0.32 * (1 - F.done / f.cards.length) + Math.sin(t * 1.3) * 0.01 * (1 - F.done / f.cards.length);
    beam.rotation.z += (want - beam.rotation.z) * Math.min(1, dt * 2);
    pans.forEach(p => p.rotation.z = -beam.rotation.z);
    if (F.sel != null) { const m = F.cards[F.sel]; if (!m.userData.placed) m.position.y = m.userData.home.y + 0.04 + Math.sin(t * 4) * 0.012; }
  };
  function onBasket(i) {
    if (F.sel == null || F.steps[0]) { RX.app.toast(f.pick, null, "bad"); return; }
    const m = F.cards[F.sel], cd = f.cards[F.sel];
    if (cd[1] === i) {
      m.userData.placed = true; F.done++; const b = F.baskets[i]; const k = b.userData.count++;
      const p0 = new V3(); m.getWorldPosition(p0); rk.remove(m); root.add(m); m.position.copy(p0);
      const p1 = new V3(0, 0.3 + k * 0.03, 0); b.localToWorld(p1);
      const r0 = m.rotation.x; F.sel = null; RX.A.sfx("ok");
      U.tween(800, q => { m.position.lerpVectors(p0, p1, q); m.position.y += Math.sin(q * Math.PI) * 0.4; m.rotation.x = r0 + (-Math.PI / 2 - r0) * q; m.scale.setScalar(1.1 - 0.55 * q); });
      RX.app.toast("✓ " + f.baskets[i], cd[2]);
      onPlaced && onPlaced(F.done);
    } else {
      RX.A.sfx("bad"); RX.app.toast(f.baskets[i] + (ar ? "؟" : "?"), cd[2], "bad");
      const x0 = m.position.x; U.tween(420, q => m.position.x = x0 + Math.sin(q * Math.PI * 6) * 0.025, q => q);
    }
  }
  return F;
};
})();
