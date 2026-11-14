<div align="center">

<img src="https://raw.githubusercontent.com/codinglaks/MetriFlow/extension/assets/media/icons/icon128.png" alt="MetriFlow logo" width="96" height="96">

# MetriFlow

**A scientific calculator and a unit converter in one fast, private web app.**

Plain HTML, CSS and JavaScript. No frameworks, no build step, no tracking.

[![Open the live app](https://img.shields.io/badge/🌐%20Open%20Live%20App-MetriFlow-2250df?style=for-the-badge)](https://codinglaks.github.io/MetriFlow/)

[![Calculator](https://img.shields.io/badge/🧮%20Calculator-Open-1b6a56?style=for-the-badge)](https://codinglaks.github.io/MetriFlow/assets/pages/calculator.html)
[![Unit Converter](https://img.shields.io/badge/📐%20Unit%20Converter-Open-3d84d8?style=for-the-badge)](https://codinglaks.github.io/MetriFlow/assets/pages/converter.html)
[![About](https://img.shields.io/badge/ℹ️%20About-Read-6b7280?style=for-the-badge)](https://codinglaks.github.io/MetriFlow/assets/pages/about.html)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla%20JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![No frameworks](https://img.shields.io/badge/No%20frameworks-success?style=flat-square)
![No cookies](https://img.shields.io/badge/No%20cookies%20or%20trackers-success?style=flat-square)
![Hosted on GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-181717?style=flat-square&logo=github&logoColor=white)

</div>

---

## 📑 Contents

[Overview](#-overview) · [Features](#-features) · [How it works](#%EF%B8%8F-how-it-works) · [Project structure](#%EF%B8%8F-project-structure) · [Conventions](#-conventions) · [Security and privacy](#-security-and-privacy) · [Themes](#-themes) · [Tests](#-tests) · [Run it locally](#-run-it-locally) · [Author](#-author)

---

## 🔎 Overview

MetriFlow brings two everyday tools together on one clean page: a **scientific calculator** for school, engineering and analysis, and a **unit converter** that covers everything from kilometres to miles up to data storage and astronomy.

Everything runs in your browser. There is no account, no advert, no tracking and no server that receives what you type.

## ✨ Features

### 🧮 Scientific calculator
- Full expressions with brackets, powers, roots and 25+ maths functions
- Trigonometry in degrees, radians or gradians
- Live preview while you type, plus a calculation history you can clear at any time
- Keyboard and touch input

### 📐 Unit converter
- **30 categories and about 440 units**: length, mass, volume, temperature, speed, pressure, energy, power, data storage, data transfer, fuel, astronomy and more
- Simple three-step flow: choose a category, choose the two units, type a number
- Unit picker with search; the "To" list only offers units that can actually be converted
- Mass to volume conversion with a built-in list of substances or your own density
- Swap, copy-result and display options (precision and digit grouping, including the Indian system)

### 🎨 Experience
- Four colour themes, remembered across every page
- Responsive layout from small phones to wide desktops, with large tap targets and full keyboard support
- Fonts, icons and images are served from the site itself, so pages load quickly and behave the same everywhere

## ⚙️ How it works

**Calculator**

| Step | What happens |
|:---:|---|
| 1 | **Input**: you type or tap an expression |
| 2 | **Clean**: only allowed characters pass; anything else is rejected |
| 3 | **Split**: the text is divided into numbers, operators and functions |
| 4 | **Solve**: brackets, powers, multiply and divide, then add and subtract, in the correct order |
| 5 | **Check**: impossible results are caught and the answer is shown to 12 significant digits |

MetriFlow uses its own small maths parser rather than handing text to the browser to run as code. It understands only numbers, operators and a fixed list of functions.

**Converter**

Every unit is stored relative to a base unit for its category. A value is converted to the base unit and then into the unit you chose. Temperature uses dedicated formulas, and mass-to-volume conversions use a density.

**Themes**

Each theme is a set of colour variables in a single shared stylesheet. The theme button switches one setting on the page, and your choice is saved so every page opens in the same look.

## 🗂️ Project structure

```text
MetriFlow/
├── index.html                  Home page
├── favicon.ico                 Browser tab icon for older browsers
├── _headers                    Server security headers (for hosts that support them)
├── README.md                   This file
├── .gitignore
│
├── assets/
│   ├── pages/                  One HTML file per page
│   │   ├── about.html          About, how it works, why it exists, support
│   │   ├── calculator.html     Scientific calculator
│   │   └── converter.html      Unit converter
│   │
│   ├── css/
│   │   ├── fonts.css           Local font loading                (every page)
│   │   ├── themes_style.css    The four themes and theme button  (every page)
│   │   └── <page>_style.css    One stylesheet per page
│   │
│   ├── js/
│   │   ├── security.js         Frame protection                  (every page)
│   │   ├── themes_function.js  Theme switching and saving        (every page)
│   │   ├── calculator_engine.js   Safe maths parser
│   │   ├── converter_data.js      Unit and category definitions
│   │   ├── converter_engine.js    Conversion, number reading and formatting
│   │   └── <page>_function.js     One page script per page
│   │
│   ├── fonts/                  Figtree and Bricolage Grotesque, with licences
│   │
│   └── media/
│       ├── icons/              SVG icons
│       ├── logo/               Logo, favicons, app icons and profile photo
│       └── qr-code/            Support QR code
│
└── tests/                      Automated tests for the maths engines
```

**Design principle:** the maths engines have no access to the page, so they can be tested on their own. Each page script only reads the page, calls an engine and writes the result back.

## 📐 Conventions

These rules keep the project tidy and secure as it grows.

1. **Pages:** the home page lives in the root; every other page lives in `assets/pages/`.
2. **One stylesheet and one script per page**, named `<page>_style.css` and `<page>_function.js`.
3. **Load order:** fonts, then themes, then the page's own stylesheet. The security and theme scripts load first without `defer`, and the page's own scripts load last.
4. **Colours** always come from the theme variables, never fixed values in page styles, so every page works in all four themes.
5. **Security:** no inline styles, no inline event handlers, no inline scripts and no files from other websites.

**Adding a page:** copy an existing page as a starting point, give it its own stylesheet and script, and add the theme switcher placeholder to the header so the theme button appears.

## 🔒 Security and privacy

No website can honestly promise to be impossible to hack. MetriFlow aims to leave very little for an attacker to work with.

- 🛡️ **Strict content security policy**: only files from the site itself can load, with no inline scripts or styles and no outside requests
- 🧠 **No code from text**: input is never run as code, and unknown words and symbols are rejected
- 📏 **Input limits**: length, nesting depth and function sizes are capped so unusual input cannot freeze the page
- 🧾 **Safe display**: results and history are shown as plain text, never as page markup
- 🖼️ **Frame protection**: the site refuses to be shown inside another website's page
- 🚫 **No trackers or cookies**: no analytics, no adverts and no third-party fonts
- 💾 **Local only**: your theme choice and calculator history stay in your own browser

## 🎨 Themes

| Theme | Character |
|---|---|
| **Light** | Clean white with a blue accent |
| **Cream** | Warm paper tones with a green accent |
| **Midnight** | Deep navy gradients with champagne-gold accents |
| **Dark** | Near-black with a soft violet accent |

## ✅ Tests

The `tests/` folder holds automated tests for the calculator and converter engines. They cover accuracy, number reading and formatting, and error handling. They run with Node.js and need no extra packages.

```text
node tests/engine.test.js
```

## 💻 Run it locally

MetriFlow is a static site, so there is nothing to install or build.

1. Download or clone the repository.
2. Open `index.html` in a browser, or serve the folder with any static file server.

> A local server is recommended, because the site's security policy is designed for normal web hosting.

## 👤 Author

**Lakshya Singh**: web developer and creative freelancer based in Prayagraj, India.

[![Website](https://img.shields.io/badge/🌐%20Website-MetriFlow-2250df?style=for-the-badge)](https://codinglaks.github.io/MetriFlow/)
[![GitHub](https://img.shields.io/badge/GitHub-codinglaks-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/codinglaks)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Lakshya%20Singh-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lakshya-singh-3b5140344/)
[![Email](https://img.shields.io/badge/Email-Contact-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:creator.lakshyasingh@gmail.com)

Found a bug or have an idea for a new unit or feature? Please [open an issue](https://github.com/codinglaks/MetriFlow/issues) or reach out through any link above.

---

<div align="center">

**If MetriFlow helps you, a ⭐ on the repository is always appreciated.**

[⬆ Back to top](#metriflow)

© 2026 MetriFlow · Created by Lakshya Singh

</div>