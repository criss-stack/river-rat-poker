# River Rat Poker

River Rat Poker is a playful Texas hold'em browser game set at a rat-world casino table. It is currently a static app built with HTML, CSS, JavaScript, and PNG artwork, with lightweight Node scripts for local development, smoke testing, and GitHub Pages deployment.

The game uses fictional chips only. No balances, bets, buy-ins, or future account features have real cash value.

## Quick Start

Prerequisite: Node.js 22 or newer. There are currently no package dependencies to install.

```bash
git clone git@github.com:criss-stack/river-rat-poker.git
cd river-rat-poker
npm run dev
```

Open the URL printed by the command, usually:

```text
http://127.0.0.1:5173
```

If that port is busy, the dev server automatically tries the next available port. To request a specific starting port, run:

```bash
PORT=5174 npm run dev
```

You can still open `index.html` directly in a browser, but `npm run dev` is the recommended workflow because it mirrors how the app will run in a hosted web or mobile wrapper context.

## Useful Commands

```bash
npm run dev
```

Starts a local static server for the game.

```bash
npm test
```

Runs a smoke test that checks the core app files and referenced assets.

```bash
npm run build
```

Prepares the GitHub Pages artifact in `dist/`.

## Game Overview

This repo is being rebuilt around the new static game prototype. The current version includes:

- Five-seat poker table with one human player and four CPU opponents
- Blinds, betting rounds, folding, checking, calling, betting, raising, and all-in play
- Community cards, showdown evaluation, hand log, and persistent stacks during a session
- Custom card, chip, table, dealer, UI, cursor, and effects artwork

## Project Structure

```text
.
├── .github/workflows/pages.yml
├── docs/
│   └── ARCHITECTURE.md
├── index.html
├── package.json
├── scripts/
│   ├── dev-server.mjs
│   ├── prepare-pages.mjs
│   └── smoke-test.mjs
├── script.js
├── style.css
└── assets/
    ├── cards/
    ├── chips/
    ├── dealer_rat/
    ├── fx/
    ├── table/
    └── ui/
```

## Where Things Live

- `index.html` contains the static document shell, table markup, player action controls, and accessible labels.
- `style.css` contains the visual system, responsive layout, table composition, and asset-backed styling.
- `script.js` contains the poker state machine, CPU behavior, hand evaluation, and DOM rendering.
- `assets/cards/` contains the full card deck and card back.
- `assets/chips/`, `assets/dealer_rat/`, `assets/table/`, `assets/ui/`, and `assets/fx/` contain the custom PNG artwork used by the table and controls.
- `docs/ARCHITECTURE.md` documents the intended app boundaries before PWA or native mobile tooling is added.

## Asset Notes

The app loads assets by relative paths so the same files work locally, on GitHub Pages, and in future mobile wrappers. Keep asset filenames stable when possible because `script.js`, `style.css`, and `index.html` reference them directly.

When adding or replacing artwork:

- Put card faces and backs in `assets/cards/`.
- Put chip denominations in `assets/chips/`.
- Put dealer reaction states in `assets/dealer_rat/`.
- Put table and seat art in `assets/table/`.
- Put reusable UI pieces, cursors, and button art in `assets/ui/`.
- Put one-off effects in `assets/fx/`.

## Gameplay Notes

- Press **New Hand** to start or continue play.
- Small blind and big blind values can be adjusted before a new hand.
- The player's stack persists between hands during the current session.
- If too many players bust, stacks are reset so play can continue.

## Deployment

GitHub Pages deployment lives in `.github/workflows/pages.yml`.

On every push to `main`, the workflow:

1. Checks out the default branch.
2. Sets up Node.js 22.
3. Runs `npm test`.
4. Runs `npm run build`.
5. Uploads `dist/` to GitHub Pages.

In the GitHub repository settings, Pages should use **GitHub Actions** as its source. After that, every successful `main` build publishes a playable web version automatically.

## Product Roadmap

The main roadmap lives in GitHub issues:

- [Roadmap: Turn River Rat Poker into a mobile-ready game](https://github.com/criss-stack/river-rat-poker/issues/16)
- [Mobile UX](https://github.com/criss-stack/river-rat-poker/issues/18)
- [PWA support](https://github.com/criss-stack/river-rat-poker/issues/19)
- [Native mobile wrapper](https://github.com/criss-stack/river-rat-poker/issues/20)
- [Poker engine and automated tests](https://github.com/criss-stack/river-rat-poker/issues/21)
- [Fake-money player login/profile system](https://github.com/criss-stack/river-rat-poker/issues/32)
- [Fake betting account and ledger](https://github.com/criss-stack/river-rat-poker/issues/33)

## Fake-Money Guardrail

River Rat Poker is a simulated poker game using fictional chips. Future account, bankroll, ledger, reward, or buy-in features must remain clearly fake-money only.

Do not add:

- Real bank connections
- Cash-out, withdrawal, or deposit flows
- Real-money betting
- Real prizes tied to poker outcomes
- Language that implies chips have cash value

## Development Priorities

Good next steps:

1. Add project tooling, README, deployment, and a lightweight test setup.
2. Make the table and controls mobile-first.
3. Extract poker logic from DOM rendering and cover it with automated tests.
4. Add local profiles, fake bankroll persistence, and ledger history.
5. Add PWA support, then evaluate a Capacitor wrapper for iOS and Android.

## License

License is not yet defined for the rebuilt prototype. Add one before public reuse or external contribution.
