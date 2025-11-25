/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'util';
import inquirer from 'inquirer';
import type { ChangelogReleaseType } from '../types.js';
import semver from 'semver';

type Choices = Array<{
	name: string;
	value: ChangelogReleaseType;
}>;

/**
 * Prompts the user to choose between latest or prerelease
 */
export async function promptReleaseType( currentVersion: string ): Promise<ChangelogReleaseType> {
	const { releaseType } = await inquirer.prompt( [
		{
			type: 'list',
			name: 'releaseType',
			message: `Select the release type. Current version: ${ styleText( 'cyan', currentVersion ) }.`,
			choices: getChoices( currentVersion )
		}
	] );

	return releaseType as ChangelogReleaseType;
}

function getChoices( currentVersion: string ): Choices {
	const currentVersionPrerelease = semver.prerelease( currentVersion );

	if ( !currentVersionPrerelease ) {
		const possibleStableVersions = [
			semver.inc( currentVersion, 'major' ),
			semver.inc( currentVersion, 'minor' ),
			semver.inc( currentVersion, 'patch' )
		].join( ' | ' );

		const possiblePrereleaseVersions = [
			semver.inc( currentVersion, 'premajor', 'alpha' ),
			semver.inc( currentVersion, 'preminor', 'alpha' ),
			semver.inc( currentVersion, 'prepatch', 'alpha' )
		].join( ' | ' );

		return [
			{ name: `Latest (stable) release (${ possibleStableVersions })`, value: 'latest' },
			{ name: `Pre-release (${ possiblePrereleaseVersions })`, value: 'prerelease' }
		];
	}

	const currentPreReleaseChannel = currentVersionPrerelease[ 0 ] as string;
	const preReleaseChannels = [ 'alpha', 'beta', 'rc' ];

	while ( preReleaseChannels.includes( currentPreReleaseChannel ) ) {
		preReleaseChannels.shift();
	}

	const stableVersion = semver.inc( currentVersion, 'release' );
	const continuationVersion = semver.inc( currentVersion, 'prerelease', currentPreReleaseChannel );

	const choices: Choices = [
		{ name: `Latest (stable) release (${ stableVersion })`, value: 'latest' },
		{ name: `Pre-release continuation (${ continuationVersion })`, value: 'prerelease' }
	];

	if ( preReleaseChannels.length ) {
		const availablePromotions = preReleaseChannels
			.map( channel => semver.inc( currentVersion, 'prerelease', channel ) )
			.join( ' | ' );

		choices.push(
			{ name: `Pre-release promotion (${ availablePromotions })`, value: 'prerelease-promote' }
		);
	}

	return choices;
}
