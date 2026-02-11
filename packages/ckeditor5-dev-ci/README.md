CKEditor 5 CI utilities
=======================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-ci.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

Utils for [CKEditor 5](https://ckeditor.com) CI builds.

Contains tools for sending Slack notifications by Circle CI.

## Available scripts

These commands accept a mix of environment variables and command line arguments. Environment variables are preferred when the value comes from the CI environment or is sensitive (like tokens). Command line arguments are preferred when the value is static or local to a given repository.

> [!WARNING]
> Tokens are passed as environment variables to avoid exposing sensitive credentials in shell history, CI logs, or shared configuration files.

- ⚙️ **`ckeditor5-dev-ci-circle-disable-auto-cancel-builds`**

  Disables the _“Auto-cancel redundant workflows”_ option in CircleCI for a given repository.
  Useful during release processes to prevent CircleCI from canceling the workflow triggered by the release commit itself.

  **Environment variables:**
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for authentication.

  **Parameters:**
  - `--organization` &mdash; GitHub organization name.
  - `--repository` &mdash; GitHub repository name.

- ⚙️ **`ckeditor5-dev-ci-circle-enable-auto-cancel-builds`**

  Enables the _“Auto-cancel redundant workflows”_ option in CircleCI for a given repository.
  Should be used after a release workflow that temporarily disables this option using the `ckeditor5-dev-ci-circle-disable-auto-cancel-builds` script.

  **Environment variables:**
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for authentication.

  **Parameters:**
  - `--organization` &mdash; GitHub organization name.
  - `--repository` &mdash; GitHub repository name.

- ⚙️ **`ckeditor5-dev-ci-circle-workflow-notifier`**

  Waits for all jobs in the **current CircleCI workflow** to finish (success or error) and then runs a final command (the "notifier").
  Intended to run as a **dedicated job** in your workflow. The script itself handles waiting – you typically don’t add `requires` on this job.

  **Environment variables:**
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for authentication.

  **CircleCI-provided variables:**
  - `CIRCLE_WORKFLOW_ID` &mdash; ID of the current workflow.
  - `CIRCLE_JOB` &mdash; Name of the current job.

  **Parameters:**
  - `--task` &mdash; Command to execute at the end; default: `pnpm ckeditor5-dev-ci-notify-circle-status`.
  - `--ignore` &mdash; Job name to ignore when waiting (repeatable; can be passed multiple times).

  **Behavior:**
  - Retries transient CircleCI API errors up to **5 attempts** with a **10s delay** between attempts.
  - Fails immediately for non-retryable API errors (for example: invalid token or wrong workflow ID).
  - If transient errors persist, it exits with an explicit message asking to verify workflow results manually.

- ⚙️ **`ckeditor5-dev-ci-is-job-triggered-by-member`**

  Verifies that a **CircleCI approval job** was approved by a user who belongs to a specified GitHub team.
  Uses CircleCI and GitHub APIs to check the approver against the team membership.

  **Environment variables:**
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for authentication.
  - `CKE5_GITHUB_TOKEN` &mdash; GitHub token used to query team membership.

  **CircleCI-provided variables:**
  - `CIRCLE_WORKFLOW_ID` &mdash; ID of the current workflow.

  **Parameters:**
  - `--job` &mdash; Name of the approval job to verify.
  - `--organization` &mdash; GitHub organization name.
  - `--team` &mdash; GitHub team name (slug) to validate against.

- ⚙️ **`ckeditor5-dev-ci-is-workflow-restarted`**

  Checks whether the current CircleCI workflow has been **restarted**.
  If a restart is detected, the script exits with a zero exit code, allowing the pipeline to continue conditionally.

  **Environment variables:**
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for authentication.

  **CircleCI-provided variables:**
  - `CIRCLE_WORKFLOW_ID` &mdash; ID of the current workflow (set by CircleCI).

- ⚙️ **`ckeditor5-dev-ci-notify-circle-status`**

  Sends a Slack notification summarizing the current CircleCI build/workflow status.
  For failed builds, fetches the commit author via the GitHub API (works with private repositories).

  **Environment variables:**
  - `CKE5_GITHUB_TOKEN` &mdash; GitHub token with the `repo` scope, used to fetch commit author.
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for API calls.
  - `CKE5_SLACK_WEBHOOK_URL` &mdash; Incoming Webhook URL for the Slack channel receiving notifications.

  **CircleCI-provided variables:**
  - `CIRCLE_BRANCH` &mdash; The number of the current build.
  - `CIRCLE_PROJECT_REPONAME` &mdash; Repository name.
  - `CIRCLE_PROJECT_USERNAME` &mdash; Organization/user name.
  - `CIRCLE_SHA1` &mdash; Commit SHA of the current build.
  - `CIRCLE_WORKFLOW_ID` &mdash; ID of the current workflow.

  **Parameters:**
  - `--pipeline-id` &mdash Value of Circle's `<< pipeline.number >>` parameter ([read more](https://circleci.com/docs/guides/orchestrate/pipeline-variables/#pipeline-values)).
  - `--trigger-repository-slug` &mdash; `<org>/<repo>` to construct the commit URL when provided with `--trigger-commit-hash`. Useful when a pipeline was triggered via a different repository.
  - `--trigger-commit-hash` &mdash; Commit SHA to construct the commit URL. Useful when a pipeline was triggered via a different repository.
  - `--hide-author` &mdash; `"true"`/`"false"` to hide the author in Slack.

- ⚙️ **`ckeditor5-dev-ci-trigger-circle-build`**

  Triggers a **new CircleCI pipeline** for a specified repository.
  Commonly used to initiate release or follow-up pipelines from an existing workflow.

  **Environment variables:**
  - `CKE5_CIRCLE_TOKEN` &mdash; CircleCI API token used for authentication.

  **CircleCI-provided variables:**
  - `CIRCLE_BRANCH` &mdash; Git branch of the currently processed pipeline.
  - `CIRCLE_SHA1` &mdash; Full commit SHA of the currently processed pipeline.

  **Parameters:**
  - `--slug` &mdash; Repository slug (`org/name`) where the new pipeline will be started.
  - `--trigger-repository-slug` &mdash; *(Optional)* Repository slug (`org/name`) that triggered the new pipeline.
    Can be omitted if it matches `--slug`.
  - `--release-branch` &mdash; *(Optional)* Branch that leads the release process.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-ci/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
