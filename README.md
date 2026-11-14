<div align="center">

<img src="assets/media/icons/icon128.png" alt="MetriFlow logo" width="96" height="96">

# MetriFlow: Chrome Extension

**Scientific calculator and universal unit converter, one click away in your browser.**

![Version](https://img.shields.io/badge/version-1.0.0-2250df)
![Manifest](https://img.shields.io/badge/Manifest-V3-16a3b8)
![Permissions](https://img.shields.io/badge/permissions-none-success)
![Tracking](https://img.shields.io/badge/tracking-none-success)

[Website](https://codinglaks.github.io/MetriFlow/) · [Releases](https://github.com/codinglaks/MetriFlow/releases) · [Report an issue](https://github.com/codinglaks/MetriFlow/issues)

</div>

---

## Overview

MetriFlow puts a scientific calculator and a unit converter in your Chrome toolbar. Click the icon, pick a tool, and it opens in a compact window beside your work. It is the extension version of the [MetriFlow website](https://codinglaks.github.io/MetriFlow/).

## Features

| Tool | What you get |
|---|---|
| **Calculator** | Scientific calculator with 25+ functions |
| **Unit Converter** | 30 categories and 440+ units |
| **About** | How it works and the privacy details |
| **Full site** | Opens the complete MetriFlow website in a new tab |

- Light and dark theme that follows your system setting
- Compact popup menu with a separate window for each tool
- No account, no sign-up, no setup

## Privacy

- Requests **no browser permissions**
- Does **no tracking** and collects no data
- Runs entirely on your device

## Installation

### Option 1: From a release (recommended)

1. Download `MetriFlow-v1.0.0.zip` from the [Releases](https://github.com/codinglaks/MetriFlow/releases) page.
2. Unzip it to a folder you will keep, since Chrome loads the extension from there.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and select the unzipped folder, the one that contains `manifest.json`.
6. Click the puzzle icon in the toolbar and **pin** MetriFlow for quick access.

### Option 2: From source

```bash
git clone -b extension https://github.com/codinglaks/MetriFlow.git
```

Then follow steps 3 to 6 above and select the cloned folder.

## Usage

1. Click the **MetriFlow** icon in the toolbar.
2. Choose **Calculator**, **Unit Converter** or **About**. The tool opens in its own window.
3. Choose **Open full site** to use the web version in a new tab.

## Project structure

```
MetriFlow/
├── manifest.json              # Extension configuration (Manifest V3)
├── pop-ups/
│   ├── popups.html            # Toolbar popup markup
│   ├── popups_style.css       # Popup styles (light and dark theme)
│   └── popups_function.js     # Popup logic (opens tools and links)
└── assets/
    ├── css/                   # Shared styles and fonts
    ├── media/icons/           # Extension icons (16, 32, 48, 128 px)
    └── pages/                 # Calculator, converter and about pages
```

## Tech stack

- HTML, CSS and vanilla JavaScript, with no frameworks or build step
- Chrome Extensions **Manifest V3**
- Requires Chrome 102 or later

## Development

1. Edit the files in your cloned folder.
2. Open `chrome://extensions` and click the **reload** icon on the MetriFlow card.
3. Open the popup again to see your changes.

## Branches and releases

| Branch | Purpose |
|---|---|
| `main` | MetriFlow website |
| `extension` | Chrome extension (this version) |

Stable versions are published as tagged [releases](https://github.com/codinglaks/MetriFlow/releases).

## Contributing

Bug reports and suggestions are welcome. Open an [issue](https://github.com/codinglaks/MetriFlow/issues) or send a pull request to the `extension` branch.

## License

See the [LICENSE](LICENSE) file for details.

## Author

Made by **Lakshya Singh** · [GitHub](https://github.com/codinglaks)