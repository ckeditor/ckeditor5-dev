/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const ROOT_DIRECTORY = path.join( __dirname, '..' );

( async () => {
	// When installing a repository as a dependency, the `.git` directory does not exist.
	// In such a case, husky should not attach its hooks as npm treats it as a package, not a git repository.
	if ( fs.existsSync( path.join( ROOT_DIRECTORY, '.git' ) ) ) {
		const husky = ( await import( 'husky' ) ).default;

		husky.install();

		execSync( 'npm run postinstall', {
			cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-tests' ),
			stdio: 'inherit'
		} );

		execSync( 'npm run build', {
			cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-build-tools' ),
			stdio: 'inherit'
		} );

		execSync( 'npm run build', {
			cwd: path.join( ROOT_DIRECTORY, 'packages', 'typedoc-plugins' ),
			stdio: 'inherit'
		} );

		execSync( 'npm run build', {
			cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-web-crawler' ),
			stdio: 'inherit'
		} );
	}
} )();
