---
# Required: Type of change.
# Allowed values:
# - Feature
# - Fix
# - Other
# - Major breaking change
# - Minor breaking change
#
# For guidance on breaking changes, see:
# https://ckeditor.com/docs/ckeditor5/latest/updating/versioning-policy.html#major-and-minor-breaking-changes
type: Fix

# Optional: Affected package(s), using short names.
# Can be skipped when processing a non-mono-repository.
# Example: ckeditor5-core
scope:
  - ckeditor5-dev-changelog

# Optional: Issues this change closes.
# Format:
# - {issue-number}
# - {repo-owner}/{repo-name}#{issue-number}
# - Full GitHub URL
closes:
  - https://github.com/ckeditor/ckeditor5/issues/18665
---

Fix changelog entry generation on published version of `dev-changelog` package.
