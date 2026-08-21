# Capacitor Integration

River Rat Poker uses Capacitor to package the shared mobile web game into native app targets.

## Current State

- `capacitor.config.json` sets `webDir` to `dist`.
- `ios/` is tracked and is the current native app target.
- `package.json` includes build, sync, open, and doctor scripts.
- `resources/` contains source icon and splash SVG assets.

## Daily Workflow

```bash
npm install
npm run native:prepare:ios
npm run native:open:ios
```

`native:prepare:ios` runs the web build first, then syncs `dist/` into the native iOS project.

## First-Time Platform Commands

The iOS target is already present. Android can be introduced later when needed:

```bash
npm run native:add:android
```

After any platform addition or native plugin change, run:

```bash
npm run native:sync
```

## Notes

- Keep gameplay and UI changes in `index.html`, `style.css`, `premium-ui.css`, `script.js`, and `assets/`.
- Treat native folders as packaging, signing, icons, launch screens, and platform configuration.
- Do not fork poker rules or table rendering into native-only code unless the project explicitly leaves the Capacitor architecture.
