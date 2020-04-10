/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'glob' );
const path = require( 'path' );
const fs = require( 'fs' );

const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const utils = require( './collect-utils' );

/**
 * Collects i18n messages for all packages using source messages from `t()` calls
 * and context files and saves them as POT files in the `build/.transifex` directory.
 *
 * @param {Object} options
 * @param {String[]} [options.sourceFiles] An array of source files that contain messages to translate.
 * @param {String[]} [options.packagePaths] An array of paths to packages, which will be used to find message contexts.
 * @param {String} [options.corePackagePath] A path to the ckeditor5-core package.
 * @param {Boolean} [options.ignoreErrors]
 */
module.exports = function collect( {
	sourceFiles = getCKEditor5SourceFiles(),
	packagePaths = getCKEditor5PackagePaths(),
	corePackagePath = 'packages/ckeditor5-core',
	ignoreErrors = false
} ) {
	const contexts = utils.getContexts( packagePaths, corePackagePath );
	const sourceMessages = utils.collectSourceMessages( sourceFiles );

	const errorsMessages = [
		...utils.getUnusedContextErrorMessages( contexts, sourceMessages ),
		...utils.getMissingContextErrorMessages( contexts, sourceMessages ),
		...utils.getRepeatedContextErrorMessages( contexts )
	];

	if ( errorsMessages.length > 0 ) {
		errorsMessages.forEach( error => logger.error( error ) );

		if ( !ignoreErrors ) {
			logger.error( 'Fix the above errors or run script with the `--ignore-errors` flag.' );
			process.exit( 1 );
		}
	}

	const packageNames = packagePaths.map( p => p.replace( /.+[/\\]/, '' ) );

	utils.removeExistingPotFiles();

	for ( const packageName of packageNames ) {
		const context = contexts.get( packageName );
		const potFileHeader = utils.createPotFileHeader();
		const potFileContent = utils.createPotFileContent( packageName, sourceMessages, context );

		utils.savePotFile( packageName, potFileHeader + potFileContent );
	}
};

function getCKEditor5SourceFiles() {
	const srcPaths = [ process.cwd(), 'packages', '*', 'src', '**', '*.js' ].join( '/' );

	return glob.sync( srcPaths ).filter( srcPath => !srcPath.match( /packages\/[^/]+\/src\/lib\// ) );
}

function getCKEditor5PackagePaths() {
	const ckeditor5PackagesDir = path.join( process.cwd(), 'packages' );

	return fs.readdirSync( ckeditor5PackagesDir )
		.map( packageName => path.join( ckeditor5PackagesDir, packageName ) );
}
