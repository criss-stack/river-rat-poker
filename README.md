# River Rat Poker

River Rat Poker is a mobile-first Texas hold'em app built around a polished landscape phone table experience. The repo is now focused on shipping the game as a Capacitor mobile app, with the HTML/CSS/JavaScript game layer packaged into the native shell from `dist/`.

The game uses fictional chips only. No balances, bets, buy-ins, or account features have real cash value.

## Mobile App Focus

This repository should be treated as a mobile app project first:

- `capacitor.config.json` points the native app at `dist/`.
- `ios/` is tracked as the current native platform target.
- `npm run native:prepare:ios` rebuilds the web layer and syncs it into iOS.
- The static web server remains for development and GitHub Pages preview only.
- Gameplay, layout, assets, and controls stay in the web source files so the native app and preview build use the same implementation.

Do not introduce a separate native gameplay implementation unless the repo is intentionally migrated away from Capacitor.

## Quick Start

Prerequisite: Node.js 22 or newer.

```bash
git clone git@github.com:criss-stack/river-rat-poker.git
cd river-rat-poker
npm install
npm run dev
```

Open the URL printed by the command, usually:

```text
http://127.0.0.1:5176
```

If that port is busy, the dev server automatically tries the next available port. To request a specific starting port, run:

```bash
PORT=5174 npm run dev
```

## Mobile Build Commands

```bash
npm run build
```

Builds the packaged app web layer in `dist/`.

```bash
npm run native:prepare:ios
```

Builds `dist/` and syncs the current app into the tracked iOS project.

```bash
npm run native:open:ios
```

Builds, syncs, and opens the iOS app in Xcode.

```bash
npm run native:doctor
```

Runs the smoke test, rebuilds `dist/`, and checks Capacitor health.

## Development Commands

```bash
npm run dev
```

Starts the local static server for fast iteration.

```bash
npm test
```

Runs the smoke test that checks core app files and referenced assets.

## Current Game Experience

The current app includes:

- Five-seat poker table with one human player and four CPU opponents
- Mobile landscape table scale tuned for phone viewports such as 844x390, 852x393, and 932x430
- Dedicated human player controller zone with visible hole cards and safe-area-aware action controls
- State-aware Fold, Check/Call, and Bet/Raise labels with monetary amounts in the buttons
- Compact bet sizing with +/- controls and an expandable preset drawer
- Blinds, betting rounds, folding, checking, calling, betting, raising, and all-in play
- Community cards, showdown evaluation, hand log, and persistent stacks during a session
- Custom card, chip, table, dealer, UI, cursor, and effects artwork

## Project Structure

```text
.
├── .github/workflows/pages.yml
├── assets/
├── capacitor.config.json
├── docs/
├── index.html
├── ios/
├── manifest.json
├── native/
├── offline.html
├── package.json
├── premium-ui.css
├── script.js
├── service-worker.js
├── style.css
└── scripts/
```

## Where Things Live

- `index.html` contains the static document shell, table markup, player action controls, and accessible labels.
- `style.css` contains the base visual system, table composition, and asset-backed styling.
- `premium-ui.css` contains the mobile-first production UI layer and final landscape controller rules.
- `script.js` contains the poker state machine, CPU behavior, hand evaluation, and DOM rendering.
- `assets/` contains the PNG artwork used by the table, cards, controls, chips, dealer, and effects.
- `capacitor.config.json` defines the app id, app name, native web directory, and splash plugin config.
- `ios/` contains the tracked iOS Capacitor project.
- `dist/` is generated build output and is intentionally ignored.

## Native Packaging Rule

The native app always packages `dist/`, not the source root. Run `npm run native:prepare:ios` after gameplay, layout, or asset changes so the iOS target receives the latest mobile app build.

Keep new asset references relative, for example `assets/cards/Card_Back.png`, so the same code works in the local dev server, GitHub Pages preview, and the Capacitor WebView.

## GitHub Preview

GitHub Pages deployment remains available as a preview and QA surface. The repository is still mobile-app-focused; Pages is just the hosted version of the same app layer that Capacitor packages.

The workflow in `.github/workflows/pages.yml` runs `npm test`, builds `dist/`, and uploads that build as the preview artifact.

## Fake-Money Guardrail

River Rat Poker is a simulated poker game using fictional chips. Future account, bankroll, ledger, reward, or buy-in features must remain clearly fake-money only.

Do not add:

- Real bank connections
- Cash-out, withdrawal, or deposit flows
- Real-money betting
- Real prizes tied to poker outcomes
- Language that implies chips have cash value

## License

License is not yet defined. Add one before public reuse or external contribution.
