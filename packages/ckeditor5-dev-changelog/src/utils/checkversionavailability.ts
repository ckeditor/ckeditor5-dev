/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Checks whether the specified version is available for the given package in the npm registry.
 *
 * Skips validation for the special 'internal' version.
 */
export async function checkVersionAvailability( version: string, packageName: string ): Promise<string | true> {
	if ( version === 'internal' ) {
		return true;
	}

	const isAvailable = await npm.checkVersionAvailability( version, packageName );

	if ( !isAvailable ) {
		return 'Given version is already taken.';
	}

	return true;
}
