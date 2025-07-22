---
type: Other
scope:
  - ckeditor5-dev-utils
closes:
  - https://github.com/ckeditor/ckeditor5/issues/18878
---

Improved file path handling and cross-platform support in the `tools.commit()` function. Now correctly includes valid files in commits, skips missing ones, and avoids creating empty commits.
