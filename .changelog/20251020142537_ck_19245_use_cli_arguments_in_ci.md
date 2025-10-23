---
type: Feature
scope: ckeditor5-dev-ci
closes: https://github.com/ckeditor/ckeditor5/issues/19245
---

Updated CI utility scripts to support and prefer passing arguments via CLI instead of environment variables. 

The change affects the following scripts:

- `ckeditor5-dev-ci-circle-disable-auto-cancel-builds`
- `ckeditor5-dev-ci-circle-enable-auto-cancel-builds`
- `ckeditor5-dev-ci-circle-workflow-notifier`
- `ckeditor5-dev-ci-is-job-triggered-by-member`
- `ckeditor5-dev-ci-is-workflow-restarted`
- `ckeditor5-dev-ci-notify-circle-status`
- `ckeditor5-dev-ci-trigger-circle-build`

For detailed usage instructions, see the [README](https://github.com/ckeditor/ckeditor5-dev/tree/master/packages/ckeditor5-dev-ci).
