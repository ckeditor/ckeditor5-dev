/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { RepositoryConfig } from '../types.js';
import { PACKAGES_DIRECTORY_NAME } from './constants';

// TODO: To move to an internal `utils.ts` file.
/**
 * Applies default values to the external repositories configuration.
 */
export function utils( externalRepositories: Array<RepositoryConfig> ): Array<Required<RepositoryConfig>> {
	return externalRepositories.map( externalRepository => ( {
		cwd: externalRepository.cwd,
		packagesDirectory: externalRepository.packagesDirectory || PACKAGES_DIRECTORY_NAME,
		shouldSkipLinks: externalRepository.shouldSkipLinks || false
	} ) );
}
