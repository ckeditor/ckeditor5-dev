/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const fixCodeSnippets = require( '../lib/fix-code-snippets' );

describe( 'jsdoc-plugins/fix-code-snippets', () => {
	it( 'should remove leading tabs ina multi-line code snippets', () => {
		const doclet = {
			description: '<pre><code>\tfoo\n\tbar</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );

	it( 'should remove leading tabs in a single-line code snippet', () => {
		const doclet = {
			description: '<pre><code>\tfoo</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo</code></pre>'
		);
	} );

	it( 'should remove leading tabs in a description containing multiple code snippets', () => {
		const doclet = {
			description:
				'<pre><code>\tfoo</code></pre>' +
				'foo' +
				'<pre><code>\tbar</code></pre>' +
				'bar'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo</code></pre>' +
			'foo' +
			'<pre><code>bar</code></pre>' +
			'bar'
		);
	} );

	it( 'should remove multiple leading tabs', () => {
		const doclet = {
			description:
				'<pre><code>\t\tfoo\n\t\tbar</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );

	it( 'should remove leading spaces', () => {
		const doclet = {
			description:
				'<pre><code>   foo\n   bar</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );

	it( 'should remove leading tabs in code snippet containing empty lines', () => {
		const doclet = {
			description:
				'<pre><code>\t\tfoo\n\n\t\tbar</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo\n\nbar</code></pre>'
		);
	} );

	it( 'should not remove correct code snippet tabs', () => {
		const doclet = {
			description:
				'<pre><code>\tfoo\n\t\tbar\n\t\t\tbaz</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.description ).to.equal(
			'<pre><code>foo\n\tbar\n\t\tbaz</code></pre>'
		);
	} );

	it( 'should fix classdesc in classes', () => {
		const doclet = {
			classdesc:
				'<pre><code>\tfoo\n\tbar</code></pre>'
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.classdesc ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );

	it( 'should fix property descriptions', () => {
		const doclet = {
			properties: [ {
				name: 'foo',
				description: '<pre><code>\tfoo\n\tbar</code></pre>'
			}, {
				name: 'bar',
				description: '<pre><code>\tfoo\n\tbar</code></pre>'
			}, {
				name: 'baz'
				// The `baz` property has no description.
			} ]
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.properties[ 0 ].description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);

		expect( doclet.properties[ 1 ].description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );

	it( 'should fix descriptions of the return tags', () => {
		const doclet = {
			returns: [ {
				type: 'String',
				description: '<pre><code>\tfoo\n\tbar</code></pre>'
			}, {
				type: 'Array',
				description: '<pre><code>\tfoo\n\tbar</code></pre>'
			}, {
				type: 'Boolean'
				// Third return overload has no description.
			} ]
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.returns[ 0 ].description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);

		expect( doclet.returns[ 1 ].description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );

	it( 'should fix descriptions of parameters', () => {
		const doclet = {
			params: [ {
				name: 'foo',
				description: '<pre><code>\tfoo\n\tbar</code></pre>'
			}, {
				name: 'bar',
				description: '<pre><code>\tfoo\n\tbar</code></pre>'
			}, {
				name: 'baz'
				// The `baz` parameter has no description.
			} ]
		};

		fixCodeSnippets.handlers.parseComplete( { doclets: [ doclet ] } );

		expect( doclet.params[ 0 ].description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);

		expect( doclet.params[ 1 ].description ).to.equal(
			'<pre><code>foo\nbar</code></pre>'
		);
	} );
} );
