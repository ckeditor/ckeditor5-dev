/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const semver = require( 'semver' );

/**
 * This util aims to verify if the given `packageName` can be published with the given `version` on the `npmTag`.
 *
 * @param {String} packageName
 * @param {String} version
 * @param {String} npmTag
 * @return {Promise.<Boolean>}
 */
module.exports = async function isVersionPublishable( packageName, version, npmTag ) {
	const npmVersion = await tools.shExec( `npm view ${ packageName }@${ npmTag } version --silent`, { async: true, verbosity: 'silent' } )
		.then( value => value.trim() )
		// An `npmTag` does not exist.
		.catch( () => null );

	if ( npmVersion && semver.lte( version, npmVersion ) ) {
		return false;
	}

	return true;
};
