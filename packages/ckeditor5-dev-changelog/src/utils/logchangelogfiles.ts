/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import { type Entry, type Section, type SectionName, type SectionsWithEntries } from '../types.js';
import { logInfo } from './loginfo.js';

/**
 * This function provides a summary of changes that will be included in the changelog.
 */
export function logChangelogFiles( sections: SectionsWithEntries ): void {
	logInfo( `○ ${ chalk.cyan( 'Listing the changes...' ) }` );

	const nonEmptySections = ( Object.entries( sections ) as Array<[ SectionName, Section ]> )
		.filter( ( [ , section ] ) => section.entries.length );

	for ( const [ sectionName, section ] of nonEmptySections ) {
		const color = getTitleColor( sectionName );

		logInfo( '◌ ' + color( chalk.underline( `${ section.titleInLogs || section.title }:` ) ), { indent: 1 } );

		const displayCallback = sectionName === 'invalid' || sectionName === 'warning' ?
			displayWarningEntry :
			displayValidEntry;

		section.entries.forEach( entries => displayCallback( entries, sectionName ) );

		logInfo( '' );
	}

	logInfo( '◌ ' + chalk.underline( 'Legend:' ), { indent: 1 } );
	logInfo( `- Entries marked with ${ chalk.green( '+' ) } symbol are included in the changelog.`, { indent: 2 } );
	logInfo(
		'- Entries marked with ' + chalk.yellow( 'x' ) + ' symbol includes invalid references (see or/and closes) ' +
		'or/and scope definitions. Please ensure that:',
		{ indent: 2 }
	);
	logInfo( '* Reference entries match one of the following formats:', { indent: 3 } );
	logInfo( '1. An issue number (e.g., 1000)', { indent: 4 } );
	logInfo( '2. Repository-slug#id (e.g., org/repo#1000)', { indent: 4 } );
	logInfo( '3. A full issue link URL', { indent: 4 } );
	logInfo( '* A scope field consists of existing packages.', { indent: 3 } );
	logInfo( '' );
	logInfo( `Found ${ nonEmptySections.length } entries to parse.`, { indent: 1 } );
	logInfo( '' );
}

function getTitleColor( sectionName: SectionName ) {
	if ( sectionName === 'warning' ) {
		return chalk.yellow;
	}
	if ( sectionName === 'invalid' ) {
		return chalk.red;
	}

	let defaultColor: ( value: string ) => string = chalk.blue;

	if ( sectionName === 'major' || sectionName === 'minor' || sectionName === 'breaking' ) {
		// To avoid tricks in tests, let's simplify the implementation.
		defaultColor = ( value: string ) => {
			return chalk.bold( chalk.blue( value ) );
		};
	}

	return defaultColor;
}

function displayWarningEntry( entry: Entry ): void {
	logInfo( `- file://${ entry.changesetPath }`, { indent: 2 } );

	for ( const validationMessage of ( entry.data.validations || [] ) ) {
		logInfo( `- ${ validationMessage }`, { indent: 3 } );
	}
}

function displayValidEntry( entry: Entry, sectionName: SectionName ): void {
	const isEntryFullyValid = !entry.data.validations?.length;
	const greyBright = chalk.hex( '#9b9b9b' );
	const scope = entry.data.scope?.length ? greyBright( `(${ entry.data.scope?.join( ', ' ) })` ) : `${ greyBright( '(no scope)' ) }`;
	const validationIndicator = isEntryFullyValid ? chalk.green( '+' ) : chalk.yellow( 'x' );
	const shouldTrimMessage = String( entry.data.mainContent ).length > 100;
	const trimmedMessageContent = shouldTrimMessage ? entry.data.mainContent?.slice( 0, 100 ) + '...' : entry.data.mainContent;
	const isBreakingChange = sectionName === 'breaking' || sectionName === 'major' || sectionName === 'minor';

	logInfo( `${ validationIndicator } ${ scope }: ${ trimmedMessageContent }`, { indent: 2 } );

	if ( !isBreakingChange ) {
		return;
	}

	if ( entry.data.seeLinks?.length ) {
		logInfo( `- See: ${ entry.data.seeLinks.map( seeObj => seeObj.link ).join( ', ' ) }`, { indent: 3 } );
	}

	if ( entry.data.closesLinks?.length ) {
		logInfo( `- Closes: ${ entry.data.closesLinks.map( closesObj => closesObj.link ).join( ', ' ) }`, { indent: 3 } );
	}
}
