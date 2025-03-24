/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, PackageJson, ParsedFile, SectionsWithEntries } from '../types.js';
import { isEntryValid } from './isEntryValid.js';
import { getIssuesLinks } from './getIssuesLinks.js';
import { getScopesLinks } from './getScopesLinks.js';
import { SECTIONS } from '../constants.js';

export function getSectionsWithEntries( { entries, packages, organisationNamespace, packagePrefix, gitHubUrl }: {
	entries: Array<ParsedFile>;
	packages: Array<PackageJson>;
	organisationNamespace: string;
	packagePrefix: string;
	gitHubUrl: string;
} ): SectionsWithEntries {
	const packagesNames = packages.map( packageJson => packageJson.name );

	return entries.reduce<SectionsWithEntries>( ( acc, entry ) => {
		const breakingChange = entry.data[ 'breaking-change' ];
		const type = entry.data.type ?? 'Other';
		const section = !isEntryValid( entry, packagesNames, organisationNamespace ) ? 'invalid' : breakingChange ?? type;
		const scope = getScopesLinks( entry.data.scope, organisationNamespace, packagePrefix );
		const closes = getIssuesLinks( entry.data.closes, 'Closes', gitHubUrl );
		const see = getIssuesLinks( entry.data.see, 'See', gitHubUrl );
		const [ mainContent, ...restContent ] = entry.content.trim().split( '\n\n' );

		const changeMessage = [
			'*',
			scope ? `**${ scope }**:` : null,
			mainContent,
			see ? see : null,
			closes ? closes : null,
			restContent.length ? '\n\n  ' + restContent.join( '\n\n  ' ) : null
		].filter( Boolean ).join( ' ' );

		const newEntry: Entry = { message: changeMessage, data: { ...entry.data, mainContent, restContent } };

		acc[ section ].entries = [ ...acc[ section ].entries ?? [], newEntry ];

		return acc;
	}, structuredClone( SECTIONS ) as SectionsWithEntries );
}
