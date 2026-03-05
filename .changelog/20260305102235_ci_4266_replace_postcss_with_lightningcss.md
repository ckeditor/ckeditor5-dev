---
type: Minor breaking change
scope:
  - ckeditor5-dev-build-tools
  - ckeditor5-dev-utils
---

Following our migration away from PostCSS features, we have replaced PostCSS with [LightningCSS](https://lightningcss.dev/) in our build tools. This changes the specificity of the generated CSS selectors, which now reflect how native CSS nesting works.
