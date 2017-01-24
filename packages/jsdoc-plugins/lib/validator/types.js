/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const BASIC_TYPES = [
	'*', // wildcard

	// ES types
	'null',
	'undefined',
	'String',
	'Number',
	'Boolean',
	'Object',
	'Error',
	'Function',
	'function', // JSDoc renames Function into function.
	'RegExp',
	'Symbol',

	// DOM API
	'Node',
	'HTMLElement',
	'Document',
	'Element',
	'DocumentFragment',
	'Text',
	'Range',
	'Selection',
	'Event',
	'ClientRect'
];

const GENERIC_TYPES = [
	'Array',
	'Iterator',
	'Set',
	'Map',
	'WeakMap',
	'Promise',
	'Object', // as a dictionary

	// type of object that contains [Symbol.iterator]
	'Iterable',
];

module.exports = {
	BASIC_TYPES,
	GENERIC_TYPES,
	ALL_TYPES: [ ...BASIC_TYPES, ...GENERIC_TYPES ]
};
