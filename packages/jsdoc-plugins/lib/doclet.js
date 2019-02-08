/**
 * Doclets are atomic parts of the JSDoc output that describe each symbol of parsed input.
 *
 * @typedef {Object} Doclet
 * @property {String} longname Long name of the doclet (including the `module:` part).
 * @property {String} name Short name of the doclet (e.g. the name of the method).
 * @property {String} memberof Where the doclet belongs to (parent of the symbol).
 * @property {'class'|'interface'|'mixin'|'function'|'typedef'|'event'|'member'|'constant'|'module'} kind The kind of the doclet's symbol.
 * @property {Boolean} [ignore] `true` for internal doclets which should not be published
 * @property {Boolean} [undocumented] `true` when a doclet's symbol does not have API docs written above the declaration.
 * @property {String} [inheritdoc] Warning: When the `@inheritdoc` is present, then in most cases the property
 * becomes  an empty string!
 * @property {Boolean} [overrides]
 * @property {String[]} [descendants]
 * @property {{inherited?: Boolean, name?: String}[]} [properties]
 * @property {Boolean} [inherited]
 * @property {String} [inherits] The longname of the parent's method.
 * @property {String} [comment]
 * @property {String} [description]
 * @property {Object[]} [params]
 * @property {String} [scope]
 * @property {String[]} [fires] An array of events that a method or a property can fire.
 * @property {Object} meta Doclet's metadata - filename, line number, etc.
 * @property {String[]} [augments] An array of classes that the doclet's symbol extends.
 * Applies for `@class`, `@mixin`, `@interface`.
 * @property {String[]} [mixes] An array of mixins that the doclet's symbol mixes.
 * Applies for `@class` and `@mixin`.
 * @property {String[]} [implements] An array of interfaces that the doclet's symbol implements.
 * Applies for `@class` and `@mixin`.
 * @property {String[]} [augmentsNested] [A custom property used by the relation fixer] -
 * an array of all classes in the inheritance chain augmenting the current doclet's symbol.
 * @property {String[]} [mixesNested] [A custom property used by the relation fixer] -
 * an array of all mixins in the inheritance chain augmenting the current doclet's symbol.
 * @property {String[]} [implementsNested] [A custom  property used by the relation fixer] -
 * an array of all interfaces in the inheritance chain, which the current doclet's symbol implements.
 */

