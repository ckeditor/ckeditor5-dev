/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { NPM_URL, SECTIONS, VERSIONING_POLICY_URL } from '../constants.js';
import type { PackageJson, ReleaseInfo, Section } from '../types.js';

type NewChangelogOptions = {
	oldVersion: string;
	newVersion: string;
	dateFormatted: string;
	gitHubUrl: string;
	sectionsToDisplay: Array<Section>;
	releasedPackagesInfo: Array<ReleaseInfo>;
	isInternal: boolean;
	packageJsons: Array<PackageJson>;
};

export function getNewChangelog( {
	oldVersion,
	newVersion,
	dateFormatted,
	gitHubUrl,
	sectionsToDisplay,
	releasedPackagesInfo,
	isInternal,
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

	return [
		header,
		'',
		isInternal ? 'Internal changes only (updated dependencies, documentation, etc.).\n' : sections,
		'### Released packages',
		'',
		`Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.`,
		'',
		'<details>',
		'<summary>Released packages (summary)</summary>',
		isInternal ? internalVersionsBumps : packagesVersionBumps,
		'</details>',
		''
	].join( '\n' );
}
