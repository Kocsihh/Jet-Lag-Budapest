const MAX_PER_ROLE = 3;
let myRoomId = null;
let myUserId = localStorage.getItem('local_userId');
if (!myUserId) {
    myUserId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('local_userId', myUserId);
}

let isHost = false;
let roomRef = null;

function showScreen(id) {
    document.getElementById('screen-join').classList.add('hidden');
    document.getElementById('screen-lobby').classList.add('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function createRoom() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) return showToast("Kérlek írd be a neved!");

    localStorage.setItem('local_playerName', name);

    // Random 4 betűs kód generálása
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    myRoomId = '';
    for (let i = 0; i < 4; i++) {
        myRoomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    isHost = true;
    document.getElementById('btnStartGame').classList.remove('hidden');
    document.getElementById('waitingMsg').classList.add('hidden');

    enterLobby(myRoomId, name);
}

async function joinRoom() {
    const name = document.getElementById('playerName').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();

    if (!name) return showToast("Kérlek írd be a neved!");
    if (!code || code.length !== 4) return showToast("Érvénytelen szobakód!");

    // Check if room exists
    try {
        const snapshot = await db.ref('rooms/' + code).once('value');
        if (!snapshot.exists()) {
            return showToast("Ez a szoba nem létezik!");
        }
    } catch (e) {
        console.error(e);
        return showToast("Hiba történt a csatlakozáskor!");
    }

    localStorage.setItem('local_playerName', name);
    myRoomId = code;
    isHost = false;

    enterLobby(myRoomId, name);
}

function enterLobby(roomId, name) {
    localStorage.setItem('local_roomId', roomId);
    document.getElementById('roomCodeDisplay').innerText = roomId;
    showScreen('screen-lobby');

    roomRef = db.ref('rooms/' + roomId);

    // Ha korábban volt szerepünk, próbáljuk meg azt felvenni visszacsatlakozáskor
    const previousRole = localStorage.getItem('local_role') || 'none';

    // Csatlakozás tényének beírása
    const playerRef = roomRef.child('players/' + myUserId);
    playerRef.set({
        name: name,
        role: previousRole,
        isHost: isHost,
        isOffline: false,
        lastDisconnect: null
    });

    // Ha lecsatlakozik, állítsa offline-ra és mentse el az időt
    playerRef.child('isOffline').onDisconnect().set(true);
    playerRef.child('lastDisconnect').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

    // Figyeljük a szoba változásait
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // HOST CLEANUP LOGIC: Törlés, ha valaki több mint 5 perce (300 000 ms) offline
        if (isHost && data.players) {
            const now = Date.now();
            let changed = false;
            Object.keys(data.players).forEach(uid => {
                const p = data.players[uid];
                if (p.isOffline && p.lastDisconnect && (now - p.lastDisconnect > 5 * 60 * 1000)) {
                    roomRef.child('players/' + uid).remove();
                    changed = true;
                }
            });
            if (changed) return; // wait for next snapshot
        }

        updateLobbyUI(data.players || {});

        // Ha a játék elindult
        if (data.status === 'playing') {
            const myPlayer = data.players[myUserId];
            if (myPlayer && myPlayer.role === 'hider') {
                window.location.href = './deck.html';
            } else if (myPlayer && myPlayer.role === 'seeker') {
                window.location.href = './hunyo.html';
            } else {
                showToast("A játék már fut! Válassz egy szerepet a csatlakozáshoz.", "info", 5000);
                // fel kéne dobni egy ablakot ahol választhat
            }
        }
    });
}
// New function for security against HTML insert
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateLobbyUI(players) {
    let hiderCount = 0;
    let seekerCount = 0;
    const listEl = document.getElementById('playerList');
    listEl.innerHTML = '';

    Object.values(players).forEach(p => {
        let roleIcon = "👀 Nincs szerepe";
        let roleClass = "";
        if (p.role === 'hider') { roleIcon = "🏃 Bújó"; roleClass = "player-hider"; hiderCount++; }
        if (p.role === 'seeker') { roleIcon = "🕵️ Hunyó"; roleClass = "player-seeker"; seekerCount++; }

        let offlineIndicator = p.isOffline ? ' <span style="color:red; font-size:0.8em">(Offline)</span>' : '';

        listEl.innerHTML += `<div class="player-item ${roleClass}">
        <strong>${escapeHtml(p.name)}</strong> ${p.isHost ? '(Host)' : ''} - ${roleIcon}${offlineIndicator} 
        </div>`;
    });

    document.getElementById('countHider').innerText = `${hiderCount}/${MAX_PER_ROLE}`;
    document.getElementById('countSeeker').innerText = `${seekerCount}/${MAX_PER_ROLE}`;

    const btnHider = document.getElementById('btnHider');
    const btnSeeker = document.getElementById('btnSeeker');

    const myPlayer = players[myUserId];

    if (myPlayer && myPlayer.role === 'hider') {
        btnHider.style.border = "2px solid #4CAF50";
        btnSeeker.style.border = "1px solid #333";
    } else if (myPlayer && myPlayer.role === 'seeker') {
        btnSeeker.style.border = "2px solid #2196F3";
        btnHider.style.border = "1px solid #333";
    } else {
        btnHider.style.border = "1px solid #333";
        btnSeeker.style.border = "1px solid #333";
    }

    // Limit disable
    btnHider.disabled = (hiderCount >= MAX_PER_ROLE && (!myPlayer || myPlayer.role !== 'hider'));
    btnSeeker.disabled = (seekerCount >= MAX_PER_ROLE && (!myPlayer || myPlayer.role !== 'seeker'));

    // Host migration logic
    const hasHost = Object.values(players).some(p => p.isHost);
    if (!hasHost) {
        // Nincs host! A legkisebb ID-jű játékos legyen a host
        const playerIds = Object.keys(players).sort();
        if (playerIds.length > 0 && playerIds[0] === myUserId) {
            isHost = true;
            if (roomRef) {
                roomRef.child('players/' + myUserId + '/isHost').set(true);
            }
            showToast("A játékmester kilépett. Te lettél az új játékmester!", "success", 4000);
        }
    }

    // Gomb és üzenet megjelenítése aszerint, hogy host-e
    if (isHost) {
        document.getElementById('btnStartGame').classList.remove('hidden');
        document.getElementById('waitingMsg').classList.add('hidden');
    } else {
        document.getElementById('btnStartGame').classList.add('hidden');
        document.getElementById('waitingMsg').classList.remove('hidden');
    }
}

function selectRole(role) {
    if (roomRef) {
        roomRef.child('players/' + myUserId + '/role').set(role);
        localStorage.setItem('local_role', role);
    }
}

function startGame() {
    if (!roomRef || !isHost) return;

    // Ellenőrizzük a játékosokat
    roomRef.child('players').once('value', (snap) => {
        const players = snap.val() || {};
        const vals = Object.values(players);
        const hiders = vals.filter(p => p.role === 'hider').length;
        const seekers = vals.filter(p => p.role === 'seeker').length;

        if (hiders < 1 || seekers < 1) {
            showToast("Legalább 1 Bújó és 1 Hunyó kell az indításhoz!", 'error', 3000);
            return;
        }

        // Mindenki választott-e szerepet?
        const noRole = vals.filter(p => p.role === 'none').length;
        if (noRole > 0) {
            showToast(`${noRole} játékos még nem választott szerepet!`, 'error', 3000);
            return;
        }

        roomRef.child('status').set('playing');
        roomRef.child('startedAt').set(Date.now());
    });
}

async function TryAutoResume() {
    const savedName = localStorage.getItem('local_playerName');
    const savedRoom = localStorage.getItem('local_roomId');

    if (savedName) {
        document.getElementById('playerName').value = savedName;
    }
    if (!savedName || !savedRoom) {
        console.log("Nincs elegendő adat az auto resume-hoz.")
        return;
    }
    try {
        const snap = await db.ref('rooms/' + savedRoom + '/players/' + myUserId).once('value');
        if (snap.exists()) {
            myRoomId = savedRoom;
            isHost = !!snap.val().isHost;
            enterLobby(myRoomId, savedName);
        }
        else {
            localStorage.removeItem('local_roomId');
        }
    }
    catch (e) {
        console.error("Auto resume failed:", e)
    }
}



TryAutoResume();
window.addEventListener('load', TryAutoResume);

// Cleanup: Üres szobák törlése
if (typeof db !== 'undefined') {
    db.ref('rooms').once('value', snapshot => {
        const rooms = snapshot.val();
        if (!rooms) return;

        const now = Date.now();
        const OFFLINE_GRACE = 10 * 60 * 1000;

        for (const roomId in rooms) {
            const room = rooms[roomId];
            const players = room.players || {};
            const playerList = Object.values(players);

            const hasNoPlayers = playerList.length === 0;
            const allOfflineAndStale = playerList.length > 0 && playerList.every(p =>
                p.isOffline && p.lastDisconnect && (now - p.lastDisconnect > OFFLINE_GRACE)
            );

            if (hasNoPlayers || allOfflineAndStale) {
                db.ref('rooms/' + roomId).remove();
            }
        }
    }).catch(e => console.error("Cleanup error:", e));
}