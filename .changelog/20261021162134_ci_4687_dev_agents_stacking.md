---
type: Minor breaking change
scope:
  - ckeditor5-dev-agents
see:
  - https://github.com/ckeditor/ckeditor5-internal/issues/4687
---

Published runs now stack their report pull requests. While report pull requests of a task are open, every run that finds something new opens one more, based on the one below it, so each pull request shows only the changes of its run. Previously, every run added its commits to the one open pull request. Before a run, the base branch is merged into the bottom branch and every branch into the next one, and a pull request whose base was merged is based on the right branch again. The next parts of a stack are named `ai-tasks/<task>/<target>/<branch>--<part>`. Merge the report pull requests from the bottom up, with a merge commit. Publishing from a base branch whose name ends with `--<number>` now fails, because its report branches would be mistaken for the parts of another stack. On a part of a stack, `reject` and `dismiss` fetch the parts below it from `origin` and revert a fix against the right one.
