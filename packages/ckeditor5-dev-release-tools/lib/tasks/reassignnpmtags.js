#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import shellEscape from 'shell-escape';
import updateNpmTags from '../utils/updatenpmtags.js';

/**
 * Used to assign a dist-tag to a specified version for all packages from the release set.
 * It supports built-in tags (e.g. `latest`, `staging`, `next`) and custom tags (e.g. `latest-v{X}`).
 * Each operation will be retried up to 3 times in case of failure. Packages whose tag already points to the requested
 * version are reported as skipped. When the tag could not be changed for at least one package, the returned promise
 * rejects after all packages have been processed, so the caller does not treat a partial update as a success.
 *
 * When using npm Trusted Publishing (`useOidc`), the `npm whoami` check is replaced by verifying that the `NPM_ID_TOKEN`
 * environment variable is set, as `npm whoami` does not reflect OIDC authentication. It requires npm 11.21.0 or newer
 * and a trusted publisher that allows the `npm dist-tag` command.
 *
 * See also `removeNpmTags()`.
 *
 * @param {object} options
 * @param {string} [options.npmOwner] User that is authorized to release packages. Required unless `useOidc` is enabled.
 * @param {boolean} [options.useOidc=false] Whether to authorize using npm Trusted Publishing (OIDC). When enabled,
 * the `npm whoami` authorization check is skipped and the `NPM_ID_TOKEN` environment variable must be set instead.
 * @param {string} options.version Specifies the version of packages to reassign the tags for.
 * @param {Array.<string>} options.packages Array of packages' names to reassign tags for.
 * @param {string} [options.npmTag='latest'] Npm dist-tag to assign.
 * @returns {Promise} Rejects when the tag could not be changed for at least one package.
 */
export default async function reassignNpmTags( options ) {
	const {
		npmOwner,
		useOidc = false,
		version,
		packages,
		npmTag = 'latest'
	} = options;

	return updateNpmTags( {
		npmOwner,
		useOidc,
		packages,
		getCommand: packageName => `npm dist-tag add ${ shellEscape( [ packageName ] ) }@${ shellEscape( [ version ] ) } ${ npmTag }`,
		skipMessages: [ 'is already set to version' ],
		spinnerTitle: 'Reassigning npm tags...',
		updatedTitle: '✨ Tags updated:',
		errorMessage: `Could not assign the "${ npmTag }" npm dist-tag to version "${ version }" for the following packages: `
	} );
}
