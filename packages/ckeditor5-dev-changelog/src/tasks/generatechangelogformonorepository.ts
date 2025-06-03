/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelog } from './generatechangelog.js';
import type { ConfigBase, GenerateChangelogEntryPoint, MonoRepoConfigBase } from '../types.js';

type MonoRepositoryConfig = ConfigBase & MonoRepoConfigBase & {
	packagesDirectory: ConfigBase[ 'packagesDirectory' ];
	transformScope: MonoRepoConfigBase[ 'transformScope' ];
};

export const generateChangelogForMonoRepository: GenerateChangelogEntryPoint<MonoRepositoryConfig> = async ( {
	nextVersion,
	cwd,
	packagesDirectory,
	externalRepositories,
	transformScope,
	date,
	shouldSkipLinks,
	skipRootPackage,
	npmPackageToCheck,
	noWrite,
	removeInputFiles
} ) => {
	return generateChangelog( {
		nextVersion,
		cwd,
		packagesDirectory,
		externalRepositories,
		transformScope,
		date,
		shouldSkipLinks,
		removeInputFiles,
		noWrite,
		...( skipRootPackage && npmPackageToCheck ? { skipRootPackage: true, npmPackageToCheck } : { skipRootPackage: false } ),
		singlePackage: false
	} );
};
