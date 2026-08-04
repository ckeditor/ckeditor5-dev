---
type: Fix
scope:
  - typedoc-plugins
---

Restored the class hierarchy in the generated API documentation data for classes extending an intermediate mixin constant, for example `const ClassicEditorBase = ElementApiMixin( Editor )`. The new `typedoc-plugin-hierarchy-fixer` plugin replaces the unresolvable base class reference with the actual base class, restores the "Subclasses" relation on the base class page, and lists the mixin interfaces in the "Implements" section. References to reflections removed by the private API purge mechanism no longer leak into the documentation output.
