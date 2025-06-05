/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, ReleaseInfo, SectionsWithEntries } from '../types.js';
// import { deduplicate } from './deduplicate.js';

type getReleasedPackagesInfoOptions = {
	sections: SectionsWithEntries;
	currentVersion: string;
	newVersion: string;
	packagesMetadata: Map<string, string>;
};

/**
 * Generates information about packages being released in the new version.
 * This function creates a summary of package versions and their changes.
 */
export async function getReleasedPackagesInfo( options: getReleasedPackagesInfoOptions ): Promise<Array<ReleaseInfo>> {
	const { sections, currentVersion, newVersion, packagesMetadata } = options;

	const versionUpgradeText = `v${ currentVersion } => v${ newVersion }`;
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
	const scope = entries.flatMap( entry => entry.data.scope ).filter( Boolean );
	const packagesFullNames = scope.map( scope => {
		return packageNames.find( packageName => getPackageName( packageName ) === scope )!;
	} );

	return packagesFullNames.filter( packageName => !packagesToRemove.includes( packageName ) );
}

function getPackageName( value: string ): string {
	if ( value.includes( '/' ) ) {
		return value.split( '/' ).at( 1 )!;
	}

	return value;
}
