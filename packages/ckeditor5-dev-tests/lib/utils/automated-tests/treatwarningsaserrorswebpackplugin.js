/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Webpack plugin that reassigns warnings as errors and stops the process if any errors or warnings detected.
 */
export default class TreatWarningsAsErrorsWebpackPlugin {
	apply( compiler ) {
		compiler.hooks.shouldEmit.tap( 'TreatWarningsAsErrorsWebpackPlugin', compilation => {
			compilation.errors = [
				...compilation.errors,
				...compilation.warnings
			];

			compilation.warnings = [];

			if ( compilation.errors.length ) {
				return false;
			}
		} );
	}
}
