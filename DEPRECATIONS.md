# Deprecated APIs

Modules exported by packages in the repository can be marked as deprecated when an improved alternative appears, our processes require updates, or the proposed API is unsafe.

## List of deprecated API

Below, you can find all deprecation codes used in the `ckeditor5-dev-*` packages.

### DEP0001: `verifyPackagesPublishedCorrectly()`

Since v45, the `verifyPackagesPublishedCorrectly()` function is no longer available as its responsibility has been merged with `publishPackages()`.

### DEP0002: `checkVersionAvailability()`

Since v51, the `checkVersionAvailability()` function is no longer exported by the `@ckeditor/ckeditor5-dev-release-tools` package. Use the `@ckeditor/ckeditor5-dev-utils` package instead.

```js
import { npm } from '@ckeditor/ckeditor5-dev-utils';

npm.checkVersionAvailability( /* ... */ );
```

### DEP0003: `findPathsToPackages()`

Since v51, the `findPathsToPackages()` function is no longer exported by the `@ckeditor/ckeditor5-dev-release-tools` package. Use the `@ckeditor/ckeditor5-dev-utils` package instead.

```js
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

workspaces.findPathsToPackages( /* ... */ );
```
