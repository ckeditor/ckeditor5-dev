/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import type { ErrorStore } from './error-store.js';

/**
 * Analyzes collected errors and logs them in the console.
 */
export function logErrors( errors: ErrorStore ): void {
	if ( !errors.size ) {
		console.log( styleText( [ 'green', 'bold' ], '\n✨ No errors have been found.\n' ) );
		return;
	}

	console.log( styleText( [ 'red', 'bold' ], '\n🔥 The following errors have been found:' ) );

	errors.forEach( ( errorCollection, errorType ) => {
		const numberOfErrors = errorCollection.size;
		const separator = styleText( 'gray', ' ➜ ' );
		const errorName = styleText( [ 'bgRed', 'white', 'bold' ], ` ${ errorType.description.toUpperCase() } ` );
		const errorSummary = styleText(
			'red',
			`${ styleText( 'bold', numberOfErrors.toString() ) } ${ numberOfErrors > 1 ? 'errors' : 'error' }`
		);

		console.group( `\n${ errorName } ${ separator } ${ errorSummary }` );

		errorCollection.forEach( ( error, message ) => {
			console.group( `\n❌ ${ message }` );

			if ( error.details ) {
				console.log( error.details );
			}

			console.log( styleText( 'red', `\n…found on the following ${ error.pages.size > 1 ? 'pages' : 'page' }:` ) );

			error.pages.forEach( pageUrl => console.log( styleText( 'gray', `➥  ${ pageUrl }` ) ) );

			console.groupEnd();
		} );

		console.groupEnd();
	} );

	// Blank message only to separate the errors output log.
	console.log();
}
