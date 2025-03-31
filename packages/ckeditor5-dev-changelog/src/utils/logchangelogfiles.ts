/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import type { SectionsWithEntries } from '../types.js';
import { logInfo } from './loginfo.js';

/**
 * Logs information about changelog sections and their entries to the console.
 * This function provides a summary of changes that will be included in the changelog.
 */
export function logChangelogFiles( sections: SectionsWithEntries ): void {
	// todo in the followup: Display invalid records differently. Display what is invalid:
	//  - type, scope, breaking change, closes or see.

	logInfo( `○ ${ chalk.cyan( 'Listing the changes...' ) }` );

	for ( const [ sectionName, section ] of Object.entries( sections ) ) {
		if ( !section.entries.length ) {
			continue;
		}

		const color = sectionName === 'invalid' ? chalk.red : chalk.blue;

		logInfo( '◌ ' + color( `Found ${ section.title }:` ), { indent: 2 } );

		if ( !( sectionName === 'invalid' ) ) {
			for ( const entry of section.entries ) {
				const scope = entry.data.scope ? ` (${ entry.data.scope?.join( ', ' ) })` : '';

				logInfo( `- "${ entry.data.type }${ scope }: ${ entry.data.mainContent }"`, { indent: 4 } );

				if ( entry.data.restContent.length ) {
					entry.data.restContent.map( content => logInfo( chalk.italic( `"${ content }"` ), { indent: 6 } ) );
				}
			}
		} else {
			for ( const entry of section.entries ) {
				// todo list what is invalid
				logInfo( `- "${ entry.data.mainContent }" (file://${ entry.changesetPath })`, { indent: 4 } );
			}
		}

		logInfo( '' );
	}
}
