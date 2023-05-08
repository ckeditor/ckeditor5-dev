/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { shExec } = require( '@ckeditor/ckeditor5-dev-utils/lib/tools' );
const { toUnix, normalizeTrim } = require( 'upath' );

/**
 * Creates a commit and a tag for specified version.
 *
 * @param {Object} options
 * @param {String} [options.packagesDirectory]
 * @param {String} options.version The commit will contain this param in its message and the tag will have a `v` prefix.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 */
module.exports = function commitAndTag( { packagesDirectory, version, cwd = process.cwd() } ) {
	const normalizedCwd = toUnix( cwd );
	const packagesPaths = packagesDirectory ? normalizeTrim( packagesDirectory ) + '/*/package.json' : '';

	shExec( `git add package.json ${ packagesPaths }`, { cwd: normalizedCwd } );
	shExec( `git commit --message "Release: v${ version }."`, { cwd: normalizedCwd } );
	shExec( `git tag v${ version }`, { cwd: normalizedCwd } );
};
