/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	headerPattern: /^([^\:]+): (.*\.)/,
	headerCorrespondence: [
		'type',
		'subject'
	],
	// 'BREAKING CHANGE' and 'BREAKING CHANGES' will be grouped as 'BREAKING CHANGES'.
	noteKeywords: [ 'BREAKING CHANGE', 'BREAKING CHANGES', 'NOTE' ],
	revertPattern: /^Revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
	revertCorrespondence: [ 'header', 'hash' ],
	referenceActions: [
		'Close:',
		'Closes:',
		'Closed:',
		'Fix:',
		'Fixes:',
		'Fixed:',
		'Resolve:',
		'Resolves:',
		'Resolved:',
	]
};
