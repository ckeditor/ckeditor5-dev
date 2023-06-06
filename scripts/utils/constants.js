/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const upath = require( 'upath' );

module.exports = {
	PACKAGES_DIRECTORY: 'packages',
	RELEASE_DIRECTORY: 'release',
	CKEDITOR5_DEV_ROOT: upath.join( __dirname, '..', '..' )
};
