# JSDoc plugins overview

## Overview

There're 2 types of references available in the plugin. External references works everywhere, but have long names, so this plugin enables references with shorter names.


## External references

External references start with `module:`.

```
class Editor {
	/**
	 * Method execute takes a command.
	 *
	 * @param {module:command~Command} command
	 */

	execute( command ) {

	}
}
```

## Internal references

Short references to methods and properties are available from JSDoc comments inside the same class or interface. These references **cannot** link to symbols inside another classes / interfaces even if they are in the same module.

Here, two types of references are available.

References starting with `#` are available for members and methods, e.g. `{@link #create}`.

References starting with `~` are available for classes and interfaces, e.g. `{@link ~Editor}`.
But you can use them as well for the methods and members, e.g. `{@link ~Editor#create}`

```
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

Full reference to the events must have following syntax: `module:somemodule~SomeClass#event:eventName`. Note that `event:` part is required here.
Short reference can be either `event:eventName` or `eventName`.

```
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

/**
 * @event focus
 */
```

## Validation

### Overview

`doclet-validator` plugin is supposed to validate references and types in JSDoc comments.

During the JSDoc compilation the errors are thrown to the standard output for each invalid reference / type.

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

```
/**
 * @param {Map<*>} map
 * @param {'left'|'right'} direction
 * @param {Object.<String, *>} dictionary
 * @returns {Array.<Number|module:somemodule~SomeInteface>}
 */
```

Basic types and generic types are listed in `jsdoc/validator/types.js`.

## TODO

### Unsupported short references

For now there're still few unsupported tags, which require full references:

* `@param`
* `@typedef`

### Missing validation

There're also tags which are not validated for now:

* `@mixes`
* `@augments` / `@extends`

## Inheritance of class members

### Overview

As of version 3.4.3 JSDoc [does not support inheritance of static members](https://github.com/jsdoc3/jsdoc/issues/1229).

If class B extends class A and class A has a static property, JSDoc will not output documentation of that static property to documentation of class B.

`relation-fixer` plugin checks for such cases and updates documentation of child classes with documentation of inherited, implemented or mixed static members.

It also adds additional properties to doclets of classes, interfaces and mixins to show related doclets. These properties are:

* `augmentsNested` - array of longnames of all parent classes,
* `implementsNested` - array of longnames of implemented interfaces,
* `mixesNested` - array of longnames of mixed mixins,
* `descendants` - array of longnames of entities which implement, mix or extend the doclet.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/jsdoc-plugins/CHANGELOG.md) file.
