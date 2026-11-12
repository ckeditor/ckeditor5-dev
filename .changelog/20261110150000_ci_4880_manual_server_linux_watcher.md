---
type: Fix
scope:
  - ckeditor5-dev-manual-server
---

The manual test server starts and rebuilds on Linux again. With Rolldown 1.2.13 or newer, the bundled development server watched the whole workspace, because the module that loads translations used one glob import for all package directories. On Linux, the server then tried to register every directory, including the `node_modules` directories that link to each other in a pnpm workspace. It did not finish, so the server never became ready.

The translation files are now imported one by one, and the `node_modules` and `.git` directories are excluded from the watcher. A translation file added while the server is running is loaded after a server restart.
