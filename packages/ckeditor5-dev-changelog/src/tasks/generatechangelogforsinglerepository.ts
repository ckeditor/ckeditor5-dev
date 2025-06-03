/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ConfigBase, GenerateChangelogEntryPoint } from '../types.js';
import { generateChangelog } from './generatechangelog.js';

type SingleRepositoryConfig = Omit<ConfigBase, 'packagesDirectory'>;

export const generateChangelogForSingleRepository: GenerateChangelogEntryPoint<SingleRepositoryConfig> = async ( {
	nextVersion,
	cwd,
	externalRepositories,
	date,
	shouldSkipLinks,
	noWrite,
	removeInputFiles
} ) => {
	return generateChangelog( {
		nextVersion,
		cwd,
		externalRepositories,
		date,
		shouldSkipLinks,
		removeInputFiles,
		noWrite,
		singlePackage: true
	} );
};
