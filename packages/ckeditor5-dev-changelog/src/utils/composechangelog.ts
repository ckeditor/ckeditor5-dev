/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { NPM_URL, SECTIONS, VERSIONING_POLICY_URL } from './constants.js';
import type { ReleaseInfo, Section } from '../types.js';
import { getDateFormatted } from './getdateformatted.js';

type ComposeChangelogOptions = {
	cwd: string;
	date: string;
	currentVersion: string;
	newVersion: string;
	sections: Array<Section>;
	releasedPackagesInfo: Array<ReleaseInfo>;
	isInternal: boolean;
	isSinglePackage: boolean;
	packagesMetadata: Map<string, string>;
};

/**
 * Generates a formatted changelog string for a new version release.
 *
 * This function constructs the changelog content including
 * * A version header with a link to the GitHub comparison view (except for an initial version).
 * * Sections with grouped changelog entries and their messages.
 * * A collapsible summary of released packages and their version bumps for a mono-repository setup.
 * * Special handling for internal-only releases and single-package repositories.
 */
export async function composeChangelog( options: ComposeChangelogOptions ): Promise<string> {
	const {
		cwd,
		date,
		currentVersion,
		newVersion,
		sections,
		releasedPackagesInfo,
		isInternal,
		isSinglePackage,
		packagesMetadata
	} = options;

	const gitHubUrl = await workspaces.getRepositoryUrl( cwd, { async: true } );
	const dateFormatted = getDateFormatted( date );
	const packagesNames = [ ...packagesMetadata.keys() ];

	const header = currentVersion === '0.0.1' ?
		`## ${ newVersion } (${ dateFormatted })` :
		`## [${ newVersion }](${ gitHubUrl }/compare/v${ currentVersion }...v${ newVersion }) (${ dateFormatted })`;

	const sectionsAsString = sections.map( ( { title, entries } ) => ( [
		`### ${ title }`,
		'',
		...entries.map( entry => entry.message ),
		''
	] ) ).flat().join( '\n' );

	const packagesVersionBumps = releasedPackagesInfo.map( ( { title, version, packages } ) => ( [
		'',
		title,
		'',
		...packages.map( packageName => `* [${ packageName }](${ NPM_URL }/${ packageName }/v/${ newVersion }): ${ version }` )
	] ) ).flat().join( '\n' );

	const internalVersionsBumps = [
		'',
		SECTIONS.other.title + ':',
		'',
		packagesNames.map( name => `* [${ name }](${ NPM_URL }/${ name }/v/${ newVersion }): v${ currentVersion } => v${ newVersion }` )
	].flat().join( '\n' );

	const changelog = [
		header,
		'',
		isInternal ? 'Internal changes only (updated dependencies, documentation, etc.).\n' : sectionsAsString
	];

	if ( !isSinglePackage ) {
		changelog.push(
			'### Released packages',
			'',
			`Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.`,
			'',
			'<details>',
			'<summary>Released packages (summary)</summary>',
			isInternal ? internalVersionsBumps : packagesVersionBumps,
			'</details>',
			''
		);
	}

	return changelog.join( '\n' );
}
