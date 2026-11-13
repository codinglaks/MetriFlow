/* =========================================================
   MetriFlow | converter_function.js
   The page logic for the unit converter.

   The flow is deliberately short:
     1. choose a category          (chip buttons)
     2. choose the two units       (unit buttons open a picker; "To" only lists units that can be converted)
     3. type a number              (the answer updates as you type)

   All maths lives in converter_engine.js and the unit list in converter_data.js.
   This file only reads the page, calls the engine and writes text back.
   It never uses innerHTML, eval() or new Function().
   ========================================================= */
(function () {
    'use strict';

    var C = window.MetriFlowConverter;
    var $ = function (id) { return document.getElementById(id); };

    if (!C) { $('load-error').hidden = false; $('converter-card').hidden = true; return; }

    var DEFAULT_SUBSTANCE = 'water-about-4-c';

    /* ---------- State ---------- */
    var st = {
        cat: null, from: null, to: null,
        sig: 8, grouping: 'none',
        plain: '',                 // the last result as plain text (what "Copy" copies)
        side: 'from',              // which unit button opened the picker
        copyTimer: 0
    };

    /* ---------- Page elements ---------- */
    var el = {
        cats: $('cats'), name: $('cat-name'), desc: $('cat-desc'), tool: $('tool'), si: $('si-ref'),
        value: $('value'), result: $('result'),
        btnFrom: $('btn-from'), btnTo: $('btn-to'), fromSym: $('from-sym'), fromName: $('from-name'), toSym: $('to-sym'), toName: $('to-name'),
        swap: $('btn-swap'), sign: $('btn-sign'), copy: $('btn-copy'), copyUse: $('copy-use'), copyText: $('copy-text'),
        dens: $('density-panel'), substance: $('substance'), density: $('density'),
        msg: $('msg'), formula: $('formula'), note: $('unit-note'),
        all: $('all'), rows: $('all-rows'), sig: $('opt-sig'), group: $('opt-group'),
        picker: $('picker'), pTitle: $('picker-title'), pHint: $('picker-hint'), pSearch: $('picker-search'),
        pList: $('picker-list'), pEmpty: $('picker-empty'), pClose: $('picker-close')
    };

    /* ---------- Small helpers ---------- */
    function make(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }
    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    // The unit that "From" can be converted into: keep the preferred one if it is allowed, else the first other unit.
    function pickTo(from, preferred) {
        var list = C.compatible(from);
        if (preferred && list.indexOf(preferred) !== -1) return preferred;
        for (var i = 0; i < list.length; i++) if (list[i] !== from) return list[i];
        return from;
    }

    function setDefaults(cat) {
        var def = cat.def || [];
        st.from = (def[0] && C.unitByName(cat.id, def[0])) || cat.units[0];
        st.to = pickTo(st.from, def[1] && C.unitByName(cat.id, def[1]));
    }

    function fmtOpts() { return { sig: st.sig, notation: 'auto', grouping: st.grouping }; }

    function densityValue() {
        var r = C.parseValue(el.density.value);
        return r.ok ? r.value : NaN;
    }

    function convOpts() { return C.needsDensity(st.from, st.to) ? { density: densityValue() } : {}; }

    /* ---------- Step 1: categories ---------- */
    function buildCategories() {
        C.categories.forEach(function (cat) {
            var b = make('button', 'chip', cat.short);
            b.type = 'button';
            b.setAttribute('data-cat', cat.id);
            b.setAttribute('aria-pressed', 'false');
            el.cats.appendChild(b);
        });
    }

    function markCategory() {
        var chips = el.cats.children;
        for (var i = 0; i < chips.length; i++) {
            var on = chips[i].getAttribute('data-cat') === st.cat.id;
            chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    function selectCategory(id, scroll) {
        var cat = C.category(id);
        if (!cat) return;
        st.cat = cat;
        el.name.textContent = cat.name;
        el.desc.textContent = cat.desc;
        markCategory();
        if (scroll) {
            var on = el.cats.querySelector('[aria-pressed="true"]');
            if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
        if (cat.reference) { showReference(); return; }
        el.si.hidden = true; el.tool.hidden = false;
        setDefaults(cat);
        update();
    }

    // "SI base units" is a list, not a converter: each button opens the matching converter
    function showReference() {
        el.tool.hidden = true; el.si.hidden = false;
        clear(el.si);
        C.siBase.forEach(function (row) {
            var b = make('button', 'si-item');
            b.type = 'button';
            b.setAttribute('data-cat', row[3]);
            b.setAttribute('data-unit', row[1]);
            b.appendChild(make('span', 'si-qty', row[0]));
            b.appendChild(make('span', 'si-unit', row[1] + ' (' + row[2] + ')'));
            el.si.appendChild(b);
        });
    }

    function openFromReference(catId, unitName) {
        selectCategory(catId, true);
        var u = C.unitByName(catId, unitName);
        if (u) { st.from = u; st.to = pickTo(u, st.to); update(); }
    }

    /* ---------- Step 3: work out and show the answer ---------- */
    function setMessage(text, isError) {
        el.msg.textContent = text || '';
        el.msg.className = 'msg' + (text && isError ? ' err' : '');
    }

    function refreshUnitButtons() {
        el.fromSym.textContent = st.from.short;
        el.fromName.textContent = st.from.name;
        el.toSym.textContent = st.to.short;
        el.toName.textContent = st.to.name;
    }

    function update() {
        refreshUnitButtons();
        el.dens.hidden = !C.needsDensity(st.from, st.to);
        compute();
    }

    function compute() {
        var o = convOpts();
        var pv = C.parseValue(el.value.value);
        var shown = false;

        if (!pv.ok) {
            setMessage(C.MESSAGES[pv.code], pv.code !== 'EMPTY');
            el.formula.textContent = '';
        } else {
            var r = C.convert(st.from, st.to, pv.value, o);
            if (!r.ok) {
                setMessage(C.MESSAGES[r.code], true);
                el.formula.textContent = '';
            } else {
                var f = C.format(r.value, fmtOpts());
                el.result.textContent = f.display;
                st.plain = f.plain;
                shown = true;
                setMessage('', false);
                var ft = C.formulaText(st.from, st.to, { sig: st.sig, notation: 'auto', grouping: st.grouping, density: o.density });
                el.formula.textContent = ft;
            }
        }
        if (!shown) { el.result.textContent = '—'; st.plain = ''; }
        el.copy.disabled = !shown;

        var notes = [];
        if (st.from.note) notes.push(st.from.name + ': ' + st.from.note);
        if (st.to.note && st.to !== st.from) notes.push(st.to.name + ': ' + st.to.note);
        el.note.textContent = notes.join(' ');

        renderAll(pv.ok ? pv.value : null, o);
    }

    /* ---------- "See every unit at once" ---------- */
    function renderAll(x, o) {
        if (!el.all.open) return;
        clear(el.rows);
        var list = C.compatible(st.from), frag = document.createDocumentFragment();
        list.forEach(function (u) {
            if (u === st.from) return;
            var text = '—';
            if (x !== null) {
                var r = C.convert(st.from, u, x, o);
                if (r.ok) text = C.format(r.value, fmtOpts()).display;
            }
            var b = make('button', 'row');
            b.type = 'button';
            b.setAttribute('data-unit', u.id);
            if (u === st.to) b.setAttribute('aria-current', 'true');
            b.appendChild(make('span', 'row-name', u.label));
            b.appendChild(make('span', 'row-value', text));
            frag.appendChild(b);
        });
        el.rows.appendChild(frag);
    }

    /* ---------- Step 2: the unit picker ---------- */
    function openPicker(side) {
        st.side = side;
        var isFrom = side === 'from';
        el.pTitle.textContent = isFrom ? 'Convert from' : 'Convert to';
        el.pHint.textContent = isFrom
            ? st.cat.name
            : (C.compatible(st.from).length === 1 ? 'Nothing else to convert to' : 'Units that ' + st.from.name + ' can be converted to');
        el.pSearch.value = '';
        buildPicker('');
        if (typeof el.picker.showModal === 'function') { if (!el.picker.open) el.picker.showModal(); }
        else el.picker.setAttribute('open', '');
    }

    function closePicker() {
        if (typeof el.picker.close === 'function') el.picker.close();
        else el.picker.removeAttribute('open');
    }

    function buildPicker(query) {
        var units = st.side === 'from' ? st.cat.units : C.compatible(st.from);
        var tokens = C.norm(query).split(' ').filter(Boolean);
        var current = st.side === 'from' ? st.from : st.to;

        var buckets = [], byGroup = [];
        units.forEach(function (u) {
            for (var i = 0; i < tokens.length; i++) if (u.search.indexOf(tokens[i]) === -1) return;
            var k = byGroup.indexOf(u.group);
            if (k === -1) { byGroup.push(u.group); buckets.push([]); k = byGroup.length - 1; }
            buckets[k].push(u);
        });

        clear(el.pList);
        var showHeadings = st.cat.groups.length > 1;
        var frag = document.createDocumentFragment();
        buckets.forEach(function (bucket, i) {
            if (showHeadings) frag.appendChild(make('h3', 'picker-group', byGroup[i].label));
            var grid = make('div', 'picker-grid');
            bucket.forEach(function (u) {
                var b = make('button', 'unit-opt');
                b.type = 'button';
                b.setAttribute('data-unit', u.id);
                b.setAttribute('aria-pressed', u === current ? 'true' : 'false');
                b.appendChild(make('span', 'opt-name', u.name));
                if (u.symbol) b.appendChild(make('span', 'opt-sym', u.symbol));
                grid.appendChild(b);
            });
            frag.appendChild(grid);
        });
        el.pList.appendChild(frag);
        el.pEmpty.hidden = buckets.length > 0;
    }

    function choose(unitId) {
        var u = C.unit(st.cat.id, unitId);
        if (!u) return;
        if (st.side === 'from') {
            st.from = u;
            st.to = pickTo(u, st.to);             // keep "To" if it still fits, else move it to a unit that does
        } else {
            st.to = u;
        }
        closePicker();
        update();
        (st.side === 'from' ? el.btnFrom : el.btnTo).focus();
    }

    /* ---------- Density (kg to litre, viscosity) ---------- */
    function buildSubstances() {
        C.substances.forEach(function (s) {
            var o = make('option', '', s.name);
            o.value = s.id;
            el.substance.appendChild(o);
        });
        var custom = make('option', '', 'Custom density');
        custom.value = 'custom';
        el.substance.appendChild(custom);
        el.substance.value = DEFAULT_SUBSTANCE;
        el.density.value = String(C.substance(DEFAULT_SUBSTANCE).density);
    }

    /* ---------- Copy ---------- */
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        return new Promise(function (resolve, reject) {
            var t = document.createElement('textarea');
            t.value = text; t.setAttribute('readonly', ''); t.className = 'sr-only';
            document.body.appendChild(t); t.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(t);
            if (ok) resolve(); else reject(new Error('copy failed'));
        });
    }

    function flashCopied(done) {
        el.copyUse.setAttribute('href', done ? '#i-check' : '#i-copy');
        el.copyText.textContent = done ? 'Copied' : 'Copy';
    }

    /* ---------- Events ---------- */
    el.cats.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-cat]');
        if (b) selectCategory(b.getAttribute('data-cat'), true);
    });

    el.si.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-cat]');
        if (b) openFromReference(b.getAttribute('data-cat'), b.getAttribute('data-unit'));
    });

    el.value.addEventListener('input', compute);
    el.value.addEventListener('focus', function () { el.value.select(); });

    el.sign.addEventListener('click', function () {
        var v = el.value.value.trim().replace(/\u2212/g, '-');
        if (v.charAt(0) === '-') v = v.slice(1);
        else v = '-' + v;
        el.value.value = v;
        compute();
        el.value.focus();
    });

    el.btnFrom.addEventListener('click', function () { openPicker('from'); });
    el.btnTo.addEventListener('click', function () { openPicker('to'); });

    el.swap.addEventListener('click', function () {
        var t = st.from; st.from = st.to; st.to = t;
        update();
    });

    el.copy.addEventListener('click', function () {
        if (!st.plain) return;
        clearTimeout(st.copyTimer);
        copyText(st.plain).then(function () {
            flashCopied(true);
            st.copyTimer = setTimeout(function () { flashCopied(false); }, 1600);
        }, function () {
            el.copyText.textContent = 'Press Ctrl+C';
            st.copyTimer = setTimeout(function () { flashCopied(false); }, 2000);
        });
    });

    el.pSearch.addEventListener('input', function () { buildPicker(el.pSearch.value); });
    el.pList.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-unit]');
        if (b) choose(b.getAttribute('data-unit'));
    });
    el.pClose.addEventListener('click', closePicker);
    el.picker.addEventListener('click', function (e) { if (e.target === el.picker) closePicker(); });   // tap outside the sheet

    el.substance.addEventListener('change', function () {
        var s = C.substance(el.substance.value);
        if (s) el.density.value = String(s.density);
        compute();
    });
    el.density.addEventListener('input', function () {
        var v = densityValue(), s = C.substance(el.substance.value);
        if (!s || s.density !== v) el.substance.value = 'custom';
        compute();
    });

    el.all.addEventListener('toggle', compute);
    el.rows.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-unit]');
        if (!b) return;
        var u = C.unit(st.cat.id, b.getAttribute('data-unit'));
        if (u) { st.to = u; update(); }
    });

    el.sig.addEventListener('change', function () { st.sig = parseInt(el.sig.value, 10) || 8; compute(); });
    el.group.addEventListener('change', function () { st.grouping = el.group.value; compute(); });

    /* ---------- Start ---------- */
    var year = $('year');
    if (year) year.textContent = new Date().getFullYear();

    buildCategories();
    buildSubstances();
    selectCategory('length', false);
})();