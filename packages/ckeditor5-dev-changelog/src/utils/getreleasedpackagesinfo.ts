/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import type { Entry, ReleaseInfo, SectionsWithEntries } from '../types.js';

/**
 * Generates information about packages being released in the new version.
 * This function creates a summary of package versions and their changes.
 */
export async function getReleasedPackagesInfo( { sections, oldVersion, newVersion, packageJsons, organisationNamespace }: {
	sections: SectionsWithEntries;
	oldVersion: string;
	newVersion: string;
	packageJsons: Array<workspaces.PackageJson>;
	organisationNamespace: string;
} ): Promise<Array<ReleaseInfo>> {
	const versionUpgradeText = `v${ oldVersion } => v${ newVersion }`;
	const packageNames = packageJsons.map( packageName => packageName.name );

	const newVersionReleases = getNewVersionReleases( packageJsons );
	const majorReleases = getPackageNamesByScope( sections.major.entries, { packagesToRemove: newVersionReleases, organisationNamespace } );
	const minorReleases = getPackageNamesByScope( sections.minor.entries, {
		packagesToRemove: [ ...majorReleases, ...newVersionReleases ], organisationNamespace }
	);
	const newFeaturesReleases = getPackageNamesByScope( sections.feature.entries, {
		packagesToRemove: [ ...minorReleases, ...majorReleases, ...newVersionReleases ],
		organisationNamespace
	} );

	const packagesToRemoveFromOtherReleases = [ majorReleases, minorReleases, newFeaturesReleases, newVersionReleases ].flat();

	const otherReleases = packageNames
		.filter( packageName => !packagesToRemoveFromOtherReleases.includes( packageName ) )
		.sort();

	return [
		{ title: 'New packages:', version: `v${ newVersion }`, packages: newVersionReleases },
		{ title: 'Major releases (contain major breaking changes):', version: versionUpgradeText, packages: majorReleases },
		{ title: 'Minor releases (contain minor breaking changes):', version: versionUpgradeText, packages: minorReleases },
		{ title: 'Releases containing new features:', version: versionUpgradeText, packages: newFeaturesReleases },
		{ title: 'Other releases:', version: versionUpgradeText, packages: otherReleases }
	].filter( release => release.packages?.length > 0 );
}

function getNewVersionReleases( packages: Array<workspaces.PackageJson> ) {
	return packages
		.filter( packageJson => packageJson.version === '0.0.1' )
		.map( packageJson => packageJson.name )
		.sort();
}

function getPackageNamesByScope( entries: Array<Entry> = [], { packagesToRemove, organisationNamespace }: {
	packagesToRemove: Array<string>;
	organisationNamespace: string;
} ) {
	const packageNames = entries.flatMap( entry => entry.data.scope ).filter( Boolean );
	const packageNamesDeduplicated = [ ...new Set( packageNames ) ];
	const packagesFullNames = packageNamesDeduplicated.map( scope => `${ organisationNamespace }/` + scope );
	const packagesNamesFiltered = packagesFullNames.filter( packageName => !packagesToRemove.includes( packageName ) );

	return packagesNamesFiltered.sort();
}
