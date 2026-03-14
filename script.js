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
   MUSIQUE DE FOND — Ambiance Awards épique
   Basse profonde + nappes orchestrales + pad mystérieux
   ════════════════════════════════════════ */
function startBgMusic() {
  if (bgMusicPlaying) return;
  bgMusicPlaying = true;
  const ctx = getCtx();

  /* ── Masterbus compressor ── */
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -18;
  master.knee.value = 10;
  master.ratio.value = 4;
  master.attack.value = 0.003;
  master.release.value = 0.25;
  master.connect(ctx.destination);

  /* ── Reverb convolution simulée via delay+feedback ── */
  function makeReverb(dryGain=0.6, wetGain=0.4, delayTime=0.08, feedback=0.55) {
    const dry = ctx.createGain(); dry.gain.value = dryGain;
    const wet = ctx.createGain(); wet.gain.value = wetGain;
    const delay = ctx.createDelay(2); delay.delayTime.value = delayTime;
    const fb = ctx.createGain(); fb.gain.value = feedback;
    delay.connect(fb); fb.connect(delay);
    const send = ctx.createGain();
    send.connect(dry); send.connect(delay); delay.connect(wet);
    return { input: send, dry, wet };
  }
  const verb = makeReverb(0.5, 0.5, 0.12, 0.5);
  verb.dry.connect(master);
  verb.wet.connect(master);

  /* ── Notes de la gamme mineure (Am) ── */
  const ROOT = 110; /* La2 */
  const scale = [1, 9/8, 6/5, 4/3, 3/2, 8/5, 9/5]; /* Am naturelle */

  /* ── Basse profonde pulsante ── */
  function playBassNote(freq, startTime, dur) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 280; filter.Q.value = 2;
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(0.28, startTime + 0.05);
    g.gain.setValueAtTime(0.22, startTime + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.connect(filter); filter.connect(g); g.connect(verb.input);
    osc.start(startTime); osc.stop(startTime + dur + 0.1);

    /* Sub octave */
    const sub = ctx.createOscillator();
    const gSub = ctx.createGain();
    const fSub = ctx.createBiquadFilter();
    fSub.type = 'lowpass'; fSub.frequency.value = 160;
    sub.type = 'sine'; sub.frequency.value = freq * 0.5;
    gSub.gain.setValueAtTime(0, startTime);
    gSub.gain.linearRampToValueAtTime(0.18, startTime + 0.08);
    gSub.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    sub.connect(fSub); fSub.connect(gSub); gSub.connect(master);
    sub.start(startTime); sub.stop(startTime + dur + 0.1);
    return [osc, sub];
  }

  /* ── Nappe (pad) orchestrale ── */
  function playPad(freq, startTime, dur, vol=0.12) {
    const oscs = [1, 1.005, 0.5, 2].map(detune => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 0.8;
      o.type = detune === 0.5 ? 'sine' : 'triangle';
      o.frequency.value = freq * detune;
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(vol * (detune===2?0.4:detune===0.5?0.6:1), startTime + 0.4);
      g.gain.setValueAtTime(vol * 0.85, startTime + dur - 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
      o.connect(f); f.connect(g); g.connect(verb.input);
      o.start(startTime); o.stop(startTime + dur + 0.2);
      return o;
    });
    return oscs;
  }

  /* ── Percussion grave (kick synthétique) ── */
  function playKick(startTime, vol=0.5) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.12);
    g.gain.setValueAtTime(vol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
    osc.connect(g); g.connect(master);
    osc.start(startTime); osc.stop(startTime + 0.3);

    /* Snap du click */
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length,3);
    const src = ctx.createBufferSource();
    const gn = ctx.createGain(); gn.gain.value = 0.15;
    src.buffer = buf; src.connect(gn); gn.connect(master);
    src.start(startTime);
  }

  /* ── Hi-hat synthétique ── */
  function playHat(startTime, vol=0.06) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length,2);
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=8000;
    const g = ctx.createGain(); g.gain.value = vol;
    src.buffer=buf; src.connect(f); f.connect(g); g.connect(master);
    src.start(startTime);
  }

  /* ── Mélodie mystérieuse (harpe synthétique) ── */
  function playArp(freq, startTime, dur) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq*2; f.Q.value=3;
    osc.type = 'sine'; osc.frequency.value = freq * 2;
    g.gain.setValueAtTime(0.12, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.connect(f); f.connect(g); g.connect(verb.input);
    osc.start(startTime); osc.stop(startTime + dur + 0.1);
  }

  /* ════════════════════════════════
     SÉQUENCEUR EN BOUCLE (8 mesures)
     BPM ≈ 72  → beat = 0.833s
  ════════════════════════════════ */
  const BPM = 72;
  const beat = 60 / BPM;
  const bar = beat * 4;

  const bassPattern = [
    { deg:0, beats:4 }, { deg:6, beats:4 },
    { deg:5, beats:4 }, { deg:3, beats:4 },
    { deg:0, beats:4 }, { deg:6, beats:4 },
    { deg:4, beats:2 }, { deg:5, beats:2 }, { deg:3, beats:4 }
  ];

  const arpPattern = [
    [0,2,4,7], [6,8,11,13], [5,7,9,12], [3,5,7,10]
  ];

  const padChords = [
    [0,4,7], [6,10,13], [5,9,12], [3,7,10]
  ];

  function scheduleLoop(startOffset) {
    let bt = ctx.currentTime + startOffset;
    const totalBars = 8;

    /* Basse */
    let bassTime = bt;
    let barIdx = 0;
    bassPattern.forEach(({deg, beats}) => {
      const freq = ROOT * scale[deg % scale.length] * Math.pow(2, Math.floor(deg/scale.length));
      playBassNote(freq, bassTime, beats * beat * 0.92);
      bassTime += beats * beat;
      if(barIdx < totalBars * 4) barIdx++;
    });

    /* Kick sur les temps forts */
    for(let b=0; b<totalBars*4; b++) {
      if(b % 4 === 0 || b % 4 === 2) {
        playKick(bt + b*beat, b%4===0 ? 0.55 : 0.38);
      }
      if(b % 2 === 1) {
        playHat(bt + b*beat + beat*0.5, 0.05);
        playHat(bt + b*beat, 0.04);
      }
    }

    /* Pads par mesures de 2 bars */
    padChords.forEach((chord, ci) => {
      const chordStart = bt + ci*2*bar;
      chord.forEach(deg => {
        const freq = ROOT * scale[deg % scale.length] * Math.pow(2, Math.floor(deg/scale.length));
        playPad(freq * 2, chordStart, 2*bar*0.95, 0.10);
      });
    });

    /* Arpège mélodique */
    arpPattern.forEach((notes, pi) => {
      notes.forEach((deg, ni) => {
        const freq = ROOT * scale[deg % scale.length] * Math.pow(2, Math.floor(deg/scale.length));
        const t = bt + pi*bar + ni*(bar/notes.length);
        playArp(freq, t, bar/notes.length * 0.8);
      });
    });

    /* Reprogramme la prochaine boucle */
    const loopDur = totalBars * bar;
    const id = setTimeout(() => scheduleLoop(0), (loopDur - 0.3) * 1000);
    bgMusicNodes.push(id);
  }

  scheduleLoop(0.5);
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