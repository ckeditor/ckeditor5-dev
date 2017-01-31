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
	noteKeywords: [ 'BREAKING CHANGE', 'NOTE' ],
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
