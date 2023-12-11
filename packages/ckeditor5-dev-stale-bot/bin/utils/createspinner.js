/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const ora = require( 'ora' );
const chalk = require( 'chalk' );

/**
 * Creates the spinner instance with methods to update spinner text.
 *
 * @returns {Object} data
 * @returns {ora.Ora} data.instance
 * @returns {Function} data.printStatus
 * @returns {Function} data.onProgressFactory
 */
module.exports = function createSpinner() {
	const instance = ora().start();

	const printStatus = text => {
		instance.text = text;

		if ( !instance.isSpinning ) {
			console.log( text );
		}
	};

	const onProgressFactory = () => {
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
		onProgressFactory
	};
};
