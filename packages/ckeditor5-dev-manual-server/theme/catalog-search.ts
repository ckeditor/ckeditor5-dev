/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

interface SearchableEntry {
	packageName: string;
	slug: string;
}

const PACKAGE_MATCH_PRIORITY = {
	exactName: 0,
	namePrefix: 1,
	nameContains: 2,
	testSlugOnly: 3
} as const;

type PackageMatchPriority = typeof PACKAGE_MATCH_PRIORITY[keyof typeof PACKAGE_MATCH_PRIORITY];

interface PackageSearchResult<T extends SearchableEntry> {
	visibleEntries: Array<T>;
	priority: PackageMatchPriority;
	matchingSlugCount: number;
}

export interface MatchOffset {
	start: number;
	end: number;
}

/**
 * Filters tests and orders matching packages by relevance:
 *
 * 1. Exact full or short package name, e.g. `ckeditor5-table` or `table`.
 * 2. Package name whose full or short name starts with the query.
 * 3. Package name containing the query.
 * 4. Packages with matching test slugs only.
 *
 * Packages at the same priority are ordered by the number of matching test slugs. Stable sorting
 * preserves the original package order when that number is also equal. Tests within a package
 * always retain their original order.
 *
 * A package-name match shows all tests from that package. A slug match shows only matching tests.
 */
export function filterEntries<T extends SearchableEntry>( entries: Array<T>, normalizedQuery: string ): Array<T> {
	if ( !normalizedQuery ) {
		return entries;
	}

	const packageGroups = groupEntriesByPackage( entries );
	const searchResults = [ ...packageGroups.entries() ]
		.map( ( [ packageName, packageEntries ] ) => createPackageSearchResult(
			packageName,
			packageEntries,
			normalizedQuery
		) )
		.filter( result => result.visibleEntries.length );

	searchResults.sort( comparePackageSearchResults );

	return searchResults.flatMap( result => result.visibleEntries );
}

/**
 * Groups entries by package while preserving their original order.
 */
function groupEntriesByPackage<T extends SearchableEntry>( entries: Array<T> ): Map<string, Array<T>> {
	const packageGroups = new Map<string, Array<T>>();

	for ( const entry of entries ) {
		const packageEntries = packageGroups.get( entry.packageName ) || [];

		packageEntries.push( entry );
		packageGroups.set( entry.packageName, packageEntries );
	}

	return packageGroups;
}

/**
 * Creates the visible entries and ranking metadata for one package.
 */
function createPackageSearchResult<T extends SearchableEntry>(
	packageName: string,
	packageEntries: Array<T>,
	normalizedQuery: string
): PackageSearchResult<T> {
	const priority = getPackageMatchPriority( packageName, normalizedQuery );
	const matchingSlugEntries = packageEntries.filter( entry => entry.slug.toLowerCase().includes( normalizedQuery ) );
	const packageNameMatches = priority != PACKAGE_MATCH_PRIORITY.testSlugOnly;

	return {
		visibleEntries: packageNameMatches ? packageEntries : matchingSlugEntries,
		priority,
		matchingSlugCount: matchingSlugEntries.length
	};
}

/**
 * Orders package search results by match priority and matching test count.
 */
function comparePackageSearchResults<T extends SearchableEntry>(
	first: PackageSearchResult<T>,
	second: PackageSearchResult<T>
): number {
	return first.priority - second.priority ||
		second.matchingSlugCount - first.matchingSlugCount;
}

/**
 * Returns how closely a package name matches the normalized query.
 */
function getPackageMatchPriority( packageName: string, normalizedQuery: string ): PackageMatchPriority {
	const normalizedPackageName = packageName.toLowerCase();
	const searchablePackageNames = [ normalizedPackageName, normalizedPackageName.replace( /^ckeditor5-/, '' ) ];

	if ( searchablePackageNames.includes( normalizedQuery ) ) {
		return PACKAGE_MATCH_PRIORITY.exactName;
	}

	if ( searchablePackageNames.some( name => name.startsWith( normalizedQuery ) ) ) {
		return PACKAGE_MATCH_PRIORITY.namePrefix;
	}

	if ( searchablePackageNames.some( name => name.includes( normalizedQuery ) ) ) {
		return PACKAGE_MATCH_PRIORITY.nameContains;
	}

	return PACKAGE_MATCH_PRIORITY.testSlugOnly;
}

/**
 * Returns offsets of all non-overlapping, case-insensitive query matches in text.
 */
export function findMatchOffsets( text: string, normalizedQuery: string ): Array<MatchOffset> {
	if ( !normalizedQuery ) {
		return [];
	}

	const normalizedText = text.toLowerCase();
	const matches: Array<MatchOffset> = [];
	let matchStart = normalizedText.indexOf( normalizedQuery );

	while ( matchStart != -1 ) {
		const matchEnd = matchStart + normalizedQuery.length;

		matches.push( { start: matchStart, end: matchEnd } );
		matchStart = normalizedText.indexOf( normalizedQuery, matchEnd );
	}

	return matches;
}
