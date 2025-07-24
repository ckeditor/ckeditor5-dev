/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';
import { InternalError } from './internalerror.js';

export function validateNextVersion( currentVersion: string, nextVersion: string | undefined ): void {
	const [ currentPrerelease ] = semver.prerelease( currentVersion ) || [ 'latest' ];

	if ( nextVersion === '' ) {
		throw new InternalError( 'Next version cannot be an empty string.' );
	}

	if ( nextVersion === 'internal' && currentPrerelease !== 'latest' ) {
		throw new InternalError(
			`Internal release may only be performed on latest release, and current version is a pre-release: ${ currentVersion }.`
		);
	}
}
