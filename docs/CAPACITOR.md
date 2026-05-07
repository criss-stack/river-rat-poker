Capacitor integration notes

This doc provides a minimal scaffold to wrap River Rat Poker with Capacitor.

What was added
- capacitor.config.json (webDir: dist)
- package.json scripts for common Capacitor commands
- docs/CAPACITOR.md (this file)
- native/ folder placeholder with README

Getting started (developer)
1. Install the Capacitor CLI and core (locally):
   npm install --save-dev @capacitor/cli @capacitor/core

2. Build the web app:
   npm run build

3. Initialize Capacitor (only first-time):
   npm run native:init
   or: npx cap init "River Rat Poker" com.criss.riverrat --web-dir=dist

4. Add platforms:
   npm run native:add:android
   npm run native:add:ios

5. Sync after any web changes:
   npm run native:sync

6. Open native IDEs:
   npm run native:open:android
   npm run native:open:ios

Notes
- This scaffold does NOT include platform folders; running the add platform commands will create them.
- iOS builds require macOS and Xcode. Android builds require Android Studio and SDK.
- After adding platforms, avoid committing large native files unless intentionally tracking native project changes.
- Consider running: npm ci after updating package.json to install Capacitor packages.
