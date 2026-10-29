# Installing the app on Android

The app is a PWA: [static/manifest.webmanifest](../../../static/manifest.webmanifest), linked from [src/app.html](../../../src/app.html), plus the service worker SvelteKit registers in production builds ([src/service-worker.ts](../../../src/service-worker.ts)). The manifest carries PNG icons (192 and 512 px, rendered from `static/icon.svg` with Inkscape) next to the SVG, because Chromium builds its installed app (WebAPK) from a PNG icon.

## When the install silently does nothing

Before touching the app, rule out the phone. In any browser on the phone, use "Add to Home screen" on an unrelated site such as wikipedia.org. If that fails silently too, the phone is refusing every pinned shortcut, and nothing in this repo can fix it. Look for a per-app "home screen shortcuts" permission on the browser (Xiaomi/HyperOS, Oppo/Realme, Vivo, Huawei/Honor have one) or a launcher setting.

On 2026-10-29 this is what happened: Brave and Firefox both failed, and Wikipedia failed as well. Adding the PNG icons did not change it. The phone-side cause had not been found when this was written.

If other sites install but meteo does not, inspect the page over USB (`brave://inspect` on the desktop, Application → Manifest) to read the installability errors.
