/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	mergePattern: /^Merge .*$/,
	headerPattern: /^([^:]+): (.*)$/,
	headerCorrespondence: [
		'type',
		'subject'
	],
	noteKeywords: [
		'MAJOR BREAKING CHANGES',
		'MAJOR BREAKING CHANGE',
		'MINOR BREAKING CHANGES',
		'MINOR BREAKING CHANGE',
		'BREAKING CHANGES', // It will be treated as "MAJOR BREAKING CHANGES"
		'BREAKING CHANGE', // An alias for "BREAKING CHANGES".
		'NOTE'
	],
	revertPattern: /^Revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
	revertCorrespondence: [ 'header', 'hash' ],
	referenceActions: []
};
