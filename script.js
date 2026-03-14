/* ════════════════════════════════════════
   MOTEUR AUDIO — Web Audio API
   ════════════════════════════════════════ */
let audioCtx = null;
let suspenseNodes = [];
let bgMusicNodes = [];   /* musique de fond */
let bgMusicPlaying = false;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

/* ════════════════════════════════════════
   MUSIQUE DE FOND — Épopée Triomphale
   Tonalité Ré Majeur, BPM 96, style fanfare orchestrale festive
   Cuivres héroïques + cordes + timbales + arpèges de harpe
   ════════════════════════════════════════ */
function startBgMusic() {
  if (bgMusicPlaying) return;
  bgMusicPlaying = true;
  const ctx = getCtx();

  /* ── Masterbus ── */
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -16;
  master.knee.value = 8;
  master.ratio.value = 5;
  master.attack.value = 0.002;
  master.release.value = 0.2;
  master.connect(ctx.destination);

  /* ── Reverb hall ── */
  function makeReverb(dry=0.55, wet=0.45, dt=0.1, fb=0.48) {
    const dG = ctx.createGain(); dG.gain.value = dry;
    const wG = ctx.createGain(); wG.gain.value = wet;
    const dl = ctx.createDelay(2.5); dl.delayTime.value = dt;
    const fbG = ctx.createGain(); fbG.gain.value = fb;
    const dl2 = ctx.createDelay(2.5); dl2.delayTime.value = dt * 1.6;
    const fbG2 = ctx.createGain(); fbG2.gain.value = fb * 0.7;
    dl.connect(fbG); fbG.connect(dl); dl.connect(wG);
    dl2.connect(fbG2); fbG2.connect(dl2); dl2.connect(wG);
    const inp = ctx.createGain();
    inp.connect(dG); inp.connect(dl); inp.connect(dl2);
    dG.connect(master); wG.connect(master);
    return inp;
  }
  const verb = makeReverb();

  /* ── Gamme Ré Majeur (D) : D E F# G A B C# ── */
  const ROOT = 146.83; /* D3 */
  const SCALE = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2]; // D maj

  function freq(degree, octave=0) {
    const d = ((degree % 7) + 7) % 7;
    const oct = Math.floor(degree / 7) + octave;
    return ROOT * SCALE[d] * Math.pow(2, oct);
  }

  /* ── Section cuivres (trompette synthétique) ── */
  function brass(f, t, dur, vol=0.18) {
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 2400; flt.Q.value = 0.8;
    o1.type = 'sawtooth'; o1.frequency.value = f;
    o2.type = 'sawtooth'; o2.frequency.value = f * 1.003;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol * 0.85, t + dur * 0.65);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o1.connect(flt); o2.connect(flt); flt.connect(g); g.connect(verb);
    o1.start(t); o1.stop(t + dur + 0.08);
    o2.start(t); o2.stop(t + dur + 0.08);
  }

  /* ── Nappe cordes (violons) ── */
  function strings(f, t, dur, vol=0.10) {
    [1, 2, 0.5].forEach((mult, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const flt = ctx.createBiquadFilter();
      flt.type = 'bandpass'; flt.frequency.value = f * mult * 1.5; flt.Q.value = 2;
      o.type = 'sawtooth'; o.frequency.value = f * mult * (1 + i * 0.002);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol / (i+1), t + 0.18);
      g.gain.setValueAtTime(vol * 0.7 / (i+1), t + dur - 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(flt); flt.connect(g); g.connect(verb);
      o.start(t); o.stop(t + dur + 0.1);
    });
  }

  /* ── Basse héroïque ── */
  function bass(f, t, dur, vol=0.30) {
    const o = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const g = ctx.createGain();
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 300; flt.Q.value = 1.5;
    o.type = 'sawtooth'; o.frequency.value = f * 0.5;
    sub.type = 'sine'; sub.frequency.value = f * 0.25;
    const gSub = ctx.createGain(); gSub.gain.value = 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(flt); flt.connect(g); g.connect(master);
    sub.connect(gSub); gSub.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    sub.start(t); sub.stop(t + dur + 0.05);
  }

  /* ── Timbales festives ── */
  function timbal(t, pitchHz=80, vol=0.55) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(pitchHz * 1.4, t);
    o.frequency.exponentialRampToValueAtTime(pitchHz, t + 0.15);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.6);
    /* snap */
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate*0.03), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 2);
    const src = ctx.createBufferSource();
    const gn = ctx.createGain(); gn.gain.value = 0.12;
    src.buffer = buf; src.connect(gn); gn.connect(master);
    src.start(t);
  }

  /* ── Harpe arpégée ── */
  function harp(f, t, vol=0.11) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    o.connect(g); g.connect(verb);
    o.start(t); o.stop(t + 1.3);
  }

  /* ── Cymbale scintillante (hi-hat ouvert) ── */
  function cymbal(t, vol=0.07) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate*0.35), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 1.2);
    const src = ctx.createBufferSource();
    const flt = ctx.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=7000;
    const g = ctx.createGain(); g.gain.value = vol;
    src.buffer=buf; src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t);
  }

  /* ════════════════════════════════════════
     SÉQUENCEUR — 8 mesures, D Majeur, 96 BPM
     Motif : fanfare héroïque avec ponctuation de timbales
     Progression : I – V – IV – I – VI – IV – V – I
  ════════════════════════════════════════ */
  const BPM = 96;
  const beat = 60 / BPM;
  const bar  = beat * 4;

  /* Accords (degrés de la gamme D maj) */
  const chords = [
    [0, 2, 4],   /* I  = D  F# A  */
    [4, 6, 9],   /* V  = A  C# E  */
    [3, 5, 7],   /* IV = G  B  D  */
    [0, 2, 4],   /* I  = D  F# A  */
    [5, 7, 9],   /* VI = B  D  F# */
    [3, 5, 7],   /* IV = G  B  D  */
    [4, 6, 9],   /* V  = A  C# E  */
    [0, 2, 4],   /* I  = D  F# A  (finale) */
  ];

  /* Mélodie fanfare (notes en degrés) */
  const melody = [
    {d:4,b:0},{d:4,b:0.5},{d:5,b:1},{d:6,b:1.5},
    {d:7,b:2},{d:6,b:2.5},{d:5,b:3},{d:4,b:3.5},
    {d:3,b:4},{d:3,b:4.5},{d:4,b:5},{d:5,b:5.5},
    {d:4,b:6},{d:2,b:6.5},{d:4,b:7},{d:4,b:7.5},
    {d:5,b:8},{d:5,b:8.5},{d:6,b:9},{d:7,b:9.5},
    {d:9,b:10},{d:7,b:10.5},{d:6,b:11},{d:5,b:11.5},
    {d:4,b:12},{d:6,b:12.5},{d:9,b:13},{d:9,b:13.5},
    {d:11,b:14},{d:9,b:14.5},{d:7,b:15},{d:7,b:15.5},
  ];

  /* Basse (root par mesure) */
  const bassNotes = [0, 4, 3, 0, 5, 3, 4, 0];

  function scheduleLoop(offset) {
    const now = ctx.currentTime + offset;

    /* Cordes en nappes par mesure */
    chords.forEach((chord, ci) => {
      const t = now + ci * bar;
      chord.forEach(d => strings(freq(d, 1), t, bar * 0.92, 0.08));
    });

    /* Cuivres mélodie (trompettes) */
    melody.forEach(({d, b}) => {
      brass(freq(d, 2), now + b * beat, beat * 0.82, 0.15);
    });

    /* Basse héroïque */
    bassNotes.forEach((d, i) => {
      bass(freq(d, 0), now + i * bar, bar * 0.88);
      /* Octave basse supplémentaire sur temps 1 et 3 */
      bass(freq(d, -1), now + i * bar, beat * 0.5, 0.15);
      bass(freq(d, -1), now + i * bar + beat * 2, beat * 0.5, 0.12);
    });

    /* Timbales sur temps forts */
    for (let m = 0; m < 8; m++) {
      const mt = now + m * bar;
      timbal(mt, 98, 0.55);                      /* temps 1 */
      timbal(mt + beat * 2, 80, 0.38);           /* temps 3 */
      if (m === 7) timbal(mt + beat * 3, 110, 0.6); /* fill final */
    }

    /* Cymbales légères sur chaque temps pair */
    for (let b2 = 0; b2 < 32; b2++) {
      if (b2 % 2 === 1) cymbal(now + b2 * beat, 0.05);
    }

    /* Harpe arpégée (ornement) — toutes les 2 mesures */
    [0, 1, 2, 3, 4, 5, 6, 7, 9, 11].forEach((d, i) => {
      harp(freq(d % 8, 2), now + i * beat * 1.5, 0.10);
    });

    /* Boucle */
    const loopDur = 8 * bar;
    const id = setTimeout(() => scheduleLoop(0), (loopDur - 0.4) * 1000);
    bgMusicNodes.push(id);
  }

  scheduleLoop(0.4);
}

function stopBgMusic() {
  bgMusicPlaying = false;
  bgMusicNodes.forEach(id => clearTimeout(id));
  bgMusicNodes = [];
}

/* ════════════════════════════════════════
   SON DE SUSPENSE — Roulement orchestral
   Tambour + cordes + montée de tension
   ════════════════════════════════════════ */
function startSuspenseSound() {
  stopSuspenseSound();
  const ctx = getCtx();

  /* Tambour de caisse roulante accélérant */
  let interval = 160;
  let rollGain = 0.25;

  function scheduleRoll() {
    const now = ctx.currentTime;

    /* Coup de tambour grave */
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + Math.random()*30, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);
    g.gain.setValueAtTime(rollGain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);

    /* Roulement bruit brun */
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for(let i=0;i<d.length;i++){
      const w = Math.random()*2-1;
      last = (last + 0.12*w) / 1.12;
      d[i] = last * 8;
    }
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=600;
    const gn = ctx.createGain(); gn.gain.value = rollGain * 0.7;
    src.buffer=buf; src.connect(f); f.connect(gn); gn.connect(ctx.destination);
    src.start(now);

    /* Cordes staccato (tremolo) */
    const str = ctx.createOscillator();
    const gStr = ctx.createGain();
    const tremoloLFO = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    tremoloLFO.frequency.value = 12 + (160-interval)*0.05;
    tremoloGain.gain.value = 0.06;
    tremoloLFO.connect(tremoloGain); tremoloGain.connect(gStr.gain);
    str.type = 'sawtooth';
    str.frequency.value = 220 + Math.random()*20;
    gStr.gain.setValueAtTime(0.07, now);
    gStr.gain.exponentialRampToValueAtTime(0.001, now + interval/1000 * 0.9);
    str.connect(gStr); gStr.connect(ctx.destination);
    str.start(now); str.stop(now + interval/1000);
    tremoloLFO.start(now); tremoloLFO.stop(now + interval/1000);
  }

  let elapsed = 0;
  function tick() {
    scheduleRoll();
    elapsed += interval;
    /* Accélère et monte le volume */
    if(elapsed > 800) {
      interval = Math.max(52, interval - 6);
      rollGain = Math.min(0.55, rollGain + 0.008);
    }
    const id = setTimeout(tick, interval);
    suspenseNodes.push(id);
  }
  tick();
}

function stopSuspenseSound() {
  suspenseNodes.forEach(id => clearTimeout(id));
  suspenseNodes = [];
}

/* ════════════════════════════════════════
   SON DE VICTOIRE — Fanfare épique
   Cuivres + timbales + cloche + applaudissements
   ════════════════════════════════════════ */
function playWinnerSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -6;
  master.ratio.value = 4;
  master.connect(ctx.destination);

  /* Reverb plate */
  const rev = ctx.createDelay(1.5); rev.delayTime.value = 0.06;
  const revFb = ctx.createGain(); revFb.gain.value = 0.45;
  const revOut = ctx.createGain(); revOut.gain.value = 0.3;
  rev.connect(revFb); revFb.connect(rev); rev.connect(revOut); revOut.connect(master);

  function note(freq, t, dur, type='sawtooth', vol=0.3) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=3000;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol*0.8, t + dur*0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); g.connect(rev);
    o.start(t); o.stop(t+dur+0.05);
  }

  /* Accord initial PUNCH (La mineur → La majeur) */
  const chord1 = [110,165,220,277,330,440];
  chord1.forEach(f => note(f, now, 0.18, 'sawtooth', 0.22));

  /* Fanfare montante : La Mi Sol# La (arpège héroïque) */
  const fanfare = [
    {f:440, t:0.05, d:0.22}, {f:550, t:0.17, d:0.22},
    {f:660, t:0.29, d:0.22}, {f:880, t:0.41, d:0.35},
    {f:1100,t:0.52, d:0.28}, {f:880, t:0.65, d:0.45},
    {f:1320,t:0.8,  d:0.8 }
  ];
  fanfare.forEach(({f,t,d}) => note(f, now+t, d, 'sawtooth', 0.28));
  /* Octave doublure */
  fanfare.forEach(({f,t,d}) => note(f*0.5, now+t+0.01, d, 'triangle', 0.14));

  /* Timbales (3 coups) */
  [0, 0.16, 0.38].forEach((offset, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const vol = [0.7, 0.5, 0.8][i];
    o.type='sine'; o.frequency.setValueAtTime(80,now+offset);
    o.frequency.exponentialRampToValueAtTime(38, now+offset+0.22);
    g.gain.setValueAtTime(vol, now+offset);
    g.gain.exponentialRampToValueAtTime(0.001, now+offset+0.4);
    o.connect(g); g.connect(master);
    o.start(now+offset); o.stop(now+offset+0.45);
  });

  /* Grand accord final avec cuivres plein */
  const finalChord = [220,275,330,440,550,660,880,1100];
  finalChord.forEach(f => {
    note(f, now+0.75, 1.8, 'sawtooth', 0.18);
    note(f*1.002, now+0.76, 1.8, 'triangle', 0.09);
  });

  /* Cloche cristalline soprano */
  [now+0.78, now+0.92, now+1.1].forEach((t,i) => {
    const bell = ctx.createOscillator();
    const bG = ctx.createGain();
    bell.type='sine'; bell.frequency.value = [4186,3520,2637][i];
    bG.gain.setValueAtTime(0.25-i*0.05, t);
    bG.gain.exponentialRampToValueAtTime(0.001, t+1.4-i*0.2);
    bell.connect(bG); bG.connect(master); bG.connect(rev);
    bell.start(t); bell.stop(t+1.6);
  });

  /* Applaudissements synthétiques */
  for(let i=0;i<35;i++) {
    const delay = 0.85 + Math.random()*0.8;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate*0.06), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let j=0;j<d.length;j++) d[j]=(Math.random()*2-1)*Math.pow(1-j/d.length,1.5);
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1200+Math.random()*2000; f.Q.value=0.8;
    const g = ctx.createGain(); g.gain.value = 0.06 + Math.random()*0.06;
    src.buffer=buf; src.connect(f); f.connect(g); g.connect(master);
    src.start(now+delay);
  }
}

/* ════════════════════════════════════════
   CONFIG TOMBOLA
   ════════════════════════════════════════ */
const N = 850;
let numerosDisponibles = [...Array(N)].map((_,i)=>i+1);
let isRunning = false;
let winCount = 0;

/* ────────────── PARTICLES BG ────────────── */
function createParticles() {
  const colors = ['#FFD700','#B8860B','#CC0000','#ffffff','#FFF0A0'];
  for(let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 1 + Math.random() * 3;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}vw;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      opacity:${0.3+Math.random()*0.7};
      animation-duration:${8+Math.random()*15}s;
      animation-delay:-${Math.random()*15}s;
    `;
    document.body.appendChild(p);
  }
}
createParticles();

/* ────────────── CANVAS ANIMATED BG ────────────── */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ── Étoiles fixes générées une seule fois ── */
const stars = [];
for(let i=0;i<220;i++){
  stars.push({
    x: Math.random()*2000, y: Math.random()*2000,
    r: 0.3+Math.random()*1.4,
    a: 0.2+Math.random()*0.8,
    speed: 0.3+Math.random()*1.2,
    phase: Math.random()*Math.PI*2
  });
}

/* ── Particules lumineuses flottantes ── */
const glows = [];
for(let i=0;i<12;i++){
  glows.push({
    x: Math.random()*2000, y: Math.random()*2000,
    r: 40+Math.random()*120,
    a: 0.04+Math.random()*0.07,
    color: i%3===0 ? '180,0,0' : i%3===1 ? '255,140,0' : '139,0,0',
    vx: (Math.random()-0.5)*0.3,
    vy: (Math.random()-0.5)*0.2,
    phase: Math.random()*Math.PI*2
  });
}

let t = 0;
function drawBG() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  /* ── Fond dégradé radial profond ── */
  const g1 = ctx.createRadialGradient(W*0.5, H*0.15, 0, W*0.5, H*0.5, H*1.1);
  g1.addColorStop(0,   '#2a0005');
  g1.addColorStop(0.25,'#1a0003');
  g1.addColorStop(0.6, '#0d0000');
  g1.addColorStop(1,   '#040000');
  ctx.fillStyle = g1;
  ctx.fillRect(0,0,W,H);

  /* ── Lueur centrale rouge-or en haut ── */
  const g2 = ctx.createRadialGradient(W*0.5, 0, 0, W*0.5, 0, W*0.7);
  g2.addColorStop(0,   'rgba(180,20,0,0.22)');
  g2.addColorStop(0.4, 'rgba(100,5,0,0.10)');
  g2.addColorStop(1,   'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0,0,W,H);

  /* ── Lueur or subtile en bas ── */
  const g3 = ctx.createRadialGradient(W*0.5, H, 0, W*0.5, H, W*0.6);
  g3.addColorStop(0,   'rgba(180,100,0,0.12)');
  g3.addColorStop(0.5, 'rgba(100,40,0,0.05)');
  g3.addColorStop(1,   'transparent');
  ctx.fillStyle = g3;
  ctx.fillRect(0,0,W,H);

  /* ── Glows flottants ── */
  glows.forEach(g => {
    g.x += g.vx; g.y += g.vy;
    if(g.x < -g.r) g.x = W+g.r;
    if(g.x > W+g.r) g.x = -g.r;
    if(g.y < -g.r) g.y = H+g.r;
    if(g.y > H+g.r) g.y = -g.r;
    const pulse = g.a * (0.6 + 0.4*Math.sin(t*0.8 + g.phase));
    const gc = ctx.createRadialGradient(g.x,g.y,0,g.x,g.y,g.r);
    gc.addColorStop(0, `rgba(${g.color},${pulse})`);
    gc.addColorStop(1, 'transparent');
    ctx.fillStyle = gc;
    ctx.fillRect(0,0,W,H);
  });

  /* ── Anneaux concentriques dorés ── */
  for(let i=0;i<6;i++){
    const r = 80 + i*110 + Math.sin(t*0.4+i*0.7)*15;
    const alpha = (0.025 - i*0.003) * (0.7 + 0.3*Math.sin(t*0.5+i));
    ctx.beginPath();
    ctx.arc(W*0.5, H*0.05, r, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(255,215,0,${Math.max(0,alpha)})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  /* ── Lignes diagonales rouges très subtiles ── */
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#cc2200';
  ctx.lineWidth = 1;
  for(let i=-10;i<30;i++){
    const x = i*80 + (t*8)%80;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - H*0.5, H);
    ctx.stroke();
  }
  ctx.restore();

  /* ── Étoiles scintillantes ── */
  stars.forEach(s => {
    const flicker = s.a * (0.4 + 0.6 * Math.abs(Math.sin(t*s.speed + s.phase)));
    ctx.beginPath();
    ctx.arc(s.x % W, s.y % H, s.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,230,150,${flicker})`;
    ctx.fill();
  });

  /* ── Quelques étoiles dorées ++ brillantes ── */
  for(let i=0;i<8;i++){
    const sx = (stars[i].x*1.3)%W;
    const sy = (stars[i].y*1.1)%H;
    const gstar = ctx.createRadialGradient(sx,sy,0,sx,sy,4+stars[i].r*2);
    const a = 0.5+0.5*Math.sin(t*2+i);
    gstar.addColorStop(0, `rgba(255,215,0,${a*0.7})`);
    gstar.addColorStop(1, 'transparent');
    ctx.fillStyle = gstar;
    ctx.fillRect(sx-8, sy-8, 16, 16);
  }

  t += 0.008;
  requestAnimationFrame(drawBG);
}
drawBG();

/* ────────────── TIRAGE ────────────── */
function updateCounters() {
  document.getElementById('restants').textContent = numerosDisponibles.length;
  document.getElementById('tires').textContent = winCount;
}

function startTirage() {
  if(isRunning) return;
  if(numerosDisponibles.length === 0) {
    alert('🏆 Tous les numéros ont été tirés !');
    return;
  }
  isRunning = true;
  document.getElementById('btnTirage').disabled = true;

  getCtx(); /* débloque AudioContext sur geste utilisateur */
  const numEl = document.getElementById('numero');
  numEl.classList.remove('winner-pop');
  numEl.classList.add('rolling');

  startSuspenseSound();

  let count = 0;
  const total = 45 + Math.floor(Math.random()*20);
  const interval = setInterval(() => {
    numEl.textContent = Math.floor(Math.random() * N) + 1;
    count++;
    if(count >= total) {
      clearInterval(interval);
      stopSuspenseSound();
      numEl.classList.remove('rolling');
      tirageFinal();
    }
  }, 70);
}

function tirageFinal() {
  const idx = Math.floor(Math.random() * numerosDisponibles.length);
  const numero = numerosDisponibles.splice(idx, 1)[0];
  winCount++;

  const numEl = document.getElementById('numero');
  numEl.textContent = numero;
  numEl.classList.add('winner-pop');

  /* 🎺 Fanfare de victoire */
  playWinnerSound();

  // Flash
  const flash = document.getElementById('winner-flash');
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 500);

  // Confetti
  fireConfetti();

  // Add to list — groupes de 4 par ligne
  const liste = document.getElementById('liste');
  const cell = document.createElement('div');
  cell.className = 'winner-cell';
  cell.innerHTML = `
    <span class="winner-rank">#${winCount}</span>
    <span class="winner-number">${numero}</span>
    <span class="winner-star">★</span>
  `;

  const rows = liste.querySelectorAll('.winner-row');
  const lastRow = rows[0];
  if (lastRow && lastRow.children.length < 4) {
    lastRow.insertBefore(cell, lastRow.firstChild);
  } else {
    const row = document.createElement('div');
    row.className = 'winner-row';
    row.appendChild(cell);
    liste.prepend(row);
  }

  updateCounters();

  setTimeout(() => {
    isRunning = false;
    document.getElementById('btnTirage').disabled = false;
  }, 800);
}

/* ────────────── CONFETTI ────────────── */
function fireConfetti() {
  const colors = ['#FFD700','#FFF0A0','#CC0000','#ffffff','#B8860B','#ff6b6b'];
  const shapes = ['■','●','▲','★','◆'];
  for(let i = 0; i < 60; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.textContent = shapes[Math.floor(Math.random()*shapes.length)];
      c.style.cssText = `
        left:${Math.random()*100}vw;
        color:${colors[Math.floor(Math.random()*colors.length)]};
        font-size:${10+Math.random()*16}px;
        animation-duration:${2+Math.random()*3}s;
      `;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }, i * 30);
  }
}

/* ────────────── MUSIQUE FOND ────────────── */
function toggleBgMusic() {
  const btn = document.getElementById('musicBtn');
  const lbl = document.getElementById('musicLabel');
  if(bgMusicPlaying) {
    stopBgMusic();
    btn.classList.remove('on');
    lbl.textContent = 'Musique OFF';
  } else {
    getCtx();
    startBgMusic();
    btn.classList.add('on');
    lbl.textContent = 'Musique ON';
  }
}

/* ────────────── RESET ────────────── */
function resetTirage() {
  if(!confirm('Réinitialiser toute la tombola ?')) return;
  numerosDisponibles = [...Array(N)].map((_,i)=>i+1);
  winCount = 0;
  document.getElementById('numero').textContent = '?';
  document.getElementById('liste').innerHTML = '';
  document.getElementById('btnTirage').disabled = false;
  isRunning = false;
  updateCounters();
}