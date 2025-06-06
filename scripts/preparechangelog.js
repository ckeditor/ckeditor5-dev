#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'util';
import { generateChangelogForMonoRepository } from '@ckeditor/ckeditor5-dev-changelog';
import { CKEDITOR5_DEV_ROOT, PACKAGES_DIRECTORY } from './utils/constants.js';

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
	cwd: CKEDITOR5_DEV_ROOT,
	packagesDirectory: PACKAGES_DIRECTORY,
	disableFilesystemOperations: options[ 'dry-run' ],
	shouldIgnoreRootPackage: true,
	npmPackageToCheck: '@ckeditor/ckeditor5-dev-release-tools',
	transformScope: name => {
		const prefix = 'ckeditor5-dev-';
		const isCkeditorDev = name.startsWith( prefix );

		return {
			displayName: isCkeditorDev ? name.slice( prefix.length ) : name,
			npmUrl: 'https://www.npmjs.com/package/@ckeditor/' + name
		};
	}
};

if ( options.date ) {
	changelogOptions.date = options.date;
}

generateChangelogForMonoRepository( changelogOptions )
	.then( maybeChangelog => {
		if ( maybeChangelog ) {
			console.log( maybeChangelog );
		}
	} );
