/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

const ROOT_DIRECTORY = path.join( __dirname, '..' );
const ROOT_TEST_DIRECTORY = path.join( ROOT_DIRECTORY, 'tests' );

module.exports = {
	ROOT_DIRECTORY,
	ROOT_TEST_DIRECTORY
};
