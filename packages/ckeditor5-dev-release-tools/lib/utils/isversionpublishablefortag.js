/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import semver from 'semver';
import shellEscape from 'shell-escape';

/**
 * This util aims to verify if the given `packageName` can be published with the given `version` on the `npmTag`.
 *
 * @param {String} packageName
 * @param {String} version
 * @param {String} npmTag
 * @return {Promise.<Boolean>}
 */
export async function isVersionPublishableForTag( packageName, version, npmTag ) {
	const command = `npm view ${ shellEscape( [ packageName ] ) }@${ shellEscape( [ npmTag ] ) } version --silent`;
	const npmVersion = await tools.shExec( command, { async: true, verbosity: 'silent' } )
		.then( value => value.trim() )
		// An `npmTag` does not exist.
		.catch( () => null );

	if ( npmVersion && semver.lte( version, npmVersion ) ) {
		return false;
	}

	return true;
}
