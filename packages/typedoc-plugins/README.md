# TypeDoc plugins overview

[![npm version](https://badge.fury.io/js/%40ckeditor%2Ftypedoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

## Overview

This repository consists of a few plugins which extend the capabilities of [TypeDoc](https://typedoc.org/).

> [!WARNING]
> The [`@ckeditor/typedoc-plugins`](https://www.npmjs.com/package/@ckeditor/typedoc-plugins) requires [`typedoc@0.28`](https://npmjs.com/package/typedoc).

Before enabling plugins from the package, you need to install it first.

```bash
npm install @ckeditor/typedoc-plugins
```

Below you can find the detailed overview of available plugins.

## Usage

To use the `typedoc-plugins`, you need to create an instance of the Typedoc application.

```js
import { Application } from 'typedoc';
import { typeDocSymbolFixer } from '@ckeditor/typedoc-plugins';

const app = await Application.bootstrapWithPlugins( { /* Typedoc options. */ } );

// It is essential to execute a plugin before converting the project.
typeDocSymbolFixer( app );

const conversionResult = await typeDoc.convert();
```

## Available plugins

- **Module fixer** &mdash; `typeDocModuleFixer()`

  The plugin reads the module name specified in the `@module` annotation.

  ```ts
  import type { TypeDefinition } from '...';
  
  /**
   * @module package/file
   */
  ```

  For the example specified above, the name of the parsed module should be equal to `package/file`.

  The `import` statements may be specified above the "@module" block code. In such a case, the default module parser from `typedoc` returns the module name based on a path relative to the project root.

- **Symbol fixer** &mdash; `typeDocSymbolFixer()`

  The plugin renames `Symbol.*` definitions with the JSDoc style.

  - Typedoc: `[iterator]() → Iterator`
  - JSDoc: `Symbol.iterator() → Iterator`

- **Interface augmentation fixer** &mdash; `typeDocInterfaceAugmentationFixer()`

  The plugin tries to fix an interface, that has been extended (augmented) from the outside (from another module) in the re-exported `index.ts` file. When the extending "declare module ..." declaration contains the full package name, it points to the `index.ts` file instead of the actual source file. The goal is to add missing properties from interfaces to their source locations.

- **Event parameter fixer** &mdash; `typeDocEventParamFixer()`

  The plugin injects the `eventInfo` parameter (an instance of the `EventInfo` class) as the first parameter for each event reflection.

- **Events inheritance fixer** &mdash; `typeDocEventInheritanceFixer()`

  The plugin takes care of inheriting events, which are created manually via the [`@eventName`](#tag-eventname) annotation.

- **Purge private API** &mdash; `typeDocPurgePrivateApiDocs()`

  The plugin removes reflections collected from private packages (marked as `"private": true` in their `package.json`). To disable the mechanism, add the `@publicApi` annotation at the beginning of a file.
    
- **Tag `@error`** &mdash; `typeDocTagError()`

  The plugin collects error definitions from the `@error` annotation.
    
- **Tag `@eventName`** &mdash; `typeDocTagEvent()`

  The plugin collects event definitions from the `@eventName` annotation and assigns them as the children of the class or the `Observable` interface.

  We are not using the [`@event`](https://typedoc.org/tags/event/) annotation, known from the JSDoc specification, because it has a special meaning in the TypeDoc, and it would be difficult to get it to work as we expect.

- **Tag `@observable`** &mdash; `typeDocTagObservable()`

  Adds support for creating CKEditor 5 events from properties marked as `@observable`.

------------------------------------------------------------------------------------

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/typedoc-plugins/CHANGELOG.md) file.
