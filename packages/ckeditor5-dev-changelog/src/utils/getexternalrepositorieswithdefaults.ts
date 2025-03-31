/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { RepositoryConfig } from '../types.js';
import { PACKAGES_DIRECTORY_NAME } from '../constants.js';

/**
 * Applies default values to the external repositories configuration.
 * Ensures that each external repository has the required properties set.
 */
export function getExternalRepositoriesWithDefaults( externalRepositories: Array<RepositoryConfig> ): Array<Required<RepositoryConfig>> {
	return externalRepositories.map( repo => ( {
		...repo,
		packagesDirectory: repo.packagesDirectory || PACKAGES_DIRECTORY_NAME,
		skipLinks: repo.skipLinks || false
	} ) );
}
