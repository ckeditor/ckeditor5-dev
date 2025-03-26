/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, PackageJson, ReleaseInfo, SectionsWithEntries } from '../types.js';
import { ORGANISATION_NAMESPACE } from '../constants';

export async function getReleasedPackagesInfo( { sections, oldVersion, newVersion, packages }: {
	sections: SectionsWithEntries;
	oldVersion: string;
	newVersion: string;
	packages: Array<PackageJson>;
} ): Promise<Array<ReleaseInfo>> {
	const versionUpgradeText = `${ oldVersion } => ${ newVersion }`;
	const packageNames = packages.map( packageName => packageName.name );

	const newVersionReleases = getNewVersionReleases(packages);
	const majorReleases = getPackageNamesByEntriesScope( sections.major.entries );
	const minorReleases = getPackageNamesByEntriesScope( sections.minor.entries, { packagesToRemove: majorReleases} )
	const newFeaturesReleases = getPackageNamesByEntriesScope( sections.Feature.entries, { packagesToRemove: minorReleases } );

	const packagesToRemoveFromOtherReleases = [ majorReleases, minorReleases, newFeaturesReleases, newVersionReleases ].flat();

	const otherReleases = packageNames
		.filter( packageName => !packagesToRemoveFromOtherReleases.includes( packageName ) )
		.sort();

	return [
		{ title: 'New packages:', version: newVersion, packages: newVersionReleases },
		{ title: 'Major releases (contain major breaking changes):', version: versionUpgradeText, packages: majorReleases },
		{ title: 'Minor releases (contain minor breaking changes):', version: versionUpgradeText, packages: minorReleases },
		{ title: 'Releases containing new features:', version: versionUpgradeText, packages: newFeaturesReleases },
		{ title: 'Other releases:', version: versionUpgradeText, packages: otherReleases }
	].filter( release => release.packages?.length > 0 );
}

function getNewVersionReleases(packages: Array<PackageJson>) {
	return packages
		.filter(packageJson => packageJson.version === '0.0.1')
		.map(packageJson => packageJson.name)
		.sort();
}

function getPackageNamesByEntriesScope( entries: Array<Entry> = [], { packagesToRemove }: { packagesToRemove?: string[] } = {} ) {
	const packageNamesDeduplicated = [ ...new Set( entries.flatMap( entry => entry.data.scope ) ) ];
	const packagesFullNames = packageNamesDeduplicated.map(scope => `${ ORGANISATION_NAMESPACE }/` + scope );
	const packagesNamesFiltered = packagesToRemove ?
		packagesFullNames.filter(packageName => !packagesToRemove.includes( packageName ) ) :
		packagesFullNames;

	return packagesNamesFiltered.sort();
}
