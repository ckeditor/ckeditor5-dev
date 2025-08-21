/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param {string} packagePath
 * @returns {Promise}
 */
export default async function runBuildCommand( packagePath ) {
	const path = ( await import( 'upath' ) ).default;
	const { readJson } = ( await import( 'fs-extra' ) ).default;
	const { tools } = await import( '@ckeditor/ckeditor5-dev-utils' );

	const packageJson = await readJson( path.join( packagePath, 'package.json' ) );

	if ( !packageJson.scripts?.build ) {
		return;
	}

	return tools.shExec( 'pnpm run build', {
		cwd: packagePath,
		verbosity: 'error',
		async: true
	} );
}

