/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const BASIC_TYPES = [
	// Wildcard
	'*',

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
	'NodeList',
	'HTMLElement',
	'Document',
	'Element',
	'DocumentFragment',
	'Text',
	'Range',
	'Selection',
	'Event',
	'FocusEvent',
	'ClientRect',
	'Window',
	'ErrorEvent',
	'PromiseRejectionEvent',

	// Web APIs
	'File',
	'DataTransfer'
];

const GENERIC_TYPES = [
	'Array',
	'Set',
	'Map',
	'WeakMap',
	'WeakSet',
	'Promise',

	// Object treated as a dictionary, e.g. Object.<String, Number>.
	'Object',

	// Object that contains a [Symbol.iterator]() method.
	'Iterable',

	// Object that contains next() method and satisfies the Iterator protocol.
	// https://developer.mozilla.org/pl/docs/Web/JavaScript/Reference/Iteration_protocols
	'Iterator',
];

module.exports = {
	BASIC_TYPES,
	GENERIC_TYPES,
	ALL_TYPES: [ ...BASIC_TYPES, ...GENERIC_TYPES ]
};
