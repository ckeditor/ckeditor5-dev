---
type: Other
scope:
  - ckeditor5-dev-tests
closes:
  - https://github.com/ckeditor/ckeditor5/issues/18891
---

Added support for running tests for packages by specifying a full directory name.

Removed support for running tests for root directory tests. e.g. Running `yarn test -f ckeditor5` will now target a directory `packages/ckeditor5` instead of the root of the monorepo.
