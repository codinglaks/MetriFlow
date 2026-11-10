/* =========================================================
   MetriFlow | about_function.js
   - highlights the section you are reading in the "On this page" bar
   - copies the UPI ID
   - shows the "Open in UPI app" button on touch devices
   - sets the footer year
   Nothing here builds HTML from text, and nothing is sent anywhere.
   ========================================================= */
(function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    document.addEventListener('DOMContentLoaded', function () {
        var year = $('year');
        if (year) year.textContent = new Date().getFullYear();

        /* ---------- Active section in the jump bar ---------- */
        var toc = $('toc');
        var links = toc ? toc.querySelectorAll('a[href^="#"]') : [];
        var byId = {};
        for (var i = 0; i < links.length; i++) byId[links[i].getAttribute('href').slice(1)] = links[i];

        function setActive(id) {
            for (var key in byId) {
                if (Object.prototype.hasOwnProperty.call(byId, key)) {
                    var on = key === id;
                    byId[key].classList.toggle('is-active', on);
                    if (on) byId[key].setAttribute('aria-current', 'true');
                    else byId[key].removeAttribute('aria-current');
                }
            }
            var current = byId[id];
            if (current && toc.scrollWidth > toc.clientWidth) {             // keep the active chip in view (sideways only)
                toc.scrollTo({ left: Math.max(0, current.offsetLeft - toc.clientWidth / 2 + current.offsetWidth / 2), behavior: 'smooth' });
            }
        }

        var sections = document.querySelectorAll('[data-section]');
        if ('IntersectionObserver' in window && sections.length) {
            var visible = {};
            var observer = new IntersectionObserver(function (entries) {
                for (var e = 0; e < entries.length; e++) visible[entries[e].target.id] = entries[e].isIntersecting;
                for (var s = 0; s < sections.length; s++) {                  // first visible section from the top wins
                    if (visible[sections[s].id]) { setActive(sections[s].id); break; }
                }
            }, { rootMargin: '-25% 0px -60% 0px' });
            for (var s = 0; s < sections.length; s++) observer.observe(sections[s]);
        }

        /* ---------- Copy the UPI ID ---------- */
        var copyBtn = $('btn-copy-upi'), upi = $('upi-id'), label = $('copy-label'), status = $('copy-status'), use = $('copy-use');
        var timer = null;

        function done(ok) {
            if (label) label.textContent = ok ? 'Copied' : 'Copy UPI ID';
            if (use) use.setAttribute('href', ok ? '#i-check' : '#i-copy');
            if (status) status.textContent = ok ? 'UPI ID copied.' : 'Copy is not available here. Please copy the ID by hand.';
            clearTimeout(timer);
            timer = setTimeout(function () {
                if (label) label.textContent = 'Copy UPI ID';
                if (use) use.setAttribute('href', '#i-copy');
                if (status) status.textContent = '';
            }, 2000);
        }

        function fallbackCopy(text) {
            var t = document.createElement('textarea');
            t.value = text;
            t.className = 'sr-only';
            t.setAttribute('readonly', '');
            document.body.appendChild(t);
            t.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            document.body.removeChild(t);
            done(ok);
        }

        if (copyBtn && upi) {
            copyBtn.addEventListener('click', function () {
                var text = upi.textContent.trim();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text); });
                } else {
                    fallbackCopy(text);
                }
            });
        }

        /* ---------- UPI app link: only useful on phones and tablets ---------- */
        var appBtn = $('btn-upi-app');
        if (appBtn && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) appBtn.hidden = false;
    });
})();