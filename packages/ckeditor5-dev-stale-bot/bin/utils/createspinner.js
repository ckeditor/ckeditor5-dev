/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import ora from 'ora';

/**
 * Creates the spinner instance with methods to update spinner text.
 *
 * @returns {Spinner}
 */
export default function createSpinner() {
	const instance = ora();

	const printStatus = text => {
		instance.text = text;

		if ( !instance.isSpinning ) {
			console.log( text );
		}
	};

	const onProgress = () => {
		const title = instance.text;

		return ( { done, total } ) => {
			const progress = total ? Math.round( ( done / total ) * 100 ) : 0;
			const text = `${ title } ${ styleText( 'bold', `${ progress }%` ) }`;

			printStatus( text );
		};
	};

	return {
		instance,
		printStatus,
		onProgress
	};
}

/**
 * @typedef {object} Spinner
 * @property {ora.Ora} instance
 * @property {Function} printStatus
 * @property {Function} onProgress
 */
