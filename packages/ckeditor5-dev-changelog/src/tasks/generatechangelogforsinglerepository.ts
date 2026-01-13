/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelog } from '../utils/generatechangelog.js';
import type { ConfigBase, GenerateChangelogEntryPoint } from '../types.js';

type SingleRepositoryConfig = Omit<ConfigBase, 'packagesDirectory'>;

export const generateChangelogForSingleRepository: GenerateChangelogEntryPoint<SingleRepositoryConfig> = async options => {
	const {
		cwd,
		date,
		externalRepositories,
		nextVersion,
		disableFilesystemOperations,
		linkFilter,
		shouldSkipLinks
	} = options;

	return generateChangelog( {
		nextVersion,
		cwd,
		externalRepositories,
		date,
		linkFilter,
		shouldSkipLinks,
		disableFilesystemOperations,
		isSinglePackage: true,
		packagesDirectory: null
	} );
};
