/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import type { ChangelogReleaseType } from '../types.js';

/**
 * Prompts the user to choose between latest or prerelease
 */
export async function promptReleaseType(): Promise<ChangelogReleaseType> {
	const { releaseType } = await inquirer.prompt( [
		{
			type: 'list',
			name: 'releaseType',
			message: 'Select the release type?',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		}
	] );

	return releaseType as ChangelogReleaseType;
}
