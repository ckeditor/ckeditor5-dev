/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const ROOT_DIRECTORY = path.join( __dirname, '..' );

// When installing a repository as a dependency, the `.git` directory does not exist.
// In such a case, husky should not attach its hooks as npm treats it as a package, not a git repository.
if ( fs.existsSync( path.join( ROOT_DIRECTORY, '.git' ) ) ) {
	const husky = ( await import( 'husky' ) ).default;

	husky.install();

	execSync( 'npm run postinstall', {
		cwd: path.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-tests' ),
		stdio: 'inherit'
	} );

	const packageJsonPaths = await glob( 'packages/*/package.json', { cwd: ROOT_DIRECTORY, absolute: true } );
	const packagesToProcess = packageJsonPaths
		.map( async packagePath => ( {
			packagePath: path.join( packagePath, '..' ),
			packageJson: await fs.readJson( packagePath )
		} ) );

	const packagesToBuild = ( await Promise.allSettled( packagesToProcess ) )
		.filter( ( { status } ) => status === 'fulfilled' )
		.map( ( { value } ) => value )
		.filter( ( { packageJson } ) => packageJson.scripts?.build )
		.map( ( { packagePath } ) => packagePath );

	for ( const singlePackage of packagesToBuild ) {
		console.log( `Building: "${ singlePackage }"...` );
		execSync( 'npm run build', {
			cwd: singlePackage,
			stdio: 'inherit'
		} );
	}
}
