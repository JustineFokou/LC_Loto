
/* =====================================================
   CONFIGURATION
===================================================== */
const EXCLUSION_MIN = 1;
const EXCLUSION_MAX = 200;
const SEGMENTS_COUNT = 4;

let N = 2500;
let tombolaActive = false;
let segmentIndex = 0;
let listeGagnants = [];

// Segments FIXES
let segments = [[], [], [], []];

/* =====================================================
   OUTILS (évite les crashs)
===================================================== */
function createFallingFlowers(count = 12) {
    const emojis = ['🌸','🌺','🌼','🌷','💐'];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'flower';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * 92 + 'vw';
        el.style.top = (-10 - Math.random() * 50) + 'px';
        el.style.fontSize = 16 + Math.floor(Math.random() * 30) + 'px';
        el.style.setProperty('--flower-duration', (2.6 + Math.random() * 2.4) + 's');
        el.addEventListener('animationend', () => el.remove());
        document.body.appendChild(el);
    }
}

function createFallingStars(count = 18) {
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'fall-star';
        const fromLeft = Math.random() > 0.5;
        if (fromLeft) {
            el.style.left = '-8px';
            el.style.top = (Math.random() * 70) + 'vh';
            el.style.setProperty('--dx', (30 + Math.floor(Math.random() * 90)) + 'px');
        } else {
            el.style.right = '-8px';
            el.style.top = (Math.random() * 70) + 'vh';
            el.style.setProperty('--dx', (-30 - Math.floor(Math.random() * 90)) + 'px');
        }
        el.style.animationDuration = (1.6 + Math.random() * 2.4) + 's';
        el.addEventListener('animationend', () => el.remove());
        document.body.appendChild(el);
    }
}

function showAlert(icon, message, type = 'info', autoClose = 0) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';

    const box = document.createElement('div');
    box.className = 'custom-alert ' + (type || 'info');
    box.innerHTML = `
        <div class="icon">${icon}</div>
        <div class="message">${message}</div>
        <div style="display:flex;justify-content:center;"><button class="btn-close">OK</button></div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const close = () => {
        box.classList.add('hide');
        overlay.style.animation = 'overlayFadeOut 0.2s ease forwards';
        setTimeout(() => overlay.remove(), 300);
    };

    box.querySelector('.btn-close').addEventListener('click', close);

    if (autoClose > 0) setTimeout(close, autoClose);
}

function showConfirm(icon, message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';

    const box = document.createElement('div');
    box.className = 'custom-confirm';
    box.innerHTML = `
        <div class="icon">${icon}</div>
        <div class="message">${message}</div>
        <div class="buttons">
            <button class="btn-yes">Oui</button>
            <button class="btn-no">Non</button>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const clean = (res) => {
        overlay.style.animation = 'overlayFadeOut 0.2s ease forwards';
        setTimeout(() => overlay.remove(), 300);
        callback(res);
    };

    box.querySelector('.btn-yes').addEventListener('click', () => clean(true));
    box.querySelector('.btn-no').addEventListener('click', () => clean(false));
}

/* =====================================================
   INITIALISATION DES SEGMENTS FIXES
===================================================== */
function initialiserSegments() {
    segments = [[], [], [], []];

    for (let i = EXCLUSION_MAX + 1; i <= N; i++) {
        if (i <= 700) segments[0].push(i);
        else if (i <= 1200) segments[1].push(i);
        else if (i <= 1700) segments[2].push(i);
        else segments[3].push(i);
    }
}

/* =====================================================
   DÉMARRAGE
===================================================== */
function demarrerTombola() {
    const input = document.getElementById("nombreNumeros");
    const nombre = parseInt(input.value);

    if (isNaN(nombre) || nombre <= EXCLUSION_MAX) {
        showAlert("❌", "Le nombre doit être supérieur à 200");
        return;
    }

    N = nombre;
    listeGagnants = [];
    segmentIndex = 0;

    initialiserSegments();
    tombolaActive = true;

    document.getElementById("configContainer").style.display = "none";
    document.getElementById("numeroContainer").classList.add("active");
    document.getElementById("buttonsContainer").style.display = "flex";
    document.getElementById("historiqueContainer").classList.add("active");

    showAlert(
        "✅",
        // `Tombola prête !\nParticipants valides : ${N - EXCLUSION_MAX}\n(201 → ${N})`
        `Etes vous prêtes ! Ok Commençons 🌸✨🌸✨🌸✨🌸✨`

    );
}

/* =====================================================
   LANCER LE TIRAGE (ANIMATION)
===================================================== */
function lancerTirage() {
    if (!tombolaActive) {
        showAlert("❌", "Veuillez d’abord configurer le tirage");
        return;
    }

    const sonCoeur = document.getElementById("sonCoeur");
    const numeroEl = document.getElementById("numero");

    sonCoeur.currentTime = 0;
    sonCoeur.playbackRate = 1;
    sonCoeur.play();
    numeroEl.classList.remove("winner");

    let compteur = 0;

    const animation = setInterval(() => {
        const s = segments.flat();
        if (!s.length) {
            clearInterval(animation);
            showAlert("🎉", "Tous les numéros ont été tirés");
            return;
        }

        numeroEl.innerText = s[Math.floor(Math.random() * s.length)];
        compteur++;

        if (compteur > 50) {
            clearInterval(animation);
            sonCoeur.pause();
            tirageFinal();
        }
    }, 70);
}

/* =====================================================
   TIRAGE FINAL (SEGMENTS FIXES)
===================================================== */
function tirageFinal() {
    let essais = 0;

    while (segments[segmentIndex].length === 0 && essais < SEGMENTS_COUNT) {
        segmentIndex = (segmentIndex + 1) % SEGMENTS_COUNT;
        essais++;
    }

    if (essais === SEGMENTS_COUNT) {
        showAlert("🎉", "Tous les numéros ont été tirés");
        return;
    }

    const segment = segments[segmentIndex];
    const index = Math.floor(Math.random() * segment.length);
    const numero = segment.splice(index, 1)[0];

    listeGagnants.push(numero);

    const numeroEl = document.getElementById("numero");
    numeroEl.innerText = numero;
    numeroEl.classList.add("winner");

    document.getElementById("sonVictoire").play();

    // AJOUT VISUEL DU GAGNANT (GARANTI)
    const li = document.createElement("li");
    li.textContent = `🎉 ${numero}`;
    document.getElementById("listeGagnants").prepend(li);

    segmentIndex = (segmentIndex + 1) % SEGMENTS_COUNT;
}

/* =====================================================
   RÉINITIALISER
===================================================== */
function reinitialiser() {
    showConfirm("⚠️", "Voulez-vous vraiment réinitialiser ?", ok => {
        if (ok) location.reload();
    });
}

/* =====================================================
   EXPORT CSV
===================================================== */
function exportExcel() {
    if (!listeGagnants.length) {
        showAlert("❌", "Aucun gagnant à exporter");
        return;
    }

    let csv = "Numero,Ordre\n";
    listeGagnants.forEach((n, i) => {
        csv += `${n},${i + 1}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Life_Changers_Awards_Gagnants.csv";
    a.click();
}


// Génération des particules dorées (étoiles)
    const goldenParticlesContainer = document.getElementById('goldenParticles');
    const starsContainer = document.getElementById('stars');

    function createGoldenParticles(num) {
        for (let i = 0; i < num; i++) {
            const particle = document.createElement('div');
            particle.className = 'golden-particle';
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.top = Math.random() * 100 + 'vh';
            particle.style.animationDuration = (3 + Math.random() * 5) + 's';
            goldenParticlesContainer.appendChild(particle);
        }
    }

    function createStars(num) {
        for (let i = 0; i < num; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + 'vw';
            star.style.top = Math.random() * 100 + 'vh';
            star.style.width = star.style.height = (2 + Math.random() * 3) + 'px';
            star.style.animationDuration = (2 + Math.random() * 3) + 's';
            starsContainer.appendChild(star);
        }
    }

    createGoldenParticles(100); // nombre d'étoiles dorées flottantes
    createStars(80);             // nombre d'étoiles scintillantes

    // Génération des fleurs qui tombent
    const flowersContainer = document.getElementById('flowersContainer');
    const flowerEmojis = ['🌸','🌺','🌼','🌻','💮'];

    function createFallingFlower() {
        const flower = document.createElement('div');
        flower.className = 'flower';
        flower.style.left = Math.random() * 100 + 'vw';
        flower.style.fontSize = (20 + Math.random() * 20) + 'px';
        flower.textContent = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
        flowersContainer.appendChild(flower);

        const duration = 4 + Math.random() * 4;
        flower.style.animationDuration = duration + 's';
        
        // Supprimer la fleur après qu'elle tombe
        setTimeout(() => flower.remove(), duration * 1000);
    }

    // Générer continuellement les fleurs
    setInterval(createFallingFlower, 300); // toutes les 0.3s