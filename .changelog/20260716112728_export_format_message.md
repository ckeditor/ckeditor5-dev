---
type: Feature
scope:
  - ckeditor5-dev-ci
---

Exported the `formatMessage()` helper from the package index. It builds the Slack notification payload for a failed CI build and can now be used by other tools, not only by the `ckeditor5-dev-ci-notify-circle-status` command.
