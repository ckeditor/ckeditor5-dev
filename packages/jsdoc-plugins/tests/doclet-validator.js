/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const DocletValidator = require( '../lib/validator/doclet-validator.js' );

const testedModules = [
	'module:utils',
	'module:engine',
	'module:ckeditor5',
];

describe( 'Linter plugin', () => {
	it( '_lintMembers()', () => {
		const linter = new DocletValidator( [ {
			kind: 'member',
			name: 'module:ckeditor5/wrong_path',
			scope: 'inner',
			meta: { fileName: '', path: '' },
		} ], testedModules );

		linter._lintMembers();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	it( '_lintMemberofProperty() - var, let', () => {
		const linter = new DocletValidator( [ {
			kind: 'member',
			name: 'module:ckeditor5/path',
			memberof: '<anonymous>',
			meta: { fileName: '', path: '' },
		} ], testedModules );

		linter._lintMemberofProperty();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintMemberofProperty() - wrong memberof', () => {
		const linter = new DocletValidator( [ {
			kind: 'member',
			name: 'module:ckeditor5/wrong_path',
			memberof: 'wrongMemberof',
			meta: { fileName: '', path: '' },
		} ], testedModules );

		linter._lintMemberofProperty();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	it( '_lintMemberofProperty() - correct reference', () => {
		const linter = new DocletValidator( [ {
			kind: 'member',
			name: 'module:ckeditor5/editor',
			memberof: 'module:ckeditor5/editor',
			meta: { fileName: '', path: '' },
		} ], testedModules );

		linter._lintMemberofProperty();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	describe( '_lintParams()', () => {
		it( 'should hande not existing types', () => {
			const linter = new DocletValidator( [ {
				kind: 'function',
				params: [ {
					type: { parsedType: {
						name: 'module:engine/ckeditor5/editor'
					} }
				} ],
				longname: 'abc',
				scope: 'inner',
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			linter._lintParams();

			expect( linter._errors.length ).to.be.equal( 1 );
		} );

		it( 'should handle existing types', () => {
			const linter = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: { parsedType: {
						name: 'module:engine/ckeditor5/editor'
					} }
				} ],
				meta: { fileName: '',  path: '' },
			}, {
				kind: 'module',
				longname: 'module:engine/ckeditor5/editor',
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			linter._lintParams();

			expect( linter._errors.length ).to.be.equal( 0 );
		} );

		it( 'should handle built-in types', () => {
			const linter = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: { parsedType: { name: 'String' } },
				}, {
					type: { parsedType: { name: 'Array' } },
				}, {
					type: { parsedType: { name: 'Number' } },
				} ],
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			linter._lintParams();

			expect( linter._errors.length ).to.be.equal( 0 );
		} );

		it( 'should handle built-in type as aliases', () => {
			const linter = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: { parsedType: {
						elements: [
							{ name: 'String' },
							{ name: 'Array' },
							{ name: 'Number' },
						]
					} },
				} ],
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			linter._lintParams();

			expect( linter._errors.length ).to.be.equal( 0 );
		} );

		it( 'should handle wrong type in alias', () => {
			const linter = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: { parsedType: {
						elements: [
							{ name: 'String' },
							{ name: 'Wrong' },
						]
					} },
				} ],
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			linter._lintParams();

			expect( linter._errors.length ).to.be.equal( 1 );
		} );

		it( 'should handle NullLiteral and UndefinedLiteral type', () => {
			const linter = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: { parsedType: {
						elements: [
							{ name: 'String' },
							{ type: 'NullLiteral' },
							{ type: 'UndefinedLiteral' },
						]
					} },
				} ],
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			linter._lintParams();

			expect( linter._errors.length ).to.be.equal( 0 );
		} );
	} );

	it( '_lintLinks()', () => {
		const linter = new DocletValidator( [ {
			comment:
				`* {@link module:utils/a~A#method1}
				 * {@link module:utils/b~Some1} `,
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintLinks();

		expect( linter._errors.length ).to.be.equal( 2 );
	} );

	it( '_lintLinks() 2', () => {
		const linter = new DocletValidator( [ {
			comment:
				`/** Linking test:\n *\n * * a:\n *
				 * {@link module:ckeditor5/a~A} `,
			meta: { fileName: '',  path: '' },
		}, {
			comment: '',
			longname: 'module:ckeditor5/a~A',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintLinks();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintLinks() with link name', () => {
		const linter = new DocletValidator( [ {
			comment: ` {@link module:ckeditor5/a~A classA} `,
			meta: { fileName: '',  path: '' },
		}, {
			comment: '',
			longname: 'module:ckeditor5/a~A',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintLinks();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintLinks() with whitespaces', () => {
		const linter = new DocletValidator( [ {
			comment: ` {@link \n module:ckeditor5/a~A \n\t classA} `,
			meta: { fileName: '',  path: '' },
		}, {
			comment: '',
			longname: 'module:ckeditor5/a~A',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintLinks();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintLinks() with multi-word link', () => {
		const linter = new DocletValidator( [ {
			comment: ` {@link module:ckeditor5/a~A with multi word link} `,
			meta: { fileName: '',  path: '' },
		}, {
			comment: '',
			longname: 'module:ckeditor5/a~A',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintLinks();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintEvents()', () => {
		const linter = new DocletValidator( [ {
			kind: 'class',
			longname: 'module:abc/SomeClass',
			meta: { fileName: '',  path: '' },
			fires: [ 'someEvent' ],
		} ], testedModules );

		linter._lintEvents();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	it( '_lintEvents() 2', () => {
		const linter = new DocletValidator( [ {
			kind: 'class',
			longname: 'module:abc/SomeClass',
			meta: { fileName: '',  path: '' },
			fires: [ 'module:abc/SomeClass#event:someEvent' ],
		}, {
			kind: 'event',
			longname: 'module:abc/SomeClass#event:someEvent'
		} ], testedModules );

		linter._lintEvents();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintEvents() - fires should match with events only', () => {
		const linter = new DocletValidator( [ {
			kind: 'class',
			longname: 'module:abc/SomeClass',
			meta: { fileName: '',  path: '' },
			fires: [ 'module:abc/SomeClass#event:someEvent' ],
		}, {
			kind: 'not-event',
			longname: 'module:abc/SomeClass#event:someEvent'
		} ], testedModules );

		linter._lintEvents();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	it( '_lintModuleDocumentedExports()', () => {
		const linter = new DocletValidator( [ {
			kind: 'member',
			scope: 'inner',
			memberof: 'module:utils/emittermixin',
			meta: { fileName: '',  path: '' },
		}, {
			kind: 'module',
			longname: 'module:utils/emittermixin',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintModuleDocumentedExports();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	it( '_lintModuleDocumentedExports()', () => {
		const linter = new DocletValidator( [ {
			kind: 'member',
			scope: 'inner',
			memberof: 'module:utils/emittermixin~EmitterMixin',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintModuleDocumentedExports();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( 'lintSeeReferences()', () => {
		const linter = new DocletValidator( [ {
			kind: 'class',
			longname: 'module:utils/emittermixin~EmitterMixin',
			see: [
				'module:utils/emittermixin~EmitterMixin#constructor',
			],
			meta: { fileName: '',  path: '' },
		}, {
			kind: 'member',
			longname: 'module:utils/emittermixin~EmitterMixin#constructor',
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintSeeReferences();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( 'lintSeeReferences() - invalid', () => {
		const linter = new DocletValidator( [ {
			kind: 'class',
			see: [
				'module:utils/emittermixin~EmitterMixin',
			],
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintSeeReferences();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	it( '_lintTypedefs()', () => {
		const linter = new DocletValidator( [ {
			type: 'typedef',
			properties: [ {
				type: {
					names: [
						'String',
						'Map.<String>'
					]
				},
			} ],
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintTypedefs();

		expect( linter._errors.length ).to.be.equal( 0 );
	} );

	it( '_lintTypedefs() - invalid', () => {
		const linter = new DocletValidator( [ {
			type: 'typedef',
			properties: [ {
				type: {
					names: [
						'Abc'
					]
				},
			} ],
			meta: { fileName: '',  path: '' },
		} ], testedModules );

		linter._lintTypedefs();

		expect( linter._errors.length ).to.be.equal( 1 );
	} );

	describe( '_isCorrectType', () => {
		it( 'Should validate union type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'String|Array' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'Array.<Node>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic union type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'Array.<Object|String>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate union type with parenthesis', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'Array.<(Object|String)>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate incorrect union type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'Array.<(Object|IncorrectType)>' );

			expect( result ).to.be.equal( false );
		} );

		it( 'Should validate full path to class', () => {
			const linter = new DocletValidator( [ {
				longname: 'module:core/editor~Editor',
				kind: 'function',
				meta: { fileName: '',  path: '' },
			} ], testedModules );

			const result = linter._isCorrectType( 'Array.<module:core/editor~Editor>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'Array.<*>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate invalid generic type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'String.<Boolean>' );

			expect( result ).to.be.equal( false );
		} );

		it( 'Should validate string literal type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( '\'forward\'' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic type with more than one template type', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( 'Object.<String, Number | Boolean>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should accept spaces', () => {
			const linter = new DocletValidator( [] );
			const result = linter._isCorrectType( ' String | Number | Boolean ' );

			expect( result ).to.be.equal( true );
		} );
	} );
} );
