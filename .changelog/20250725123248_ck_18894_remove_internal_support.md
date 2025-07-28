---
type: Other
scope:
  - ckeditor5-dev-changelog
closes:
  - https://github.com/ckeditor/ckeditor5/issues/18894
---

Disallowed "internal" as a valid release type.

The "internal" version identifier is no longer accepted to enforce consistent and meaningful versioning.
Developers must now provide a clear reason for publishing a release. Attempts to use "internal" will result in a validation error.
