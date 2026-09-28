/* WKVN NIGHT SHIFT
   Keep RELEASE in sync with the RELEASE dates in /index.html. */
(function () {
"use strict";

var A = "/night-shift/a/";
var TT = "https://www.tiktok.com/@wkvn9";
var RELEASE = { 1: "2026-09-28T00:00:00Z", 2: "2026-09-28T00:00:00Z", 3: "2026-09-29T17:00:00Z", 4: "2026-09-30T17:00:00Z" };
var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
var ALL = LOCAL && /[?&]all\b/.test(location.search);
var API = location.protocol.indexOf("http") === 0 ? "/api/shift" : null;
var SPM = LOCAL && /[?&]fast\b/.test(location.search) ? 0.3 : 1.4;   // real seconds per game minute
var LEN = 147;   // 03:33 -> 06:00

function released(n) { var t = RELEASE[n]; return ALL || (!!t && Date.now() >= Date.parse(t)); }
function $(id) { return document.getElementById(id); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function ri(a, b) { return Math.floor(rnd(a, b + 1)); }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
function pad(x) { return (x < 10 ? "0" : "") + x; }

/* ---------------- nights ---------------- */
var NIGHTS = {
  1: { name: "KNOCKING", date: "OCT 13 1994", logd: "10/13/94", ep: "01", decay: 0.9, ch9: "rules", dale: ["d1_1", "d1_2", "d1_3", "d1_4", "d1_5", "d1_6"],
       rules: ["Tonight you may hear knocking.", "Do not answer the door.", "Do not look through the peephole.", "Do not count the knocks.", "If you have already counted, the number you counted is how many are inside."],
       brief: "Ruth went home at two.\nYou are alone in the transmitter room.\nKeep the carrier up. Watch the monitors.\nAt 3:33 Channel 9 goes on air by itself.\n\nTonight's instructions: KNOCKING.",
       win: "Seven knocks on the master tape. You didn't count them. Ruth comes in at eight." },
  2: { name: "WINDOWS", date: "OCT 14 1994", logd: "10/14/94", ep: "02", decay: 1.0, ch9: "rules", dale: ["d2_1", "d2_2", "d2_3", "d2_4", "d2_5"],
       rules: ["Do not look at your neighbors' windows after 3 AM.", "If a window across the street is lit, it is not your neighbor who turned on the light.", "If someone in that window is waving, close your curtains.", "Do not wave back."],
       brief: "Extension 9 rang all evening.\nThe transmitter room has one window.\nIt faces the houses across the street.\n\nTonight's instructions: WINDOWS.",
       win: "Every window across the street is dark now. Yours is the only one lit." },
  3: { name: "MISSING", date: "OCT 15 1994", logd: "10/15/94", ep: "03", decay: 1.1, ch9: "list",
       rules: ["If your name is on the list, you are still at home.", "Do not answer anyone who says your name twice."],
       brief: "Tonight Channel 9 reads a list of names.\nRuth said she would call if anything changed.\nRuth is at home.\n\nTonight's instructions: MISSING.",
       win: "Your name was on the list. If your name is on the list, you are still at home.\nThen who finished the shift?" },
  4: { name: "WEATHER", date: "OCT 16 1994", logd: "10/16/94", ep: "04", decay: 1.15, ch9: "weather", fog: true,
       rules: ["Visibility is zero.", "Do not go outside to look at the fog.", "Something tall is moving west at walking speed.", "If it passes your house, do not follow it."],
       brief: "Hal's forecast: fog. Visibility zero.\nThe tower light is a smudge in the window.\nDale called in. He is not coming.\n\nTonight's instructions: WEATHER.",
       win: "The fog is lifting. There are footprints in the gravel, walking west. They are your size." }
};

var CAUSE = {
  door:     { h: "YOU LET IT IN", c: "You opened the door.", rule: "Do not answer the door.", img: "door.jpg" },
  peephole: { h: "IT WAS LOOKING BACK", c: "You looked through the peephole.", rule: "Do not look through the peephole.", img: "peep.jpg" },
  counted:  { h: "YOU LET IT IN", c: "You counted {n}. There are {n} inside.", rule: "Do not count the knocks.", img: "door.jpg" },
  answered: { h: "YOU LET IT IN", c: "You answered. It has your voice now.", rule: "Do not answer the door.", img: "door.jpg" },
  waved:    { h: "IT KNOWS WHICH WINDOW IS YOURS", c: "You waved back.", rule: "Do not wave back.", img: "win_wave.jpg" },
  looked:   { h: "YOU LET IT IN", c: "You kept looking at the window.", rule: "If someone in that window is waving, close your curtains.", img: "win_wave.jpg" },
  twice:    { h: "YOU LET IT IN", c: "It said your name twice. You answered.", rule: "Do not answer anyone who says your name twice.", img: "door.jpg" },
  outside:  { h: "VISIBILITY: ZERO", c: "You went outside to look at the fog.", rule: "Do not go outside to look at the fog.", img: "win_walk.jpg" },
  followed: { h: "YOU FOLLOWED IT", c: "It passed the station. You went after it.", rule: "If it passes your house, do not follow it.", img: "win_walk.jpg" },
  carrier:  { h: "SIGNAL LOST", c: "The station went dark. In the dark, it doesn't need to knock.", rule: "Keep the carrier up.", img: "cam1.jpg" }
};

/* ---------------- audio ---------------- */
var AC = null, master, tvIn, tvGain, NOISE, buf = {}, live = [];
function audioInit() {
  if (AC) { if (AC.state === "suspended") AC.resume(); return; }
  var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  try { AC = new C(); } catch (e) { AC = null; return; }
  master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
  var n = AC.sampleRate * 2; NOISE = AC.createBuffer(1, n, AC.sampleRate);
  var d = NOISE.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  tvGain = AC.createGain(); tvGain.gain.value = 0.1;
  var bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 0.55;
  tvIn = tvGain; tvGain.connect(bp); bp.connect(master);
  ["knock1", "whisper", "d1_1", "d1_2", "d1_3", "d1_4", "d1_5", "d1_6", "d2_1", "d2_2", "d2_3", "d2_4", "d2_5"].forEach(load);
}
function load(name) {
  fetch(A + name + ".mp3").then(function (r) { return r.arrayBuffer(); }).then(function (b) {
    AC.decodeAudioData(b, function (x) { buf[name] = x; }, function () {});
  }).catch(function () {});
}
function track(s) { live.push(s); s.onended = function () { var i = live.indexOf(s); if (i >= 0) live.splice(i, 1); }; return s; }
function play(name, o) {
  o = o || {}; if (!AC || !buf[name]) return null;
  var s = AC.createBufferSource(); s.buffer = buf[name]; s.playbackRate.value = o.rate || 1;
  var g = AC.createGain(); g.gain.value = o.gain == null ? 1 : o.gain; s.connect(g); var out = g;
  if (o.pan != null && AC.createStereoPanner) { var p = AC.createStereoPanner(); p.pan.value = o.pan; g.connect(p); out = p; }
  out.connect(o.dest || master); s.start(); return track(s);
}
function noise(dur, gain, hp) {
  if (!AC) return; var s = AC.createBufferSource(); s.buffer = NOISE; s.loop = true;
  var f = AC.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp || 900;
  var g = AC.createGain(); var t = AC.currentTime;
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05); track(s);
}
function tone(freq, dur, gain, type) {
  if (!AC) return; var o = AC.createOscillator(); o.type = type || "sine"; o.frequency.value = freq;
  var g = AC.createGain(); var t = AC.currentTime;
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); track(o);
}
var humNodes = [];
function humStart() {
  if (!AC || humNodes.length) return;
  [[60, 0.014], [120, 0.007], [180, 0.003]].forEach(function (h) {
    var o = AC.createOscillator(); o.frequency.value = h[0]; var g = AC.createGain(); g.gain.value = h[1];
    o.connect(g); g.connect(master); o.start(); humNodes.push(o);
  });
  var s = AC.createBufferSource(); s.buffer = NOISE; s.loop = true;
  var f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
  var g = AC.createGain(); g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(master); s.start(); humNodes.push(s);
}
function humStop() { humNodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); humNodes = []; }
var ringN = null;
function ringStart() {
  if (!AC || ringN) return;
  var a = AC.createOscillator(), b = AC.createOscillator(); a.frequency.value = 440; b.frequency.value = 480;
  var trem = AC.createGain(); trem.gain.value = 0.5;
  var lfo = AC.createOscillator(); lfo.type = "square"; lfo.frequency.value = 20; var lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(trem.gain);
  var gate = AC.createGain(); gate.gain.value = 0; var t = AC.currentTime;
  for (var i = 0; i < 12; i++) { var s = t + i * 2.2; gate.gain.setValueAtTime(0.09, s); gate.gain.setValueAtTime(0, s + 1.0); }
  a.connect(trem); b.connect(trem); trem.connect(gate); gate.connect(master);
  a.start(); b.start(); lfo.start(); ringN = [a, b, lfo, gate];
}
function ringStop() { if (!ringN) return; ringN.slice(0, 3).forEach(function (o) { try { o.stop(); } catch (e) {} }); ringN = null; }
function stopAll() { humStop(); ringStop(); live.slice().forEach(function (s) { try { s.stop(); } catch (e) {} }); live = []; }
function knockSound() {
  if (buf.knock1) play("knock1", { rate: rnd(0.92, 1.04), gain: 1.3 });
  else { tone(95, 0.18, 0.5); noise(0.08, 0.3, 300); }
}
function scareSound() { noise(1.3, 0.9, 200); tone(58, 1.4, 0.5, "sawtooth"); tone(61, 1.4, 0.4, "sawtooth"); }

/* ---------------- state ---------------- */
var S = null, N = null;
function after(sec, fn) { if (S) S.q.push({ at: S.rt + sec, fn: fn, id: S.gen }); }

var feed = $("feed"), wave = $("wave"), mon = $("mon");

function newState(n) {
  return { n: n, gm: 0, rt: 0, q: [], ev: plan(n), ei: 0, gen: Math.random(), running: true, over: false, paused: false,
    carrier: 80, zero: 0, beepT: 0, view: "cam", win: "dark", curtains: false, look: 0, waveT: 0, walkT: 0,
    voice: null, phone: { st: "idle" }, modal: false, breaker: false, flick: 0, tvI: 0, ch9I: 0, listGene: false, logs: [] };
}

/* ---------------- schedule ---------------- */
function plan(n) {
  var E = [];
  function at(t, f, fixed) { E.push({ t: fixed ? t : Math.max(3, t + rnd(-3, 3)), f: f }); }
  at(rnd(35, 125), whisper, true);
  at(rnd(50, 70), dip, true);
  if (n === 1) {
    at(6, function () { ring("breath"); });
    at(16, function () { knock(3); });
    at(38, function () { knock(ri(5, 6), { voice: "Gene? It's Dale. Let me in, it's cold out here.", ask: true }); });
    at(70, function () { knock(7, { voice: "Gene. I can hear you breathing.", ask: true }); });
    at(96, function () { ring("breath"); });
    at(108, function () { knock(ri(4, 5)); });
    at(126, function () { knock(8, { ask: true }); });
  } else if (n === 2) {
    at(8, winLight);
    at(26, function () { knock(4, { ask: true }); });
    at(46, winLight);
    at(60, function () { ring("breath"); });
    at(74, function () { knock(5, { voice: "Gene, it's the Palmers from across the street. We saw you in the window." }); });
    at(92, winLight);
    at(112, function () { knock(6, { ask: true }); });
    at(128, winLight);
  } else if (n === 3) {
    at(8, function () { ring("ruth1"); });
    at(24, function () { knock(4, { voice: "Gene. Gene. It's Ruth. I forgot my keys.", twice: true, ask: true }); });
    at(48, function () { ring("ruth2"); });
    at(66, winLight);
    at(84, function () { knock(5, { voice: "Gene? It's Dale. Don't open it.", ask: true }); });
    at(104, function () { ring("ruth2"); });
    at(122, function () { knock(7, { voice: "Gene. Gene.", twice: true, ask: true }); });
    at(130, function () { S.listGene = true; }, true);
  } else if (n === 4) {
    at(8, function () { ring("breath"); });
    at(22, function () { knock(4, { ask: true }); });
    at(40, walker);
    at(82, breaker);
    at(110, function () { knock(6, { voice: "Gene, the fog's lifting. Come out and look.", ask: true }); });
    at(126, winLight);
  }
  E.sort(function (a, b) { return a.t - b.t; });
  return E;
}

/* ---------------- ui helpers ---------------- */
function log(t) {
  if (!S) return; var h = 3 + Math.floor((33 + S.gm) / 60), m = Math.floor(33 + S.gm) % 60;
  S.logs.push("<b>" + pad(h) + ":" + pad(m) + "</b>  " + t); if (S.logs.length > 3) S.logs.shift();
  $("log").innerHTML = S.logs.join("\n");
}
function cap(who, txt) { if (!who) { $("cap").hidden = true; return; } $("capWho").textContent = who; $("capTxt").textContent = txt; $("cap").hidden = false; }
function jolt() { mon.classList.remove("shake"); void mon.offsetWidth; mon.classList.add("shake"); if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {} }
function flash(o) { var f = $("flash"); f.style.transition = "none"; f.style.opacity = o; setTimeout(function () { f.style.transition = "opacity .5s"; f.style.opacity = 0; }, 60); }
function setImg(name) { var src = A + name; if (feed.getAttribute("src") !== src) feed.setAttribute("src", src); }

function render() {
  if (!S) return;
  var v = S.view;
  $("ch9").hidden = v !== "ch9";
  $("fog").hidden = !(N.fog && v !== "ch9");
  var showWave = v === "win" && S.win === "wave" && !S.curtains;
  wave.hidden = !showWave;
  if (showWave) { var p = wave.play(); if (p && p.catch) p.catch(function () {}); } else if (!wave.paused) wave.pause();
  $("curtain").hidden = !(v === "win" && S.curtains);
  if (v === "cam") { $("mLbl").textContent = "CAM 1 · FRONT WALK"; setImg(S.flick > 0 ? "door.jpg" : "cam1.jpg"); }
  else if (v === "win") {
    $("mLbl").textContent = "WINDOW · ACROSS THE STREET";
    setImg(S.win === "lit" ? "win_lit.jpg" : S.win === "wave" ? "win_wave.jpg" : S.win === "walk" ? "win_walk.jpg" : "win_dark.jpg");
  } else { $("mLbl").textContent = "CH 9 · ON AIR"; }
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i].getAttribute("data-v") === v);
  acts();
}
function btn(label, cls, fn) { var b = document.createElement("button"); b.className = "act " + (cls || ""); b.textContent = label; b.onclick = fn; return b; }
function acts() {
  var a = $("acts"); a.innerHTML = "";
  if (S.voice) a.appendChild(btn('SAY "WHO’S THERE?"', "hot", function () { lose(S.voice.twice ? "twice" : "answered"); }));
  if (S.view === "cam") {
    a.appendChild(btn("OPEN DOOR", "", function () { lose("door"); }));
    a.appendChild(btn("PEEPHOLE", "", function () { lose("peephole"); }));
  } else if (S.view === "win") {
    if (S.curtains) a.appendChild(btn("OPEN CURTAINS", "safe", function () { S.curtains = false; render(); }));
    else a.appendChild(btn("CLOSE CURTAINS", "safe", closeCurtains));
    if (S.win === "wave" && !S.curtains) a.appendChild(btn("WAVE BACK", "hot", function () { lose("waved"); }));
    if (S.win === "walk" && !S.curtains) a.appendChild(btn("FOLLOW IT", "hot", function () { lose("followed"); }));
  } else {
    var d = document.createElement("div"); d.className = "small"; d.style.alignSelf = "center";
    d.textContent = S.carrier <= 0 ? "No signal. Adjust the carrier." : "Channel 9 is on the air. Nobody is in the studio.";
    a.appendChild(d);
  }
}
function setView(v) {
  if (!S || S.over) return; if (S.view !== v) noise(0.12, 0.08, 1500);
  S.view = v; if (v === "win" && S.win === "lit") S.look = 0;
  if (tvGain && AC) tvGain.gain.setTargetAtTime(v === "ch9" ? 0.9 : 0.1, AC.currentTime, 0.08);
  render();
}
function glow(on) { var t = document.querySelector('.tab[data-v="win"]'); if (t) t.classList.toggle("glow", !!on); }

/* ---------------- ch9 ---------------- */
function garble(s) {
  return s.split(" ").map(function (w) { return Math.random() < 0.33 ? w.replace(/[A-Za-z0-9']/g, "▒") : w; }).join(" ");
}
function ch9Cards() {
  if (N.ch9 === "rules") return ["GOOD EVENING. THESE ARE YOUR OVERNIGHT SAFETY INSTRUCTIONS."].concat(N.rules.map(function (r) { return garble(r.toUpperCase()); }));
  if (N.ch9 === "list") {
    var L = ["MISSING PERSONS. PLEASE CALL WKVN IF SEEN.", "MARTHA KEENE", "WALTER KEENE", "PETE VANCE", "THE PALMER FAMILY", "LINDA MORROW", "HAL BRANDT"];
    if (S.listGene) L.push("GENE ORTIZ");
    L.push("AND YOU."); return L.concat(N.rules.map(function (r) { return garble(r.toUpperCase()); }));
  }
  return ["WKVN WEATHER WITH HAL BRANDT", "VISIBILITY: ZERO.", "WIND FROM THE WEST, AT WALKING SPEED."].concat(N.rules.map(function (r) { return garble(r.toUpperCase()); }));
}
function ch9Tick() {
  if (!S || S.over) return;
  var t = $("ch9t");
  if (S.carrier <= 0) { $("ch9").classList.add("off"); t.textContent = "NO SIGNAL"; }
  else { $("ch9").classList.remove("off"); var c = ch9Cards(); t.textContent = c[S.ch9I % c.length]; S.ch9I++; }
  after(5, ch9Tick);
}
function tvNext() {
  if (!S || S.over || !N.dale) return;
  var name = N.dale[S.tvI % N.dale.length]; S.tvI++;
  if (buf[name]) { play(name, { dest: tvIn }); after(buf[name].duration + rnd(1.5, 3), tvNext); }
  else after(2, tvNext);
}

/* ---------------- events ---------------- */
function whisper() { play("whisper", { gain: 0.35, pan: -0.85 }); }
function dip() { if (S.breaker) return; S.carrier = Math.max(0, S.carrier - 30); noise(0.5, 0.25, 800); log("Carrier dip. Nobody touched the transmitter."); }

function knock(total, o) {
  o = o || {}; var t = 0, left = total;
  while (left > 0) {
    var g = Math.min(left, ri(2, 3)); left -= g;
    for (var i = 0; i < g; i++) { (function (tt) { after(tt, function () { knockSound(); jolt(); if (S.view === "cam" && Math.random() < 0.45) { S.flick = 0.09; render(); } }); })(t); t += rnd(0.42, 0.62); }
    t += rnd(0.9, 1.5);
  }
  log("Knocking at the front entrance.");
  after(t, function () {
    if (o.voice) after(0.8, function () { doorVoice(o.voice, o.twice); });
    if (o.ask) after(o.voice ? 9 : 2.5, askCount);
  });
}
function doorVoice(text, twice) {
  S.voice = { twice: !!twice }; cap("AT THE DOOR", "“" + text + "”"); acts();
  after(7, function () { S.voice = null; cap(null); acts(); log("The voice stopped. Something dragged along the door."); });
}
function askCount() {
  if (S.over) return; if (S.modal) { after(2, askCount); return; }
  S.modal = true; var m = $("mLog"), inp = $("lgIn"), gen = S.gen, t0 = S.rt, dur = 14, done = false;
  var h = 3 + Math.floor((33 + S.gm) / 60), mm = Math.floor(33 + S.gm) % 60;
  $("lgH").textContent = "ENGINEERING LOG · " + N.logd + " " + pad(h) + ":" + pad(mm);
  inp.value = ""; m.hidden = false;
  function close(msg) { if (done) return; done = true; m.hidden = true; S.modal = false; if (msg) log(msg); }
  $("lgOk").onclick = function () {
    var v = parseInt(inp.value, 10);
    if (isNaN(v)) { close("Left blank."); return; }
    if (v === 0) { close("You logged 0. Nobody is inside. Probably."); return; }
    close(); lose("counted", { n: v });
  };
  $("lgSkip").onclick = function () { close("Left blank."); };
  (function bar() {
    if (done || !S || S.gen !== gen || S.over) { m.hidden = true; return; }
    var left = 1 - (S.rt - t0) / dur; $("lgBar").style.width = Math.max(0, left * 100) + "%";
    if (left <= 0) { close("Left blank."); return; } requestAnimationFrame(bar);
  })();
}
function ask(h, q, buttons, dur, onTimeout) {
  if (S.over) return; if (S.modal) { after(2, function () { ask(h, q, buttons, dur, onTimeout); }); return; }
  S.modal = true; var m = $("mAsk"), gen = S.gen, t0 = S.rt, done = false;
  $("askH").textContent = h; $("askQ").textContent = q; var box = $("askB"); box.innerHTML = "";
  function close() { if (done) return; done = true; m.hidden = true; S.modal = false; }
  buttons.forEach(function (b) { var e = document.createElement("button"); e.className = "big " + (b.cls || ""); e.textContent = b.t; e.onclick = function () { close(); b.fn(); }; box.appendChild(e); });
  m.hidden = false;
  (function bar() {
    if (done || !S || S.gen !== gen || S.over) { m.hidden = true; return; }
    var left = 1 - (S.rt - t0) / dur; $("askBar").style.width = Math.max(0, left * 100) + "%";
    if (left <= 0) { close(); onTimeout && onTimeout(); return; } requestAnimationFrame(bar);
  })();
}

function winLight() {
  if (S.win === "walk") return;
  if (S.curtains) { S.curtains = false; log("The curtains are open. You didn't open them."); }
  S.win = "lit"; S.look = 0; glow(true); render(); log("A light came on across the street.");
  after(22, function () {
    if (S.win === "lit") { S.win = "dark"; glow(false); render(); log("The light across the street went out."); after(5, function () { knock(ri(4, 6), { ask: true }); }); }
  });
}
function startWave() {
  S.win = "wave"; S.waveT = 0; render(); noise(0.2, 0.12, 2000);
  after(15, function () { if (S.win === "wave") { S.win = "dark"; glow(false); render(); log("The window across the street is empty now."); after(4, function () { knock(ri(5, 7), { ask: true }); }); } });
}
function closeCurtains() {
  if (S.win === "wave") log("Curtains closed. It was still waving.");
  else if (S.win === "lit") log("Curtains closed before it saw you.");
  else log("Curtains closed.");
  S.curtains = true; if (S.win === "lit" || S.win === "wave") S.win = "dark"; glow(false); render();
}
function walker() {
  if (S.curtains) { S.curtains = false; log("The curtains are open. You didn't open them."); }
  S.win = "walk"; glow(true); render(); log("Something tall is in the street. It is walking west.");
  after(18, function () {
    S.win = "dark"; glow(false); render(); log("It walked past the station.");
    after(6, function () { ring("dale"); });
  });
}
function breaker() {
  S.breaker = true; S.carrier = 0; noise(0.8, 0.4, 300); log("MAIN BREAKER TRIPPED.");
  ask("MAIN BREAKER TRIPPED", "The transmitter is dead. The breaker box is outside, at the base of the tower. It is very foggy.",
    [{ t: "GO OUTSIDE", cls: "red", fn: function () { lose("outside"); } }, { t: "WAIT", cls: "ghost", fn: function () { log("You wait in the dark."); } }],
    12, function () { log("You wait in the dark."); });
  after(24, function () { S.breaker = false; S.carrier = 55; noise(0.3, 0.2, 800); log("The breaker reset itself. Nobody is outside. Something is outside."); });
}

/* ---------------- phone ---------------- */
function pUI(st, buttons, led) {
  $("pSt").textContent = st; $("led").classList.toggle("on", !!led);
  var b = $("pBtns"); b.innerHTML = "";
  (buttons || []).forEach(function (x) { var e = document.createElement("button"); e.className = "pbtn"; e.textContent = x.t; e.onclick = x.fn; if (x.hot) e.style.borderColor = "var(--amber)"; b.appendChild(e); });
}
function ring(kind) {
  if (S.over) return; if (S.phone.st !== "idle") { after(6, function () { ring(kind); }); return; }
  var id = Math.random(); S.phone = { st: "ring", kind: kind, id: id }; ringStart(); $("pTr").textContent = "";
  pUI("RINGING", [{ t: "ANSWER", fn: answer }, { t: "IGNORE", fn: function () { endCall("You let it ring."); } }], true);
  log("Extension 9 is ringing. Extension 9 is this room.");
  after(9, function () { if (S.phone.id === id && S.phone.st === "ring") endCall("Extension 9 stopped ringing."); });
}
function endCall(msg) { ringStop(); S.phone = { st: "idle" }; pUI("idle"); if (msg) log(msg); setTimeout(function () { if (S && S.phone.st === "idle") $("pTr").textContent = ""; }, 4000); }
function line(id, sec, txt, fn) { after(sec, function () { if (S.phone.id !== id || S.phone.st !== "talk") return; if (txt != null) $("pTr").textContent = txt; if (fn) fn(); }); }
function answer() {
  ringStop(); var ph = S.phone, id = ph.id; ph.st = "talk"; $("pTr").textContent = "";
  var hang = { t: "HANG UP", fn: function () { endCall("You hung up."); } };
  pUI("LINE OPEN", [hang]);
  if (ph.kind === "breath") {
    line(id, 0.6, "…");
    line(id, 2.2, "(breathing)");
    line(id, 4.4, "(it's your breathing. half a second ahead of yours.)");
    line(id, 8.5, null, function () { endCall("The line went dead."); });
  } else if (ph.kind === "ruth1") {
    line(id, 0.6, "RUTH: Gene, it's Ruth.");
    line(id, 3.0, "RUTH: I'm at home. I'm going to sleep.");
    line(id, 5.6, "RUTH: If I call again tonight, don't pick up.");
    line(id, 9.5, null, function () { endCall("Ruth hung up."); });
  } else if (ph.kind === "ruth2") {
    line(id, 0.8, "“Gene?”");
    line(id, 2.6, "“…Gene.”", function () {
      pUI("LINE OPEN", [{ t: 'SAY "RUTH?"', hot: true, fn: function () { lose("twice"); } }, hang]);
    });
    line(id, 7.2, null, function () { lose("twice"); });
  } else if (ph.kind === "dale") {
    line(id, 0.6, "DALE: Gene, it's Dale.");
    line(id, 2.8, "DALE: It went right past the station. Heading west.");
    line(id, 5.4, "DALE: Grab the camera. We can still get it on tape. I'm outside.", function () {
      pUI("LINE OPEN", [{ t: "GO OUTSIDE", hot: true, fn: function () { lose("followed"); } }, hang]);
    });
    line(id, 14, null, function () { endCall("Dale stopped talking. The line stayed open for a long time."); });
  }
}

/* ---------------- loop ---------------- */
var nctx = $("noise").getContext("2d"), nimg = nctx.createImageData(120, 160), nT = 0, last = 0;
function drawNoise(dt) {
  nT += dt; if (nT < 0.045) return; nT = 0;
  var d = nimg.data; for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  nctx.putImageData(nimg, 0, 0);
  $("noise").style.opacity = (0.05 + (1 - S.carrier / 100) * 0.3 + (S.view === "ch9" && S.carrier <= 0 ? 0.5 : 0)).toFixed(2);
}
function clockText() {
  var tot = 33 + S.gm, h = 3 + Math.floor(tot / 60), m = Math.floor(tot) % 60, s = Math.floor((tot % 1) * 60);
  $("hClock").textContent = pad(h) + ":" + pad(m) + " AM";
  $("mTs").textContent = N.date + " " + pad(h) + ":" + pad(m) + ":" + pad(s);
}
var TOK = 0;
function tick(now, tok) {
  if (!S || !S.running || tok !== TOK) return;
  var dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
  requestAnimationFrame(function (t) { tick(t, tok); });
  if (S.paused || S.over) return;
  S.rt += dt; S.gm += dt / SPM;
  while (S.ei < S.ev.length && S.ev[S.ei].t <= S.gm) { try { S.ev[S.ei].f(); } catch (e) { console.error(e); } S.ei++; if (S.over) return; }
  var q = S.q; S.q = []; var keep = [];
  for (var i = 0; i < q.length; i++) { if (q[i].at <= S.rt) { if (!S.over) { try { q[i].fn(); } catch (e) { console.error(e); } } } else keep.push(q[i]); }
  S.q = keep.concat(S.q);
  if (S.over) return;
  if (S.flick > 0) { S.flick -= dt; if (S.flick <= 0) { S.flick = 0; render(); } }
  if (!S.breaker) S.carrier = Math.max(0, S.carrier - N.decay * dt * (1 + 0.45 * Math.sin(S.rt * 0.7)));
  if (S.carrier <= 0 && !S.breaker) { S.zero += dt; if (S.zero > 7) { lose("carrier"); return; } } else S.zero = 0;
  if (S.carrier < 22 && !S.breaker) { S.beepT -= dt; if (S.beepT <= 0) { tone(1000, 0.07, 0.06, "square"); S.beepT = S.carrier <= 0 ? 0.5 : 1; } }
  $("meterI").style.width = S.carrier.toFixed(1) + "%"; $("meter").classList.toggle("low", S.carrier < 22);
  if (!S.curtains && S.win === "lit" && S.view === "win") { S.look += dt; if (S.look > 1.3) startWave(); }
  if (!S.curtains && S.win === "wave" && S.view === "win") { S.waveT += dt; if (S.waveT > 3.8) { lose("looked"); return; } }
  drawNoise(dt); clockText();
  if (S.gm >= LEN) win();
}

/* ---------------- flow ---------------- */
function show(id) { ["sTitle", "sBrief", "sEnd"].forEach(function (s) { $(s).hidden = s !== id; }); $("game").hidden = id !== null; if (id === null) window.scrollTo(0, 0); }
function menu() {
  var ul = $("nights"); ul.innerHTML = "";
  Object.keys(NIGHTS).forEach(function (k) {
    var n = +k, nt = NIGHTS[n], ok = released(n), done = store("wkvn_ns_" + n) === "1";
    var li = document.createElement("li"), b = document.createElement("button"); b.className = "nbtn"; b.disabled = !ok;
    b.innerHTML = "<span>NIGHT " + n + " &middot; " + nt.name + "</span><span class='st" + (done ? " ok" : "") + "'>" +
      (!ok ? "SIGNAL NOT YET RECEIVED<br>BROADCAST " + nt.ep : done ? "&#10003; SURVIVED" : "BROADCAST " + nt.ep) + "</span>";
    if (ok) b.onclick = function () { brief(n); };
    li.appendChild(b); ul.appendChild(li);
  });
  show("sTitle");
}
var typeTimer = null;
function brief(n) {
  N = NIGHTS[n]; show("sBrief");
  $("bHead").textContent = "ENGINEERING LOG · " + N.logd + " · 03:33 AM";
  $("bWarn").textContent = "Tonight's instructions were in Broadcast " + N.ep + ". If you haven't seen it, you won't make it.";
  $("bWatch").href = TT;
  var full = N.brief, i = 0, el = $("bText"); el.textContent = ""; clearInterval(typeTimer);
  typeTimer = setInterval(function () { i += 2; el.textContent = full.slice(0, i); if (i >= full.length) clearInterval(typeTimer); }, 28);
  $("bGo").onclick = function () { clearInterval(typeTimer); start(n); };
}
function start(n) {
  audioInit(); stopAll(); humStart();
  N = NIGHTS[n]; S = newState(n);
  $("hN").textContent = "NIGHT " + n + " · " + N.name; $("log").innerHTML = ""; $("pTr").textContent = ""; cap(null);
  $("mLog").hidden = true; $("mAsk").hidden = true; glow(false); pUI("idle");
  show(null); setView("cam");
  log("Ruth went home. You are alone."); ch9Tick(); after(3, tvNext);
  last = 0; var tok = ++TOK; requestAnimationFrame(function (t) { tick(t, tok); });
}
function finish() { S.over = true; S.running = false; ringStop(); wave.pause(); $("mLog").hidden = true; $("mAsk").hidden = true; }
function lose(cause, extra) {
  if (!S || S.over) return; finish();
  var c = CAUSE[cause], n = S.n, jumpy = cause === "peephole" || cause === "door" || cause === "answered" || cause === "twice" || cause === "counted";
  stopAll();
  if (jumpy) {
    $("jumpImg").src = A + (cause === "peephole" ? "peep.jpg" : "door.jpg"); $("jump").hidden = false; flash(0.9); scareSound();
    setTimeout(function () { $("jump").hidden = true; endScreen(false, cause, extra, n); }, 1500);
  } else { noise(1.2, 0.5, 400); setTimeout(function () { endScreen(false, cause, extra, n); }, 900); }
}
function win() {
  if (!S || S.over) return; finish(); stopAll(); tone(1000, 1.2, 0.08);
  store("wkvn_ns_" + S.n, "1"); endScreen(true, "survived", null, S.n);
}
function endScreen(won, cause, extra, n) {
  var nt = NIGHTS[n], c = CAUSE[cause];
  $("sEnd").classList.toggle("win", won); show("sEnd");
  $("eH").textContent = won ? "06:00 AM · SIGN-ON" : c.h;
  var causeTxt = won ? "You made it through Night " + n + "." : c.c.replace(/\{n\}/g, extra && extra.n);
  $("eCause").textContent = causeTxt; $("eCause").style.color = won ? "var(--fg)" : "var(--red)";
  $("eRule").textContent = won ? nt.win : "Broadcast " + nt.ep + ": “" + c.rule + "”";
  $("eImg").src = A + (won ? "cam1.jpg" : c.img);
  $("eWatch").textContent = won ? "NEXT BROADCASTS ON TIKTOK" : "WATCH BROADCAST " + nt.ep;
  var next = NIGHTS[n + 1];
  var again = $("eAgain");
  if (won && next) { again.textContent = released(n + 1) ? "NIGHT " + (n + 1) + " · " + next.name : "NIGHT " + (n + 1) + " UNLOCKS WITH BROADCAST " + next.ep; again.disabled = !released(n + 1); again.onclick = function () { brief(n + 1); }; }
  else { again.textContent = "TRY AGAIN"; again.disabled = false; again.onclick = function () { brief(n); }; }
  var st = $("eStat"); st.hidden = true;
  var shareTxt = won ? "I survived Night " + n + " of the WKVN night shift." : causeTxt + " I let it in on Night " + n + " of the WKVN night shift.";
  report(n, cause, function (j) {
    if (!j) return; var total = 0, k; for (k in j) total += +j[k] || 0; if (!total) return;
    var surv = +j.survived || 0, lost = total - surv, same = +j[cause] || 0;
    if (total < 15) st.innerHTML = "<b>#" + total + "</b>You are engineer #" + total + " on Night " + n + ".";
    else if (won) { var ps = Math.round(surv / total * 100); st.innerHTML = "<b>" + ps + "%</b>of engineers made it through Night " + n + ". You are one of them."; shareTxt += " Only " + ps + "% did."; }
    else { var pl = Math.round(lost / total * 100), pc = Math.round(same / total * 100); st.innerHTML = "<b>" + pl + "%</b>of engineers didn't make it through Night " + n + ".<br>" + pc + "% made the same mistake."; shareTxt += " " + pl + "% of engineers didn't make it."; }
    st.hidden = false;
  });
  $("eShare").textContent = "SHARE";
  $("eShare").onclick = function () {
    var url = location.origin + "/night-shift";
    if (navigator.share) { navigator.share({ title: "WKVN Night Shift", text: shareTxt, url: url }).catch(function () {}); return; }
    var t = shareTxt + " " + url;
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { $("eShare").textContent = "COPIED"; }, function () { prompt("Copy:", t); });
    else prompt("Copy:", t);
  };
}
function report(n, r, cb) {
  if (!API) { cb(null); return; }
  fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ n: n, r: r }) })
    .then(function (x) { return x.ok ? x.json() : null; }).then(function (j) { cb(j && j.counts); }).catch(function () { cb(null); });
}

/* ---------------- wiring ---------------- */
var tabs = document.querySelectorAll(".tab");
for (var i = 0; i < tabs.length; i++) tabs[i].onclick = function () { setView(this.getAttribute("data-v")); };
$("adj").onclick = function () { if (!S || S.over || S.breaker) return; S.carrier = Math.min(100, S.carrier + 20); tone(420, 0.05, 0.05, "square"); };
$("bBack").onclick = function (e) { e.preventDefault(); menu(); };
$("eMenu").onclick = function (e) { e.preventDefault(); menu(); };
$("lgIn").addEventListener("keydown", function (e) { if (e.key === "Enter") $("lgOk").click(); });
document.addEventListener("keydown", function (e) {
  if (!S || S.over || S.modal || $("game").hidden) return;
  if (e.key === "1") setView("cam"); else if (e.key === "2") setView("win"); else if (e.key === "3") setView("ch9");
  else if (e.key === " ") { e.preventDefault(); $("adj").click(); }
});
document.addEventListener("visibilitychange", function () {
  if (!S || S.over) return; S.paused = document.hidden;
  if (AC) { if (document.hidden) AC.suspend(); else AC.resume(); }
});
try { console.log("%cterminal 2 is logged in as g.ortiz. he never logged out.", "color:#7dff9a;font:14px monospace"); } catch (e) {}
menu();
})();
