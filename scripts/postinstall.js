/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import fs from 'fs-extra';
import { styleText } from 'util';
import { execSync } from 'child_process';
import { glob } from 'glob';

const ROOT_DIRECTORY = path.join( import.meta.dirname, '..' );

// When installing a repository as a dependency, the `.git` directory does not exist.
// In such a case, husky should not attach its hooks as npm treats it as a package, not a git repository.
if ( fs.existsSync( path.join( ROOT_DIRECTORY, '.git' ) ) ) {
	const { default: husky } = await import( 'husky' );

	husky();

	execSync( 'npm run postinstall', {
		cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-tests' ),
		stdio: 'inherit'
	} );

	const paths = ( await glob( 'packages/*/package.json', { cwd: ROOT_DIRECTORY, absolute: true } ) )
		// Force @ckeditor/ckeditor5-dev-utils to be built first because it is used by other packages.
		.sort( ( a, b ) => {
			const isADevUtils = a.includes( 'ckeditor5-dev-utils' );
			const isBDevUtils = b.includes( 'ckeditor5-dev-utils' );

			if ( isADevUtils && !isBDevUtils ) {
				return -1;
			}
			if ( !isADevUtils && isBDevUtils ) {
				return 1;
			}

			return 0;
		} );

	for ( const packagePath of paths ) {
		const packageJson = await fs.readJson( packagePath );

		if ( !packageJson.scripts?.build ) {
			continue;
		}

		console.log( styleText( 'bold', `Building: "${ packageJson.name }"...` ) );

		execSync( 'npm run build', {
			cwd: path.join( packagePath, '..' ),
			stdio: 'inherit'
		} );
	}
}
