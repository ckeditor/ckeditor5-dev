---
type: Feature
scope:
  - ckeditor5-dev-release-tools
closes:
  - ckeditor/ckeditor5#18939
---

The `executeInParallel()` function now stores the temporary worker module inside the project instead of in its root directory. The location is configurable via the new `workerDirectory` option, which is resolved from `cwd` and defaults to `build`.

The module must stay inside the project so that `import()` and `require()` calls in the executed callback still resolve dependencies from the project's `node_modules`. Storing it in a directory ignored by git prevents a leftover module from polluting the working tree when the process is aborted or fails.
