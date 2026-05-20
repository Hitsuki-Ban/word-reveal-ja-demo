# Typewriter Preview

Japanese RPG and visual-novel style typewriter preview demo.

Live demo: https://hitsuki-ban.github.io/word-reveal-ja-demo/

## Overview

This repository contains a static HTML/CSS/JavaScript demo for previewing dialogue reveal behavior in a game-like text window. It is intended as a lightweight reference for tuning typewriter speed, segmentation mode, punctuation pauses, and visual presentation before integrating the behavior into a larger project.

The interface is localized in Japanese and includes sample text in Japanese, English, and Simplified Chinese.

## Features

- Typewriter playback with adjustable CPS speed.
- Reveal modes for characters, words, sentences, and instant display.
- Optional punctuation pauses for more natural dialogue pacing.
- Sample scenarios for dialogue, battle text, and narration.
- Visual-novel style preview window with desktop and mobile preview modes.
- Responsive layout with compact controls on mobile.
- No build step required for the demo page.

## Project Structure

```text
.
├── index.html                  Static page markup
├── styles.css                  Layout, theme, responsive rules, preview styling
├── app.js                      DOM bindings and playback control
├── app-core.js                 Text segmentation, token rendering, timing helpers
├── assets/
│   └── portrait-placeholder.png
├── tests/
│   └── app-core.test.js        Node.js tests for core behavior
├── package.json
└── package-lock.json
```

## Local Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Serve the static page locally:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

## Core Behavior

`app-core.js` is the reusable logic layer. It exposes helpers for:

- escaping user-entered text before rendering;
- segmenting text with `Intl.Segmenter` when available;
- adding punctuation-dependent pause durations;
- estimating playback duration;
- rendering only the currently visible tokens so the cursor follows reveal progress.

`app.js` owns page state, control events, sample loading, playback timing, and preview-mode switching.

## Design Notes

The current visual direction uses a black-led palette with restrained dusty pink and wine accents. The preview dialogue component is styled as a dark visual-novel window so it sits within the same color system as the editor chrome.

The page intentionally avoids heavy image dependencies, decorative gradients, and complex workspace chrome. Controls are kept visible enough for quick tuning, while secondary settings remain collapsed by default.

## Deployment

The repository is ready for GitHub Pages as a static site. The current production page is served from the default branch.

When updating CSS, scripts, or the portrait asset, update the query-string version in `index.html` so GitHub Pages and browser caches pick up the latest files.
