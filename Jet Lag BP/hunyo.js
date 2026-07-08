let countdown;
lastAction = null;
let gameActive = false;
let exhaustedQuestions = [];
let vetoedQuestions = {};
let logEntries = [];

// ---- STOPWATCH (felül számol) ----
let stopwatchInterval = null;
let stopwatchStartTime = null; // Unix timestamp (ms) mikor indult
let stopwatchElapsed = 0;      // Eddig eltelt másodpercek (együtttes)

async function initFirebaseHunyo() {
    const roomId = localStorage.getItem('local_roomId');
    if (!roomId) {
        window.location.href = './index.html';
        return;
    }
    
    await Storage.init(roomId, () => {
        gameActive = Storage.get('jetLag_gameActive', false);
        exhaustedQuestions = Storage.get('jetLag_exhausted', []);
        vetoedQuestions = Storage.get('jetLag_vetoed', {});
        logEntries = Storage.get('jetLag_log', []);
        
        initHunyo();
        if (typeof initMap === 'function') initMap();
    });
    
    // Restore last active tab
    if (typeof switchHunyoTab === 'function') {
        const lastTab = Storage.get('local_hunyoTab', 'questions'); // using local for tab state
        switchHunyoTab(lastTab);
    }
}
window.addEventListener('load', initFirebaseHunyo);

async function startGame() {
    if (await customConfirm("Készen állsz az indulásra?<br>A kérdések el fognak fogyni a játék során!", "Indítás", "Mégsem")) {
        gameActive = true;
        exhaustedQuestions = [];
        vetoedQuestions = {};
        saveState();
        updateUI();
        addLogEntry(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), "--- JÁTÉK ELKEZDŐDÖTT ---");
        startStopwatch();
    }
}

async function endGame() {
    if (await customConfirm("Biztosan befejezed a játékot?<br>Minden kérdés újra elérhető lesz.")) {
        gameActive = false;
        exhaustedQuestions = [];
        vetoedQuestions = {};
        saveState();
        updateUI();
        addLogEntry(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), "--- JÁTÉK VÉGET ÉRT ---");
        stopStopwatch();
    }
}

// ========== STOPWATCH ==========

function startStopwatch() {
    stopwatchElapsed = Storage.get('jetLag_swElapsed', 0);
    stopwatchStartTime = Date.now();
    Storage.set('jetLag_swStart', stopwatchStartTime);
    renderStopwatch();
    stopwatchInterval = setInterval(renderStopwatch, 1000);
}

function stopStopwatch() {
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
    // Mentük az eltelt másodperceket
    if (stopwatchStartTime) {
        stopwatchElapsed += Math.floor((Date.now() - stopwatchStartTime) / 1000);
        Storage.set('jetLag_swElapsed', stopwatchElapsed);
        stopwatchStartTime = null;
        Storage.remove('jetLag_swStart');
    }
}

function getCurrentElapsed() {
    if (stopwatchStartTime) {
        return stopwatchElapsed + Math.floor((Date.now() - stopwatchStartTime) / 1000);
    }
    return stopwatchElapsed;
}

function renderStopwatch() {
    const el = document.getElementById('stopwatch-display');
    if (!el) return;
    const total = getCurrentElapsed();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
        el.innerText = `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    } else {
        el.innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
}

// ========== ELKAPTUK! ==========

async function caughtHider() {
    if (!await customConfirm("Biztosan elkaptátok a bújót? 🎉", "IGEN, ELKAPTUK!", "Mégsem")) return;

    stopStopwatch();
    const elapsedSec = getCurrentElapsed();

    // Öszes idő-kártya kihuzva a pakliból (Firebase-ből olvassuk)
    const roomId = localStorage.getItem('local_roomId');
    let totalBonusSec = 0;
    let bonusCards = [];

    // Csak az inventoryban lévő Idő-kártyák számítanak (a feladott/eldobott NEM)
    const snap = await db.ref(`rooms/${roomId}/gameState`).once('value');
    const gs = snap.val() || {};
    const inventory = gs.jetLag_inventory || [];

    inventory.forEach(card => {
        if (card.tipus === 'Idő') {
            const matchMin = card.nev.match(/\+(\d+)p/);
            const matchPct = card.nev.match(/\+(\d+)%/);
            if (matchMin) {
                const mins = parseInt(matchMin[1]);
                totalBonusSec += mins * 60;
                bonusCards.push(`${card.nev} (+${mins}p)`);
            } else if (matchPct) {
                bonusCards.push(`${card.nev} (${matchPct[1]}%)`);
            }
        }
    });

    // Százalékos kártyák utólagos alkalmazása
    inventory.forEach(card => {
        const matchPct = card.nev.match(/Idő \+(\d+)%/);
        if (matchPct) {
            const pct = parseInt(matchPct[1]);
            totalBonusSec += Math.round(totalBonusSec * pct / 100);
        }
    });

    const finalSec = elapsedSec + totalBonusSec;

    function fmtTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    const bonusText = bonusCards.length > 0
        ? `<div class="caught-bonus"><b>Idő-bónuszok:</b><br>${bonusCards.map(c => `• ${c}`).join('<br>')}<br><b>+${fmtTime(totalBonusSec)} bónusz</b></div>`
        : '<div class="caught-bonus">Nem volt idő-kártya huzva.</div>';

    const html = `
        <div class="caught-result">
            <div class="caught-trophy">🏆</div>
            <div class="caught-title">ELKAPTUK!</div>
            <div class="caught-time-label">Eltérben töltött idő:</div>
            <div class="caught-time">${fmtTime(elapsedSec)}</div>
            ${bonusText}
            <div class="caught-time-label" style="margin-top:12px">Végző idő:</div>
            <div class="caught-time final">${fmtTime(finalSec)}</div>
        </div>
    `;

    document.getElementById('caught-body').innerHTML = html;
    document.getElementById('caught-modal').style.display = 'flex';

    addLogEntry(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }), `--- ELKAPTUK! Végző idő: ${fmtTime(finalSec)} ---`);
    saveState();
}

function closeCaughtModal() {
    document.getElementById('caught-modal').style.display = 'none';
}

function saveState() {
    Storage.update({
        'jetLag_gameActive': gameActive,
        'jetLag_exhausted': exhaustedQuestions,
        'jetLag_vetoed': vetoedQuestions,
        'jetLag_lastAction': lastAction,
        'jetLag_log': logEntries
    });
}

function updateUI() {
    // Session buttons
    document.getElementById('btn-start-game').style.display = gameActive ? 'none' : 'block';
    document.getElementById('btn-end-game').style.display = gameActive ? 'block' : 'none';

    // Question buttons exhaustion & veto info
    const buttons = document.querySelectorAll('.q-btn');
    buttons.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick');
        const qMatch = onClickAttr.match(/askQuestion\('([^']+)',\s*(\d+)/);
        if (qMatch) {
            const qName = qMatch[1];
            const baseMinutes = parseInt(qMatch[2]);
            const vCount = vetoedQuestions[qName] || 0;
            const actualMinutes = baseMinutes * Math.pow(2, vCount);

            if (exhaustedQuestions.includes(qName)) {
                btn.classList.add('exhausted');
            } else {
                btn.classList.remove('exhausted');
            }

            const rewardSpan = btn.querySelector('.reward-info');
            if (rewardSpan) {
                if (vCount > 0 && !exhaustedQuestions.includes(qName)) {
                    rewardSpan.innerText = `${actualMinutes}p timer (Vétó x${vCount})`;
                    rewardSpan.style.color = '#ff4500';
                } else {
                    rewardSpan.innerText = `${baseMinutes}p timer`;
                    rewardSpan.style.color = '';
                }
            }
        }
    });
}

let pendingQuestion = null;

function askQuestion(qName, baseMinutes, reward = "") {
    if (exhaustedQuestions.includes(qName)) return;

    const vCount = vetoedQuestions[qName] || 0;
    const actualMinutes = baseMinutes * Math.pow(2, vCount);

    pendingQuestion = { qName, minutes: actualMinutes, reward };
    const modalTitle = vCount > 0 ? `${qName} (Vétózva x${vCount})` : qName;
    document.getElementById('outcome-q-name').innerText = modalTitle;
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
        wasVetoedAdded: false,
        outcomeType: type
    };

    let logMsg = qName;
    if (reward) logMsg += ` [${reward}]`;

    let shouldStartTimer = true;

    if (type === 'answered') {
        logMsg += " (Válaszolt)";
        if (gameActive) {
            exhaustedQuestions.push(qName);
            lastAction.wasExhaustedAdded = true;
        }
    } else if (type === 'veto') {
        logMsg += " (Vétó)";
        shouldStartTimer = false;
        if (gameActive) {
            vetoedQuestions[qName] = (vetoedQuestions[qName] || 0) + 1;
            lastAction.wasVetoedAdded = true;
        }
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
    if (shouldStartTimer) {
        startTimer(minutes, `Várakozás... [${logMsg}]`);
    }
    closeOutcomeModal();
}


function addLogEntry(time, text) {
    logEntries.unshift({ time, text });
    saveState();
    renderLog();
}

function renderLog() {
    const logContent = document.getElementById('log-content');
    logContent.innerHTML = '';
    
    logEntries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `<span class="log-time">[${entry.time}]</span><span class="log-text">${entry.text}</span>`;
        logContent.appendChild(div);
    });

    document.getElementById('log-count').innerText = `${logEntries.length} bejegyzés`;
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
    Storage.set('jetLag_timerEnd', endTime);
    Storage.set('jetLag_timerLabel', labelText);

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
                showToast("A várakozási idő lejárt! Új kérdést tehetsz fel.", 'success', 5000);
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
    Storage.remove('jetLag_timerEnd');
    Storage.remove('jetLag_timerLabel');
}

async function undoLast() {
    if (await customConfirm("Biztosan visszavonod az utolsó kérdést?")) {
        if (lastAction) {
            if (lastAction.wasExhaustedAdded) {
                exhaustedQuestions = exhaustedQuestions.filter(q => q !== lastAction.name);
            }
            if (lastAction.wasVetoedAdded) {
                vetoedQuestions[lastAction.name]--;
                if (vetoedQuestions[lastAction.name] <= 0) {
                    delete vetoedQuestions[lastAction.name];
                }
            }
            saveState();
            updateUI();
        }

        stopTimer();
        if (logEntries.length > 0) {
            logEntries.shift(); // Remove the last added log entry
            renderLog();

        }
        lastAction = null;
        saveState();
    }
}

async function resetTimer() {
    if (await customConfirm("Biztosan törlöd a timert?<br>A jelenlegi kérdés újra elérhető lesz.")) {
        if (lastAction) {
            if (lastAction.wasExhaustedAdded) {
                exhaustedQuestions = exhaustedQuestions.filter(q => q !== lastAction.name);
            }
            if (lastAction.wasVetoedAdded) {
                vetoedQuestions[lastAction.name]--;
                if (vetoedQuestions[lastAction.name] <= 0) {
                    delete vetoedQuestions[lastAction.name];
                }
            }
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

// Inicializálás
function initHunyo() {
    lastAction = Storage.get('jetLag_lastAction', null);
    updateUI();
    renderLog();

    // Stopwatch visszaállítása
    stopwatchElapsed = Storage.get('jetLag_swElapsed', 0);
    const swStart = Storage.get('jetLag_swStart', null);
    if (swStart && gameActive) {
        stopwatchStartTime = swStart;
        stopwatchInterval = setInterval(renderStopwatch, 1000);
        renderStopwatch();
    } else if (stopwatchElapsed > 0) {
        renderStopwatch();
    }

    // Restart timer visually if it's currently running
    const endTime = Storage.get('jetLag_timerEnd', null);
    if (endTime && endTime > Date.now()) {
        const remainingMs = endTime - Date.now();
        const label = Storage.get('jetLag_timerLabel', 'Várakozás');
        startTimer(label, remainingMs / 60000, endTime);
    } else if (endTime && endTime <= Date.now()) {
        // Clear if we loaded the page and timer already expired
        Storage.remove('jetLag_timerEnd');
        Storage.remove('jetLag_timerLabel');
    }
}
// Note: window.addEventListener('load', initHunyo) is now handled by runner.js
