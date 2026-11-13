/* =========================================================
   MetriFlow | converter_engine.js
   Conversion maths, number reading, number formatting and search.
   It has no access to the page, so it can be tested on its own.
   Like the calculator, it never uses eval() or new Function().
   ========================================================= */
(function (root) {
    'use strict';

    var data = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
        ? require('./converter_data.js') : root.MetriFlowUnitData;
    var CalcEngine = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
        ? require('./calculator_engine.js') : root.MetriFlowEngine;

    var MESSAGES = {
        EMPTY:    'Enter a value to convert',
        SYNTAX:   'Enter a number, such as 12.5 or 1E-3',
        LONG:     'That entry is too long',
        RANGE:    'The result is out of range',
        POSITIVE: 'This unit needs a value greater than zero',
        BELOW:    'That is below absolute zero',
        DENSITY:  'Enter a density greater than zero',
        INCOMPAT: 'These two units cannot be converted'
    };

    function fail(code) { throw { code: code }; }

    /* ---------- Build the index ---------- */
    function slug(s) {
        return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'unit';
    }

    function norm(s) {                                   // for searching: lower case, no accents, no symbols
        return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[µμ]/g, 'u').replace(/[^a-z0-9\/ ]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    var CATS = [], CAT_BY_ID = Object.create(null);

    data.categories.forEach(function (c) {
        var cat = {
            id: c.id, short: c.short, name: c.name, desc: c.desc || '', def: c.def || null,
            reference: !!c.reference, bridge: c.bridge || null, groups: [], units: [], byId: Object.create(null)
        };
        (c.groups || []).forEach(function (g) {
            var grp = { id: g.id, label: g.label, base: g.base, min: (g.min !== undefined ? g.min : null), units: [], cat: cat };
            g.units.forEach(function (r) {
                var u = { name: r[0], symbol: r[1], aliases: r[3] || '', note: r[4] || '', cat: cat, group: grp };
                var f = r[2];
                if (typeof f === 'number') u.f = f; else { u.to = f.to; u.from = f.from; u.pos = !!f.pos; }
                var id = slug(r[0]), n = 2;
                while (cat.byId[id]) id = slug(r[0]) + '-' + (n++);
                u.id = id;
                u.label = u.symbol ? u.name + ' (' + u.symbol + ')' : u.name;
                u.short = u.symbol || u.name;
                u.search = norm(u.name + ' ' + u.symbol + ' ' + u.aliases);
                grp.units.push(u); cat.units.push(u); cat.byId[id] = u;
            });
            cat.groups.push(grp);
        });
        CATS.push(cat); CAT_BY_ID[cat.id] = cat;
    });

    var SUBSTANCES = data.substances.map(function (s) {
        return { id: slug(s[0]), name: s[0], density: s[1] };
    });

    /* ---------- Lookup ---------- */
    function category(id) { return CAT_BY_ID[id] || null; }
    function unit(catId, unitId) { var c = CAT_BY_ID[catId]; return c ? (c.byId[unitId] || null) : null; }
    function unitByName(catId, name) {
        var c = CAT_BY_ID[catId]; if (!c) return null;
        for (var i = 0; i < c.units.length; i++) if (c.units[i].name === name) return c.units[i];
        return null;
    }
    function substance(id) {
        for (var i = 0; i < SUBSTANCES.length; i++) if (SUBSTANCES[i].id === id) return SUBSTANCES[i];
        return null;
    }

    // Units that `from` can be converted to
    function compatible(from) {
        var cat = from.cat;
        if (cat.bridge) return cat.units.slice();
        return from.group.units.slice();
    }

    /* ---------- Conversion ---------- */
    function toBase(u, x) {
        if (u.f !== undefined) return x * u.f;
        if (u.pos && !(x > 0)) fail('POSITIVE');
        return u.to(x);
    }
    function fromBase(u, b) {
        if (u.f !== undefined) return b / u.f;
        if (u.pos && !(b > 0)) fail('POSITIVE');
        return u.from(b);
    }

    function convertRaw(from, to, x, opts) {
        if (from.cat !== to.cat) fail('INCOMPAT');
        var b = toBase(from, x);
        if (from.group.min !== null && b < from.group.min - 1e-9) fail('BELOW');
        var out;
        if (from.group === to.group) {
            out = (from.f !== undefined && to.f !== undefined) ? (x * from.f) / to.f : fromBase(to, b);
        } else {
            var br = from.cat.bridge;
            var fn = br && br.pairs[from.group.id + '>' + to.group.id];
            if (!fn) fail('INCOMPAT');
            var rho = opts && opts.density;
            if (!(rho > 0) || !isFinite(rho)) fail('DENSITY');
            out = fromBase(to, fn(b, rho));
        }
        if (typeof out !== 'number' || out !== out || !isFinite(out)) fail('RANGE');
        return out;
    }

    function convert(from, to, x, opts) {
        try { return { ok: true, value: convertRaw(from, to, x, opts) }; }
        catch (e) { return { ok: false, code: (e && e.code) || 'RANGE' }; }
    }

    function needsDensity(from, to) { return !!(from && to && from.cat.bridge && from.group !== to.group); }

    /* ---------- Reading what the user typed ---------- */
    function parseValue(text) {
        var s = String(text == null ? '' : text).trim().replace(/\u2212/g, '-');
        if (!s) return { ok: false, code: 'EMPTY' };
        if (s.length > 60) return { ok: false, code: 'LONG' };

        var plain = s.replace(/\s+/g, '');
        // thousands separators: 1,234,567.89  or  12,34,567.89 (Indian)
        if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(plain) || /^[+-]?\d{1,2}(,\d{2})*,\d{3}(\.\d+)?$/.test(plain)) plain = plain.replace(/,/g, '');
        else if (/^[+-]?\d*,\d+$/.test(plain)) plain = plain.replace(',', '.');           // decimal comma: 1,5

        if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(plain)) {
            var v = parseFloat(plain);
            if (!isFinite(v) || Math.abs(v) > 1e300) return { ok: false, code: 'RANGE' };
            return { ok: true, value: v };
        }

        // A simple calculation such as 5*12 or (2+3)/4, worked out by the calculator's safe parser
        if (CalcEngine && /^[0-9eE.+\-*\/×÷^()\s%]+$/.test(s)) {
            var expr = s.replace(/(\d)e([+\-]?\d)/g, '$1E$2');
            if (!/[A-DF-Za-df-z]/.test(expr) && !/e/.test(expr)) {
                var r = CalcEngine.evaluate(expr, { mode: 'deg', ans: 0 });
                if (r.ok && isFinite(r.value) && Math.abs(r.value) <= 1e300) return { ok: true, value: r.value };
            }
        }
        return { ok: false, code: 'SYNTAX' };
    }

    /* ---------- Showing a number ---------- */
    var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }
    function zeros(n) { return new Array(n + 1).join('0'); }

    function group(intStr, style) {
        if (style !== 'intl' && style !== 'indian') return intStr;
        if (intStr.length <= 3) return intStr;
        if (style === 'intl') return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        var last3 = intStr.slice(-3), rest = intStr.slice(0, -3);
        return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }

    // returns { display, plain }: display is for the screen, plain is what gets copied
    function format(n, o) {
        o = o || {};
        var sig = Math.max(1, Math.min(15, o.sig || 10));
        var notation = o.notation || 'auto';
        if (n === 0 || n !== n) return { display: '0', plain: '0' };
        var neg = n < 0, a = Math.abs(n);
        var m = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(a.toExponential(sig - 1));
        var digits = (m[1] + (m[2] || '')).replace(/0+$/, '') || '0';
        var e = parseInt(m[3], 10);
        var useSci = notation === 'scientific' || (notation === 'auto' && (e >= 15 || e < -6));
        if (useSci) {
            var mant = digits.charAt(0) + (digits.length > 1 ? '.' + digits.slice(1) : '');
            return { plain: (neg ? '-' : '') + mant + 'E' + e, display: (neg ? '−' : '') + mant + ' × 10' + sup(e) };
        }
        var intPart, frac;
        if (e >= 0) {
            if (digits.length <= e + 1) { intPart = digits + zeros(e + 1 - digits.length); frac = ''; }
            else { intPart = digits.slice(0, e + 1); frac = digits.slice(e + 1); }
        } else { intPart = '0'; frac = zeros(-e - 1) + digits; }
        return {
            plain: (neg ? '-' : '') + intPart + (frac ? '.' + frac : ''),
            display: (neg ? '−' : '') + group(intPart, o.grouping) + (frac ? '.' + frac : '')
        };
    }

    /* ---------- Formula text ---------- */
    var TEMP_FORMULAS = {
        'celsius>fahrenheit': '°F = °C × 9/5 + 32', 'fahrenheit>celsius': '°C = (°F − 32) × 5/9',
        'celsius>kelvin': 'K = °C + 273.15', 'kelvin>celsius': '°C = K − 273.15',
        'fahrenheit>kelvin': 'K = (°F − 32) × 5/9 + 273.15', 'kelvin>fahrenheit': '°F = (K − 273.15) × 9/5 + 32',
        'celsius>rankine': '°R = (°C + 273.15) × 9/5', 'rankine>celsius': '°C = °R × 5/9 − 273.15',
        'celsius>r-aumur': '°Ré = °C × 4/5', 'r-aumur>celsius': '°C = °Ré × 5/4'
    };

    function formulaText(from, to, o) {
        if (from.cat.id === 'temperature') {
            var t = TEMP_FORMULAS[from.id + '>' + to.id];
            if (t) return t;
        }
        var r = convert(from, to, 1, o);
        if (!r.ok) return '';
        var f = format(r.value, { sig: (o && o.sig) || 10, notation: (o && o.notation) || 'auto', grouping: (o && o.grouping) || 'none' });
        return '1 ' + from.short + ' = ' + f.display + ' ' + to.short;
    }

    /* ---------- Search ---------- */
    function search(query, limit) {
        var q = norm(query);
        if (!q) return [];
        var tokens = q.split(' '), out = [];
        CATS.forEach(function (cat) {
            if (cat.reference || cat.bridge && cat.id === 'mass-volume') return;
            cat.units.forEach(function (u) {
                for (var i = 0; i < tokens.length; i++) if (u.search.indexOf(tokens[i]) === -1) return;
                var sym = norm(u.symbol), name = norm(u.name), score = 3;
                if (sym === q) score = 0;
                else if (name === q) score = 0;
                else if (name.indexOf(q) === 0) score = 1;
                else if (sym.indexOf(q) === 0) score = 2;
                out.push({ unit: u, score: score });
            });
        });
        out.sort(function (a, b) { return a.score - b.score; });
        return out.slice(0, limit || 8);
    }

    // "5 km to miles", "kg to litre"
    function matchUnits(token) {
        var q = norm(token), exact = [], loose = [];
        if (!q) return [];
        CATS.forEach(function (cat) {
            if (cat.reference) return;
            cat.units.forEach(function (u) {
                if (u.symbol === token.trim()) exact.push(u);
                else if (norm(u.symbol) === q || norm(u.name) === q || (' ' + u.search + ' ').indexOf(' ' + q + ' ') !== -1) loose.push(u);
            });
        });
        var all = exact.concat(loose);
        var main = all.filter(function (u) { return u.cat.id !== 'si-prefixes'; });
        var prefixes = all.filter(function (u) { return u.cat.id === 'si-prefixes'; });
        return main.concat(prefixes);                    // single letters like f or c usually mean units, not prefixes
    }

    function quick(query) {
        var m = /^\s*(.*?)\s+(?:to|in|into|->|=>|→)\s+(.+?)\s*$/i.exec(String(query || ''));
        if (!m) return null;
        var left = m[1], right = m[2], value = null;
        var nm = /^([+-−]?\s*[\d.,]+(?:[eE][+-]?\d+)?)\s*(.*)$/.exec(left);
        if (nm) { var pv = parseValue(nm[1]); if (pv.ok) { value = pv.value; left = nm[2]; } }
        if (!left) return null;
        var A = matchUnits(left), B = matchUnits(right);
        for (var i = 0; i < A.length; i++) {
            for (var j = 0; j < B.length; j++) {
                if (A[i].cat === B[j].cat && A[i] !== B[j] && (A[i].group === B[j].group || A[i].cat.bridge)) {
                    return { from: A[i], to: B[j], value: value };
                }
            }
        }
        return null;
    }

    function stats() {
        var u = 0;
        CATS.forEach(function (cat) { if (!cat.reference && cat.id !== 'mass-volume') u += cat.units.length; });   // the bridge reuses mass and volume units
        return { categories: CATS.length, units: u };
    }

    var api = {
        MESSAGES: MESSAGES, categories: CATS, substances: SUBSTANCES, siBase: data.siBase,
        category: category, unit: unit, unitByName: unitByName, substance: substance, compatible: compatible,
        convert: convert, needsDensity: needsDensity, parseValue: parseValue, format: format,
        formulaText: formulaText, search: search, quick: quick, stats: stats, slug: slug, norm: norm
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MetriFlowConverter = Object.freeze(api);
})(typeof window !== 'undefined' ? window : this);