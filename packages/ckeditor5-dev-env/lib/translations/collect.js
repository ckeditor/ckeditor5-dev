/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

const utils = require( './collect-utils' );
const glob = require( 'glob' );

/**
 * Collects i18n messages for all packages using source messages from `t()` calls
 * and context files and saves them as POT files in the `build/.transifex` directory.
 *
 * @param {Object} options
 * @param {String[]} [options.sourceFiles] An array of source files that contain messages to translate.
 * @param {String[]} [options.packagePaths] An array of paths to packages, which will be used to find message contexts.
 */
module.exports = function collect( {
	sourceFiles = getCKEditor5SourceFiles(),
	packagePaths = getCKEditor5PackagePaths()
} ) {
	const contexts = utils.getContexts( packagePaths );
	const sourceMessages = utils.collectSourceMessages( sourceFiles );

	const errors = [
		...utils.getUnusedContextErrorMessages( contexts, sourceMessages ),
		...utils.getMissingContextErrorMessages( contexts, sourceMessages ),
		...utils.getRepeatedContextErrorMessages( contexts )
	];

	if ( errors.length > 0 ) {
		errors.forEach( error => logger.error( error ) );

		return;
	}

	utils.removeExistingPotFiles();

	for ( const [ packageName, context ] of contexts ) {
		const potFileHeader = utils.createPotFileHeader();
		const potFileContent = utils.createPotFileContent( context, sourceMessages );

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
