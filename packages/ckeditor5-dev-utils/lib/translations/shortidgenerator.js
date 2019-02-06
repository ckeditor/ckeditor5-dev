/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Generates short sequential ids in [a-z] range.
 * a, b, c, ..., z, aa, ab, ...
 */
module.exports = class ShortIdGenerator {
	constructor() {
		this._idNumber = 0;
	}

	/**
	 * Generate next id from chars in [a-z] range.
	 */
	getNextId() {
		let number = this._idNumber;
		const chars = [];

		while ( true ) {
			const char = String.fromCharCode( 97 + ( number % 26 ) );

			chars.unshift( char );

			if ( number < 26 ) {
				break;
			}

			number = Math.floor( number / 26 ) - 1;
		}

		this._idNumber++;

		return chars.join( '' );
	}
};
