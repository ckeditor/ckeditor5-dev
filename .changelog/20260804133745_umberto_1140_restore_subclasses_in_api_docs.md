---
type: Feature
scope:
  - typedoc-plugins
---

Added the `typedoc-plugin-hierarchy-fixer` plugin that restores the class hierarchy in the generated API documentation data for classes extending an intermediate mixin constant, for example `const ClassicEditorBase = ElementApiMixin( Editor )`. The plugin replaces the unresolvable base class reference with the actual base class, restores the "Subclasses" relation on the base class page, and lists the mixin interfaces in the "Implements" section. It also prevents references to reflections removed by the private API purge mechanism from leaking into the documentation output.
