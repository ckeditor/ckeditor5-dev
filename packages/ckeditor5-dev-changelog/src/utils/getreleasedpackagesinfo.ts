/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, PackageJson, ReleaseInfo, SectionsWithEntries } from '../types.js';

export async function getReleasedPackagesInfo( { sections, oldVersion, newVersion, packages, organisationNamespace }: {
	sections: SectionsWithEntries;
	oldVersion: string;
	newVersion: string;
	packages: Array<PackageJson>;
	organisationNamespace: string;
} ): Promise<Array<ReleaseInfo>> {
	const versionUpgradeText = `${ oldVersion } => ${ newVersion }`;
	const packageNames = packages.map( packageName => packageName.name );

	const newVersionReleases = packages
		.filter( packageJson => packageJson.version === '0.0.1' )
		.map( packageJson => packageJson.name )
		.sort();

	const majorReleases = getPackageNamesByEntriesScope( sections.major.entries, organisationNamespace );

	const minorReleases = getPackageNamesByEntriesScope( sections.minor.entries, organisationNamespace )
		.filter( packageName => !majorReleases.includes( packageName ) );

	const newFeaturesReleases = getPackageNamesByEntriesScope( sections.Feature.entries, organisationNamespace )
		.filter( packageName => !minorReleases.includes( packageName ) );

	const otherReleases = packageNames
		.filter( packageName => ![ ...majorReleases, ...minorReleases, ...newFeaturesReleases ].includes( packageName ) )
		.sort();

	return [
		{ title: 'New packages:', version: newVersion, packages: newVersionReleases },
		{ title: 'Major releases (contain major breaking changes):', version: versionUpgradeText, packages: majorReleases },
		{ title: 'Minor releases (contain minor breaking changes):', version: versionUpgradeText, packages: minorReleases },
		{ title: 'Releases containing new features:', version: versionUpgradeText, packages: newFeaturesReleases },
		{ title: 'Other releases:', version: versionUpgradeText, packages: otherReleases }
	].filter( release => release.packages?.length > 0 );
}

function getPackageNamesByEntriesScope( entries: Array<Entry> = [], organisationNamespace: string ): Array<string> {
	const packageNamesDeduplicated = [ ...new Set( entries.flatMap( entry => entry.data.scope ) ) ];

	return packageNamesDeduplicated
		.map( scope => `${ organisationNamespace }/` + scope )
		.sort();
}
