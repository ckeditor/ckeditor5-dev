/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import type { SectionsWithEntries } from '../types.js';
import { logInfo } from './loginfo.js';

/**
 * This function provides a summary of changes that will be included in the changelog.
 */
export function logChangelogFiles( sections: SectionsWithEntries ): void {
	logInfo( `○ ${ chalk.cyan( 'Listing the changes...' ) }` );

	for ( const [ sectionName, section ] of Object.entries( sections ) ) {
		if ( !section.entries.length ) {
			continue;
		}

		const color = sectionName === 'invalid' ? chalk.red : chalk.blue;

		logInfo( '◌ ' + color( chalk.underline( `Found ${ section.title }:` ) ), { indent: 2 } );

		if ( !( sectionName === 'invalid' ) ) {
			for ( const entry of section.entries ) {
				const isEntryFullyValid = !entry.data.validations?.length;
				const scope = entry.data.scope ? ` (${ entry.data.scope?.join( ', ' ) })` : '';
				const validationIndicator = isEntryFullyValid ? chalk.green( '+' ) : '⚠️';

				logInfo(
					`- ${ validationIndicator } "${ entry.data.type }${ scope }: ${ entry.data.mainContent }"`,
					{ indent: 4 }
				);

				if ( entry.data.restContent.length ) {
					entry.data.restContent.map( content => logInfo( chalk.italic( `"${ content }"` ), { indent: 6 } ) );
				}

				if ( !isEntryFullyValid ) {
					logInfo( `- File: file://${ entry.changesetPath }`, { indent: 8 } );

					for ( const validationMessage of entry.data.validations! ) {
						logInfo( `- ${ validationMessage }`, { indent: 10 } );
					}
				}
			}
		} else {
			for ( const entry of section.entries ) {
				logInfo( `- File: file://${ entry.changesetPath }`, { indent: 4 } );

				if ( entry.data.validations?.length ) {
					logInfo( chalk.yellow( 'Validation details:' ), { indent: 6 } );

					for ( const validationMessage of entry.data.validations ) {
						logInfo( `- ${ validationMessage }`, { indent: 8 } );
					}
				}
			}
		}

		logInfo( '' );
	}

	logInfo( chalk.underline( 'Legend:' ), { indent: 2 } );
	logInfo( '' );
	logInfo( `◌ Entries marked with ${ chalk.green( '+' ) } symbol are included in the changelog.`, { indent: 2 } );
	logInfo(
		'◌ Entries marked with ' + chalk.yellow( '⚠️' ) + ' symbol includes invalid references (see or/and closes) ' +
		'or/and scope definitions. Please ensure that:',
		{ indent: 2 }
	);
	logInfo( '- Reference entries match one of the following formats:', { indent: 4 } );
	logInfo( '1. an issue number (e.g., 1000)', { indent: 6 } );
	logInfo( '2. repository-slug#id (e.g., org/repo#1000)', { indent: 6 } );
	logInfo( '3. a full issue link URL', { indent: 6 } );
	logInfo( '- A scope field consists of existing packages.', { indent: 4 } );
	logInfo( '' );
}
