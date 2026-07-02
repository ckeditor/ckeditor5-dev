---
type: Major breaking change
scope: ckeditor5-dev-manual-server
---

Introduced a new manual test format. The `manualTestsPlugin()` plugin now discovers only `*.manual.html` files, which are full HTML documents that reference their scripts with an explicit `<script type="module">` tag. Sidecar Markdown instruction files are no longer supported; instructions live inside the optional `<ck-manual-header>` element rendered as the test page header. Plain `.html` files inside `tests/manual` directories are treated as static fixtures and served without processing. Every discovered test page receives an invisible bootstrap script (license key global, editor inspector, refresh prompt), while the header chrome is injected only for pages that contain the `<ck-manual-header>` element.
