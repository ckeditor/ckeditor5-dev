/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'tinyglobby';
import fs from 'fs-extra';
import { checkVersionMatch } from '../../packages/ckeditor5-dev-dependency-checker/lib/index.js';

const shouldFix = process.argv[ 2 ] === '--fix';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );

const PACKAGES_DIRECTORY = upath.join( ROOT_DIRECTORY, 'packages' );

const allPathsToPackageJson = await glob( PACKAGES_DIRECTORY + '/*/package.json', {
	cwd: ROOT_DIRECTORY,
	absolute: true
} );

const allPackageJson = await Promise.all(
	allPathsToPackageJson.map( pathToPackageJson => fs.readJson( pathToPackageJson ) )
);

const allPackageNames = allPackageJson.map( packageJson => packageJson.name );

checkVersionMatch( {
	cwd: ROOT_DIRECTORY,
	fix: shouldFix,
	allowRanges: true,
	workspacePackages: allPackageNames
} );
