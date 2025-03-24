/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { SectionsWithEntries } from '../types.js';
import chalk from 'chalk';
import { logInfo } from './logInfo.js';

export function logChangelogFiles( sections: SectionsWithEntries ): void {
	// todo in the followup: Display invalid records differently. Add filepath, and display what is invalid:
	//  - type, scope, breaking change, closes or see.

	logInfo( `📍 ${ chalk.cyan( 'Listing the changes...' ) }\n` );

	for ( const [ sectionName, section ] of Object.entries( sections ) ) {
		if ( !section.entries ) {
			continue;
		}

		const color = sectionName === 'invalid' ? chalk.red : chalk.blue;

		logInfo( color( `🔸 Found ${ section.title }:` ), { indent: 2 } );

		for ( const entry of section.entries ) {
			logInfo( `* "${ entry.data.mainContent }"`, { indent: 4 } );

			if ( entry.data.restContent.length ) {
				entry.data.restContent.map( content => logInfo( chalk.italic( `"${ content }"` ), { indent: 6 } ) );
			}
		}

		logInfo( '' );
	}
}
