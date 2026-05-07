# River Rat Poker

River Rat Poker is a playful Texas hold'em prototype set at a rat-world casino table. It is currently a static browser game built with HTML, CSS, JavaScript, and PNG artwork.

The game uses fictional chips only. No balances, bets, buy-ins, or future account features have real cash value.

## Current Status

This repo is being rebuilt around the new static game prototype. The current version includes:

- Four-seat poker table with one human player and three CPU opponents
- Blinds, betting rounds, folding, checking, calling, betting, raising, and all-in play
- Community cards, showdown evaluation, hand log, and persistent stacks during a session
- Custom card, chip, table, dealer, UI, cursor, and effects artwork

## Run Locally

From the repo root, start any simple static file server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, but a local server is better preparation for mobile/PWA work.

## Project Structure

```text
.
├── index.html
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

## Gameplay Notes

- Press **New Hand** to start or continue play.
- Small blind and big blind values can be adjusted before a new hand.
- The player's stack persists between hands during the current session.
- If too many players bust, stacks are reset so play can continue.

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
