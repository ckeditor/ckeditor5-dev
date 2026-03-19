---
type: Fix
scope: ckeditor5-dev-ci
---

The `ckeditor5-dev-ci-trigger-snyk-scan` command should ignore `tests` and `external` folders when running the Snyk monitor command. This prevents unnecessary monitoring of test dependencies and external packages, which are not relevant for the security analysis of the main project.
