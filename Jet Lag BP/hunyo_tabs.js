// =============================================================================
// hunyo_tabs.js – Tab logika a Hunyó Központhoz
// Kezeli a váltást a Kérdések és a Térkép között.
// =============================================================================

function switchHunyoTab(tabId) {
    // 1. Hide all tabs and deactivate all buttons
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // 2. Show the selected tab and activate its button
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`tab-btn-${tabId}`).classList.add('active');

    // 3. Save current tab to storage so it persists across refreshes
    Storage.set('jetLag_hunyoTab', tabId);

    // 4. Special logic for Google Maps when it becomes visible
    if (tabId === 'map') {
        if (typeof map !== 'undefined' && map !== null) {
            // Google Maps needs this after container becomes visible
            setTimeout(() => {
                google.maps.event.trigger(map, 'resize');
                // optionally pan back to center:
                // map.setCenter(bpCenter);
            }, 100);
        }
    }
}

// Inicializálás az oldal betöltésekor
window.addEventListener('load', () => {
    // Init Hunyo logic
    if (typeof initHunyo === 'function') {
        initHunyo();
    }

    // Init Map logic
    if (typeof initMap === 'function') {
        initMap();
    }

    // Restore last active tab
    const lastTab = Storage.get('jetLag_hunyoTab', 'questions');
    switchHunyoTab(lastTab);
});
