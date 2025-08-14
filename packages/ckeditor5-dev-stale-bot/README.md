CKEditor 5 Stale bot
====================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-stale-bot.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

A stale bot is used to mark issues and pull requests that have not recently been updated.

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

To execute the stale bot, run the following command:

```bash
pnpm run ckeditor5-dev-stale-bot [<args>...]
```

This script accepts the following arguments:

* `--config-path` &ndash; Required. Path to a JSON or JavaScript file containing [stale bot configuration](#configuration).
* `--dry-run` &ndash; Optional, `false` by default. Allows disabling any changes to GitHub if set to `true`. By default stale bot makes use of your **real, live, production data**.

### Configuration

The following configuration options are supported by the stale bot:

* `GITHUB_TOKEN` &ndash; Required. A GitHub token with the `repo:*` scope needed for managing repositories and issues.
* `REPOSITORY_SLUG` &ndash; Required. The repository name in the format of `owner/name`, where stale bot will check for stale issues and pull requests.
* `STALE_LABELS` &ndash; Required. A list of labels to add on staled issues and pull requests.
* `CLOSE_ISSUE_LABELS` &ndash; Required. A list of labels to add after closing a stale issue.
* `CLOSE_PR_LABELS` &ndash; Required. A list of labels to add after closing a stale pull request.
* `STALE_ISSUE_MESSAGE` &ndash; Required. A comment that is added on the staled issues.
* `STALE_PR_MESSAGE` &ndash; Required. A comment that is added on the staled pull requests.
* `CLOSE_ISSUE_MESSAGE` &ndash; Required. A comment that is added on the closed issues.
* `CLOSE_PR_MESSAGE` &ndash; Required. A comment that is added on the closed pull requests.
* `DAYS_BEFORE_STALE` &ndash; Optional, 365 by default. The number of days without the required activity that qualifies an issue or pull request to be marked as stale. The dates taken into account are:
  * the creation date,
  * the last date of editing an issue or pull request,
  * the last date of adding a reaction to the body of issue or pull request,
  * the last date of adding or editing a comment,
  * the last date of changing a label.
* `DAYS_BEFORE_STALE_PENDING_ISSUE` &ndash; Optional, 14 by default. The number of days without a comment on pending issue from a non-team member that qualifies the issue to be marked as stale.
* `PENDING_ISSUE_LABELS` &ndash; Optional, an empty array by default. A list of labels that identify a pending issue. If empty, then pending issues are not processed.
* `STALE_PENDING_ISSUE_MESSAGE` &ndash; Optional, set to the value from `STALE_ISSUE_MESSAGE` by default. A comment that is added on the staled pending issues.
* `DAYS_BEFORE_CLOSE` &ndash; Optional, 30 by default. The number of days before closing the stale issues or the stale pull requests.
* `IGNORE_VIEWER_ACTIVITY` &ndash; Optional, `true` by default. If set, the activity from the currently authenticated user is ignored.
* `IGNORED_ISSUE_LABELS` &ndash; Optional, an empty array by default. A list of labels, whose assignment to an issue causes the issue to be ignored, even if it fits the stale criteria.
* `IGNORED_PR_LABELS` &ndash; Optional, an empty array by default. A list of labels, whose assignment to a pull request causes the pull request to be ignored, even if it fits the stale criteria.
* `IGNORED_ACTIVITY_LABELS` &ndash; Optional, an empty array by default. A list of labels, whose assignment to an issue or pull request is not counted as an activity event.
* `IGNORED_ACTIVITY_LOGINS` &ndash; Optional, an empty array by default. A list of GitHub logins, whose activities are not counted.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-stale-bot/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
