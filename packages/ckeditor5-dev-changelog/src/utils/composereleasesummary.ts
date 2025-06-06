/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, ReleaseInfo, SectionsWithEntries } from '../types.js';

type ComposeReleaseSummaryOptions = {
	sections: SectionsWithEntries;
	currentVersion: string;
	newVersion: string;
	packagesMetadata: Map<string, string>;
};

/**
 * Generates a categorized summary of packages released in the new version,
 * including new packages, major, minor, feature, and other releases.
 *
 * This function analyzes changelog sections and package metadata to:
 * * Identify new packages introduced with version '0.0.1'.
 * * Group packages by release type based on the changelog sections: major, minor, and features.
 * * Exclude packages already accounted for in higher-priority release categories from lower ones.
 * * Provide a fallback category for "other releases" that don't fall into the above groups.
 */
export async function composeReleaseSummary( options: ComposeReleaseSummaryOptions ): Promise<Array<ReleaseInfo>> {
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
	const uniqueScopes = entries
		.flatMap( entry => entry.data.scope )
		.filter( Boolean )
		.filter( ( item, index, array ) => array.indexOf( item ) === index );

	const packagesFullNames = uniqueScopes.map( scope => {
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
