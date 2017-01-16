/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	headerPattern: /^([^\:]+): (.*\.)/,
	headerCorrespondence: [
		'type',
		'title'
	],
	noteKeywords: [ 'BREAKING CHANGE', 'BREAKING CHANGES', 'NOTE' ],
	revertPattern: /^Revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
	revertCorrespondence: [ 'header', 'hash' ],
	referenceActions: [
		'Fixes:',
		'Closes:',
	]
};
