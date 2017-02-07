/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Parses command line arguments and returns them as a user-friendly hash.
 *
 * @returns {Options} options
 */
module.exports = function getOptions( args = process.argv.slice( 2 ) ) {
	args = require( 'minimist' )( args, {
		string: [
			'token'
		],
		boolean: [
			'skip-github',
			'skip-npm'
		]
	} );

	return Object.assign( {
		cwd: process.cwd(),
		packages: 'packages',
		skipGithub: args[ 'skip-github' ] || false,
		skipNpm: args[ 'skip-npm' ] || false,
		dependencies: new Map()
	}, args );
};

/**
 * @typedef Options
 *
 * @property {String} [token] GitHub token used to authenticate.
 *
 * @property {Boolean} [skipGithub=false] Whether to publish the package on Github.
 *
 * @property {Boolean} [skipNpm=false] Whether to publish the package on Npm.
 *
 * @property {String} [cwd=process.cwd()] Current working directory (packages) from which all paths will be resolved.
 *
 * @property {String} [packages='packages'] Where to look for other packages (dependencies).
 *
 * @property {Map} [dependencies] Dependencies list to update.
 */
