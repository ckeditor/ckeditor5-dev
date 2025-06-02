/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ConfigBase } from '../types.js';
import { generateChangelog } from './generatechangelog.js';

type GenerateChangelog = <T extends boolean | undefined = undefined>(
	config: ConfigBase & { noWrite?: T }
) => Promise<T extends true ? string : void>; // eslint-disable-line @typescript-eslint/no-invalid-void-type

export const generateChangelogForSingleRepository: GenerateChangelog = async ( {
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
