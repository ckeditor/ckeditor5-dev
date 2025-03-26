/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getPackageJson } from './getpackagejson.js';

export async function getRepositoryUrl( cwd = process.cwd() ): Promise<string> {
	const packageJson = await getPackageJson( cwd );

	// Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
	// We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
	// Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
	let repositoryUrl = ( typeof packageJson.repository === 'object' ) ? packageJson.repository.url : packageJson.repository;

	if ( !repositoryUrl ) {
		throw new Error( `The package.json for "${ packageJson.name }" must contain the "repository" property.` );
	}

	// If the value ends with ".git", we need to remove it.
	repositoryUrl = repositoryUrl.replace( /\.git$/, '' );

	// Remove "/issues" suffix as well.
	repositoryUrl = repositoryUrl.replace( /\/issues/, '' );

	return repositoryUrl;
}
