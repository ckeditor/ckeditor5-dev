/**
 * Doclets are atomic parts of the JSDoc output that describe each symbol of parsed input.
 *
 * @typedef {Object} Doclet
 * @property {String} longname Long name of the doclet (including the `module:` part).
 * @property {String} name Short name of the doclet (e.g. the name of the method).
 * @property {String} memberof Where the doclet belongs to (parent of the symbol).
 * @property {'class'|'interface'|'mixin'|'function'|'typedef'} kind
 * @property {String[]} [augments]
 * @property {String[]} [implements]
 * @property {String[]} [mixes]
 * @property {Boolean} [ignore]
 * @property {Boolean} [undocumented]
 * @property {String} [inheritdoc] Warning: in most cases it's an empty string!
 * @property {Boolean} [overrides]
 * @property {String[]} [descendants]
 * @property {{inherited?: Boolean, name?: String}[]} [properties]
 *
 * @property {Boolean} [inherited]
 * @property {String} [inherits] The longname of the parent's method.
 * @property {String} [comment]
 * @property {String} [description]
 * @property {Object[]} [params]
 * @property {String} [scope]
 * @property {Object} meta
 * @property {String[]} [augmentsNested]
 * @property {String[]} [mixesNested]
 * @property {String[]} [implementsNested]
 */

