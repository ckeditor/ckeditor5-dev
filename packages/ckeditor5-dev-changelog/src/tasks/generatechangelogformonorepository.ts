/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelog } from '../utils/generatechangelog.js';
import type { ConfigBase, GenerateChangelogEntryPoint, MonoRepoConfigBase } from '../types.js';

type MonoRepositoryConfig = ConfigBase & MonoRepoConfigBase & {
	packagesDirectory: ConfigBase[ 'packagesDirectory' ];
	transformScope: MonoRepoConfigBase[ 'transformScope' ];
};

export const generateChangelogForMonoRepository: GenerateChangelogEntryPoint<MonoRepositoryConfig> = async options => {
	const {
		date,
		cwd,
		externalRepositories,
		nextVersion,
		disableFilesystemOperations,
		npmPackageToCheck,
		packagesDirectory,
		shouldSkipLinks,
		shouldIgnoreRootPackage,
		transformScope
	} = options;

	return generateChangelog( {
		nextVersion,
		cwd,
		packagesDirectory,
		externalRepositories,
		transformScope,
		date,
		shouldSkipLinks,
		disableFilesystemOperations,
		...(
			shouldIgnoreRootPackage && npmPackageToCheck ?
				{ shouldIgnoreRootPackage: true, npmPackageToCheck } :
				{ shouldIgnoreRootPackage: false }
		),
		isSinglePackage: false
	} );
};
