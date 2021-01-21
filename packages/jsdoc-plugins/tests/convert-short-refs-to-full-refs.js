/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const convertShortRefsToFullRefs = require( '../lib/longname-fixer/fixers/convert-short-refs-to-full-refs' );

describe( 'jsdoc-plugins/longname-fixers/convert-short-refs-to-full-refs', () => {
	it( 'should convert interface method short refs to full refs', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'interface',
			memberof: 'module:editor/editorinterface',
			longname: 'module:editor/editorinterface~EditorInterface',
			name: 'EditorInterface',
			meta: {
				path: 'editor/',
				filename: 'interface.js',
				lineno: 20
			},
			comment: '',
			description: ''
		}, {
			kind: 'function',
			meta: {
				path: 'editor/',
				filename: 'interface.js',
				lineno: 30
			},
			longname: '#destroy',
			memberof: 'module:editor/editorinterface~EditorInterface',
			name: 'destroy',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].memberof ).to.be.equal( 'module:editor/editorinterface~EditorInterface' );
		expect( doclets[ 1 ].longname ).to.be.equal( 'module:editor/editorinterface~EditorInterface#destroy' );
	} );

	it( 'should convert mixin method short refs to full refs', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'mixin',
			memberof: 'module:editor/editormixin',
			longname: 'module:editor/editormixin~EditorMixin',
			name: 'EditorMixin',
			meta: {
				path: 'editor/',
				filename: 'editormixin.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'function',
			meta: {
				path: 'editor/',
				filename: 'editormixin.js',
				lineno: 30
			},
			longname: '#destroy',
			memberof: 'module:editor/editormixin~EditorMixin',
			name: 'destroy',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].memberof ).to.be.equal( 'module:editor/editormixin~EditorMixin' );
		expect( doclets[ 1 ].longname ).to.be.equal( 'module:editor/editormixin~EditorMixin#destroy' );
	} );

	it( 'should not convert short refs if the memberof differs', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'interface',
			memberof: 'module:editor/editorinterface',
			longname: 'module:editor/editorinterface~EditorInterface',
			name: 'EditorInterface',
			meta: {
				path: '/',
				filename: 'interface.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'function',
			meta: {
				path: '/',
				filename: 'interface.js',
				lineno: 30
			},
			longname: 'module:someModule~SomeOtherClass#destroy',
			memberof: 'module:someModule~SomeOtherClass',
			name: 'destroy',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].memberof ).to.be.equal( 'module:someModule~SomeOtherClass' );
		expect( doclets[ 1 ].longname ).to.be.equal( 'module:someModule~SomeOtherClass#destroy' );
	} );

	it( 'should fix class members starting with the `~` character', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'class',
			memberof: 'module:editor',
			longname: 'module:editor~Editor',
			name: 'Editor',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'member',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 30
			},
			longname: '~Editor#name',
			memberof: 'module:editor~Editor',
			name: 'name',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].longname ).to.be.equal( 'module:editor~Editor#name' );
		expect( doclets[ 1 ].memberof ).to.be.equal( 'module:editor~Editor' );
	} );

	it( 'should convert short event names to full names if the event is declared after the class/mixin/interface', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'class',
			memberof: 'module:editor',
			longname: 'module:editor~Editor',
			name: 'Editor',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'event',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 30
			},
			name: 'blur',
			longname: 'event:blur',
			memberof: 'module:editor~Editor',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].longname ).to.be.equal(
			'module:editor~Editor#event:blur'
		);
	} );

	it( 'should not convert event name if there is no class/mixin/interface defined above the event', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'class',
			memberof: 'module:editor',
			longname: 'module:editor~Editor',
			name: 'Editor',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'event',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 30
			},
			name: 'event:blur',
			longname: 'module:editor2~Editor#event:blur',
			memberof: 'module:editor2~Editor',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].longname ).to.be.equal(
			'module:editor2~Editor#event:blur'
		);
	} );

	it( 'should convert short refs in fires tag to full refs if a class/mixin/interface is declared above', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'class',
			memberof: 'module:editor',
			longname: 'module:editor~Editor',
			name: 'Editor',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'function',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 30
			},
			name: 'execute',
			fires: [ 'event:execute' ],
			longname: 'module:editor~Editor#execute',
			memberof: 'module:editor~Editor',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].fires[ 0 ] ).to.be.equal(
			'module:editor~Editor#event:execute'
		);
	} );

	it( 'should convert short refs in fires tag to full refs if a class/mixin/interface is declared above #2', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'class',
			memberof: 'module:editor',
			longname: 'module:editor~Editor',
			name: 'Editor',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'function',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 30
			},
			name: 'attr',
			fires: [ 'change:attribute' ],
			longname: 'module:editor~Editor#attr',
			memberof: 'module:editor~Editor',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].fires[ 0 ] ).to.be.equal(
			'module:editor~Editor#event:change:attribute'
		);
	} );

	it( 'should convert short refs in see tags to full refs', () => {
		/** @type {Array.<Doclet>} */
		const doclets = [ {
			kind: 'class',
			memberof: 'module:editor',
			longname: 'module:editor~Editor',
			name: 'Editor',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 20
			},
			comment: '',
			description: ''
		},
		{
			kind: 'function',
			meta: {
				path: '/',
				filename: 'editor.js',
				lineno: 30
			},
			name: 'attr',
			see: [ '#create' ],
			longname: 'module:editor~Editor#attr',
			memberof: 'module:editor~Editor',
			comment: '',
			description: ''
		} ];

		convertShortRefsToFullRefs( doclets );

		expect( doclets[ 1 ].see[ 0 ] ).to.be.equal(
			'module:editor~Editor#create'
		);
	} );
} );

describe( 'jsdoc-plugins/longname-fixer/fix-links', () => {
	it( 'formatLinks()', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: 'Creates {@link ~EditorInterface} instance',
			description: '<p>Creates {@link ~EditorInterface} instance</p>',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
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
		/** @type {Doclet} */
		const doclet = {
			name: '#create',
			comment: 'Method {@link #create} creates instance',
			memberof: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface#create',
			kind: 'function',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Method {@link module:ckeditor5/editor/editorinterface~EditorInterface#create} creates instance'
		);
	} );

	it( 'formatLinks() with link description', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: 'Creates {@link ~EditorInterface editor} instance with a given name.',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Creates {@link module:ckeditor5/editor/editorinterface~EditorInterface editor} instance with a given name.'
		);
	} );

	it( 'formatLinks() with more complicated path', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: 'Method {@link ~EditorInterface#create create} creates Editor',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'Method {@link module:ckeditor5/editor/editorinterface~EditorInterface#create create} creates Editor'
		);
	} );

	it( 'formatLinks() in description', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: '',
			description: 'You can later destroy it with {@link ~EditorInterface#destroy}',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.description ).to.be.equal(
			'You can later destroy it with {@link module:ckeditor5/editor/editorinterface~EditorInterface#destroy}'
		);
	} );

	it( 'formatLinks() multiple links', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: '{@link #destroy} {@link #destroy}',
			memberof: 'module:editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'{@link module:editor/editorinterface#destroy} {@link module:editor/editorinterface#destroy}'
		);
	} );

	it( 'formatLinks() link to parent: class / interface', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: '{@link ~EditorInterface}',
			memberof: 'module:editor/editorinterface~EditorInterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
		};

		convertShortRefsToFullRefs( [ doclet ] );

		expect( doclet.comment ).to.be.equal(
			'{@link module:editor/editorinterface~EditorInterface}'
		);
	} );

	it( 'formatLinks() with multi-word link', () => {
		/** @type {Doclet} */
		const doclet = {
			name: 'EditorInterface',
			comment: 'Creates {@link ~EditorInterface some editor} instance with a given name.',
			memberof: 'module:ckeditor5/editor/editorinterface',
			longname: 'module:ckeditor5/editor/editorinterface~EditorInterface',
			kind: 'interface',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 0 }
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
			name: 'some-error',
			longname: 'module:errors~some-error',
			memberof: 'module:errors',
			kind: 'error',
			comment: 'The {@link #constructor source} of a rect in an HTML element',
			description: '<p>The {@link #constructor source} of a rect in an HTML element</p>',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 40 }
		}, {
			name: 'Rect',
			memberof: 'module:ckeditor5-utils/dom/rect',
			longname: 'module:ckeditor5-utils/dom/rect~Rect',
			kind: 'class',
			comment: '',
			description: '',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 30 }
		}, {
			name: 'constructor',
			longname: 'module:ckeditor5-utils/dom/rect~Rect#constructor',
			memberof: 'module:ckeditor5-utils/dom/rect~Rect',
			kind: 'function',
			comment: '',
			description: '',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 32 }
		} ];

		convertShortRefsToFullRefs( doclets );

		const errorDoclet = doclets.find( d => d.longname === 'module:errors~some-error' );

		expect( errorDoclet ).to.deep.equal( {
			name: 'some-error',
			longname: 'module:errors~some-error',
			memberof: 'module:errors',
			kind: 'error',
			comment: 'The {@link module:ckeditor5-utils/dom/rect~Rect#constructor source} of a rect in an HTML element',
			description: '<p>The {@link module:ckeditor5-utils/dom/rect~Rect#constructor source} of a rect in an HTML element</p>',
			meta: { filename: 'foo.js', path: 'foo/bar', lineno: 40 }
		} );
	} );
} );
