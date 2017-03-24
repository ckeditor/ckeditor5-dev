/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const nodeModulesPath = path.join( process.cwd(), 'packages' );

/**
 * Converts values of --files argument to proper globs.
 * There are 5 supported types of values now:
 *
 * 0. current package's tests (when run in context of a package – e.g. on CI) - '/'
 * 1. all packages' files – '*'
 * 2. given package files – 'engine'
 * 3. everything except the given package – '!engine'
 * 4. path – 'engine/view' -> 'ckeditor5-engine/tests/view/**\/*.js'
 * 5. simplified glob – 'engine/view/**\/*.js' -> 'ckeditor5-engine/tests/view/**\/*.js'
 *
 * @param {String} file
 * @param {Boolean} [isManualTest=false]
 * @returns {String}
 */
module.exports = function fileOptionToGlob( file, isManualTest = false ) {
	const chunks = file.split( '/' );
	const packageName = chunks.shift();
	let globSuffix = path.join( 'tests', '**' );

	if ( isManualTest ) {
		globSuffix += path.sep + path.join( 'manual', '**' );
	}

	globSuffix += path.sep + '*.js';

	// 0.
	if ( file === '/' ) {
		return path.join( process.cwd(), globSuffix );
	}

	// 1. 2. 3.
	if ( chunks.length === 0 ) {
		// 1.
		if ( packageName == '*' ) {
			return path.join( nodeModulesPath, 'ckeditor5-*', globSuffix );
		}

		// 3.
		if ( packageName.startsWith( '!' ) ) {
			return path.join( nodeModulesPath, 'ckeditor5-!(' + packageName.slice( 1 ) + ')*', globSuffix );
		}

		// 2.
		return path.join( nodeModulesPath, 'ckeditor5-' + packageName, globSuffix );
	}

	let glob = chunks.join( path.sep );

	// 4.
	if ( !glob.endsWith( '.js' ) ) {
		glob = path.join( glob, '**', '*.js' );

		// 5. for automated tests.
		if ( !isManualTest ) {
			return path.join( nodeModulesPath, 'ckeditor5-' + packageName, 'tests', glob );
		}
	}

	// 5. for manual tests. We need to insert a directory "manual" after specified directory in path.
	// 'engine/view/*.js' => 'ckeditor5-engine/tests/view/manual/*.js'
	const directoryWithManualTests = glob.split( '/' ).shift();
	glob = glob.replace( new RegExp( `^(${ directoryWithManualTests })` ), `$1${ path.sep }manual` );

	// 5.
	return path.join( nodeModulesPath, 'ckeditor5-' + packageName, 'tests', glob );
};
