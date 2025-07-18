---
type: Feature
scope:
  - ckeditor5-dev-changelog
closes:
  - https://github.com/ckeditor/ckeditor5/issues/18842
---

Introduced support for non-stable releases in the changelog generating tool.

Instead of deleting changelog entries during alpha releases, move them into nested directories organized by release cycle. 
This prevents loss of changelog entries when transitioning between alpha, beta, RC, and latest releases while avoiding duplication within the same channel. 

