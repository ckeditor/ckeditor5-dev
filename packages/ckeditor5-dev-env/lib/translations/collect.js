/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

const utils = require( './collect-utils' );

/**
 * Function collects translations using following steps:
 *
 * 1. Collect translation contexts from each package.
 * 2. Collect t() calls arguments with usage of acorn from each package.
 * 3. Assert whether contexts and translations are correct. If not, log the errors and break the script.
 * 4. Create po files from the translation contexts."
 */
module.exports = function collect() {
	const contexts = utils.getContexts();
	const translations = utils.collectTranslations();

	const errors = [
		...utils.getUnusedContextErrorMessages( contexts, translations ),
		...utils.getMissingContextErrorMessages( contexts, translations ),
		...utils.getRepeatedContextErrorMessages( contexts )
	];

	if ( errors.length > 0 ) {
		errors.forEach( error => logger.error( error ) );

		return;
	}

	utils.removeExistingPotFiles();

	for ( const [ packageName, context ] of contexts ) {
		const potFileHeader = utils.createPotFileHeader();
		const potFileContent = utils.createPotFileContent( context );
		utils.savePotFile( packageName, potFileHeader + potFileContent );
	}
};
