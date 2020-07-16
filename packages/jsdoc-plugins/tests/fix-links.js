/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const { expect } = require( 'chai' );
const convertShortRefsToFullRefs = require( '../lib/longname-fixer/fixers/convert-short-refs-to-full-refs' );

describe( 'jsdoc-plugins/longname-fixer/fix-links', () => {
	it( 'formatLinks()', () => {
		const doclet = {
			comment: 'Creates {@link ~EditorInterface} instance',
			description: '<p>Creates {@link ~EditorInterface} instance</p>',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface} instance'
		);
		expect( doclet.description ).to.be.equal(
			'<p>Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface} instance</p>'
		);
	} );

	it( 'formatLinks() hash', () => {
		const doclet = {
			comment: 'Method {@link #create} creates instance',
			memberof: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface#create',
			kind: 'function',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Method {@link module:ckeditor5/editor/editorinterface~EditorInterface#create} creates instance'
		);
	} );

	it( 'formatLinks() with link description', () => {
		const doclet = {
			comment: 'Creates {@link ~EditorInterface editor} instance with a given name.',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface editor} instance with a given name.'
		);
	} );

	it( 'formatLinks() with more complicated path', () => {
		const doclet = {
			comment: 'Method {@link ~EditorInterface#create create} creates Editor',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Method {@link module:ckeditor5/editor/editorinterface~EditorInterface#create create} creates Editor'
		);
	} );

	it( 'formatLinks() in description', () => {
		const doclet = {
			comment: '',
			description: 'You can later destroy it with {@link ~EditorInterface#destroy}',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.description ).to.be.equal(
			'You can later destroy it with {@link module:ckeditor5/editor/editorinterface~EditorInterface#destroy}'
		);
	} );

	it( 'formatLinks() multiple links', () => {
		const doclet = {
			comment: '{@link #destroy} {@link #destroy}',
			memberof: 'module:editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'{@link module:editor/editorinterface#destroy} {@link module:editor/editorinterface#destroy}'
		);
	} );

	it( 'formatLinks() link to parent: class / interface', () => {
		const doclet = {
			comment: '{@link ~EditorInterface}',
			memberof: 'module:editor/editorinterface~EditorInterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'{@link module:editor/editorinterface~EditorInterface}'
		);
	} );

	it( 'formatLinks() with multi-word link', () => {
		const doclet = {
			comment: 'Creates {@link ~EditorInterface some editor} instance with a given name.',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { fileName: 'foo.js', path: 'foo/bar' }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface some editor} ' +
			'instance with a given name.'
		);
	} );

	it( 'should fix links in error doclets', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			longname: 'module:errors~some-error',
			memberof: 'module:errors',
			kind: 'error',
			comment: 'The {@link #constructor source} of a rect in an HTML element',
			description: '<p>The {@link #constructor source} of a rect in an HTML element</p>',
			meta: { fileName: 'foo.js', path: 'foo/bar', lineno: 40 }
		}, {
			longname: 'module:ckeditor5-utils/dom/rect~Rect',
			kind: 'class',
			comment: '',
			description: '',
			meta: { fileName: 'foo.js', path: 'foo/bar', lineno: 30 }
		}, {
			longname: 'module:ckeditor5-utils/dom/rect~Rect#constructor',
			kind: 'function',
			comment: '',
			description: '',
			meta: { fileName: 'foo.js', path: 'foo/bar', lineno: 32 }
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets ).to.be.deep.equal( [
			{
				longname: 'module:errors~some-error',
				memberof: 'module:errors',
				kind: 'error',
				comment: 'The {@link module:ckeditor5-utils/dom/rect~Rect#constructor source} of a rect in an HTML element',
				description: '<p>The {@link module:ckeditor5-utils/dom/rect~Rect#constructor source} of a rect in an HTML element</p>',
				meta: { fileName: 'foo.js', path: 'foo/bar', lineno: 40 }
			},
			{
				longname: 'module:ckeditor5-utils/dom/rect~Rect',
				comment: '',
				description: '',
				kind: 'class',
				meta: { fileName: 'foo.js', path: 'foo/bar', lineno: 30 }
			},
			{
				longname: 'module:ckeditor5-utils/dom/rect~Rect#constructor',
				kind: 'function',
				comment: '',
				description: '',
				meta: { fileName: 'foo.js', path: 'foo/bar', lineno: 32 }
			}
		] );
	} );
} );
