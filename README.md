# MetriFlow

A scientific calculator and a unit converter in one fast, private web app.
Plain HTML, CSS and JavaScript. No frameworks, no build step, no tracking.

## Project structure

```
MetriFlow/
├── index.html                    Home page
├── favicon.ico                   Browser tab icon (old browsers)
├── _headers                      Server security headers (Cloudflare Pages / Netlify)
├── README.md                     This file
├── .gitignore
│
├── pages/                        One HTML file per page
│   ├── about.html                About, how it works, why it exists, Support (UPI QR)
│   ├── calculator.html           Scientific calculator
│   └── converter.html            Unit converter (in progress)
│
├── assets/
│   ├── css/
│   │   ├── fonts.css             @font-face for the local fonts       (every page)
│   │   ├── themes.css            The four themes + theme button       (every page)
│   │   ├── index_style.css       Home page only
│   │   ├── about_style.css       About page only
│   │   ├── calculator_style.css  Calculator page only
│   │   └── converter_style.css   Converter page only (to be created)
│   │
│   ├── js/
│   │   ├── security.js           Frame protection                     (every page)
│   │   ├── themes_function.js    One-button theme loop and saving     (every page)
│   │   ├── index_function.js     Home page only
│   │   ├── about_function.js     About page only
│   │   ├── calculator_engine.js  Safe maths parser (no eval)
│   │   ├── calculator_function.js  Calculator screen, keys, history
│   │   └── converter_function.js Converter page only (to be created)
│   │
│   ├── fonts/                    Figtree and Bricolage Grotesque (.woff2) + licences
│   │
│   └── media/
│       ├── logo.svg              Main logo
│       ├── favicon-32.png  apple-touch-icon.png  icon-192.png  icon-512.png
│       ├── site.webmanifest      Link it once the site is hosted
│       ├── lakshya.jpg           Your photo for the home page (add this file)
│       ├── icons/                Individual SVG icons
│       └── support/
│           └── upi-qr.jpg        UPI QR code used on the About page
│
└── tests/
    └── engine.test.js            Run: node tests/engine.test.js
```

## Rules that keep it tidy

1. **HTML** lives in the root (home page only) or in `pages/`.
2. **Every page links, in this order:** `fonts.css`, `themes.css`, then its own stylesheet.
3. **Every page loads in the `<head>`, without `defer`:** `security.js`, then `themes_function.js`. Its own script goes last, with `defer`.
4. **Paths:** the home page uses `assets/...`. Files inside `pages/` use `../assets/...`.
5. **One CSS file and one JS file per page**, named `<page>_style.css` and `<page>_function.js`.
6. **Colours:** never write fixed colours in page CSS. Use the theme variables (`var(--bg)`, `var(--text)`, `var(--accent)` ...).
7. **Security:** no inline `style=""`, no `onclick=""`, no `<script>` with code inside the HTML, and no files from other websites.

## Add a new page

1. Copy `pages/about.html` as a starting point and rename it.
2. Create `assets/css/<page>_style.css` and `assets/js/<page>_function.js`.
3. Put `<div data-theme-switcher></div>` in the header, and the theme button appears.

## Tests

```
node tests/engine.test.js
```