(function () {
    /**
     * TRIO ASSISTANT - DEEP MASKING (MAIN WORLD)
     * This script runs at document_start in the MAIN world to bypass iframe detection.
     */
    try {
        if (window.self === window.top) return; // Not in an iframe, no masking needed

        console.log('🛡️ [TRIO] Applying Deep Masking (MAIN WORLD)...');

        // Proxy window.top and window.parent to point to self
        const maskProperty = (obj, prop, value) => {
            try {
                Object.defineProperty(obj, prop, {
                    get: () => value,
                    set: () => { },
                    configurable: true
                });
            } catch (e) { }
        };

        maskProperty(window, 'top', window.self);
        maskProperty(window, 'parent', window.self);
        maskProperty(window, 'frameElement', null);

        // Mask navigator properties that indicate automation or framing
        maskProperty(navigator, 'webdriver', false);

        // Intercept postMessage to prevent "frame-check" signals if they happen
        const originalPostMessage = window.postMessage;
        window.postMessage = function (message, targetOrigin, transfer) {
            if (message && typeof message === 'string' && message.includes('frame-check')) {
                return;
            }
            return originalPostMessage.apply(this, arguments);
        };

        // Suppress errors related to cross-origin access that might trigger detection
        window.addEventListener('error', (e) => {
            if (e.message?.includes('cross-origin')) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }, true);

    } catch (e) {
        console.warn('⚠️ [TRIO] Masking Error:', e);
    }
})();
