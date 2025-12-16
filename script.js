let N = 2500;
        let listePlaces = [];
        let listeGagnants = [];
        let interval = null;
        let tombolaActive = false;

        // Créer les particules d'or
        function createGoldenParticles() {
            const container = document.getElementById('goldenParticles');
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'golden-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 8 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 6) + 's';
                container.appendChild(particle);
            }
        }

        // Créer les étoiles
        function createStars() {
            const container = document.getElementById('stars');
            for (let i = 0; i < 50; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                container.appendChild(star);
            }
        }

        createGoldenParticles();
        createStars();

        // Fonction pour afficher une alerte personnalisée
        function showAlert(icon, message) {
            const overlay = document.createElement('div');
            overlay.className = 'alert-overlay';
            
            const alert = document.createElement('div');
            alert.className = 'custom-alert';
            alert.innerHTML = `
                <div class="icon">${icon}</div>
                <div class="message">${message}</div>
                <button class="btn-close" onclick="closeAlert(this)">OK</button>
            `;
            
            document.body.appendChild(overlay);
            document.body.appendChild(alert);
            
            setTimeout(() => {
                overlay.addEventListener('click', () => closeAlert(alert.querySelector('.btn-close')));
            }, 100);
        }

        // Fonction pour fermer l'alerte
        function closeAlert(btn) {
            const alert = btn.closest('.custom-alert');
            const overlay = document.querySelector('.alert-overlay');
            
            alert.classList.add('hide');
            overlay.classList.add('hide');
            
            setTimeout(() => {
                if (alert.parentNode) document.body.removeChild(alert);
                if (overlay.parentNode) document.body.removeChild(overlay);
            }, 300);
        }

        // Fonction pour afficher une confirmation personnalisée
        function showConfirm(icon, message, onConfirm) {
            const overlay = document.createElement('div');
            overlay.className = 'alert-overlay';
            
            const confirm = document.createElement('div');
            confirm.className = 'custom-confirm';
            confirm.innerHTML = `
                <div class="icon">${icon}</div>
                <div class="message">${message}</div>
                <div class="buttons">
                    <button class="btn-yes">✅ OUI</button>
                    <button class="btn-no">❌ NON</button>
                </div>
            `;
            
            document.body.appendChild(overlay);
            document.body.appendChild(confirm);
            
            const btnYes = confirm.querySelector('.btn-yes');
            const btnNo = confirm.querySelector('.btn-no');
            
            btnYes.onclick = () => {
                closeConfirm(confirm, overlay);
                onConfirm(true);
            };
            
            btnNo.onclick = () => {
                closeConfirm(confirm, overlay);
                onConfirm(false);
            };
            
            overlay.onclick = () => {
                closeConfirm(confirm, overlay);
                onConfirm(false);
            };
        }

        // Fonction pour fermer la confirmation
        function closeConfirm(confirm, overlay) {
            confirm.classList.add('hide');
            overlay.classList.add('hide');
            
            setTimeout(() => {
                if (confirm.parentNode) document.body.removeChild(confirm);
                if (overlay.parentNode) document.body.removeChild(overlay);
            }, 300);
        }

        // Démarrer la tombola
        function demarrerTombola() {
            const input = document.getElementById('nombreNumeros');
            const nombre = parseInt(input.value);

            if (isNaN(nombre) || nombre < 1) {
                showAlert('❌', 'Veuillez entrer un nombre valide (minimum 1)');
                return;
            }

            if (nombre > 10000) {
                showAlert('❌', 'Le nombre maximum est 10 000');
                return;
            }

            N = nombre;
            listePlaces = [];
            listeGagnants = [];

            for (let i = 1; i <= N; i++) {
                listePlaces.push(i);
            }

            tombolaActive = true;

            // Cacher la config et afficher le tirage
            document.getElementById('configContainer').style.display = 'none';
            document.getElementById('numeroContainer').classList.add('active');
            document.getElementById('buttonsContainer').style.display = 'flex';
            document.getElementById('historiqueContainer').classList.add('active');

            showAlert('✅', `Tirage au sort configuré avec ${N} participants !<br>Vous pouvez maintenant lancer les tirages.`);
        }

        // Faire tomber des fleurs
        function createFlowers() {
            const flowers = ['🌸', '🌺', '🌼', '🌻', '🌷', '🌹', '💐', '🏵️', '⭐', '✨'];
            
            for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                    const flower = document.createElement('div');
                    flower.className = 'flower';
                    flower.innerText = flowers[Math.floor(Math.random() * flowers.length)];
                    flower.style.left = Math.random() * 100 + '%';
                    flower.style.animationDuration = (Math.random() * 3 + 3) + 's';
                    document.body.appendChild(flower);
                    
                    setTimeout(() => {
                        if (flower.parentNode) {
                            document.body.removeChild(flower);
                        }
                    }, 4000);
                }, i * 80);
            }
        }

        // Lancer le tirage
        function lancerTirage() {
            if (!tombolaActive) {
                showAlert('❌', 'Veuillez d\'abord configurer le tirage au sort !');
                return;
            }

            if (listePlaces.length === 0) {
                showAlert('🎊', 'Plus de participants disponibles !<br>Tous les tirages ont été effectués.');
                return;
            }

            // Démarrer le son de cœur qui bat
            const sonCoeur = document.getElementById("sonCoeur");
            sonCoeur.currentTime = 0;
            sonCoeur.volume = 0.7;
            sonCoeur.play();

            // Démarrer le son de suspense
            const son = document.getElementById("son");
            son.currentTime = 0;
            son.volume = 0.5;
            son.play();

            const numeroEl = document.getElementById("numero");
            numeroEl.classList.remove("winner");

            let compteur = 0;
            interval = setInterval(() => {
                const temp = listePlaces[Math.floor(Math.random() * listePlaces.length)];
                numeroEl.innerText = temp;
                compteur++;

                if (compteur > 50) {
                    clearInterval(interval);
                    
                    // Arrêter le son de cœur
                    sonCoeur.pause();
                    sonCoeur.currentTime = 0;
                    
                    tirageFinal();
                }
            }, 70);
        }

        // Tirage final
        function tirageFinal() {
            const index = Math.floor(Math.random() * listePlaces.length);
            const numero = listePlaces[index];

            listePlaces.splice(index, 1);
            listeGagnants.push(numero);

            const numeroEl = document.getElementById("numero");
            numeroEl.innerText = numero;
            numeroEl.classList.add("winner");

            // Son de victoire
            const sonVictoire = document.getElementById("sonVictoire");
            sonVictoire.currentTime = 0;
            sonVictoire.play();

            // Faire tomber les fleurs
            createFlowers();

            // Ajouter à l'historique
            const li = document.createElement("li");
            li.innerText = `🎉 ${numero}`;
            document.getElementById("listeGagnants").prepend(li);

            // Créer des confettis
            createConfetti();
        }

        // Confettis
        function createConfetti() {
            for (let i = 0; i < 60; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.style.position = 'fixed';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.top = '-10px';
                    confetti.style.width = '12px';
                    confetti.style.height = '12px';
                    confetti.style.background = ['#ffd700', '#00ff00', '#ffffff'][Math.floor(Math.random() * 3)];
                    confetti.style.pointerEvents = 'none';
                    confetti.style.zIndex = '9999';
                    confetti.style.animation = 'fallDown 3s linear forwards';
                    confetti.style.borderRadius = '50%';
                    confetti.style.boxShadow = '0 0 10px currentColor';
                    
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => {
                        if (confetti.parentNode) {
                            document.body.removeChild(confetti);
                        }
                    }, 3000);
                }, i * 40);
            }
        }

        // Réinitialiser
        function reinitialiser() {
            showConfirm('⚠️', 'Voulez-vous vraiment réinitialiser le tirage au sort ?<br>Tous les gagnants seront perdus.', (confirmed) => {
                if (confirmed) {
                    tombolaActive = false;
                    listePlaces = [];
                    listeGagnants = [];
                    
                    document.getElementById('configContainer').style.display = 'block';
                    document.getElementById('numeroContainer').classList.remove('active');
                    document.getElementById('buttonsContainer').style.display = 'none';
                    document.getElementById('historiqueContainer').classList.remove('active');
                    document.getElementById("numero").innerText = "---";
                    document.getElementById("numero").classList.remove("winner");
                    document.getElementById("listeGagnants").innerHTML = "";
                    
                    showAlert('✅', 'Tirage au sort réinitialisé avec succès !');
                }
            });
        }

        // Export Excel
        function exportExcel() {
            if (listeGagnants.length === 0) {
                showAlert('❌', 'Aucun gagnant à exporter !<br>Lancez au moins un tirage avant d\'exporter.');
                return;
            }

            let csv = "Numéro Gagnant,Ordre de Tirage\n";
            listeGagnants.forEach((n, index) => {
                csv += `${n},${index + 1}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "Life_Changers_Awards_Gagnants.csv";
            a.click();

            URL.revokeObjectURL(url);
            showAlert('✅', `Export réussi !<br>${listeGagnants.length} gagnant(s) exporté(s).`);
        }