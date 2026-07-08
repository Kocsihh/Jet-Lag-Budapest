// Bottom Sheet Confirm Dialog

function initBottomSheet() {
    if (document.getElementById('bottom-sheet-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'bottom-sheet-overlay';
    document.body.appendChild(overlay);

    const sheet = document.createElement('div');
    sheet.id = 'bottom-sheet';
    sheet.innerHTML = `
        <div id="bottom-sheet-inner">
            <div class="sheet-handle"></div>
            <div class="sheet-msg" id="sheet-msg"></div>
            <div class="sheet-buttons">
                <button class="sheet-btn sheet-btn-no" id="sheet-btn-no">Nem</button>
                <button class="sheet-btn sheet-btn-yes" id="sheet-btn-yes">Igen</button>
            </div>
        </div>
    `;
    document.body.appendChild(sheet);
}

/**
 * Show a bottom sheet confirm dialog
 * @param {string} message - The message to display
 * @param {string} yesText - Text for the confirm button
 * @param {string} noText - Text for the cancel button
 * @returns {Promise<boolean>}
 */
function customConfirm(message, yesText = 'Igen', noText = 'Nem') {
    initBottomSheet();
    return new Promise((resolve) => {
        const overlay = document.getElementById('bottom-sheet-overlay');
        const sheet = document.getElementById('bottom-sheet');
        const msgEl = document.getElementById('sheet-msg');
        const btnYes = document.getElementById('sheet-btn-yes');
        const btnNo = document.getElementById('sheet-btn-no');

        msgEl.innerHTML = message;
        btnYes.innerText = yesText;
        btnNo.innerText = noText;

        // Show
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            sheet.classList.add('show');
        });

        const close = (result) => {
            overlay.classList.remove('show');
            sheet.classList.remove('show');
            btnYes.onclick = null;
            btnNo.onclick = null;
            overlay.onclick = null;
            resolve(result);
        };

        btnYes.onclick = () => close(true);
        btnNo.onclick = () => close(false);
        overlay.onclick = () => close(false);
    });
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBottomSheet);
} else {
    initBottomSheet();
}
