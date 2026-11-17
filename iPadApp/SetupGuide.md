# Setup Guide: Glass New Tab (iPadOS)

Requires a Mac with Xcode 15+ and an iPad on iPadOS 16.4+ (new-tab override support varies by iPadOS version; test on your target OS).

## Option A: Converter (fastest, from the finished extension)
1. Put the files from `Extension/Resources/` in a folder, e.g. `~/GlassNewTab/Resources`.
2. In Terminal:
   ```
   xcrun safari-web-extension-converter ~/GlassNewTab/Resources \
     --app-name "Glass New Tab" --bundle-identifier com.yourname.GlassNewTab \
     --swift --no-open --force
   ```
3. Open the generated `.xcodeproj`. Pick the **iOS** scheme (it also runs on iPad).
4. In the app target's General tab, ensure **iPad** is in Supported Destinations.
5. Replace the generated `ViewController`/SwiftUI root with `iPadApp/ContentView.swift` (set `ContentView()` inside a `WindowGroup` in your `@main` App struct). Replace the extension's handler with `iPadApp/SafariWebExtensionHandler.swift`.

## Option B: Manual Xcode target
1. File › New › Project › **iOS › App** (SwiftUI, name "Glass New Tab").
2. File › New › Target › **Safari Extension** (iOS). Name it "Glass New Tab Extension".
3. Delete the template's Resources; drag in the five files from `Extension/Resources/` (check the extension target only).
4. Add `ContentView.swift` to the app target and `SafariWebExtensionHandler.swift` to the extension target.

## Signing & run
1. Select both targets › Signing & Capabilities › choose your Team; keep bundle IDs as `com.yourname.GlassNewTab` and `com.yourname.GlassNewTab.Extension`.
2. Connect the iPad, select it as the run destination, press Run.
3. On the iPad: Settings › Apps › Safari › Extensions › enable **Glass New Tab**, allow access, then set it as the New Tab page where iPadOS offers it.
4. Debug: on a Mac, Safari › Develop › [your iPad] › the extension page. Enable Develop menu and Web Inspector on the iPad (Settings › Safari › Advanced).

## Notes
- Add an `images/` folder with icons and reference them in `manifest.json` (`"icons"`) before App Store submission.
- Replace the sample partners and promo codes in `data.js` with real, contracted offers, and disclose sponsorship per App Review and local ad rules.
- The sponsored card is picked once on `DOMContentLoaded`; there are no ad timers. The only intervals are the clock and the Pomodoro countdown.
