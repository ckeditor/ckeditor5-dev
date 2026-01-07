/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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

	return getPackageJson( cwd, { async: true } ).then( findRepositoryUrl );
}

function findRepositoryUrl( packageJson: PackageJson ): string {
	// Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
	// We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
	// Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
	let repositoryUrl = ( typeof packageJson.repository === 'object' ) ? packageJson.repository.url : packageJson.repository;

	if ( !repositoryUrl ) {
		throw new Error( `The package.json for "${ packageJson.name }" must contain the "repository" property.` );
	}

	if ( repositoryUrl.startsWith( 'git+' ) ) {
		repositoryUrl = repositoryUrl.slice( 4 );
	}

	const match = repositoryUrl.match(
		/^(?:https?:\/\/|git@)github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s]+?)(?:\.git)?(?:[/?#].*)?$/
	);

	if ( match ) {
		const { owner, repo } = match.groups!;

		return `https://github.com/${ owner }/${ repo }`;
	}

	// Short notation: `owner/repo`.
	if ( /^[^/\s]+\/[^/\s]+$/.test( repositoryUrl ) ) {
		return `https://github.com/${ repositoryUrl }`;
	}

	throw new Error( `The repository URL "${ repositoryUrl }" is not supported.` );
}
