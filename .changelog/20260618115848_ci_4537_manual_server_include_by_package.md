---
type: Feature
scope:
  - ckeditor5-dev-manual-server
---

The `manualTestsPlugin()` now accepts an options object with an optional `include` option that limits the Vite manual test server to the manual tests of the listed packages. Package names can be provided in a short (`core`) or full (`ckeditor5-core`) form. When the option is empty or omitted, all manual tests matched by `paths` are served.
