let countdown;
lastAction = null;
let gameActive = false;
let exhaustedQuestions = [];
let vetoedQuestions = {};
let logEntries = [];
let currentTimerEnd = null; // Track currently running timer to avoid overlap

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
        
        // Átok tab szinkronizáció - minden Firebase frissítésnél fut
        renderHunyoCurses();
        // Folyamatban lévő kérdés banner frissítése
        renderHunyoPendingBanner();
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
        
        const updates = {
            'jetLag_gameActive': true,
            'jetLag_exhausted': [],
            'jetLag_vetoed': {}
        };

        const nowMs = Date.now();
        stopwatchElapsed = 0;
        stopwatchStartTime = nowMs;
        
        if (stopwatchInterval) clearInterval(stopwatchInterval);
        renderStopwatch();
        stopwatchInterval = setInterval(renderStopwatch, 1000);

        updates['jetLag_swElapsed'] = 0;
        updates['jetLag_swStart'] = nowMs;

        const time = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        logEntries.unshift({ time, text: "--- JÁTÉK ELKEZDŐDÖTT ---" });
        updates['jetLag_log'] = logEntries;

        Storage.update(updates);
        updateUI();
        renderLog();
    }
}

async function endGame() {
    if (await customConfirm("Biztosan befejezed a játékot?<br>Minden kérdés újra elérhető lesz.")) {
        gameActive = false;
        exhaustedQuestions = [];
        vetoedQuestions = {};
        
        const updates = {
            'jetLag_gameActive': false,
            'jetLag_exhausted': [],
            'jetLag_vetoed': {}
        };
        
        // Várakozási timer leállítása (csak lokálisan, Firebase-be az updates-en keresztül megy)
        clearInterval(countdown);
        countdown = null;
        currentTimerEnd = null;
        document.getElementById('timer-container').style.display = 'none';
        document.getElementById('main-grid').classList.remove('disabled');
        
        updates['jetLag_timerEnd'] = null;
        updates['jetLag_timerLabel'] = null;

        // Stopwatch nullázása
        if (stopwatchInterval) {
            clearInterval(stopwatchInterval);
            stopwatchInterval = null;
        }
        stopwatchElapsed = 0;
        stopwatchStartTime = null;
        renderStopwatch();
        
        updates['jetLag_swElapsed'] = null;
        updates['jetLag_swStart'] = null;

        const time = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        logEntries.unshift({ time, text: "--- JÁTÉK VÉGET ÉRT ---" });
        updates['jetLag_log'] = logEntries;

        Storage.update(updates);
        updateUI();
        renderLog();
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

    // Ellenőrizzük van-e aktív kérdés várakozóban
    const hasPendingQuestion = !!Storage.get('jetLag_pendingQuestion', null);

    // Question buttons exhaustion & veto info
    const buttons = document.querySelectorAll('.q-btn');
    buttons.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick');
        if (!onClickAttr) return;
        
        const qMatch = onClickAttr.match(/askQuestion\('([^']+)',\s*(\d+)/);
        if (qMatch) {
            const qName = qMatch[1];
            const baseMinutes = parseInt(qMatch[2]);
            const vCount = vetoedQuestions[qName] || 0;
            const actualMinutes = baseMinutes * Math.pow(2, vCount);

            if (exhaustedQuestions.includes(qName)) {
                btn.classList.add('exhausted');
                btn.disabled = true;
            } else {
                btn.classList.remove('exhausted');
                btn.disabled = hasPendingQuestion;
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

function askQuestion(qName, baseMinutes, isPhoto = false, reward = "") {
    if (exhaustedQuestions.includes(qName)) return;
    if (Storage.get('jetLag_pendingQuestion', null)) {
        showToast("Már van egy aktív kérdés! Várd meg a bújók válaszát.", "warning", 3000);
        return;
    }

    const vCount = vetoedQuestions[qName] || 0;
    const actualMinutes = baseMinutes * Math.pow(2, vCount);

    // Firebase-re írjuk a feltétt kérdést, hogy a bújók is lássák
    Storage.set('jetLag_pendingQuestion', {
        qName,
        minutes: actualMinutes,
        isPhoto,
        vetoedCount: vCount,
        startTime: Date.now()
    });

    // Kiszámláló banner megmutatása
    renderHunyoPendingBanner();
    showToast(`❓ Kérdés elküldve: "${qName}" – Várakozás a bújóktól...`, 'info', 4000);
}

function renderHunyoPendingBanner() {
    const pq = Storage.get('jetLag_pendingQuestion', null);
    const banner = document.getElementById('pending-question-banner');
    if (!banner) return;

    if (!pq) {
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
    }

    const vetoLabel = pq.vetoedCount > 0 ? ` (Vétózva x${pq.vetoedCount})` : '';
    banner.style.display = 'block';
    banner.innerHTML = `
        <div class="pending-q-banner">
            <span class="pending-q-pulse"></span>
            <span class="pending-q-label">❓ Aktív kérdés</span>
            <span class="pending-q-name">${pq.qName}${vetoLabel}</span>
            <span class="pending-q-wait">Várakozás a bújóktól...</span>
        </div>`;
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

function startTimer(labelText, endTimeOverride = null) {
    clearInterval(countdown);

    const container = document.getElementById('timer-container');
    const display = document.getElementById('timer-display');
    const label = document.getElementById('timer-label');
    const grid = document.getElementById('main-grid');

    label.innerText = labelText;
    container.style.display = 'block';
    grid.classList.add('disabled');

    let endTime = endTimeOverride;
    currentTimerEnd = endTime;

    // Only set in storage if it's not already there (though since the only caller is initHunyo which restores it, we don't even need to set it here anymore, but keeping it for safety)
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
    countdown = null;
    currentTimerEnd = null;
    document.getElementById('timer-container').style.display = 'none';
    document.getElementById('main-grid').classList.remove('disabled');
    
    // Töröljük a Firebase-ből
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
let hunyoInitialized = false;
function initHunyo() {
    lastAction = Storage.get('jetLag_lastAction', null);
    updateUI();
    renderLog();

    // Stopwatch visszaszerzése -- csak egyszer indítjuk el
    stopwatchElapsed = Storage.get('jetLag_swElapsed', 0);
    const swStart = Storage.get('jetLag_swStart', null);
    if (!stopwatchInterval && swStart && gameActive) {
        stopwatchStartTime = swStart;
        stopwatchInterval = setInterval(renderStopwatch, 1000);
        renderStopwatch();
    } else if (stopwatchElapsed > 0 && !stopwatchInterval) {
        renderStopwatch();
    }

    // Timer visszaszerzése Firebase-ből:
    const endTime = Storage.get('jetLag_timerEnd', null);
    const label = Storage.get('jetLag_timerLabel', 'Várakozás');

    if (!endTime || endTime <= Date.now()) {
        // Ha nincs timer vagy már lejárt, akkor állítsuk le helyileg
        if (countdown) {
            clearInterval(countdown);
            countdown = null;
            currentTimerEnd = null;
            document.getElementById('timer-container').style.display = 'none';
            document.getElementById('main-grid').classList.remove('disabled');
        }
        
        // Ha lejárt timer maradt bent a Firebase-ben, takarítsuk ki
        if (endTime && endTime <= Date.now()) {
            Storage.remove('jetLag_timerEnd');
            Storage.remove('jetLag_timerLabel');
        }
    } else {
        // Van futó timer a Firebase-ben
        // Ha még nem fut, vagy a Firebase-ben lévő timer MÁSIK (újabb), akkor indítsuk el
        if (!countdown || currentTimerEnd !== endTime) {
            startTimer(label, endTime);
        }
    }
}
// Note: window.addEventListener('load', initHunyo) is now handled by runner.js


// =============================================================================
// ÁTOK TAB LOGIKA
// Beolvassa a bújók aktív átkait (jetLag_activeEffects) Firebase-ből
// és megjeleníti őket a Hunyó központban.
// =============================================================================

let hunyoCurseTimerInterval = null;

function renderHunyoCurses() {
    const effects = Storage.get('jetLag_activeEffects', []);
    const list = document.getElementById('curses-list');
    if (!list) return;
    
    // Badge frissítése a tab-on
    const badge = document.getElementById('curse-badge');
    if (badge) {
        if (effects.length > 0) {
            badge.style.display = 'inline';
            badge.textContent = effects.length;
        } else {
            badge.style.display = 'none';
        }
    }

    if (effects.length === 0) {
        list.innerHTML = `
            <div class="no-curses-msg">
                <span style="font-size:3rem">✨</span>
                <p>Jelenleg nincsenek aktív átkok!</p>
            </div>`;
        return;
    }

    list.innerHTML = effects.map((effect, i) => {
        const hasTimer = effect.endTime != null;
        const remaining = hasTimer ? Math.max(0, effect.endTime - Date.now()) : null;
        const mins = remaining !== null ? Math.floor(remaining / 60000) : null;
        const secs = remaining !== null ? Math.floor((remaining % 60000) / 1000) : null;
        const timerStr = remaining !== null ? `${mins}:${secs.toString().padStart(2, '0')}` : null;
        const isExpired = remaining !== null && remaining <= 0;

        return `
            <div class="curse-card ${isExpired ? 'curse-expired' : ''}">
                <div class="curse-header">
                    <span class="curse-icon">☠️</span>
                    <span class="curse-name">${effect.nev}</span>
                    ${hasTimer ? `<span class="curse-timer-badge" id="hunyo-curse-timer-${i}">${timerStr}</span>` : '<span class="curse-no-timer">Feladat</span>'}
                </div>
                <p class="curse-desc">${effect.leiras}</p>
                <button class="curse-dismiss-btn" onclick="dismissCurseFromHunyo(${i})">✅ TELJESÍTVE</button>
            </div>`;
    }).join('');

    // Timer tick indítása
    if (hunyoCurseTimerInterval) clearInterval(hunyoCurseTimerInterval);
    const hasAnyTimer = effects.some(e => e.endTime != null);
    if (hasAnyTimer) {
        hunyoCurseTimerInterval = setInterval(() => {
            effects.forEach((effect, i) => {
                if (!effect.endTime) return;
                const el = document.getElementById(`hunyo-curse-timer-${i}`);
                if (!el) return;
                const rem = Math.max(0, effect.endTime - Date.now());
                const m = Math.floor(rem / 60000);
                const s = Math.floor((rem % 60000) / 1000);
                el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
                if (rem <= 0) {
                    el.closest('.curse-card')?.classList.add('curse-expired');
                }
            });
        }, 1000);
    }
}

function dismissCurseFromHunyo(index) {
    let effects = Storage.get('jetLag_activeEffects', []);
    if (index < 0 || index >= effects.length) return;
    
    const curseName = effects[index].nev;
    effects.splice(index, 1);
    
    // Firebase-re írjuk vissza a módosított listát
    Storage.set('jetLag_activeEffects', effects);
    
    showToast(`✅ "${curseName}" átok teljesítve!`, 'success', 3000);
    renderHunyoCurses();
}
