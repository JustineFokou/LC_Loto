
// ÉLÉMENTS DOM
const configPanel = document.getElementById('configPanel');
const drawingPanel = document.getElementById('drawingPanel');
const numeroDisplay = document.getElementById('numero');
const segmentDisplay = document.getElementById('segment');
const winnersList = document.getElementById('winnersList');
const totalInput = document.getElementById('totalParticipants');
const heartbeatEffect = document.getElementById('heartbeatEffect');
const winnerCount = document.getElementById('winnerCount');

// VARIABLES DU JEU
let participants = [];
let winners = [];
let isSpinning = false;
let totalParticipants = 2500;
const EXCLUDED_MAX = 200;

// INITIALISATION DES EFFETS VISUELS
function initVisualEffects() {
    // Créer les étoiles flottantes
    const starContainer = document.getElementById('starBackground');
    for (let i = 0; i < 40; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${4 + Math.random() * 8}s`;
        star.style.width = `${20 + Math.random() * 30}px`;
        star.style.height = star.style.width;
        starContainer.appendChild(star);
    }
    
    // Créer les étoiles scintillantes
    const starField = document.getElementById('starField');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${2 + Math.random() * 4}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${1 + Math.random() * 4}s`;
        starField.appendChild(star);
    }
}

// Démarrer le battement de cœur
function startHeartbeat() {
    heartbeatEffect.style.display = 'block';
    const heartbeatSound = document.getElementById('heartbeatSound');
    heartbeatSound.currentTime = 0;
    heartbeatSound.volume = 0.5;
    heartbeatSound.play();
    
    // Accélérer progressivement
    setTimeout(() => { heartbeatSound.playbackRate = 1.2; }, 1000);
    setTimeout(() => { heartbeatSound.playbackRate = 1.4; }, 2000);
}

// Arrêter le battement de cœur
function stopHeartbeat() {
    heartbeatEffect.style.display = 'none';
    const heartbeatSound = document.getElementById('heartbeatSound');
    heartbeatSound.pause();
    heartbeatSound.currentTime = 0;
    heartbeatSound.playbackRate = 1.0;
}

// DÉMARRER LA TOMBOLA
function startTombola() {
    totalParticipants = parseInt(totalInput.value);
    if (totalParticipants <= EXCLUDED_MAX) {
        alert(`Le nombre doit être supérieur à ${EXCLUDED_MAX}`);
        return;
    }
    
    // Initialiser la liste des participants
    participants = [];
    for (let i = EXCLUDED_MAX + 1; i <= totalParticipants; i++) {
        participants.push(i);
    }
    
    winners = [];
    winnersList.innerHTML = '';
    winnerCount.textContent = '0';
    
    // Afficher le panneau de tirage
    configPanel.style.display = 'none';
    drawingPanel.style.display = 'block';
}

// FAIRE TOURNER LA ROUE
function spin() {
    if (isSpinning || participants.length === 0) return;
    
    isSpinning = true;
    const spinSound = document.getElementById('spinningSound');
    spinSound.volume = 0.3;
    spinSound.currentTime = 0;
    spinSound.play();
    
    // Démarrer le battement de cœur
    startHeartbeat();
    
    // Animation de rotation
    let counter = 0;
    const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * participants.length);
        numeroDisplay.textContent = participants[randomIndex];
        counter++;
        
        if (counter > 50) {
            clearInterval(interval);
            spinSound.pause();
            spinSound.currentTime = 0;
            stopHeartbeat();
            selectWinner();
        }
    }, 50);
}

// SÉLECTIONNER UN GAGNANT
function selectWinner() {
    if (participants.length === 0) return;
    
    // Sélection aléatoire
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winnerNumber = participants[winnerIndex];
    
    // Retirer le gagnant de la liste
    participants.splice(winnerIndex, 1);
    winners.push(winnerNumber);
    
    // Afficher le gagnant avec animation
    numeroDisplay.textContent = winnerNumber;
    numeroDisplay.classList.add('winner');
    
    // Déterminer le segment
    const segments = ['🎯 PREMIER TIER', '⭐ DEUXIÈME TIER', '🏆 TROISIÈME TIER', '👑 VIP FINAL'];
    const segmentIndex = Math.floor(Math.random() * segments.length);
    segmentDisplay.textContent = segments[segmentIndex];
    
    // Jouer les sons de victoire
    document.getElementById('winSound').play();
    setTimeout(() => {
        document.getElementById('crowdSound').play();
    }, 500);
    
    // Ajouter à la liste des gagnants
    const winnerItem = document.createElement('div');
    winnerItem.className = 'winner-item';
    winnerItem.innerHTML = `
        <div class="winner-icon">🏆</div>
        <div>
            <strong>GAGNANT #${winners.length}</strong><br>
            <span style="color: #FFD700; font-size: 1.5rem;">Numéro ${winnerNumber}</span><br>
            <small>${segments[segmentIndex]}</small>
        </div>
    `;
    winnersList.prepend(winnerItem);
    
    // Mettre à jour le compteur
    winnerCount.textContent = winners.length;
    
    // Effets visuels
    createConfetti();
    createFireworks();
    
    // Réactiver le bouton après un délai
    setTimeout(() => {
        numeroDisplay.classList.remove('winner');
        isSpinning = false;
    }, 2000);
}

// CRÉER DES CONFETTIS
function createConfetti() {
    const colors = ['#FFD700', '#FF3366', '#00FF88', '#00AAFF', '#FFFFFF'];
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${10 + Math.random() * 10}px`;
            confetti.style.height = confetti.style.width;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 10);
    }
}

// CRÉER DES FEUX D'ARTIFICE
function createFireworks() {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const centerX = Math.random() * window.innerWidth;
            const centerY = Math.random() * (window.innerHeight / 2);
            
            for (let j = 0; j < 30; j++) {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = `${centerX}px`;
                firework.style.top = `${centerY}px`;
                firework.style.backgroundColor = 
                    ['#FFD700', '#FF3366', '#00FF88'][Math.floor(Math.random() * 3)];
                
                const angle = (Math.PI * 2 * j) / 30;
                const distance = 80 + Math.random() * 120;
                firework.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                firework.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
                
                document.body.appendChild(firework);
                setTimeout(() => firework.remove(), 1500);
            }
        }, i * 300);
    }
}

// RÉINITIALISER
function resetAll() {
    stopHeartbeat();
    location.reload();
}

// EXPORTER LES RÉSULTATS
function exportResults() {
    if (winners.length === 0) {
        alert("Aucun gagnant à exporter pour le moment.");
        return;
    }
    
    let csvContent = "Position;Numéro;Date\n";
    winners.forEach((winner, index) => {
        csvContent += `${index + 1};${winner};${new Date().toLocaleDateString('fr-FR')}\n`;
    });
    
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gagnants_tombola_${new Date().getTime()}.csv`;
    a.click();
    
    // Feedback visuel
    const exportBtn = document.getElementById('exportBtn');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<span>✅ EXPORTÉ!</span>';
    exportBtn.style.background = "#4CAF50";
    setTimeout(() => {
        exportBtn.innerHTML = originalText;
        exportBtn.style.background = "";
    }, 2000);
}

// INITIALISER AU CHARGEMENT
window.addEventListener('DOMContentLoaded', () => {
    initVisualEffects();
    
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpinning && drawingPanel.style.display !== 'none') {
            spin();
        }
        if (e.code === 'Enter' && configPanel.style.display !== 'none') {
            startTombola();
        }
        if (e.code === 'Escape') {
            resetAll();
        }
    });
});
