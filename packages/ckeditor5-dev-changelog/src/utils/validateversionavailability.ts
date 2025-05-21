/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Validates if the provided version is available in the npm registry.
 */
export async function validateVersionAvailability( version: string, packageName: string ): Promise<string | true> {
	// Skip this validation for an 'internal' version.
	if ( version === 'internal' ) {
		return true;
	}

	const isAvailable = await npm.checkVersionAvailability( version, packageName );

	if ( !isAvailable ) {
		return 'Given version is already taken.';
	}

	return true;
}
