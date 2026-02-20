let countdown;
let lastAction = null;
let gameActive = JSON.parse(localStorage.getItem('jetLag_gameActive')) || false;
let exhaustedQuestions = JSON.parse(localStorage.getItem('jetLag_exhausted')) || [];

function startGame() {
    if (confirm("Készen állsz az indulásra? A kérdések el fognak fogyni a játék során!")) {
        gameActive = true;
        exhaustedQuestions = [];
        saveState();
        updateUI();
        addLogEntry(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), "--- JÁTÉK ELKEZDŐDÖTT ---");
    }
}

function endGame() {
    if (confirm("Biztosan befejezed a játékot? Minden kérdés újra elérhető lesz.")) {
        gameActive = false;
        exhaustedQuestions = [];
        saveState();
        updateUI();
        addLogEntry(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), "--- JÁTÉK VÉGET ÉRT ---");
    }
}

function saveState() {
    localStorage.setItem('jetLag_gameActive', JSON.stringify(gameActive));
    localStorage.setItem('jetLag_exhausted', JSON.stringify(exhaustedQuestions));
    localStorage.setItem('jetLag_lastAction', JSON.stringify(lastAction));
}

function updateUI() {
    // Session buttons
    document.getElementById('btn-start-game').style.display = gameActive ? 'none' : 'block';
    document.getElementById('btn-end-game').style.display = gameActive ? 'block' : 'none';

    // Question buttons exhaustion
    const buttons = document.querySelectorAll('.q-btn');
    buttons.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick');
        const qMatch = onClickAttr.match(/askQuestion\('([^']+)'/);
        if (qMatch) {
            const qName = qMatch[1];
            if (exhaustedQuestions.includes(qName)) {
                btn.classList.add('exhausted');
            } else {
                btn.classList.remove('exhausted');
            }
        }
    });
}

let pendingQuestion = null;

function askQuestion(qName, minutes, reward = "") {
    if (exhaustedQuestions.includes(qName)) return;

    pendingQuestion = { qName, minutes, reward };
    document.getElementById('outcome-q-name').innerText = qName;
    document.getElementById('outcome-modal').style.display = 'flex';
}

function closeOutcomeModal() {
    document.getElementById('outcome-modal').style.display = 'none';
    pendingQuestion = null;
}

function handleOutcome(type) {
    if (!pendingQuestion) return;
    const { qName, minutes, reward } = pendingQuestion;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

    lastAction = {
        name: qName,
        timestamp: now,
        minutes: minutes,
        reward: reward,
        wasExhaustedAdded: false,
        outcomeType: type
    };

    let logMsg = qName;
    if (reward) logMsg += ` [${reward}]`;

    if (type === 'answered') {
        logMsg += " (Válaszolt)";
        if (gameActive) {
            exhaustedQuestions.push(qName);
            lastAction.wasExhaustedAdded = true;
        }
    } else if (type === 'veto') {
        logMsg += " (Vétó)";
        // Question stays available, just timer starts
    } else if (type === 'superveto') {
        logMsg += " (Szuper Vétó)";
        if (gameActive) {
            exhaustedQuestions.push(qName);
            lastAction.wasExhaustedAdded = true;
        }
    }

    saveState();
    if (gameActive) {
        updateUI();
    }

    addLogEntry(timeStr, logMsg);
    startTimer(minutes, `Várakozás... [${logMsg}]`);
    closeOutcomeModal();
}


function addLogEntry(time, text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-text">${text}</span>`;
    document.getElementById('log-content').prepend(entry);

    const count = document.getElementById('log-content').children.length;
    document.getElementById('log-count').innerText = `${count} bejegyzés`;
}

function startTimer(minutes, labelText, endTimeOverride = null) {
    clearInterval(countdown);

    const container = document.getElementById('timer-container');
    const display = document.getElementById('timer-display');
    const label = document.getElementById('timer-label');
    const grid = document.getElementById('main-grid');

    label.innerText = labelText;
    container.style.display = 'block';
    grid.classList.add('disabled');

    let endTime = endTimeOverride || (Date.now() + minutes * 60 * 1000);

    // Save timer state
    localStorage.setItem('jetLag_timerEnd', endTime);
    localStorage.setItem('jetLag_timerLabel', labelText);

    const updateDisplay = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            stopTimer();
            // Don't alert if we're just loading a page where timer already expired
            if (!endTimeOverride || (endTimeOverride - now) > -2000) {
                alert("A várakozási idő lejárt! Új kérdést tehetsz fel.");
            }
        }
    };

    updateDisplay();
    countdown = setInterval(updateDisplay, 1000);
}

function stopTimer() {
    clearInterval(countdown);
    document.getElementById('timer-container').style.display = 'none';
    document.getElementById('main-grid').classList.remove('disabled');
    localStorage.removeItem('jetLag_timerEnd');
    localStorage.removeItem('jetLag_timerLabel');
}

function undoLast() {
    if (confirm("Biztosan visszavonod az utolsó kérdést?")) {
        if (lastAction && lastAction.wasExhaustedAdded) {
            exhaustedQuestions = exhaustedQuestions.filter(q => q !== lastAction.name);
            saveState();
            updateUI();
        }

        stopTimer();
        const logContent = document.getElementById('log-content');
        if (logContent.firstChild) {
            logContent.removeChild(logContent.firstChild);
            const count = logContent.children.length;
            document.getElementById('log-count').innerText = `${count} bejegyzés`;
        }
        lastAction = null;
        saveState();
    }
}

function resetTimer() {
    if (confirm("Biztosan manuálisan törlöd a timert? A jelenlegi kérdés újra elérhető lesz.")) {
        if (lastAction && lastAction.wasExhaustedAdded) {
            exhaustedQuestions = exhaustedQuestions.filter(q => q !== lastAction.name);
            saveState();
            updateUI();
        }
        stopTimer();
        const qLabel = lastAction ? lastAction.name : "Időzítő";
        addLogEntry(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), `--- RESET: ${qLabel} visszaállítva ---`);
        lastAction = null;
        saveState();
    }
}

// Init
window.addEventListener('load', () => {
    lastAction = JSON.parse(localStorage.getItem('jetLag_lastAction')) || null;
    updateUI();

    const savedEnd = localStorage.getItem('jetLag_timerEnd');
    const savedLabel = localStorage.getItem('jetLag_timerLabel');
    if (savedEnd) {
        const endTime = parseInt(savedEnd);
        if (endTime > Date.now()) {
            startTimer(0, savedLabel, endTime);
        } else {
            localStorage.removeItem('jetLag_timerEnd');
            localStorage.removeItem('jetLag_timerLabel');
        }
    }
});
