/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const fixLinks = require( '../lib/longname-fixer/fixers/fix-links' );

// Helper function that provides easier test.
function formatLinksInDoclet( doclet ) {
	const result = fixLinks( { doclet } );

	return result.doclet;
}

describe( 'Long name fix plugin - formatLinks()', () => {
	it( 'formatLinks()', () => {
		const doclet = formatLinksInDoclet( {
			comment: 'Creates {@link ~EditorInterface} instance',
			description: '<p>Creates {@link ~EditorInterface} instance</p>',
			memberof: 'module:ckeditor5/editor/editorinterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface} instance'
		);
		expect( doclet.description ).to.be.equal(
			'<p>Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface} instance</p>'
		);
	} );

	it( 'formatLinks() hash', () => {
		const doclet = formatLinksInDoclet( {
			comment: 'Method {@link #create} creates instance',
			memberof: 'module:ckeditor5/editor/editorinterface~EditorInterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'Method {@link module:ckeditor5/editor/editorinterface~EditorInterface#create} creates instance'
		);
	} );

	it( 'formatLinks() with link description', () => {
		const doclet = formatLinksInDoclet( {
			comment: 'Creates {@link ~EditorInterface editor} instance with a given name.',
			memberof: 'module:ckeditor5/editor/editorinterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface editor} instance with a given name.'
		);
	} );

	it( 'formatLinks() with more complicated path', () => {
		const doclet = formatLinksInDoclet( {
			comment: 'Method {@link ~EditorInterface#create create} creates Editor',
			memberof: 'module:ckeditor5/editor/editorinterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'Method {@link module:ckeditor5/editor/editorinterface~EditorInterface#create create} creates Editor'
		);
	} );

	it( 'formatLinks() in description', () => {
		const doclet = formatLinksInDoclet( {
			comment: '',
			description: 'You can later destroy it with {@link ~EditorInterface#destroy}',
			memberof: 'module:ckeditor5/editor/editorinterface',
		} );

		expect( doclet.description ).to.be.equal(
			'You can later destroy it with {@link module:ckeditor5/editor/editorinterface~EditorInterface#destroy}'
		);
	} );

	it( 'formatLinks() multiple links', () => {
		const doclet = formatLinksInDoclet( {
			comment: '{@link #destroy} {@link #destroy}',
			memberof: 'module:editor/editorinterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'{@link module:editor/editorinterface#destroy} {@link module:editor/editorinterface#destroy}'
		);
	} );

	it( 'formatLinks() link to parent: class / interface', () => {
		const doclet = formatLinksInDoclet( {
			comment: '{@link ~EditorInterface}',
			memberof: 'module:editor/editorinterface~EditorInterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'{@link module:editor/editorinterface~EditorInterface}'
		);
	} );

	it( 'formatLinks() with multi-word link', () => {
		const doclet = formatLinksInDoclet( {
			comment: 'Creates {@link ~EditorInterface some editor} instance with a given name.',
			memberof: 'module:ckeditor5/editor/editorinterface',
		} );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface some editor} ' +
			'instance with a given name.'
		);
	} );

	it( 'should fix links in error doclets', () => {
		const options = {
			doclet: {
				kind: 'error',
				comment: 'The {@link #constructor source} of a rect in an HTML element',
				description: '<p>The {@link #constructor source} of a rect in an HTML element</p>',
			},
			lastInterfaceOrClass: {
				longname: 'module:ckeditor5-utils/dom/rect~Rect',
			}
		};

		expect( fixLinks( options ) ).to.be.deep.equal( {
			doclet: {
				kind: 'error',
				comment: 'The {@link module:ckeditor5-utils/dom/rect~Rect#constructor source} of a rect in an HTML element',
				description: '<p>The {@link module:ckeditor5-utils/dom/rect~Rect#constructor source} of a rect in an HTML element</p>',
			},
			lastInterfaceOrClass: {
				longname: 'module:ckeditor5-utils/dom/rect~Rect',
			}
		} );
	} );
} );
