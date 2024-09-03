#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { generateChangelogForMonoRepository } = require( '@ckeditor/ckeditor5-dev-release-tools' );
const parseArguments = require( './utils/parsearguments' );

const cliArguments = parseArguments( process.argv.slice( 2 ) );

const changelogOptions = {
	cwd: process.cwd(),
	packages: 'packages',
	releaseBranch: cliArguments.branch,
	transformScope: name => {
		if ( name === 'jsdoc-plugins' ) {
			return 'https://www.npmjs.com/package/@ckeditor/jsdoc-plugins';
		}

		if ( name === 'typedoc-plugins' ) {
			return 'https://www.npmjs.com/package/@ckeditor/typedoc-plugins';
		}

		return 'https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-' + name;
	}
};

if ( cliArguments.from ) {
	changelogOptions.from = cliArguments.from;
}

generateChangelogForMonoRepository( changelogOptions );
