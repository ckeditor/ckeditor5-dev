/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getPackageJson, { type PackageJson } from './getpackagejson.js';

export default function getRepositoryUrl( cwd: string, options: { async: true } ): Promise<string>;
export default function getRepositoryUrl( cwd: string, options?: { async?: false } ): string;

/**
 * This function extracts the repository URL for generating links in the changelog.
 */
export default function getRepositoryUrl( cwd: string, { async = false }: { async?: boolean } = {} ): Promise<string> | string {
	if ( !async ) {
		const packageJson = getPackageJson( cwd );

		return findRepositoryUrl( packageJson );
	}

	return getPackageJson( cwd, { async: true } )
		.then( packageJson => {
			return findRepositoryUrl( packageJson );
		} );
}

function findRepositoryUrl( packageJson: PackageJson ): string {
// Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
	// We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
	// Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
	let repositoryUrl = ( typeof packageJson.repository === 'object' ) ? packageJson.repository.url : packageJson.repository;

	if ( !repositoryUrl ) {
		throw new Error( `The package.json for "${ packageJson.name }" must contain the "repository" property.` );
	}

	// If the value ends with ".git", we need to remove it.
	repositoryUrl = repositoryUrl.replace( /\.git$/, '' );

	// If the value starts with "git+", we need to remove it.
	repositoryUrl = repositoryUrl.replace( /^git\+/, '' );

	// Remove "/issues" suffix as well.
	repositoryUrl = repositoryUrl.replace( /\/issues/, '' );

	return repositoryUrl;
}
