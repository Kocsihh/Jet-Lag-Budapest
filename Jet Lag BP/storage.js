// =============================================================================
// storage.js – Firebase Sync Engine
// Ez a réteg felel az adatok mentéséért és betöltéséért valós időben.
// A 'local_' prefix-szel kezdődő kulcsokat csak a helyi böngészőbe menti.
// =============================================================================

const Storage = {
    _data: {},
    _dbRef: null,
    isSynced: false,

    /**
     * Inicializálja a Firebase szinkronizációt egy adott szobához.
     * @param {string} roomId A szobakód (pl. "X7B9")
     * @param {function} onUpdateCallback Függvény, ami lefut ha frissülnek az adatok a hálózaton
     */
    init: async function (roomId, onUpdateCallback) {
        if (!roomId) {
            console.warn("Nincs szobakód, a Storage csak lokálisan működik!");
            return;
        }
        if (typeof db === 'undefined') {
            this.isSynced = false;
            console.error("A Firebase db objektum nem érhető el.")
            return;
        }
        this.isSynced = true;
        this._dbRef = db.ref('rooms/' + roomId + '/gameState');

        // RECONNECTION FIX: Jelezzük a szervernek, hogy visszatértünk a játékba (már nem vagyunk offline)
        const myUserId = localStorage.getItem('local_userId');
        if (myUserId) {
            const playerRef = db.ref('rooms/' + roomId + '/players/' + myUserId);
            playerRef.child('isOffline').set(false);
            playerRef.child('lastDisconnect').set(null);
            // Ha ez a lap bezárul, újra legyünk offline
            playerRef.child('isOffline').onDisconnect().set(true);
            playerRef.child('lastDisconnect').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        }

        return new Promise((resolve) => {
            // Feliratkozás a változásokra
            this._dbRef.on('value', (snapshot) => {
                this._data = snapshot.val() || {};
                if (onUpdateCallback) onUpdateCallback();
                resolve(); // Első betöltés
            }, (error) => {
                console.error("Storage szinkronizációs hiba: ", error);
                resolve();
            });
        });
    },

    // Refactored: Firebase || Local
    _useLocal: function (key) {
        return key.startsWith('local_') || !this.isSynced;
    },

    /**
     * Kinyer egy értéket a tárolóból (Firebase vagy localStorage).
     */
    get: function (key, fallback = null) {
        if (this._useLocal(key)) {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        }
        return this._data[key] !== undefined ? this._data[key] : fallback;
    },

    /**
     * Elment egy értéket a tárolóba (Firebase vagy localStorage).
     */
    set: function (key, value) {
        if (this._useLocal(key)) {
            localStorage.setItem(key, JSON.stringify(value));
            return;
        }
        this._data[key] = value;
        if (this._dbRef) {
            this._dbRef.child(key).set(value);
        }
    },

    /**
     * Töröl egy értéket a tárolóból.
     */
    remove: function (key) {
        if (this._useLocal(key)) {
            localStorage.removeItem(key);
            return;
        }
        delete this._data[key];
        if (this._dbRef) {
            this._dbRef.child(key).remove();
        }
    },

    /**
     * Több értéket frissít egyszerre (hogy elkerüljük a sok onValue triggerelést).
     */
    update: function (updates) {
        if (!this.isSynced) {
            for (let k in updates) {
                localStorage.setItem(k, JSON.stringify(updates[k]));
            }
            return;
        }

        Object.assign(this._data, updates);
        if (this._dbRef) {
            this._dbRef.update(updates);
        }
    }
};
