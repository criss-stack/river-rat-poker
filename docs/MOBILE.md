# Mobile App Migration

River Rat Poker is a static HTML/CSS/JavaScript game, so the first native mobile path is Capacitor rather than Expo. Capacitor can package the existing `dist/` build in an iOS WebView while the game UI and poker engine continue to live in the web codebase.

## Current Stack

- Runtime: static browser app.
- Source files: `index.html`, `style.css`, `script.js`, and `assets/`.
- Local server: `npm run dev`, backed by `scripts/dev-server.mjs`.
- Production/mobile web output: `npm run build`, backed by `scripts/prepare-pages.mjs`, which copies the app into `dist/`.
- Native wrapper: Capacitor, configured by `capacitor.config.json`.

## Why Capacitor First

Capacitor is the right first fit because the project already has a working web game, relative asset paths, a PWA manifest, safe-area viewport settings, and mobile-responsive CSS. Expo/React Native would require a much larger UI rewrite before the game could run natively.

## iOS Setup

Prerequisites on macOS:

- Node.js 22 or newer.
- Xcode from the Mac App Store.
- Xcode command line tools installed with `xcode-select --install`.
- CocoaPods if Capacitor prompts for it: `sudo gem install cocoapods`.

First-time setup:

```bash
npm install
npm run native:add:ios
npm run native:open:ios
```

Day-to-day iOS rebuild after web changes:

```bash
npm run native:prepare:ios
npm run native:open:ios
```

`native:add:ios` generates the `ios/` native app target. Commit that generated folder once it has been created and opened successfully in Xcode.

## Mobile Responsiveness Audit

The current UI already includes the main pieces needed for a playable mobile first pass:

- `viewport-fit=cover` is set in `index.html` for iPhone safe areas.
- `style.css` uses `svh` units and `env(safe-area-inset-*)` padding.
- The action bar becomes sticky/fixed on mobile so the main poker actions stay reachable.
- Portrait and landscape breakpoints exist under `900px`, `620px`, and landscape-specific rules.
- Table settings and hand log collapse behind icon buttons on small screens.

First-screen items to keep testing on real devices:

- Seat overlap on narrow iPhones after several betting states.
- Fixed action bar height when the browser/WebView keyboard or system gesture area is visible.
- Dealer and community card spacing at 320-390px wide.
- Touch target comfort for the bet slider and +/- controls.

## Mobile-Safe Build Shape

The native app should always package `dist/`, not the source root. Run `npm run build` before every Capacitor sync so `index.html`, `style.css`, `script.js`, `manifest.json`, `offline.html`, `service-worker.js`, and `assets/` are copied together.

The app uses relative asset paths. Keep new references relative, for example `assets/cards/Card_Back.png` or `./offline.html`, so the same files work on GitHub Pages and inside the Capacitor WebView.

## Fake-Money Guardrail

The native app must preserve the fake-money-only product boundary. Do not add real deposits, withdrawals, cash-out, prizes, payment connections, or language implying that chips have cash value.
