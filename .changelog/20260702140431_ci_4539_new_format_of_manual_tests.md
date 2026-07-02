---
type: Fix
scope: ckeditor5-dev-manual-server
---

The `refreshPlugin()` plugin shows the "refresh available" prompt again instead of reloading the page on every JavaScript change. Vite 8.1 moved the internal structures the plugin relies on, which silently disabled it. The plugin now targets Vite 8.1 or newer and logs a warning on server start when the required internals are missing.
