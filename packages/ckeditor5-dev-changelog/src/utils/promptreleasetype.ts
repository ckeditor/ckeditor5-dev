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
	const { isPrerelease } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'isPrerelease',
			message: 'Is it a pre-release?',
			default: false
		}
	] );

	const releaseType = isPrerelease ? 'prerelease' : 'latest';

	return releaseType as ChangelogReleaseType;
}
