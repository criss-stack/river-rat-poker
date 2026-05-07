# App Architecture

River Rat Poker is intentionally a static web app right now. The next mobile step should be easier if this repo keeps the browser game understandable before adding PWA or native wrapper tooling.

## Current Runtime

- `index.html` owns the document structure, game controls, player seats, table stage, and hand log.
- `style.css` owns all presentation: table layout, responsive behavior, button styling, card sizing, and asset-backed visuals.
- `script.js` owns game state, poker rules, CPU decisions, DOM rendering, and event handling.
- `assets/` contains the PNG artwork loaded directly by the HTML, CSS, and JavaScript.
- `scripts/dev-server.mjs` serves the static app locally without bundling or build output.
- `scripts/smoke-test.mjs` checks that the core app files exist and referenced static assets are present.

## Source Boundaries

The current app is small enough to run without a framework. Keep these boundaries in mind while improving it:

- Game logic: deck creation, shuffling, betting flow, showdown evaluation, CPU behavior, and stack management live in `script.js`.
- UI rendering: DOM updates for seats, cards, action buttons, banners, and the hand log also live in `script.js`.
- UI layout and theme: visual structure, responsive layout, and artwork placement live in `style.css`.
- Static shell: accessibility labels, control IDs, and asset entry points live in `index.html`.
- Artwork: card faces, chips, dealer reactions, table art, and UI images live under `assets/`.

Before adding mobile tooling, the best next refactor is to split `script.js` into plain modules:

1. `src/game/` for deck, betting, players, and hand evaluation.
2. `src/ui/` for DOM rendering and browser events.
3. `src/assets/` or the current `assets/` folder for static art, depending on whether a bundler is introduced.

That split should happen with tests around poker rules first, so mobile work does not lock in a hard-to-change game engine.

## Deployment Shape

The default branch deploys the static app through GitHub Pages. The workflow runs the smoke test first, copies the playable files into `dist/`, then uploads that directory as the site artifact. Because the app uses relative paths, the same files work locally, in Pages, and inside future wrappers.

## Mobile Tooling Notes

Do not add a native wrapper before the web game has:

- Mobile-first table and controls.
- A tested poker engine separated from DOM rendering.
- PWA manifest and service worker decisions documented.
- Clear fake-money language anywhere chips, balances, or accounts appear.
