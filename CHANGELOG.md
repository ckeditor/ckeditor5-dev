Changelog
=========

## [63.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.5.0...v63.0.0) (October 23, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents), [build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools), [bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year), [changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog), [ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci), [docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs), [license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker), [manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server), [release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools), [stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot), [translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils), [web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler), [typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Upgraded the required version of Node.js to 26.10.0.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Published runs now commit with the git configuration of the checkout: its author and its signing setup, for example the bot configured in CI. `AI_TASKS_GIT_NAME` and `AI_TASKS_GIT_EMAIL` still override the author. Publishing fails with a clear message when no author is configured. See [ckeditor/ckeditor5-internal#4687](https://github.com/ckeditor/ckeditor5-internal/issues/4687).
* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Published runs now stack their report pull requests. While report pull requests of a task are open, every run that finds something new opens one more, based on the one below it, so each pull request shows only the changes of its run. Previously, every run added its commits to the one open pull request. Before a run, the base branch is merged into the bottom branch and every branch into the next one, and a pull request whose base was merged is based on the right branch again. The next parts of a stack are named `ai-tasks/<task>/<target>/<branch>--<part>`. Merge the report pull requests from the bottom up, with a merge commit. Publishing from a base branch whose name ends with `--<number>` now fails, because its report branches would be mistaken for the parts of another stack. On a part of a stack, `reject` and `dismiss` fetch the parts below it from `origin` and revert a fix against the right one. See [ckeditor/ckeditor5-internal#4687](https://github.com/ckeditor/ckeditor5-internal/issues/4687).

### Features

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Published runs can tell Slack about every new report pull request. Set `AI_TASKS_SLACK_WEBHOOK_URL` to a Slack incoming webhook. A failed notification is reported as a problem of the run and does not fail it. See [ckeditor/ckeditor5-internal#4687](https://github.com/ckeditor/ckeditor5-internal/issues/4687).

### Bug fixes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: The `ckeditor5-dev-ci-circle-disable-auto-cancel-builds` and `ckeditor5-dev-ci-circle-enable-auto-cancel-builds` scripts now fail with a clear error message when CircleCI rejects the request with a non-2xx response. Previously, the scripts reported success even when the "Auto-cancel redundant workflows" option was not updated, which allowed a new push to cancel a running release workflow.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `reassignNpmTags()` task now rejects when the npm dist-tag could not be changed for at least one package. Before, the task only listed the errors in the output and resolved successfully, so release automation reported a success even though the tag was not moved.

  The task still processes all packages, retries each failed call, and prints the list of errors. Packages whose tag already points to the requested version are still reported as skipped and do not cause a rejection. The error message lists the packages that failed.

### Other changes

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Upgraded Pi (`@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent`) to v1.3.0. See [ckeditor/ckeditor5-internal#4687](https://github.com/ckeditor/ckeditor5-internal/issues/4687).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.0.0): v62.5.0 => v63.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.0.0): v62.5.0 => v63.0.0
</details>


## [62.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.4.0...v62.5.0) (October 13, 2026)

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents), [release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Upgraded `simple-git` to v4. It removes the ambient `GIT_*` variables, and also `EDITOR`, `PAGER`, `PREFIX`, `SSH_ASKPASS`, and `VISUAL`, from the environment of git, unless the caller lists them in `allowEnvironment`.

  Thus `tools.commit()`, `push()`, `commitAndTag()`, and `validateRepositoryToRelease()` ignore variables such as `GIT_AUTHOR_NAME`, `GIT_SSH_COMMAND`, or `GIT_CONFIG_GLOBAL`. Give the identity, the signing key, and the credentials to git through its configuration or the SSH agent instead. The git commands of `ckeditor5-dev-agents` still get the git configuration, askpass, and SSH variables.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Minor releases (contain minor breaking changes):

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.5.0): v62.4.0 => v62.5.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.5.0): v62.4.0 => v62.5.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.5.0): v62.4.0 => v62.5.0
</details>


## [62.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.3.0...v62.4.0) (October 12, 2026)

### Features

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Introduced the `@ckeditor/ckeditor5-dev-agents` package. It runs recurring AI agent tasks against a repository and delivers the results as a pull request. A task judges the units it defines, skips the units whose content has not changed since the last run, and can fix what it finds. A human reviews the findings and the fixes in the pull request.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

New packages:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/62.4.0): v62.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.4.0): v62.3.0 => v62.4.0
</details>


## [62.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.2.1...v62.3.0) (October 2, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual test pages with the `<ck-manual-header>` element now use the editor font family on `<body>` instead of the default browser font. The font is read from the `--ck-font-family` CSS custom property, and the legacy `--ck-font-face` property still takes precedence when it is overridden.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.3.0): v62.2.1 => v62.3.0
</details>


## [62.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v62.2.0...v62.2.1) (October 1, 2026)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` and `reassignNpmTags()` tasks no longer fail on CircleCI when a release with npm Trusted Publishing (`useOidc`) takes longer than 5 minutes. See [ckeditor/ckeditor5-internal#4658](https://github.com/ckeditor/ckeditor5-internal/issues/4658).

  * npm accepts a CircleCI OIDC token only for 5 minutes after it was issued. Before, the remaining packages failed with `401 unauthorized`.
  * On CircleCI, the tasks now request a fresh token with the CircleCI CLI (`circleci`) right before each `npm publish` and `npm dist-tag add` call.
  * Without the CircleCI CLI, or outside CircleCI, the tasks use the `NPM_ID_TOKEN` environment variable, as before.
  * When no token can be obtained, the tasks stop before processing any package.
  * The new `getNpmIdToken()` function returns the token that the tasks use. It is exported from the package.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.2.1): v62.2.0 => v62.2.1
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
