// المحطات الخمس: لكل محطة آيةٌ ومهمّةٌ تُرى بالعين قبل أن يُقرأ ما يقوله العلم
(function () {
const ST = RX.ST = {};
const U = RX.U, C = U.C, W = RX.W, E = RX.E;
const V3 = THREE.Vector3;
const rad = d => d * Math.PI / 180;
const at = (b, d) => ({ x: Math.sin(rad(b)) * d, z: -Math.cos(rad(b)) * d });
const ss = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

function base(root, id, view) {
  const sc = { id, root, interactives: [], steps: [], stage: "explore" };
  sc.view = Object.assign({ pos: new V3(0, 0, 0), yaw: 0, pitch: -0.1 }, view);
  return sc;
}
// مقبض ثلاثي الأبعاد (للنظارة والكرتون)
function slider3(sc, parent, pos, yaw, labA, labB, onK) {
  const ar = U.lang() === "ar";
  const sl = new THREE.Group(); sl.position.copy(pos); sl.rotation.y = yaw; parent.add(sl);
  const track = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0x22375A })); sl.add(track);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), new THREE.MeshStandardMaterial({ color: 0x0F6B6B, emissive: 0x002222 })); sl.add(knob);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.12), new THREE.MeshBasicMaterial({ visible: false })); sl.add(hit);
  const a = U.label(labA, { size: 36, height: 0.06 }), b = U.label(labB, { size: 36, height: 0.06 });
  a.position.set(ar ? 0.55 : -0.55, 0.1, 0); b.position.set(ar ? -0.55 : 0.55, 0.1, 0); sl.add(a, b);
  E.addTo(sc, sl, { onDrag: h => { if (!h) return; const lp = sl.worldToLocal(h.point.clone()); let k = (lp.x + 0.55) / 1.1; if (ar) k = 1 - k; onK(Math.max(0, Math.min(1, k))); } });
  sl.setK = k => { knob.position.x = ar ? 0.55 - k * 1.1 : -0.55 + k * 1.1; };
  return sl;
}
function farLabel(sc, w, text, sub, x, z, hgt, color, labelH) {
  const y = w.groundAt(x, z);
  const g = W.beacon(text, sub, color, hgt, labelH); g.position.set(x, y, z); sc.root.add(g); return g;
}
// منصّة مرتفعة (للنظر من فوق)
function addLookout(sc, ALT, pitchUp, extra, bare) {
  const plat = new THREE.Group(); plat.position.y = ALT; plat.visible = false; sc.root.add(plat);
  if (!bare) {
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 40), new THREE.MeshStandardMaterial({ color: 0x22375A, roughness: 0.6, transparent: true, opacity: 0.35, depthWrite: false })); deck.position.y = -0.05; plat.add(deck);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.025, 8, 48), new THREE.MeshStandardMaterial({ color: 0xC49A3A, metalness: 0.4, roughness: 0.4 })); rail.rotation.x = Math.PI / 2; rail.position.y = 0.85; plat.add(rail);
  }
  const y0 = sc.view.pos.y, p0 = sc.view.pitch;
  sc.lifted = false; sc.plat = plat;
  sc.lift = async function (up) {
    if (up === sc.lifted) return;
    await E.fade(1, 320);
    sc.lifted = up; plat.visible = up;
    sc.view.pos.y = up ? ALT : y0; sc.view.pitch = up ? pitchUp : p0;
    E.placeView(); RX.UI.placePanel(sc); RX.A.sfx("whoosh");
    extra && extra(up);
    await E.fade(0, 520); RX.app.refresh();
  };
}

// =====================================================================
// ١) البنان — تقف على طرف إصبع (١ مم ≈ ٦٫٥ م)
// =====================================================================
ST.finger = async function (assets) {
  const T = U.T().stations.finger, ar = U.lang() === "ar";
  const root = new THREE.Scene();
  const hor = new THREE.Color(0xEFD3C4);
  root.background = hor; root.fog = new THREE.Fog(hor, 80, 340);
  root.add(W.sky({ zenith: 0x34456A, horizon: 0xEFD3C4 }));
  root.add(new THREE.HemisphereLight(0xFFF1E8, 0xB07A6A, 0.6));
  const img = await U.loadImage(assets.img.finger_h);
  const N = img.width; const cv = document.createElement("canvas"); cv.width = cv.height = N; const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
  const D = cx.getImageData(0, 0, N, N).data;
  const tex = new THREE.Texture(img); tex.needsUpdate = true; tex.anisotropy = 8;
  const SIZE = 130, AMP = 0.85, RXd = 75, RZd = 105;
  const uni = { hmap: { value: tex }, grow: { value: 1 }, sunDir: { value: new V3(-0.45, 0.7, 0.55).normalize() }, fogColor: { value: hor }, fogNear: { value: 80 }, fogFar: { value: 340 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, extensions: { derivatives: true },
    vertexShader: `uniform sampler2D hmap; uniform float grow; varying vec3 vW; varying vec2 vUv; varying float vDepth, vR, vP, vM;
      void main(){ vec4 t=texture2D(hmap, uv); float m=t.b; vec3 p=position;
        float dome=-(p.x*p.x/${(2 * RXd).toFixed(1)} + p.z*p.z/${(2 * RZd).toFixed(1)});
        float edge=(1.0-smoothstep(0.0,0.45,m))*26.0;
        float ridge=(t.r-0.5)*${AMP.toFixed(2)}*grow*smoothstep(0.1,0.6,m);
        p.y=dome-edge+ridge+(1.0-grow)*1.1*m;
        vUv=uv; vR=t.r; vP=t.g; vM=m; vec4 w=modelMatrix*vec4(p,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D hmap; uniform float grow, fogNear, fogFar; uniform vec3 sunDir, fogColor; varying vec3 vW; varying vec2 vUv; varying float vDepth, vR, vP, vM;
      float hh(vec2 u){ vec4 t=texture2D(hmap,u); return (t.r-0.5)*${AMP.toFixed(2)}*grow*smoothstep(0.1,0.6,t.b) + (1.0-grow)*1.1*t.b - (1.0-smoothstep(0.0,0.45,t.b))*26.0; }
      void main(){ float e=1.0/${N.toFixed(1)}, k=1.0/(2.0*${SIZE.toFixed(1)}*e);
        float dx=(hh(vUv+vec2(e,0.0))-hh(vUv-vec2(e,0.0)))*k - vW.x/${RXd.toFixed(1)};
        float dz=-(hh(vUv+vec2(0.0,e))-hh(vUv-vec2(0.0,e)))*k - vW.z/${RZd.toFixed(1)};
        vec3 n=normalize(vec3(-dx, 1.0, -dz));
        float r=mix(0.55, vR, grow);
        vec3 col=mix(vec3(0.66,0.40,0.36), vec3(0.96,0.78,0.68), smoothstep(0.2,0.85,r));
        float pore=vP*grow; col=mix(col, vec3(0.30,0.13,0.12), pore*0.9);
        float dif=pow(dot(n,sunDir)*0.5+0.5, 1.5);
        vec3 v=normalize(cameraPosition-vW); vec3 h=normalize(sunDir+v);
        float spec=pow(max(dot(n,h),0.0),48.0)*0.28*smoothstep(0.55,0.9,r) + pore*pow(max(dot(n,h),0.0),12.0)*0.4;
        vec3 c=col*(0.42+0.72*dif)+vec3(0.28,0.06,0.04)*(1.0-dif)*0.45+spec;
        c=mix(c, vec3(0.86,0.62,0.54)*(0.55+0.5*dif), (1.0-smoothstep(0.0,0.4,vM))*0.85);
        gl_FragColor=vec4(mix(c, fogColor, smoothstep(fogNear,fogFar,vDepth)),1.0); }`
  });
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, 420, 420); geo.rotateX(-Math.PI / 2);
  const pad = new THREE.Mesh(geo, mat); root.add(pad);
  // الارتفاع على المعالج (للوقوف)
  const Hat = (x, z) => {
    const px = Math.max(0, Math.min(N - 1, Math.round((x / SIZE + 0.5) * N))), py = Math.max(0, Math.min(N - 1, Math.round((z / SIZE + 0.5) * N)));
    const i = (py * N + px) * 4, r = D[i] / 255, m = D[i + 2] / 255, g = uni.grow.value;
    return -(x * x / (2 * RXd) + z * z / (2 * RZd)) - (1 - ss(0, 0.45, m)) * 26 + (r - 0.5) * AMP * g * ss(0.1, 0.6, m) + (1 - g) * 1.1 * m;
  };
  const sc = base(root, "finger", { pos: new V3(0, Hat(0, 0) + 0.05, 0), yaw: 0, pitch: -0.34 });
  sc.steps = [false, false, false];
  // مسطرة ١ مم
  const bar = new THREE.Group(); bar.position.set(ar ? 2.5 : -2.5, 0, -4); root.add(bar);
  const L = SIZE / 20;  // ٢٠ مم = حجم الوسادة
  const barM = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, 0.18), new THREE.MeshBasicMaterial({ color: 0x172338 }));
  barM.position.y = Hat(bar.position.x, bar.position.z) + 1.0; bar.add(barM);
  const barL = U.label(T.mm, { size: 48, height: 0.42 }); barL.position.y = barM.position.y + 0.45; bar.add(barL);
  // علامتا القلب والدلتا (من مجال الاتجاهات نفسه في fp.py)
  const mk = (txt, nx, ny, col) => {
    const x = (nx + 1) / 2 * SIZE - SIZE / 2, z = (1 - (ny + 1) / 2) * SIZE - SIZE / 2;
    const g = new THREE.Group(); g.position.set(x, Hat(x, z), z); root.add(g);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 8, 40), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = Math.PI / 2; ring.position.y = 1.2; g.add(ring);
    const lab = U.label(txt, { size: 52, height: 4.5, anchorBottom: true, stroke: "#" + new THREE.Color(col).getHexString(), lw: 5 }); lab.position.y = 3; g.add(lab);
    g.visible = false; return g;
  };
  sc.marks = [mk(T.core, 0.02, 0.2, 0x0F6B6B), mk(T.delta, -0.46, -0.3, 0xA8473A)];
  // لافتة المسام قرب الواقف
  const poreLab = U.label(T.pores, { size: 40, height: 0.32, anchorBottom: true }); poreLab.position.set(ar ? -1.6 : 1.6, Hat(1.6, -3) + 1.2, -3); root.add(poreLab);
  // لافتة الأسبوع (تُرى من فوق)
  const wk = U.label(" ", { size: 60, height: 8 }); root.add(wk); wk.visible = false;
  function setWeekLabel(w) {
    const nw = U.label(`${T.week} ${U.num(Math.round(w))}`, { size: 60, height: 7.5, stroke: C.gold, lw: 5 });
    wk.material.map.dispose(); wk.material.map = nw.material.map; wk.scale.copy(nw.scale); wk.material.needsUpdate = true;
  }
  wk.position.set(0, 46, -36);
  addLookout(sc, 118, -1.3, up => { sc.marks.forEach(m => m.visible = up); wk.visible = up && sc.steps[1]; bar.visible = !up; poreLab.visible = !up; }, true);
  // مرور الزمن: من الأسبوع ٨ إلى ١٨
  sc.week = 18;
  const sl = slider3(sc, sc.plat, new V3(0, 1.0, -1.05), 0, T.now, T.then, k => sc.setWeek(8 + k * 10));
  sl.visible = false;
  sc.setWeek = function (w) {
    sc.week = w; uni.grow.value = ss(9.5, 17, w); setWeekLabel(w); sl.setK((w - 8) / 10);
    RX.app.syncSlider && RX.app.syncSlider((w - 8) / 10);
    if (w >= 17.4 && sc.timeArmed && !sc.steps[2]) { RX.app.stepDone(sc, 2); sc.info = { title: `${T.week} ${U.num(17)}`, text: T.weekInfo }; RX.app.refresh(); }
  };
  sc.slider = () => (sc.steps[1] && !RX.UI.immersive()) ? { a: T.now, b: T.then, k: (sc.week - 8) / 10, on: k => sc.setWeek(8 + k * 10) } : null;
  // اختيار النمط
  sc.gallery = () => (sc.lifted && !sc.steps[1]) ? {
    q: T.patternQ, items: ["loop", "whorl", "arch"].map(k => ({ img: assets.img["fp_" + k], label: T.patterns[k], state: sc.galBad === k ? "bad" : "" })),
    onPick: i => {
      const k = ["loop", "whorl", "arch"][i];
      if (k === "loop") { RX.A.sfx("ok"); RX.app.toast("✓ " + T.patterns.loop, T.patternOk); RX.app.stepDone(sc, 1); sc.galBad = null; startTime(); }
      else { RX.A.sfx("bad"); sc.galBad = k; RX.app.toast(T.patterns[k] + (ar ? "؟" : "?"), T.patternBad, "bad"); RX.app.refresh(); }
    } } : null;
  async function startTime() {
    sl.visible = RX.UI.immersive(); wk.visible = true;
    await U.tween(1500, k => sc.setWeek(18 - k * 10));
    sc.timeArmed = true;
    sc.info = { title: T.slider, text: T.weekInfo }; RX.app.refresh();
  }
  sc.actions = () => {
    const a = [];
    if (!sc.lifted && !sc.steps[0]) a.push({ label: T.lift, primary: true, onClick: async () => { await sc.lift(true); RX.app.stepDone(sc, 0); } });
    else if (!sc.lifted && sc.steps[0] && !sc.steps[1]) a.push({ label: T.lift, primary: true, onClick: () => sc.lift(true) });
    if (sc.lifted && sc.steps[2]) a.push({ label: T.down, onClick: () => sc.lift(false) });
    return a;
  };
  sc.toolHint = () => sc.lifted && sc.steps[1] && !sc.steps[2] ? T.slider : null;
  sc.ambience = { wind: 0.12 };
  sc.update = function (dt, t) {
    sl.visible = sc.lifted && sc.steps[1] && RX.UI.immersive();
    sc.marks.forEach((m, i) => { m.children[0].scale.setScalar(1 + 0.08 * Math.sin(t * 3 + i)); });
  };
  return sc;
};

// =====================================================================
// ٢) خلية النحل — في حجم نحلة (١ م ≈ ٦٫٥ مم)
// =====================================================================
ST.bee = async function (assets) {
  const T = U.T().stations.bee, ar = U.lang() === "ar";
  const root = new THREE.Scene();
  const bg = new THREE.Color(0x2A1A0C); root.background = bg; root.fog = new THREE.Fog(bg, 14, 70);
  root.add(new THREE.HemisphereLight(0xFFE2A8, 0x3A2412, 0.55));
  const sun = new THREE.DirectionalLight(0xFFF1D2, 1.25); sun.position.set(24, 9, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -6, near: 1, far: 70 }); root.add(sun); root.add(sun.target);
  const warm = new THREE.PointLight(0xFFB24A, 0.7, 22); warm.position.set(-3, 5, 2); root.add(warm);
  const sc = base(root, "bee", { pos: new V3(0, 0, 4.4), yaw: -0.38, pitch: 0.16 });
  sc.steps = [false, false, false];
  // أرضية الخلية والجدران
  const wood = (function () { const cv = document.createElement("canvas"); cv.width = 512; cv.height = 512; const c = cv.getContext("2d"); c.fillStyle = "#6B4A2C"; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 90; i++) { c.strokeStyle = `rgba(${40 + Math.random() * 30},${25 + Math.random() * 20},10,0.35)`; c.lineWidth = 1 + Math.random() * 3; c.beginPath(); const y = Math.random() * 512; c.moveTo(0, y); for (let x = 0; x <= 512; x += 32) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 6); c.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  wood.repeat.set(6, 6);
  const floorM = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ map: wood, color: 0x5A4030, roughness: 0.9, side: THREE.DoubleSide });
  const wall = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; root.add(m); return m; };
  wall(30, 14, -15, 7, -2, Math.PI / 2);           // الجدار الأيسر
  wall(30, 14, 0, 7, 13, Math.PI);                  // الخلفي (وراء الواقف)
  // الجدار الأيمن بباب واسع (الباب بين z=-5 و z=1، وارتفاعه ٤ م)
  wall(12, 14, 15, 7, -11, -Math.PI / 2); wall(12, 14, 15, 7, 7, -Math.PI / 2); wall(6, 10, 15, 9, -2, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), wallM); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 14, -2); root.add(ceil);
  // الحقل خارج الباب: سماء وعشب وزهرة كبيرة عليها قطرة رحيق
  const fcv = document.createElement("canvas"); fcv.width = 1024; fcv.height = 512; const fc = fcv.getContext("2d");
  const gsk = fc.createLinearGradient(0, 0, 0, 512); gsk.addColorStop(0, "#8EC3E8"); gsk.addColorStop(0.55, "#E8F2E0"); gsk.addColorStop(0.58, "#9CC25E"); gsk.addColorStop(1, "#5E8A2E"); fc.fillStyle = gsk; fc.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) { fc.fillStyle = ["#F7E26B", "#F4F1E8", "#E79AC0", "#F2B33D"][i % 4]; fc.beginPath(); fc.arc(Math.random() * 1024, 300 + Math.random() * 212, 2 + Math.random() * 4, 0, 7); fc.fill(); }
  const field = new THREE.Mesh(new THREE.PlaneGeometry(70, 35), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fcv), fog: false }));
  field.position.set(48, 8, -2); field.rotation.y = -Math.PI / 2; root.add(field);
  const flower = new THREE.Group(); flower.position.set(19.5, 0, -2.2); root.add(flower);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 10), new THREE.MeshStandardMaterial({ color: 0x5E8A2E })); stem.position.y = 1.3; flower.add(stem);
  const head = new THREE.Group(); head.position.y = 2.7; head.rotation.z = 0.5; flower.add(head);
  const petalM = new THREE.MeshStandardMaterial({ color: 0xF6EEF2, roughness: 0.6, side: THREE.DoubleSide, emissive: 0x221a1e });
  for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), petalM); p.scale.set(0.42, 0.06, 1.25); const a = i / 10 * Math.PI * 2; p.position.set(Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25); p.rotation.y = -a + Math.PI / 2; head.add(p); }
  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 12), new THREE.MeshStandardMaterial({ color: 0xF2B33D, roughness: 0.8 })); disc.scale.y = 0.4; head.add(disc);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshPhongMaterial({ color: 0xFFE9A8, shininess: 140, specular: 0xffffff, transparent: true, opacity: 0.85, emissive: 0x332200 }));
  drop.position.set(0, 0.3, 0); head.add(drop);
  const dropLab = U.label(T.nectar, { size: 40, height: 0.32, anchorBottom: true }); dropLab.position.set(0, 1.0, 0); head.add(dropLab);
  W.cast(flower);
  // الأقراص السداسية
  const RO = 0.47, CW = Math.sqrt(3) * RO, CH = 1.5 * RO, DEP = 1.6, ZW = -4.6, COLS = 22, ROWS = 14;
  const cellG = new THREE.CylinderGeometry(RO, RO, DEP, 6, 1, true); cellG.rotateX(Math.PI / 2);
  const waxM = new THREE.MeshStandardMaterial({ color: 0xE8B64A, roughness: 0.38, side: THREE.DoubleSide, emissive: 0x2A1500 });
  const cells = new THREE.InstancedMesh(cellG, waxM, COLS * ROWS);
  const honeyG = new THREE.CylinderGeometry(RO * 0.93, RO * 0.93, 1, 6); honeyG.rotateX(Math.PI / 2);
  const honeyM = new THREE.MeshPhongMaterial({ shininess: 130, specular: 0xffffff, transparent: true, opacity: 0.93 });
  const capG = new THREE.CylinderGeometry(RO * 0.95, RO * 0.95, 0.06, 6); capG.rotateX(Math.PI / 2);
  const capM = new THREE.MeshStandardMaterial({ color: 0xF3E1B0, roughness: 0.55, emissive: 0x1d1608 });
  const tones = [new THREE.Color(0xF4D772), new THREE.Color(0xDB9A2C), new THREE.Color(0x6E3510)];
  const centers = []; const dummy = new THREE.Object3D();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = (c - COLS / 2) * CW + (r % 2 ? CW / 2 : 0), y = 0.55 + r * CH;
    centers.push({ x, y, r, c });
    dummy.position.set(x, y, ZW); dummy.updateMatrix(); cells.setMatrixAt(centers.length - 1, dummy.matrix);
  }
  root.add(cells); cells.castShadow = true; cells.receiveShadow = true;
  const backM = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CW + 2, ROWS * CH + 2), new THREE.MeshStandardMaterial({ color: 0xB97E26, roughness: 0.5 }));
  backM.position.set(0, ROWS * CH / 2 + 0.3, ZW - DEP / 2); root.add(backM);
  // اختيار الخلايا: الأعلى مختومة، والوسط عسلٌ بثلاثة ألوان، وبعضها فارغ
  const target = centers.findIndex(o => o.r === 3 && o.c === Math.round(COLS / 2) + 2);
  const honeyList = [], capList = [];
  centers.forEach((o, i) => {
    if (i === target) return;
    const zone = o.c < COLS / 3 ? 0 : o.c < COLS * 2 / 3 ? 1 : 2;
    const rnd = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    if (o.r >= 9 && rnd < 0.82) capList.push(i);
    else if (o.r >= 1 && rnd < 0.7) honeyList.push({ i, tone: zone, fill: 0.86 + rnd * 0.13 });
  });
  const honey = new THREE.InstancedMesh(honeyG, honeyM, honeyList.length);
  honeyList.forEach((hh, k) => { const o = centers[hh.i]; const L2 = DEP * hh.fill; dummy.position.set(o.x, o.y, ZW - DEP / 2 + L2 / 2); dummy.scale.set(1, 1, L2); dummy.updateMatrix(); honey.setMatrixAt(k, dummy.matrix); honey.setColorAt(k, tones[hh.tone]); dummy.scale.set(1, 1, 1); });
  honey.instanceColor.needsUpdate = true; root.add(honey);
  const caps = new THREE.InstancedMesh(capG, capM, capList.length);
  capList.forEach((i, k) => { const o = centers[i]; dummy.position.set(o.x, o.y, ZW + DEP / 2 - 0.05); dummy.updateMatrix(); caps.setMatrixAt(k, dummy.matrix); }); root.add(caps);
  // العسل في الخلية الهدف (يمتلئ وينضج)
  const tgt = centers[target];
  const newHoney = new THREE.Mesh(honeyG, new THREE.MeshPhongMaterial({ color: 0xF8F0CF, shininess: 140, specular: 0xffffff, transparent: true, opacity: 0.55 }));
  newHoney.position.set(tgt.x, tgt.y, ZW - DEP / 2 + 0.05); newHoney.scale.set(1, 1, 0.1); newHoney.visible = false; root.add(newHoney);
  const newCap = new THREE.Mesh(capG, capM); newCap.position.set(tgt.x, tgt.y, ZW + DEP / 2 - 0.05); newCap.scale.setScalar(0.01); newCap.visible = false; root.add(newCap);
  // النحلة (توضيحية)
  const bee = new THREE.Group(); root.add(bee);
  const sv = document.createElement("canvas"); sv.width = 256; sv.height = 64; const sx = sv.getContext("2d");
  for (let i = 0; i < 8; i++) { sx.fillStyle = i % 2 ? "#1E140A" : "#E9B23A"; sx.fillRect(i * 32, 0, 32, 64); }
  const abdM = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(sv), roughness: 0.7, transparent: true, opacity: 1 });
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), abdM); abd.scale.set(1, 1, 1.75); abd.position.z = 0.62; abd.rotation.y = Math.PI / 2; bee.add(abd);
  const thx = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), new THREE.MeshStandardMaterial({ color: 0x8A5A22, roughness: 1 })); bee.add(thx);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), new THREE.MeshStandardMaterial({ color: 0x24170C, roughness: 0.6 })); hd.position.z = -0.36; bee.add(hd);
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0x0A0705, roughness: 0.2, metalness: 0.3 })); eye.position.set(s * 0.13, 0.05, -0.42); eye.scale.set(0.7, 1.2, 0.8); bee.add(eye); }
  const wingM = new THREE.MeshStandardMaterial({ color: 0xE9F2F6, transparent: true, opacity: 0.45, side: THREE.DoubleSide, roughness: 0.2 });
  const wings = [];
  for (const s of [-1, 1]) for (const k of [0, 1]) { const wg = new THREE.Group(); wg.position.set(s * 0.12, 0.22, k * 0.18 - 0.05); const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), wingM); m.scale.set(0.62 - k * 0.15, 0.24, 1); m.rotation.x = -Math.PI / 2; m.position.x = s * (0.6 - k * 0.15); wg.add(m); wg.userData.s = s; bee.add(wg); wings.push(wg); }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.55, 5), thx.material); lg.position.set(s * 0.22, -0.22, -0.1 + k * 0.17); lg.rotation.z = s * 0.7; bee.add(lg); }
  const stomach = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), new THREE.MeshPhongMaterial({ color: 0xFFD45A, emissive: 0x664400, shininess: 100 })); stomach.position.z = 0.5; stomach.scale.setScalar(0.2); bee.add(stomach);
  const stLab = U.label(T.stomach, { size: 38, height: 0.24, anchorBottom: true, stroke: C.gold, lw: 4 }); stLab.position.set(0, 0.55, 0.5); stLab.visible = false; bee.add(stLab);
  W.cast(bee);
  const home = new V3(2.6, 2.9, -1.6);
  bee.position.copy(home);
  sc.beeBusy = false; let flap = 1;
  const flyTo = (p1, ms) => { const p0 = bee.position.clone(); const mid = p0.clone().lerp(p1, 0.5); mid.y += 1.6;
    return U.tween(ms, k => { const a = p0.clone().lerp(mid, k), b = mid.clone().lerp(p1, k); bee.position.copy(a.lerp(b, k)); const d = b.sub(a); if (d.lengthSq() > 1e-6) bee.rotation.y = Math.atan2(-d.x, -d.z); }); };
  const xray = on => { abdM.opacity = on ? 0.3 : 1; abdM.depthWrite = !on; stLab.visible = on; };
  async function collect() {
    if (sc.beeBusy || sc.steps[0]) return; sc.beeBusy = true; RX.A.sfx("whoosh");
    const fp = new V3(); drop.getWorldPosition(fp);
    await flyTo(fp.clone().add(new V3(-0.9, 0.4, 0)), 2600);
    bee.rotation.y = -Math.PI / 2; xray(true);
    await U.tween(1600, k => { drop.scale.setScalar(Math.max(0.01, 1 - k)); stomach.scale.setScalar(0.2 + 0.8 * k); });
    drop.visible = false; dropLab.visible = false; RX.A.sfx("find");
    RX.app.toast("✓ " + T.drank, null); RX.app.stepDone(sc, 0);
    await flyTo(new V3(tgt.x, tgt.y + 0.1, ZW + DEP / 2 + 0.75), 2800);
    bee.rotation.y = 0; newHoney.visible = true;
    await U.tween(1600, k => { stomach.scale.setScalar(Math.max(0.2, 1 - k * 0.8)); newHoney.scale.z = 0.1 + k * 0.9; newHoney.position.z = ZW - DEP / 2 + newHoney.scale.z / 2; });
    flap = 3.5;   // تهوية لتبخير الماء
    const c0 = new THREE.Color(0xF8F0CF), c1 = tones[1];
    await U.tween(3200, k => { newHoney.material.color.copy(c0).lerp(c1, k); newHoney.material.opacity = 0.55 + 0.38 * k; });
    newCap.visible = true; await U.tween(700, k => newCap.scale.setScalar(Math.max(0.01, k)));
    flap = 1; xray(false); RX.A.sfx("ok");
    RX.app.toast("✓ " + T.ripen, null); RX.app.stepDone(sc, 1);
    sc.info = { title: T.steps[2], text: T.colorPick }; RX.app.refresh();
    await flyTo(home, 2400); sc.beeBusy = false;
  }
  E.addTo(sc, flower, { onSelect: collect, onHover: on => petalM.emissive.setHex(on ? 0x443322 : 0x221a1e) });
  // مقارنة الألوان
  let firstTone = null;
  E.addTo(sc, honey, { onSelect: h => {
    if (!sc.steps[1] || sc.steps[2] || h.instanceId == null) return;
    const tone = honeyList[h.instanceId].tone;
    if (firstTone == null) { firstTone = tone; RX.A.sfx("find"); RX.app.toast(T.colors[tone], T.colorPick); return; }
    if (tone === firstTone) { RX.A.sfx("bad"); RX.app.toast(T.colors[tone], T.colorPick, "bad"); return; }
    RX.A.sfx("ok"); RX.app.toast(`${T.colors[firstTone]} ${ar ? "و" : "& "}${T.colors[tone]}`, T.colorInfo);
    sc.info = { title: T.colors[firstTone] + (ar ? "، " : ", ") + T.colors[tone], text: T.colorInfo };
    RX.app.stepDone(sc, 2);
  } });
  sc.actions = () => [];
  sc.toolHint = () => !sc.steps[0] ? (ar ? "انقر الزهرة عند باب الخلية" : "Tap the flower at the hive entrance") : (sc.steps[1] && !sc.steps[2] ? T.colorPick : null);
  sc.ambience = { wind: 0.15, tent: 0.35 };
  sc.update = function (dt, t) {
    wings.forEach((wg, i) => { wg.rotation.z = wg.userData.s * (0.35 + 0.45 * Math.sin(t * 60 * flap + i)); });
    if (!sc.beeBusy) bee.position.y = home.y + Math.sin(t * 1.6) * 0.12;
    if (drop.visible) drop.scale.setScalar(1 + 0.05 * Math.sin(t * 3));
  };
  return sc;
};

// =====================================================================
// ٣) جذور الجبال — مقطعٌ حقيقي عبر إيفرست بمقياس ١ : ١٠٠٠٠ وبلا تضخيم رأسي
// =====================================================================
ST.mount = async function (assets) {
  const T = U.T().stations.mount, ar = U.lang() === "ar", M = assets.meta.mount;
  const S = 0.1;                       // متر في المشهد لكل كيلومتر
  const LEN = M.len_km * S, WID = M.width_km * S, DEPTH = 80 * S;
  const root = new THREE.Scene();
  const bg = new THREE.Color(0x0E1522); root.background = bg; root.fog = new THREE.Fog(bg, 30, 95);
  root.add(new THREE.HemisphereLight(0xDDE7FF, 0x1A2030, 0.55));
  const key = new THREE.DirectionalLight(0xFFF1DE, 0.95); key.position.set(-14, 18, 22); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -32, right: 32, top: 12, bottom: -12, near: 1, far: 90 }); root.add(key); root.add(key.target);
  // الارتفاعات (٠٫٢ م دقة) — الصف الأول جنوباً، والأعمدة من الغرب إلى الشرق
  const img = await U.loadImage(assets.img.mount_h);
  const NL = img.width === M.nw ? img.height : img.height, NW = img.width;
  const cv = document.createElement("canvas"); cv.width = NW; cv.height = NL; const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
  const D = cx.getImageData(0, 0, NW, NL).data;
  const hAt = (i, j) => { const k = (i * NW + j) * 4; return ((D[k] * 256 + D[k + 1]) / 5 - 1000) / 1000 * S; };   // متر المشهد
  // x: الجنوب (+) إلى الشمال (−)؛ z: الغرب (+، الوجه المقطوع) إلى الشرق (−)
  const X = i => (0.5 - i / (NL - 1)) * LEN, Z = j => (0.5 - j / (NW - 1)) * WID;
  // السطح بصورته الفضائية
  const topG = new THREE.BufferGeometry(); const pos = [], uv = [], idx = [];
  for (let i = 0; i < NL; i++) for (let j = 0; j < NW; j++) { pos.push(X(i), Math.max(hAt(i, j), 0.002), Z(j)); uv.push(j / (NW - 1), 1 - i / (NL - 1)); }
  for (let i = 0; i < NL - 1; i++) for (let j = 0; j < NW - 1; j++) { const a = i * NW + j, b = a + 1, c = a + NW, d = c + 1; idx.push(a, c, b, b, c, d); }
  topG.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); topG.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); topG.setIndex(idx); topG.computeVertexNormals();
  const satT = new THREE.Texture(await U.loadImage(assets.img.mount_sat)); satT.needsUpdate = true; satT.anisotropy = 8;
  const top = new THREE.Mesh(topG, new THREE.MeshStandardMaterial({ map: satT, roughness: 0.95 })); top.castShadow = true; top.receiveShadow = true; root.add(top);
  // الوجوه المقطوعة: طبقات القشرة والوشاح وقاعدة القشرة من نموذج التوازن
  const faceMat = new THREE.ShaderMaterial({
    uniforms: { fogColor: { value: bg }, fogNear: { value: 30 }, fogFar: { value: 95 }, S: { value: S } },
    vertexShader: `attribute float moho; attribute float sx; varying float vMoho, vKm, vS, vDepth; uniform float S;
      void main(){ vMoho=moho; vKm=-position.y/S; vS=sx; vec4 mv=modelViewMatrix*vec4(position,1.0); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 fogColor; uniform float fogNear, fogFar; varying float vMoho, vKm, vS, vDepth;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 c; float n=hash(floor(vec2(vS*3000.0, vKm*14.0)));
        if (vKm < vMoho) { c = mix(vec3(0.74,0.66,0.55), vec3(0.52,0.45,0.39), smoothstep(8.0, 30.0, vKm)); c *= 0.9+0.12*n; }
        else { c = mix(vec3(0.80,0.40,0.20), vec3(0.55,0.20,0.12), smoothstep(vMoho, 80.0, vKm)); c *= 0.92+0.1*n; }
        float ml = 1.0-smoothstep(0.25, 0.55, abs(vKm - vMoho)); c = mix(c, vec3(1.0,0.95,0.8), ml);
        float base = (1.0-smoothstep(0.15, 0.3, abs(vKm - 35.0))) * step(0.5, fract(vS*90.0)); c = mix(c, vec3(0.95,0.95,1.0), base*0.75);
        float sea = 1.0-smoothstep(0.08, 0.2, abs(vKm)); c = mix(c, vec3(0.35,0.65,0.95), sea);
        float tick = (1.0-smoothstep(0.06,0.12,abs(fract(vKm/10.0+0.5)-0.5)*10.0)) * step(0.985, fract(vS*12.0)); c = mix(c, vec3(1.0), tick*0.3);
        gl_FragColor=vec4(mix(c, fogColor, smoothstep(fogNear, fogFar, vDepth)), 1.0); }`
  });
  function face(jCol, zPos, flip) {
    const g = new THREE.BufferGeometry(); const P = [], MO = [], SX = [], I = [];
    const VR = 90;
    for (let i = 0; i < NL; i++) { const top_ = Math.max(hAt(i, jCol), 0.002); for (let v = 0; v <= VR; v++) { const y = top_ - (top_ + DEPTH) * v / VR; P.push(X(i), y, zPos); MO.push(M.moho[i]); SX.push(i / (NL - 1)); } }
    for (let i = 0; i < NL - 1; i++) for (let v = 0; v < VR; v++) { const a = i * (VR + 1) + v, b = a + 1, c = a + VR + 1, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); }
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("moho", new THREE.Float32BufferAttribute(MO, 1)); g.setAttribute("sx", new THREE.Float32BufferAttribute(SX, 1)); g.setIndex(I);
    return new THREE.Mesh(g, faceMat);
  }
  root.add(face(0, WID / 2, false)); root.add(face(NW - 1, -WID / 2, true));
  const endM = new THREE.MeshStandardMaterial({ color: 0x6B5A4A, roughness: 1 });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(WID, DEPTH), endM); e.position.set(s * LEN / 2, -DEPTH / 2, 0); e.rotation.y = s * Math.PI / 2; root.add(e); }
  // أرضية المختبر
  const grid = new THREE.GridHelper(160, 80, 0x2A3B5A, 0x1A2638); grid.position.y = -DEPTH - 1.2; root.add(grid);
  // موضع القمة
  const iEv = M.ev_i, xEv = X(iEv), yEv = Math.max(...Array.from({ length: NW }, (_, j) => hAt(iEv, j)));
  const hFront = hAt(iEv, 0), mohoEv = M.moho[iEv];
  const VZ = WID / 2 + 7.5, Y0 = 0;
  const sc = base(root, "mount", { pos: new V3(xEv, Y0, VZ), yaw: 0, pitch: -0.5, panelDist: 1.3 });
  sc.steps = [false, false, false];
  // المنصّة والمصعد
  const lift = new THREE.Group(); root.add(lift);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.6), new THREE.MeshStandardMaterial({ color: 0x9FB7D0, transparent: true, opacity: 0.45, roughness: 0.2 })); lift.add(glass);
  const railM = new THREE.MeshStandardMaterial({ color: 0xC49A3A, metalness: 0.5, roughness: 0.4 });
  for (const s of [-1, 1]) { const tr = new THREE.Mesh(new THREE.BoxGeometry(0.06, DEPTH + 4, 0.06), railM); tr.position.set(xEv + s * 1.6, -DEPTH / 2 + 1.0, VZ + 0.7); root.add(tr); }
  const placeLift = () => lift.position.set(sc.view.pos.x, sc.view.pos.y - 0.03, sc.view.pos.z);
  placeLift();
  // المسطرة على الوجه
  const rcv = document.createElement("canvas"); rcv.width = 384; rcv.height = 2048; const rc = rcv.getContext("2d");
  const RT = 10, RB = -72, kmPx = 2048 / (RT - RB);
  rc.fillStyle = "rgba(251,247,238,0.94)"; rc.fillRect(0, 0, 384, 2048);
  rc.fillStyle = "#172338"; rc.font = `800 54px ${U.FONT}`; rc.textAlign = ar ? "right" : "left"; rc.direction = ar ? "rtl" : "ltr";
  for (let km = RT; km >= RB; km--) { const y = (RT - km) * kmPx; const big = km % 10 === 0, mid = km % 5 === 0; rc.fillRect(0, y - 1.5, big ? 90 : mid ? 60 : 30, 3); if (big) rc.fillText(`${U.num(Math.abs(km))} ${T.km}`, ar ? 376 : 104, y + 18); }
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.85, (RT - RB) * S), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(rcv), transparent: true }));
  ruler.position.set(xEv + (ar ? -1.0 : 1.0), (RT + RB) / 2 * S, WID / 2 + 0.03); root.add(ruler);
  // العلامات
  const marker = (y, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4 })); m.position.set(xEv, y, WID / 2 + 0.06); root.add(m); return m; };
  const mSum = marker(hFront + 0.04, 0xE04A3A), mMoho = marker(-mohoEv * S, 0xFFF0C8);
  const lab = (t, x, y, opts) => { const l = U.label(t, Object.assign({ size: 40, height: 0.34 }, opts)); l.position.set(x, y, WID / 2 + 0.12); root.add(l); return l; };
  lab(T.summit, xEv, yEv + 0.6, { stroke: "#E04A3A", lw: 4, height: 0.4 });
  lab(T.sea, xEv + (ar ? 4.2 : -4.2), 0.28, { size: 34, height: 0.28, stroke: "#4E8FD8", lw: 3 });
  lab(T.crust, xEv + (ar ? 5.2 : -5.2), -1.9, { size: 40, height: 0.4 });
  lab(T.mantle, xEv + (ar ? 5.2 : -5.2), -7.2, { size: 40, height: 0.4, stroke: "#B84C24", lw: 3 });
  const iN = Math.round(NL * 0.1); lab(T.normal, X(iN), -3.5 + 0.32, { size: 34, height: 0.3 });
  const iRoot = M.moho_max_i; lab(T.root, X(iRoot), -M.moho[iRoot] * S - 0.5, { size: 40, height: 0.42, stroke: C.gold, lw: 4 });
  const iM = Math.round(NL * 0.62); lab(T.moho, X(iM), -M.moho[iM] * S + 0.36, { size: 34, height: 0.3, stroke: "#FFF0C8", lw: 3 });
  lab(T.india + "\n" + T.south, X(25), 0.9, { size: 38, height: 0.62 });
  lab(T.tibet + "\n" + T.north, X(NL - 40), 1.5, { size: 38, height: 0.62 });
  const readLab = U.label(" ", { size: 40, height: 0.2 }); root.add(readLab); readLab.visible = false;
  function showRead(text, y, col) { const n = U.label(text, { size: 42, height: 0.22, stroke: col, lw: 4 }); readLab.material.map = n.material.map; readLab.scale.copy(n.scale); readLab.material.needsUpdate = true; readLab.position.set(xEv + (ar ? 2.6 : -2.6), y, WID / 2 + 0.25); readLab.scale.multiplyScalar(1.8); readLab.visible = true; }
  // لوح المقارنة
  const cmp = new THREE.Group(); root.add(cmp); cmp.visible = false;
  function buildCompare() {
    const c2 = document.createElement("canvas"); c2.width = 900; c2.height = 1100; const c = c2.getContext("2d");
    c.fillStyle = "rgba(251,247,238,0.96)"; U.rrect(c, 6, 6, 888, 1088, 40); c.fill(); c.strokeStyle = "#C49A3A"; c.lineWidth = 8; c.stroke();
    c.fillStyle = "#172338"; c.font = `800 52px ${U.FONT}`; c.textAlign = "center"; c.direction = ar ? "rtl" : "ltr"; c.fillText(T.compare, 450, 90, 820);
    const k = 11; const x1 = ar ? 600 : 300, x2 = ar ? 300 : 600; const y0 = 260;
    c.fillStyle = "#E04A3A"; c.fillRect(x1 - 60, y0 - 9 * k, 120, 9 * k); c.fillStyle = "#B98E2E"; c.fillRect(x2 - 60, y0, 120, mohoEv * k);
    c.fillStyle = "#2A6F8F"; c.fillRect(120, y0 - 2, 660, 4);
    c.fillStyle = "#172338"; c.font = `800 46px ${U.FONT}`; c.fillText(`${U.num(9)} ${T.km}`, x1, y0 - 9 * k - 20); c.fillText(`${U.num(Math.round(mohoEv))} ${T.km}`, x2, y0 + mohoEv * k + 56);
    c.font = `700 36px ${U.FONT}`; c.fillStyle = "#6C7385"; c.fillText(T.sea, 450, y0 - 16);
    const t2 = new THREE.CanvasTexture(c2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.22), new THREE.MeshBasicMaterial({ map: t2, transparent: true, side: THREE.DoubleSide })); cmp.add(m);
  }
  E.addTo(sc, mSum, { onSelect: () => { if (sc.steps[0]) return; RX.A.sfx("find"); showRead(T.heightRead, hFront + 0.35, "#E04A3A"); RX.app.toast("✓ " + T.heightRead, null); RX.app.stepDone(sc, 0); }, onHover: on => mSum.scale.setScalar(on ? 1.4 : 1) });
  E.addTo(sc, mMoho, { onSelect: () => { if (!sc.steps[1] || sc.steps[2]) { if (!sc.steps[1]) RX.app.toast(T.tapSummit, null, "bad"); return; }
    RX.A.sfx("find"); showRead(T.depthRead, -mohoEv * S + 0.32, "#B98E2E"); buildCompare(); cmp.visible = true;
    cmp.position.set(xEv + (ar ? 0.95 : -0.95), sc.view.pos.y + 1.5, VZ - 2.6); cmp.rotation.y = ar ? 0.3 : -0.3;
    RX.app.toast("✓ " + T.depthRead, T.compare); sc.info = { title: T.compare, text: `${T.heightRead}. ${T.depthRead}.` }; RX.app.stepDone(sc, 2); }, onHover: on => mMoho.scale.setScalar(on ? 1.4 : 1) });
  sc.down = false;
  async function travel(down) {
    if (sc.moving) return; sc.moving = true; RX.A.sfx("whoosh");
    const y0 = sc.view.pos.y, y1 = down ? -mohoEv * S - 1.1 : Y0, p0 = E.pitch, p1 = down ? -0.1 : -0.5;
    await U.tween(4200, k => { sc.view.pos.y = y0 + (y1 - y0) * k; E.dolly.position.y = sc.view.pos.y; E.pitch = p0 + (p1 - p0) * k; placeLift();
      const km = Math.max(0, -(sc.view.pos.y + 1.62) / S); depthLab(km); });
    sc.down = down; sc.moving = false; sc.view.pitch = p1; RX.UI.placePanel(sc);
    if (down && !sc.steps[1]) { RX.app.stepDone(sc, 1); sc.info = { title: T.steps[2], text: T.tapMoho }; }
    RX.app.refresh();
  }
  const dl = U.label(" ", { size: 40, height: 0.16 }); root.add(dl); dl.visible = false;
  function depthLab(km) { const n = U.label(`${ar ? "العمق" : "Depth"}: ${U.num(Math.round(km))} ${T.km}`, { size: 40, height: 0.16, stroke: C.gold, lw: 4 }); dl.material.map.dispose(); dl.material.map = n.material.map; dl.scale.copy(n.scale); dl.material.needsUpdate = true; dl.position.set(sc.view.pos.x + (ar ? 0.7 : -0.7), sc.view.pos.y + 1.05, sc.view.pos.z - 0.6); dl.visible = km > 0.5; }
  sc.actions = () => {
    const a = [];
    if (sc.steps[0] && !sc.down) a.push({ label: T.descend, primary: !sc.steps[1], onClick: () => travel(true) });
    if (sc.down && sc.steps[2]) a.push({ label: T.ascend, onClick: () => travel(false) });
    return a;
  };
  sc.toolHint = () => !sc.steps[0] ? T.tapSummit : (sc.down && !sc.steps[2] ? T.tapMoho : null);
  sc.ambience = { wind: 0.1 };
  sc.update = function (dt, t) { const s = 1 + 0.12 * Math.sin(t * 4); if (!sc.steps[0]) mSum.scale.setScalar(s); if (sc.steps[1] && !sc.steps[2]) mMoho.scale.setScalar(s); };
  sc.real = "https://earth.google.com/web/@27.9881,86.925,8000a,90000d,35y,0h,70t,0r";
  return sc;
};

// =====================================================================
// ٤) ملتقى البحرين — قارب مسح في مصب شط العرب (صورة القمر الصناعي الحقيقية)
// =====================================================================
ST.sea = async function (assets) {
  const T = U.T().stations.sea, ar = U.lang() === "ar";
  const meta = assets.meta.sea;
  const WL = -3 - meta.h0;           // مستوى الماء في المشهد (h0 = −٣ لأن المركز ماء، فـWL = ٠)
  const w = await W.buildStation("sea", assets, { exag: 1, flat: 0, noNear: true, noWater: true, horizon: 0xDCE3E3, zenith: 0x5C8FBF, seaSpec: 1, seaLevel: WL + 0.4, fogNear: 2500, fogFar: 15000, satGain: 1.05 });
  const root = w.root;
  // نقاط القياس (من صورة القمر الصناعي: من داخل النهر إلى ماء الخليج)
  const px = [[210, 417], [320, 453], [450, 480], [560, 526], [640, 572], [700, 630], [770, 710], [860, 820]];
  const PTS = px.map(([a, b]) => new V3((a - 512) * 24000 / 1024, WL, (b - 512) * 24000 / 1024));
  const SAL = [1.6, 2.1, 4.5, 11, 21, 31, 37, 40];
  const heading = i => { const a = PTS[Math.min(i + 1, 7)], b = PTS[Math.max(i, i === 7 ? 6 : i)]; const d = i === 7 ? PTS[7].clone().sub(PTS[6]) : a.clone().sub(b); return Math.atan2(-d.x, -d.z); };
  // القارب
  const boat = new THREE.Group(); root.add(boat);
  const hs = new THREE.Shape(); hs.moveTo(0, -3.4); hs.quadraticCurveTo(1.25, -2.2, 1.25, -0.6); hs.lineTo(1.2, 2.4); hs.lineTo(-1.2, 2.4); hs.lineTo(-1.25, -0.6); hs.quadraticCurveTo(-1.25, -2.2, 0, -3.4);
  const hullG = new THREE.ExtrudeGeometry(hs, { depth: 0.9, bevelEnabled: false }); hullG.rotateX(-Math.PI / 2); hullG.translate(0, -0.55, 0);
  // تصحيح الاتجاه: مقدّمة القارب نحو −z
  hullG.scale(1, 1, -1); hullG.computeVertexNormals();
  const hull = new THREE.Mesh(hullG, new THREE.MeshStandardMaterial({ color: 0xF2F2EE, roughness: 0.5, side: THREE.DoubleSide })); boat.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.12, 5.4), new THREE.MeshStandardMaterial({ color: 0x0F6B6B })); stripe.position.set(0, -0.2, -0.4); boat.add(stripe);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 5.2), new THREE.MeshStandardMaterial({ color: 0x9A8A74, roughness: 0.9 })); deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.3, -0.3); boat.add(deck);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 1.4), new THREE.MeshStandardMaterial({ color: 0xE9E6DD, roughness: 0.6 })); cab.position.set(0, 1.05, 1.5); boat.add(cab);
  const railM = new THREE.MeshStandardMaterial({ color: 0x8C9AA8, metalness: 0.6, roughness: 0.3 });
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 4.2), railM); r.position.set(s * 1.12, 1.1, -0.8); boat.add(r); for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), railM); p.position.set(s * 1.12, 0.7, -2.6 + k * 0.9); boat.add(p); } }
  // ذراع المجسّ
  const side = ar ? -1 : 1;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), railM); arm.position.set(side * 1.55, 1.6, -1.2); boat.add(arm);
  const armP = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), railM); armP.position.set(side * 1.0, 0.95, -1.2); boat.add(armP);
  const probe = new THREE.Group(); probe.position.set(side * 2.1, 1.5, -1.2); boat.add(probe);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), new THREE.MeshBasicMaterial({ color: 0x222222 })); probe.add(cable);
  const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0xF2B33D })); probe.add(bulb);
  const setProbe = d => { cable.scale.y = d; cable.position.y = -d / 2; bulb.position.y = -d - 0.17; };
  setProbe(0.2);
  W.cast(boat);
  // لوح الرسم البياني على القارب
  const ccv = document.createElement("canvas"); ccv.width = 1024; ccv.height = 700; const cc = ccv.getContext("2d");
  const chartT = new THREE.CanvasTexture(ccv);
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.855), new THREE.MeshBasicMaterial({ map: chartT, transparent: true, side: THREE.DoubleSide }));
  chart.position.set(-side * 0.55, 1.75, -2.25); chart.rotation.set(-0.15, -side * 0.35, 0); boat.add(chart);
  const readings = [];
  function drawChart(zone) {
    const c = cc; c.clearRect(0, 0, 1024, 700);
    c.fillStyle = "rgba(251,247,238,0.97)"; U.rrect(c, 6, 6, 1012, 688, 34); c.fill(); c.strokeStyle = "#22375A"; c.lineWidth = 8; c.stroke();
    c.fillStyle = "#172338"; c.font = `800 46px ${U.FONT}`; c.textAlign = "center"; c.direction = ar ? "rtl" : "ltr"; c.fillText(T.chart, 512, 70);
    c.font = `700 28px ${U.FONT}`; c.fillStyle = "#6C7385"; c.fillText(T.chartNote, 512, 110);
    const L = 120, R = 940, TOP = 150, BOT = 590; const xp = i => ar ? R - i * (R - L) / 7 : L + i * (R - L) / 7; const yp = v => BOT - v / 42 * (BOT - TOP);
    if (zone) { c.fillStyle = "rgba(196,154,58,0.22)"; const a = xp(2), b = xp(6); c.fillRect(Math.min(a, b), TOP, Math.abs(b - a), BOT - TOP); }
    c.strokeStyle = "#22375A"; c.lineWidth = 3; c.beginPath(); c.moveTo(L, BOT); c.lineTo(R, BOT); c.stroke();
    c.fillStyle = "#6C7385"; c.font = `700 28px ${U.FONT}`;
    for (let i = 0; i < 8; i++) c.fillText(U.num(i + 1), xp(i), BOT + 40);
    c.fillStyle = "#2A6F8F"; c.fillText(T.fresh, xp(0), BOT + 80); c.fillStyle = "#A6362B"; c.fillText(T.salty, xp(7), BOT + 80);
    for (const v of [10, 20, 30, 40]) { c.strokeStyle = "rgba(34,55,90,0.12)"; c.beginPath(); c.moveTo(L, yp(v)); c.lineTo(R, yp(v)); c.stroke(); c.fillStyle = "#6C7385"; c.fillText(U.num(v), ar ? R + 40 : L - 40, yp(v) + 10); }
    if (readings.length) {
      c.strokeStyle = "#0F6B6B"; c.lineWidth = 6; c.beginPath(); readings.forEach((v, i) => i ? c.lineTo(xp(i), yp(v)) : c.moveTo(xp(i), yp(v))); c.stroke();
      readings.forEach((v, i) => { const t = v / 40; c.fillStyle = `rgb(${Math.round(44 + t * 122)},${Math.round(110 - t * 56)},${Math.round(143 - t * 100)})`; c.beginPath(); c.arc(xp(i), yp(v), 14, 0, 7); c.fill();
        c.fillStyle = "#172338"; c.font = `800 28px ${U.FONT}`; c.fillText(U.num(v), xp(i), yp(v) - 24); });
    }
    chartT.needsUpdate = true;
  }
  drawChart(false);
  // الوضع
  sc_place(0);
  function sc_place(i) { const p = PTS[i]; boat.position.set(p.x, WL + 0.12, p.z); boat.rotation.y = heading(i); }
  const eye = () => { const o = new V3(0, 0.32, 0.5).applyAxisAngle(new V3(0, 1, 0), boat.rotation.y); return boat.position.clone().add(o); };
  const sc = base(root, "sea", { pos: eye(), yaw: heading(0), pitch: -0.12, panelDist: 1.2 });
  sc.w = w; sc.steps = [false, false]; sc.at = 0; sc.measured = -1;
  // لافتات بعيدة
  const lb = (t, p, h, col, lh) => { const g = W.beacon(t, null, col, h, lh); g.position.set(p.x, WL, p.z); root.add(g); return g; };
  lb(T.river, PTS[0].clone().add(new V3(-2600, 0, -900)), 260, 0x2A6F8F, 230);
  lb(T.gulf, PTS[7].clone().add(new V3(2600, 0, 2600)), 320, 0x0F6B6B, 300);
  const kp = at(242, 11500); lb(T.khor, { x: kp.x, z: kp.z }, 300, 0xB98E2E, 260);
  const readLab = U.label(" ", { size: 44, height: 0.22 }); readLab.visible = false; boat.add(readLab);
  async function measure() {
    if (sc.busy || sc.measured >= sc.at) return; if (sc.high) await aerial(false); sc.busy = true; RX.A.sfx("click");
    await U.tween(1200, k => setProbe(0.2 + k * 2.0));
    const v = SAL[sc.at]; readings[sc.at] = v; sc.measured = sc.at; drawChart(false); RX.A.sfx("find");
    const n = U.label(`${T.reading}: ${U.num(v)} ${T.unit}`, { size: 44, height: 0.2, stroke: C.gold, lw: 4 }); readLab.material.map = n.material.map; readLab.scale.copy(n.scale); readLab.material.needsUpdate = true;
    readLab.position.set(side * 1.9, 1.95, -1.2); readLab.visible = true;
    RX.app.toast(`${U.num(sc.at + 1)}: ${U.num(v)} ${T.unit}`, null);
    await U.tween(800, k => setProbe(2.2 - k * 2.0));
    sc.busy = false;
    if (readings.filter(x => x != null).length === 8) { RX.app.stepDone(sc, 0); sc.zoneQ = true; }
    RX.app.refresh();
  }
  sc.high = false;
  async function aerial(on) {
    await E.fade(1, 320); sc.high = on;
    // من الأعلى: المصبّ كله في صورةٍ واحدة — النهر شمالاً والخليج جنوباً
    const e = eye(); if (on) { sc.view.pos.set(0, 7500, 9500); sc.view.pitch = -0.66; sc.view.yaw = 0; } else { sc.view.pos.copy(e); sc.view.pitch = -0.12; sc.view.yaw = heading(sc.at); }
    w.uni.fogNear.value = on ? 22000 : 2500; w.uni.fogFar.value = on ? 70000 : 15000; root.fog.near = w.uni.fogNear.value; root.fog.far = w.uni.fogFar.value;
    E.placeView(); RX.UI.placePanel(sc); RX.A.sfx("whoosh"); await E.fade(0, 520); RX.app.refresh();
  }
  async function advance() {
    if (sc.busy || sc.at >= 7 || sc.measured < sc.at) return; sc.busy = true;
    if (sc.high) { sc.high = false; sc.view.pitch = -0.12; sc.view.yaw = heading(sc.at); w.uni.fogNear.value = 2500; w.uni.fogFar.value = 15000; root.fog.near = 2500; root.fog.far = 15000; }
    await E.fade(1, 380); sc.at++; sc_place(sc.at); readLab.visible = false;
    sc.view.pos.copy(eye()); sc.view.yaw = heading(sc.at); E.placeView(); RX.UI.placePanel(sc); RX.A.sfx("whoosh");
    await E.fade(0, 520); sc.busy = false; RX.app.refresh();
  }
  sc.actions = () => {
    const a = [];
    if (!sc.steps[0]) {
      if (sc.measured < sc.at) a.push({ label: `${T.measure} (${U.num(sc.at + 1)}/${U.num(8)})`, primary: true, onClick: measure });
      else if (sc.at < 7) a.push({ label: T.advance, primary: true, onClick: advance });
    }
    if (!sc.high) a.push({ label: T.aerial, onClick: () => aerial(true) });
    else a.push({ label: T.backBoat, onClick: () => aerial(false) });
    return a;
  };
  sc.question2 = () => (sc.zoneQ && !sc.steps[1]) ? (sc.zq || (sc.zq = { q: T.zoneQ, choices: T.zones, label: T.steps[1], onCorrect: () => { drawChart(true); RX.app.stepDone(sc, 1); } })) : null;
  sc.stepLabel = i => i === 0 ? `${T.steps[0]} (${U.num(readings.filter(x => x != null).length)}/${U.num(8)})` : null;
  sc.ambience = { wind: 0.35, sea: 0.7 };
  sc.update = function (dt, t) { w.uni.time.value = t; boat.position.y = WL + 0.12 + Math.sin(t * 1.1) * 0.05; boat.rotation.z = Math.sin(t * 0.9) * 0.015; };
  sc.real = `https://earth.google.com/web/@29.94,48.594,0a,30000d,35y,0h,45t,0r`;
  return sc;
};

// =====================================================================
// ٥) الرياح اللواقح — مزارع العبدلي ورياح الكوس
// =====================================================================
function frondTex() {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 512; const c = cv.getContext("2d");
  c.strokeStyle = "#5E7A2E"; c.lineWidth = 6; c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 512); c.stroke();
  for (let y = 20; y < 500; y += 9) { const l = 58 * Math.sin(Math.PI * y / 512) + 6; c.strokeStyle = y % 18 ? "#7C9A3C" : "#6A8833"; c.lineWidth = 4;
    c.beginPath(); c.moveTo(64, y); c.lineTo(64 - l, y - 26); c.stroke(); c.beginPath(); c.moveTo(64, y); c.lineTo(64 + l, y - 26); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); return t;
}
function barkTex() {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 256; const c = cv.getContext("2d"); c.fillStyle = "#7A5A3A"; c.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 16) for (let x = 0; x < 128; x += 16) { c.fillStyle = (x + y) % 32 ? "#6B4C30" : "#8A6844"; c.beginPath(); c.moveTo(x + 8, y); c.lineTo(x + 16, y + 8); c.lineTo(x + 8, y + 16); c.lineTo(x, y + 8); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 6); return t;
}
function palm(h, mats, rnd) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, h, 10, 6), mats.bark); trunk.position.y = h / 2; g.add(trunk);
  const crown = new THREE.Group(); crown.position.y = h; g.add(crown);
  const n = 20;
  for (let i = 0; i < n; i++) {
    const geo = new THREE.PlaneGeometry(0.75, 3.2, 1, 10); const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k) + 1.6; const t = y / 3.2; p.setZ(k, -t * t * 1.4); p.setY(k, y); }
    geo.computeVertexNormals();
    const f = new THREE.Mesh(geo, mats.frond); const a = i / n * Math.PI * 2 + rnd() * 0.3;
    const g2 = new THREE.Group(); g2.rotation.y = a; f.rotation.x = -0.35 - (i % 3) * 0.28 - rnd() * 0.2; g2.add(f); crown.add(g2);
  }
  g.userData.crown = crown;
  return g;
}
ST.wind = async function (assets) {
  const T = U.T().stations.wind, ar = U.lang() === "ar";
  const w = await W.buildStation("wind", assets, { exag: 2, groundColor: 0xB8A07A, groundStyle: "gravel", nearR: 75, horizon: 0xE6DCCB, zenith: 0x5D90C4 });
  const root = w.root;
  const sc = base(root, "wind", { pos: new V3(0, 0, 0), yaw: 0, pitch: 0.06 });
  sc.w = w; sc.steps = [false, false];
  const mats = { bark: new THREE.MeshStandardMaterial({ map: barkTex(), roughness: 1 }), frond: new THREE.MeshStandardMaterial({ map: frondTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }) };
  const rnd = (function () { let s = 99; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  // بستان: صفوف نخيل
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 2; j++) {
    const x = i * 7.5 + (rnd() - 0.5) * 2, z = j * 7.5 - 6 + (rnd() - 0.5) * 2;
    if (Math.hypot(x, z) < 7 || (Math.abs(x) < 9 && z < -2 && z > -14)) continue;
    const p = palm(5 + rnd() * 3.5, mats, rnd); p.position.set(x, w.groundAt(x, z), z); p.rotation.y = rnd() * 6; W.cast(p); root.add(p);
  }
  // النخلتان: ذكر وأنثى
  const male = palm(6.2, mats, rnd), female = palm(6.0, mats, rnd);
  const mx = ar ? 4.5 : -4.5, fx = -mx;
  male.position.set(mx, 0, -9); female.position.set(fx, 0, -9.5); W.cast(male); W.cast(female); root.add(male, female);
  // الطلع
  const spathe = (g, col, beads) => { const s = new THREE.Group(); s.position.set(0, -0.35, 0); g.userData.crown.add(s);
    const sm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
    for (let k = 0; k < 4; k++) { const b = new THREE.Group(); const a0 = k * Math.PI / 2 + 0.4; b.position.set(Math.cos(a0) * 0.35, 0, Math.sin(a0) * 0.35); s.add(b);
      const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x8A6A3A, roughness: 0.9 })); sheath.position.y = -0.1; b.add(sheath);
      for (let q = 0; q < 14; q++) { const ang = q / 14 * Math.PI * 2, tilt = 0.18 + (q % 3) * 0.07;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.8, 4), sm); st.position.set(Math.cos(ang) * 0.05 + Math.sin(tilt) * Math.cos(ang) * 0.4, -0.75, Math.sin(ang) * 0.05 + Math.sin(tilt) * Math.sin(ang) * 0.4); st.rotation.set(Math.sin(ang) * tilt, 0, -Math.cos(ang) * tilt); b.add(st);
        if (beads) for (let r = 0; r < 4; r++) { const bd = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), beads); const L = 0.45 + r * 0.17; bd.position.set(Math.cos(ang) * (0.05 + Math.sin(tilt) * L), -0.35 - Math.cos(tilt) * L, Math.sin(ang) * (0.05 + Math.sin(tilt) * L)); bd.userData.bead = true; b.add(bd); } } }
    return s; };
  const beadM = new THREE.MeshStandardMaterial({ color: 0xC7D27A, roughness: 0.6 });
  const mSp = spathe(male, 0xF2EAD0, null), fSp = spathe(female, 0xB6A85C, beadM);
  const fruits = []; fSp.traverse(o => { if (o.userData.bead) fruits.push(o); });
  const labM = U.label(T.male, { size: 44, height: 0.5, anchorBottom: true, stroke: C.gold, lw: 4 }); labM.position.set(mx, 7.6, -9); root.add(labM);
  const labF = U.label(T.female, { size: 44, height: 0.5, anchorBottom: true, stroke: C.green, lw: 4 }); labF.position.set(fx, 7.4, -9.5); root.add(labF);
  const farmLab = W.beacon(T.farms, null, 0x2E7D55, 120, 90); const fp = at(200, 1600); farmLab.position.set(fp.x, w.groundAt(fp.x, fp.z), fp.z); root.add(farmLab);
  // جسيمات: خطوط الريح، اللقاح، البخار
  const NWND = 260; const wpos = new Float32Array(NWND * 6); const wv = [];
  for (let i = 0; i < NWND; i++) wv.push(new V3((Math.random() - 0.5) * 50, 0.5 + Math.random() * 9, -2 - Math.random() * 30));
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.BufferAttribute(wpos, 3));
  const wl = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0 })); root.add(wl);
  const NP = 420; const ppos = new Float32Array(NP * 3); const pv = [];
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(ppos, 3));
  const pollen = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xFFD23A, size: 0.16, transparent: true, opacity: 0 })); root.add(pollen);
  const NV = 500; const vpos = new Float32Array(NV * 3); const vv = [];
  const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.BufferAttribute(vpos, 3));
  const vapor = new THREE.Points(vg, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 4.5, transparent: true, opacity: 0, depthWrite: false })); root.add(vapor);
  // السحب
  const ccv = document.createElement("canvas"); ccv.width = ccv.height = 256; const cc = ccv.getContext("2d");
  for (let i = 0; i < 26; i++) { const x = 60 + Math.random() * 136, y = 90 + Math.random() * 80, r = 30 + Math.random() * 50; const g = cc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); cc.fillStyle = g; cc.beginPath(); cc.arc(x, y, r, 0, 7); cc.fill(); }
  const cTex = new THREE.CanvasTexture(ccv); const clouds = [];
  for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cTex, transparent: true, opacity: 0, color: 0xF4F4F6, fog: false, depthWrite: false })); const a = at((Math.random() - 0.5) * 150, 120 + Math.random() * 700); sp.position.set(a.x, 160 + Math.random() * 160, a.z); const s = 260 + Math.random() * 300; sp.scale.set(s, s * 0.6, 1); sp.userData.s = s; root.add(sp); clouds.push(sp); }
  const NR = 900; const rpos = new Float32Array(NR * 6); const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rpos, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0x8FA9C2, transparent: true, opacity: 0 })); root.add(rain);
  const rv = []; for (let i = 0; i < NR; i++) rv.push(new V3((Math.random() - 0.5) * 60, Math.random() * 30, (Math.random() - 0.5) * 60));
  // الحالة
  let wind = new V3(0, 0, 0), windOn = 0, pollenOn = false, kawsOn = false, kawsT = 0, rainK = 0;
  const mPos = new V3(), fPos = new V3();
  async function gust() {
    if (pollenOn || sc.steps[0]) return; pollenOn = true; RX.A.sfx("whoosh"); RX.A.ambience({ wind: 0.9 });
    mSp.getWorldPosition(mPos); fSp.getWorldPosition(fPos);
    wind.set(fx > mx ? 1 : -1, 0, 0).multiplyScalar(5);
    pv.length = 0; for (let i = 0; i < NP; i++) pv.push({ p: mPos.clone().add(new V3((Math.random() - 0.5) * 0.6, -0.4 - Math.random() * 0.4, (Math.random() - 0.5) * 0.6)), v: new V3(), t: -Math.random() * 2.2, done: false });
    pollen.material.opacity = 1; windOn = 1;
    await U.wait(5200);
    fruits.forEach((b, i) => setTimeout(() => { b.material = new THREE.MeshStandardMaterial({ color: 0x6E9A2A, roughness: 0.5 }); U.tween(600, k => b.scale.set(1 + k * 0.7, 1 + k * 1.4, 1 + k * 0.7)); }, i * 18));
    RX.A.sfx("ok"); RX.app.toast("✓ " + T.pollinated, null); RX.app.stepDone(sc, 0);
    sc.info = { title: T.pollen, text: T.pollinated };
    await U.wait(1500); windOn = 0.35; RX.A.ambience({ wind: 0.4 }); RX.app.refresh();
  }
  async function kaws() {
    if (kawsOn || !sc.steps[0] || sc.steps[1]) return; kawsOn = true; RX.A.sfx("whoosh"); RX.A.ambience({ wind: 0.8 });
    wind.set(-0.7, 0, -0.7).multiplyScalar(6); windOn = 1;
    vv.length = 0; for (let i = 0; i < NV; i++) { const a = at(100 + Math.random() * 70, 40 + Math.random() * 400); vv.push(new V3(a.x, 2 + Math.random() * 30, a.z)); }
    vapor.material.opacity = 0.5;
    const vl = U.label(T.vapor, { size: 42, height: 0.6, stroke: "#9FB6CC", lw: 4 }); const vp = at(135, 16); vl.position.set(vp.x, 6, vp.z); root.add(vl); sc.vapLab = vl;
    await U.tween(7000, k => { kawsT = k; w.sky.material.uniforms.dark.value = 0.55 * k; clouds.forEach(c => { c.material.opacity = 0.9 * k; c.scale.set(c.userData.s * (0.6 + 0.4 * k), c.userData.s * 0.6 * (0.6 + 0.4 * k), 1); }); });
    rainK = 1; rain.material.opacity = 0.85; RX.A.ambience({ wind: 0.5, rain: 0.7 });
    await U.tween(2500, k => { w.uni.wet.value = 0.6 * k; });
    RX.A.sfx("ok"); RX.app.toast("✓ " + T.rained, null); RX.app.stepDone(sc, 1);
    sc.info = { title: T.steps[1], text: T.rained }; RX.app.refresh();
  }
  sc.actions = () => {
    const a = [];
    if (!sc.steps[0]) a.push({ label: T.gust, primary: true, onClick: gust });
    else if (!sc.steps[1]) a.push({ label: T.kaws, primary: true, onClick: kaws });
    return a;
  };
  E.addTo(sc, male, { onSelect: gust });
  sc.ambience = { wind: 0.35 };
  sc.update = function (dt, t) {
    w.uni.time.value = t;
    // الأشجار تتمايل
    const sway = 0.03 + 0.06 * windOn;
    root.children.forEach(o => { if (o.userData && o.userData.crown) o.userData.crown.rotation.z = Math.sin(t * 1.3 + o.position.x) * sway; });
    // خطوط الريح
    wl.material.opacity += ((windOn ? 0.45 : 0) - wl.material.opacity) * Math.min(1, dt * 2);
    if (wl.material.opacity > 0.01) {
      const d = wind.clone().normalize();
      for (let i = 0; i < NWND; i++) { const p = wv[i]; p.addScaledVector(wind, dt * 2.2); if (Math.abs(p.x) > 28 || Math.abs(p.z + 16) > 22) { p.set(-d.x * 26 + (Math.random() - 0.5) * 30 * Math.abs(d.z), 0.5 + Math.random() * 9, -16 - d.z * 20 + (Math.random() - 0.5) * 30 * Math.abs(d.x)); }
        wpos.set([p.x, p.y, p.z, p.x - d.x * 1.6, p.y, p.z - d.z * 1.6], i * 6); }
      wg.attributes.position.needsUpdate = true;
    }
    // اللقاح يُحمل نحو الأنثى
    if (pollenOn && pv.length) {
      for (let i = 0; i < NP; i++) { const q = pv[i]; q.t += dt; if (q.t < 0) { ppos.set([q.p.x, q.p.y, q.p.z], i * 3); continue; }
        if (!q.done) { const to = fPos.clone().sub(q.p); const dist = to.length(); if (dist < 0.4) q.done = true;
          q.v.lerp(to.normalize().multiplyScalar(3.2).add(new V3(Math.sin(t * 3 + i) * 0.8, Math.cos(t * 2.3 + i * 1.7) * 0.6, Math.sin(t * 2 + i * 0.7) * 0.8)), Math.min(1, dt * 1.8)); q.p.addScaledVector(q.v, dt); }
        ppos.set([q.p.x, q.p.y, q.p.z], i * 3); }
      pg.attributes.position.needsUpdate = true;
    }
    // البخار يصعد مع الكوس
    if (kawsOn) { for (let i = 0; i < NV; i++) { const p = vv[i]; p.addScaledVector(wind, dt * 6); p.y += dt * (10 + (i % 7) * 3); if (p.y > 300) { const a = at(100 + Math.random() * 70, 60 + Math.random() * 300); p.set(a.x, 2, a.z); } vpos.set([p.x, p.y, p.z], i * 3); } vg.attributes.position.needsUpdate = true; }
    // المطر
    if (rainK > 0) { for (let i = 0; i < NR; i++) { const p = rv[i]; p.y -= dt * 22; p.x += dt * -1.5; if (p.y < 0) { p.y = 28 + Math.random() * 4; p.x = (Math.random() - 0.5) * 60; p.z = (Math.random() - 0.5) * 60; } rpos.set([p.x, p.y, p.z, p.x + 0.12, p.y + 0.9, p.z], i * 6); } rg.attributes.position.needsUpdate = true; }
  };
  sc.toolHint = () => !sc.steps[0] ? (ar ? "الريح تحمل اللقاح من الذكر إلى الأنثى" : "The wind carries pollen from male to female") : null;
  sc.real = `https://earth.google.com/web/@29.985,47.78,30a,6000d,35y,0h,60t,0r`;
  return sc;
};
})();
