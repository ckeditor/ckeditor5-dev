#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelogForMonoRepository } from '@ckeditor/ckeditor5-dev-changelog';
import { parseArgs } from 'util';

const { values: options } = parseArgs( {
	options: {
		date: {
			type: 'string',
			default: undefined
		},
		'dry-run': {
			type: 'boolean',
			default: false
		}
	}
} );

const changelogOptions = {
	cwd: process.cwd(),
	packages: 'packages',
	date: options.date,
	disableFilesystemOperations: options.dryRun,
	transformScope: name => {
		const prefix = 'ckeditor5-dev-';
		const isCkeditorDev = name.startsWith( prefix );

		return {
			displayName: isCkeditorDev ? name.slice( prefix.length ) : name,
			npmUrl: 'https://www.npmjs.com/package/@ckeditor/' + name
		};
	}
};

generateChangelogForMonoRepository( changelogOptions )
	.then( maybeChangelog => {
		if ( maybeChangelog ) {
			console.log( maybeChangelog );
		}
	} );
