/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm, workspaces } from '@ckeditor/ckeditor5-dev-utils';

export { default as updateDependencies } from './tasks/updatedependencies.js';
export { default as commitAndTag } from './tasks/commitandtag.js';
export { default as createGithubRelease } from './tasks/creategithubrelease.js';
export { default as reassignNpmTags } from './tasks/reassignnpmtags.js';
export { default as prepareRepository } from './tasks/preparerepository.js';
export { default as push } from './tasks/push.js';
export { default as publishPackages } from './tasks/publishpackages.js';
export { default as updateVersions } from './tasks/updateversions.js';
export { default as cleanUpPackages } from './tasks/cleanuppackages.js';
export {
	getLastFromChangelog,
	getLastPreRelease,
	getNextPreRelease,
	getLastNightly,
	getNextNightly,
	getNextInternal,
	getCurrent,
	getDateIdentifier,
	getLastTagFromGit,
	getVersionForTag,
	isLatestOrNextStableVersion,
	isVersionPublishableForTag
} from './utils/versions.js';
export { default as getChangesForVersion } from './utils/getchangesforversion.js';
export { default as getChangelog } from './utils/getchangelog.js';
export { default as executeInParallel } from './utils/executeinparallel.js';
export { default as validateRepositoryToRelease } from './utils/validaterepositorytorelease.js';
export { default as getNpmTagFromVersion } from './utils/getnpmtagfromversion.js';
export { default as provideToken } from './utils/providetoken.js';

// Backwards compatibility for the old API.
export const checkVersionAvailability = ( ...args ) => {
	process.emitWarning(
		'The `checkVersionAvailability()` function has been moved and will be removed in the upcoming release (v51). ' +
		'Use the `npm` namespace from `@ckeditor/ckeditor5-dev-utils` instead.',
		{
			type: 'DeprecationWarning',
			code: 'DEP0002',
			detail: 'https://github.com/ckeditor/ckeditor5-dev/blob/master/DEPRECATIONS.md#dep0002-checkversionavailability'
		}
	);

	return npm.checkVersionAvailability( ...args );
};

export const findPathsToPackages = ( ...args ) => {
	process.emitWarning(
		'The `findPathsToPackages()` function has been moved and will be removed in the upcoming release (v51). ' +
		'Use the `workspaces` namespace from `@ckeditor/ckeditor5-dev-utils` instead.',
		{
			type: 'DeprecationWarning',
			code: 'DEP0003',
			detail: 'https://github.com/ckeditor/ckeditor5-dev/blob/master/DEPRECATIONS.md#dep0003-findpathstopackages'
		}
	);

	return workspaces.findPathsToPackages( ...args );
};
