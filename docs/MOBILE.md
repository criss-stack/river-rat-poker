# Mobile App Migration

River Rat Poker is now mobile-app-first. The shipped app path is Capacitor packaging the shared HTML/CSS/JavaScript game layer into a native iOS WebView from `dist/`.

## Current Stack

- App shell: Capacitor, configured by `capacitor.config.json`.
- Current native target: tracked `ios/` project.
- Shared game source: `index.html`, `style.css`, `premium-ui.css`, `script.js`, and `assets/`.
- Local iteration: `npm run dev`, backed by `scripts/dev-server.mjs`.
- Packaged web layer: `npm run build`, backed by `scripts/prepare-pages.mjs`, which copies the app into `dist/`.
- Native sync: `npm run native:prepare:ios`.

## Why Capacitor

Capacitor is the right fit because the shared game layer already uses relative asset paths, PWA metadata, safe-area viewport settings, and mobile landscape CSS. The native app should package that source of truth instead of maintaining a second game UI or rules engine.

## iOS Workflow

Prerequisites on macOS:

- Node.js 22 or newer.
- Xcode from the Mac App Store.
- Xcode command line tools installed with `xcode-select --install`.
- CocoaPods if Capacitor prompts for it: `sudo gem install cocoapods`.

After pulling changes:

```bash
npm install
npm run native:prepare:ios
npm run native:open:ios
```

Day-to-day after web source edits:

```bash
npm run native:prepare:ios
```

This rebuilds `dist/` and syncs it into the iOS project.

## Mobile UX Baseline

The mobile app is optimized around landscape phone play:

- `viewport-fit=cover` is set in `index.html` for iPhone safe areas.
- `premium-ui.css` reserves a bottom human player controller zone.
- The poker table is scaled down for short landscape viewports.
- Human hole cards remain visible during decisions.
- The action dock only appears when the human player can act.
- Fold, Check/Call, and Bet/Raise labels include the current money context.
- Bet sizing defaults to a compact +/- control with optional presets.

Keep validating at 844x390, 852x393, and 932x430 landscape sizes, plus real iPhone devices through Xcode.

## Mobile-Safe Build Shape

The native app should always package `dist/`, not the source root. Run `npm run build` or `npm run native:prepare:ios` before native testing so `index.html`, CSS, `script.js`, `manifest.json`, `offline.html`, `service-worker.js`, and `assets/` are copied together.

The app uses relative asset paths. Keep new references relative, for example `assets/cards/Card_Back.png` or `./offline.html`, so the same files work in local preview, GitHub Pages preview, and the Capacitor WebView.

## Fake-Money Guardrail

The native app must preserve the fake-money-only product boundary. Do not add real deposits, withdrawals, cash-out, prizes, payment connections, or language implying that chips have cash value.
