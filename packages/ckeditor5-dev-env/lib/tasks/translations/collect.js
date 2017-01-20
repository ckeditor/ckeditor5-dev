/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

const utils = require( './collect-utils' );

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

	for ( const [ packageName, context ] of contexts ) {
		const potFileHeader = utils.createPotFileHeader();
		const potFileContent = utils.createPotFileContent( context );
		utils.savePotFile( packageName, potFileHeader + potFileContent );
	}
};
