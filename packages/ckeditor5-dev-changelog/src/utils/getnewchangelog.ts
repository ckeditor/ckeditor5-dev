/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { NPM_URL, SECTIONS, VERSIONING_POLICY_URL } from '../constants.js';
import type { ReleaseInfo, Section } from '../types.js';

type NewChangelogOptions = {
	oldVersion: string;
	newVersion: string;
	dateFormatted: string;
	gitHubUrl: string;
	sectionsToDisplay: Array<Section>;
	releasedPackagesInfo: Array<ReleaseInfo>;
	isInternal: boolean;
	singlePackage: boolean;
	packageJsons: Array<workspaces.PackageJson>;
};

export function getNewChangelog( {
	oldVersion,
	newVersion,
	dateFormatted,
	gitHubUrl,
	sectionsToDisplay,
	releasedPackagesInfo,
	isInternal,
	singlePackage,
	packageJsons
}: NewChangelogOptions ): string {
	const packagesNamesSorted = packageJsons.map( packageJson => packageJson.name ).sort();

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
		packagesNamesSorted.map( name => `* [${ name }](${ NPM_URL }/${ name }/v/${ newVersion }): v${ oldVersion } => v${ newVersion }` )
	].flat().join( '\n' );

	const changelog = [
		header,
		'',
		isInternal ? 'Internal changes only (updated dependencies, documentation, etc.).\n' : sections
	];

	if ( !singlePackage ) {
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
