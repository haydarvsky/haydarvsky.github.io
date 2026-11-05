// العالم: تضاريس حقيقية بصورة القمر الصناعي، سماء، بحر، أرض قريبة، ومواد البناء
(function () {
const W = RX.W = {};
const U = RX.U;
W.SUN = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();   // شمس العصر من الجنوب الغربي

// يفكّ ارتفاعات PNG بـ16 بت (R عالٍ، G منخفض) إلى مصفوفة
W.decodeHeights = async function (src) {
  const img = await U.loadImage(src);
  const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext("2d"); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  const n = img.width * img.height, h = new Float32Array(n), b = new Uint8Array(n);
  for (let i = 0; i < n; i++) { h[i] = (d[i * 4] * 256 + d[i * 4 + 1]) / 100 - 100; b[i] = d[i * 4 + 2]; }
  return { w: img.width, h: img.height, data: h, blue: b };
};

const TERRAIN_VS = `
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying float vDepth;
void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz;
 vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;
const TERRAIN_FS = `
uniform sampler2D sat; uniform vec3 sunDir; uniform vec3 fogColor; uniform float fogNear, fogFar;
uniform sampler2D overlay; uniform vec4 ovRect; uniform float ovOpacity;
uniform sampler2D flood; uniform float floodLevel; uniform float seaY; uniform float time; uniform float wet;
uniform float satGain; uniform vec3 tint; uniform vec4 hole;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying float vDepth;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
void main(){
 if (hole.z>hole.x && vW.x>hole.x && vW.x<hole.z && vW.z>hole.y && vW.z<hole.w) discard;
 vec3 c = texture2D(sat, vUv).rgb * satGain * tint;
 // تفاصيل قريبة: حصى ورمل
 float near = 1.0 - smoothstep(20.0, 260.0, vDepth);
 float n1 = vnoise(vW.xz*2.3), n2 = vnoise(vW.xz*0.35), n3 = vnoise(vW.xz*9.0);
 c *= mix(1.0, 0.86 + 0.18*n1 + 0.08*n2 + 0.06*n3, near);
 // فيضان الوادي
 float fv = texture2D(flood, vUv).r * 255.0;
 if (fv < 254.5 && fv * 0.05 < floodLevel) {
   float d = floodLevel - fv*0.05;
   vec3 water = mix(vec3(0.55,0.47,0.36), vec3(0.28,0.42,0.47), smoothstep(0.0, 3.0, d));
   float rip = vnoise(vW.xz*0.08 + vec2(time*0.15, time*0.05));
   c = mix(c, water*(0.92+0.16*rip), smoothstep(0.0, 0.4, d));
 }
 // طبقة الخريطة المرسومة على الأرض
 vec2 ou = (vW.xz - ovRect.xy) / (ovRect.zw - ovRect.xy);
 if (ovOpacity > 0.0 && ou.x>0.0 && ou.x<1.0 && ou.y>0.0 && ou.y<1.0) {
   vec4 o = texture2D(overlay, vec2(ou.x, 1.0-ou.y)); c = mix(c, o.rgb, o.a*ovOpacity);
 }
 vec3 n = normalize(vN);
 float dif = max(dot(n, sunDir), 0.0);
 vec3 col = c * (0.52 + 0.62*dif) * mix(1.0, 0.72, wet);
 float f = smoothstep(fogNear, fogFar, vDepth);
 gl_FragColor = vec4(mix(col, fogColor, f), 1.0);
}`;

// يبني محطة كاملة: تضاريس + سماء + بحر + أرض قريبة
W.buildStation = async function (id, assets, opt) {
  const meta = assets.meta[id];
  const H = await W.decodeHeights(assets.img[id + "_h"]);
  const n = H.w, R = meta.R, exag = opt.exag || 1, h0 = meta.h0;
  const root = new THREE.Scene();
  const fogColor = new THREE.Color(opt.horizon || 0xE7DCC6);
  root.fog = new THREE.Fog(fogColor, opt.fogNear || 2500, opt.fogFar || 11500);
  root.background = fogColor;
  // الارتفاع حول نقطة الوقوف = صفر، مع تسوية دائرة صغيرة تحت القدمين
  const step = 2 * R / (n - 1);
  const hts = new Float32Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -R + j * step, z = -R + i * step, d = Math.hypot(x, z);
    let y = (H.data[i * n + j] - h0) * exag;
    const flat = opt.flat || 70;
    if (d < flat * 2.2) { const k = Math.max(0, (d - flat) / (flat * 1.2)); y *= k * k * (3 - 2 * k); }
    hts[i * n + j] = y;
  }
  const geo = new THREE.PlaneGeometry(2 * R, 2 * R, n - 1, n - 1); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) pos.setY(k, hts[k]);
  geo.computeVertexNormals();
  const sat = new THREE.Texture(await U.loadImage(assets.img[id + "_sat"])); sat.needsUpdate = true;
  sat.anisotropy = 8; sat.minFilter = THREE.LinearMipmapLinearFilter;
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true;
  const uni = {
    sat: { value: sat }, sunDir: { value: W.SUN }, fogColor: { value: fogColor },
    fogNear: { value: opt.fogNear || 2500 }, fogFar: { value: opt.fogFar || 11500 },
    overlay: { value: blank }, ovRect: { value: new THREE.Vector4(0, 0, 1, 1) }, ovOpacity: { value: 0 },
    flood: { value: blank }, floodLevel: { value: 0 }, seaY: { value: -h0 * exag }, time: { value: 0 }, wet: { value: 0 },
    satGain: { value: opt.satGain || 1.08 }, tint: { value: new THREE.Color(opt.tint || 0xffffff) },
    hole: { value: opt.hole ? new THREE.Vector4(opt.hole[0], opt.hole[1], opt.hole[2], opt.hole[3]) : new THREE.Vector4(0, 0, 0, 0) }
  };
  const mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: TERRAIN_VS, fragmentShader: TERRAIN_FS });
  const terrain = new THREE.Mesh(geo, mat); root.add(terrain);
  // الارتفاع عند أي نقطة (للتموضع)
  const groundAt = (x, z) => {
    const fj = (x + R) / step, fi = (z + R) / step;
    const j = Math.max(0, Math.min(n - 2, Math.floor(fj))), i = Math.max(0, Math.min(n - 2, Math.floor(fi)));
    const a = fj - j, b = fi - i;
    return hts[i * n + j] * (1 - a) * (1 - b) + hts[i * n + j + 1] * a * (1 - b) + hts[(i + 1) * n + j] * (1 - a) * b + hts[(i + 1) * n + j + 1] * a * b;
  };
  // السماء
  const sky = W.sky(opt); root.add(sky);
  // البحر
  let water = null;
  if (meta.hmin < 0.5) { water = W.water(R, -h0 * exag, fogColor, opt); root.add(water); }
  // الإضاءة
  root.add(new THREE.HemisphereLight(0xFFF6E6, 0x9B8466, 0.62));
  const sun = new THREE.DirectionalLight(0xFFF1DA, 0.95);
  sun.position.copy(W.SUN).multiplyScalar(60); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  root.add(sun); root.add(sun.target);
  // الأرض القريبة تحت القدمين (تستقبل الظلال)
  const near = W.nearGround(opt.groundColor || 0xCDB48C, opt.groundStyle || "sand", opt.nearR || 45, opt.hole); root.add(near);
  return { root, terrain, uni, groundAt, sky, water, exag, h0, R, meta, sun, near, interactives: [] };
};

W.sky = function (opt) {
  const geo = new THREE.SphereGeometry(30000, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(opt.zenith || 0x6E9CC4) }, hor: { value: new THREE.Color(opt.horizon || 0xE7DCC6) },
      sun: { value: W.SUN }, dark: { value: 0 } },
    vertexShader: "varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `uniform vec3 top, hor, sun; uniform float dark; varying vec3 vD;
      void main(){ float h=max(vD.y,0.0); vec3 c=mix(hor, top, pow(h,0.55));
      float s=max(dot(normalize(vD), sun),0.0); c+=vec3(1.0,0.9,0.7)*pow(s,900.0)*1.4 + vec3(1.0,0.85,0.6)*pow(s,12.0)*0.18;
      c=mix(c, vec3(0.42,0.44,0.47)*(0.7+0.3*h), dark);
      if(vD.y<0.0) c=hor; gl_FragColor=vec4(c,1.0);} `
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = -10; return m;
};

W.water = function (R, y, fogColor, opt) {
  const geo = new THREE.PlaneGeometry(2 * R + 30000, 2 * R + 30000, 1, 1); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, sunDir: { value: W.SUN }, fogColor: { value: fogColor }, fogNear: { value: opt.fogNear || 2500 }, fogFar: { value: opt.fogFar || 11500 },
      deep: { value: new THREE.Color(opt.sea || 0x2F7F86) } },
    vertexShader: "varying vec3 vW; varying float vDepth; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }",
    fragmentShader: `uniform float time, fogNear, fogFar; uniform vec3 sunDir, fogColor, deep; varying vec3 vW; varying float vDepth;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec2 p=vW.xz*0.35; float e=0.6;
        float h1=vn(p+vec2(time*0.35,time*0.2)), h2=vn(p*2.1-vec2(time*0.25,time*0.4));
        vec3 n=normalize(vec3((h1-0.5)*0.35+(h2-0.5)*0.2, 1.0, (h2-0.5)*0.35));
        vec3 v=normalize(cameraPosition-vW);
        float fr=pow(1.0-max(dot(n,v),0.0),3.0);
        vec3 c=mix(deep, vec3(0.78,0.86,0.88), fr*0.8);
        vec3 r=reflect(-sunDir,n); c+=vec3(1.0,0.92,0.75)*pow(max(dot(r,v),0.0),120.0)*0.9;
        float a=mix(0.55, 0.9, fr);
        float f=smoothstep(fogNear,fogFar,vDepth); gl_FragColor=vec4(mix(c,fogColor,f), mix(a,1.0,f)); }`
  });
  const m = new THREE.Mesh(geo, mat); m.position.y = y + 0.05; m.renderOrder = 1; return m;
};

// قرص الأرض القريبة: رمل/حصى/صخر بنسيج إجرائي وحافة متلاشية، وطبقة تستقبل الظلال، وحفرة اختيارية
W.nearGround = function (color, style, r, hole) {
  const g = new THREE.Group();
  const tex = new THREE.CanvasTexture(W.groundCanvas(color, style)); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { map: { value: tex }, r: { value: r }, sunDir: { value: W.SUN }, hole: { value: hole ? new THREE.Vector4(hole[0], hole[1], hole[2], hole[3]) : new THREE.Vector4(0, 0, 0, 0) } },
    vertexShader: "varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }",
    fragmentShader: `uniform sampler2D map; uniform float r; uniform vec3 sunDir; uniform vec4 hole; varying vec3 vW;
      void main(){ if(hole.z>hole.x && vW.x>hole.x && vW.x<hole.z && vW.z>hole.y && vW.z<hole.w) discard;
        vec3 c=texture2D(map, vW.xz/3.2).rgb*0.55 + texture2D(map, vW.xz/11.0+0.37).rgb*0.45;
        float d=length(vW.xz); float a=1.0-smoothstep(r*0.55, r, d);
        gl_FragColor=vec4(c*(0.52+0.62*max(sunDir.y,0.0)), a); }`
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 72), mat); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; disc.renderOrder = 2;
  g.add(disc);
  // مستقبل الظلال
  let shGeo;
  const rr = Math.min(r * 0.7, 34);
  if (hole) {
    const s = new THREE.Shape(); s.absarc(0, 0, rr, 0, Math.PI * 2, false);
    const h = new THREE.Path(); h.moveTo(hole[0], -hole[1]); h.lineTo(hole[2], -hole[1]); h.lineTo(hole[2], -hole[3]); h.lineTo(hole[0], -hole[3]); h.closePath();
    s.holes.push(h); shGeo = new THREE.ShapeGeometry(s, 48);
  } else shGeo = new THREE.CircleGeometry(rr, 64);
  const sh = new THREE.Mesh(shGeo, new THREE.ShadowMaterial({ opacity: 0.32, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; sh.receiveShadow = true; sh.renderOrder = 3;
  g.add(sh);
  return g;
};
W.groundCanvas = function (color, style) {
  const c = new THREE.Color(color); const R = c.r * 255, G = c.g * 255, B = c.b * 255;
  const cv = U.noiseCanvas(512, 512, (d, w, h) => {
    for (let i = 0; i < w * h; i++) { const n = (Math.random() - 0.5) * 26; d[i * 4] = R + n; d[i * 4 + 1] = G + n * 0.95; d[i * 4 + 2] = B + n * 0.85; d[i * 4 + 3] = 255; }
  });
  const ctx = cv.getContext("2d");
  // تموّجات رملية
  if (style === "sand") {
    ctx.globalAlpha = 0.10; ctx.strokeStyle = "#6b5236"; ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 9) { ctx.beginPath(); for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + y * 0.3) * 3); ctx.stroke(); }
  }
  // حصى
  const nPeb = style === "gravel" ? 900 : style === "rock" ? 600 : 260;
  for (let i = 0; i < nPeb; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, s = (style === "rock" ? 2 + Math.random() * 7 : 1 + Math.random() * 3.5);
    const k = 0.55 + Math.random() * 0.6;
    ctx.globalAlpha = 0.75; ctx.fillStyle = `rgb(${R * k | 0},${G * k * 0.97 | 0},${B * k * 0.9 | 0})`;
    ctx.beginPath(); ctx.ellipse(x, y, s, s * (0.6 + Math.random() * 0.4), Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(x + s * 0.4, y + s * 0.4, s, s * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; return cv;
};

// ---------- مواد البناء ----------
W.mat = {};
W.texStone = function (base, mortar, bw, bh) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 512; const ctx = cv.getContext("2d");
  ctx.fillStyle = mortar; ctx.fillRect(0, 0, 512, 512);
  const c = new THREE.Color(base);
  for (let y = 0, row = 0; y < 512; y += bh, row++) {
    for (let x = -(row % 2) * bw / 2; x < 512; x += bw) {
      const k = 0.88 + Math.random() * 0.2;
      ctx.fillStyle = `rgb(${c.r * 255 * k | 0},${c.g * 255 * k | 0},${c.b * 255 * k | 0})`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
  }
  const id = ctx.getImageData(0, 0, 512, 512); const d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
};
W.texPlain = function (base, amt) {
  const c = new THREE.Color(base);
  const cv = U.noiseCanvas(256, 256, (d, w, h) => { for (let i = 0; i < w * h; i++) { const n = (Math.random() - 0.5) * (amt || 20); d[i * 4] = c.r * 255 + n; d[i * 4 + 1] = c.g * 255 + n; d[i * 4 + 2] = c.b * 255 + n; d[i * 4 + 3] = 255; } });
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
W.std = function (map, color, rough) {
  const m = new THREE.MeshStandardMaterial({ map, color: color || 0xffffff, roughness: rough == null ? 0.92 : rough, metalness: 0 });
  return m;
};
W.cast = function (obj) { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return obj; };

// منارة اتجاه: عمود ضوئي ولافتة على الأفق
W.beacon = function (label, sub, color, height, labelH) {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: color || 0xB3312A, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  col.scale.set(height * 0.012, height, height * 0.012); col.position.y = height / 2; g.add(col);
  const lab = U.label(label, { sub, size: 46, height: labelH || height * 0.16, anchorBottom: true, dot: color ? "#" + new THREE.Color(color).getHexString() : null });
  lab.material.fog = false; lab.position.y = height * 1.02; g.add(lab);
  g.userData.col = col; g.userData.lab = lab;
  return g;
};
})();
