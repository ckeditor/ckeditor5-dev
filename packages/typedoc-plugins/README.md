# TypeDoc plugins overview

[![npm version](https://badge.fury.io/js/%40ckeditor%2Ftypedoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)
[![Build Status](https://travis-ci.com/ckeditor/ckeditor5-dev.svg?branch=master)](https://app.travis-ci.com/github/ckeditor/ckeditor5-dev)
![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/typedoc-plugins)

## Overview

This repository consists of few plugins which extend the capabilities of [TypeDoc](https://typedoc.org/).

Before enabling plugins from the package, you need to install it first.

```bash
npm install @ckeditor/typedoc-plugins
```

Below you can find the detailed overview of available plugins.

### Module fixer

The plugin reads the module name specified in the `@module` annotation.

```ts
import type { TypeDefinition } from '...';

/**
 * @module package/file
 */
```

For the example specified above, a name of the parsed module should be equal to `package/file`.

The `import` statements may be specified above the "@module" block code. In such a case, the default module parser from `typedoc` returns the module name based on a path relative to the project root.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/module-fixer' )
    ]
}
```

### Symbol fixer

The plugin renames `Symbol.*` definitions with the JSDoc style.

* Typedoc: `[iterator]() → Iterator`
* JSDoc: `Symbol.iterator() → Iterator`

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/symbol-fixer' )
    ]
}
```

### Interface augmentation fixer

The plugin tries to fix an interface, that has been extended (augmented) from the outside (from
another module) in the re-exported `index.ts` file. When the extending "declare module ..." declaration contains the full package name, it points to the `index.ts` file instead of the actual source file. The goal is to add missing properties from interfaces to their source locations.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/interface-augmentation-fixer' )
    ]
}
```

### Event parameter fixer

The plugin injects the `eventInfo` parameter (an instance of the `EventInfo` class) as the first parameter for each event reflection.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/event-param-fixer' )
    ]
}
```

### Events inheritance fixer

The plugin takes care of inheriting events, which are created manually via the [`@eventName`](#tag-eventname) annotation.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/event-inheritance-fixer' )
    ]
}
```

### Purge private API

The plugin removes reflections collected from private packages (marked as `"private": true` in their `package.json`). To disable the mechanism, add the `@publicApi` annotation at the beginning of a file.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/purge-private-api-docs' )
    ]
}
```

### Tag `@error`

The plugin collects error definitions from the `@error` annotation.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/tag-error' )
    ]
}
```

### Tag `@eventName`

The plugin collects event definitions from the `@eventName` annotation and assigns them as the children of the class or the `Observable` interface.

We are not using the [`@event`](https://typedoc.org/tags/event/) annotation, known from the JSDoc specification, because it has a special meaning in the TypeDoc, and it would be difficult to get it to work as we expect.

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/tag-event' )
    ]
}
```

### Tag `@observable`

To enable the plugin, add the following path to available plugins:

```js
{
    plugin: [
        // ...
        require.resolve( '@ckeditor/typedoc-plugins/lib/tag-observable' )
    ]
}
```

------------------------------------------------------------------------------------

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/typedoc-plugins/CHANGELOG.md) file.
