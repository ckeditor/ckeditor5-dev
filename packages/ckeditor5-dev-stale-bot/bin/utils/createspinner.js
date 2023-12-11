/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const ora = require( 'ora' );
const chalk = require( 'chalk' );

/**
 * Creates the spinner instance with methods to update spinner text.
 *
 * @returns {Spinner}
 */
module.exports = function createSpinner() {
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
			const text = `${ title } ${ chalk.bold( `${ progress }%` ) }`;

			printStatus( text );
		};
	};

	return {
		instance,
		printStatus,
		onProgress
	};
};

/**
 * @typedef {Object} Spinner
 * @property {ora.Ora} instance
 * @property {Function} printStatus
 * @property {Function} onProgress
 */
