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
export function getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, organisationNamespace }: {
	parsedFiles: Array<ParsedFile>;
	packageJsons: Array<PackageJson>;
	transformScope: TransformScope;
	organisationNamespace: string;
} ): SectionsWithEntries {
	const packagesNames = packageJsons.map( packageJson => packageJson.name );

	return parsedFiles.reduce<SectionsWithEntries>( ( sections, entry ) => {
		const breakingChange = entry.data[ 'breaking-change' ];
		const type = typeToSection( entry.data.type );
		const scope = getScopesLinks( entry.data.scope, transformScope );
		const closes = getIssuesLinks( entry.data.closes, 'Closes', entry.gitHubUrl );
		const see = getIssuesLinks( entry.data.see, 'See', entry.gitHubUrl );
		const isValid = isEntryValid( { entry, packagesNames, organisationNamespace, closes, see } );
		const section = !isValid ? 'invalid' : ( breakingChange ?? type );
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

function isEntryValid( { entry, packagesNames, organisationNamespace, closes, see }: {
	entry: ParsedFile;
	packagesNames: Array<string>;
	organisationNamespace: string;
	closes: string | null;
	see: string | null;
} ): boolean {
	const packagesNamesNoNamespace = packagesNames.map( packageName => packageName.replace( `${ organisationNamespace }/`, '' ) );
	const expectedTypes: Array<unknown> = [ 'Feature', 'Fix', 'Other' ];

	if ( closes === 'invalid' ) {
		return false;
	}

	if ( see === 'invalid' ) {
		return false;
	}

	if ( !expectedTypes.includes( entry.data.type ) ) {
		return false;
	}

	if ( entry.data.scope && !entry.data.scope.every( scope => packagesNamesNoNamespace.includes( scope ) ) ) {
		return false;
	}

	return true;
}

function typeToSection( type: string | undefined ): SectionName {
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
