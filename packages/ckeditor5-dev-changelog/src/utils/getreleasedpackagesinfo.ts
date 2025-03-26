/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { SectionsWithEntries, PackageJson, Section, Entry } from '../types.js';
import { ORGANISATION_NAMESPACE } from '../constants.js';

type ReleasedPackageInfo = {
	title: string;
	version: string;
	packages: Array<string>;
};

/**
 * Gets information about released packages based on changeset sections and package information.
 *
 * @param options - Options for getting released packages info
 * @param options.sections - Array of changeset sections
 * @param options.oldVersion - Current version
 * @param options.newVersion - New version
 * @param options.packages - Array of package.json contents
 * @returns Array of released packages information
 * @throws {Error} If the input data is invalid
 */
export async function getReleasedPackagesInfo( {
	sections,
	oldVersion,
	newVersion,
	packages
}: {
	sections: SectionsWithEntries;
	oldVersion: string;
	newVersion: string;
	packages: Array<PackageJson>;
} ): Promise<Array<{ title: string; version: string; packages: Array<string> }>> {
	const releasedPackages = getReleasedPackages( sections, packages );
	return formatReleasedPackagesInfo( releasedPackages, oldVersion, newVersion );
}

/**
 * Gets the list of packages that have been released based on changeset sections.
 *
 * @param sections - Array of changeset sections
 * @param packages - Array of package.json contents
 * @returns Array of released package names
 */
function getReleasedPackages( sections: SectionsWithEntries, packages: Array<PackageJson> ): Array<string> {
	const releasedPackageNames = new Set<string>();

	Object.values( sections ).forEach( ( section: Section ) => {
		section.entries.forEach( ( entry: Entry ) => {
			entry.data.scope.forEach( ( packageName: string ) => {
				if ( packages.some( pkg => pkg.name === packageName ) ) {
					releasedPackageNames.add( packageName );
				}
			} );
		} );
	} );

	return Array.from( releasedPackageNames );
}

/**
 * Formats the released packages information into a structured format.
 *
 * @param releasedPackages - Array of released package names
 * @param oldVersion - Current version
 * @param newVersion - New version
 * @returns Array of formatted released packages information
 */
function formatReleasedPackagesInfo(
	releasedPackages: Array<string>,
	oldVersion: string,
	newVersion: string
): Array<{ title: string; version: string; packages: Array<string> }> {
	if ( !releasedPackages.length ) {
		return [];
	}

	return [ {
		title: 'Released packages',
		version: newVersion,
		packages: releasedPackages
	} ];
}

function getNewVersionReleases( packages: Array<PackageJson> ) {
	return packages
		.filter( packageJson => packageJson.version === '0.0.1' )
		.map( packageJson => packageJson.name )
		.sort();
}

function getPackageNamesByEntriesScope( entries: Array<Entry> = [], { packagesToRemove }: { packagesToRemove?: Array<string> } = {} ) {
	const packageNamesDeduplicated = [ ...new Set( entries.flatMap( entry => entry.data.scope ) ) ];
	const packagesFullNames = packageNamesDeduplicated.map( scope => `${ ORGANISATION_NAMESPACE }/` + scope );
	const packagesNamesFiltered = packagesToRemove ?
		packagesFullNames.filter( packageName => !packagesToRemove.includes( packageName ) ) :
		packagesFullNames;

	return packagesNamesFiltered.sort();
}
