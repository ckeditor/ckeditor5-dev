/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import type { ChangelogReleaseType } from '../types.js';
import semver from 'semver';

/**
 * Prompts the user to choose between latest or prerelease
 */
export async function promptReleaseType( currentVersion: string ): Promise<ChangelogReleaseType> {
	const { releaseType } = await inquirer.prompt( [
		{
			type: 'list',
			name: 'releaseType',
			message: 'Please select the release type.',
			choices: getQuestions( currentVersion )
		}
	] );

	return releaseType as ChangelogReleaseType;
}

function getQuestions( currentVersion: string ): Array<{ name: string; value: ChangelogReleaseType }> {
	const currentVersionPrerelease = semver.prerelease( currentVersion );

	if ( !currentVersionPrerelease ) {
		return [
			{ name: 'Latest (stable) release (e.g. 1.0.0 -> 2.0.0)', value: 'latest' },
			{ name: 'Pre-release (e.g. 1.0.0 -> 2.0.0-alpha.0)', value: 'prerelease' }
		];
	}

	if ( currentVersionPrerelease[ 0 ] === 'rc' ) {
		return [
			{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
			{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' }
		];
	}

	return [
		{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
		{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' },
		{ name: 'Pre-release promotion (e.g. 1.0.0-alpha.1 -> 1.0.0-beta.0)', value: 'prerelease-promote' }
	];
}
