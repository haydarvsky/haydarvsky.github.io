// الصوت: أجواء إجرائية (ريح، موج، مطر، خيمة) ومؤثرات قصيرة وصوت المرشد
(function () {
const A = RX.A = { on: true, voice: true };
let ctx = null, master = null, noiseBuf = null;
const beds = {};
A.unlock = function () {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = A.on ? 0.9 : 0; master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); let b = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 3.5; }
  if (A.pending) { A.ambience(A.pending); A.pending = null; }
};
function noise() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(0, Math.random() * 3); return s; }
function lfo(freq, depth, target, base) {
  const o = ctx.createOscillator(); o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = depth;
  o.connect(g); g.connect(target); target.value = base; o.start(); return o;
}
function bed(kind) {
  const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
  const n = noise(); const nodes = [n];
  if (kind === "wind") {
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 0.7;
    const g = ctx.createGain(); n.connect(bp); bp.connect(g); g.connect(out);
    nodes.push(lfo(0.07, 180, bp.frequency, 420), lfo(0.11, 0.12, g.gain, 0.22));
  } else if (kind === "sea") {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
    const g = ctx.createGain(); n.connect(lp); lp.connect(g); g.connect(out);
    nodes.push(lfo(0.13, 0.18, g.gain, 0.22), lfo(0.13, 300, lp.frequency, 800));
  } else if (kind === "rain") {
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.value = 0.35; n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
  } else if (kind === "tent") {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 260;
    const g = ctx.createGain(); g.gain.value = 0.25; n.connect(lp); lp.connect(g); g.connect(out);
  }
  return { out, nodes };
}
A.ambience = function (list) {          // مثال: {wind:0.6, sea:0.4}
  if (!ctx) { A.pending = list; return; }
  for (const k of ["wind", "sea", "rain", "tent"]) {
    const want = list[k] || 0;
    if (want && !beds[k]) beds[k] = bed(k);
    if (beds[k]) beds[k].out.gain.setTargetAtTime(want, ctx.currentTime, 0.8);
  }
};
A.setOn = function (v) { A.on = v; if (master) master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.1); if (!v) A.stopVoice(); };
function tone(f, t0, dur, type, vol) {
  const o = ctx.createOscillator(); o.type = type || "sine"; o.frequency.value = f;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
A.sfx = function (k) {
  if (!ctx || !A.on) return; const t = ctx.currentTime;
  if (k === "click") tone(880, t, 0.06, "triangle", 0.06);
  else if (k === "ok") { tone(660, t, 0.25, "sine", 0.18); tone(990, t + 0.12, 0.35, "sine", 0.16); }
  else if (k === "bad") { tone(196, t, 0.25, "triangle", 0.12); }
  else if (k === "find") { tone(784, t, 0.2, "sine", 0.12); tone(1175, t + 0.08, 0.3, "sine", 0.1); }
  else if (k === "stamp") {
    const n = noise(); const g = ctx.createGain(); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; n.connect(lp); lp.connect(g); g.connect(master); n.stop(t + 0.25);
    tone(90, t, 0.25, "sine", 0.5);
  } else if (k === "whoosh") {
    const n = noise(); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.3); g.gain.linearRampToValueAtTime(0, t + 0.8);
    n.connect(bp); bp.connect(g); g.connect(master); n.stop(t + 0.9);
  } else if (k === "brush") {
    const n = noise(); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    n.connect(hp); hp.connect(g); g.connect(master); n.stop(t + 0.15);
  }
};
// صوت المرشد (ملفات mp3 إن وُجدت)
let cur = null;
A.voiceSrc = {};   // تُملأ من الحزمة: {"ar/start": "data:..."}
A.say = function (key, onEnd) {
  A.stopVoice(); if (rec) { if (onEnd) setTimeout(onEnd, 400); return false; }
  const lang = RX.app ? RX.app.lang : "ar";
  const src = A.voiceSrc[lang + "/" + key] || A.voiceSrc["ar/" + key];
  if (!src || !A.voice || !A.on) { if (onEnd) setTimeout(onEnd, 400); return false; }
  cur = new Audio(src); cur.volume = 1;
  if (beds.wind || beds.sea || beds.tent) duck(0.35);
  cur.onended = () => { duck(1); cur = null; onEnd && onEnd(); };
  cur.play().catch(() => { duck(1); onEnd && onEnd(); });
  return true;
};
// التلاوة (مشاري العفاسي): تُوقف صوت المرشد، وتخفض الأجواء
let rec = null;
A.quranSrc = {};
A.recite = function (key, onEnd) {
  A.stopRecite(); A.stopVoice();
  const src = A.quranSrc[key]; if (!src) return false;
  rec = new Audio(src); rec.volume = 1; duck(0.25);
  rec.onended = () => { duck(1); rec = null; onEnd && onEnd(); };
  rec.play().catch(() => { duck(1); rec = null; onEnd && onEnd(); });
  return true;
};
A.stopRecite = function () { if (rec) { rec.pause(); rec.onended = null; rec = null; duck(1); } };
A.hasVoice = key => !!(A.voiceSrc[(RX.app ? RX.app.lang : "ar") + "/" + key] || A.voiceSrc["ar/" + key]);
A.stopVoice = function () { if (cur) { cur.pause(); cur.onended = null; cur = null; duck(1); } };
function duck(v) { if (master && ctx) master.gain.setTargetAtTime(A.on ? 0.9 * v : 0, ctx.currentTime, 0.3); }
})();
