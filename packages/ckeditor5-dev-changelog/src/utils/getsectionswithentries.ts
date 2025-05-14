/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type {
	Entry,
	PackageJson,
	ParsedFile,
	SectionName,
	SectionsWithEntries,
	TransformScope
} from '../types.js';
import { SECTIONS } from '../constants.js';
import { linkToGitHubUser } from '../utils/external/linktogithubuser.js';

type DifferentRepoIssue = { owner: string; repository: string; number: string };
const differentRepoIssuePattern = /^(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)#(?<number>\d+)$/;
const sameRepoIssuePattern = /^\d+$/;

/**
 * This function categorizes changelog entries based on their types and packages.
 */
export function getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, organisationNamespace, singlePackage }: {
	parsedFiles: Array<ParsedFile>;
	packageJsons: Array<PackageJson>;
	transformScope: TransformScope;
	organisationNamespace: string;
	singlePackage: boolean;
} ): SectionsWithEntries {
	const packagesNames = packageJsons.map( packageJson => packageJson.name );

	return parsedFiles.reduce<SectionsWithEntries>( ( sections, entry ) => {
		const scope = getScopesLinks( entry.data.scope, transformScope );
		const closes = getIssuesLinks( entry.data.closes, 'Closes', entry.gitHubUrl );
		const see = getIssuesLinks( entry.data.see, 'See', entry.gitHubUrl );
		const section = getSection( { entry, packagesNames, organisationNamespace, singlePackage, closes, see } );
		const [ mainContent, ...restContent ] = linkToGitHubUser( entry.content ).trim().split( '\n\n' );

		const messageFirstLine = [
			'*',
			scope ? `**${ scope }**:` : null,
			mainContent,
			!entry.skipLinks && see ? see : null,
			!entry.skipLinks && closes ? closes : null
		].filter( Boolean ).join( ' ' );

		const changeMessage = restContent.length ? messageFirstLine + '\n\n  ' + restContent.join( '\n\n  ' ) : messageFirstLine;

		const newEntry: Entry = {
			message: changeMessage,
			data: { ...entry.data, mainContent, restContent },
			changesetPath: entry.changesetPath
		};

		sections[ section ].entries = [ ...sections[ section ].entries, newEntry ];

		return sections;
	}, getInitialSectionsWithEntries() );
}

function getScopesLinks( scope: Array<string> | undefined, transformScope: TransformScope ): string | null {
	if ( !scope ) {
		return null;
	}

	return scope
		.map( scope => transformScope( scope ) )
		.map( ( { displayName, npmUrl } ) => `[${ displayName }](${ npmUrl })` )
		.join( ', ' );
}

function getIssuesLinks( issues: Array<string> | undefined, prefix: string, gitHubUrl: string ): string | null {
	if ( !issues ) {
		return null;
	}

	const links = issues.map( String ).map( issue => {
		if ( issue.match( sameRepoIssuePattern ) ) {
			return `[#${ issues }](${ gitHubUrl }/issues/${ issues })`;
		}

		const differentRepoMatch = issue.match( differentRepoIssuePattern );

		if ( differentRepoMatch ) {
			const { owner, repository, number } = differentRepoMatch.groups as DifferentRepoIssue;

			return `[${ issue }](https://github.com/${ owner }/${ repository }/issues/${ number })`;
		}

		return null;
	} );

	if ( links.includes( null ) ) {
		return 'invalid';
	}

	return `${ prefix } ${ links.join( ', ' ) }.`;
}

function getSection( {
	entry,
	packagesNames,
	organisationNamespace,
	singlePackage,
	closes,
	see
}: {
	entry: ParsedFile;
	packagesNames: Array<string>;
	organisationNamespace: string;
	singlePackage: boolean;
	closes: string | null;
	see: string | null;
} ): SectionName {
	const packagesNamesNoNamespace = packagesNames.map( packageName => packageName.replace( `${ organisationNamespace }/`, '' ) );
	const breakingChange = entry.data[ 'breaking-change' ];
	const type = entry.data.type;

	if ( closes === 'invalid' ) {
		return 'invalid';
	}

	if ( see === 'invalid' ) {
		return 'invalid';
	}

	if ( entry.data.scope && !entry.data.scope.every( scope => packagesNamesNoNamespace.includes( scope ) ) ) {
		return 'invalid';
	}

	// If someone tries to use generic breaking change instead of minor/major in monorepo, the entry is invalid.
	if ( !singlePackage && breakingChange === true ) {
		return 'invalid';
	}

	// If someone tries to use minor/major breaking change in a single package, we simply cast it to a generic breaking change.
	if ( singlePackage && typeof breakingChange === 'string' ) {
		return 'breaking';
	}

	if ( typeof breakingChange === 'string' ) {
		return breakingChange;
	}

	if ( breakingChange === true ) {
		return 'breaking';
	}

	if ( type === 'Feature' ) {
		return 'feature';
	}

	if ( type === 'Fix' ) {
		return 'fix';
	}

	if ( type === 'Other' ) {
		return 'other';
	}

	return 'invalid';
}

function getInitialSectionsWithEntries(): SectionsWithEntries {
	const sections = structuredClone( SECTIONS ) as SectionsWithEntries;

	for ( const key in sections ) {
		sections[ key as SectionName ].entries = [];
	}

	return sections;
}
