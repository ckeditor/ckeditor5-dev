/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Builds CKEditor 5 documentation.
 *
 * @param {JSDocConfig|TypedocConfig} config
 * @returns {Promise}
 */
export default async function build( config ) {
	const type = config.type || 'jsdoc';

	if ( type === 'jsdoc' ) {
		return ( await import( './buildjsdoc.js' ) ).default( config );
	} else if ( type === 'typedoc' ) {
		return ( await import( './buildtypedoc.js' ) ).default( config );
	} else {
		throw new Error( `Unknown documentation tool (${ type }).` );
	}
}

/**
 * @typedef {Object} JSDocConfig
 *
 * @property {'jsdoc'} type
 *
 * @property {Array.<String>} sourceFiles Glob pattern with source files.
 *
 * @property {String} readmePath Path to `README.md`.
 *
 * @property {Boolean} [validateOnly=false] Whether JSDoc should only validate the documentation and finish
 * with error code `1`. If not passed, the errors will be printed to the console but the task will finish with `0`.
 *
 * @property {Boolean} [strict=false] If `true`, errors found during the validation will finish the process
 * and exit code will be changed to `1`.
 *
 * @property {String} [outputPath='docs/api/output.json'] A path to the place where extracted doclets will be saved.
 *
 * @property {String} [extraPlugins=[]] An array of path to extra plugins that will be added to JSDoc.
 */

/**
 * @typedef {Object} TypedocConfig
 *
 * @property {'typedoc'} type
 *
 * @property {Object} config
 *
 * @property {String} cwd
 *
 * @property {String} tsconfig
 *
 * @property {Array.<String>} sourceFiles Glob pattern with source files.
 *
 * @property {Boolean} [strict=false] If `true`, errors found during the validation will finish the process
 * and exit code will be changed to `1`.
 * @property {String} [outputPath] A path to the place where extracted doclets will be saved. Is an optional value due to tests.
 *
 * @property {String} [extraPlugins=[]] An array of path to extra plugins that will be added to Typedoc.
 *
 * @property {TypedocValidator} [validatorOptions={}] An optional configuration object for validator.
 */

/**
 * @typedef {Object} TypedocValidator
 *
 * @property {Boolean} [enableOverloadValidator=false] If set to `true`, the overloads validator will be enabled.
 */
