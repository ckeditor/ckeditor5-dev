/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Configuration for `syncpack`, which ensures that `dependencies` and `devDependencies`
 * across the repository use consistent versions. Executed in CI via the
 * `check-versions-match` script. Run it with the `--fix` argument to resolve reported
 * issues automatically.
 *
 * Unlike in the `ckeditor5` repository, version ranges (the `^` operator) are allowed here.
 * When the same dependency is declared with different versions, the highest one wins.
 */
module.exports = {
	source: [
		'package.json',
		'packages/*/package.json'
	],

	versionGroups: [
		{
			label: 'Packages developed in this repository must use the workspace protocol.',
			dependencies: [ '$LOCAL' ],
			pinVersion: 'workspace:*'
		}
	],

	semverGroups: [
		{
			dependencies: [ '$LOCAL' ],
			isIgnored: true
		}
	]
};
