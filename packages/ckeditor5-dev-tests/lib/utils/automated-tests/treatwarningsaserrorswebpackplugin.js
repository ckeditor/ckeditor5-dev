/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

module.exports = class TreatWarningsAsErrorsWebpackPlugin {
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
};
