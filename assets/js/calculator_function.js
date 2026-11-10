/* =========================================================
   MetriFlow | calculator_function.js
   The calculator screen: keys, display, memory, history, keyboard.
   All maths is done by calculator_engine.js (safe parser, no eval).
   Security rules followed here:
     - text is only ever shown with textContent (never innerHTML)
     - everything typed or pasted is filtered by Engine.sanitize()
     - saved history is validated again when it is loaded
   ========================================================= */
(function () {
    'use strict';

    var Engine = window.MetriFlowEngine;
    if (!Engine) return;

    var MAX_LEN = Engine.MAX_LEN;
    var HISTORY_MAX = 50;
    var HISTORY_KEY = 'metriflow-calc-history';
    var MODES = ['deg', 'rad', 'grad'];
    var MODE_LABEL = { deg: 'DEG', rad: 'RAD', grad: 'GRAD' };
    var SVG_NS = 'http://www.w3.org/2000/svg';

    function $(id) { return document.getElementById(id); }

    var expr = $('expr'), result = $('result'), statusEl = $('status'), announceEl = $('announce');
    var btnAngle = $('btn-angle'), btn2nd = $('btn-2nd'), btnHyp = $('btn-hyp'), btnCopy = $('btn-copy');
    var indAngle = $('ind-angle'), ind2nd = $('ind-2nd'), indHyp = $('ind-hyp'), indMem = $('ind-mem');
    var panel = $('history-panel'), list = $('history-list'), emptyNote = $('history-empty');
    var btnHistory = $('btn-history'), btnClearHistory = $('btn-clear-history');
    if (!expr || !result) return;

    var state = {
        mode: 'deg', second: false, hyp: false,
        ans: 0, fresh: false,
        mem: 0, hasMem: false,
        shownRaw: '', history: []
    };

    /* ---------------------------------------------------------
       Key layout
       l = label, v = text inserted, a = spoken name, c = colour class
       s = with 2nd, h = with Hyp, sh = with both
       --------------------------------------------------------- */
    var SCI = [
        { l: 'sin', v: 'sin(', a: 'Sine', s: { l: 'sin⁻¹', v: 'asin(', a: 'Inverse sine' }, h: { l: 'sinh', v: 'sinh(', a: 'Hyperbolic sine' }, sh: { l: 'sinh⁻¹', v: 'asinh(', a: 'Inverse hyperbolic sine' } },
        { l: 'cos', v: 'cos(', a: 'Cosine', s: { l: 'cos⁻¹', v: 'acos(', a: 'Inverse cosine' }, h: { l: 'cosh', v: 'cosh(', a: 'Hyperbolic cosine' }, sh: { l: 'cosh⁻¹', v: 'acosh(', a: 'Inverse hyperbolic cosine' } },
        { l: 'tan', v: 'tan(', a: 'Tangent', s: { l: 'tan⁻¹', v: 'atan(', a: 'Inverse tangent' }, h: { l: 'tanh', v: 'tanh(', a: 'Hyperbolic tangent' }, sh: { l: 'tanh⁻¹', v: 'atanh(', a: 'Inverse hyperbolic tangent' } },
        { l: 'log', v: 'log(', a: 'Logarithm base 10', s: { l: '10ˣ', v: '10^(', a: 'Ten to the power' } },
        { l: 'ln', v: 'ln(', a: 'Natural logarithm', s: { l: 'eˣ', v: 'e^(', a: 'E to the power' } },

        { l: 'x²', v: '^2', a: 'Square', s: { l: 'x³', v: '^3', a: 'Cube' } },
        { l: 'xʸ', v: '^(', a: 'Power', s: { l: 'ʸ√x', v: 'root(', a: 'Nth root, type the root first' } },
        { l: '√x', v: '√(', a: 'Square root', s: { l: '∛x', v: '∛(', a: 'Cube root' } },
        { l: '1/x', v: '1÷(', a: 'Reciprocal', s: { l: '|x|', v: 'abs(', a: 'Absolute value' } },
        { l: 'n!', v: '!', a: 'Factorial' },

        { l: 'nCr', v: 'nCr(', a: 'Combinations' },
        { l: 'nPr', v: 'nPr(', a: 'Permutations' },
        { l: 'mod', v: ' mod ', a: 'Modulo' },
        { l: 'EXP', v: 'E', a: 'Times ten to the power' },
        { l: ',', v: ',', a: 'Comma' },

        { l: 'π', v: 'π', a: 'Pi' },
        { l: 'e', v: 'e', a: 'Euler number' },
        { l: 'Ans', v: 'Ans', a: 'Previous answer' },
        { l: 'Rand', v: 'rand()', a: 'Random number' },
        { l: 'log₂', v: 'log2(', a: 'Logarithm base 2' },

        { l: '(', v: '(', a: 'Open bracket' },
        { l: ')', v: ')', a: 'Close bracket' },
        { l: '⌊x⌋', v: 'floor(', a: 'Round down' },
        { l: '⌈x⌉', v: 'ceil(', a: 'Round up' },
        { l: 'rnd', v: 'round(', a: 'Round to nearest' }
    ];

    var MAIN = [
        { l: 'AC', act: 'ac', c: 'key-clear', a: 'All clear' },
        { l: '⌫', act: 'back', icon: 'i-backspace', a: 'Backspace' },
        { l: '%', v: '%', a: 'Percent' },
        { l: '÷', v: '÷', c: 'key-op', a: 'Divide' },

        { l: '7', v: '7', c: 'key-num' }, { l: '8', v: '8', c: 'key-num' }, { l: '9', v: '9', c: 'key-num' },
        { l: '×', v: '×', c: 'key-op', a: 'Multiply' },

        { l: '4', v: '4', c: 'key-num' }, { l: '5', v: '5', c: 'key-num' }, { l: '6', v: '6', c: 'key-num' },
        { l: '−', v: '−', c: 'key-op', a: 'Subtract' },

        { l: '1', v: '1', c: 'key-num' }, { l: '2', v: '2', c: 'key-num' }, { l: '3', v: '3', c: 'key-num' },
        { l: '+', v: '+', c: 'key-op', a: 'Add' },

        { l: '±', act: 'sign', c: 'key-num', a: 'Change sign' },
        { l: '0', v: '0', c: 'key-num' },
        { l: '.', v: '.', c: 'key-num', a: 'Decimal point' },
        { l: '=', act: 'eq', c: 'key-eq', a: 'Equals' }
    ];

    var keyDefs = [];

    function buildKeys(container, defs) {
        for (var i = 0; i < defs.length; i++) {
            var d = defs[i];
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'key ' + (d.c || 'key-fn');
            b.setAttribute('data-id', String(keyDefs.length));
            keyDefs.push(d);
            d.el = b;
            container.appendChild(b);
        }
    }

    function iconNode(id) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'icon');
        svg.setAttribute('aria-hidden', 'true');
        var use = document.createElementNS(SVG_NS, 'use');
        use.setAttribute('href', '#' + id);
        svg.appendChild(use);
        return svg;
    }

    function variantOf(d) {
        if (state.second && state.hyp && d.sh) return d.sh;
        if (state.hyp && d.h) return d.h;
        if (state.second && d.s) return d.s;
        return d;
    }

    function refreshKeys() {
        for (var i = 0; i < keyDefs.length; i++) {
            var d = keyDefs[i], v = variantOf(d), b = d.el;
            if (d.icon) {
                if (!b.firstChild) b.appendChild(iconNode(d.icon));
            } else if (b.textContent !== v.l) {
                b.textContent = v.l;
            }
            b.setAttribute('aria-label', v.a || v.l);
            b.classList.toggle('is-alt', v !== d);
        }
        btn2nd.setAttribute('aria-pressed', String(state.second));
        btnHyp.setAttribute('aria-pressed', String(state.hyp));
        ind2nd.hidden = !state.second;
        indHyp.hidden = !state.hyp;
    }

    /* ---------------------------------------------------------
       Small helpers
       --------------------------------------------------------- */
    var statusTimer = null;
    function say(message) {
        statusEl.textContent = message;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(function () { statusEl.textContent = ''; }, 2500);
    }

    function caretEnd() {
        var n = expr.value.length;
        try { expr.setSelectionRange(n, n); } catch (e) { /* ignore */ }
    }

    function focusExpr() {
        try { expr.focus({ preventScroll: true }); } catch (e) { expr.focus(); }
    }

    function isPlainNumber(text) {
        return /^\s*[−+]?(\d+\.?\d*|\.\d+)(E[+−]?\d+)?\s*$/.test(text);
    }

    function startsWithOperator(text) {
        return '+−×÷^!%'.indexOf(text.charAt(0)) !== -1 || text.indexOf(' mod') === 0;
    }

    /* ---------------------------------------------------------
       Display
       --------------------------------------------------------- */
    function show(text, kind) {
        result.textContent = text;
        result.classList.toggle('is-preview', kind === 'preview');
        result.classList.toggle('is-error', kind === 'error');
        result.classList.toggle('is-long', kind !== 'error' && text.length > 12);
    }

    function showValue(value, kind) {
        show(Engine.format(value, true), kind);
        state.shownRaw = Engine.format(value, false);
    }

    function showError(code) {
        show(Engine.MESSAGES[code] || Engine.MESSAGES.SYNTAX, 'error');
        state.shownRaw = '';
    }

    // Live preview while typing: only shows a value, never an error
    function update() {
        var text = expr.value;
        state.shownRaw = '';
        if (!text.trim()) { show('0', 'idle'); return; }
        var res = Engine.evaluate(text, { mode: state.mode, ans: state.ans });
        if (res.ok && !isPlainNumber(text)) showValue(res.value, 'preview');
        else show('', 'idle');
    }

    /* ---------------------------------------------------------
       Editing
       --------------------------------------------------------- */
    function insertText(text) {
        text = Engine.sanitize(text);
        if (!text) return;

        if (state.fresh) {                              // right after "=": continue from the answer or start again
            expr.value = startsWithOperator(text) ? 'Ans' : '';
            state.fresh = false;
            caretEnd();
        }

        var start = expr.selectionStart, end = expr.selectionEnd;
        if (start == null) { start = end = expr.value.length; }
        var next = expr.value.slice(0, start) + text + expr.value.slice(end);
        if (next.length > MAX_LEN) { say('Maximum length reached'); return; }

        expr.value = next;
        var pos = start + text.length;
        try { expr.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
        update();
        focusExpr();
    }

    var TOKEN_END = /(?:asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|log2|log|ln|exp|sqrt|cbrt|abs|floor|ceil|round|nCr|nPr|root|rand|fact)\($|√\($|∛\($|Ans$| mod $/;

    function backspace() {
        state.fresh = false;
        var s = expr.selectionStart, e = expr.selectionEnd;
        if (s == null) { s = e = expr.value.length; }
        var v = expr.value;
        if (s !== e) {
            expr.value = v.slice(0, s) + v.slice(e);
        } else if (s > 0) {
            var m = TOKEN_END.exec(v.slice(0, s));
            var n = m ? m[0].length : 1;
            expr.value = v.slice(0, s - n) + v.slice(s);
            s -= n;
        }
        try { expr.setSelectionRange(s, s); } catch (err) { /* ignore */ }
        update();
        focusExpr();
    }

    function clearAll() {
        expr.value = '';
        state.fresh = false;
        update();
        focusExpr();
    }

    function toggleSign() {
        if (state.fresh) {
            expr.value = '−Ans';
            state.fresh = false;
            caretEnd(); update(); focusExpr();
            return;
        }
        var v = expr.value;
        var m = /(\d+\.?\d*(?:E[+−]?\d+)?|\.\d+)$/.exec(v);
        var out = null;
        if (m) {
            var before = v.slice(0, m.index), prev = before.slice(-1);
            var startsTerm = function (s) { return s === '' || '×÷^(,'.indexOf(s) !== -1 || / mod $/.test(s); };
            if (prev === '−') {
                var beforeMinus = before.slice(0, -1);
                out = (startsTerm(beforeMinus.slice(-1)) || / mod $/.test(beforeMinus))
                    ? beforeMinus + m[0]                // remove a leading minus
                    : beforeMinus + '+' + m[0];         // 5−3  ->  5+3
            } else if (prev === '+') {
                out = before.slice(0, -1) + '−' + m[0];
            } else if (startsTerm(prev) || / mod $/.test(before)) {
                out = before + '−' + m[0];
            }
        }
        if (out === null) {
            if (!v) out = '−';
            else out = (v.slice(0, 2) === '−(' && v.slice(-1) === ')') ? v.slice(2, -1) : '−(' + v + ')';
        }
        if (out.length > MAX_LEN) { say('Maximum length reached'); return; }
        expr.value = out;
        caretEnd(); update(); focusExpr();
    }

    /* ---------------------------------------------------------
       Equals and history
       --------------------------------------------------------- */
    function equals() {
        var text = expr.value;
        var res = Engine.evaluate(text, { mode: state.mode, ans: state.ans });
        if (res.ok) {
            text = Engine.close(text);                  // show the brackets that were closed for you
            expr.value = text;
            state.ans = res.value;
            showValue(res.value, 'final');
            state.fresh = true;
            announceEl.textContent = 'Result: ' + Engine.format(res.value, false);
            addHistory(Engine.sanitize(text), Engine.format(res.value, false));
        } else if (res.code !== 'EMPTY') {
            showError(res.code);
            announceEl.textContent = Engine.MESSAGES[res.code] || '';
            state.fresh = false;
        }
        focusExpr();
    }

    function saveHistory() {
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history)); } catch (e) { /* blocked */ }
    }

    function loadHistory() {
        var raw = null;
        try { raw = localStorage.getItem(HISTORY_KEY); } catch (e) { return; }
        if (!raw || raw.length > 60000) return;
        var data;
        try { data = JSON.parse(raw); } catch (e) { return; }
        if (!Array.isArray(data)) return;
        for (var i = 0; i < data.length && state.history.length < HISTORY_MAX; i++) {
            var it = data[i];
            if (!it || typeof it.e !== 'string' || typeof it.r !== 'string') continue;
            var e = Engine.sanitize(it.e);
            if (!e || it.r.length > 40 || !/^-?\d+(?:\.\d+)?(?:E-?\d+)?$/.test(it.r)) continue;
            state.history.push({ e: e, r: it.r });
        }
    }

    function addHistory(e, r) {
        var last = state.history[0];
        if (last && last.e === e && last.r === r) return;
        state.history.unshift({ e: e, r: r });
        if (state.history.length > HISTORY_MAX) state.history.length = HISTORY_MAX;
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        while (list.firstChild) list.removeChild(list.firstChild);
        emptyNote.hidden = state.history.length > 0;
        for (var i = 0; i < state.history.length; i++) {
            var item = state.history[i];
            var li = document.createElement('li');

            var be = document.createElement('button');
            be.type = 'button'; be.className = 'h-expr';
            be.setAttribute('data-h', String(i)); be.setAttribute('data-part', 'expr');
            be.setAttribute('aria-label', 'Use expression ' + item.e);
            be.textContent = item.e;

            var br = document.createElement('button');
            br.type = 'button'; br.className = 'h-res';
            br.setAttribute('data-h', String(i)); br.setAttribute('data-part', 'res');
            br.setAttribute('aria-label', 'Use result ' + item.r);
            br.textContent = '= ' + item.r.replace('-', '−');

            li.appendChild(be);
            li.appendChild(br);
            list.appendChild(li);
        }
    }

    /* ---------------------------------------------------------
       Memory
       --------------------------------------------------------- */
    function currentValue() {
        var res = Engine.evaluate(expr.value, { mode: state.mode, ans: state.ans });
        return res.ok ? res.value : null;
    }

    function memory(kind) {
        if (kind === 'clear') {
            state.mem = 0; state.hasMem = false; say('Memory cleared');
        } else if (kind === 'recall') {
            if (!state.hasMem) { say('Memory is empty'); return; }
            insertText(Engine.format(state.mem, false));
        } else {
            var v = currentValue();
            if (v === null) { say('Enter a valid value first'); return; }
            state.mem += (kind === 'add' ? v : -v);
            state.hasMem = true;
            say('Memory: ' + Engine.format(state.mem, true));
        }
        indMem.hidden = !state.hasMem;
    }

    /* ---------------------------------------------------------
       Copy
       --------------------------------------------------------- */
    var copyTimer = null;
    function flashCopied() {
        var use = $('copy-use');
        if (use) use.setAttribute('href', '#i-check');
        say('Copied');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () { if (use) use.setAttribute('href', '#i-copy'); }, 1200);
    }

    function copyResult() {
        var text = state.shownRaw;
        if (!text) { say('Nothing to copy yet'); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(flashCopied, function () { fallbackCopy(text); });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var t = document.createElement('textarea');
        t.value = text;
        t.className = 'sr-only';
        t.setAttribute('readonly', '');
        document.body.appendChild(t);
        t.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(t);
        if (ok) flashCopied(); else say('Copy is not available here');
        focusExpr();
    }

    /* ---------------------------------------------------------
       Events
       --------------------------------------------------------- */
    function press(d) {
        var v = variantOf(d);
        switch (d.act) {
            case 'ac':   clearAll(); return;
            case 'back': backspace(); return;
            case 'sign': toggleSign(); return;
            case 'eq':   equals(); return;
        }
        insertText(v.v);
        if (v !== d && (state.second || state.hyp)) {   // 2nd / Hyp apply to one key press
            state.second = false; state.hyp = false;
            refreshKeys();
        }
    }

    function onKeyClick(e) {
        var b = e.target.closest ? e.target.closest('.key') : null;
        if (!b) return;
        var d = keyDefs[parseInt(b.getAttribute('data-id'), 10)];
        if (d) press(d);
    }

    buildKeys($('keys-sci'), SCI);
    buildKeys($('keys-main'), MAIN);
    $('keys-sci').addEventListener('click', onKeyClick);
    $('keys-main').addEventListener('click', onKeyClick);

    btnAngle.addEventListener('click', function () {
        state.mode = MODES[(MODES.indexOf(state.mode) + 1) % MODES.length];
        btnAngle.textContent = MODE_LABEL[state.mode];
        indAngle.textContent = MODE_LABEL[state.mode];
        say('Angle unit: ' + MODE_LABEL[state.mode]);
        if (!state.fresh) update();
    });

    btn2nd.addEventListener('click', function () { state.second = !state.second; refreshKeys(); });
    btnHyp.addEventListener('click', function () { state.hyp = !state.hyp; refreshKeys(); });
    btnCopy.addEventListener('click', copyResult);

    var memButtons = document.querySelectorAll('[data-mem]');
    for (var i = 0; i < memButtons.length; i++) {
        memButtons[i].addEventListener('click', function () { memory(this.getAttribute('data-mem')); });
    }

    btnHistory.addEventListener('click', function () {
        var open = panel.hidden;
        panel.hidden = !open;
        btnHistory.setAttribute('aria-expanded', String(open));
        if (open) panel.scrollIntoView({ block: 'nearest' });
    });

    btnClearHistory.addEventListener('click', function () {
        state.history = [];
        saveHistory();
        renderHistory();
        say('History cleared');
    });

    list.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button[data-h]') : null;
        if (!b) return;
        var item = state.history[parseInt(b.getAttribute('data-h'), 10)];
        if (!item) return;
        if (b.getAttribute('data-part') === 'expr') {
            expr.value = Engine.sanitize(item.e);
            state.fresh = false;
            caretEnd(); update(); focusExpr();
        } else {
            insertText(item.r);
        }
    });

    // Typing and pasting: filter everything through the whitelist
    expr.addEventListener('input', function () {
        var pos = expr.selectionStart;
        var clean = Engine.sanitize(expr.value);
        if (clean !== expr.value) {
            expr.value = clean;
            var p = Math.min(pos == null ? clean.length : pos, clean.length);
            try { expr.setSelectionRange(p, p); } catch (e) { /* ignore */ }
        }
        state.fresh = false;
        update();
    });

    expr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); equals(); return; }
        if (e.key === 'Escape') { e.preventDefault(); clearAll(); return; }
        // After "=": an operator continues from the answer, a digit starts a new calculation
        if (state.fresh && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            expr.value = /[+\-*/^!%×÷−]/.test(e.key) ? 'Ans' : '';
            state.fresh = false;
            caretEnd();
        }
    });

    // Typing anywhere on the page goes to the calculator
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
        var tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;
        if (/[0-9a-zA-Z.+\-*/^()!%,]/.test(e.key)) focusExpr();
    });

    /* ---------------------------------------------------------
       Start
       --------------------------------------------------------- */
    var year = $('year');
    if (year) year.textContent = new Date().getFullYear();

    loadHistory();
    renderHistory();
    refreshKeys();
    update();
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) focusExpr();
})();