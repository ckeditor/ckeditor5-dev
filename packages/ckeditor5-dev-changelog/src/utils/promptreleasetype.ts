/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { select } from '@inquirer/prompts';

export type ChangelogReleaseType = 'latest' | 'prerelease';

/**
 * Prompts the user to choose between latest or prerelease when transitioning from a prerelease version.
 */
export async function promptReleaseType(): Promise<ChangelogReleaseType> {
	const answer = await select( {
		message: 'Select the release type?',
		choices: [
			{ name: 'Latest (stable) release', value: 'latest' },
			{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
		]
	} );

	return answer as ChangelogReleaseType;
}
