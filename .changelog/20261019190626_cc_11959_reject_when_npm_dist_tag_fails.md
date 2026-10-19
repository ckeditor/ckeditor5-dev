---
type: Fix
scope:
  - ckeditor5-dev-release-tools
---

The `reassignNpmTags()` task now rejects when the npm dist-tag could not be changed for at least one package. Before, the task only listed the errors in the output and resolved successfully, so release automation reported a success even though the tag was not moved.

The task still processes all packages, retries each failed call, and prints the list of errors. Packages whose tag already points to the requested version are still reported as skipped and do not cause a rejection. The error message lists the packages that failed.
