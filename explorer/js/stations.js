// المحطات الخمس: لكل محطة أرضٌ حقيقية ومجسّمات توضيحية ومهمة لا تُحلّ إلا من داخل المشهد
(function () {
const ST = RX.ST = {};
const U = RX.U, C = U.C, W = RX.W, E = RX.E;
const V3 = THREE.Vector3;
const rad = d => d * Math.PI / 180;
const at = (b, d) => ({ x: Math.sin(rad(b)) * d, z: -Math.cos(rad(b)) * d });   // اتجاه (درجة من الشمال) ومسافة
const yawOf = b => -rad(b);

function base(w, id, view) {
  const sc = { id, w, root: w.root, interactives: w.interactives, steps: [], stage: "explore", t: 0 };
  sc.view = Object.assign({ pos: new V3(0, 0, 0), pitch: -0.12 }, view);
  return sc;
}
function farLabel(sc, text, sub, b, dist, hgt, color, opts) {
  const p = at(b, dist); const y = sc.w.groundAt(p.x, p.z);
  const g = W.beacon(text, sub, color, hgt, (opts && opts.labelH) || dist * 0.055); g.position.set(p.x, y, p.z); sc.root.add(g);
  if (opts && opts.onSelect) E.addTo(sc, g, { onSelect: opts.onSelect, onHover: on => g.userData.lab.scale.multiplyScalar(on ? 1.12 : 1 / 1.12) });
  return g;
}
function sign(text, sub, w) {
  const g = new THREE.Group();
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512; const c = cv.getContext("2d");
  const wood = W.texPlain(0x7A5634, 30).image; c.drawImage(wood, 0, 0, 1024, 512);
  c.fillStyle = "rgba(0,0,0,0.12)"; for (let y = 0; y < 512; y += 64) c.fillRect(0, y, 1024, 3);
  c.strokeStyle = "#3A2614"; c.lineWidth = 16; c.strokeRect(8, 8, 1008, 496);
  c.fillStyle = "#FFF6E2"; c.textAlign = "center"; c.direction = U.isAr(text) ? "rtl" : "ltr";
  c.font = `800 120px ${U.FONT}`; c.fillText(text, 512, 230);
  if (sub) { c.font = `700 62px ${U.FONT}`; c.fillStyle = "#F0DDB8"; c.direction = U.isAr(sub) ? "rtl" : "ltr"; c.fillText(sub, 512, 380); }
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 8;
  const bw = w || 1.1;
  const board = new THREE.Mesh(new THREE.BoxGeometry(bw, bw / 2, 0.05), [0, 0, 0, 0, 1, 0].map(k => k ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }) : new THREE.MeshStandardMaterial({ color: 0x5A3D22, roughness: 0.9 })));
  board.position.y = 1.15; g.add(board);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.25, 0.07), new THREE.MeshStandardMaterial({ color: 0x4A321C })); p.position.set(s * bw * 0.38, 0.62, -0.04); g.add(p); }
  return W.cast(g);
}
function pulse(obj, t) { const s = 1 + 0.08 * Math.sin(t * 5); obj.scale.setScalar(s); }
// منصّة مراقبة مرتفعة (تُستعمل في كاظمة والشقايا)
function addLookout(sc, ALT, pitchUp) {
  const plat = new THREE.Group(); plat.position.y = ALT; plat.visible = false; sc.root.add(plat);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 40), new THREE.MeshStandardMaterial({ map: W.texPlain(0x7A5634, 28), roughness: 0.8 })); deck.position.y = -0.06; plat.add(deck);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.03, 8, 48), new THREE.MeshStandardMaterial({ color: 0x3A2614 })); rail.rotation.x = Math.PI / 2; rail.position.y = 0.85; plat.add(rail);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6), rail.material); post.position.set(Math.cos(a) * 1.55, 0.42, Math.sin(a) * 1.55); plat.add(post); }
  const pitch0 = sc.view.pitch;
  sc.lifted = false;
  sc.lift = async function (up) {
    if (up === sc.lifted) return;
    await E.fade(1, 350);
    sc.lifted = up; plat.visible = up;
    sc.view.pos.set(0, up ? ALT : 0, 0); sc.view.pitch = up ? pitchUp : pitch0;
    E.placeView(); RX.UI.placePanel(sc); RX.A.sfx("whoosh");
    await E.fade(0, 600); RX.app.refresh();
  };
}

// =====================================================================
// ١) الصبية — حضارة العُبيد
// =====================================================================
ST.sabiya = async function (assets) {
  const PW = 5, PD = 4, CX = 0, CZ = 4.4, DEP = 0.55;
  const hole = [CX - PW / 2, CZ - PD / 2, CX + PW / 2, CZ + PD / 2];
  const w = await W.buildStation("sabiya", assets, { exag: 1.6, groundColor: 0xCBB188, groundStyle: "sand", hole, nearR: 55, horizon: 0xE6DECD, zenith: 0x6A9CC8 });
  const sc = base(w, "sabiya", { yaw: Math.PI, pitch: -0.33 });
  sc.steps = [false, false];
  const root = sc.root;
  // الحفرة: أرضية وجدران بطبقات التربة
  const soil = W.texPlain(0x8E7254, 24);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshStandardMaterial({ map: soil, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, -DEP, CZ); floor.receiveShadow = true; root.add(floor);
  const strata = (function () { const cv = document.createElement("canvas"); cv.width = 512; cv.height = 64; const c = cv.getContext("2d");
    const cols = ["#C9AE84", "#B2946A", "#9C7E58", "#A88A61", "#8A6E4C"]; let y = 0; let i = 0;
    while (y < 64) { const h = 6 + Math.random() * 14; c.fillStyle = cols[i++ % cols.length]; c.fillRect(0, y, 512, h); y += h; }
    const id = c.getImageData(0, 0, 512, 64); for (let k = 0; k < id.data.length; k += 4) { const n = (Math.random() - .5) * 30; id.data[k] += n; id.data[k + 1] += n; id.data[k + 2] += n; } c.putImageData(id, 0, 0);
    const t = new THREE.CanvasTexture(cv); return t; })();
  const wallM = new THREE.MeshStandardMaterial({ map: strata, roughness: 1, side: THREE.DoubleSide });
  [[CX, CZ - PD / 2, PW, 0], [CX, CZ + PD / 2, PW, Math.PI], [CX - PW / 2, CZ, PD, Math.PI / 2], [CX + PW / 2, CZ, PD, -Math.PI / 2]].forEach(([x, z, l, r]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, DEP), wallM); m.position.set(x, -DEP / 2, z); m.rotation.y = r; m.receiveShadow = true; root.add(m);
  });
  // أساسات منزل مستطيل ثلاثي الأجنحة + فرن
  const brick = W.texStone(0x9F7E57, "#7a5f43", 64, 26); brick.repeat.set(2, 1);
  const brickM = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 });
  const house = new THREE.Group(); house.position.set(CX - 0.25, -DEP, CZ + 0.15); root.add(house);
  const wallH = 0.36, th = 0.28, HL = 3.5, HW = 2.5;
  const seg = (x1, z1, x2, z2) => { const l = Math.hypot(x2 - x1, z2 - z1); const m = new THREE.Mesh(new THREE.BoxGeometry(l + th, wallH, th), brickM);
    m.position.set((x1 + x2) / 2, wallH / 2, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); house.add(m); };
  seg(-HL / 2, -HW / 2, HL / 2, -HW / 2); seg(-HL / 2, HW / 2, -0.35, HW / 2); seg(0.45, HW / 2, HL / 2, HW / 2);
  seg(-HL / 2, -HW / 2, -HL / 2, HW / 2); seg(HL / 2, -HW / 2, HL / 2, HW / 2);
  seg(-HL / 2, -0.42, -0.9, -0.42); seg(-0.4, -0.42, HL / 2, -0.42); seg(-HL / 2, 0.42, 0.2, 0.42); seg(0.75, 0.42, HL / 2, 0.42);
  seg(-0.6, -HW / 2, -0.6, -0.42); seg(0.6, -HW / 2, 0.6, -0.42); seg(0.0, 0.42, 0.0, HW / 2);
  W.cast(house);
  const oven = new THREE.Group(); oven.position.set(CX + 1.85, -DEP, CZ - 1.35); root.add(oven);
  const ovenW = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.3, 24, 1, true), new THREE.MeshStandardMaterial({ map: W.texPlain(0x8C5E3C, 30), roughness: 1, side: THREE.DoubleSide }));
  ovenW.position.y = 0.15; oven.add(ovenW);
  const ash = new THREE.Mesh(new THREE.CircleGeometry(0.33, 24), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 1 })); ash.rotation.x = -Math.PI / 2; ash.position.y = 0.04; oven.add(ash);
  W.cast(oven);
  // خيوط شبكة التنقيب وأوتادها
  const peg = new THREE.MeshStandardMaterial({ color: 0x6b4a2a });
  const line = new THREE.LineBasicMaterial({ color: 0xF4F0E6 });
  const gp = [];
  for (let x = -PW / 2; x <= PW / 2 + 0.01; x += 1) gp.push(new V3(CX + x, 0.06, CZ - PD / 2 - 0.15), new V3(CX + x, 0.06, CZ + PD / 2 + 0.15));
  for (let z = -PD / 2; z <= PD / 2 + 0.01; z += 1) gp.push(new V3(CX - PW / 2 - 0.15, 0.06, CZ + z), new V3(CX + PW / 2 + 0.15, 0.06, CZ + z));
  root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gp), line));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), peg); p.position.set(CX + sx * (PW / 2 + 0.15), 0.12, CZ + sz * (PD / 2 + 0.15)); p.castShadow = true; root.add(p); }
  // كومة الرمل المزاح ودلو
  const heap = new THREE.Mesh(new THREE.SphereGeometry(1.3, 28, 16), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(W.groundCanvas(0xC9AC80, "sand")), roughness: 1 }));
  heap.scale.set(1, 0.32, 0.8); heap.position.set(CX - PW / 2 - 1.8, 0, CZ + 0.6); W.cast(heap); root.add(heap);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.28, 18), new THREE.MeshStandardMaterial({ color: 0x2F5D7C, roughness: 0.6 }));
  bucket.position.set(CX - PW / 2 - 0.55, 0.14, CZ - 1.2); W.cast(bucket); root.add(bucket);
  const sg = sign("بحرة ١ — الصبية", "موقع أثري من حقبة العُبيد", 1.15); sg.position.set(CX + PW / 2 + 0.9, 0, CZ + 1.6); sg.rotation.y = Math.PI + 0.5; root.add(sg);
  sc.signG = sg;
  // الرمل الذي يغطي الموقع (يُمسح)
  const MW_ = 640, MH_ = 512;
  const mcv = document.createElement("canvas"); mcv.width = MW_; mcv.height = MH_; const mctx = mcv.getContext("2d"); mctx.fillStyle = "#fff"; mctx.fillRect(0, 0, MW_, MH_);
  const mtex = new THREE.CanvasTexture(mcv);
  const sandTex = new THREE.CanvasTexture(W.groundCanvas(0xCDB186, "sand"));
  const sandM = new THREE.MeshStandardMaterial({ map: sandTex, alphaMap: mtex, alphaTest: 0.5, roughness: 1, transparent: false });
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), sandM); sand.rotation.x = -Math.PI / 2; sand.position.set(CX, -0.07, CZ); sand.receiveShadow = true; root.add(sand);
  const dust = [];
  let lastSfx = 0, lastCheck = 0;
  function brushAt(uv) {
    const x = uv.x * MW_, y = (1 - uv.y) * MH_, r = 0.36 / PW * MW_;
    const g = mctx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.7, "rgba(0,0,0,0.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
    mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, r, 0, 7); mctx.fill(); mtex.needsUpdate = true;
    const now = performance.now(); if (now - lastSfx > 110) { RX.A.sfx("brush"); lastSfx = now; }
    if (dust.length < 40) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xD9C29A, transparent: true, opacity: 0.8 }));
      p.position.set(CX - PW / 2 + uv.x * PW, -0.05, CZ + PD / 2 - uv.y * PD); p.userData.v = new V3((Math.random() - .5) * 0.8, 0.6 + Math.random() * 0.6, (Math.random() - .5) * 0.8); p.userData.life = 0; root.add(p); dust.push(p); }
    if (now - lastCheck > 300) { lastCheck = now; checkSand(); }
  }
  const small = document.createElement("canvas"); small.width = 50; small.height = 40; const sctx = small.getContext("2d");
  function checkSand() {
    sctx.drawImage(mcv, 0, 0, 50, 40); const d = sctx.getImageData(0, 0, 50, 40).data; let left = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 1] > 128) left++;
    sc.sandLeft = left / 2000;
    if (!sc.steps[0] && sc.sandLeft < 0.38) revealed();
  }
  E.addTo(sc, sand, { onDrag: (h, ph) => { if (h && h.uv && !sc.steps[0]) brushAt(h.uv); } });
  // الإناء الفخاري المجزّأ (زخارف هندسية بأسلوب العُبيد — توضيحي)
  const vcv = document.createElement("canvas"); vcv.width = 1024; vcv.height = 256; const vc = vcv.getContext("2d");
  vc.fillStyle = "#E3D1AC"; vc.fillRect(0, 0, 1024, 256);
  vc.fillStyle = "#3E2618"; vc.strokeStyle = "#3E2618";
  vc.fillRect(0, 222, 1024, 14); vc.fillRect(0, 196, 1024, 5);
  vc.lineWidth = 5; vc.beginPath(); for (let x = 0; x <= 1024; x += 32) vc.lineTo(x, x / 32 % 2 ? 160 : 186); vc.stroke();
  for (let x = 0; x < 1024; x += 64) { vc.beginPath(); vc.moveTo(x, 140); vc.lineTo(x + 32, 92); vc.lineTo(x + 64, 140); vc.closePath(); vc.fill();
    vc.fillStyle = "#E3D1AC"; vc.beginPath(); vc.moveTo(x + 14, 133); vc.lineTo(x + 32, 108); vc.lineTo(x + 50, 133); vc.closePath(); vc.fill(); vc.fillStyle = "#3E2618"; }
  vc.fillRect(0, 76, 1024, 6); for (let x = 0; x < 1024; x += 20) vc.fillRect(x, 40, 8, 30);
  vc.fillRect(0, 26, 1024, 6);
  const vtex = new THREE.CanvasTexture(vcv); vtex.anisotropy = 8;
  const prof = [[0.0, 0], [0.08, 0], [0.105, 0.02], [0.135, 0.07], [0.16, 0.14], [0.152, 0.19], [0.12, 0.235], [0.088, 0.262], [0.082, 0.3], [0.1, 0.335], [0.096, 0.34]].map(p => new THREE.Vector2(p[0], p[1]));
  const vmat = new THREE.MeshStandardMaterial({ map: vtex, roughness: 0.85, side: THREE.DoubleSide, emissive: 0x000000 });
  const stand = new THREE.Group(); const sp = at(116, 3.1); stand.position.set(sp.x, 0, sp.z); root.add(stand);
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.55), new THREE.MeshStandardMaterial({ color: 0x6F5034, roughness: 0.8 })); tbl.position.y = 0.76; stand.add(tbl);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.74, 0.04), tbl.material); l.position.set(sx * 0.3, 0.37, sz * 0.23); stand.add(l); }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.48), new THREE.MeshStandardMaterial({ color: 0xEDE4D0 })); cloth.rotation.x = -Math.PI / 2; cloth.position.y = 0.787; stand.add(cloth);
  W.cast(stand);
  sc.shards = []; let got = 0;
  const floorPos = [[-0.9, 0.9, 1.2], [0.7, -0.1, -0.6], [1.6, -1.0, 2.2], [-1.4, -0.9, -1.8], [0.2, 1.1, 0.4]];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.LatheGeometry(prof, 14, i * Math.PI * 2 / 5, Math.PI * 2 / 5);
    const m = new THREE.Mesh(g, vmat.clone()); m.castShadow = true;
    const [x, z, r] = floorPos[i];
    m.position.set(CX + x, -DEP + 0.03, CZ + z); m.rotation.set(Math.PI / 2 * (i % 2 ? 1 : -1) * 0.92, r, 0.3);
    root.add(m); sc.shards.push(m);
    E.addTo(sc, m, {
      disabled: true,
      onHover: on => { m.material.emissive.setHex(on ? 0x553311 : 0x000000); },
      onSelect: () => {
        if (m.userData.taken) return; m.userData.taken = true; m.userData.ia.disabled = true;
        RX.A.sfx("find"); const p0 = m.position.clone(), r0 = m.rotation.clone(); const p1 = new V3(sp.x, 0.79, sp.z);
        U.tween(1100, k => { m.position.lerpVectors(p0, p1, k); m.position.y += Math.sin(k * Math.PI) * 0.7; m.rotation.set(r0.x * (1 - k), r0.y * (1 - k), r0.z * (1 - k)); })
          .then(() => { m.material.emissive.setHex(0); got++; sc.shardCount = got; RX.app.refresh();
            if (got === 5) { RX.app.stepDone(sc, 1); RX.app.toast(U.T().stations.sabiya.found2, U.T().illustrative); vaseDone(); } });
      }
    });
  }
  function vaseDone() {
    const lab = U.label(U.lang() === "ar" ? "إناء فخاري بزخارف هندسية" : "Pot with geometric patterns", { sub: U.T().illustrative, size: 40, height: 0.11, anchorBottom: true });
    lab.position.set(sp.x, 1.25, sp.z); root.add(lab); sc.vaseLab = lab;
  }
  function revealed() {
    sc.steps[0] = true;
    sandM.transparent = true; U.tween(1200, k => { sandM.opacity = 1 - k; }).then(() => { sand.visible = false; });
    sc.shards.forEach(m => { m.userData.ia.disabled = false; });
    RX.app.stepDone(sc, 0); RX.app.toast(U.T().stations.sabiya.found1, U.T().illustrative);
  }
  // لافتة جون الكويت على الأفق
  farLabel(sc, U.T().features.bay, null, 190, 7000, 520, 0x2C6E8F);
  sc.ambience = { wind: 0.5, sea: 0.25 };
  sc.update = function (dt, t) {
    w.uni.time.value = t; if (w.water) w.water.material.uniforms.time.value = t;
    for (let i = dust.length - 1; i >= 0; i--) { const p = dust[i]; p.userData.life += dt; p.position.addScaledVector(p.userData.v, dt); p.userData.v.y -= dt * 1.2; p.material.opacity = 0.8 * (1 - p.userData.life / 0.9); if (p.userData.life > 0.9) { root.remove(p); dust.splice(i, 1); } }
    if (sc.steps[0] && !sc.steps[1]) sc.shards.forEach((m, i) => { if (!m.userData.taken) m.material.emissive.setRGB(0.25 + 0.2 * Math.sin(t * 5 + i), 0.12, 0.02); });
    if (sc.vaseLab) sc.vaseLab.position.y = 1.25 + Math.sin(t * 2) * 0.02;
  };
  sc.stepLabel = i => i === 1 ? `${U.T().stations.sabiya.steps[1]} (${U.num(sc.shardCount || 0)}/${U.num(5)})` : null;
  sc.toolHint = () => !sc.steps[0] ? U.T().stations.sabiya.brush : null;
  return sc;
};

// =====================================================================
// ٢) فيلكا — إيكاروس: المعبد ومقبض الزمن
// =====================================================================
ST.failaka = async function (assets) {
  const w = await W.buildStation("failaka", assets, { exag: 1.0, groundColor: 0xC8B48E, groundStyle: "sand", nearR: 75, flat: 90, horizon: 0xDCE2DD, zenith: 0x5D93C2, sea: 0x2D8A8C, fogNear: 3000, fogFar: 14000 });
  const sc = base(w, "failaka", { yaw: yawOf(60), pitch: 0.02 });
  sc.steps = [false, false, false];
  const root = sc.root;
  const TP = at(60, 18);
  const G = new THREE.Group(); G.position.set(TP.x, 0, TP.z); root.add(G);
  // اجعل واجهة المعبد (+z المحلي) نحو المشاهد
  const toV = new V3(-TP.x, 0, -TP.z).normalize(); G.rotation.y = Math.atan2(toV.x, toV.z);
  const stoneT = W.texStone(0xE4D5B8, "#c9b591", 128, 56); stoneT.repeat.set(3, 2);
  const stone = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9 });
  const colT = W.texPlain(0xEDE3CC, 16);
  const colM = new THREE.MeshStandardMaterial({ map: colT, roughness: 0.75 });
  const roofM = new THREE.MeshStandardMaterial({ map: (function () { const cv = document.createElement("canvas"); cv.width = cv.height = 256; const c = cv.getContext("2d"); c.fillStyle = "#A85C38"; c.fillRect(0, 0, 256, 256); c.fillStyle = "#8B4A2B"; for (let x = 0; x < 256; x += 32) c.fillRect(x, 0, 6, 256); for (let y = 0; y < 256; y += 40) c.fillRect(0, y, 256, 3); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t; })(), roughness: 0.85, side: THREE.DoubleSide });
  const parts = { walls: [], cols: [], caps: [], ent: [], roof: [], blocks: [] };
  const box = (w_, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w_, h, d), m || stone); b.position.set(x, y, z); G.add(b); return b; };
  // درجات القاعدة
  for (let k = 0; k < 3; k++) box(7.6 + (3 - k) * 0.7, 0.25, 11.2 + (3 - k) * 0.7, 0, 0.125 + k * 0.25, 0);
  const SY = 0.75;
  // الجدران (تنمو من الأسفل)
  const wall = (w_, d, x, z) => { const g = new THREE.Group(); g.position.set(x, SY, z); const m = new THREE.Mesh(new THREE.BoxGeometry(w_, 5, d), stone); m.position.y = 2.5; g.add(m); G.add(g); parts.walls.push(g); return g; };
  wall(0.6, 10.3, -3.5, -0.15); wall(0.6, 10.3, 3.5, -0.15); wall(7.6, 0.6, 0, -5.3);
  wall(2.6, 0.6, -2.2, 1.2); wall(2.6, 0.6, 2.2, 1.2);
  // الأعمدة الأيونية
  const shaftG = new THREE.CylinderGeometry(0.27, 0.32, 4.2, 32, 1);
  { const p = shaftG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z); if (r < 0.01) continue; const k = 1 - 0.04 * (0.5 + 0.5 * Math.cos(a * 20)); p.setX(i, x * k); p.setZ(i, z * k); } shaftG.computeVertexNormals(); }
  sc.columnMeshes = [];
  for (const cx of [-1.3, 1.3]) {
    const cg = new THREE.Group(); cg.position.set(cx, SY, 4.75); G.add(cg);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.12, 0.86), colM); plinth.position.y = 0.06; cg.add(plinth);
    const tor = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 10, 28), colM); tor.rotation.x = Math.PI / 2; tor.position.y = 0.18; cg.add(tor);
    const sh = new THREE.Group(); sh.position.y = 0.25; cg.add(sh);
    const shaft = new THREE.Mesh(shaftG, colM); shaft.position.y = 2.1; sh.add(shaft); parts.cols.push(sh); sc.columnMeshes.push(shaft);
    const cap = new THREE.Group(); cap.position.y = 4.45; cg.add(cap); parts.caps.push(cap);
    const ech = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.16, 24), colM); ech.position.y = 0.08; cap.add(ech);
    const pul = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.86, 16), colM); pul.rotation.z = Math.PI / 2; pul.position.y = 0.2; cap.add(pul);
    for (const s of [-1, 1]) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 8, 20), colM); v.position.set(s * 0.43, 0.17, 0.0); v.rotation.y = Math.PI / 2; cap.add(v);
      const v2 = v.clone(); v2.scale.setScalar(0.5); v2.position.x = s * 0.44; cap.add(v2); }
    const aba = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.1, 0.84), colM); aba.position.y = 0.35; cap.add(aba);
  }
  // العتبات والإفريز والكورنيش
  const ent = new THREE.Group(); ent.position.y = SY + 5.0; G.add(ent); parts.ent.push(ent);
  const e1 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.55, 10.9), stone); e1.position.y = 0.275; ent.add(e1);
  const e2 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.45, 10.8), colM); e2.position.y = 0.775; ent.add(e2);
  const e3 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.18, 11.3), colM); e3.position.y = 1.09; ent.add(e3);
  // دنتل (أسنان) على الإفريز الأمامي
  for (let x = -3.6; x <= 3.6; x += 0.3) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.12), colM); d.position.set(x, 0.92, 5.42); ent.add(d); }
  // المثلث والسقف
  const roof = new THREE.Group(); roof.position.y = SY + 6.18; G.add(roof); parts.roof.push(roof);
  const tri = new THREE.Shape(); tri.moveTo(-4.0, 0); tri.lineTo(4.0, 0); tri.lineTo(0, 1.45); tri.closePath();
  for (const z of [5.35, -5.65]) { const p = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }), colM); p.position.z = z; roof.add(p); }
  const slope = Math.atan2(1.45, 4.0), len = Math.hypot(1.45, 4.0) + 0.25;
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 11.4), roofM); r.position.set(s * 2.0, 0.78, -0.15); r.rotation.z = -s * slope; roof.add(r); }
  const akro = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 4), colM); akro.position.set(0, 1.62, 5.5); roof.add(akro);
  W.cast(G);
  // حجارة متناثرة (حال الأطلال)
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5 + Math.random() * 0.6, 0.35 + Math.random() * 0.3, 0.6 + Math.random() * 0.8), stone);
    const a = Math.random() * Math.PI * 2, d = 5.5 + Math.random() * 4.5; b.position.set(Math.cos(a) * d, 0.2, Math.sin(a) * d * 1.2); b.rotation.set(Math.random() * 0.4, Math.random() * 3, Math.random() * 0.3);
    W.cast(b); G.add(b); parts.blocks.push(b);
  }
  for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.8, 24), colM); d.rotation.z = Math.PI / 2; d.rotation.y = Math.random() * 3; d.position.set(-4 + i * 2.6, 0.3, 7.6 + Math.random()); W.cast(d); G.add(d); parts.blocks.push(d); }
  // أسوار القلعة
  const fort = new THREE.Group(); G.add(fort); sc.fort = [];
  const mud = W.texStone(0xD3BE97, "#b9a27a", 96, 40); mud.repeat.set(12, 1);
  const fortM = new THREE.MeshStandardMaterial({ map: mud, roughness: 0.95 });
  const F = 34;
  [[0, -F, 2 * F, 1.6], [0, F, 2 * F, 1.6], [-F, 0, 1.6, 2 * F], [F, 0, 1.6, 2 * F]].forEach(([x, z, a, b]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); const m = new THREE.Mesh(new THREE.BoxGeometry(a, 4.2, b), fortM); m.position.y = 2.1; g.add(m); fort.add(g); sc.fort.push(g);
  });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const g = new THREE.Group(); g.position.set(sx * F, 0, sz * F); const m = new THREE.Mesh(new THREE.BoxGeometry(5, 5.4, 5), fortM); m.position.y = 2.7; g.add(m); fort.add(g); sc.fort.push(g); }
  W.cast(fort);
  // حجر النقش
  const icv = document.createElement("canvas"); icv.width = 512; icv.height = 1024; const ic = icv.getContext("2d");
  ic.fillStyle = "#D9CBAE"; ic.fillRect(0, 0, 512, 1024);
  const nd = ic.getImageData(0, 0, 512, 1024); for (let i = 0; i < nd.data.length; i += 4) { const n = (Math.random() - .5) * 26; nd.data[i] += n; nd.data[i + 1] += n; nd.data[i + 2] += n; } ic.putImageData(nd, 0, 0);
  ic.strokeStyle = "#7d6a4c"; ic.lineWidth = 10; ic.strokeRect(30, 30, 452, 964);
  ic.fillStyle = "#5a4932"; ic.font = "700 64px serif"; ic.textAlign = "center"; ic.fillText("ΙΚΑΡΟΣ", 256, 130);
  ic.font = "600 40px serif"; const GL = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
  for (let r = 0; r < 15; r++) { let s = ""; for (let k = 0; k < 14; k++) s += GL[(r * 7 + k * 11 + (r * k) % 5) % GL.length]; ic.fillText(s, 256, 210 + r * 52); }
  const steleM = [0, 0, 0, 0, 1, 0].map(k => k ? new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(icv), roughness: 0.9 }) : stone);
  const stele = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.45, 0.18), steleM); W.cast(stele);
  const steleG = new THREE.Group(); steleG.position.set(3.4, 0, 8.2); G.add(steleG); steleG.add(stele); stele.position.y = 0.09; stele.rotation.x = -Math.PI / 2;
  // نقاط الاكتشاف
  const T = U.T().stations.failaka;
  function hotspot(label, obj, offset, stepIdx, info) {
    const s = U.label("؟  " + label, { size: 44, height: 0.9, bg: "rgba(255,252,244,0.95)", stroke: C.red, anchorBottom: true }); s.visible = false; G.add(s); s.position.copy(offset);
    const sel = () => { if (sc.time < 0.95 || sc.steps[stepIdx]) return; RX.A.sfx("find"); s.visible = false; RX.app.info(sc, label, info); RX.app.stepDone(sc, stepIdx); };
    E.addTo(sc, s, { onSelect: sel }); E.addTo(sc, obj, { onSelect: sel, onHover: on => { if (sc.time >= 0.95 && !sc.steps[stepIdx]) obj.traverse(o => o.material && o.material.emissive && o.material.emissive.setHex(on ? 0x332211 : 0)); } });
    return s;
  }
  sc.hsCols = hotspot(T.columns, sc.columnMeshes[0].parent.parent, new V3(-1.3, 3.2, 6.0), 1, T.columnsInfo);
  sc.hsInscr = hotspot(T.inscr, steleG, new V3(3.4, 2.4, 8.4), 2, T.inscrInfo);
  // مقبض الزمن ثلاثي الأبعاد (للنظارة والكرتون)
  const sl = new THREE.Group(); sc.slider3 = sl; root.add(sl);
  const sp = at(60, 1.25); sl.position.set(sp.x, 0.98, sp.z); sl.rotation.y = yawOf(60);
  const track = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0x4B3421 })); sl.add(track);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), new THREE.MeshStandardMaterial({ color: 0xB3312A, emissive: 0x330000 })); sl.add(knob);
  const hitbar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.12), new THREE.MeshBasicMaterial({ visible: false })); sl.add(hitbar);
  const lA = U.label(T.now, { size: 36, height: 0.06 }); const lB = U.label(T.then, { size: 36, height: 0.06 });
  const ar = U.lang() === "ar";
  lA.position.set(ar ? 0.55 : -0.55, 0.1, 0); lB.position.set(ar ? -0.55 : 0.55, 0.1, 0); sl.add(lA, lB);
  sc.sliderLabels = [lA, lB];
  E.addTo(sc, sl, { onDrag: h => { if (!h) return; const lp = sl.worldToLocal(h.point.clone()); let k = (lp.x + 0.55) / 1.1; if (ar) k = 1 - k; sc.setTime(Math.max(0, Math.min(1, k))); } });
  // مقبض الزمن
  sc.time = 0;
  const ss = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  sc.setTime = function (t) {
    sc.time = t;
    parts.walls.forEach(g => g.scale.y = 0.1 + 0.9 * ss(0.05, 0.45, t));
    parts.cols.forEach(g => g.scale.y = 0.14 + 0.86 * ss(0.15, 0.5, t));
    parts.caps.forEach(g => { const k = ss(0.46, 0.58, t); g.scale.setScalar(Math.max(0.001, k)); g.visible = k > 0.01; });
    parts.ent.forEach(g => { const k = ss(0.55, 0.72, t); g.visible = k > 0.01; g.position.y = SY + 5.0 + (1 - k) * 4; });
    parts.roof.forEach(g => { const k = ss(0.7, 0.9, t); g.visible = k > 0.01; g.position.y = SY + 6.18 + (1 - k) * 5; });
    parts.blocks.forEach(b => { const k = ss(0.05, 0.3, t); b.visible = k < 0.99; b.scale.setScalar(Math.max(0.001, 1 - k)); });
    sc.fort.forEach(g => g.scale.y = 0.12 + 0.88 * ss(0.2, 0.85, t));
    const up = ss(0.5, 0.7, t); stele.rotation.x = -Math.PI / 2 * (1 - up); stele.position.y = 0.09 + up * 0.64;
    knob.position.x = (ar ? 0.55 - t * 1.1 : -0.55 + t * 1.1);
    if (t >= 0.97 && !sc.steps[0]) { RX.app.stepDone(sc, 0); RX.A.sfx("ok"); }
    sc.hsCols.visible = t >= 0.95 && !sc.steps[1]; sc.hsInscr.visible = t >= 0.95 && !sc.steps[2];
    RX.app.syncSlider && RX.app.syncSlider(t);
  };
  sc.setTime(0);
  sc.view.panelYaw = yawOf(60) - 0.75;
  sc.ambience = { wind: 0.3, sea: 0.6 };
  sc.update = function (dt, t) {
    w.uni.time.value = t; if (w.water) w.water.material.uniforms.time.value = t;
    sl.visible = RX.UI.immersive();
        if (sc.hsCols.visible) sc.hsCols.scale.set(0.9 * sc.hsCols.userData.aspect * (1 + 0.06 * Math.sin(t * 5)), 0.9 * (1 + 0.06 * Math.sin(t * 5)), 1);
    if (sc.hsInscr.visible) sc.hsInscr.scale.set(0.9 * sc.hsInscr.userData.aspect * (1 + 0.06 * Math.sin(t * 5 + 1)), 0.9 * (1 + 0.06 * Math.sin(t * 5 + 1)), 1);
  };
  sc.toolHint = () => !sc.steps[0] ? T.slider : null;
  return sc;
};

// =====================================================================
// ٣) تل وارة — يوم أوارة: البيت، والهضبة، ومقطع الارتفاع
// =====================================================================
ST.wara = async function (assets) {
  const w = await W.buildStation("wara", assets, { exag: 2.0, groundColor: 0xB79D76, groundStyle: "gravel", nearR: 60, flat: 45, horizon: 0xE8DCC4, zenith: 0x6B9BC8, fogNear: 3000, fogFar: 12000 });
  const meta = assets.meta.wara; const AB = meta.ahmadi.bearing;
  const sc = base(w, "wara", { yaw: yawOf(165), pitch: 0.03 });
  sc.steps = [false, false, false];
  const root = sc.root, T = U.T().stations.wara;
  // بوصلة على الأرض
  const ccv = document.createElement("canvas"); ccv.width = ccv.height = 1024; const cc = ccv.getContext("2d");
  cc.translate(512, 512);
  cc.fillStyle = "rgba(255,252,244,0.5)"; cc.beginPath(); cc.arc(0, 0, 500, 0, 7); cc.fill();
  cc.strokeStyle = C.brown; cc.lineWidth = 8; cc.beginPath(); cc.arc(0, 0, 490, 0, 7); cc.stroke(); cc.lineWidth = 3; cc.beginPath(); cc.arc(0, 0, 400, 0, 7); cc.stroke();
  for (let d = 0; d < 360; d += 10) { const a = rad(d); const l = d % 90 ? 30 : 60; cc.lineWidth = d % 90 ? 3 : 6; cc.beginPath(); cc.moveTo(Math.sin(a) * 490, -Math.cos(a) * 490); cc.lineTo(Math.sin(a) * (490 - l), -Math.cos(a) * (490 - l)); cc.stroke(); }
  const dirs = U.lang() === "ar" ? ["ش", "ق", "ج", "غ"] : ["N", "E", "S", "W"];
  cc.font = `800 96px ${U.FONT}`; cc.textAlign = "center"; cc.textBaseline = "middle";
  dirs.forEach((s, i) => { const a = rad(i * 90); cc.fillStyle = i === 0 ? C.red : C.brown; cc.fillText(s, Math.sin(a) * 330, -Math.cos(a) * 330); });
  cc.fillStyle = C.red; cc.save(); cc.rotate(rad(AB)); cc.beginPath(); cc.moveTo(0, -470); cc.lineTo(36, -380); cc.lineTo(-36, -380); cc.fill(); cc.fillRect(-8, -380, 16, 200); cc.restore();
  const comp = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(ccv), transparent: true, depthWrite: false }));
  comp.rotation.x = -Math.PI / 2; comp.position.y = 0.035; comp.renderOrder = 4; root.add(comp);
  // لافتة التل
  const sg = sign(U.lang() === "ar" ? "تل وارة" : "Wara Hill", U.lang() === "ar" ? "١١٧ م فوق سطح البحر" : "117 m above sea level", 1.0);
  const sgp = at(215, 2.4); sg.position.set(sgp.x, 0, sgp.z); sg.rotation.y = yawOf(215) + Math.PI; root.add(sg);
  // بيت جرير على لافتة معلّقة
  const vcv = document.createElement("canvas"); vcv.width = 2048; vcv.height = 820; const vc = vcv.getContext("2d");
  vc.fillStyle = "rgba(250,243,226,0.96)"; U.rrect(vc, 20, 20, 2008, 780, 60); vc.fill();
  vc.strokeStyle = "#7A5A32"; vc.lineWidth = 10; vc.stroke(); vc.lineWidth = 3; U.rrect(vc, 50, 50, 1948, 720, 40); vc.stroke();
  vc.fillStyle = "#3B2A18"; vc.textAlign = "center"; vc.direction = "rtl";
  vc.font = `800 150px ${U.FONT}`; vc.fillText(T.verse1, 1024, 300); vc.fillText(T.verse2, 1024, 530);
  vc.font = `700 66px ${U.FONT}`; vc.fillStyle = "#8A3B22"; vc.direction = U.lang() === "ar" ? "rtl" : "ltr"; vc.fillText(T.poet, 1024, 690);
  const verse = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2 * 820 / 2048), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(vcv), transparent: true, side: THREE.DoubleSide }));
  const vp = at(165, 7); verse.position.set(vp.x, 2.6, vp.z); verse.rotation.y = yawOf(165); root.add(verse);
  sc.verse = verse;
  const listen = U.label("▶  " + U.T().listen, { size: 54, height: 0.32, bg: C.red, color: "#fff", stroke: "#fff", lw: 4 });
  listen.position.set(vp.x, 1.55, vp.z); root.add(listen);
  sc.playVerse = function () {
    RX.A.sfx("click");
    U.tween(500, k => verse.scale.setScalar(1 + 0.04 * Math.sin(k * Math.PI)));
    const done = () => { if (!sc.steps[0]) { RX.app.stepDone(sc, 0); } };
    if (!RX.A.say("wara_verse", done)) setTimeout(done, 3000);
  };
  E.addTo(sc, listen, { onSelect: sc.playVerse, onHover: on => listen.scale.multiplyScalar(on ? 1.1 : 1 / 1.1) });
  E.addTo(sc, verse, { onSelect: sc.playVerse });
  // منارة هضبة الأحمدي على الاتجاه الحقيقي
  sc.ahmadi = farLabel(sc, T.ahmadi, U.lang() === "ar" ? `${U.num(meta.ahmadi.km)} كم، ${U.num(meta.ahmadi.hmax)} م` : `${meta.ahmadi.km} km · ${meta.ahmadi.hmax} m`, AB, 10500, 640, 0xB3312A, {
    onSelect: () => { if (!sc.steps[1]) { RX.A.sfx("find"); RX.app.stepDone(sc, 1); showProfile(); } }
  });
  sc.turnToAhmadi = function () { const y0 = E.yaw, y1 = yawOf(AB); let d = y1 - y0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; U.tween(1400, k => { E.yaw = y0 + d * k; E.pitch = 0.03 * k + E.pitch * (1 - k); }); };
  // لوحة مقطع الارتفاع (بيانات حقيقية)
  const prof = meta.profile;
  const pcv = document.createElement("canvas"); pcv.width = 1600; pcv.height = 820; const pc = pcv.getContext("2d");
  sc.profSel = {};
  function drawProfile() {
    const ar = U.lang() === "ar";
    pc.clearRect(0, 0, 1600, 820);
    pc.fillStyle = "rgba(255,252,244,0.97)"; U.rrect(pc, 6, 6, 1588, 808, 40); pc.fill(); pc.strokeStyle = C.brown; pc.lineWidth = 6; pc.stroke();
    pc.fillStyle = C.ink; pc.font = `800 54px ${U.FONT}`; pc.textAlign = "center"; pc.direction = ar ? "rtl" : "ltr"; pc.fillText(T.profileTitle, 800, 84);
    const x0 = 120, x1 = 1520, y0 = 680, y1 = 160, hmin = 40, hmax = 150, L = prof.km;
    const X = km => ar ? x1 - km / L * (x1 - x0) : x0 + km / L * (x1 - x0), Y = h => y0 - (h - hmin) / (hmax - hmin) * (y0 - y1);
    // مناطق التمييز
    const regs = [["hill", 0, 1.8, C.red, T.profileHill], ["plateau", 18.3, 23.3, C.green, T.profilePlateau]];
    sc.profRegions = [];
    for (const [id, a, b, col, lab] of regs) {
      const xa = Math.min(X(a), X(b)), xb = Math.max(X(a), X(b));
      pc.fillStyle = sc.profSel[id] ? (id === "hill" ? "rgba(179,49,42,0.20)" : "rgba(46,125,85,0.20)") : "rgba(0,0,0,0.04)"; pc.fillRect(xa, y1 - 20, xb - xa, y0 - y1 + 20);
      pc.strokeStyle = col; pc.lineWidth = 4; pc.setLineDash([12, 10]); pc.strokeRect(xa, y1 - 20, xb - xa, y0 - y1 + 20); pc.setLineDash([]);
      pc.fillStyle = col; pc.font = `800 40px ${U.FONT}`; pc.fillText(id === "hill" ? (ar ? "التل" : "Hill") : (ar ? "الهضبة" : "Plateau"), (xa + xb) / 2, y1 - 34);
      sc.profRegions.push({ id, x: xa - 30, w: xb - xa + 60, lab });
    }
    // المقطع
    pc.beginPath(); prof.h.forEach((h, i) => { const km = i / (prof.h.length - 1) * L; i ? pc.lineTo(X(km), Y(h)) : pc.moveTo(X(km), Y(h)); });
    pc.lineTo(X(L), y0); pc.lineTo(X(0), y0); pc.closePath(); pc.fillStyle = "#E3CFA6"; pc.fill();
    pc.beginPath(); prof.h.forEach((h, i) => { const km = i / (prof.h.length - 1) * L; i ? pc.lineTo(X(km), Y(h)) : pc.moveTo(X(km), Y(h)); }); pc.strokeStyle = C.brown; pc.lineWidth = 6; pc.stroke();
    // محاور
    pc.strokeStyle = C.mute; pc.lineWidth = 2; pc.fillStyle = C.mute; pc.font = `600 30px ${U.FONT}`;
    for (let h = 50; h <= 150; h += 25) { pc.beginPath(); pc.moveTo(x0, Y(h)); pc.lineTo(x1, Y(h)); pc.globalAlpha = 0.25; pc.stroke(); pc.globalAlpha = 1; pc.textAlign = ar ? "left" : "right"; pc.fillText(U.num(h) + (ar ? " م" : " m"), ar ? x1 + 8 : x0 - 8, Y(h) + 10); }
    pc.textAlign = "center";
    for (let k = 0; k <= L; k += 5) pc.fillText(U.num(k) + (ar ? " كم" : " km"), X(k), y0 + 44);
    pc.fillStyle = C.red; pc.beginPath(); pc.arc(X(0), Y(prof.h[0]), 12, 0, 7); pc.fill();
    pc.font = `700 34px ${U.FONT}`; pc.fillStyle = C.ink; pc.fillText(ar ? "أنت هنا" : "You", X(0) + (ar ? -70 : 70), Y(prof.h[0]) - 10);
    pc.fillStyle = C.mute; pc.font = `600 26px ${U.FONT}`; pc.fillText(ar ? `اتجاه ${U.num(prof.bearing)}°، بيانات SRTM، والارتفاع مضخّم في الرسم` : `Bearing ${prof.bearing}° · SRTM data · vertical scale exaggerated`, 800, 790);
    ptex.needsUpdate = true;
  }
  const ptex = new THREE.CanvasTexture(pcv); ptex.anisotropy = 8;
  const pboard = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3 * 820 / 1600), new THREE.MeshBasicMaterial({ map: ptex, transparent: true, side: THREE.DoubleSide }));
  const pp = at(AB - 42, 3.0); pboard.position.set(pp.x, 1.55, pp.z); pboard.rotation.y = yawOf(AB - 42); pboard.visible = false; root.add(pboard);
  sc.pboard = pboard;
  E.addTo(sc, pboard, {
    regionAt: h => { const x = h.uv.x * 1600; const r = (sc.profRegions || []).find(r => x >= r.x && x <= r.x + r.w); return r ? r.id : null; },
    onSelect: h => { const x = h.uv.x * 1600; const r = (sc.profRegions || []).find(r => x >= r.x && x <= r.x + r.w); if (!r) return;
      sc.profSel[r.id] = true; RX.A.sfx("find"); drawProfile(); RX.app.info(sc, r.id === "hill" ? (U.lang() === "ar" ? "التل" : "Hill") : (U.lang() === "ar" ? "الهضبة" : "Plateau"), r.lab);
      if (sc.profSel.hill && sc.profSel.plateau && !sc.steps[2]) RX.app.stepDone(sc, 2); }
  });
  function showProfile() { drawProfile(); pboard.visible = true; pboard.scale.setScalar(0.01); U.tween(700, k => pboard.scale.setScalar(Math.max(0.01, k))); }
  sc.showProfile = showProfile;
  sc.view.panelYaw = yawOf(165) - 0.7;
  sc.ambience = { wind: 0.75 };
  sc.update = function (dt, t) {
    w.uni.time.value = t;
    if (!sc.steps[0]) listen.material.opacity = 0.75 + 0.25 * Math.sin(t * 4);
    if (sc.steps[0] && !sc.steps[1]) { const s = 1 + 0.1 * Math.sin(t * 3); sc.ahmadi.userData.col.material.opacity = 0.25 + 0.2 * (s - 0.9) * 5; }
  };
  return sc;
};

// =====================================================================
// ٤) كاظمة — ذات السلاسل: خريطة المعركة على الأرض نفسها
// =====================================================================
ST.kazma = async function (assets) {
  const w = await W.buildStation("kazma", assets, { exag: 1.4, groundColor: 0xA98F6B, groundStyle: "rock", nearR: 16, flat: 7, horizon: 0xE4DCCB, zenith: 0x6497C4, sea: 0x3F8C8A, fogNear: 4000, fogFar: 13500 });
  const KB = 148, KD = 4200;
  const sc = base(w, "kazma", { yaw: yawOf(KB), pitch: -0.28 });
  sc.steps = [false, false];
  const root = sc.root, T = U.T().stations.kazma;
  // صخور الحافة
  const rockM = new THREE.MeshStandardMaterial({ map: W.texPlain(0x9C8463, 34), roughness: 1, flatShading: true });
  for (let i = 0; i < 34; i++) {
    const b = KB + 60 + Math.random() * 240, d = 2.5 + Math.random() * 9;
    const p = at(b, d); const s = 0.1 + Math.random() * 0.35;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockM); r.position.set(p.x, w.groundAt(p.x, p.z) + s * 0.3, p.z); r.scale.set(1, 0.55 + Math.random() * 0.4, 1.2); r.rotation.y = Math.random() * 3;
    W.cast(r); root.add(r);
  }
  // لوحة خريطة المعركة على الأرض
  const OV = 1024, R = 12000;
  const ocv = document.createElement("canvas"); ocv.width = ocv.height = OV; const oc = ocv.getContext("2d");
  const otex = new THREE.CanvasTexture(ocv);
  w.uni.overlay.value = otex; w.uni.ovRect.value.set(-R, -R, R, R);
  const toPx = (x, z) => [(x + R) / (2 * R) * OV, (z + R) / (2 * R) * OV];
  const K = at(KB, KD);
  const gA0 = { x: K.x + 400, z: K.z + 3600 }, gA1 = { x: K.x + 120, z: K.z + 650 };
  const gB0 = { x: K.x - 900, z: K.z - 1700 }, gB1 = { x: K.x - 150, z: K.z - 520 };
  const arI = [{ x: K.x - 200, z: K.z - 900 }, { x: K.x - 1800, z: K.z - 7000 }, { x: K.x - 3800, z: -10800 }];
  const arP = [{ x: K.x + 900, z: K.z - 600 }, { x: K.x + 4200, z: K.z - 4200 }, { x: 10800, z: -8600 }];
  function army(c, x, z, col, flip) {
    const [px, pz] = toPx(x, z); c.save(); c.translate(px, pz);
    c.scale(0.6, 0.6); c.fillStyle = col; c.globalAlpha = 0.9; U.rrect(c, -34, -16, 68, 32, 6); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = "#fff"; c.lineWidth = 2; for (let k = -24; k <= 24; k += 12) { c.beginPath(); c.moveTo(k, -12); c.lineTo(k, 12); c.stroke(); }
    c.fillStyle = col; c.fillRect(-2, -54, 4, 40); c.beginPath(); c.moveTo(2, -54); c.lineTo(flip ? -26 : 30, -46); c.lineTo(2, -36); c.fill();
    c.restore();
  }
  function arrow(c, pts, k, col) {
    if (k <= 0) return;
    const segs = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); segs.push(l); tot += l; }
    let rem = tot * k; c.strokeStyle = col; c.lineWidth = 4.5; c.lineCap = "round"; c.setLineDash([14, 11]);
    c.beginPath(); let [sx, sz] = toPx(pts[0].x, pts[0].z); c.moveTo(sx, sz); let last = [sx, sz], dir = [0, 0];
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const f = Math.min(1, rem / segs[i - 1]); const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, z = pts[i - 1].z + (pts[i].z - pts[i - 1].z) * f;
      const [px, pz] = toPx(x, z); c.lineTo(px, pz); dir = [px - last[0], pz - last[1]]; last = [px, pz]; rem -= segs[i - 1];
    }
    c.stroke(); c.setLineDash([]);
    const a = Math.atan2(dir[1], dir[0]); c.save(); c.translate(last[0], last[1]); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -11); c.lineTo(-10, 11); c.fill(); c.restore();
  }
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k });
  sc.battle = 0; sc.playing = false;
  function drawBattle(p) {
    oc.clearRect(0, 0, OV, OV);
    const [kx, kz] = toPx(K.x, K.z);
    const g = oc.createRadialGradient(kx, kz, 10, kx, kz, 150); g.addColorStop(0, "rgba(246,236,210,0.55)"); g.addColorStop(1, "rgba(246,236,210,0)");
    oc.fillStyle = g; oc.beginPath(); oc.arc(kx, kz, 150, 0, 7); oc.fill();
    const m = Math.min(1, p / 0.45);
    const A = lerp(gA0, gA1, m), B = lerp(gB0, gB1, Math.min(1, m * 1.1));
    if (p < 0.62) { army(oc, A.x, A.z, "#2E7D55", false); army(oc, B.x, B.z, "#8E2A22", true); }
    if (p > 0.45) { const k = Math.min(1, (p - 0.45) / 0.12); oc.strokeStyle = `rgba(200,150,62,${1 - k * 0.4})`; oc.lineWidth = 6; oc.beginPath(); oc.arc(kx, kz, 20 + k * 60, 0, 7); oc.stroke();
      oc.fillStyle = "#2E7D55"; oc.beginPath(); oc.arc(kx, kz, 14, 0, 7); oc.fill(); }
    if (p > 0.6) { arrow(oc, arI, Math.min(1, (p - 0.6) / 0.35), "#2E7D55"); arrow(oc, arP, Math.min(1, (p - 0.65) / 0.33), "#2E7D55"); }
    otex.needsUpdate = true;
  }
  // اللافتات العائمة
  const mkLab = (t, s, col) => { const l = U.label(t, { sub: s, size: 46, height: 260, anchorBottom: true, dot: col }); l.material.fog = false; l.visible = false; root.add(l); return l; };
  const labA = mkLab(T.armyA, T.armyAsub, "#2E7D55"), labB = mkLab(T.armyB, T.armyBsub, "#8E2A22"), labK = mkLab(T.battle, null, "#C8963E");
  const dirLab = (t, p, key) => { const l = U.label("← " + t, { size: 52, height: 420, anchorBottom: true, bg: "rgba(240,250,244,0.96)", stroke: C.green }); l.material.fog = false; l.visible = false;
    l.position.set(p.x, w.groundAt(p.x, p.z) + 250, p.z); root.add(l);
    E.addTo(sc, l, { onSelect: () => { if (sc.found[key]) return; sc.found[key] = true; RX.A.sfx("find"); l.material.color.setHex(0xBFE3CC); if (sc.found.iraq && sc.found.persia && !sc.steps[1]) RX.app.stepDone(sc, 1); }, onHover: on => l.scale.multiplyScalar(on ? 1.08 : 1 / 1.08) });
    return l; };
  sc.found = {};
  const labI = dirLab(T.toIraq, arI[2], "iraq"), labP = dirLab(T.toPersia, arP[2], "persia");
  const place = (l, p, up) => l.position.set(p.x, w.groundAt(p.x, p.z) + (up || 120), p.z);
  addLookout(sc, 800, -0.33);
  sc.playBattle = async function () {
    if (sc.playing) return;
    if (!sc.lifted) await sc.lift(true);
    sc.playing = true; sc.battle = 0;
    w.uni.ovOpacity.value = 1; labA.visible = labB.visible = true;
  };
  drawBattle(0);
  sc.ambience = { wind: 0.6, sea: 0.15 };
  sc.update = function (dt, t) {
    w.uni.time.value = t; if (w.water) w.water.material.uniforms.time.value = t;
    if (sc.playing) {
      sc.battle = Math.min(1, sc.battle + Math.min(dt, 0.1) / 11);
      const p = sc.battle; drawBattle(p);
      const m = Math.min(1, p / 0.45);
      place(labA, lerp(gA0, gA1, m)); place(labB, lerp(gB0, gB1, Math.min(1, m * 1.1)));
      if (p > 0.6) { labA.visible = labB.visible = false; }
      if (p > 0.47 && !labK.visible) { labK.visible = true; place(labK, K, 160); RX.A.sfx("find"); }
      if (p > 0.9) { labI.visible = labP.visible = true; }
      if (p >= 1) { sc.playing = false; if (!sc.steps[0]) RX.app.stepDone(sc, 0); }
    }
  };
  sc.toolHint = () => null;
  return sc;
};

// =====================================================================
// ٥) الشقايا — أعلى نقطة: أسماء ياقوت، والمطر في وادي الباطن
// =====================================================================
ST.shaqaya = async function (assets) {
  const w = await W.buildStation("shaqaya", assets, { exag: 2.2, groundColor: 0xC4A77B, groundStyle: "gravel", nearR: 60, flat: 45, horizon: 0xE9DFCC, zenith: 0x6E9DC8, fogNear: 3500, fogFar: 13000 });
  const meta = assets.meta.shaqaya;
  const sc = base(w, "shaqaya", { yaw: yawOf(285), pitch: -0.06 });
  sc.steps = [false, false];
  const root = sc.root, T = U.T().stations.shaqaya;
  // قناع الفيضان
  const ft = new THREE.Texture(await U.loadImage(assets.img.shaqaya_flood)); ft.needsUpdate = true; ft.minFilter = THREE.LinearFilter; ft.magFilter = THREE.LinearFilter;
  w.uni.flood.value = ft;
  // عمود المسح (أعلى نقطة)
  const pil = new THREE.Group(); const pp = at(330, 2.3); pil.position.set(pp.x, 0, pp.z); root.add(pil);
  const conc = new THREE.MeshStandardMaterial({ map: W.texPlain(0xD8D2C6, 18), roughness: 0.9 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), conc); b1.position.y = 0.06; pil.add(b1);
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.15, 4), conc); b2.position.y = 0.68; b2.rotation.y = Math.PI / 4; pil.add(b2);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0xB08D57, metalness: 0.6, roughness: 0.35 })); plate.position.y = 1.27; pil.add(plate);
  W.cast(pil);
  const hl = U.label(T.highest, { size: 40, height: 0.13, anchorBottom: true }); hl.position.set(pp.x, 1.42, pp.z); root.add(hl);
  // لافتة الوادي فوق مجراه الحقيقي
  const wd = meta.wadi; const mid = wd[Math.floor(wd.length / 2) - 1];
  const wl = U.label(T.wadi, { size: 50, height: 420, anchorBottom: true, dot: "#2C6E8F" }); wl.material.fog = false;
  wl.position.set(mid[0], w.groundAt(mid[0], mid[1]) + 260, mid[1]); root.add(wl);
  // لوح مطابقة الأسماء
  const BW = 1400, BH = 1000;
  const bcv = document.createElement("canvas"); bcv.width = BW; bcv.height = BH; const bc = bcv.getContext("2d");
  const btex = new THREE.CanvasTexture(bcv); btex.anisotropy = 8;
  const mapImg = await U.loadImage(assets.img.map_tex);
  const KEYS = ["shaqaya", "huma", "sadah", "dibdiba"];
  const shuffled = ["huma", "dibdiba", "shaqaya", "sadah"];
  sc.match = { sel: null, done: {}, bad: null };
  let regs = [];
  // حدود الخريطة المصغّرة على اللوح
  const MX0 = 120, MX1 = 1280, MY0 = 120, MY1 = 700;
  const lon0 = 46.45, lon1 = 48.7, lat0 = 28.5, lat1 = 30.15;
  const mpx = (lon, lat) => [MX0 + (lon - lon0) / (lon1 - lon0) * (MX1 - MX0), MY0 + (lat1 - lat) / (lat1 - lat0) * (MY1 - MY0)];
  function drawBoard() {
    const ar = U.lang() === "ar"; regs = [];
    bc.fillStyle = "#EFE2C4"; bc.fillRect(0, 0, BW, BH);
    bc.strokeStyle = "#6E4E2C"; bc.lineWidth = 14; bc.strokeRect(10, 10, BW - 20, BH - 20);
    // الخريطة: قصّ من خريطة المحرّك
    const sx = (lon0 - 46.45) / 2.5 * mapImg.width, sw = (lon1 - lon0) / 2.5 * mapImg.width, sy = (30.2 - lat1) / 1.8 * mapImg.height, sh = (lat1 - lat0) / 1.8 * mapImg.height;
    bc.save(); bc.globalAlpha = 0.9; try { bc.filter = "sepia(0.7) saturate(0.8)"; } catch (e) {} bc.drawImage(mapImg, sx, sy, sw, sh, MX0, MY0, MX1 - MX0, MY1 - MY0); bc.restore(); bc.filter = "none";
    bc.strokeStyle = "#6E4E2C"; bc.lineWidth = 3; bc.strokeRect(MX0, MY0, MX1 - MX0, MY1 - MY0);
    bc.fillStyle = C.ink; bc.font = `800 54px ${U.FONT}`; bc.textAlign = "center"; bc.direction = ar ? "rtl" : "ltr"; bc.fillText(T.matchTitle, BW / 2, 80);
    // أنت هنا
    const me = mpx(assets.meta.shaqaya.lon, assets.meta.shaqaya.lat);
    bc.fillStyle = C.blue; bc.beginPath(); bc.arc(me[0], me[1], 10, 0, 7); bc.fill(); bc.font = `700 26px ${U.FONT}`; bc.fillText(ar ? "أنت هنا" : "You", me[0], me[1] + 38);
    // الأماكن اليوم
    for (const k of KEYS) {
      const [lat, lon] = meta.targets[k]; const [x, y] = mpx(lon, lat); const ok = sc.match.done[k];
      bc.fillStyle = ok ? C.green : (sc.match.bad === k ? C.red : "#8E2A22"); bc.beginPath(); bc.arc(x, y, 22, 0, 7); bc.fill(); bc.strokeStyle = "#fff"; bc.lineWidth = 4; bc.stroke();
      bc.fillStyle = C.ink; bc.font = `800 34px ${U.FONT}`; bc.fillText(T.now[k], x, y - 34);
      if (ok) { bc.fillStyle = C.green; bc.font = `800 30px ${U.FONT}`; bc.fillText((ar ? "= " : "= ") + T.old[k], x, y + 56); }
      regs.push({ id: "pin:" + k, x: x - 60, y: y - 70, w: 120, h: 130, fn: () => pickPin(k) });
    }
    // بطاقات الأسماء القديمة
    bc.fillStyle = C.mute; bc.font = `600 30px ${U.FONT}`; bc.fillText(T.matchHelp, BW / 2, 760);
    const cw = 290, gap = 26, total = shuffled.length * cw + (shuffled.length - 1) * gap; let x = (BW - total) / 2;
    const order = ar ? shuffled.slice().reverse() : shuffled;
    for (const k of order) {
      const used = sc.match.done[k], sel = sc.match.sel === k;
      bc.fillStyle = used ? "rgba(46,125,85,0.15)" : sel ? C.ink : "#FFF9EA"; U.rrect(bc, x, 800, cw, 120, 24); bc.fill();
      bc.strokeStyle = used ? C.green : C.brown; bc.lineWidth = 4; bc.stroke();
      bc.fillStyle = used ? C.green : sel ? "#fff" : C.ink; bc.font = `800 50px ${U.FONT}`; bc.fillText(T.old[k], x + cw / 2, 878);
      if (!used) regs.push({ id: "card:" + k, x, y: 800, w: cw, h: 120, fn: () => { sc.match.sel = k; sc.match.bad = null; drawBoard(); } });
      x += cw + gap;
    }
    btex.needsUpdate = true;
  }
  function pickPin(k) {
    const s = sc.match.sel; if (!s || sc.match.done[k]) return;
    if (s === k) { sc.match.done[k] = true; sc.match.sel = null; RX.A.sfx("ok"); RX.app.toast(T.old[k] + " = " + T.now[k], "معجم البلدان، ص٤٠");
      if (KEYS.every(q => sc.match.done[q]) && !sc.steps[0]) RX.app.stepDone(sc, 0); }
    else { sc.match.bad = k; RX.A.sfx("bad"); setTimeout(() => { sc.match.bad = null; drawBoard(); }, 700); }
    drawBoard();
  }
  drawBoard();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.75 * BH / BW), new THREE.MeshBasicMaterial({ map: btex, side: THREE.DoubleSide }));
  const bp = at(266, 2.9); board.position.set(bp.x, 1.3, bp.z); board.rotation.y = yawOf(266); root.add(board);
  const easel = new THREE.Group(); easel.position.set(bp.x, 0, bp.z); easel.rotation.y = yawOf(266); root.add(easel);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), new THREE.MeshStandardMaterial({ color: 0x5A3D22 })); l.position.set(s * 0.6, 0.42, 0.03); easel.add(l); }
  W.cast(easel);
  E.addTo(sc, board, {
    regionAt: h => { const x = h.uv.x * BW, y = (1 - h.uv.y) * BH; const r = regs.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); return r ? r.id : null; },
    onSelect: h => { const x = h.uv.x * BW, y = (1 - h.uv.y) * BH; const r = regs.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (r) r.fn(); }
  });
  // المطر
  const ND = 1800; const rg = new THREE.BufferGeometry(); const rpos = new Float32Array(ND * 6); rg.setAttribute("position", new THREE.BufferAttribute(rpos, 3));
  const drops = []; for (let i = 0; i < ND; i++) drops.push({ x: (Math.random() - .5) * 60, y: Math.random() * 25, z: (Math.random() - .5) * 60, v: 14 + Math.random() * 6 });
  const rainL = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xC8D4DA, transparent: true, opacity: 0.55 })); rainL.visible = false; rainL.frustumCulled = false; root.add(rainL);
  sc.rain = 0; sc.raining = false; sc.flood = 0;
  addLookout(sc, 950, -0.2);
  sc.startRain = async function () {
    if (sc.raining || sc.steps[1]) return;
    if (!sc.lifted) await sc.lift(true);
    sc.raining = true; sc.rainT = 0; rainL.visible = true; RX.A.ambience({ wind: 0.5, rain: 0.9 }); RX.A.sfx("whoosh");
  };
  sc.view.panelYaw = yawOf(285) - 0.75;
  sc.ambience = { wind: 0.8 };
  sc.update = function (dt, t) {
    w.uni.time.value = t;
    if (sc.raining || sc.rain > 0) {
      if (sc.raining) { sc.rainT += dt; sc.rain = Math.min(1, sc.rain + dt / 2); }
      w.sky.material.uniforms.dark.value = sc.rain * 0.8; w.uni.wet.value = sc.rain;
      w.uni.fogFar.value = 13000 - sc.rain * 1800; w.root.fog.far = w.uni.fogFar.value;
      const fc = new THREE.Color(0xE9DFCC).lerp(new THREE.Color(0x8E9396), sc.rain * 0.8); w.uni.fogColor.value.copy(fc); w.root.background.copy(fc);
      const cp = E.headPos();
      for (let i = 0; i < ND; i++) { const d = drops[i]; d.y -= d.v * dt; if (d.y < -1) { d.y = 22 + Math.random() * 4; d.x = (Math.random() - .5) * 60; d.z = (Math.random() - .5) * 60; }
        const o = i * 6; const by = cp.y - 12; rpos[o] = cp.x + d.x; rpos[o + 1] = by + d.y; rpos[o + 2] = cp.z + d.z; rpos[o + 3] = cp.x + d.x + 0.05; rpos[o + 4] = by + d.y + 0.5; rpos[o + 5] = cp.z + d.z; }
      rg.attributes.position.needsUpdate = true; rainL.material.opacity = 0.55 * sc.rain;
      if (sc.raining && sc.rainT > 2.2) { sc.flood = Math.min(5.5, sc.flood + dt * 0.9); w.uni.floodLevel.value = sc.flood; }
      if (sc.raining && sc.flood >= 5.5) { sc.raining = false; RX.app.toast(T.flood, T.wadi); if (!sc.steps[1]) RX.app.stepDone(sc, 1); RX.A.ambience(sc.ambience); }
      if (!sc.raining) { sc.rain = Math.max(0, sc.rain - dt / 3); if (sc.rain === 0) rainL.visible = false; }
    }
  };
  sc.redrawBoard = drawBoard;
  return sc;
};
})();
