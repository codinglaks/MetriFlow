/* =========================================================
   MetriFlow | calculator_engine.js
   The calculation engine. It is a small, safe expression parser:
     - it NEVER uses eval(), new Function() or any string-to-code feature
     - only whitelisted numbers, operators and functions are understood
     - input length, token count and nesting depth are capped
     - every result is checked (no NaN / Infinity is ever shown)
   It has no access to the page, so it can be tested on its own.
   ========================================================= */
(function (root) {
    'use strict';

    var MAX_LEN = 200;        // longest expression accepted
    var MAX_TOKENS = 400;     // most tokens in one expression
    var MAX_DEPTH = 64;       // deepest nesting of brackets / functions
    var PI = Math.PI;

    var MESSAGES = {
        SYNTAX: 'Syntax error',
        DIV0:   'Cannot divide by zero',
        DOMAIN: 'Invalid input',
        RANGE:  'Result is out of range',
        LONG:   'Expression is too long',
        DEPTH:  'Expression is too complex',
        EMPTY:  ''
    };

    function CalcError(code) { this.code = code; }
    function fail(code) { throw new CalcError(code); }

    /* ---------- Input clean-up (whitelist) ---------- */
    var DISALLOWED = /[^0-9A-Za-z.,+−×÷^!%()π√∛ ]/;

    function normalize(text) {                   // only maps look-alike symbols; removes nothing
        return String(text == null ? '' : text)
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/-/g, '−')
            .replace(/[·∙•]/g, '×')
            .replace(/\u00A0/g, ' ');
    }

    // For the text box: strips everything that is not allowed and caps the length
    function sanitize(text) {
        var s = normalize(String(text == null ? '' : text).slice(0, MAX_LEN * 2));
        s = s.replace(/[^0-9A-Za-z.,+−×÷^!%()π√∛ ]/g, '').replace(/ {2,}/g, ' ');
        return s.slice(0, MAX_LEN);
    }

    /* ---------- Number checks ---------- */
    function N(v) {
        if (v !== v) fail('DOMAIN');                    // NaN
        if (v === Infinity || v === -Infinity) fail('RANGE');
        return v;
    }

    function snap(v) { return Math.abs(v) < 1e-15 ? 0 : v; }

    function nearInt(x) {
        var r = Math.round(x);
        return Math.abs(x - r) < 1e-9 ? r : x;
    }

    function factorial(x) {
        x = nearInt(x);
        if (x < 0 || x !== Math.floor(x)) fail('DOMAIN');
        if (x > 170) fail('RANGE');
        var r = 1;
        for (var i = 2; i <= x; i++) r *= i;
        return r;
    }

    function nCr(n, r) {
        n = nearInt(n); r = nearInt(r);
        if (n < 0 || r < 0 || n !== Math.floor(n) || r !== Math.floor(r) || r > n) fail('DOMAIN');
        if (n > 1000) fail('RANGE');
        r = Math.min(r, n - r);
        var res = 1;
        for (var i = 1; i <= r; i++) res = res * (n - r + i) / i;
        return Math.round(res);
    }

    function nPr(n, r) {
        n = nearInt(n); r = nearInt(r);
        if (n < 0 || r < 0 || n !== Math.floor(n) || r !== Math.floor(r) || r > n) fail('DOMAIN');
        if (n > 1000) fail('RANGE');
        var res = 1;
        for (var i = 0; i < r; i++) res *= (n - i);
        return res;
    }

    function power(base, ex) {
        if (base < 0 && ex !== Math.floor(ex)) fail('DOMAIN');
        if (base === 0 && ex < 0) fail('DIV0');
        return N(Math.pow(base, ex));
    }

    function nthRoot(n, x) {
        if (n === 0) fail('DIV0');
        if (x < 0) {
            if (n === Math.floor(n) && Math.abs(n) % 2 === 1) return -power(-x, 1 / n);
            fail('DOMAIN');
        }
        return power(x, 1 / n);
    }

    /* ---------- Angles ---------- */
    function toDeg(x, mode) { return mode === 'grad' ? x * 0.9 : x; }          // for deg / grad
    function fromRad(v, mode) {
        if (mode === 'deg') return v * 180 / PI;
        if (mode === 'grad') return v * 200 / PI;
        return v;
    }

    function sinA(x, c) {
        if (c.mode === 'rad') return snap(Math.sin(x));
        var d = toDeg(x, c.mode) % 360; if (d < 0) d += 360;
        if (d === 0 || d === 180) return 0;
        if (d === 90) return 1;
        if (d === 270) return -1;
        return Math.sin(d * PI / 180);
    }

    function cosA(x, c) {
        if (c.mode === 'rad') return snap(Math.cos(x));
        var d = toDeg(x, c.mode) % 360; if (d < 0) d += 360;
        if (d === 90 || d === 270) return 0;
        if (d === 0) return 1;
        if (d === 180) return -1;
        return Math.cos(d * PI / 180);
    }

    function tanA(x, c) {
        if (c.mode === 'rad') {
            if (Math.abs(Math.cos(x)) < 1e-15) fail('DOMAIN');
            return snap(Math.tan(x));
        }
        var d = toDeg(x, c.mode) % 180; if (d < 0) d += 180;
        if (d === 0) return 0;
        if (d === 90) fail('DOMAIN');
        return Math.tan(d * PI / 180);
    }

    function unit(x) {                         // allow tiny float error just outside [-1, 1]
        if (Math.abs(x) > 1 + 1e-12) fail('DOMAIN');
        return Math.max(-1, Math.min(1, x));
    }

    /* ---------- Functions (whitelist; no prototype keys) ---------- */
    var FUNCS = Object.create(null);
    function def(name, arity, fn) { FUNCS[name] = { n: arity, f: fn }; }

    def('sin',  1, function (a, c) { return sinA(a[0], c); });
    def('cos',  1, function (a, c) { return cosA(a[0], c); });
    def('tan',  1, function (a, c) { return tanA(a[0], c); });
    def('asin', 1, function (a, c) { return fromRad(Math.asin(unit(a[0])), c.mode); });
    def('acos', 1, function (a, c) { return fromRad(Math.acos(unit(a[0])), c.mode); });
    def('atan', 1, function (a, c) { return fromRad(Math.atan(a[0]), c.mode); });
    def('sinh', 1, function (a) { return Math.sinh(a[0]); });
    def('cosh', 1, function (a) { return Math.cosh(a[0]); });
    def('tanh', 1, function (a) { return Math.tanh(a[0]); });
    def('asinh', 1, function (a) { return Math.asinh(a[0]); });
    def('acosh', 1, function (a) { if (a[0] < 1) fail('DOMAIN'); return Math.acosh(a[0]); });
    def('atanh', 1, function (a) { if (Math.abs(a[0]) >= 1) fail('DOMAIN'); return Math.atanh(a[0]); });
    def('log',  1, function (a) { if (a[0] <= 0) fail('DOMAIN'); return Math.log10(a[0]); });
    def('log2', 1, function (a) { if (a[0] <= 0) fail('DOMAIN'); return Math.log2(a[0]); });
    def('ln',   1, function (a) { if (a[0] <= 0) fail('DOMAIN'); return Math.log(a[0]); });
    def('exp',  1, function (a) { return Math.exp(a[0]); });
    def('sqrt', 1, function (a) { if (a[0] < 0) fail('DOMAIN'); return Math.sqrt(a[0]); });
    def('cbrt', 1, function (a) { return Math.cbrt(a[0]); });
    def('abs',  1, function (a) { return Math.abs(a[0]); });
    def('floor', 1, function (a) { return Math.floor(a[0]); });
    def('ceil',  1, function (a) { return Math.ceil(a[0]); });
    def('round', 1, function (a) { return a[0] < 0 ? -Math.round(-a[0]) : Math.round(a[0]); });
    def('fact', 1, function (a) { return factorial(a[0]); });
    def('nCr',  2, function (a) { return nCr(a[0], a[1]); });
    def('nPr',  2, function (a) { return nPr(a[0], a[1]); });
    def('root', 2, function (a) { return nthRoot(a[0], a[1]); });
    def('rand', 0, function () { return Math.floor(Math.random() * 1e9) / 1e9; });

    /* ---------- Tokenizer ---------- */
    function tokenize(src) {
        var tokens = [], i = 0, n = src.length;
        var numRe = /^(?:\d+\.?\d*|\.\d+)(?:E[+−]?\d+)?/;
        var wordRe = /^[A-Za-z]+/;
        while (i < n) {
            if (tokens.length > MAX_TOKENS) fail('LONG');
            var c = src.charAt(i);
            if (c === ' ') { i++; continue; }

            if ((c >= '0' && c <= '9') || c === '.') {
                var m = numRe.exec(src.slice(i));
                if (!m) fail('SYNTAX');
                var v = parseFloat(m[0].replace('−', '-'));
                if (!isFinite(v)) fail('RANGE');
                tokens.push({ t: 'num', v: v });
                i += m[0].length;
                continue;
            }

            if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
                var w = wordRe.exec(src.slice(i))[0];
                if (w === 'log' && src.substr(i + 3, 2) === '2(') {      // log2(
                    tokens.push({ t: 'fn', v: 'log2' });
                    i += 4;
                    continue;
                }
                if (w === 'pi') tokens.push({ t: 'num', v: PI });
                else if (w === 'e') tokens.push({ t: 'num', v: Math.E });
                else if (w === 'Ans') tokens.push({ t: 'ans' });
                else if (w === 'mod') tokens.push({ t: 'mod' });
                else if (FUNCS[w]) tokens.push({ t: 'fn', v: w });
                else fail('SYNTAX');                       // unknown word: rejected
                i += w.length;
                continue;
            }

            if (c === 'π') tokens.push({ t: 'num', v: PI });
            else if (c === '√') tokens.push({ t: 'fn', v: 'sqrt' });
            else if (c === '∛') tokens.push({ t: 'fn', v: 'cbrt' });
            else if ('+−×÷^!%(),'.indexOf(c) !== -1) tokens.push({ t: 'op', v: c });
            else fail('SYNTAX');
            i++;
        }
        return tokens;
    }

    function autoClose(src) {
        var open = 0;
        for (var i = 0; i < src.length; i++) {
            var ch = src.charAt(i);
            if (ch === '(') open++;
            else if (ch === ')') { open--; if (open < 0) fail('SYNTAX'); }
        }
        var add = '';
        while (open-- > 0 && add.length < MAX_LEN) add += ')';
        return src + add;
    }

    /* ---------- Parser + evaluator (recursive descent) ---------- */
    function run(tokens, ctx) {
        var pos = 0, depth = 0;

        function peek() { return tokens[pos]; }
        function isOp(t, v) { return !!t && t.t === 'op' && t.v === v; }
        function enter() { if (++depth > MAX_DEPTH) fail('DEPTH'); }
        function leave() { depth--; }
        function startsFactor(t) {
            return !!t && (t.t === 'num' || t.t === 'ans' || t.t === 'fn' || isOp(t, '('));
        }

        function parseExpr() {
            enter();
            var v = parseTerm();
            for (;;) {
                var t = peek();
                if (isOp(t, '+')) { pos++; v = N(v + parseTerm()); }
                else if (isOp(t, '−')) { pos++; v = N(v - parseTerm()); }
                else break;
            }
            leave();
            return v;
        }

        function parseTerm() {
            var v = parseImplicit();
            for (;;) {
                var t = peek();
                if (isOp(t, '×')) { pos++; v = N(v * parseImplicit()); }
                else if (isOp(t, '÷')) {
                    pos++;
                    var d = parseImplicit();
                    if (d === 0) fail('DIV0');
                    v = N(v / d);
                } else if (t && t.t === 'mod') {
                    pos++;
                    var m = parseImplicit();
                    if (m === 0) fail('DIV0');
                    v = N(v - m * Math.floor(v / m));
                } else break;
            }
            return v;
        }

        // 2π, 3(4+1), 2sin(30): implicit multiplication binds tighter than × and ÷
        function parseImplicit() {
            var v = parseUnary();
            while (startsFactor(peek())) v = N(v * parseUnary());
            return v;
        }

        function parseUnary() {
            var t = peek();
            if (isOp(t, '−')) { pos++; enter(); var a = -parseUnary(); leave(); return a; }
            if (isOp(t, '+')) { pos++; enter(); var b = parseUnary(); leave(); return b; }
            return parsePower();
        }

        function parsePower() {
            var base = parsePostfix();
            if (isOp(peek(), '^')) {
                pos++; enter();
                var ex = parseUnary();                 // right-associative: 2^3^2 = 2^9
                leave();
                return power(base, ex);
            }
            return base;
        }

        function parsePostfix() {
            var v = parsePrimary();
            for (;;) {
                var t = peek();
                if (isOp(t, '!')) { pos++; v = factorial(v); }
                else if (isOp(t, '%')) { pos++; v = v / 100; }
                else break;
            }
            return v;
        }

        function parsePrimary() {
            var t = tokens[pos++];
            if (!t) fail('SYNTAX');
            if (t.t === 'num') return t.v;
            if (t.t === 'ans') return ctx.ans;
            if (isOp(t, '(')) {
                var v = parseExpr();
                if (!isOp(peek(), ')')) fail('SYNTAX');
                pos++;
                return v;
            }
            if (t.t === 'fn') return callFn(t.v);
            fail('SYNTAX');
        }

        function callFn(name) {
            var spec = FUNCS[name], args = [];
            enter();
            if (isOp(peek(), '(')) {
                pos++;
                if (!isOp(peek(), ')')) {
                    args.push(parseExpr());
                    while (isOp(peek(), ',')) { pos++; args.push(parseExpr()); }
                }
                if (!isOp(peek(), ')')) fail('SYNTAX');
                pos++;
            } else if (spec.n === 1) {
                args.push(parsePostfix());             // allows "√9" and "sin30"
            } else if (spec.n !== 0) {
                fail('SYNTAX');
            }
            if (args.length !== spec.n) fail('SYNTAX');
            leave();
            return N(spec.f(args, ctx));
        }

        var value = parseExpr();
        if (pos < tokens.length) fail('SYNTAX');       // leftover tokens, e.g. a stray ")"
        return N(value);
    }

    /* ---------- Public: evaluate ---------- */
    function evaluate(text, opts) {
        opts = opts || {};
        var mode = (opts.mode === 'rad' || opts.mode === 'grad') ? opts.mode : 'deg';
        var ans = (typeof opts.ans === 'number' && isFinite(opts.ans)) ? opts.ans : 0;
        try {
            var raw = String(text == null ? '' : text);
            if (raw.length > MAX_LEN) return { ok: false, code: 'LONG' };
            var src = normalize(raw);
            if (DISALLOWED.test(src)) return { ok: false, code: 'SYNTAX' };   // reject, never silently strip
            if (!src.replace(/ /g, '')) return { ok: false, code: 'EMPTY' };
            src = autoClose(src);
            var value = run(tokenize(src), { mode: mode, ans: ans });
            return { ok: true, value: value };
        } catch (e) {
            if (e instanceof CalcError) return { ok: false, code: e.code };
            return { ok: false, code: 'DEPTH' };       // e.g. call stack limit: never leak details
        }
    }

    /* ---------- Public: format a number (12 significant digits) ---------- */
    function format(n, unicodeMinus) {
        if (n === 0) return '0';
        var abs = Math.abs(n);
        var r = Number(n.toPrecision(12));
        var s;
        if (abs >= 1e15 || abs < 1e-9) {
            s = r.toExponential().replace('e+', 'E').replace('e', 'E');
        } else {
            s = String(r);
            if (s.indexOf('e') !== -1) s = r.toExponential().replace('e+', 'E').replace('e', 'E');
        }
        return unicodeMinus ? s.replace('-', '−') : s;
    }

    // Adds any missing closing brackets (used to tidy the expression after "=")
    function close(text) {
        try { return autoClose(normalize(text)); } catch (e) { return String(text); }
    }

    var api = {
        evaluate: evaluate,
        close: close,
        format: format,
        sanitize: sanitize,
        MESSAGES: MESSAGES,
        MAX_LEN: MAX_LEN
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MetriFlowEngine = Object.freeze(api);
})(typeof window !== 'undefined' ? window : this);