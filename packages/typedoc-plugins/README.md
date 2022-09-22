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

The plugin reads the module name specified in the `@module` tag name.

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

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/typedoc-plugins/CHANGELOG.md) file.
