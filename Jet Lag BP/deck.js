// =============================================================================
// deck.js – Pakli logika
// Az adatokat a cards.js fájlból veszi (ORIGINAL_DECK, CARD_TYPES).
// =============================================================================

// --- ÁLLAPOT ---
let currentDeck = [];
let inventory = [];
let drawnPool = [];
let activeEffects = [];
let pendingRewards = [];
let cardsToKeep = 0;

async function initFirebaseDeck() {
    const roomId = localStorage.getItem('local_roomId');
    if (!roomId) {
        window.location.href = './index.html';
        return;
    }

    await Storage.init(roomId, () => {
        currentDeck = Storage.get('jetLag_deck', [...ORIGINAL_DECK]);
        inventory = Storage.get('jetLag_inventory', []);
        drawnPool = Storage.get('jetLag_drawnPool', []);
        activeEffects = Storage.get('jetLag_activeEffects', []);
        pendingRewards = Storage.get('jetLag_pendingRewards', []);
        cardsToKeep = Storage.get('jetLag_cardsToKeep', 0);

        // Inicializáljuk a térképet, ha van
        if (typeof initMap === 'function') initMap();

        // Refresh UI
        initDeck();

        // Kérdés tab szinkronizáció - minden Firebase frissítésnél fut
        renderPendingQuestion();

        // Ellenőrizzük, hogy véget ért-e a játék
        const gameActive = Storage.get('gameActive', true);
        if (gameActive === false) {
            const modal = document.getElementById('game-over-modal');
            if (modal && modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
            }
        }

        // Ha még nincs célállomás beírva, kérjük be egyszer az első bújótól
        const meta = Storage.get('jetLag_metadata', null);
        if (!meta || !meta.hiderEnd) {
            const metaModal = document.getElementById('meta-modal-deck');
            if (metaModal) metaModal.style.display = 'flex';
        }
    });
}
window.addEventListener('load', initFirebaseDeck);

function saveDeckMeta() {
    const hiderEnd = document.getElementById('meta-hider-end').value.trim();
    if (!hiderEnd) {
        showToast('Kérlek adj meg egy célállomást!', 'error');
        return;
    }
    const existing = Storage.get('jetLag_metadata', {});
    Storage.set('jetLag_metadata', { ...existing, hiderEnd });
    document.getElementById('meta-modal-deck').style.display = 'none';
    showToast('Célállomás elmentve!', 'success');
}

// Fizetési folyamat állapota
let isPaying = false;
let targetIndex = -1;
let selectedForDiscard = [];

// --- SEGÉDFÜGGVÉNYEK ---

/** Kártya típusából CSS osztálynevet generál. */
function getCardClass(tipus) {
    return CARD_TYPES[tipus]?.cssClass ?? 'type-ido';
}// --- PERZISZTENCIA ---

function saveDeckState() {
    Storage.update({
        'jetLag_deck': currentDeck,
        'jetLag_inventory': inventory,
        'jetLag_drawnPool': drawnPool,
        'jetLag_activeEffects': activeEffects,
        'jetLag_pendingRewards': pendingRewards,
        'jetLag_cardsToKeep': cardsToKeep
    });
}

// --- PAKLI MŰVELETEK ---

function updateStats() {
    document.getElementById('deck-stats').innerText =
        `Pakli: ${currentDeck.length} / ${ORIGINAL_DECK.length}`;
}

async function resetDeck() {
    if (!(await customConfirm('Biztosan újraindítod a paklit?<br>Minden kártya visszakerül, az inventory törlődik és az aktív hatások megszűnnek.'))) return;

    currentDeck = [...ORIGINAL_DECK];
    inventory = [];
    drawnPool = [];
    activeEffects = [];
    pendingRewards = [];
    cardsToKeep = 0;
    isPaying = false;
    targetIndex = -1;
    selectedForDiscard = [];

    saveDeckState();
    updateStats();
    renderInventory();
    renderActiveEffects();
    document.getElementById('selection-area').innerHTML = '';
    renderDrawControls();
    updateStatus('');
}

function renderDrawControls() {
    const controls = document.getElementById('dynamic-draw-controls');
    if (!controls) return;
    controls.innerHTML = '';

    if (isPaying) {
        controls.innerHTML = `<span>Fizetés folyamatban...</span>`;
    } else if (drawnPool.some(c => c !== null)) {
        controls.innerHTML = `<span>Válassz ki még ${cardsToKeep} kártyát!</span>`;
    } else if (pendingRewards.length > 0) {
        const reward = pendingRewards[0];
        const btn = document.createElement('button');
        btn.innerText = `Jutalom: Húzz ${reward.draw}, tarts meg ${reward.keep}`;
        btn.onclick = () => claimReward(0);
        controls.appendChild(btn);
    } else {
        controls.innerHTML = `<span style="color:var(--text-dim)">Nincs elérhető húzás</span>`;
    }

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.innerText = 'Reset';
    resetBtn.onclick = resetDeck;
    controls.appendChild(resetBtn);
}

function claimReward(index) {
    try {
        if (isPaying) return;
        const reward = pendingRewards.splice(index, 1)[0];
        if (!reward) {
            showToast('Hiba: nincs jutalom adat', 'error');
            return;
        }
        saveDeckState();
        drawChoice(parseInt(reward.draw) || 0, parseInt(reward.keep) || 0);
    } catch (e) {
        showToast('Kivétel claimReward: ' + e.message, 'error');
        console.error(e);
    }
}

function drawChoice(count, keep) {
    try {
        if (isPaying) return;
        if (count <= 0) {
            showToast('Hiba: húzás mennyiség 0', 'error');
            return;
        }

        if (currentDeck.length < count) {
            showToast('A pakli kiürült! Újrakeverés...', 'warning');
            currentDeck = [...ORIGINAL_DECK];
        }

        drawnPool = [];
        cardsToKeep = keep;
        document.getElementById('selection-area').innerHTML = '';

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * currentDeck.length);
            drawnPool.push(currentDeck.splice(index, 1)[0]);
        }

        saveDeckState();
        renderDrawnPool();
        renderDrawControls();
        updateStats();
    } catch (e) {
        showToast('Kivétel drawChoice: ' + e.message, 'error');
        console.error(e);
    }
}

// --- RENDERELÉS ---

function renderCardContent(card) {
    const dots = '<div class="cost-dot"></div>'.repeat(card.cost);
    return `
        <div class="cost-indicator">${dots}</div>
        <div class="type">${card.tipus}</div>
        <div class="name">${card.nev}</div>
        <div class="desc">${card.leiras}</div>
    `;
}

function renderDrawnPool() {
    const area = document.getElementById('selection-area');
    area.innerHTML = '';
    drawnPool.forEach((card, i) => {
        if (!card) return;
        const cardEl = document.createElement('div');
        cardEl.className = `card ${getCardClass(card.tipus)}`;
        cardEl.innerHTML = renderCardContent(card);
        cardEl.onclick = () => keepCard(i);
        area.appendChild(cardEl);
    });
}

function renderInventory() {
    const display = document.getElementById('inventory-display');
    display.innerHTML = '';
    inventory.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card inventory-card ${getCardClass(card.tipus)}`;

        if (isPaying && index === targetIndex) cardEl.classList.add('paying');
        if (selectedForDiscard.includes(index)) cardEl.classList.add('selected-to-discard');

        const canPlayDirectly = card.tipus !== 'Idő' && card.cost === 0;
        const playBtn = canPlayDirectly
            ? `<button class="play-btn" onclick="event.stopPropagation(); playCard(${index})">KIJÁTSZÁS</button>`
            : '';

        cardEl.innerHTML = renderCardContent(card) + playBtn;
        cardEl.onclick = () => handleInventoryClick(index);
        display.appendChild(cardEl);
    });
}

function renderActiveEffects() {
    const section = document.getElementById('active-effects-section');
    const display = document.getElementById('active-effects-display');

    if (activeEffects.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    display.innerHTML = '';

    activeEffects.forEach((effect, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card active-card ${getCardClass(effect.tipus)}`;

        let timerHtml = '';
        if (effect.endTime) {
            const remaining = Math.max(0, effect.endTime - Date.now());
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            timerHtml = `<div class="timer" id="timer-${index}">${mins}:${secs.toString().padStart(2, '0')}</div>`;
        }

        cardEl.innerHTML = `
            ${renderCardContent(effect)}
            ${timerHtml}
        `;
        display.appendChild(cardEl);
    });
}

// --- AKTÍV HATÁSOK ---

function activateCardEffect(card) {
    const minutes = card.duration ?? 0;
    activeEffects.push({
        ...card,
        startTime: Date.now(),
        endTime: minutes > 0 ? Date.now() + minutes * 60 * 1000 : null
    });
}

function dismissEffect(index) {
    activeEffects.splice(index, 1);
    saveDeckState();
    renderActiveEffects();
}

function updateActiveTimers() {
    let changed = false;
    activeEffects.forEach((effect, index) => {
        if (!effect.endTime) return;
        const timerEl = document.getElementById(`timer-${index}`);
        if (!timerEl) return;

        const remaining = Math.max(0, effect.endTime - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 0) changed = true;
    });

    if (changed) {
        activeEffects = activeEffects.filter(e => !e.endTime || e.endTime > Date.now());
        saveDeckState();
        renderActiveEffects();
    }
}

// --- KÁRTYA KIJÁTSZÁS & FIZETÉS ---

function keepCard(idx) {
    if (!drawnPool[idx]) return;

    inventory.push(drawnPool[idx]);
    drawnPool[idx] = null;
    cardsToKeep--;

    if (cardsToKeep <= 0) {
        drawnPool = [];
        document.getElementById('selection-area').innerHTML = '';
    } else {
        renderDrawnPool();
    }

    saveDeckState();
    renderDrawControls();
    renderInventory();
}

function handleInventoryClick(index) {
    if (!isPaying) {
        if (inventory[index].tipus !== 'Idő') startUsage(index);
    } else {
        handleDiscardSelection(index);
    }
}

async function playCard(index) {
    const card = inventory[index];
    if (isPaying && (index === targetIndex || selectedForDiscard.includes(index))) return;
    if (card.tipus === 'Idő') {
        showToast('Az Idő kártyák passzív előnyt adnak, nem kell őket kijátszani.', 'info');
        return;
    }
    if (card.cost > 0) { startUsage(index); return; }

    if (await customConfirm(`Kijátszod: <strong>${card.nev}</strong>?`)) {
        activateCardEffect(card);
        inventory.splice(index, 1);
        saveDeckState();
        renderInventory();
        renderActiveEffects();
    }
}

function startUsage(index) {
    const card = inventory[index];
    if (card.cost === 0) { playCard(index); return; }

    if (inventory.length <= card.cost) {
        showToast('Nincs elég kártyád az inventory-ban a költség kifizetéséhez!', 'error');
        return;
    }
    isPaying = true;
    targetIndex = index;
    selectedForDiscard = [];
    updateStatus(`FIZETÉS: Válassz ${card.cost} lapot az eldobáshoz!`);
    renderInventory();
    renderDrawControls();
}

function handleDiscardSelection(index) {
    if (index === targetIndex) {
        isPaying = false;
        targetIndex = -1;
        selectedForDiscard = [];
        updateStatus('');
        renderInventory();
        renderDrawControls();
        return;
    }

    if (selectedForDiscard.includes(index)) {
        selectedForDiscard = selectedForDiscard.filter(i => i !== index);
    } else if (selectedForDiscard.length < inventory[targetIndex].cost) {
        selectedForDiscard.push(index);
    }

    if (selectedForDiscard.length === inventory[targetIndex].cost) {
        finalizeUsage();
    } else {
        renderInventory();
    }
}

async function finalizeUsage() {
    const targetCard = inventory[targetIndex];
    if (!(await customConfirm(`Kifizeted a költséget és használod: <strong>${targetCard.nev}</strong>?`))) {
        isPaying = false;
        targetIndex = -1;
        selectedForDiscard = [];
        updateStatus('');
        renderInventory();
        renderDrawControls();
        return;
    }

    // Indexek csökkenő sorrendben törlése, hogy a splice ne csússzon el
    [...selectedForDiscard, targetIndex]
        .sort((a, b) => b - a)
        .forEach(i => inventory.splice(i, 1));

    activateCardEffect(targetCard);
    saveDeckState();

    isPaying = false;
    targetIndex = -1;
    selectedForDiscard = [];
    updateStatus('');
    renderInventory();
    renderActiveEffects();
    renderDrawControls();
}

// --- STÁTUSZSOR ---

function updateStatus(msg) {
    const bar = document.getElementById('status-bar');
    bar.innerText = msg;
    bar.style.display = msg ? 'block' : 'none';
}

let timerInterval = null;

// Inicializálás
function initDeck() {
    renderInventory();
    renderActiveEffects();
    updateStats();

    if (drawnPool.some(c => c !== null)) {
        renderDrawnPool();
    } else {
        document.getElementById('selection-area').innerHTML = '';
    }

    renderDrawControls();

    if (!timerInterval) {
        timerInterval = setInterval(updateActiveTimers, 1000);
    }
}


// =============================================================================
// KÉRDÉS TAB LOGIKA
// Szinkronizálja a hunyó által feltétt kérdéseket Firebase-ből
// és megjeleníti őket a Bújó oldalon.
// =============================================================================

let questionCountdownInterval = null;

function renderPendingQuestion() {
    const pq = Storage.get('jetLag_pendingQuestion', null);
    const inner = document.getElementById('question-tab-inner');
    const badge = document.getElementById('question-badge');
    if (!inner) return;

    // Badge a tab-on
    if (badge) badge.style.display = pq ? 'inline-block' : 'none';

    if (!pq) {
        if (questionCountdownInterval) {
            clearInterval(questionCountdownInterval);
            questionCountdownInterval = null;
        }
        inner.innerHTML = `
            <div class="no-question-msg">
                <span style="font-size:3rem">💭</span>
                <p>Nincs aktív kérdés</p>
                <p style="font-size:0.8rem; color:var(--text-dim)">Amikor a hunyó feltesz egy kérdést, itt fog megjelenni.</p>
            </div>`;
        return;
    }

    // Van pending kérdésünk— Meghatározuk hány perc van válaszolni (5 vagy 10)
    const answerMinutes = pq.isPhoto ? 10 : 5;
    const deadlineMs = pq.startTime + answerMinutes * 60 * 1000;

    // Vétó és szuper-vétó elérhetősége
    const hasVeto = inventory.some(c => c.nev === 'Vétó');
    const hasSuperVeto = inventory.some(c => c.nev === 'Szuper-Vétó');
    const vetoLabel = pq.vetoedCount > 0 ? `Vétózva (x${pq.vetoedCount})` : '';

    inner.innerHTML = `
        <div class="question-card">
            <div class="question-card-label">Aktív kérdés</div>
            <div class="question-name">${pq.qName}</div>
            ${pq.note ? `<div class="question-note">💡 ${pq.note}</div>` : ''}
            ${vetoLabel ? `<div class="question-vetoed-tag">🔄 ${vetoLabel}</div>` : ''}
            ${pq.isPhoto ? '<div class="question-photo-tag">📸 Fotó kérdés (10 perc)</div>' : ''}
            ${(pq.drawCount > 0 || pq.keepCount > 0) ? `
            <div class="question-card-reward">
                🃏 Húzz <strong>${pq.drawCount}</strong> kártyát, tartsd meg <strong>${pq.keepCount}-et</strong>
            </div>` : ''}
            <div class="question-timer-wrap">
                <div class="question-timer-label">Válaszolni kell</div>
                <div class="question-timer" id="question-countdown">--:--</div>
            </div>
            <div class="question-actions">
                <button class="q-outcome-btn q-answered" onclick="handleBujoOutcome('answered')">✅ VÁLASZOLTAK</button>
                <button class="q-outcome-btn q-veto ${hasVeto ? '' : 'disabled'}" onclick="handleBujoOutcome('veto')" ${hasVeto ? '' : 'disabled'}>❌ VÉTÓ ${hasVeto ? '' : '(nincs kártya)'}</button>
                <button class="q-outcome-btn q-superveto ${hasSuperVeto ? '' : 'disabled'}" onclick="handleBujoOutcome('superveto')" ${hasSuperVeto ? '' : 'disabled'}>☢️ SZUPER-VÉTÓ ${hasSuperVeto ? '' : '(nincs kártya)'}</button>
            </div>
        </div>`;

    // Visszaszámláló tick
    if (questionCountdownInterval) clearInterval(questionCountdownInterval);
    const tick = () => {
        const el = document.getElementById('question-countdown');
        if (!el) { clearInterval(questionCountdownInterval); return; }
        const rem = Math.max(0, deadlineMs - Date.now());
        const m = Math.floor(rem / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        el.classList.toggle('timer-urgent', rem < 60000 && rem > 0);
        el.classList.toggle('timer-expired', rem === 0);
    };
    tick();
    questionCountdownInterval = setInterval(tick, 1000);
}

function handleBujoOutcome(type) {
    const pq = Storage.get('jetLag_pendingQuestion', null);
    if (!pq) return;

    const { qName, minutes } = pq;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

    // Betöltjük a hunyó állapotot Firebase-ből (ugyanabba a szobába írunk)
    let exhaustedQ = Storage.get('jetLag_exhausted', []);
    let vetoedQ = Storage.get('jetLag_vetoed', {});
    let logEntries = Storage.get('jetLag_log', []);

    let shouldStartTimer = true;
    let logMsg = qName;

    if (type === 'answered') {
        logMsg += ' (Válaszolt)';
        exhaustedQ.push(qName);
        if (pq.drawCount > 0) {
            pendingRewards.push({ draw: pq.drawCount, keep: pq.keepCount });
        }
    } else if (type === 'veto') {
        logMsg += ' (Vétó)';
        shouldStartTimer = false;
        // Kivételezi a Vétó kártyát az inventoryból
        const vetoIdx = inventory.findIndex(c => c.nev === 'Vétó');
        if (vetoIdx !== -1) {
            inventory.splice(vetoIdx, 1);
        }
        vetoedQ[qName] = (vetoedQ[qName] || 0) + 1;
    } else if (type === 'superveto') {
        logMsg += ' (Szuper Vétó)';
        exhaustedQ.push(qName);
        // Kivételezi a Szuper-Vétó kártyát az inventoryból
        const svIdx = inventory.findIndex(c => c.nev === 'Szuper-Vétó');
        if (svIdx !== -1) {
            inventory.splice(svIdx, 1);
        }
    }

    // Log bejegyzés, és állapot írása Firebase-re
    logEntries.unshift({ time: timeStr, text: logMsg });

    const updates = {
        'jetLag_exhausted': exhaustedQ,
        'jetLag_vetoed': vetoedQ,
        'jetLag_log': logEntries,
        'jetLag_inventory': inventory
    };

    if (type === 'answered' && pq.drawCount > 0) {
        updates['jetLag_pendingRewards'] = pendingRewards;
    }

    if (shouldStartTimer) {
        const endTime = Date.now() + minutes * 60 * 1000;
        updates['jetLag_timerEnd'] = endTime;
        updates['jetLag_timerLabel'] = `Várakozás... [${logMsg}]`;
    }

    Storage.update(updates);

    // Kérdés törlése
    Storage.remove('jetLag_pendingQuestion');

    showToast(type === 'answered' ? '✅ Válasz rögzítve! Timer indul a hunyóknál.' : (type === 'veto' ? '❌ Vétó eljátszva!' : '☢️ Szuper-Vétó eljátszva!'), 'success', 3500);

    // Helyi UI frissítés (a Storage callback is le fog futni, de az aszinkron)
    renderPendingQuestion();
    renderInventory();
    renderDrawControls();
    saveDeckState();
}
