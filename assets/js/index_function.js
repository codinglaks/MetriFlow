/* MetriFlow home page behaviour */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        // Footer year
        var year = document.getElementById('year');
        if (year) year.textContent = new Date().getFullYear();

        // Header gets a soft shadow once the page scrolls
        var header = document.getElementById('site-header');
        if (header) {
            var onScroll = function () {
                header.classList.toggle('is-scrolled', window.scrollY > 8);
            };
            onScroll();
            window.addEventListener('scroll', onScroll, { passive: true });
        }
    });
})();