#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import shellEscape from 'shell-escape';
import updateNpmTags from '../utils/updatenpmtags.js';

/**
 * Used to remove a dist-tag from all packages from the given set, for example, a temporary tag used to stage a release.
 * Each operation will be retried up to 3 times in case of failure. Packages that do not have the tag are reported
 * as skipped (also when a package has no dist-tags at all), so the function can be run again after a partial failure.
 * When the tag could not be removed from at least one package, the returned promise rejects after all packages
 * have been processed.
 *
 * When using npm Trusted Publishing (`useOidc`), the `npm whoami` check is replaced by verifying that the `NPM_ID_TOKEN`
 * environment variable is set, as `npm whoami` does not reflect OIDC authentication. It requires npm 11.21.0 or newer
 * and a trusted publisher that allows the `npm dist-tag` command.
 *
 * See also `reassignNpmTags()`.
 *
 * @param {object} options
 * @param {string} [options.npmOwner] User that is authorized to release packages. Required unless `useOidc` is enabled.
 * @param {boolean} [options.useOidc=false] Whether to authorize using npm Trusted Publishing (OIDC). When enabled,
 * the `npm whoami` authorization check is skipped and the `NPM_ID_TOKEN` environment variable must be set instead.
 * @param {Array.<string>} options.packages Array of packages' names to remove the tag from.
 * @param {string} options.npmTag Npm dist-tag to remove.
 * @returns {Promise} Rejects when the tag could not be removed from at least one package.
 */
export default async function removeNpmTags( options ) {
	const {
		npmOwner,
		useOidc = false,
		packages,
		npmTag
	} = options;

	if ( !npmTag ) {
		throw new Error( 'The "npmTag" option is required.' );
	}

	return updateNpmTags( {
		npmOwner,
		useOidc,
		packages,
		getCommand: packageName => `npm dist-tag rm ${ shellEscape( [ packageName ] ) } ${ shellEscape( [ npmTag ] ) }`,
		// npm checks the tags of the package before removing one. When the package has no tags at all,
		// npm reports it before looking for the requested tag.
		skipMessages: [ 'is not a dist-tag on', 'No dist-tags found for' ],
		spinnerTitle: 'Removing npm tags...',
		updatedTitle: '✨ Tags removed:',
		errorMessage: `Could not remove the "${ npmTag }" npm dist-tag from the following packages: `
	} );
}
