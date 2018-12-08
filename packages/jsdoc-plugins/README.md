# JSDoc plugins overview

## Overview

This repository consist of few plugins that validate and simplify usage of the https://github.com/jsdoc3/jsdoc, add few custom tags and fixes support for the inheritance and other common problems.

The list of plugins goes as follows:
* lib/validator/validator - validates usage of JSDoc types
* lib/export-fixer/export-fixer - fixes an error with `export default` syntax
* lib/custom-tags/error - provides support for the custom `@error` tag
* lib/relation-fixer - fixes problem with inheritance
* lib/longname-fixer/longname-fixer - enables short notation
* lib/utils/doclet-logger - enables logging output into the `<CWD>/docs/api/output.json`

* lib/event-extender/event-extender - CKEditor 5 specific util, that inserts parameter to all events.
* lib/custom-tags/observable - CKEditor 5 specific tag for observable properties
* lib/observable-event-provider - CKEditor 5 specific

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

There're 2 types of references available inside JSDoc comments. External references work everywhere but have long names, so the `lib/longname-fixer/longname-fixer.js` plugin enables referencing using shorter names whenever it's possible.

### External references / Full references

External references start with `module:`. The first part of that syntax needs to match the `@module` tag in the corresponding class.

Here are a few examples:
* `@param {module:command~Command}`
* `{@link module:core/editor/editor~Editor editor}`
* `@member {module:core/editor/editor~Editor}`

### Internal references / Short references

Short references to methods and properties are available when pointing to the same class or interface. These references **cannot** link to symbols inside another classes or interfaces even if they are in the same module.

Here, two types of short references are available.

References starting with `#` are available for members and methods, e.g. `{@link #create}`.

References starting with `~` are available for classes and interfaces, e.g. `{@link ~Editor}` but you can use them as well for the methods and members, e.g. `{@link ~Editor#create}`.

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
      * Note - '@method getVersion' isn't needed here
      */
     getVersion() {
         return this.version;
     }
}
```


## Events

Events can be assigned to the classes.

Tags `@fires` and `@event` work well with external references to the events and with internal references to the current `class` / `interface` / `mixin`.

Events can be declared in class bodies and after them (internal references are available in both cases).

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

`doclet-validator` plugin is supposed to validate references and types in JSDoc comments.

Note that the `@module` tag is required on top of each file to make the validation possible. Without that tag, the validator will complain about it with the message: `Memberof property should start with 'module:'`.

During the JSDoc compilation, the errors are thrown to the standard output for each invalid reference or type.

### Validated tags

References for the following tags are validated:

* `@link` - matches *references*.
* `@member` - matches *types*.
* `@fires` – matches *events*.
* `@param` - matches *types*
* `@implements` – matches *interfaces*.
* `@returns` - matches *types*.
* `@see` - matches *references*.

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

There're also tags which are not validated for now:

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
