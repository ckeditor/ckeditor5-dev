/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Returns number of the next version.
 *
 * @param {String} currentVersion Current version in format "X.Y.Z".
 * @param {String} releaseType Type of the next release.
 * @returns {String}
 */
module.exports = function getNextVersion( currentVersion, releaseType ) {
	if ( currentVersion.startsWith( 'v' ) ) {
		currentVersion = currentVersion.slice( 1 );
	}

	const version = currentVersion.split( '.' ).map( ( n ) => parseInt( n ) );

	if ( releaseType === 'major' ) {
		return `${ version[ 0 ] + 1 }.0.0`;
	} else if ( releaseType === 'minor' ) {
		return `${ version[ 0 ] }.${ version[ 1 ] + 1 }.0`;
	}

	return `${ version[ 0 ] }.${ version[ 1 ] }.${ version[ 2 ] + 1 }`;
};
