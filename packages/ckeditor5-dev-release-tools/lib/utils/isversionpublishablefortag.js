/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm } from '@ckeditor/ckeditor5-dev-utils';
import semver from 'semver';

/**
 * This util aims to verify if the given `packageName` can be published with the given `version` on the `npmTag`.
 *
 * @param {string} packageName
 * @param {string} version
 * @param {string} npmTag
 * @returns {Promise.<boolean>}
 */
export default async function isVersionPublishableForTag( packageName, version, npmTag ) {
	const npmVersion = await npm.manifest( `${ packageName }@${ npmTag }` )
		.then( ( { version } ) => version )
		// An `npmTag` does not exist, or it's the first release of a package.
		.catch( () => null );

	if ( npmVersion && semver.lte( version, npmVersion ) ) {
		return false;
	}

	return true;
}
