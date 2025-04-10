/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';

/**
 * Push the local changes to a remote server.
 *
 * @param {object} options
 * @param {string} options.releaseBranch A name of the branch that should be used for releasing packages.
 * @param {string} options.version Name of tag connected with the release.
 * @param {string} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @returns {Promise}
 */
export default async function push( options ) {
	const {
		releaseBranch,
		version,
		cwd = process.cwd()
	} = options;

	const command = `git push origin ${ shellEscape( [ releaseBranch ] ) } ${ shellEscape( [ 'v' + version ] ) }`;

	return tools.shExec( command, { cwd, verbosity: 'error', async: true } );
}
