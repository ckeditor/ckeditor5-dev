/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

module.exports = config => {
	config.reporters.splice( config.reporters.indexOf( 'coverage' ), 1 );
};
