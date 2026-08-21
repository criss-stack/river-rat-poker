# App Architecture

River Rat Poker is a mobile-first Capacitor app. The shared HTML/CSS/JavaScript game layer remains the source of truth, and native packages consume the generated `dist/` output instead of introducing a second gameplay implementation.

## Current Runtime

- `capacitor.config.json` configures the native app shell to package `dist/`.
- `ios/` is the tracked native iOS target.
- `index.html` owns the document structure, game controls, player seats, table stage, and hand log.
- `style.css` owns the base presentation and asset-backed visuals.
- `premium-ui.css` owns the mobile-first production UI layer, landscape table scale, and human controller layout.
- `script.js` owns game state, poker rules, CPU decisions, DOM rendering, and event handling.
- `assets/` contains the PNG artwork loaded directly by the HTML, CSS, and JavaScript.
- `scripts/dev-server.mjs` serves the shared app source locally for iteration.
- `scripts/prepare-pages.mjs` creates the packaged web layer in `dist/`.
- `scripts/smoke-test.mjs` checks that core app files exist and referenced static assets are present.

## Source Boundaries

Keep these boundaries in mind while improving the app:

- Game logic: deck creation, shuffling, betting flow, showdown evaluation, CPU behavior, and stack management live in `script.js`.
- UI rendering: DOM updates for seats, cards, action buttons, banners, and the hand log also live in `script.js`.
- Mobile UI layout and theme: table composition, responsive landscape layout, safe-area handling, and controller styling live in `style.css` and `premium-ui.css`.
- Static shell: accessibility labels, control IDs, and asset entry points live in `index.html`.
- Artwork: card faces, chips, dealer reactions, table art, and UI images live under `assets/`.
- Native packaging: Capacitor packages the built web artifact from `dist/`; generated iOS and Android targets should not become alternate sources for game logic.

A future refactor can split `script.js` into plain modules:

1. `src/game/` for deck, betting, players, and hand evaluation.
2. `src/ui/` for DOM rendering and user events.
3. `src/assets/` or the current `assets/` folder for static art, depending on whether a bundler is introduced.

That split should happen with tests around poker rules first, so mobile work does not lock in a hard-to-change game engine.

## Build And Deployment Shape

The native app packages `dist/`. Native commands should always build the app layer before syncing native targets:

- `npm run native:add:ios` builds `dist/` and generates the first iOS target if needed.
- `npm run native:prepare:ios` rebuilds `dist/` and syncs it into the tracked iOS target.
- `npm run native:open:ios` prepares the app and opens Xcode.

GitHub Pages remains a preview and QA surface. The workflow runs the smoke test first, copies the app layer into `dist/`, then uploads that directory as the preview artifact. Because the app uses relative paths, the same files work locally, in Pages preview, and inside Capacitor.

## Mobile UX Contract

The mobile app should keep the current landscape controller contract:

- The table must fit fully within short mobile landscape viewports.
- The human hand and action controller own the bottom interaction zone.
- Human hole cards must stay visible during every decision.
- The action dock appears only when the human player can act.
- Primary action labels must include the relevant chip amount when there is one.
- Advanced bet sizing must remain progressively disclosed.
- Safe-area insets must be respected for iPhone landscape play.

## Fake-Money Guardrail

River Rat Poker is a simulated poker game using fictional chips. Future account, bankroll, ledger, reward, native mobile, or installable app features must remain clearly fake-money only.

Do not add:

- Real bank connections
- Cash-out, withdrawal, or deposit flows
- Real-money betting
- Real prizes tied to poker outcomes
- Language that implies chips have cash value
