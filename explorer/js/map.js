// غرفة الخرائط: خيمة بنقشة السدو، وطاولة عليها خريطة الكويت المجسّمة من ارتفاعات حقيقية
(function () {
const M = RX.MAP = {};
const U = RX.U, C = U.C, W = RX.W;
const LON0 = 46.45, LON1 = 48.95, LAT0 = 28.4, LAT1 = 30.2;
const MW = 2.0, MH = MW * (199.0 / 242.7), TOP = 0.92, VS = MW / 242700 * 26;
M.ll2map = (lon, lat) => ({ x: (lon - LON0) / (LON1 - LON0) * MW - MW / 2, z: (LAT1 - lat) / (LAT1 - LAT0) * MH - MH / 2 });
M.map2ll = (x, z) => ({ lon: LON0 + (x + MW / 2) / MW * (LON1 - LON0), lat: LAT1 - (z + MH / 2) / MH * (LAT1 - LAT0) });
M.km = (a, b) => { const dx = (a.lon - b.lon) * 111.32 * Math.cos(29.3 * Math.PI / 180), dz = (a.lat - b.lat) * 110.57; return Math.hypot(dx, dz); };

function saduCanvas() {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128; const c = cv.getContext("2d");
  const red = "#9E2A22", blk = "#231A14", wht = "#EFE6D2", ochre = "#C8963E";
  c.fillStyle = red; c.fillRect(0, 0, 512, 128);
  c.fillStyle = blk; c.fillRect(0, 0, 512, 14); c.fillRect(0, 114, 512, 14);
  c.fillStyle = wht; c.fillRect(0, 18, 512, 6); c.fillRect(0, 104, 512, 6);
  // أسنان
  for (let x = 0; x < 512; x += 16) { c.fillStyle = blk; c.beginPath(); c.moveTo(x, 24); c.lineTo(x + 8, 34); c.lineTo(x + 16, 24); c.fill(); c.beginPath(); c.moveTo(x, 104); c.lineTo(x + 8, 94); c.lineTo(x + 16, 104); c.fill(); }
  // معيّنات
  for (let x = 0; x < 512; x += 64) {
    c.fillStyle = wht; c.beginPath(); c.moveTo(x + 32, 40); c.lineTo(x + 58, 64); c.lineTo(x + 32, 88); c.lineTo(x + 6, 64); c.fill();
    c.fillStyle = blk; c.beginPath(); c.moveTo(x + 32, 50); c.lineTo(x + 47, 64); c.lineTo(x + 32, 78); c.lineTo(x + 17, 64); c.fill();
    c.fillStyle = ochre; c.fillRect(x + 29, 61, 6, 6);
  }
  return cv;
}
function fabricCanvas() {
  const cv = U.noiseCanvas(512, 512, (d, w, h) => { for (let i = 0; i < w * h; i++) { const x = i % w; const n = (Math.random() - 0.5) * 14 + Math.sin(x * 0.4) * 4; d[i * 4] = 214 + n; d[i * 4 + 1] = 198 + n; d[i * 4 + 2] = 168 + n; d[i * 4 + 3] = 255; } });
  const c = cv.getContext("2d"); c.globalAlpha = 0.25; c.fillStyle = "#6b5236"; for (let x = 0; x < 512; x += 128) c.fillRect(x, 0, 3, 512);
  return cv;
}

M.build = async function (assets) {
  const root = new THREE.Scene();
  root.background = new THREE.Color(0x1d1611);
  const sc = { id: "map", root, interactives: [], view: { pos: new THREE.Vector3(0, 0, 1.38), yaw: 0, pitch: -0.47, panelDist: 1.15, panelY: 1.32 } };
  // خيمة
  const fab = new THREE.CanvasTexture(fabricCanvas()); fab.wrapS = fab.wrapT = THREE.RepeatWrapping; fab.repeat.set(6, 1.5);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3.2, 48, 1, true), new THREE.MeshLambertMaterial({ map: fab, side: THREE.BackSide }));
  wall.position.y = 1.6; root.add(wall);
  const sadu = new THREE.CanvasTexture(saduCanvas()); sadu.wrapS = THREE.RepeatWrapping; sadu.repeat.set(10, 1);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(5.97, 5.97, 0.55, 48, 1, true), new THREE.MeshLambertMaterial({ map: sadu, side: THREE.BackSide }));
  band.position.y = 1.55; root.add(band);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.05, 1.8, 48, 1, true), new THREE.MeshLambertMaterial({ map: fab, side: THREE.BackSide, color: 0xd8c9ad }));
  roof.position.y = 3.2 + 0.9; root.add(roof);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(W.groundCanvas(0xC9B08A, "sand")) }));
  floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping; floor.material.map.repeat.set(4, 4);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const rugT = new THREE.CanvasTexture(saduCanvas()); rugT.wrapS = rugT.wrapT = THREE.RepeatWrapping; rugT.repeat.set(3, 9);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8), new THREE.MeshLambertMaterial({ map: rugT }));
  rug.rotation.x = -Math.PI / 2; rug.position.y = 0.005; rug.receiveShadow = true; root.add(rug);
  // طاولة
  const wood = W.texPlain(0x6A4A2E, 26);
  const woodM = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7, color: 0xffffff });
  const top = new THREE.Mesh(new THREE.BoxGeometry(MW + 0.36, 0.07, MH + 0.36), woodM); top.position.y = TOP - 0.06; root.add(top);
  const frameM = new THREE.MeshStandardMaterial({ color: 0x3D2A1A, roughness: 0.6 });
  [[0, -(MH / 2 + 0.09), MW + 0.36, 0.18], [0, MH / 2 + 0.09, MW + 0.36, 0.18]].forEach(([x, z, w, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), frameM); b.position.set(x, TOP + 0.0, z); root.add(b); });
  [[-(MW / 2 + 0.09), 0], [MW / 2 + 0.09, 0]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, MH), frameM); b.position.set(x, TOP, z); root.add(b); });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.09, TOP - 0.1, 0.09), woodM); l.position.set(sx * (MW / 2 + 0.06), (TOP - 0.1) / 2, sz * (MH / 2 + 0.06)); root.add(l); }
  W.cast(top);
  // الخريطة المجسّمة
  const H = await W.decodeHeights(assets.img.map_h);
  const gx = 272, gz = 224;
  const geo = new THREE.PlaneGeometry(MW, MH, gx, gz); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  M.hAt = (u, v) => {   // u,v ∈ [0,1] من الغرب/الشمال
    const fx = u * (H.w - 1), fy = v * (H.h - 1); const j = Math.min(H.w - 2, Math.floor(fx)), i = Math.min(H.h - 2, Math.floor(fy)); const a = fx - j, b = fy - i;
    const d = H.data; return d[i * H.w + j] * (1 - a) * (1 - b) + d[i * H.w + j + 1] * a * (1 - b) + d[(i + 1) * H.w + j] * (1 - a) * b + d[(i + 1) * H.w + j + 1] * a * b;
  };
  M.maskAt = (u, v) => H.blue[Math.round(v * (H.h - 1)) * H.w + Math.round(u * (H.w - 1))] > 127;
  for (let k = 0; k < pos.count; k++) { const u = (pos.getX(k) + MW / 2) / MW, v = (pos.getZ(k) + MH / 2) / MH; pos.setY(k, M.hAt(u, v) * VS); }
  geo.computeVertexNormals();
  const mt = new THREE.Texture(await U.loadImage(assets.img.map_tex)); mt.needsUpdate = true; mt.anisotropy = 8;
  const mapMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: mt, roughness: 0.95 }));
  mapMesh.position.y = TOP; mapMesh.receiveShadow = true; mapMesh.castShadow = true; root.add(mapMesh);
  M.mesh = mapMesh;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshStandardMaterial({ color: 0x6FB3B8, transparent: true, opacity: 0.32, roughness: 0.15, metalness: 0.1 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = TOP + 0.0015; root.add(sea);
  // إضاءة
  root.add(new THREE.HemisphereLight(0xFFE9C9, 0x4a3524, 0.55));
  const lamp = new THREE.SpotLight(0xFFE2B0, 1.25, 9, 0.75, 0.6, 1.2); lamp.position.set(-0.9, 3.0, 0.6); lamp.target.position.set(0, TOP, 0);
  lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); lamp.shadow.bias = -0.0004; root.add(lamp, lamp.target);
  const fill = new THREE.PointLight(0xFFC98A, 0.35, 8); fill.position.set(1.6, 2.2, -1.5); root.add(fill);
  // فانوس معلّق
  const lan = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: 0xFFD08A }));
  lan.position.set(-0.9, 2.55, 0.6); root.add(lan);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.5), new THREE.MeshBasicMaterial({ color: 0x2a1d12 })); cord.position.set(-0.9, 3.3, 0.6); root.add(cord);

  // طبقات اللافتات
  sc.layerLand = new THREE.Group(); sc.layerTrace = new THREE.Group(); root.add(sc.layerLand, sc.layerTrace);
  sc.layerTrace.visible = false;
  sc.pins = {};
  sc.buildLabels = function () {
    [sc.layerLand, sc.layerTrace].forEach(g => { while (g.children.length) g.remove(g.children[0]); });
    const T = U.T();
    const KC = { wadi: "#2C6E8F", hill: "#8A5A2B", khabra: "#4C7D3F", dune: "#C8963E", plain: "#A8874F", plateau: "#7A3E22", bay: "#2C6E8F", cape: "#2C6E8F", khor: "#2C6E8F", island: "#2E7D55", sea: "#2C6E8F" };
    const showF = ["batin", "zour", "rawd", "naqa", "dibdiba", "adan", "ahmadi", "burgan", "bay", "ard", "bubiyan", "failaka", "gulf", "liyah", "rimam"];
    for (const id of showF) {
      const [lon, lat] = RX.GEO.features[id]; const p = M.ll2map(lon, lat);
      const k = RX.GEO.featKind[id];
      const lab = U.label(T.features[id], { size: 40, height: 0.034, dot: id === "gulf" || id === "bay" ? null : KC[k], bg: k === "sea" || k === "bay" ? false : "rgba(255,252,244,0.88)", color: k === "sea" || k === "bay" ? "#1E5A63" : C.ink, lw: 2 });
      const u = (p.x + MW / 2) / MW, v = (p.z + MH / 2) / MH;
      lab.position.set(p.x, TOP + Math.max(0, M.hAt(u, v)) * VS + 0.035, p.z); sc.layerLand.add(lab);
    }
    for (const id of ["sabiya", "failaka", "wara", "kazma", "shaqaya", "sadah", "huma", "dibdiba"]) {
      const [lon, lat] = RX.GEO.hist[id]; const p = M.ll2map(lon, lat); const u = (p.x + MW / 2) / MW, v = (p.z + MH / 2) / MH;
      const y = TOP + Math.max(0, M.hAt(u, v)) * VS;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 10), new THREE.MeshStandardMaterial({ color: 0xB3312A, roughness: 0.4 }));
      dot.position.set(p.x, y + 0.008, p.z); sc.layerTrace.add(dot);
      const lab = U.label(T.hist[id], { size: 40, height: 0.036, bg: "rgba(250,240,214,0.95)", stroke: "#7A3E22", lw: 2, anchorBottom: true });
      lab.position.set(p.x, y + 0.03, p.z); sc.layerTrace.add(lab);
    }
  };
  // دبابيس المحطات الخمس
  sc.buildPins = function (state, onPick) {
    Object.values(sc.pins).forEach(p => { root.remove(p); RX.E.removeInteractive(sc, p); });
    sc.pins = {};
    RX.ORDER.forEach((id, i) => {
      const meta = assets.meta[id]; const p = M.ll2map(meta.lon, meta.lat);
      const u = (p.x + MW / 2) / MW, v = (p.z + MH / 2) / MH; const y = TOP + Math.max(0, M.hAt(u, v)) * VS;
      const g = new THREE.Group(); g.position.set(p.x, y, p.z);
      const done = !!state.stamps[id], open = RX.app.isOpen(id);
      const env = U.T().stations[id].env; const col = done ? (env === "desert" ? 0xB3312A : 0x2E7D55) : open ? 0xB3312A : 0x8f8577;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0x2B2116 }));
      pole.position.y = 0.08; g.add(pole);
      let head;
      if (done) {
        const t = new THREE.CanvasTexture(RX.UI.stampCanvas(id, 256));
        head = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); head.scale.set(0.085, 0.085, 1);
      } else {
        head = U.label(U.num(i + 1), { size: 60, height: 0.075, bg: "#" + new THREE.Color(col).getHexString(), color: "#fff", stroke: "#FFFCF4", lw: 4 });
      }
      head.position.y = 0.2; g.add(head);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.026, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.003; g.add(ring);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.15; g.add(hit);
      g.userData = { id, head, ring, open, done };
      root.add(g); sc.pins[id] = g;
      RX.E.addTo(sc, g, { onSelect: () => onPick(id), onHover: on => { head.scale.multiplyScalar(on ? 1.18 : 1 / 1.18); } });
    });
  };
  // المطر الجاري على الخريطة
  const flow = assets.flow;
  const NP = 900, TR = 4;            // نقطة لكل قطرة + أثر من ٤ نقاط
  const dotCv = document.createElement("canvas"); dotCv.width = dotCv.height = 64; { const c = dotCv.getContext("2d"); const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.55, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const rainGeo = new THREE.BufferGeometry(); const rp = new Float32Array(NP * TR * 3); rainGeo.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rcol = new Float32Array(NP * TR * 3); rainGeo.setAttribute("color", new THREE.BufferAttribute(rcol, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ size: 0.02, map: new THREE.CanvasTexture(dotCv), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true }));
  rain.visible = false; rain.frustumCulled = false; rain.renderOrder = 20; root.add(rain);
  const parts = [];
  function flowAt(u, v) {
    const fx = u * (flow.W - 1), fy = v * (flow.H - 1); const j = Math.round(fx), i = Math.round(fy);
    if (i < 0 || j < 0 || i >= flow.H || j >= flow.W) return null;
    const k = i * flow.W + j; if (flow.m[k] !== "1") return null;
    return [flow.u[k], flow.v[k]];
  }
  sc.startRain = function () {
    parts.length = 0;
    for (let n = 0; n < NP; n++) {
      let u, v, tries = 0; do { u = Math.random(); v = Math.random(); tries++; } while (!M.maskAt(u, v) && tries < 60);
      parts.push({ u, v, y: 0.3 + Math.random() * 0.5, delay: Math.random() * 2.2, life: 0, alive: true, vu: 0, vv: 0, hist: [] });
    }
    rain.visible = true; sc.rainT = 0;
  };
  sc.updateRain = function (dt) {
    if (!rain.visible) return;
    sc.rainT += dt; let alive = 0;
    for (let n = 0; n < NP; n++) {
      const p = parts[n]; const o = n * TR * 3;
      if (!p.alive || sc.rainT < p.delay) { rp.fill(-99, o, o + TR * 3); continue; }
      const gy = TOP + Math.max(0, M.hAt(p.u, p.v)) * VS + 0.006;
      let x = p.u * MW - MW / 2, z = p.v * MH - MH / 2, y;
      if (p.y > 0) { p.y -= dt * 0.8; y = gy + Math.max(0, p.y); }
      else {
        const f = flowAt(p.u, p.v); p.life += dt;
        if (!f || p.life > 10) { p.alive = false; rp.fill(-99, o, o + TR * 3); continue; }
        p.vu = p.vu * 0.85 + f[0] * 0.15; p.vv = p.vv * 0.85 + f[1] * 0.15;
        p.u += p.vu * 0.06 * dt / MW; p.v += p.vv * 0.06 * dt / MH;
        x = p.u * MW - MW / 2; z = p.v * MH - MH / 2; y = gy;
      }
      p.hist.unshift([x, y, z]); if (p.hist.length > TR * 3) p.hist.length = TR * 3;
      for (let k = 0; k < TR; k++) {
        const h = p.hist[Math.min(p.hist.length - 1, k * 3)]; const q = o + k * 3;
        rp[q] = h[0]; rp[q + 1] = h[1]; rp[q + 2] = h[2];
        const a = (1 - k / TR) * (p.y > 0 ? 0.6 : 1);
        rcol[q] = 0.08 + 0.1 * (1 - a); rcol[q + 1] = 0.38 + 0.2 * (1 - a); rcol[q + 2] = 0.95;
      }
      alive++;
    }
    rainGeo.attributes.position.needsUpdate = true; rainGeo.attributes.color.needsUpdate = true;
    if (alive === 0 && sc.rainT > 3) { rain.visible = false; sc.onRainEnd && sc.onRainEnd(); }
  };
  // سهم الانحدار
  sc.slopeArrow = (function () {
    const s = new THREE.Shape(); const L = 1.25, w = 0.07, hw = 0.15, hl = 0.22;
    s.moveTo(-L / 2, -w); s.lineTo(L / 2 - hl, -w); s.lineTo(L / 2 - hl, -hw); s.lineTo(L / 2, 0); s.lineTo(L / 2 - hl, hw); s.lineTo(L / 2 - hl, w); s.lineTo(-L / 2, w); s.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: 0xB3312A, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(0.05, TOP + 0.16, 0.12); root.add(m);
    return m;
  })();
  sc.showSlope = function () {
    const T = U.T().stations.start;
    if (sc.slopeLab) root.remove(sc.slopeLab);
    sc.slopeLab = U.label(T.slope, { size: 44, height: 0.06, bg: "rgba(255,252,244,0.95)", stroke: C.red });
    sc.slopeLab.position.set(0.05, TOP + 0.26, 0.12); root.add(sc.slopeLab);
    U.tween(900, k => { sc.slopeArrow.material.opacity = 0.55 * k; sc.slopeLab.material.opacity = k; });
  };
  sc.setLayer = function (which) { sc.layerLand.visible = which === "land"; sc.layerTrace.visible = which === "trace"; };
  sc.update = function (dt, t) {
    sc.updateRain(dt);
    for (const id in sc.pins) {
      const g = sc.pins[id]; if (g.userData.open && !g.userData.done) { const s = 1 + 0.25 * Math.sin(t * 4); g.userData.ring.scale.setScalar(s); }
    }
    if (sc.finalUpdate) sc.finalUpdate(dt, t);
  };
  // لمس الخريطة نفسها (للختام)
  sc.mapMesh = mapMesh; sc.TOP = TOP; sc.VS = VS; sc.MW = MW; sc.MH = MH;
  return sc;
};
})();
