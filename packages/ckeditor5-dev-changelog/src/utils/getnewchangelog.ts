/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { NPM_URL, SECTIONS, VERSIONING_POLICY_URL } from './constants.js';
import type { ReleaseInfo, Section } from '../types.js';
import { getDateFormatted } from './getdateformatted.js';

type NewChangelogOptions = {
	cwd: string;
	date: string;
	oldVersion: string;
	newVersion: string;
	sectionsToDisplay: Array<Section>;
	releasedPackagesInfo: Array<ReleaseInfo>;
	isInternal: boolean;
	isSinglePackage: boolean;
	packagesMetadata: Map<string, string>;
};

export async function getNewChangelog( {
	cwd,
	date,
	oldVersion,
	newVersion,
	sectionsToDisplay,
	releasedPackagesInfo,
	isInternal,
	isSinglePackage,
	packagesMetadata
}: NewChangelogOptions ): Promise<string> {
	const gitHubUrl = await workspaces.getRepositoryUrl( cwd, { async: true } );
	const dateFormatted = getDateFormatted( date );
	const packagesNames = [ ...packagesMetadata.keys() ];

	const header = oldVersion === '0.0.1' ?
		`## ${ newVersion } (${ dateFormatted })` :
		`## [${ newVersion }](${ gitHubUrl }/compare/v${ oldVersion }...v${ newVersion }) (${ dateFormatted })`;

	const sections = sectionsToDisplay.map( ( { title, entries } ) => ( [
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
		packagesNames.map( name => `* [${ name }](${ NPM_URL }/${ name }/v/${ newVersion }): v${ oldVersion } => v${ newVersion }` )
	].flat().join( '\n' );

	const changelog = [
		header,
		'',
		isInternal ? 'Internal changes only (updated dependencies, documentation, etc.).\n' : sections
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
