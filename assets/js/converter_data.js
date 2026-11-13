/* =========================================================
   MetriFlow | converter_data.js
   The unit database (data only, no page code).

   A unit row is:  [ name, symbol, factor, aliases, note ]
     factor  = how many BASE units make 1 of this unit (e.g. 1 km = 1000 metres)
             or { to, from, pos } for units that are not a simple multiple
             (temperature, fuel economy).
   Every group has one base unit. Units in the same group convert directly.
   Some categories have a "bridge" (density), so mass can convert to volume.
   ========================================================= */
(function (root) {
    'use strict';

    var PI = Math.PI;
    var MI = 1.609344;                                   // kilometres in a mile

    function T(to, from) { return { to: to, from: from }; }
    function R(k) {                                      // reciprocal units, e.g. L/100 km = 100 / (km/L)
        return { to: function (x) { return k / x; }, from: function (b) { return k / b; }, pos: true };
    }
    function G(id, label, base, units, opts) {
        var g = { id: id, label: label, base: base, units: units };
        if (opts && opts.min !== undefined) g.min = opts.min;
        return g;
    }

    /* ---------- Shared unit tables ---------- */
    var LENGTH = [
        ['Kilometre', 'km', 1e3, 'kilometer kilometres kilometers'],
        ['Hectometre', 'hm', 1e2, 'hectometer'],
        ['Decametre', 'dam', 10, 'decameter dekametre'],
        ['Metre', 'm', 1, 'meter meters metres'],
        ['Decimetre', 'dm', 0.1, 'decimeter'],
        ['Centimetre', 'cm', 0.01, 'centimeter centimetres'],
        ['Millimetre', 'mm', 1e-3, 'millimeter millimetres'],
        ['Micrometre', 'µm', 1e-6, 'micrometer micron'],
        ['Nanometre', 'nm', 1e-9, 'nanometer'],
        ['Picometre', 'pm', 1e-12, 'picometer'],
        ['Femtometre', 'fm', 1e-15, 'femtometer fermi'],
        ['Megametre', 'Mm', 1e6, 'megameter'],
        ['Gigametre', 'Gm', 1e9, 'gigameter'],
        ['Inch', 'in', 0.0254, 'inches'],
        ['Foot', 'ft', 0.3048, 'feet'],
        ['Yard', 'yd', 0.9144, 'yards'],
        ['Mile', 'mi', 1609.344, 'miles'],
        ['Nautical mile', 'nmi', 1852, 'nautical miles'],
        ['Astronomical unit', 'AU', 149597870700, 'astronomical units'],
        ['Light-year', 'ly', 9460730472580800, 'light year lightyear'],
        ['Parsec', 'pc', 30856775814913673, 'parsecs'],
        ['Angstrom', 'Å', 1e-10, 'ångström angstroms'],
        ['Fathom', 'fathom', 1.8288, 'fathoms'],
        ['Chain', 'ch', 20.1168, 'chains'],
        ['Furlong', 'fur', 201.168, 'furlongs'],
        ['Rod', 'rd', 5.0292, 'rods pole perch']
    ];

    var MASS = [
        ['Tonne (Metric ton)', 't', 1000, 'metric ton tonnes'],
        ['Kilogram', 'kg', 1, 'kilo kilograms kilogramme kgs'],
        ['Hectogram', 'hg', 0.1, ''],
        ['Decagram', 'dag', 0.01, 'dekagram'],
        ['Gram', 'g', 1e-3, 'grams gramme'],
        ['Decigram', 'dg', 1e-4, ''],
        ['Centigram', 'cg', 1e-5, ''],
        ['Milligram', 'mg', 1e-6, 'milligrams'],
        ['Microgram', 'µg', 1e-9, 'mcg'],
        ['Nanogram', 'ng', 1e-12, ''],
        ['Picogram', 'pg', 1e-15, ''],
        ['Pound', 'lb', 0.45359237, 'pounds lbs'],
        ['Ounce', 'oz', 0.028349523125, 'ounces'],
        ['Stone', 'st', 6.35029318, 'stones'],
        ['US short ton', 'short ton', 907.18474, 'ton us ton'],
        ['UK long ton', 'long ton', 1016.0469088, 'imperial ton ton uk ton'],
        ['Carat', 'ct', 2e-4, 'carats'],
        ['Grain', 'gr', 6.479891e-5, 'grains'],
        ['Atomic mass unit', 'u', 1.66053906892e-27, 'amu'],
        ['Dalton', 'Da', 1.66053906892e-27, ''],
        ['Quintal', 'q', 100, 'quintals']
    ];

    var VOLUME = [
        ['Kilolitre', 'kL', 1, 'kiloliter'],
        ['Hectolitre', 'hL', 0.1, 'hectoliter'],
        ['Decalitre', 'daL', 0.01, 'decaliter'],
        ['Litre', 'L', 1e-3, 'liter litres liters'],
        ['Decilitre', 'dL', 1e-4, 'deciliter'],
        ['Centilitre', 'cL', 1e-5, 'centiliter'],
        ['Millilitre', 'mL', 1e-6, 'milliliter millilitres'],
        ['Microlitre', 'µL', 1e-9, 'microliter'],
        ['Nanolitre', 'nL', 1e-12, 'nanoliter'],
        ['Cubic kilometre', 'km³', 1e9, 'cubic kilometer'],
        ['Cubic metre', 'm³', 1, 'cubic meter cbm'],
        ['Cubic decimetre', 'dm³', 1e-3, 'cubic decimeter'],
        ['Cubic centimetre', 'cm³', 1e-6, 'cubic centimeter cc'],
        ['Cubic millimetre', 'mm³', 1e-9, 'cubic millimeter'],
        ['Cubic inch', 'in³', 1.6387064e-5, 'cubic inches cu in'],
        ['Cubic foot', 'ft³', 0.028316846592, 'cubic feet cu ft'],
        ['Cubic yard', 'yd³', 0.764554857984, 'cubic yards cu yd'],
        ['US gallon', 'US gal', 0.003785411784, 'gallon gallons gal'],
        ['Imperial gallon', 'Imp gal', 0.00454609, 'uk gallon gallon'],
        ['US quart', 'qt', 9.46352946e-4, 'quart quarts'],
        ['US pint', 'pt', 4.73176473e-4, 'pint pints'],
        ['US fluid ounce', 'US fl oz', 2.95735295625e-5, 'fluid ounce fl oz'],
        ['Imperial fluid ounce', 'Imp fl oz', 2.84130625e-5, 'uk fluid ounce'],
        ['US cup', 'cup', 2.365882365e-4, 'cups'],
        ['US tablespoon', 'tbsp', 1.478676478125e-5, 'tablespoon'],
        ['US teaspoon', 'tsp', 4.92892159375e-6, 'teaspoon'],
        ['Barrel', 'bbl', 0.158987294928, 'oil barrel barrels', 'US oil barrel (42 US gallons).'],
        ['Acre-foot', 'acre-ft', 1233.48183754752, 'acre foot']
    ];

    /* ---------- Densities used by the mass / volume bridge (kg per cubic metre) ---------- */
    var SUBSTANCES = [
        ['Water (about 4 °C)', 1000], ['Water (20 °C)', 998.2], ['Seawater', 1025], ['Milk (whole)', 1030],
        ['Cooking oil (vegetable)', 920], ['Olive oil', 910], ['Sunflower oil', 919], ['Coconut oil (liquid)', 924],
        ['Honey', 1420], ['Vinegar', 1010], ['Blood', 1060],
        ['Petrol (gasoline)', 745], ['Diesel', 832], ['Kerosene', 810], ['Engine oil', 880],
        ['Ethanol', 789], ['Methanol', 792], ['Acetone', 784], ['Glycerin', 1261], ['Mercury', 13534],
        ['Ice', 917], ['Air (15 °C, sea level)', 1.225],
        ['Sugar (granulated, bulk)', 850], ['Flour (bulk)', 590], ['Salt (table, bulk)', 1200], ['Rice (uncooked, bulk)', 850],
        ['Sand (dry)', 1600], ['Cement (bulk)', 1440], ['Concrete', 2400], ['Oak wood', 750], ['Glass', 2500],
        ['Aluminium', 2700], ['Iron', 7870], ['Steel', 7850], ['Copper', 8960], ['Lead', 11340], ['Silver', 10490], ['Gold', 19320]
    ];

    var SI_BASE = [
        ['Length', 'Metre', 'm', 'length'],
        ['Mass', 'Kilogram', 'kg', 'mass'],
        ['Time', 'Second', 's', 'time'],
        ['Electric current', 'Ampere', 'A', 'electrical'],
        ['Thermodynamic temperature', 'Kelvin', 'K', 'temperature'],
        ['Amount of substance', 'Mole', 'mol', 'chemical'],
        ['Luminous intensity', 'Candela', 'cd', 'light']
    ];

    var KB = 1024;

    var CATEGORIES = [
        { id: 'length', short: 'Length', name: 'Length / Distance', def: ['Kilometre', 'Mile'],
          desc: 'Height, width, depth, distance, thickness and dimensions.',
          groups: [G('length', 'Length', 'Metre', LENGTH)] },

        { id: 'mass', short: 'Mass', name: 'Weight / Mass', def: ['Kilogram', 'Pound'],
          desc: 'The mass of objects, materials, people and substances.',
          groups: [G('mass', 'Mass', 'Kilogram', MASS)] },

        { id: 'volume', short: 'Volume', name: 'Volume / Capacity', def: ['Litre', 'US gallon'],
          desc: 'Liquids, gases and three-dimensional space.',
          groups: [G('volume', 'Volume', 'Cubic metre', VOLUME)] },

        { id: 'mass-volume', short: 'Mass ⇄ Volume', name: 'Mass ⇄ Volume (by density)', def: ['Kilogram', 'Litre'],
          desc: 'Convert between weight and volume, such as kg to litres or millilitres to kg. Choose the substance, because it depends on density.',
          groups: [G('mass', 'Mass', 'Kilogram', MASS), G('volume', 'Volume', 'Cubic metre', VOLUME)],
          bridge: { kind: 'density', pairs: {
              'mass>volume': function (m, rho) { return m / rho; },
              'volume>mass': function (v, rho) { return v * rho; } } } },

        { id: 'time', short: 'Time', name: 'Time', def: ['Hour', 'Minute'],
          desc: 'Duration, intervals and time periods.',
          groups: [G('time', 'Time', 'Second', [
              ['Nanosecond', 'ns', 1e-9, ''], ['Microsecond', 'µs', 1e-6, ''], ['Millisecond', 'ms', 1e-3, ''],
              ['Second', 's', 1, 'seconds sec'], ['Minute', 'min', 60, 'minutes'], ['Hour', 'h', 3600, 'hours hr'],
              ['Day', 'd', 86400, 'days'], ['Week', 'wk', 604800, 'weeks'], ['Fortnight', '', 1209600, 'fortnights', 'Two weeks (14 days).'],
              ['Month', 'mo', 2629746, 'months', 'Average Gregorian month: 30.436875 days.'],
              ['Year', 'yr', 31556952, 'years annum', 'Average Gregorian year: 365.2425 days.'],
              ['Decade', '', 315569520, 'decades', '10 average Gregorian years.'],
              ['Century', '', 3155695200, 'centuries', '100 average Gregorian years.'],
              ['Millennium', '', 31556952000, 'millennia', '1000 average Gregorian years.'],
              ['Julian year', 'a', 31557600, 'julian', 'Exactly 365.25 days (used in astronomy).'],
              ['Planck time', 'tP', 5.391247e-44, '', 'About 5.39 × 10⁻⁴⁴ seconds.']
          ])] },

        { id: 'area', short: 'Area', name: 'Area', def: ['Acre', 'Hectare'],
          desc: 'The surface area of land, rooms, buildings and objects.',
          groups: [G('area', 'Area', 'Square metre', [
              ['Square kilometre', 'km²', 1e6, 'square kilometer sq km'], ['Hectare', 'ha', 1e4, 'hectares'], ['Are', 'a', 100, ''],
              ['Square metre', 'm²', 1, 'square meter sq m'], ['Square decimetre', 'dm²', 0.01, ''],
              ['Square centimetre', 'cm²', 1e-4, 'square centimeter sq cm'], ['Square millimetre', 'mm²', 1e-6, ''],
              ['Square micrometre', 'µm²', 1e-12, ''], ['Square inch', 'in²', 6.4516e-4, 'sq in square inches'],
              ['Square foot', 'ft²', 0.09290304, 'sq ft square feet'], ['Square yard', 'yd²', 0.83612736, 'sq yd'],
              ['Square mile', 'mi²', 2589988.110336, 'sq mi'], ['Acre', 'ac', 4046.8564224, 'acres'],
              ['Square rod', 'rd²', 25.29285264, 'square perch']
          ])] },

        { id: 'temperature', short: 'Temperature', name: 'Temperature', def: ['Celsius', 'Fahrenheit'],
          desc: 'Hotness and coldness. Values below absolute zero are not possible.',
          groups: [G('temperature', 'Temperature', 'Celsius', [
              ['Celsius', '°C', T(function (x) { return x; }, function (b) { return b; }), 'centigrade'],
              ['Fahrenheit', '°F', T(function (x) { return (x - 32) * 5 / 9; }, function (b) { return b * 9 / 5 + 32; }), ''],
              ['Kelvin', 'K', T(function (x) { return x - 273.15; }, function (b) { return b + 273.15; }), ''],
              ['Rankine', '°R', T(function (x) { return (x - 491.67) * 5 / 9; }, function (b) { return b * 9 / 5 + 491.67; }), ''],
              ['Réaumur', '°Ré', T(function (x) { return x * 5 / 4; }, function (b) { return b * 4 / 5; }), 'reaumur']
          ], { min: -273.15 })] },

        { id: 'speed', short: 'Speed', name: 'Speed / Velocity', def: ['Kilometre per hour', 'Mile per hour'],
          desc: 'How fast an object moves.',
          groups: [G('speed', 'Speed', 'Metre per second', [
              ['Metre per second', 'm/s', 1, 'meter per second mps'], ['Kilometre per hour', 'km/h', 1000 / 3600, 'kph kmph kmh'],
              ['Kilometre per second', 'km/s', 1000, ''], ['Centimetre per second', 'cm/s', 0.01, ''],
              ['Millimetre per second', 'mm/s', 0.001, ''], ['Mile per hour', 'mph', 0.44704, 'miles per hour'],
              ['Foot per second', 'ft/s', 0.3048, 'fps feet per second'], ['Knot', 'kn', 1852 / 3600, 'knots'],
              ['Mach', 'Ma', 340.294, '', 'Speed of sound at sea level and 15 °C (340.294 m/s).'],
              ['Speed of light', 'c', 299792458, 'light speed']
          ])] },

        { id: 'acceleration', short: 'Acceleration', name: 'Acceleration', def: ['Metre per second squared', 'Standard gravity'],
          desc: 'The rate at which speed changes.',
          groups: [G('acceleration', 'Acceleration', 'Metre per second squared', [
              ['Metre per second squared', 'm/s²', 1, 'meter per second squared'], ['Centimetre per second squared', 'cm/s²', 0.01, ''],
              ['Foot per second squared', 'ft/s²', 0.3048, ''], ['Standard gravity', 'g₀', 9.80665, 'g force gravity'],
              ['Gal', 'Gal', 0.01, 'galileo'], ['Milligal', 'mGal', 1e-5, '']
          ])] },

        { id: 'force', short: 'Force', name: 'Force', def: ['Newton', 'Pound-force'],
          desc: 'Pushes and pulls, from newtons to pounds-force.',
          groups: [G('force', 'Force', 'Newton', [
              ['Newton', 'N', 1, ''], ['Kilonewton', 'kN', 1e3, ''], ['Meganewton', 'MN', 1e6, ''], ['Millinewton', 'mN', 1e-3, ''],
              ['Dyne', 'dyn', 1e-5, ''], ['Kilogram-force', 'kgf', 9.80665, 'kilopond'], ['Gram-force', 'gf', 9.80665e-3, ''],
              ['Pound-force', 'lbf', 4.4482216152605, ''], ['Ounce-force', 'ozf', 4.4482216152605 / 16, ''], ['Poundal', 'pdl', 0.138254954376, '']
          ])] },

        { id: 'pressure', short: 'Pressure', name: 'Pressure', def: ['Pounds per square inch', 'Bar'],
          desc: 'Atmospheric, gas and mechanical pressure.',
          groups: [G('pressure', 'Pressure', 'Pascal', [
              ['Pascal', 'Pa', 1, ''], ['Kilopascal', 'kPa', 1e3, ''], ['Megapascal', 'MPa', 1e6, ''], ['Gigapascal', 'GPa', 1e9, ''],
              ['Bar', 'bar', 1e5, ''], ['Millibar', 'mbar', 100, ''], ['Hectopascal', 'hPa', 100, ''],
              ['Standard atmosphere', 'atm', 101325, 'atmosphere atmospheres'],
              ['Technical atmosphere', 'at', 98066.5, 'atmosphere', '1 kgf/cm² (98,066.5 Pa).'],
              ['Torr', 'Torr', 101325 / 760, ''], ['Millimetres of mercury', 'mmHg', 133.322387415, 'millimeters of mercury'],
              ['Inches of mercury', 'inHg', 3386.389, ''], ['Pounds per square inch', 'psi', 6894.757293168361, 'pound per square inch'],
              ['Kilogram-force per square centimetre', 'kgf/cm²', 98066.5, '']
          ])] },

        { id: 'energy', short: 'Energy', name: 'Energy / Work / Heat', def: ['Kilocalorie', 'Kilojoule'],
          desc: 'Energy, work and heat.',
          groups: [G('energy', 'Energy', 'Joule', [
              ['Joule', 'J', 1, ''], ['Kilojoule', 'kJ', 1e3, ''], ['Megajoule', 'MJ', 1e6, ''], ['Gigajoule', 'GJ', 1e9, ''], ['Millijoule', 'mJ', 1e-3, ''],
              ['Calorie', 'cal', 4.184, '', 'Thermochemical calorie (4.184 J).'],
              ['Kilocalorie', 'kcal', 4184, 'food calorie calories', 'Thermochemical kilocalorie, the "Calorie" on food labels.'],
              ['Kilowatt-hour', 'kWh', 3.6e6, 'unit of electricity'], ['Watt-hour', 'Wh', 3600, ''],
              ['Electronvolt', 'eV', 1.602176634e-19, 'electron volt'], ['Kiloelectronvolt', 'keV', 1.602176634e-16, ''],
              ['Megaelectronvolt', 'MeV', 1.602176634e-13, ''],
              ['British thermal unit', 'BTU', 1055.05585262, 'btu', 'International Table BTU.'],
              ['Erg', 'erg', 1e-7, ''], ['Foot-pound', 'ft·lbf', 1.3558179483314004, 'foot pound'],
              ['Therm', 'thm', 105480400, 'us therm'], ['Quad', 'quad', 1.05505585262e18, '', 'One quadrillion BTU.']
          ])] },

        { id: 'power', short: 'Power', name: 'Power', def: ['Kilowatt', 'Horsepower (mechanical)'],
          desc: 'The rate of energy transfer or work.',
          groups: [G('power', 'Power', 'Watt', [
              ['Watt', 'W', 1, ''], ['Kilowatt', 'kW', 1e3, ''], ['Megawatt', 'MW', 1e6, ''], ['Gigawatt', 'GW', 1e9, ''],
              ['Milliwatt', 'mW', 1e-3, ''], ['Microwatt', 'µW', 1e-6, ''],
              ['Horsepower (mechanical)', 'hp', 745.6998715822702, 'horsepower bhp'],
              ['Metric horsepower', 'PS', 735.49875, 'ps cv pferdestarke'],
              ['Foot-pound per second', 'ft·lbf/s', 1.3558179483314004, ''],
              ['BTU per hour', 'BTU/h', 1055.05585262 / 3600, 'btu per hour'], ['Erg per second', 'erg/s', 1e-7, '']
          ])] },

        { id: 'frequency', short: 'Frequency', name: 'Frequency', def: ['Megahertz', 'Hertz'],
          desc: 'Repeated events, cycles and oscillations.',
          groups: [G('frequency', 'Frequency', 'Hertz', [
              ['Hertz', 'Hz', 1, ''], ['Kilohertz', 'kHz', 1e3, ''], ['Megahertz', 'MHz', 1e6, ''], ['Gigahertz', 'GHz', 1e9, ''],
              ['Terahertz', 'THz', 1e12, ''], ['Millihertz', 'mHz', 1e-3, ''],
              ['Revolutions per minute', 'rpm', 1 / 60, 'rev per minute'], ['Revolutions per second', 'rps', 1, ''], ['Cycles per second', 'cps', 1, '']
          ])] },

        { id: 'electrical', short: 'Electrical', name: 'Electrical', def: ['Milliampere-hour', 'Ampere-hour'],
          desc: 'Current, charge, voltage, resistance, capacitance and more. Units are grouped by what they measure.',
          groups: [
              G('current', 'Electric current', 'Ampere', [['Ampere', 'A', 1, 'amp amps'], ['Milliampere', 'mA', 1e-3, 'milliamp'], ['Microampere', 'µA', 1e-6, ''], ['Kiloampere', 'kA', 1e3, ''], ['Nanoampere', 'nA', 1e-9, '']]),
              G('charge', 'Electric charge', 'Coulomb', [['Coulomb', 'C', 1, ''], ['Millicoulomb', 'mC', 1e-3, ''], ['Ampere-hour', 'Ah', 3600, 'amp hour'], ['Milliampere-hour', 'mAh', 3.6, 'milliamp hour battery']]),
              G('voltage', 'Voltage', 'Volt', [['Volt', 'V', 1, 'volts'], ['Millivolt', 'mV', 1e-3, ''], ['Kilovolt', 'kV', 1e3, ''], ['Microvolt', 'µV', 1e-6, ''], ['Megavolt', 'MV', 1e6, '']]),
              G('resistance', 'Resistance', 'Ohm', [['Ohm', 'Ω', 1, 'ohms'], ['Kiloohm', 'kΩ', 1e3, 'kilohm'], ['Megaohm', 'MΩ', 1e6, 'megohm'], ['Milliohm', 'mΩ', 1e-3, ''], ['Gigaohm', 'GΩ', 1e9, '']]),
              G('conductance', 'Conductance', 'Siemens', [['Siemens', 'S', 1, 'mho'], ['Millisiemens', 'mS', 1e-3, ''], ['Microsiemens', 'µS', 1e-6, '']]),
              G('capacitance', 'Capacitance', 'Farad', [['Farad', 'F', 1, ''], ['Microfarad', 'µF', 1e-6, 'mfd'], ['Nanofarad', 'nF', 1e-9, ''], ['Picofarad', 'pF', 1e-12, ''], ['Millifarad', 'mF', 1e-3, '']]),
              G('inductance', 'Inductance', 'Henry', [['Henry', 'H', 1, ''], ['Millihenry', 'mH', 1e-3, ''], ['Microhenry', 'µH', 1e-6, '']]),
              G('flux', 'Magnetic flux', 'Weber', [['Weber', 'Wb', 1, ''], ['Milliweber', 'mWb', 1e-3, ''], ['Microweber', 'µWb', 1e-6, '']]),
              G('fluxdensity', 'Magnetic flux density', 'Tesla', [['Tesla', 'T', 1, ''], ['Gauss', 'G', 1e-4, ''], ['Millitesla', 'mT', 1e-3, ''], ['Microtesla', 'µT', 1e-6, '']]),
              G('energy', 'Electrical energy', 'Joule', [['Watt-hour', 'Wh', 3600, ''], ['Kilowatt-hour', 'kWh', 3.6e6, ''], ['Milliwatt-hour', 'mWh', 3.6, ''], ['Joule', 'J', 1, ''], ['Kilojoule', 'kJ', 1e3, '']])
          ] },

        { id: 'light', short: 'Light', name: 'Light / Photometry', def: ['Foot-candle', 'Lux'],
          desc: 'Lighting, photography and optical measurements. Units are grouped by what they measure.',
          groups: [
              G('intensity', 'Luminous intensity', 'Candela', [['Candela', 'cd', 1, ''], ['Millicandela', 'mcd', 1e-3, '']]),
              G('luminousflux', 'Luminous flux', 'Lumen', [['Lumen', 'lm', 1, ''], ['Kilolumen', 'klm', 1e3, '']]),
              G('illuminance', 'Illuminance', 'Lux', [['Lux', 'lx', 1, ''], ['Foot-candle', 'fc', 10.763910416709722, 'footcandle'], ['Phot', 'ph', 1e4, ''], ['Kilolux', 'klx', 1e3, '']]),
              G('luminance', 'Luminance', 'Candela per square metre', [['Nit', 'nt', 1, ''], ['Candela per square metre', 'cd/m²', 1, ''], ['Lambert', 'L', 1e4 / PI, ''], ['Stilb', 'sb', 1e4, ''], ['Foot-lambert', 'fL', 10.763910416709722 / PI, 'foot lambert']]),
              G('efficacy', 'Luminous efficacy', 'Lumen per watt', [['Lumen per watt', 'lm/W', 1, ''], ['Lumen per kilowatt', 'lm/kW', 1e-3, '']])
          ] },

        { id: 'angle', short: 'Angle', name: 'Angle', def: ['Degree', 'Radian'],
          desc: 'Geometry, mathematics, navigation and engineering.',
          groups: [
              G('angle', 'Plane angle', 'Radian', [['Degree', '°', PI / 180, 'degrees deg'], ['Radian', 'rad', 1, 'radians'], ['Milliradian', 'mrad', 1e-3, ''],
                  ['Gradian', 'gon', PI / 200, 'grad grade'], ['Arcminute', '′', PI / 10800, 'arc minute'], ['Arcsecond', '″', PI / 648000, 'arc second'],
                  ['Revolution', 'rev', 2 * PI, 'revolutions'], ['Turn', 'turn', 2 * PI, 'turns']]),
              G('solid', 'Solid angle', 'Steradian', [['Steradian', 'sr', 1, ''], ['Square degree', 'deg²', Math.pow(PI / 180, 2), ''], ['Spat', 'sp', 4 * PI, '']])
          ] },

        { id: 'density', short: 'Density', name: 'Density', def: ['Kilogram per cubic metre', 'Gram per cubic centimetre'],
          desc: 'Mass per unit volume.',
          groups: [G('density', 'Density', 'Kilogram per cubic metre', [
              ['Kilogram per cubic metre', 'kg/m³', 1, ''], ['Gram per cubic centimetre', 'g/cm³', 1000, ''], ['Gram per millilitre', 'g/mL', 1000, ''],
              ['Kilogram per litre', 'kg/L', 1000, ''], ['Gram per litre', 'g/L', 1, ''], ['Milligram per millilitre', 'mg/mL', 1, ''],
              ['Pound per cubic foot', 'lb/ft³', 16.01846337396014, ''], ['Pound per gallon', 'lb/gal', 0.45359237 / 0.003785411784, 'pound per us gallon', 'Pound per US gallon.']
          ])] },

        { id: 'data-storage', short: 'Data storage', name: 'Data Storage / Digital', def: ['Gigabyte', 'Megabyte'],
          desc: 'Computers, phones, storage devices and files. KB, MB and GB use 1000; KiB, MiB and GiB use 1024.',
          groups: [G('data', 'Data', 'Bit', [
              ['Bit', 'bit', 1, 'bits'], ['Byte', 'B', 8, 'bytes'],
              ['Kilobit', 'Kb', 1e3, ''], ['Kilobyte', 'KB', 8e3, 'kb'], ['Megabit', 'Mb', 1e6, ''], ['Megabyte', 'MB', 8e6, 'mb'],
              ['Gigabit', 'Gb', 1e9, ''], ['Gigabyte', 'GB', 8e9, 'gb'], ['Terabit', 'Tb', 1e12, ''], ['Terabyte', 'TB', 8e12, 'tb'],
              ['Petabit', 'Pb', 1e15, ''], ['Petabyte', 'PB', 8e15, ''], ['Exabit', 'Eb', 1e18, ''], ['Exabyte', 'EB', 8e18, ''],
              ['Zettabyte', 'ZB', 8e21, ''], ['Yottabyte', 'YB', 8e24, ''],
              ['Kibibit', 'Kib', KB, ''], ['Kibibyte', 'KiB', 8 * KB, ''], ['Mebibit', 'Mib', Math.pow(KB, 2), ''], ['Mebibyte', 'MiB', 8 * Math.pow(KB, 2), ''],
              ['Gibibit', 'Gib', Math.pow(KB, 3), ''], ['Gibibyte', 'GiB', 8 * Math.pow(KB, 3), ''],
              ['Tebibit', 'Tib', Math.pow(KB, 4), ''], ['Tebibyte', 'TiB', 8 * Math.pow(KB, 4), ''],
              ['Pebibit', 'Pib', Math.pow(KB, 5), ''], ['Pebibyte', 'PiB', 8 * Math.pow(KB, 5), '']
          ])] },

        { id: 'data-transfer', short: 'Data transfer', name: 'Data Transfer / Network Speed', def: ['Megabits per second', 'Megabytes per second'],
          desc: 'Internet and network speeds. Note that 8 megabits per second equals 1 megabyte per second.',
          groups: [G('transfer', 'Transfer rate', 'Bits per second', [
              ['Bits per second', 'bit/s', 1, 'bps'], ['Kilobits per second', 'kbps', 1e3, 'kbit/s'], ['Megabits per second', 'Mbps', 1e6, 'mbit/s'],
              ['Gigabits per second', 'Gbps', 1e9, 'gbit/s'], ['Terabits per second', 'Tbps', 1e12, ''],
              ['Bytes per second', 'B/s', 8, ''], ['Kilobytes per second', 'KB/s', 8e3, ''], ['Megabytes per second', 'MB/s', 8e6, 'mbps'],
              ['Gigabytes per second', 'GB/s', 8e9, '']
          ])] },

        { id: 'chemical', short: 'Chemical', name: 'Chemical / Concentration', def: ['Parts per million', 'Parts per billion'],
          desc: 'Chemistry, laboratories and industrial processes. Units are grouped by what they measure.',
          groups: [
              G('amount', 'Amount of substance', 'Mole', [['Mole', 'mol', 1, 'moles'], ['Millimole', 'mmol', 1e-3, ''], ['Micromole', 'µmol', 1e-6, ''], ['Nanomole', 'nmol', 1e-9, '']]),
              G('molarity', 'Molar concentration', 'Mole per litre', [['Molarity', 'mol/L or M', 1, 'molar mol/l'], ['Millimolar', 'mM', 1e-3, ''], ['Micromolar', 'µM', 1e-6, ''], ['Nanomolar', 'nM', 1e-9, ''], ['Mole per cubic metre', 'mol/m³', 1e-3, '']]),
              G('molality', 'Molality', 'Mole per kilogram', [['Molality', 'mol/kg', 1, 'molal'], ['Millimole per kilogram', 'mmol/kg', 1e-3, '']]),
              G('fraction', 'Fraction', 'Ratio', [['Parts per million', 'ppm', 1e-6, ''], ['Parts per billion', 'ppb', 1e-9, ''], ['Parts per trillion', 'ppt', 1e-12, ''], ['Mass percentage', '% w/w', 0.01, 'percent by mass weight'], ['Volume percentage', '% v/v', 0.01, 'percent by volume']]),
              G('masscon', 'Mass concentration', 'Gram per litre', [['Mass per volume percentage', '% w/v', 10, 'percent weight volume'], ['Gram per litre', 'g/L', 1, ''], ['Milligram per litre', 'mg/L', 1e-3, ''], ['Microgram per litre', 'µg/L', 1e-6, '']]),
              G('equivalent', 'Equivalent concentration', 'Equivalent per litre', [['Normality', 'N', 1, 'normal'], ['Equivalent per litre', 'eq/L', 1, ''], ['Milliequivalent per litre', 'meq/L', 1e-3, '']])
          ] },

        { id: 'torque', short: 'Torque', name: 'Torque', def: ['Newton-metre', 'Pound-foot'],
          desc: 'Turning force.',
          groups: [G('torque', 'Torque', 'Newton-metre', [
              ['Newton-metre', 'N·m', 1, 'newton meter nm'], ['Kilonewton-metre', 'kN·m', 1e3, ''], ['Pound-foot', 'lb·ft', 1.3558179483314004, 'pound foot'],
              ['Pound-inch', 'lb·in', 0.1129848290276167, 'pound inch'], ['Dyne-centimetre', 'dyn·cm', 1e-7, ''], ['Kilogram-force metre', 'kgf·m', 9.80665, '']
          ])] },

        { id: 'viscosity', short: 'Viscosity', name: 'Viscosity', def: ['Centipoise', 'Pascal-second'],
          desc: 'Resistance to flow. Dynamic and kinematic viscosity convert through density: choose a unit from the other group and pick the substance.',
          groups: [
              G('dynamic', 'Dynamic viscosity', 'Pascal-second', [['Pascal-second', 'Pa·s', 1, ''], ['Millipascal-second', 'mPa·s', 1e-3, ''], ['Poise', 'P', 0.1, ''], ['Centipoise', 'cP', 1e-3, '']]),
              G('kinematic', 'Kinematic viscosity', 'Square metre per second', [['Stokes', 'St', 1e-4, ''], ['Centistokes', 'cSt', 1e-6, ''], ['Square metre per second', 'm²/s', 1, '']])
          ],
          bridge: { kind: 'density', pairs: {
              'dynamic>kinematic': function (mu, rho) { return mu / rho; },
              'kinematic>dynamic': function (nu, rho) { return nu * rho; } } } },

        { id: 'magnetic', short: 'Magnetic', name: 'Magnetic', def: ['Gauss', 'Tesla'],
          desc: 'Magnetic fields and flux. Units are grouped by what they measure.',
          groups: [
              G('fluxdensity', 'Magnetic flux density', 'Tesla', [['Tesla', 'T', 1, ''], ['Millitesla', 'mT', 1e-3, ''], ['Microtesla', 'µT', 1e-6, ''], ['Gauss', 'G', 1e-4, '']]),
              G('flux', 'Magnetic flux', 'Weber', [['Weber', 'Wb', 1, ''], ['Maxwell', 'Mx', 1e-8, '']]),
              G('strength', 'Magnetic field strength', 'Ampere per metre', [['Ampere per metre', 'A/m', 1, ''], ['Oersted', 'Oe', 1000 / (4 * PI), '']]),
              G('mmf', 'Magnetomotive force', 'Ampere-turn', [['Gilbert', 'Gb', 10 / (4 * PI), ''], ['Ampere-turn', 'At', 1, '']])
          ] },

        { id: 'radiation', short: 'Radiation', name: 'Radiation / Radioactivity', def: ['Curie', 'Becquerel'],
          desc: 'Activity, dose and exposure. Gray and sievert measure different things, so they do not convert to each other.',
          groups: [
              G('activity', 'Activity', 'Becquerel', [['Becquerel', 'Bq', 1, ''], ['Kilobecquerel', 'kBq', 1e3, ''], ['Curie', 'Ci', 3.7e10, ''], ['Megabecquerel', 'MBq', 1e6, ''], ['Gigabecquerel', 'GBq', 1e9, ''], ['Millicurie', 'mCi', 3.7e7, ''], ['Microcurie', 'µCi', 3.7e4, '']]),
              G('absorbed', 'Absorbed dose', 'Gray', [['Gray', 'Gy', 1, ''], ['Milligray', 'mGy', 1e-3, ''], ['Rad', 'rad', 0.01, ''], ['Microgray', 'µGy', 1e-6, '']]),
              G('equivalent', 'Dose equivalent', 'Sievert', [['Sievert', 'Sv', 1, ''], ['Millisievert', 'mSv', 1e-3, ''], ['Microsievert', 'µSv', 1e-6, ''], ['Rem', 'rem', 0.01, ''], ['Millirem', 'mrem', 1e-5, '']]),
              G('exposure', 'Exposure', 'Coulomb per kilogram', [['Roentgen', 'R', 2.58e-4, 'röntgen'], ['Coulomb per kilogram', 'C/kg', 1, ''], ['Milliroentgen', 'mR', 2.58e-7, '']])
          ] },

        { id: 'fuel', short: 'Fuel', name: 'Fuel / Energy Consumption', def: ['Miles per gallon (US)', 'Litre per 100 kilometres'],
          desc: 'Fuel economy, electric consumption and fuel energy. Units are grouped by what they measure.',
          groups: [
              G('economy', 'Fuel economy', 'Kilometre per litre', [
                  ['Kilometre per litre', 'km/L', 1, 'kmpl kilometer per liter'],
                  ['Litre per 100 kilometres', 'L/100 km', R(100), 'liters per 100 km'],
                  ['Miles per gallon (US)', 'mpg (US)', MI / 3.785411784, 'mpg'],
                  ['Miles per gallon (UK)', 'mpg (UK)', MI / 4.54609, 'imperial mpg']]),
              G('electric', 'Electric consumption', 'Kilowatt-hour per 100 kilometres', [
                  ['Kilowatt-hour per 100 kilometres', 'kWh/100 km', 1, ''],
                  ['Watt-hour per kilometre', 'Wh/km', 0.1, ''], ['Watt-hour per mile', 'Wh/mi', 0.1 / MI, ''],
                  ['Kilowatt-hour per 100 miles', 'kWh/100 mi', 1 / MI, ''],
                  ['Kilometres per kilowatt-hour', 'km/kWh', R(100), ''],
                  ['Miles per kilowatt-hour', 'mi/kWh', { to: function (x) { return 100 / (MI * x); }, from: function (b) { return 100 / (MI * b); }, pos: true }, '']]),
              G('specific', 'Specific energy', 'Megajoule per kilogram', [
                  ['Megajoule per kilogram', 'MJ/kg', 1, ''], ['Kilocalorie per kilogram', 'kcal/kg', 0.004184, ''],
                  ['Kilojoule per kilogram', 'kJ/kg', 1e-3, ''], ['Joule per kilogram', 'J/kg', 1e-6, ''],
                  ['Kilowatt-hour per kilogram', 'kWh/kg', 3.6, ''], ['BTU per pound', 'BTU/lb', 0.002326, '']])
          ] },

        { id: 'textile', short: 'Textile & print', name: 'Textile / Paper / Printing', def: ['Points (typography)', 'Pica'],
          desc: 'Fabric, paper weight and print sizes. Units are grouped by what they measure.',
          groups: [
              G('yarn', 'Yarn linear density', 'Tex', [['Tex', 'tex', 1, ''], ['Decitex', 'dtex', 0.1, ''], ['Denier', 'den', 1 / 9, '']]),
              G('weight', 'Paper and fabric weight', 'Grams per square metre', [['Grams per square metre', 'GSM', 1, 'g/m2 gsm'], ['Kilogram per square metre', 'kg/m²', 1000, ''], ['Ounce per square yard', 'oz/yd²', 28.349523125 / 0.83612736, '']]),
              G('thread', 'Thread count', 'Thread count', [['Thread count', 'TC', 1, '', 'Thread count is a plain count, so it has nothing to convert to.']]),
              G('type', 'Typography length', 'Point', [['Points (typography)', 'pt', 1, 'point points'], ['Pica', 'pc', 12, 'picas'], ['Inch', 'in', 72, ''], ['Millimetre', 'mm', 72 / 25.4, ''], ['Centimetre', 'cm', 720 / 25.4, ''], ['Pixel (CSS)', 'px', 0.75, 'pixel pixels'], ['Twip', 'twip', 0.05, '']]),
              G('resolution', 'Print and screen resolution', 'Dots per inch', [
                  ['Dots per inch', 'DPI', 1, 'dpi'], ['Pixels per inch', 'PPI', 1, 'ppi'],
                  ['Lines per inch', 'LPI', 1, 'lpi', 'Screen frequency of a printed halftone. Printers usually need a DPI about 1.5 to 2 times the LPI.'],
                  ['Dots per centimetre', 'dpcm', 2.54, ''], ['Pixels per centimetre', 'ppcm', 2.54, '']])
          ] },

        { id: 'astronomy', short: 'Astronomy', name: 'Astronomy / Space', def: ['Light-year', 'Parsec'],
          desc: 'Distances, masses and brightness of astronomical objects. Units are grouped by what they measure.',
          groups: [
              G('distance', 'Distance and size', 'Metre', [
                  ['Astronomical unit', 'AU', 149597870700, ''], ['Light-year', 'ly', 9460730472580800, ''], ['Parsec', 'pc', 30856775814913673, ''],
                  ['Kiloparsec', 'kpc', 30856775814913673e3, ''], ['Megaparsec', 'Mpc', 30856775814913673e6, ''], ['Gigaparsec', 'Gpc', 30856775814913673e9, ''],
                  ['Solar radius', 'R☉', 6.957e8, 'sun radius'], ['Earth radius', 'R⊕', 6.371e6, 'mean radius'], ['Jupiter radius', 'RJ', 7.1492e7, ''],
                  ['Kilometre', 'km', 1e3, '']]),
              G('mass', 'Mass', 'Kilogram', [['Solar mass', 'M☉', 1.98847e30, 'sun mass'], ['Earth mass', 'M⊕', 5.9722e24, ''], ['Jupiter mass', 'MJ', 1.89813e27, ''], ['Kilogram', 'kg', 1, '']]),
              G('luminosity', 'Luminosity', 'Watt', [['Solar luminosity', 'L☉', 3.828e26, 'sun luminosity'], ['Watt', 'W', 1, ''], ['Megawatt', 'MW', 1e6, '']])
          ] },

        { id: 'si-prefixes', short: 'SI prefixes', name: 'SI Prefixes (Unit Multipliers)', def: ['Kilo (k)', 'Milli (m)'],
          desc: 'Convert between prefixes. For example, 1 kilo-unit equals 1,000,000 milli-units, whatever the unit is.',
          groups: [G('prefix', 'Prefix', 'Base unit', [
              ['Quetta (Q)', 'Q', 1e30, ''], ['Ronna (R)', 'R', 1e27, ''], ['Yotta (Y)', 'Y', 1e24, ''], ['Zetta (Z)', 'Z', 1e21, ''],
              ['Exa (E)', 'E', 1e18, ''], ['Peta (P)', 'P', 1e15, ''], ['Tera (T)', 'T', 1e12, ''], ['Giga (G)', 'G', 1e9, ''],
              ['Mega (M)', 'M', 1e6, ''], ['Kilo (k)', 'k', 1e3, ''], ['Hecto (h)', 'h', 1e2, ''], ['Deca (da)', 'da', 1e1, 'deka'],
              ['Base unit', '', 1, 'none unit'],
              ['Deci (d)', 'd', 1e-1, ''], ['Centi (c)', 'c', 1e-2, ''], ['Milli (m)', 'm', 1e-3, ''], ['Micro (µ)', 'µ', 1e-6, ''],
              ['Nano (n)', 'n', 1e-9, ''], ['Pico (p)', 'p', 1e-12, ''], ['Femto (f)', 'f', 1e-15, ''], ['Atto (a)', 'a', 1e-18, ''],
              ['Zepto (z)', 'z', 1e-21, ''], ['Yocto (y)', 'y', 1e-24, ''], ['Ronto (r)', 'r', 1e-27, ''], ['Quecto (q)', 'q', 1e-30, '']
          ])] },

        { id: 'si-base', short: 'SI base units', name: 'SI Base Units (International Standard)', reference: true,
          desc: 'The 7 fundamental units from which other scientific units are derived. Choose one to open its converter.' }
    ];

    var data = { categories: CATEGORIES, substances: SUBSTANCES, siBase: SI_BASE };

    if (typeof module !== 'undefined' && module.exports) module.exports = data;
    else root.MetriFlowUnitData = data;
})(typeof window !== 'undefined' ? window : this);