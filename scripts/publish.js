#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

// This scripts publish changes.
//
// You can test the whole process using `dry-run` mode. It won't change anything in the project
// and any repository. Nothing will be pushed. Instead of `npm publish`, the `npm pack` command will be called.
//
// Note: This task based on versions published on NPM and GitHub. If something went wrong, you can call this script one more time.
//
// This task should be executed after: `yarn run release:bump-version`.
//
// Use:
// yarn run release:publish --dry-run

require( '../packages/ckeditor5-dev-release-tools' )
	.releaseSubRepositories( {
		cwd: process.cwd(),
		packages: 'packages',
		skipNpmPublish: [
			'ckeditor5-dev'
		],
		dryRun: process.argv.includes( '--dry-run' )
	} );
