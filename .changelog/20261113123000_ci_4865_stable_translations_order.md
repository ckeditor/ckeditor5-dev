---
type: Fix
scope:
  - ckeditor5-dev-build-tools
---

The `translations()` plugin now produces the same translation files in every build. Before, it merged the translation files in the order in which `glob` found them, which could change between builds. So the order of the messages could differ, and when two files defined the same message, either value could be used. The files are now merged in the order of their paths.
