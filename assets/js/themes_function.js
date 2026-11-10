/* =========================================================
   MetriFlow | themes_function.js
   Controls the theme on EVERY page.

   - One single button cycles the themes in a loop:
         1 Light  ->  2 Cream  ->  3 Midnight  ->  4 Dark  ->  back to 1 Light ...
   - The chosen theme is saved, so every page (home, calculator, converter)
     opens with the same theme, and other open tabs change too.

   HOW TO USE ON ANY HTML PAGE
     In <head>, before the page's own CSS:
         <link rel="stylesheet" href="../assets/css/themes.css">      (index.html: assets/css/themes.css)
         <script src="../assets/js/themes_function.js"></script>      (no "defer": applies the theme before the page shows)
     In <body>, where the button should appear (usually the header):
         <div data-theme-switcher></div>

   In your own CSS use the variables, e.g.  background: var(--bg);  color: var(--text);
   (the full list is at the top of themes.css)
   ========================================================= */
(function () {
    'use strict';

    var STORAGE_KEY = 'metriflow-theme';

    /* The order here is the loop order */
    var THEMES = [
        { id: 'light',    label: 'Light',    bar: '#ffffff' },
        { id: 'cream',    label: 'Cream',    bar: '#f8f3e8' },
        { id: 'midnight', label: 'Midnight', bar: '#0a1330' },
        { id: 'dark',     label: 'Dark',     bar: '#0e0e10' }
    ];

    /* ---------------------------------------------------------
       Saving. Stored as "theme@time" in localStorage AND in window.name,
       and the newest one wins. window.name keeps the theme when you move
       between pages in the same tab, even when a browser does not share
       localStorage between local files (file://). Values are strictly validated.
       --------------------------------------------------------- */
    function indexOfTheme(id) {
        for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return i;
        return -1;
    }

    function parse(raw) {
        if (typeof raw !== 'string') return null;
        var m = /^([a-z]+)@(\d{1,15})$/.exec(raw);
        if (!m || indexOfTheme(m[1]) === -1) return null;
        return { id: m[1], time: parseInt(m[2], 10) };
    }

    function readSaved() {
        var fromStorage = null, fromName = null;
        try { fromStorage = parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { /* blocked */ }
        var m = /mf-theme=([a-z]+@\d{1,15})/.exec(window.name || '');
        if (m) fromName = parse(m[1]);
        if (fromStorage && fromName) return fromName.time > fromStorage.time ? fromName : fromStorage;
        return fromStorage || fromName;
    }

    function writeSaved(id) {
        var value = id + '@' + Date.now();
        try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* blocked */ }
        window.name = (window.name || '').replace(/mf-theme=[a-z]+@\d+;?/, '') + 'mf-theme=' + value + ';';
    }

    function startingTheme() {
        var saved = readSaved();
        if (saved) return saved.id;
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    /* ---------------------------------------------------------
       Apply
       --------------------------------------------------------- */
    var current = startingTheme();
    var announce = false;              // only speak changes made by the user, not the first load

    function setMetaColour(id) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', THEMES[indexOfTheme(id)].bar);
    }

    function nextOf(id) { return THEMES[(indexOfTheme(id) + 1) % THEMES.length]; }

    function updateButtons() {
        var theme = THEMES[indexOfTheme(current)];
        var next = nextOf(current);
        var buttons = document.querySelectorAll('.theme-toggle');
        for (var i = 0; i < buttons.length; i++) {
            var b = buttons[i];
            b.setAttribute('data-current', current);
            b.setAttribute('aria-label', 'Theme: ' + theme.label + '. Press to switch to ' + next.label + '.');
            b.title = 'Theme: ' + theme.label + ' (next: ' + next.label + ')';
            var name = b.querySelector('.theme-name');
            if (name) name.textContent = theme.label;
            var dots = b.querySelectorAll('.theme-steps i');
            for (var d = 0; d < dots.length; d++) dots[d].className = d === indexOfTheme(current) ? 'on' : '';
        }
        var live = document.querySelectorAll('.theme-sr');
        for (var s = 0; s < live.length; s++) live[s].textContent = announce ? 'Theme changed to ' + theme.label : '';
    }

    function apply(id) {
        current = id;
        document.documentElement.setAttribute('data-theme', id);
        setMetaColour(id);
        updateButtons();
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: id } }));
    }

    function setTheme(id) {
        if (indexOfTheme(id) === -1) return;
        announce = true;
        apply(id);
        writeSaved(id);
    }

    function cycle() { setTheme(nextOf(current).id); }

    /* ---------------------------------------------------------
       Build the button inside <div data-theme-switcher>  (DOM calls only, no innerHTML)
       --------------------------------------------------------- */
    function span(className) {
        var el = document.createElement('span');
        el.className = className;
        return el;
    }

    function buildSwitchers() {
        var holders = document.querySelectorAll('[data-theme-switcher]');
        for (var h = 0; h < holders.length; h++) {
            var box = holders[h];
            if (box.querySelector('.theme-toggle')) continue;

            box.classList.add('theme-switch');

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-toggle';

            var dot = span('theme-dot');   dot.setAttribute('aria-hidden', 'true');
            var name = span('theme-name'); name.setAttribute('aria-hidden', 'true');
            var steps = span('theme-steps'); steps.setAttribute('aria-hidden', 'true');
            for (var i = 0; i < THEMES.length; i++) steps.appendChild(document.createElement('i'));

            btn.appendChild(dot);
            btn.appendChild(name);
            btn.appendChild(steps);

            var live = span('theme-sr');
            live.setAttribute('role', 'status');
            live.setAttribute('aria-live', 'polite');

            box.appendChild(btn);
            box.appendChild(live);
        }
        updateButtons();
    }

    /* ---------------------------------------------------------
       Start
       --------------------------------------------------------- */
    document.documentElement.setAttribute('data-theme', current);   // before first paint

    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.theme-toggle')) cycle();
    });

    // Another tab changed the theme: follow it
    window.addEventListener('storage', function (e) {
        if (e.key !== STORAGE_KEY) return;
        var p = parse(e.newValue);
        if (p && p.id !== current) { announce = false; apply(p.id); }
    });

    // Coming back with the browser Back button: re-check the saved theme
    window.addEventListener('pageshow', function (e) {
        var saved = readSaved();
        if (e.persisted && saved && saved.id !== current) { announce = false; apply(saved.id); }
    });

    function ready() { buildSwitchers(); apply(current); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
    else ready();

    window.MetriFlowTheme = Object.freeze({
        get: function () { return current; },
        set: setTheme,
        next: cycle,
        list: function () { return THEMES.map(function (t) { return t.id; }); }
    });
})();