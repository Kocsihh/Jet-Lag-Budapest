// =============================================================================
// deck.js – Pakli logika
// Az adatokat a cards.js fájlból veszi (ORIGINAL_DECK, CARD_TYPES).
// =============================================================================

// --- ÁLLAPOT ---
let currentDeck    = Storage.get('jetLag_deck', [...ORIGINAL_DECK]);
let inventory      = Storage.get('jetLag_inventory', []);
let drawnPool      = Storage.get('jetLag_drawnPool', []);
let activeEffects  = Storage.get('jetLag_activeEffects', []);

// Fizetési folyamat állapota
let isPaying          = false;
let targetIndex       = -1;
let selectedForDiscard = [];

// --- SEGÉDFÜGGVÉNYEK ---

/** Kártya típusából CSS osztálynevet generál. */
function getCardClass(tipus) {
    return CARD_TYPES[tipus]?.cssClass ?? 'type-ido';
}

/** Húzó gombok (btn1/btn2/btn3) engedélyezése vagy tiltása. */
function setDrawButtons(disabled) {
    document.getElementById('btn1').disabled = disabled;
    document.getElementById('btn2').disabled = disabled;
    document.getElementById('btn3').disabled = disabled;
}

// --- PERZISZTENCIA ---

function saveDeckState() {
    Storage.set('jetLag_deck', currentDeck);
    Storage.set('jetLag_inventory', inventory);
    Storage.set('jetLag_drawnPool', drawnPool);
    Storage.set('jetLag_activeEffects', activeEffects);
}

// --- PAKLI MŰVELETEK ---

function updateStats() {
    document.getElementById('deck-stats').innerText =
        `Pakli: ${currentDeck.length} / ${ORIGINAL_DECK.length}`;
}

async function resetDeck() {
    if (!(await customConfirm('Biztosan újraindítod a paklit?<br>Minden kártya visszakerül, az inventory törlődik és az aktív hatások megszűnnek.'))) return;

    currentDeck   = [...ORIGINAL_DECK];
    inventory     = [];
    drawnPool     = [];
    activeEffects = [];
    isPaying          = false;
    targetIndex       = -1;
    selectedForDiscard = [];

    saveDeckState();
    updateStats();
    renderInventory();
    renderActiveEffects();
    document.getElementById('selection-area').innerHTML = '';
    setDrawButtons(false);
    updateStatus('');
}

function drawChoice(count) {
    if (isPaying) return;
    if (currentDeck.length < count) {
        showToast('A pakli kiürült! Újrakeverés...', 'warning');
        currentDeck = [...ORIGINAL_DECK];
    }

    setDrawButtons(true);
    drawnPool = [];
    document.getElementById('selection-area').innerHTML = '';

    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * currentDeck.length);
        drawnPool.push(currentDeck.splice(index, 1)[0]);
    }

    saveDeckState();
    renderDrawnPool();
    updateStats();
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

        if (isPaying && index === targetIndex)        cardEl.classList.add('paying');
        if (selectedForDiscard.includes(index))       cardEl.classList.add('selected-to-discard');

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
            <button class="dismiss-btn" onclick="dismissEffect(${index})">TELJESÍTVE / TÖRLÉS</button>
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
    inventory.push(drawnPool[idx]);
    drawnPool = [];
    saveDeckState();
    document.getElementById('selection-area').innerHTML = '';
    setDrawButtons(false);
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
    isPaying          = true;
    targetIndex       = index;
    selectedForDiscard = [];
    updateStatus(`FIZETÉS: Válassz ${card.cost} lapot az eldobáshoz!`);
    renderInventory();
}

function handleDiscardSelection(index) {
    if (index === targetIndex) {
        isPaying          = false;
        targetIndex       = -1;
        selectedForDiscard = [];
        updateStatus('');
        renderInventory();
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
        isPaying          = false;
        targetIndex       = -1;
        selectedForDiscard = [];
        updateStatus('');
        renderInventory();
        return;
    }

    // Indexek csökkenő sorrendben törlése, hogy a splice ne csússzon el
    [...selectedForDiscard, targetIndex]
        .sort((a, b) => b - a)
        .forEach(i => inventory.splice(i, 1));

    activateCardEffect(targetCard);
    saveDeckState();

    isPaying          = false;
    targetIndex       = -1;
    selectedForDiscard = [];
    updateStatus('');
    renderInventory();
    renderActiveEffects();
}

// --- STÁTUSZSOR ---

function updateStatus(msg) {
    const bar = document.getElementById('status-bar');
    bar.innerText  = msg;
    bar.style.display = msg ? 'block' : 'none';
}

// Inicializálás
function initDeck() {
    renderInventory();
    renderActiveEffects();
    updateStats();
    
    // Kezdeti gomb állapot: csak akkor tilos, ha már épp fizetünk
    setDrawButtons(isPaying);
    
    if (drawnPool.length > 0) {
        renderDrawnPool();
        setDrawButtons(true);
    }

    setInterval(updateActiveTimers, 1000);
}
