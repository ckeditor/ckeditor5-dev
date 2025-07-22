---
type: Feature
scope:
  - ckeditor5-dev-changelog
closes:
  - https://github.com/ckeditor/ckeditor5/issues/18842
---

Introduce support for non-stable releases in the changelog generating tool.

The following flow has been implemented to ensure clarity during the preparation process:

- A new interactive prompt now asks users to specify whether the release is a _pre-release_ (e.g., `alpha`, `beta`, `rc`), _pre-release_ promotion or a _stable_ release.
- Changelog entries are **no longer deleted** during non-stable releases. Instead, they are **moved to a pre-release subdirectory** inside `.changelog/`.
- When continuing within the same channel (e.g., multiple alphas), only top-level `.md` files are included.
- When transitioning to a **new channel**, tool collects entries from **pre-release directory**, ensuring no loss entries.
- Stable (latest) releases now aggregate all prior changelog entries across cycles, and remove all of them after generating the changelog to start fresh.
  Thanks to that, the generated changelog provides **clear traceability** of what was shipped during each phase, and reduces the chance of human error through improved automation and prompts.
