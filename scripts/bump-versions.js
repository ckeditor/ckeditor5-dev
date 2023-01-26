#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

// This scripts preparing all packages to release:
//   - checking what should be released,
//   - updates version of all dependencies for all packages,
//   - validates the whole process (whether the changes could be published),
//   - tagging new versions.
//
// You can test the whole process using `dry-run` mode. It won't change anything in the project
// and any repository.
//
// This task must be called before: `yarn run release:publish`.
//
// Use:
// yarn run release:bump-version --dry-run

require( '../packages/ckeditor5-dev-release-tools' )
	.bumpVersions( {
		cwd: process.cwd(),
		packages: 'packages',
		dryRun: process.argv.includes( '--dry-run' )
	} );
