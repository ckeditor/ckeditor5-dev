---
type: Fix
scope:
  - ckeditor5-dev-ci
---

The workflow notifier no longer throws when the CircleCI API returns a job without the `dependencies` property. Such a job is now treated as a job with no dependencies.
