/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, ReleaseInfo, SectionsWithEntries } from '../types.js';
import { deduplicate } from './deduplicate.js';

/**
 * Generates information about packages being released in the new version.
 * This function creates a summary of package versions and their changes.
 */
export async function getReleasedPackagesInfo( { sections, oldVersion, newVersion, packagesMetadata }: {
	sections: SectionsWithEntries;
	oldVersion: string;
	newVersion: string;
	packagesMetadata: Map<string, string>;
} ): Promise<Array<ReleaseInfo>> {
	const versionUpgradeText = `v${ oldVersion } => v${ newVersion }`;
	const packageNames = [ ...packagesMetadata.keys() ];

	const newVersionReleases = getNewVersionReleases( packagesMetadata );
	const majorReleases = getScopeWithOrgNamespace( sections.major.entries, { packagesToRemove: newVersionReleases, packageNames } );
	const minorReleases = getScopeWithOrgNamespace( sections.minor.entries, {
		packagesToRemove: [ ...majorReleases, ...newVersionReleases ],
		packageNames
	} );
	const newFeaturesReleases = getScopeWithOrgNamespace( sections.feature.entries, {
		packagesToRemove: [ ...minorReleases, ...majorReleases, ...newVersionReleases ],
		packageNames
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

function getNewVersionReleases( packages: Map<string, string> ) {
	return [ ...packages ]
		.filter( ( [ , version ] ) => version === '0.0.1' )
		.map( ( [ packageName ] ) => packageName )
		.sort();
}

function getScopeWithOrgNamespace( entries: Array<Entry> = [], { packagesToRemove, packageNames }: {
	packagesToRemove: Array<string>;
	packageNames: Array<string>;
} ) {
	const scope = deduplicate( entries.flatMap( entry => entry.data.scope ?? [] ).filter( Boolean ) );
	const packagesFullNames = scope.map( scope => packageNames.find( packageName => packageName.includes( scope ) )! );
	const packagesNamesFiltered = packagesFullNames.filter( packageName => !packagesToRemove.includes( packageName ) );

	return packagesNamesFiltered.sort();
}

