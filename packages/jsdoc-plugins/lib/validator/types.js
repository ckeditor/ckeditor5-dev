/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
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
	'Date',

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
	'DOMRect',
	'Window',
	'ErrorEvent',
	'PromiseRejectionEvent',
	'Blob',

	// Web APIs
	'File',
	'DataTransfer',
	'FormData',
	'URL'
];

const GENERIC_TYPES = [
	'Array',
	'Set',
	'Map',
	'WeakMap',
	'WeakSet',
	'Promise',
	'Uint8Array',
	'Uint16Array',
	'Uint32Array',
	'Int8Array',
	'Int16Array',
	'Int32Array',

	// Object treated as a dictionary, e.g. Object.<String, Number>.
	'Object',

	// Object that contains a [Symbol.iterator]() method.
	'Iterable',

	// Object that contains next() method and satisfies the Iterator protocol.
	// https://developer.mozilla.org/pl/docs/Web/JavaScript/Reference/Iteration_protocols
	'Iterator'
];

module.exports = {
	BASIC_TYPES,
	GENERIC_TYPES,
	ALL_TYPES: [ ...BASIC_TYPES, ...GENERIC_TYPES ]
};
