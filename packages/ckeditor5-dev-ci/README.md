CKEditor 5 CI utilities
=======================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-ci.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

Utils for [CKEditor 5](https://ckeditor.com) CI builds.

Contains tools for sending Slack notifications by Travis or Circle CI.

Available commands:

- `ckeditor5-dev-ci-notify-travis-status`,
- `ckeditor5-dev-ci-notify-circle-status`,
- `ckeditor5-dev-ci-circle-workflow-notifier`,
- `ckeditor5-dev-ci-allocate-swap-memory`,
- `ckeditor5-dev-ci-install-latest-chrome`,
- `ckeditor5-dev-ci-is-job-triggered-by-member`,
- `ckeditor5-dev-ci-is-workflow-restarted`,
- `ckeditor5-dev-ci-trigger-circle-build`,
- `ckeditor5-dev-ci-circle-disable-auto-cancel-builds`,
- `ckeditor5-dev-ci-circle-enable-auto-cancel-builds`.

These commands accept a mix of environment variables and command line arguments. Environment variables are preferred when value comes from CI environment or is sensitive (like tokens). Command line arguments are preferred when value is static or local to a given repository (like Slack channel name).

See the individual files in the `bin/` folder for documentation about each command and their usage.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-ci/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
