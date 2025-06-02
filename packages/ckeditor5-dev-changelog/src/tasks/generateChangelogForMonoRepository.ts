/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ConfigBase, MonoRepoConfigBase } from '../types.js';
import { generateChangelog } from './generatechangelog.js';

type GenerateChangelog = <T extends boolean | undefined = undefined>(
	config: ConfigBase & MonoRepoConfigBase & { noWrite?: T }
) => Promise<T extends true ? string : void>; // eslint-disable-line @typescript-eslint/no-invalid-void-type

export const generateChangelogForMonoRepository: GenerateChangelog = async ( {
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
