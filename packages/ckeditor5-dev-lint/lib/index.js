/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	lint( ...args ) {
		return require( './tasks/lint' )( ...args );
	},

	lintStaged( ...args ) {
		return require( './tasks/lintstaged' )( ...args );
	}
};
