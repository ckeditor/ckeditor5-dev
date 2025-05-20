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

		logInfo( '◌ ' + color( `Found ${ section.title }:` ), { indent: 2 } );

		if ( !( sectionName === 'invalid' ) ) {
			for ( const entry of section.entries ) {
				const scope = entry.data.scopeNormalized ? ` (${ entry.data.scopeNormalized?.join( ', ' ) })` : '';

				logInfo( `- "${ entry.data.typeNormalized }${ scope }: ${ entry.data.mainContent }"`, { indent: 4 } );

				if ( entry.data.restContent.length ) {
					entry.data.restContent.map( content => logInfo( chalk.italic( `"${ content }"` ), { indent: 6 } ) );
				}
			}
		} else {
			for ( const entry of section.entries ) {
				logInfo( `- "${ entry.data.mainContent }" (file://${ entry.changesetPath })`, { indent: 4 } );
				logInfo( color( 'VALIDATION DETAILS:' ), { indent: 6 } );
				for ( const validationMessage of entry.data.invalidDetails ?? [] ) {
					logInfo( color( `* ${ validationMessage }` ), { indent: 8 } );
				}
			}
		}

		logInfo( '' );
	}
}
