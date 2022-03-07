# JSDoc plugins overview

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fjsdoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)
[![Build Status](https://travis-ci.com/ckeditor/ckeditor5-dev.svg?branch=master)](https://app.travis-ci.com/github/ckeditor/ckeditor5-dev)
![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/jsdoc-plugins)

## Overview

This repository consists of few plugins which extend the capabilities of [JSDoc](https://github.com/jsdoc3/jsdoc).

The list of generic plugins:

* `lib/validator/validator.js` - validates if references to types used in params lists or property types are defined elsewhere, whether links point to existing properties/classes/modules, etc.
* `lib/export-fixer/export-fixer.js` - fixes an error with `export default` syntax
* `lib/custom-tags/error.js` - provides support for the custom `@error` tag
* `lib/relation-fixer.js` - fixes problem with inheritance (extends child classes with properties from parent classes)
* `lib/longname-fixer/longname-fixer.js` - enables short notation in links
* `lib/utils/doclet-logger.js` - enables logging output into the `<CWD>/docs/api/output.json`

CKEditor 5 specific plugins

* `lib/event-extender/event-extender.js` - CKEditor 5 specific util that inserts parameter to all events.
* `lib/custom-tags/observable.js` - CKEditor 5 specific tag for observable properties
* `lib/observable-event-provider.js` - CKEditor 5 specific

## Usage

### JSDoc configuration

To enable above plugins you need to list them in the `plugins` array of JSDoc config file.

```json
{
    "plugins": [
        "node_modules/@ckeditor/jsdoc-plugins/lib/validator/validator",
        "node_modules/@ckeditor/jsdoc-plugins/lib/longname-fixer/longname-fixer"
    ],
    // ...
}
```

Then, having the https://github.com/jsdoc3/jsdoc installed, the only thing to do is to call the command with the `-c` flag pointing to the configuration file.

```bash
jsdoc -c path/to/config.json
```

## Types of references

The reference system is improved by the `lib/longname-fixer/longname-fixer.js` plugin.

### Overview

There're 2 types of references available inside JSDoc comments. First of them are called `Full references`. They work everywhere but the con of using them are long names. The second ones are short references that can be used to point symbols that are present in the same file.

### Full references

Full references start with `module:`. The first part of that syntax needs to match the `@module` tag in the corresponding class.

Here are a few examples:

* `@param {module:command~Command}`
* `{@link module:core/editor/editor~Editor editor}`
* `@member {module:core/editor/editor~Editor}`

### Short references

There are two types of short references available.

References starting with `#` are available for members methods and events, e.g. `{@link #create}`. These refs can be used to point members and methods inside the same class or interface.

References starting with `~` are available to point classes and interfaces, e.g. `{@link ~Editor}`. **There's a known issue with pointing things that are declared later, the full ref should be used then instead.**

```js
class Editor {
    /**
     * This property represents {@link ~Editor editor} name.
     *
     * @member {String} #name
     */

    /**
     * This property represents editor version.
     * See editor {@link #name name}.
     *
     * @member {String} #version
     */

     /**
      * Get version of the editor
      * Note - '@method getVersion' isn't needed here because the method is declared.
      */
     getVersion() {
         return this.version;
     }
}
```


## Events

Events can be assigned to the classes.

The `@fires` and `@event` tags work well with full references and with short references to the current `class` / `interface` / `mixin`.

Events can be declared in class bodies and after them (short references are available in both cases).

Full reference to the events must have the following syntax: `module:somemodule~SomeClass#event:eventName`. Note that `event:` part is required here.
Short reference can be either `event:eventName` or `eventName`.

```js
class FocusTracker {
    /**
     * @private
     * @fires blur
     */
    _blur() { }

    /**
     * @fires focus
     * @fires module:focustracker~FocusTracker#event:focus // this will link to the same event as above
     */

    /**
     * @event blur
     */
}

// Note: the following event will be bound to the `FocusTracker` class.
/**
 * @event focus
 */
```

## Validation

### Overview

The `lib/validator/validator.js` plugin is supposed to validate references and check types in JSDoc comments.

Note that the `@module` tag is required on top of each file to make the validation possible. Without that tag, the validator will complain about it with the message: `Memberof property should start with 'module:'`.

During the JSDoc compilation, the errors are thrown to the standard output for each invalid reference or type.

### Validated tags

References for the following tags are validated:

* `@link` - matches *references*
* `@member` - matches *types*
* `@fires` – matches *events*
* `@param` - matches *types*
* `@implements` – matches *interfaces*
* `@returns` - matches *types*
* `@see` - matches *references*

### Available types

There're few kind of types available with following syntax:

* Wildcard: `*`.
* Basic types: basic ES and DOM types, e.g. `String`, `Boolean`, `Error`, `Node`.
* String literal types: `'someString'`.
* Union types: `Type1|Type2`, `Type1|Type2|Type3`, etc.
* Generic types: `GenericType.<BasicType>`, `GenericType<BasicType1, BasicType2>`, etc.
* References: declared interfaces, objects, events, etc. E.g. `module:somemodule~SomeInteface`.

These types can be used together, e.g.:

```js
/**
 * @param {Map.<*>} map
 * @param {'left'|'right'} direction
 * @param {Object.<String, *>} dictionary
 * @returns {Array.<Number|module:somemodule~SomeInteface>}
 */
```

Basic types and generic types are listed in the `jsdoc/validator/types.js`.

## TODO

### Unsupported short references

For now, there are still few unsupported tags, which require full references:

* `@param`
* `@typedef`

### Missing validation

There're also tags which are not validated:

* `@mixes`
* `@augments` / `@extends`

## Inheritance of class members

This feature is implemented by the `lib/relation-fixer/index.js` plugin.

### Overview

As of version 3.4.3 JSDoc [does not support inheritance of static members](https://github.com/jsdoc3/jsdoc/issues/1229).

If class B extends class A and class A has a static property, JSDoc will not output documentation of that static property to documentation of class B.

The `lib/relation-fixer` plugin checks for such cases and updates documentation of child classes with documentation of inherited, implemented or mixed static members.

It also adds additional properties to doclets of classes, interfaces, and mixins to show related doclets. These properties are:

* `augmentsNested` - an array of references to all parent classes,
* `implementsNested` - an array of references to implemented interfaces,
* `mixesNested` - an array of references to mixed mixins,
* `descendants` - an array of references to entities which implement, mix or extend the doclet.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/jsdoc-plugins/CHANGELOG.md) file.
