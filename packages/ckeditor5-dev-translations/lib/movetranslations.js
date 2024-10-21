/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import getPackageContext from './utils/getpackagecontext.js';
import moveTranslationsBetweenPackages from './utils/movetranslationsbetweenpackages.js';

/**
 * Moves the requested translations (context and messages) between packages by performing the following steps:
 * * Detect if translations to move are not duplicated.
 * * Detect if both source and destination packages exist.
 * * Detect if translation context to move exists in the source package. Message may not exist in the target package,
 *   but if it does, it will be overwritten.
 * * If there are no validation errors, move the requested translations between packages: the context and the translation
 *   messages for each language found in the source package.
 *
 * @param {object} options
 * @param {Array.<TranslationMoveEntry>} options.config Configuration that defines the messages to move.
 */
export default function moveTranslations( options ) {
	const { config } = options;
	const log = logger();

	log.info( '📍 Loading translations contexts...' );
	const packageContexts = config.flatMap( entry => [
		getPackageContext( { packagePath: entry.source } ),
		getPackageContext( { packagePath: entry.destination } )
	] );

	const errors = [];

	log.info( '📍 Checking provided configuration...' );
	errors.push(
		...assertTranslationMoveEntriesUnique( { config } ),
		...assertPackagesExist( { config } ),
		...assertContextsExist( { packageContexts, config } )
	);

	if ( errors.length ) {
		log.error( '🔥 The following errors have been found:' );

		for ( const error of errors ) {
			log.error( `   - ${ error }` );
		}

		process.exit( 1 );
	}

	log.info( '📍 Moving translations between packages...' );
	moveTranslationsBetweenPackages( { packageContexts, config } );

	log.info( '✨ Done.' );
}

/**
 * @param {object} options
 * @param {Array.<TranslationMoveEntry>} options.config Configuration that defines the messages to move.
 * @returns {Array.<string>}
 */
function assertTranslationMoveEntriesUnique( { config } ) {
	const moveEntriesGroupedByMessageId = config.reduce( ( result, entry ) => {
		result[ entry.messageId ] = result[ entry.messageId ] || 0;
		result[ entry.messageId ]++;

		return result;
	}, {} );

	return Object.keys( moveEntriesGroupedByMessageId )
		.filter( messageId => moveEntriesGroupedByMessageId[ messageId ] > 1 )
		.map( messageId => `Duplicated entry: the "${ messageId }" message is configured to be moved multiple times.` );
}

/**
 * @param {object} options
 * @param {Array.<TranslationMoveEntry>} options.config Configuration that defines the messages to move.
 * @returns {Array.<string>}
 */
function assertPackagesExist( { config } ) {
	return config
		.flatMap( entry => {
			const missingPackages = [];

			if ( !fs.existsSync( entry.source ) ) {
				missingPackages.push( entry.source );
			}

			if ( !fs.existsSync( entry.destination ) ) {
				missingPackages.push( entry.destination );
			}

			return missingPackages;
		} )
		.map( packagePath => `Missing package: the "${ packagePath }" package does not exist.` );
}

/**
 * @param {object} options
 * @param {Array.<TranslationsContext>} options.packageContexts An array of language contexts.
 * @param {Array.<TranslationMoveEntry>} options.config Configuration that defines the messages to move.
 * @returns {Array.<string>}
 */
function assertContextsExist( { packageContexts, config } ) {
	return config
		.filter( entry => {
			const packageContext = packageContexts.find( context => context.packagePath === entry.source );

			return !packageContext.contextContent[ entry.messageId ];
		} )
		.map( entry => `Missing context: the "${ entry.messageId }" message does not exist in "${ entry.source }" package.` );
}

/**
 * @typedef {object} TranslationMoveEntry
 *
 * @property {string} source Relative path to the source package from which the `messageId` should be moved.
 * @property {string} destination Relative path to the destination package to which the `messageId` should be moved.
 * @property {string} messageId The message identifier to move.
 */
