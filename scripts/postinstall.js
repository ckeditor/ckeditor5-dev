/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const path = require( 'path' );
const fs = require( 'fs' );
const { execSync } = require( 'child_process' );

const ROOT_DIRECTORY = path.join( __dirname, '..' );

// When installing a repository as a dependency, the `.git` directory does not exist.
// In such a case, husky should not attach its hooks as npm treats it as a package, not a git repository.
if ( fs.existsSync( path.join( ROOT_DIRECTORY, '.git' ) ) ) {
	require( 'husky' ).install();

	execSync( 'npm run postinstall', {
		cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-tests' ),
		stdio: 'inherit'
	} );

	execSync( 'npm run build', {
		cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-build-tools' ),
		stdio: 'inherit'
	} );
}
