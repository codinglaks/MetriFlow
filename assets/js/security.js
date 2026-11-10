/* =========================================================
   MetriFlow | security.js   (load first in <head> on every page)
   - Click-jacking protection: if the page is shown inside someone else's
     frame, break out of it (a server header does this better, see _headers).
   - Cuts the link to any window that opened this page.
   ========================================================= */
(function () {
    'use strict';

    try {
        if (window.top !== window.self) {
            document.documentElement.style.display = 'none';   // hide while framed
            window.top.location.href = window.self.location.href;
        }
    } catch (e) {
        document.documentElement.style.display = 'none';       // cross-origin frame: stay hidden
    }

    try { if (window.opener) window.opener = null; } catch (e) { /* ignore */ }
})();