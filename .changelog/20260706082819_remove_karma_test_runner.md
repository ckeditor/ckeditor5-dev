---
type: Major breaking change

scope:
  - ckeditor5-dev-tests
  - ckeditor5-dev-utils

see:
  - ckeditor/ckeditor5-internal#4595
---

Removed the Karma test runner. Automated tests (`ckeditor5-dev-tests-run-automated`) are now executed exclusively with Vitest. The manual test pipeline is unaffected.

* Removed the CLI options of the automated test runner: `--browsers` (`-b`), `--reporter`, `--server`, `--karma-config-overrides`, `--cache`, and `--resolve-js-first`. Webpack-specific options (`--source-map`, `--language`, `--additional-languages`, `--tsconfig`, `--identity-file`, `--verbose`, `--silent`) are no longer accepted by the automated test runner either; they remain available for manual tests.
* Removed the `--notify` (`-n`) option together with desktop notifications support (`node-notifier`). Notifications were emitted only by the Karma runner.
* Removed the `--production` option and the dev-mode warning. The strict checks are configured in the Vitest setup of each tested package and apply in every run, so local and CI executions follow the same rules.
* Removed the `equalMarkup` Chai assertion. Use the `toEqualMarkup()` Vitest matcher exported by `@ckeditor/ckeditor5-dev-tests` instead.
* Removed the IntelliJ Karma runner integration.
* Removed the `loaders.getCoverageLoader()` function from `@ckeditor/ckeditor5-dev-utils`.
