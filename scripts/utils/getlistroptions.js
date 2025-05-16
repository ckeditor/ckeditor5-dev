/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param {ReleaseOptions} cliArguments
 * @returns {object}
 */
export default function getListrOptions( cliArguments ) {
	return {
		renderer: cliArguments.verbose ? 'verbose' : 'default'
	};
}
