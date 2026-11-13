/* Run with:  node tests/converter.test.js */
var C = require('../assets/js/converter_engine.js');
var pass = 0, bad = 0;
function ok(name, cond, extra) { if (cond) pass++; else { bad++; console.log('FAIL', name, extra === undefined ? '' : extra); } }

/* ---- 1. Every unit you asked for is present (by name) ---- */
var REQUIRED = {
 length: ['Kilometre','Hectometre','Decametre','Metre','Decimetre','Centimetre','Millimetre','Micrometre','Nanometre','Picometre','Femtometre','Megametre','Gigametre','Inch','Foot','Yard','Mile','Nautical mile','Astronomical unit','Light-year','Parsec','Angstrom','Fathom','Chain','Furlong','Rod'],
 mass: ['Tonne','Kilogram','Hectogram','Decagram','Gram','Decigram','Centigram','Milligram','Microgram','Nanogram','Picogram','Pound','Ounce','Stone','US short ton','UK long ton','Carat','Grain','Atomic mass unit','Dalton','Quintal'],
 volume: ['Kilolitre','Hectolitre','Decalitre','Litre','Decilitre','Centilitre','Millilitre','Microlitre','Nanolitre','Cubic kilometre','Cubic metre','Cubic decimetre','Cubic centimetre','Cubic millimetre','Cubic inch','Cubic foot','Cubic yard','US gallon','Imperial gallon','US quart','US pint','US fluid ounce','Imperial fluid ounce','US cup','US tablespoon','US teaspoon','Barrel','Acre-foot'],
 time: ['Nanosecond','Microsecond','Millisecond','Second','Minute','Hour','Day','Week','Fortnight','Month','Year','Decade','Century','Millennium','Julian year','Planck time'],
 area: ['Square kilometre','Hectare','Are','Square metre','Square decimetre','Square centimetre','Square millimetre','Square micrometre','Square inch','Square foot','Square yard','Square mile','Acre','Square rod'],
 temperature: ['Celsius','Fahrenheit','Kelvin','Rankine','Réaumur'],
 speed: ['Metre per second','Kilometre per hour','Kilometre per second','Centimetre per second','Millimetre per second','Mile per hour','Foot per second','Knot','Mach','Speed of light'],
 acceleration: ['Metre per second squared','Centimetre per second squared','Foot per second squared','Standard gravity','Gal','Milligal'],
 force: ['Newton','Kilonewton','Meganewton','Millinewton','Dyne','Kilogram-force','Gram-force','Pound-force','Ounce-force','Poundal'],
 pressure: ['Pascal','Kilopascal','Megapascal','Gigapascal','Bar','Millibar','Hectopascal','Standard atmosphere','Torr','Millimetres of mercury','Inches of mercury','Pounds per square inch','Kilogram-force per square centimetre'],
 energy: ['Joule','Kilojoule','Megajoule','Gigajoule','Millijoule','Calorie','Kilocalorie','Kilowatt-hour','Watt-hour','Electronvolt','Kiloelectronvolt','Megaelectronvolt','British thermal unit','Erg','Foot-pound','Therm','Quad'],
 power: ['Watt','Kilowatt','Megawatt','Gigawatt','Milliwatt','Microwatt','Horsepower (mechanical)','Metric horsepower','Foot-pound per second','BTU per hour','Erg per second'],
 frequency: ['Hertz','Kilohertz','Megahertz','Gigahertz','Terahertz','Millihertz','Revolutions per minute','Revolutions per second','Cycles per second'],
 electrical: ['Ampere','Milliampere','Microampere','Coulomb','Millicoulomb','Volt','Millivolt','Kilovolt','Ohm','Kiloohm','Megaohm','Siemens','Millisiemens','Farad','Microfarad','Nanofarad','Picofarad','Henry','Millihenry','Weber','Tesla','Gauss','Ampere-hour','Milliampere-hour','Watt-hour'],
 light: ['Candela','Lumen','Lux','Foot-candle','Nit','Lambert','Stilb','Candela per square metre','Lumen per watt'],
 angle: ['Degree','Radian','Milliradian','Gradian','Arcminute','Arcsecond','Revolution','Turn','Steradian'],
 density: ['Kilogram per cubic metre','Gram per cubic centimetre','Gram per millilitre','Kilogram per litre','Gram per litre','Milligram per millilitre','Pound per cubic foot','Pound per gallon'],
 'data-storage': ['Bit','Byte','Kilobit','Kilobyte','Megabit','Megabyte','Gigabit','Gigabyte','Terabit','Terabyte','Petabit','Petabyte','Exabit','Exabyte','Zettabyte','Yottabyte','Kibibit','Kibibyte','Mebibit','Mebibyte','Gibibit','Gibibyte','Tebibyte','Pebibyte'],
 'data-transfer': ['Bits per second','Kilobits per second','Megabits per second','Gigabits per second','Terabits per second','Bytes per second','Kilobytes per second','Megabytes per second','Gigabytes per second'],
 chemical: ['Mole','Millimole','Micromole','Nanomole','Molarity','Molality','Parts per million','Parts per billion','Parts per trillion','Mass percentage','Volume percentage','Mass per volume percentage','Normality','Equivalent per litre'],
 torque: ['Newton-metre','Kilonewton-metre','Pound-foot','Pound-inch','Dyne-centimetre','Kilogram-force metre'],
 viscosity: ['Pascal-second','Millipascal-second','Poise','Centipoise','Stokes','Centistokes','Square metre per second'],
 magnetic: ['Tesla','Millitesla','Microtesla','Gauss','Weber','Maxwell','Ampere per metre','Oersted','Gilbert'],
 radiation: ['Becquerel','Kilobecquerel','Curie','Gray','Milligray','Sievert','Millisievert','Microsievert','Rad','Rem','Roentgen'],
 fuel: ['Kilometre per litre','Litre per 100 kilometres','Miles per gallon','Kilowatt-hour per 100 kilometres','Megajoule per kilogram','Kilocalorie per kilogram'],
 textile: ['Denier','Tex','Decitex','Thread count','Grams per square metre','Points (typography)','Pica','Dots per inch','Pixels per inch','Lines per inch'],
 astronomy: ['Astronomical unit','Light-year','Parsec','Kiloparsec','Megaparsec','Gigaparsec','Solar mass','Solar radius','Solar luminosity','Earth mass','Jupiter mass']
};
Object.keys(REQUIRED).forEach(function (id) {
    var cat = C.category(id); ok('category ' + id, !!cat);
    if (!cat) return;
    REQUIRED[id].forEach(function (n) {
        var found = cat.units.some(function (u) { return u.name === n || u.name.indexOf(n + ' (') === 0; });
        ok(id + ' has ' + n, found);
    });
});
var PREFIXES = ['Quetta','Ronna','Yotta','Zetta','Exa','Peta','Tera','Giga','Mega','Kilo','Hecto','Deca','Base unit','Deci','Centi','Milli','Micro','Nano','Pico','Femto','Atto','Zepto','Yocto','Ronto','Quecto'];
PREFIXES.forEach(function (p) { ok('prefix ' + p, C.category('si-prefixes').units.some(function (u) { return u.name.indexOf(p) === 0; })); });
ok('SI base units listed', C.siBase.length === 7);

/* ---- 2. Data sanity ---- */
C.categories.forEach(function (cat) {
    var ids = {};
    cat.units.forEach(function (u) {
        ok(cat.id + ' unique id ' + u.id, !ids[u.id]); ids[u.id] = 1;
        if (u.f !== undefined) ok(cat.id + ' positive factor ' + u.name, u.f > 0 && isFinite(u.f), u.f);
        // round trip through the base unit
        var xs = [1, 2.5, 100];
        xs.forEach(function (x) {
            if (u.pos && !(x > 0)) return;
            var base = u.f !== undefined ? x * u.f : u.to(x);
            var back = u.f !== undefined ? base / u.f : u.from(base);
            ok(cat.id + ' round trip ' + u.name + ' ' + x, Math.abs(back - x) <= 1e-9 * Math.abs(x), back);
        });
    });
    if (!cat.reference) { ok(cat.id + ' has defaults', !cat.def || (C.unitByName(cat.id, cat.def[0]) && C.unitByName(cat.id, cat.def[1])), cat.def); }
});

/* ---- 3. Known conversions ---- */
function conv(cat, a, b, x, opts) {
    var r = C.convert(C.unitByName(cat, a), C.unitByName(cat, b), x, opts);
    return r.ok ? r.value : 'ERR:' + r.code;
}
function near(name, got, want, tol) { ok(name + ' (got ' + got + ', want ' + want + ')', typeof got === 'number' && Math.abs(got - want) <= (tol || 1e-9) * Math.max(1, Math.abs(want))); }

near('1 km to m', conv('length', 'Kilometre', 'Metre', 1), 1000);
near('1 mile to km', conv('length', 'Mile', 'Kilometre', 1), 1.609344);
near('1 km to yard', conv('length', 'Kilometre', 'Yard', 1), 1093.6132983377);
near('1 m to mile', conv('length', 'Metre', 'Mile', 1), 0.000621371192237);
near('1 ly to km', conv('length', 'Light-year', 'Kilometre', 1), 9460730472580.8);
near('1 inch to mm', conv('length', 'Inch', 'Millimetre', 1), 25.4);
near('1 kg to lb', conv('mass', 'Kilogram', 'Pound', 1), 2.2046226218);
near('1 oz to g', conv('mass', 'Ounce', 'Gram', 1), 28.349523125);
near('1 L to ml', conv('volume', 'Litre', 'Millilitre', 1), 1000);
near('1 US gal to L', conv('volume', 'US gallon', 'Litre', 1), 3.785411784);
near('1 imp gal to L', conv('volume', 'Imperial gallon', 'Litre', 1), 4.54609);
near('1 cup to mL', conv('volume', 'US cup', 'Millilitre', 1), 236.5882365);
near('1 acre to ha', conv('area', 'Acre', 'Hectare', 1), 0.40468564224);
near('0 C to F', conv('temperature', 'Celsius', 'Fahrenheit', 0), 32);
near('100 C to F', conv('temperature', 'Celsius', 'Fahrenheit', 100), 212);
near('-40 F to C', conv('temperature', 'Fahrenheit', 'Celsius', -40), -40);
near('0 K to C', conv('temperature', 'Kelvin', 'Celsius', 0), -273.15);
near('300 K to F', conv('temperature', 'Kelvin', 'Fahrenheit', 300), 80.33);
near('0 K to F', conv('temperature', 'Kelvin', 'Fahrenheit', 0), -459.67);
near('491.67 R to C', conv('temperature', 'Rankine', 'Celsius', 491.67), 0);
near('80 Re to C', conv('temperature', 'Réaumur', 'Celsius', 80), 100);
ok('below absolute zero', conv('temperature', 'Celsius', 'Kelvin', -300) === 'ERR:BELOW');
near('100 km/h to mph', conv('speed', 'Kilometre per hour', 'Mile per hour', 100), 62.1371192237);
near('1 knot to km/h', conv('speed', 'Knot', 'Kilometre per hour', 1), 1.852);
near('1 atm to Pa', conv('pressure', 'Standard atmosphere', 'Pascal', 1), 101325);
near('1 bar to psi', conv('pressure', 'Bar', 'Pounds per square inch', 1), 14.5037737730);
near('1 kWh to MJ', conv('energy', 'Kilowatt-hour', 'Megajoule', 1), 3.6);
near('1 kcal to kJ', conv('energy', 'Kilocalorie', 'Kilojoule', 1), 4.184);
near('1 hp to kW', conv('power', 'Horsepower (mechanical)', 'Kilowatt', 1), 0.745699871582);
near('1 rpm to Hz', conv('frequency', 'Revolutions per minute', 'Hertz', 60), 1);
near('1 Ah to mAh', conv('electrical', 'Ampere-hour', 'Milliampere-hour', 1), 1000);
near('1 Ah to C', conv('electrical', 'Ampere-hour', 'Coulomb', 1), 3600);
ok('electrical: volts cannot become amps', conv('electrical', 'Volt', 'Ampere', 1) === 'ERR:INCOMPAT' || (function () { var a = C.unitByName('electrical', 'Volt'), b = C.unitByName('electrical', 'Ampere'); return !C.compatible(a).includes(b); })());
near('180 deg to rad', conv('angle', 'Degree', 'Radian', 180), Math.PI);
near('1 rev to deg', conv('angle', 'Revolution', 'Degree', 1), 360);
near('90 gon to deg', conv('angle', 'Gradian', 'Degree', 100), 90);
near('1 arcmin to arcsec', conv('angle', 'Arcminute', 'Arcsecond', 1), 60);
near('1 g/cm3 to kg/m3', conv('density', 'Gram per cubic centimetre', 'Kilogram per cubic metre', 1), 1000);
near('1 GB to MB', conv('data-storage', 'Gigabyte', 'Megabyte', 1), 1000);
near('1 GiB to MiB', conv('data-storage', 'Gibibyte', 'Mebibyte', 1), 1024);
near('1 byte to bit', conv('data-storage', 'Byte', 'Bit', 1), 8);
near('1 TB to GiB', conv('data-storage', 'Terabyte', 'Gibibyte', 1), 931.322574615);
near('100 Mbps to MB/s', conv('data-transfer', 'Megabits per second', 'Megabytes per second', 100), 12.5);
near('1 ppm to ppb', conv('chemical', 'Parts per million', 'Parts per billion', 1), 1000);
near('1 mol to mmol', conv('chemical', 'Mole', 'Millimole', 1), 1000);
near('1 lbf ft to N m', conv('torque', 'Pound-foot', 'Newton-metre', 1), 1.3558179483);
near('1 cP to Pa s', conv('viscosity', 'Centipoise', 'Pascal-second', 1), 0.001);
near('1 T to G', conv('magnetic', 'Tesla', 'Gauss', 1), 10000);
near('1 Ci to Bq', conv('radiation', 'Curie', 'Becquerel', 1), 3.7e10);
near('1 Sv to rem', conv('radiation', 'Sievert', 'Rem', 1), 100);
near('30 mpg US to L/100km', conv('fuel', 'Miles per gallon (US)', 'Litre per 100 kilometres', 30), 7.84049, 1e-5);
near('10 km/L to L/100km', conv('fuel', 'Kilometre per litre', 'Litre per 100 kilometres', 10), 10);
near('10 L/100km to km/L', conv('fuel', 'Litre per 100 kilometres', 'Kilometre per litre', 10), 10);
near('8 L/100km to mpg US', conv('fuel', 'Litre per 100 kilometres', 'Miles per gallon (US)', 8), 29.4018, 1e-5);
near('20 kWh/100km to mi/kWh', conv('fuel', 'Kilowatt-hour per 100 kilometres', 'Miles per kilowatt-hour', 20), 3.10686, 1e-5);
ok('0 km/L is rejected', conv('fuel', 'Kilometre per litre', 'Litre per 100 kilometres', 0) === 'ERR:POSITIVE');
near('1 pt to px', conv('textile', 'Points (typography)', 'Pixel (CSS)', 1), 1.33333333333);
near('1 pica to pt', conv('textile', 'Pica', 'Points (typography)', 1), 12);
near('9 den to tex', conv('textile', 'Denier', 'Tex', 9), 1);
near('1 ly to pc', conv('astronomy', 'Light-year', 'Parsec', 1), 0.306601393788);
near('1 kilo to milli', conv('si-prefixes', 'Kilo (k)', 'Milli (m)', 1), 1e6);
near('1 quecto to Quetta', conv('si-prefixes', 'Quecto (q)', 'Quetta (Q)', 1), 1e-60, 1e-9);
near('1 year to days', conv('time', 'Year', 'Day', 1), 365.2425);
near('1 hour to s', conv('time', 'Hour', 'Second', 1), 3600);

/* ---- 4. The mass / volume bridge ---- */
var water = C.substance('water-about-4-c').density;
near('1 kg to L of water', conv('mass-volume', 'Kilogram', 'Litre', 1, { density: water }), 1);
near('500 mL of water to kg', conv('mass-volume', 'Millilitre', 'Kilogram', 500, { density: water }), 0.5);
near('1 L olive oil to kg', conv('mass-volume', 'Litre', 'Kilogram', 1, { density: C.substance('olive-oil').density }), 0.91);
near('1 kg honey to mL', conv('mass-volume', 'Kilogram', 'Millilitre', 1, { density: C.substance('honey').density }), 704.2253521);
near('1 lb of water to US cups', conv('mass-volume', 'Pound', 'US cup', 1, { density: water }), 1.9172, 1e-4);
near('1 m3 of mercury to tonne', conv('mass-volume', 'Cubic metre', 'Tonne (Metric ton)', 1, { density: 13534 }), 13.534);
ok('bridge needs density', conv('mass-volume', 'Kilogram', 'Litre', 1, {}) === 'ERR:DENSITY');
ok('no bridge in length', conv('length', 'Metre', 'Metre', 1) === 1);
near('dynamic to kinematic', conv('viscosity', 'Pascal-second', 'Square metre per second', 1, { density: 1000 }), 0.001);
near('kinematic to dynamic', conv('viscosity', 'Centistokes', 'Centipoise', 1, { density: 1000 }), 1);
ok('mass-volume compat covers both groups', C.compatible(C.unitByName('mass-volume', 'Kilogram')).length === C.category('mass-volume').units.length);
ok('same-group only in length', C.compatible(C.unitByName('length', 'Metre')).length === C.category('length').units.length);
ok('needsDensity', C.needsDensity(C.unitByName('mass-volume', 'Kilogram'), C.unitByName('mass-volume', 'Litre')) && !C.needsDensity(C.unitByName('mass-volume', 'Kilogram'), C.unitByName('mass-volume', 'Gram')));

/* ---- 5. Reading values ---- */
function pv(s) { var r = C.parseValue(s); return r.ok ? r.value : 'ERR:' + r.code; }
ok('parse 12.5', pv('12.5') === 12.5); ok('parse -5', pv('-5') === -5); ok('parse unicode minus', pv('−5') === -5);
ok('parse 1E-3', pv('1E-3') === 0.001); ok('parse 1e5', pv('1e5') === 100000); ok('parse .5', pv('.5') === 0.5);
ok('parse 1,234.5', pv('1,234.5') === 1234.5); ok('parse indian 12,34,567', pv('12,34,567') === 1234567);
ok('parse decimal comma', pv('1,5') === 1.5); ok('parse 1,500 is thousands', pv('1,500') === 1500);
ok('parse spaces', pv('  42  ') === 42); ok('parse expression 5*12', pv('5*12') === 60); ok('parse expression (2+3)/4', pv('(2+3)/4') === 1.25);
ok('parse 1e3/4 expression', pv('1e3/4') === 250);
ok('empty', pv('') === 'ERR:EMPTY'); ok('letters rejected', pv('abc') === 'ERR:SYNTAX'); ok('code rejected', pv('alert(1)') === 'ERR:SYNTAX');
ok('pi word rejected', pv('pi*2') === 'ERR:SYNTAX'); ok('too long', pv(new Array(80).join('1')) === 'ERR:LONG'); ok('huge rejected', pv('1e999') === 'ERR:RANGE');
ok('script rejected', pv('<script>') === 'ERR:SYNTAX'); ok('toString rejected', pv('constructor') === 'ERR:SYNTAX');

/* ---- 6. Showing numbers ---- */
function f(n, o) { return C.format(n, o).display; }
ok('fmt 0.3', f(0.1 + 0.2) === '0.3'); ok('fmt 1000', f(1000) === '1000'); ok('fmt grouped intl', f(1234567.891, { grouping: 'intl' }) === '1,234,567.891');
ok('fmt grouped indian', f(1234567.891, { grouping: 'indian' }) === '12,34,567.891'); ok('fmt grouped indian 123456', f(123456, { grouping: 'indian' }) === '1,23,456');
ok('fmt sci auto big', f(9.4607304725808e15) === '9.460730473 × 10¹⁵'); ok('fmt sci auto small', f(1.5e-9) === '1.5 × 10⁻⁹');
ok('fmt plain 1e-5', f(1e-5) === '0.00001'); ok('fmt negative', f(-2.5) === '−2.5'); ok('fmt sig 4', f(3.14159265, { sig: 4 }) === '3.142');
ok('fmt forced sci', f(1234.5, { notation: 'scientific' }) === '1.2345 × 10³'); ok('fmt forced plain', f(1e18, { notation: 'plain' }) === '1000000000000000000');
ok('copy plain', C.format(9.4607304725808e15).plain === '9.460730473E15'); ok('copy plain neg', C.format(-0.5).plain === '-0.5');
ok('fmt 5280 noise', f(1609.344 / 0.3048) === '5280'); ok('fmt 212', f(100 * 9 / 5 + 32) === '212');
ok('fmt 1/3 sig15', f(1 / 3, { sig: 15 }) === '0.333333333333333');

/* ---- 7. Search and quick convert ---- */
ok('search km', C.search('km')[0].unit.name === 'Kilometre'); ok('search kilometer (US spelling)', C.search('kilometer')[0].unit.name === 'Kilometre');
ok('search gallon finds US gallon', C.search('gallon').some(function (r) { return r.unit.name === 'US gallon'; }));
ok('search feet', C.search('feet')[0].unit.name === 'Foot'); ok('search celsius', C.search('celsius')[0].unit.name === 'Celsius');
ok('search nothing', C.search('zzzzqq').length === 0); ok('search micro sign', C.search('µm').some(function (r) { return r.unit.name === 'Micrometre'; }));
var q = C.quick('5 km to miles'); ok('quick 5 km to miles', q && q.from.name === 'Kilometre' && q.to.name === 'Mile' && q.value === 5);
q = C.quick('kg to litre'); ok('quick kg to litre', q && q.from.cat.id === 'mass-volume' && q.from.name === 'Kilogram' && q.to.name === 'Litre');
q = C.quick('ml to kg'); ok('quick ml to kg', q && q.from.cat.id === 'mass-volume');
q = C.quick('100 f to c'); ok('quick 100 f to c', q && q.from.name === 'Fahrenheit' && q.to.name === 'Celsius');
q = C.quick('meter to miles'); ok('quick meter to miles', q && q.from.name === 'Metre' && q.to.name === 'Mile');
q = C.quick('km to yard'); ok('quick km to yard', q && q.to.name === 'Yard');
ok('quick garbage', C.quick('hello world') === null);
var st = C.stats(); ok('stats', st.units > 400 && st.categories === 30, JSON.stringify(st));

console.log(pass + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);