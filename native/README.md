# Native App Notes

River Rat Poker is now a Capacitor mobile app repo.

The tracked `ios/` folder is the current native platform target. Treat this `native/` folder as a small place for cross-platform notes only; gameplay and mobile UI work should continue to happen in the shared web source files and then sync into native targets through Capacitor.

## Workflow

- Run `npm run build` to generate `dist/`.
- Run `npm run native:prepare:ios` to rebuild and sync the latest app into iOS.
- Run `npm run native:open:ios` to open the synced app in Xcode.

Android can be added later with `npm run native:add:android` when that platform is intentionally introduced.
