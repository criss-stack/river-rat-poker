Generating Android / iOS icons and splash screens

This document explains a minimal, repeatable approach for creating native app icons and splash screens for Capacitor (issue #20 follow-up).

Prerequisites
- Install cordova-res (or use npx to run it without installing):
  npm install --save-dev cordova-res

Source artwork
- Prepare a square source PNG (recommended 1024x1024) for the app icon.
- Prepare a splash source PNG (recommended 2732x2732 with safe area centered) for splash screens.
- The repo already contains a dealer rat PNG: assets/dealer_rat/Rat_Happy.png. Use that as a starting point:

  mkdir -p resources && cp assets/dealer_rat/Rat_Happy.png resources/icon.png && cp assets/dealer_rat/Rat_Happy.png resources/splash.png

Generating resources with cordova-res
- Run (will create native/icon and native/splash folders and platform resources in android/ and ios/ if present):
  npx cordova-res --skip-config --copy

- Or to target specific platforms:
  npx cordova-res android --skip-config --copy
  npx cordova-res ios --skip-config --copy

Notes
- cordova-res will place generated images in resources/android and resources/ios and copy them into platform projects when available.
- Alternatively, use community tools such as @capacitor/assets or generate assets manually.
- After generating resources, run `npx cap sync` to ensure native projects pick them up.

Example npm script (already added):
  "native:generate-resources": "npx cordova-res --skip-config --copy"

Committing resources
- Generated native platform folders (android/ios) are large; it's common to keep them out of git and add them to .gitignore. Commit the source `resources/icon.png`/`resources/splash.png` if you want to keep canonical artwork in the repo.

Follow-up
- Replace placeholder artwork with polished app icons and splash images (designer deliverables).
- Consider using adaptive icons for Android (foreground/background layers) for best results.