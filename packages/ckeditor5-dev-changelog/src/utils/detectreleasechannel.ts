/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';
import chalk from 'chalk';
import type { ReleaseChannel } from '../types.js';
import { logInfo } from './loginfo.js';

/**
 * Detects the release channel from a version string.
 */
export function detectReleaseChannel( version: string, promotePrerelease: boolean = false ): ReleaseChannel {
	const prerelease = semver.prerelease( version );

	if ( !prerelease ) {
		return 'latest';
	}

	const currentChannel = prerelease[ 0 ] as ReleaseChannel;

	if ( promotePrerelease ) {
		if ( currentChannel === 'alpha' ) {
			return 'beta';
		}

		if ( currentChannel === 'beta' ) {
			return 'rc';
		}

		logInfo( chalk.yellow( `Warning! Unknown release channel to promote from ${ currentChannel }.` ) );

		return 'alpha';
	}

	return currentChannel;
}
