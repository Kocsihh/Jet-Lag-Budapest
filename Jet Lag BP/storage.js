// =============================================================================
// storage.js – Perzisztencia absztrakció
// Ez a réteg felel az adatok mentéséért és betöltéséért.
// Később, amikor bejön a Firebase, csak ezt a fájlt kell módosítani,
// a többi modul (deck.js, hunyo.js, map.js) automatikusan működni fog.
// =============================================================================

const Storage = {
    /**
     * Kinyer egy értéket a tárolóból.
     * @param {string} key Az azonosító kulcs
     * @param {any} fallback Alapértelmezett érték, ha a kulcs nem létezik
     * @returns {any} A tárolt vagy a fallback érték
     */
    get: (key, fallback = null) => {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.error(`Hiba a '${key}' kulcs beolvasásakor:`, e);
            return fallback;
        }
    },

    /**
     * Elment egy értéket a tárolóba.
     * @param {string} key Az azonosító kulcs
     * @param {any} value A mentendő érték (objektum/tömb is lehet)
     */
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Hiba a '${key}' kulcs mentésekor:`, e);
        }
    },

    /**
     * Töröl egy értéket a tárolóból.
     * @param {string} key Az azonosító kulcs
     */
    remove: (key) => {
        localStorage.removeItem(key);
    }
};
