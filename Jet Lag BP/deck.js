const originalDeck = [
    // TIPUSOK: Idő (Cost 0), Átok (Cost 1-2), Speciális (Cost 1-2)
    // --- IDŐKÁRTYÁK (20 db - Ingyenes) ---
    { nev: "Idő +2p", tipus: "Idő", cost: 0, leiras: "+2 perc egérút." },
    { nev: "Idő +2p", tipus: "Idő", cost: 0, leiras: "+2 perc egérút." },
    { nev: "Idő +2p", tipus: "Idő", cost: 0, leiras: "+2 perc egérút." },
    { nev: "Idő +2p", tipus: "Idő", cost: 0, leiras: "+2 perc egérút." },
    { nev: "Idő +2p", tipus: "Idő", cost: 0, leiras: "+2 perc egérút." },
    { nev: "Idő +3p", tipus: "Idő", cost: 0, leiras: "+3 perc egérút." },
    { nev: "Idő +3p", tipus: "Idő", cost: 0, leiras: "+3 perc egérút." },
    { nev: "Idő +3p", tipus: "Idő", cost: 0, leiras: "+3 perc egérút." },
    { nev: "Idő +3p", tipus: "Idő", cost: 0, leiras: "+3 perc egérút." },
    { nev: "Idő +3p", tipus: "Idő", cost: 0, leiras: "+3 perc egérút." },
    { nev: "Idő +5p", tipus: "Idő", cost: 0, leiras: "+5 perc egérút." },
    { nev: "Idő +5p", tipus: "Idő", cost: 0, leiras: "+5 perc egérút." },
    { nev: "Idő +5p", tipus: "Idő", cost: 0, leiras: "+5 perc egérút." },
    { nev: "Idő +7p", tipus: "Idő", cost: 0, leiras: "+7 perc egérút." },
    { nev: "Idő +7p", tipus: "Idő", cost: 0, leiras: "+7 perc egérút." },
    { nev: "Idő +10p", tipus: "Idő", cost: 0, leiras: "+10 perc egérút." },
    { nev: "Idő +10p", tipus: "Idő", cost: 0, leiras: "+10 perc egérút." },
    { nev: "Idő +15p", tipus: "Idő", cost: 0, leiras: "+15 perc egérút." },
    { nev: "Idő +15p", tipus: "Idő", cost: 0, leiras: "+15 perc egérút." },
    { nev: "Idő +20p", tipus: "Idő", cost: 0, leiras: "A Játékmester kegye." },
    { nev: "Idő +5%", tipus: "Idő", cost: 0, leiras: "Az addigi összes bónusz időt növeli 5%-kal." },

    // 15 átok kártya
    { nev: "Beragadt ajtó", tipus: "Átok", cost: 1, leiras: "Ajtón áthaladásnál (épület/jármű) 2 kockával 7+ dobás kell. Ha nem sikerül: 5p várakozás és újra amíg nem sikerül." },
    { nev: "Kátyú-átok", tipus: "Átok", cost: 1, leiras: "Keressetek 3 kátyút (min. 20cm) 3 különböző utcában (fotó!)." },
    { nev: "Váltságdíj levél", tipus: "Átok", cost: 2, leiras: "A következő kérdést nyomtatott anyagból kivágott betűkből kell összerakni (min. 5 szó)." },
    { nev: "Falatozóna", tipus: "Átok", cost: 1, leiras: "Menjetek egy Falatozónába, kóstoljatok valami újat és mondjatok véleményt." },
    { nev: "Falatozóna", tipus: "Átok", cost: 1, leiras: "Menjetek egy Falatozónába, kóstoljatok valami újat és mondjatok véleményt." },
    { nev: "Merész tipp", tipus: "Átok", cost: 2, leiras: "Hunyók tippelnek: ha eltalálják, a búvó vall. Ha nem: 27p kényszerpihenő a hunyóknak." },
    { nev: "ChatGPT-metró", tipus: "Átok", cost: 2, leiras: "A ChatGPT mond egy random metrómegállót, oda el kell utazni (átmehetsz rajta)." },
    { nev: "Virágzó otthon", tipus: "Átok", cost: 1, leiras: "A búvó zónája 50%-kal nő. " },
    { nev: "Szívecske", tipus: "Átok", cost: 1, leiras: "Keressetek egy szívecske szimbólumot a környéken, mielőtt kérdezhetnétek." },
    { nev: "Cápa-átok", tipus: "Átok", cost: 2, leiras: "25 percig tilos megállni (folyamatos gyaloglás)." },
    { nev: "Metró-zár", tipus: "Átok", cost: 2, leiras: "30 percig tilos a metró használata." },
    { nev: "Páratlan járatok", tipus: "Átok", cost: 1, leiras: "30 percig csak páratlan számú járattal közlekedhettek." },
    { nev: "Páros járatok", tipus: "Átok", cost: 1, leiras: "30 percig csak páros számú járattal közlekedhettek." },
    { nev: "Zászló-vadász", tipus: "Átok", cost: 1, leiras: "Találjatok magyar zászlót. Fotóval bizonyítva." },
    { nev: "Széchenyi Terv", tipus: "Átok", cost: 1, leiras: "Fotózzatok EU-s táblát." },
    { nev: "Blokád", tipus: "Átok", cost: 0, leiras: "Következő metró megvárása." },
    { nev: "Akasztófa", tipus: "Átok", cost: 1, leiras: "Győzzetek akasztófában a bújó ellen. Ha nem sikerült: 10p várakozás." },
    { nev: "Vágányzár v1", tipus: "Átok", cost: 0, leiras: "M3-M1 vonal tiltva 15 percig." },
    { nev: "Vágányzár v2", tipus: "Átok", cost: 0, leiras: "M2-M4 vonal tiltva 15 percig." },
    { nev: "Zebra-fóbia", tipus: "Átok", cost: 1, leiras: "Felszínen tilos a zebra 30p-ig." },
    { nev: "Duna-zár", tipus: "Átok", cost: 1, leiras: "20p-ig tilos átkelni a folyón." },
    { nev: "Aprópénz", tipus: "Átok", cost: 1, leiras: "Keress egy 100-ast. (pl: automata)" },
    { nev: "Szobor-fotó", tipus: "Átok", cost: 1, leiras: "Fotózz egy szobrot bárhol." },
    { nev: "BKK Hírek", tipus: "Átok", cost: 0, leiras: "Olvass fel egy kijelző-hírt videóban." },
    { nev: "Táv-dobás", tipus: "Átok", cost: 1, leiras: "Dobj egy 5-ös vagy nagyobb értéket egy kockával úgy hogy legalább 30 méter messze dobod lol" },

    // --- SPECIÁLIS KÁRTYÁK (20 db) ---
    { nev: "Vétó", tipus: "Speciális", cost: 0, leiras: "Kérdés törlése." },
    { nev: "Vétó", tipus: "Speciális", cost: 0, leiras: "Kérdés törlése." },
    { nev: "Randomizálás", tipus: "Speciális", cost: 0, leiras: "Kocka dönt a kérdésről." },
    { nev: "Randomizálás", tipus: "Speciális", cost: 0, leiras: "Kocka dönt a kérdésről." },
    { nev: "Másolás", tipus: "Speciális", cost: 0, leiras: "Egy kártya másolása." },
    { nev: "Átszállójegy", tipus: "Speciális", cost: 0, leiras: "Tilos vonalváltás 10p-ig." },
    { nev: "Irányváltó", tipus: "Speciális", cost: 0, leiras: "A Húnyók azonnal szálljanak le és menjenek vissza 2 megállót, ha vonalon vannak." },
    { nev: "Szuper-Vétó", tipus: "Speciális", cost: 0, leiras: "Kérdés + Hunyó kérdés kuka." },
    { nev: "Kiürült agy", tipus: "Speciális", cost: 1, leiras: "3 tiltott kérdés 1-1 kategórián belül." }
];

let currentDeck = JSON.parse(localStorage.getItem('jetLag_deck')) || [...originalDeck];
let inventory = JSON.parse(localStorage.getItem('jetLag_inventory')) || [];
let drawnPool = JSON.parse(localStorage.getItem('jetLag_drawnPool')) || [];

// Cost payment state
let isPaying = false;
let targetIndex = -1;
let selectedForDiscard = [];

function saveDeckState() {
    localStorage.setItem('jetLag_deck', JSON.stringify(currentDeck));
    localStorage.setItem('jetLag_inventory', JSON.stringify(inventory));
    localStorage.setItem('jetLag_drawnPool', JSON.stringify(drawnPool));
}

function updateStats() {
    document.getElementById('deck-stats').innerText = `Pakli: ${currentDeck.length} / ${originalDeck.length}`;
}

function resetDeck() {
    if (confirm("Biztosan újraindítod a paklit? Minden kártya visszakerül, az inventory törlődik.")) {
        currentDeck = [...originalDeck];
        inventory = [];
        drawnPool = [];
        isPaying = false;
        targetIndex = -1;
        selectedForDiscard = [];
        saveDeckState();
        updateStats();
        renderInventory();
        document.getElementById('selection-area').innerHTML = '';
        document.getElementById('btn1').disabled = false;
        document.getElementById('btn2').disabled = false;
        document.getElementById('btn3').disabled = false;
        updateStatus("");
    }
}

function drawChoice(count) {
    if (isPaying) return;
    if (currentDeck.length < count) { 
        alert("A pakli kiürült! Újrakeverés...");
        currentDeck = [...originalDeck]; 
    }

    document.getElementById('btn1').disabled = true;
    document.getElementById('btn2').disabled = true;
    document.getElementById('btn3').disabled = true;

    drawnPool = [];
    const area = document.getElementById('selection-area');
    area.innerHTML = '';

    for (let i = 0; i < count; i++) {
        let index = Math.floor(Math.random() * currentDeck.length);
        let card = currentDeck.splice(index, 1)[0];
        drawnPool.push(card);
    }
    
    saveDeckState();
    renderDrawnPool();
    updateStats();
}

function renderDrawnPool() {
    const area = document.getElementById('selection-area');
    area.innerHTML = '';
    drawnPool.forEach((card, i) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card type-${card.tipus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
        cardEl.innerHTML = renderCardContent(card);
        cardEl.onclick = () => keepCard(i);
        area.appendChild(cardEl);
    });
}

function renderCardContent(card) {
    let dots = "";
    for (let i = 0; i < card.cost; i++) dots += '<div class="cost-dot"></div>';
    return `
        <div class="cost-indicator">${dots}</div>
        <div class="type">${card.tipus}</div>
        <div class="name">${card.nev}</div>
        <div class="desc">${card.leiras}</div>
    `;
}

function keepCard(idx) {
    inventory.push(drawnPool[idx]);
    drawnPool = [];
    saveDeckState();
    document.getElementById('selection-area').innerHTML = '';
    document.getElementById('btn1').disabled = false;
    document.getElementById('btn2').disabled = false;
    document.getElementById('btn3').disabled = false;
    renderInventory();
}

function renderInventory() {
    const display = document.getElementById('inventory-display');
    display.innerHTML = '';
    inventory.forEach((card, index) => {
        const invCard = document.createElement('div');
        invCard.className = `card inventory-card type-${card.tipus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
        if (isPaying && index === targetIndex) invCard.classList.add('paying');
        if (selectedForDiscard.includes(index)) invCard.classList.add('selected-to-discard');

        invCard.innerHTML = renderCardContent(card);
        invCard.onclick = () => handleInventoryClick(index);
        display.appendChild(invCard);
    });
}

function handleInventoryClick(index) {
    if (!isPaying) {
        startUsage(index);
    } else {
        handleDiscardSelection(index);
    }
}

function startUsage(index) {
    const card = inventory[index];
    if (card.cost === 0) {
        if (confirm(`Kijátszod: ${card.nev}?`)) {
            inventory.splice(index, 1);
            saveDeckState();
            renderInventory();
        }
    } else {
        if (inventory.length <= card.cost) {
            alert("Nincs elég kártyád az inventory-ban a költség kifizetéséhez!");
            return;
        }
        isPaying = true;
        targetIndex = index;
        selectedForDiscard = [];
        updateStatus(`FIZETÉS: Válassz ${card.cost} lapot az eldobáshoz!`);
        renderInventory();
    }
}

function handleDiscardSelection(index) {
    if (index === targetIndex) {
        isPaying = false;
        targetIndex = -1;
        selectedForDiscard = [];
        updateStatus("");
        renderInventory();
        return;
    }

    if (selectedForDiscard.includes(index)) {
        selectedForDiscard = selectedForDiscard.filter(i => i !== index);
    } else {
        if (selectedForDiscard.length < inventory[targetIndex].cost) {
            selectedForDiscard.push(index);
        }
    }

    if (selectedForDiscard.length === inventory[targetIndex].cost) {
        finalizeUsage();
    } else {
        renderInventory();
    }
}

function finalizeUsage() {
    const cardName = inventory[targetIndex].nev;
    if (confirm(`Kifizeted a költséget és használod a következőt: ${cardName}?`)) {
        let indicesToRemove = [...selectedForDiscard, targetIndex].sort((a, b) => b - a);
        indicesToRemove.forEach(i => inventory.splice(i, 1));
        saveDeckState();
    }
    isPaying = false;
    targetIndex = -1;
    selectedForDiscard = [];
    updateStatus("");
    renderInventory();
}

function updateStatus(msg) {
    const bar = document.getElementById('status-bar');
    if (msg) {
        bar.innerText = msg;
        bar.style.display = 'block';
    } else {
        bar.style.display = 'none';
    }
}

// Init
window.addEventListener('load', () => {
    updateStats();
    renderInventory();
    if (drawnPool.length > 0) {
        renderDrawnPool();
        document.getElementById('btn1').disabled = true;
        document.getElementById('btn2').disabled = true;
        document.getElementById('btn3').disabled = true;
    }
});
