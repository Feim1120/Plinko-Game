const betInput = document.getElementById('bet-input');
const halveBet = document.getElementById('halve-bet');
const doubleBet = document.getElementById('double-bet');
const riskSelect = document.getElementById('risk-select');
const rowsSelect = document.getElementById('rows-select');
const dropBall = document.getElementById('drop-ball');
const autoBetInput = document.getElementById('auto-bet-input');
const autoHalveBet = document.getElementById('auto-halve-bet');
const autoDoubleBet = document.getElementById('auto-double-bet');
const autoRiskSelect = document.getElementById('auto-risk-select');
const autoRowsSelect = document.getElementById('auto-rows-select');
const autoBallCount = document.getElementById('auto-ball-count');
const startAuto = document.getElementById('start-auto');
const stopAuto = document.getElementById('stop-auto');
const plinkoBoard = document.getElementById('plinko-board');
const multipliersDiv = document.getElementById('multipliers');
const resultDiv = document.getElementById('result');
const balanceSpan = document.getElementById('balance');
const balanceDisplay = document.getElementById('balance-display');
const dropSound = document.getElementById('dropSound');
const pingSound = document.getElementById('pingSound');

// Guthaben initialisieren
let balance = 1000.00; // Immer 1000€ beim Start
localStorage.setItem('plinkoBalance', balance); // Setze den Wert im localStorage
balanceSpan.textContent = `${balance.toFixed(2)}€`;
updateBalanceDisplay();

function updateBalanceDisplay() {
    balanceDisplay.textContent = `Guthaben: ${balance.toFixed(2)}€`;
}

// Multiplikatoren basierend auf Risiko und Reihen (14 Reihen: 16 Multiplikatoren)
const multipliers = {
    8: {
        low: [5, 3, 2, 1, 0.5, 1, 2, 3],
        medium: [10, 5, 3, 1.5, 1, 0.5, 1, 3],
        high: [50, 10, 5, 3, 1, 0.5, 1, 5]
    },
    12: {
        low: [5, 3, 2, 1.5, 1, 0.7, 0.5, 0.7, 1, 1.5, 2, 3],
        medium: [10, 5, 3, 1.5, 1, 0.7, 0.3, 0.7, 1, 1.5, 3, 5],
        high: [41, 10, 5, 3, 1.5, 1, 0.3, 0.5, 1, 1.5, 3, 10]
    },
    14: {
        low: [10, 5, 3, 2, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 2, 3, 5, 10, 10],
        medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.5, 1, 1.5, 3, 5, 10, 41, 110], // 16 Multiplikatoren
        high: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
    }
};

// Tabs wechseln
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelector(`.tab[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab).style.display = 'flex';
}

// Pins und Spielfeld erstellen mit 14 Reihen (3 bis 16 Pins)
function createPlinkoBoard(rows) {
    const existingBalls = document.querySelectorAll('.ball');
    plinkoBoard.innerHTML = '';
    existingBalls.forEach(ball => plinkoBoard.appendChild(ball));

    const pinSpacing = 45;
    const startX = plinkoBoard.clientWidth / 2;
    const startY = plinkoBoard.clientHeight - (rows * pinSpacing * 0.8) - 50; // Pins näher an die Multiplikatoren

    for (let row = 0; row < rows; row++) {
        const pinsInRow = 3 + row; // Startet mit 3 Pins, erhöht sich um 1 pro Reihe (3, 4, ..., 16)
        for (let col = 0; col < pinsInRow; col++) {
            const pin = document.createElement('div');
            pin.className = 'pin';
            const x = startX + (col - (pinsInRow - 1) / 2) * pinSpacing;
            const y = startY + row * pinSpacing * 0.8;
            pin.style.left = `${x}px`;
            pin.style.top = `${y}px`;
            pin.dataset.x = x; // Für Kollisionsdetektion
            pin.dataset.y = y;
            plinkoBoard.appendChild(pin);
        }
    }

    // Multiplikatoren direkt unter den Pins der untersten Reihe platzieren
    alignMultipliers(rows);
}

// Multiplikatoren anzeigen und ausrichten
function alignMultipliers(rows) {
    multipliersDiv.innerHTML = '';
    const risk = riskSelect.value;
    const mults = multipliers[rows][risk];
    const pinSpacing = 45;
    const startX = plinkoBoard.clientWidth / 2;
    const pinsInBottomRow = 3 + (rows - 1); // 16 Pins in der untersten Reihe

    // Berechne die Positionen der Pins in der untersten Reihe
    const bottomRowY = plinkoBoard.clientHeight - (rows * 45 * 0.8) - 50 + (rows - 1) * 45 * 0.8;
    const bottomRowPositions = [];
    for (let col = 0; col < pinsInBottomRow; col++) {
        const x = startX + (col - (pinsInBottomRow - 1) / 2) * pinSpacing;
        bottomRowPositions.push(x);
    }

    // Erstelle Multiplikatoren und platziere sie direkt unter den Pins
    for (let i = 0; i < mults.length; i++) {
        const multiplier = document.createElement('div');
        multiplier.className = 'multiplier';
        multiplier.textContent = `${mults[i]}x`;
        if (mults[i] >= 10) multiplier.classList.add('red');
        else if (mults[i] >= 5) multiplier.classList.add('orange');
        else multiplier.classList.add('yellow');

        // Positioniere den Multiplikator direkt unter dem entsprechenden Pin
        const pinIndex = Math.floor((i / mults.length) * pinsInBottomRow);
        const xPosition = bottomRowPositions[pinIndex] || bottomRowPositions[bottomRowPositions.length - 1];
        multiplier.style.position = 'absolute';
        multiplier.style.left = `${xPosition - 15}px`; // Zentrieren (min-width: 30px)
        multiplier.style.top = '10px'; // Etwas Abstand vom untersten Pin
        multipliersDiv.appendChild(multiplier);
    }
}

// Funktion zur Kollisionsdetektion zwischen Ball und Pins
function checkCollision(ballX, ballY, pinX, pinY) {
    const distance = Math.sqrt((ballX - pinX) ** 2 + (ballY - pinY) ** 2);
    return distance < 15; // Kollisionsradius (Ball: 12px, Pin: 8px)
}

// Kugel fallen lassen mit geschmeidigem Bouncen
function dropBallAnimation(bet, risk, rows) {
    if (isNaN(bet) || bet <= 0 || bet > balance) {
        alert('Ungültiger Wetteinsatz! (Max: ' + balance.toFixed(2) + '€)');
        return false;
    }

    balance -= bet;
    balanceSpan.textContent = `${balance.toFixed(2)}€`;
    updateBalanceDisplay();
    localStorage.setItem('plinkoBalance', balance);

    const pinSpacing = 45;
    const startX = plinkoBoard.clientWidth / 2;
    const startY = plinkoBoard.clientHeight - (rows * pinSpacing * 0.8) - 50; // Start bei der obersten Pin-Reihe
    const pinsInTopRow = 3; // Oberste Reihe hat 3 Pins
    const topRowPositions = [];
    for (let col = 0; col < pinsInTopRow; col++) {
        const x = startX + (col - (pinsInTopRow - 1) / 2) * pinSpacing;
        topRowPositions.push(x);
    }

    const ball = document.createElement('div');
    ball.className = 'ball';
    const startIndex = Math.floor(Math.random() * topRowPositions.length); // Zufälliger Start über einem der oberen Pins
    const ballStartX = topRowPositions[startIndex];
    ball.style.left = `${ballStartX}px`;
    ball.style.top = `${startY - 20}px`; // Etwas über der obersten Pin-Reihe
    plinkoBoard.appendChild(ball);
    ball.style.display = 'block';

    let currentX = ballStartX;
    let currentY = startY - 20;
    let velocityX = 0; // Geschwindigkeit in X-Richtung für realistisches Abprallen
    let velocityY = 0; // Geschwindigkeit in Y-Richtung, startet bei 0
    const gravity = 0.1; // Gravitationskraft für realistisches Fallen
    const bounceDamping = 0.6; // Dämpfung bei Kollisionen (verringert die Geschwindigkeit nach jedem Bounce)
    const friction = 0.98; // Reibung, um die horizontale Bewegung zu dämpfen
    let lastTime = null;
    let lastCollisionPin = null; // Verhindert mehrfache Kollisionen mit demselben Pin

    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = (timestamp - lastTime) / 16; // Normalisiere auf 60fps
        lastTime = timestamp;

        // Gravitation anwenden
        velocityY += gravity * deltaTime;

        // Vertikale Bewegung (kontinuierliches Fallen mit Gravitation)
        currentY += velocityY * deltaTime;

        // Horizontale Bewegung mit Reibung
        velocityX *= friction;
        currentX += velocityX * deltaTime;

        // Kollisionsdetektion mit Pins
        const pins = document.querySelectorAll('.pin');
        let collided = false;
        pins.forEach(pin => {
            const pinX = parseFloat(pin.dataset.x);
            const pinY = parseFloat(pin.dataset.y);
            if (checkCollision(currentX, currentY, pinX, pinY) && pin !== lastCollisionPin) {
                // Kollision: Ändere die Richtung basierend auf der Position des Balls relativ zum Pin
                const relativeX = currentX - pinX;
                velocityX += relativeX > 0 ? 1.0 : -1.0; // Etwas stärkeres Abprallen für mehr Varianz
                velocityY = -velocityY * bounceDamping; // Vertikales Bouncen mit Dämpfung
                collided = true;
                lastCollisionPin = pin;

                // Ping-Sound bei Kontakt mit Pins
                pingSound.currentTime = 0;
                pingSound.play().catch(error => console.log("Sound-Fehler (Ping):", error));
            }
        });

        // Zufällige Richtungsänderung für mehr Varianz (häufiger und stärker)
        if (!collided && Math.random() < 0.15) { // 15% Chance pro Frame
            velocityX += (Math.random() - 0.5) * 0.5; // Stärkere Zufälligkeit für spontanere Verteilung
            lastCollisionPin = null; // Erlaube neue Kollisionen
        }

        // Zentrierungskraft: Ziehe den Ball sanft zur Mitte, stärker an den Rändern
        const centerX = plinkoBoard.clientWidth / 2;
        const distanceFromCenter = currentX - centerX;
        const centerForce = Math.abs(distanceFromCenter) > plinkoBoard.clientWidth * 0.3 ? 0.001 : 0.0003;
        velocityX -= distanceFromCenter * centerForce; // Stärkere Kraft an den Rändern

        // Begrenze die Geschwindigkeit in X-Richtung
        velocityX = Math.max(Math.min(velocityX, 2.5), -2.5);

        // Begrenze den Ball innerhalb eines zentraleren Bereichs (20% vom Rand entfernt)
        const margin = plinkoBoard.clientWidth * 0.2; // 20% des Spielfelds als Rand
        const minX = margin;
        const maxX = plinkoBoard.clientWidth - margin;
        if (currentX <= minX) {
            currentX = minX;
            velocityX = -velocityX * 0.5; // Umkehren und Geschwindigkeit reduzieren
        } else if (currentX >= maxX) {
            currentX = maxX;
            velocityX = -velocityX * 0.5; // Umkehren und Geschwindigkeit reduzieren
        }

        ball.style.left = `${currentX}px`;
        ball.style.top = `${currentY}px`;

        // Prüfe, ob der Ball die Multiplikatoren erreicht hat
        const bottomRowY = plinkoBoard.clientHeight - (rows * 45 * 0.8) - 50 + (rows - 1) * 45 * 0.8;
        if (currentY >= bottomRowY + 20) { // Etwas unterhalb der untersten Pins
            const multiplierIndex = Math.floor((currentX / plinkoBoard.clientWidth) * multipliers[rows][risk].length);
            const mults = multipliers[rows][risk];
            const adjustedIndex = Math.max(0, Math.min(multiplierIndex, mults.length - 1));
            const multiplier = mults[adjustedIndex];
            const win = bet * multiplier;
            balance += win;
            balanceSpan.textContent = `${balance.toFixed(2)}€`;
            updateBalanceDisplay();
            localStorage.setItem('plinkoBalance', balance);

            // Multiplikator hervorheben und Bounce-Animation
            const multiplierElement = multipliersDiv.children[adjustedIndex];
            multiplierElement.classList.add('highlight');
            multiplierElement.classList.add('bounce');
            setTimeout(() => multiplierElement.classList.remove('highlight'), 500);

            // Drop-Sound abspielen, wenn der Ball die Multiplikatoren trifft
            dropSound.currentTime = 0;
            dropSound.play().catch(error => console.log("Sound-Fehler (Drop):", error));

            resultDiv.textContent = `Gewinn: ${win.toFixed(2)}€ (Multiplikator: ${multiplier}x)`;
            resultDiv.style.display = 'block';
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 2000);
            ball.style.display = 'none';
        } else {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
    return true;
}

// Automatische Wetten
let autoRunning = false;
let autoInterval = null;

function startAutoBalls() {
    const bet = parseFloat(autoBetInput.value);
    const risk = autoRiskSelect.value;
    const rows = parseInt(autoRowsSelect.value);
    const ballCount = parseInt(autoBallCount.value);

    if (isNaN(bet) || bet <= 0 || bet * ballCount > balance) {
        alert('Ungültiger Wetteinsatz oder nicht genug Guthaben! (Max: ' + balance.toFixed(2) + '€)');
        return;
    }

    autoRunning = true;
    startAuto.style.display = 'none';
    stopAuto.style.display = 'block';

    let ballsDropped = 0;

    autoInterval = setInterval(() => {
        if (!autoRunning || ballsDropped >= ballCount) {
            clearInterval(autoInterval);
            autoRunning = false;
            startAuto.style.display = 'block';
            stopAuto.style.display = 'none';
            return;
        }

        dropBallAnimation(bet, risk, rows);
        ballsDropped++;
    }, 500);
}

function stopAutoBalls() {
    autoRunning = false;
}

// Event Listener
// Manuell
halveBet.addEventListener('click', () => {
    let bet = parseFloat(betInput.value);
    bet = Math.max(0.01, bet / 2);
    betInput.value = bet.toFixed(2);
});

doubleBet.addEventListener('click', () => {
    let bet = parseFloat(betInput.value);
    bet = Math.min(balance, bet * 2);
    betInput.value = bet.toFixed(2);
});

rowsSelect.addEventListener('change', () => {
    createPlinkoBoard(parseInt(rowsSelect.value));
});

riskSelect.addEventListener('change', () => {
    createPlinkoBoard(parseInt(rowsSelect.value));
});

dropBall.addEventListener('click', () => {
    const bet = parseFloat(betInput.value);
    const risk = riskSelect.value;
    const rows = parseInt(rowsSelect.value);
    dropBallAnimation(bet, risk, rows);
});

// Automatisch
autoHalveBet.addEventListener('click', () => {
    let bet = parseFloat(autoBetInput.value);
    bet = Math.max(0.01, bet / 2);
    autoBetInput.value = bet.toFixed(2);
});

autoDoubleBet.addEventListener('click', () => {
    let bet = parseFloat(autoBetInput.value);
    bet = Math.min(balance, bet * 2);
    autoBetInput.value = bet.toFixed(2);
});

autoRowsSelect.addEventListener('change', () => {
    createPlinkoBoard(parseInt(autoRowsSelect.value));
});

autoRiskSelect.addEventListener('change', () => {
    createPlinkoBoard(parseInt(autoRowsSelect.value));
});

startAuto.addEventListener('click', startAutoBalls);
stopAuto.addEventListener('click', stopAutoBalls);

// Initiales Setup
createPlinkoBoard(14);