/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const fixShortRefs = require( '../lib/longname-fixer/fixers/fix-short-refs' );

describe( 'Long name fix plugin - fixShortRefs()', () => {
	it( 'remember last interface', () => {
		const result = fixShortRefs( {
			doclet: {
				kind: 'interface',
				memberof: 'editor/editorinterface',
				longname: 'editor/editorinterface~EditorInterface',
				name: 'EditorInterface',
				meta: {
					path: 'editor/',
					filename: 'interface.js'
				}
			}
		} );

		expect( result.lastInterfaceOrClass.name, 'EditorInterface' );
	} );

	it( 'fix interface method ', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'interface',
				memberof: 'editor/editorinterface',
				longname: 'editor/editorinterface~EditorInterface',
				name: 'EditorInterface',
				meta: {
					path: 'editor/',
					filename: 'interface.js'
				}
			},
			doclet: {
				kind: 'method',
				meta: {
					path: 'editor/',
					filename: 'interface.js'
				},
				longname: '#destroy',
				name: 'destroy',
			}
		} );

		expect( result.doclet.memberof ).to.be.equal( 'editor/editorinterface~EditorInterface' );
		expect( result.doclet.longname ).to.be.equal( 'editor/editorinterface~EditorInterface#destroy' );
	} );

	it( 'fix mixin method ', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'mixin',
				memberof: 'editor/editormixin',
				longname: 'editor/editormixin~EditorMixin',
				name: 'EditorMixin',
				meta: {
					path: 'editor/',
					filename: 'editormixin.js'
				}
			},
			doclet: {
				kind: 'method',
				meta: {
					path: 'editor/',
					filename: 'editormixin.js'
				},
				longname: '#destroy',
				name: 'destroy',
			}
		} );

		expect( result.doclet.memberof ).to.be.equal( 'editor/editormixin~EditorMixin' );
		expect( result.doclet.longname ).to.be.equal( 'editor/editormixin~EditorMixin#destroy' );
	} );

	it( 'do not fix interface method ', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'interface',
				memberof: 'module:editor/editorinterface',
				longname: 'module:editor/editorinterface~EditorInterface',
				name: 'EditorInterface',
				meta: {
					path: '/',
					filename: 'interface.js'
				}
			},
			doclet: {
				kind: 'method',
				meta: {
					path: '/',
					filename: 'interface.js'
				},
				longname: 'module:someModule~SomeOtherClass#destroy',
				memberof: 'module:someModule~SomeOtherClass',
				name: 'destroy',
			},
		} );

		expect( result.doclet.memberof ).to.be.equal( 'module:someModule~SomeOtherClass' );
		expect( result.doclet.longname ).to.be.equal( 'module:someModule~SomeOtherClass#destroy' );
	} );

	it( 'fix class member with ~ reference', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'class',
				memberof: 'module:editor',
				longname: 'module:editor~Editor',
				name: 'Editor',
				meta: {
					path: '/',
					filename: 'editor.js'
				}
			},
			doclet: {
				kind: 'member',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
				longname: '~Editor#name',
				name: 'name',
			},
		} );

		expect( result.doclet.longname ).to.be.equal( 'module:editor~Editor#name' );
		expect( result.doclet.memberof ).to.be.equal( 'module:editor~Editor' );
	} );

	it( 'fixes event names that contain short ref', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'class',
				memberof: 'module:editor',
				longname: 'module:editor~Editor',
				name: 'Editor',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
			},
			doclet: {
				kind: 'event',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
				name: 'blur',
				longname: 'event:blur',
				memberof: 'module:editor~Editor'
			},
		} );

		expect( result.doclet.longname ).to.be.equal(
			'module:editor~Editor#event:blur'
		);
	} );

	it( 'should not fix event name if modules are not the same', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'class',
				memberof: 'module:editor',
				longname: 'module:editor~Editor',
				name: 'Editor',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
			},
			doclet: {
				kind: 'event',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
				name: 'event:blur',
				longname: 'module:editor2~Editor#event:blur',
				memberof: 'module:editor2~Editor'
			},
		} );

		expect( result.doclet.longname ).to.be.equal(
			'module:editor2~Editor#event:blur'
		);
	} );

	it( 'fixes fires prop types that contain short references', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'class',
				memberof: 'module:editor',
				longname: 'module:editor~Editor',
				name: 'Editor',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
			},
			doclet: {
				kind: 'function',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
				name: 'execute',
				fires: [ 'event:execute' ],
				longname: 'module:editor~Editor#execute',
				memberof: 'module:editor~Editor'
			},
		} );

		expect( result.doclet.fires[ 0 ] ).to.be.equal(
			'module:editor~Editor#event:execute'
		);
	} );

	it( 'fixes fires prop types that do not contain `event` in their names', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'class',
				memberof: 'module:editor',
				longname: 'module:editor~Editor',
				name: 'Editor',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
			},
			doclet: {
				kind: 'function',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
				name: 'attr',
				fires: [ 'change:attribute' ],
				longname: 'module:editor~Editor#attr',
				memberof: 'module:editor~Editor'
			},
		} );

		expect( result.doclet.fires[ 0 ] ).to.be.equal(
			'module:editor~Editor#event:change:attribute'
		);
	} );

	it( 'fixes reference in see tag', () => {
		const result = fixShortRefs( {
			lastInterfaceOrClass: {
				kind: 'class',
				memberof: 'module:editor',
				longname: 'module:editor~Editor',
				name: 'Editor',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
			},
			doclet: {
				kind: 'function',
				meta: {
					path: '/',
					filename: 'editor.js'
				},
				name: 'attr',
				see: [ '#create' ],
				longname: 'module:editor~Editor#attr',
				memberof: 'module:editor~Editor'
			},
		} );

		expect( result.doclet.see[ 0 ] ).to.be.equal(
			'module:editor~Editor#create'
		);
	} );
} );
