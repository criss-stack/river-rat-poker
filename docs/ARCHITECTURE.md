# App Architecture

River Rat Poker is intentionally a static web app with a Capacitor native wrapper path. The browser game remains the source of truth, and native mobile packages should consume the static `dist/` output instead of introducing a second gameplay implementation.

## Current Runtime

- `index.html` owns the document structure, game controls, player seats, table stage, and hand log.
- `style.css` owns all presentation: table layout, responsive behavior, button styling, card sizing, and asset-backed visuals.
- `script.js` owns game state, poker rules, CPU decisions, DOM rendering, and event handling.
- `assets/` contains the PNG artwork loaded directly by the HTML, CSS, and JavaScript.
- `scripts/dev-server.mjs` serves the static app locally without bundling or build output.
- `scripts/prepare-pages.mjs` creates the web/mobile artifact in `dist/`.
- `scripts/smoke-test.mjs` checks that the core app files exist and referenced static assets are present.
- `capacitor.config.json` configures the native app shell to package `dist/`.

## Source Boundaries

The current app is small enough to run without a framework. Keep these boundaries in mind while improving it:

- Game logic: deck creation, shuffling, betting flow, showdown evaluation, CPU behavior, and stack management live in `script.js`.
- UI rendering: DOM updates for seats, cards, action buttons, banners, and the hand log also live in `script.js`.
- UI layout and theme: visual structure, responsive layout, and artwork placement live in `style.css`.
- Static shell: accessibility labels, control IDs, and asset entry points live in `index.html`.
- Artwork: card faces, chips, dealer reactions, table art, and UI images live under `assets/`.
- Native packaging: Capacitor should package the built web artifact from `dist/`; generated iOS and Android targets should not become alternate sources for game logic.

A good next refactor is still to split `script.js` into plain modules:

1. `src/game/` for deck, betting, players, and hand evaluation.
2. `src/ui/` for DOM rendering and browser events.
3. `src/assets/` or the current `assets/` folder for static art, depending on whether a bundler is introduced.

That split should happen with tests around poker rules first, so mobile work does not lock in a hard-to-change game engine.

## Deployment Shape

The default branch deploys the static app through GitHub Pages. The workflow runs the smoke test first, copies the playable files into `dist/`, then uploads that directory as the site artifact. Because the app uses relative paths, the same files work locally, in Pages, and inside Capacitor.

## Mobile Tooling Notes

Capacitor is the first native mobile path for this project. It fits the current stack because the game already runs as static web code, uses relative asset paths, and has mobile-first CSS and PWA metadata.

Native mobile commands should always build the web artifact before syncing native targets:

- `npm run native:add:ios` builds `dist/` and generates the first iOS target.
- `npm run native:prepare:ios` rebuilds `dist/` and syncs it into the iOS target.
- `npm run native:open:ios` prepares the app and opens Xcode.

Keep all gameplay changes in the web source files. Treat the generated `ios/` folder as platform packaging, signing, icons, launch screen, and Xcode configuration only.

## Fake-Money Guardrail

River Rat Poker is a simulated poker game using fictional chips. Future account, bankroll, ledger, reward, native mobile, or installable app features must remain clearly fake-money only.

Do not add:

- Real bank connections
- Cash-out, withdrawal, or deposit flows
- Real-money betting
- Real prizes tied to poker outcomes
- Language that implies chips have cash value
