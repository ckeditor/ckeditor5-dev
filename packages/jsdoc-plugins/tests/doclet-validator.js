/**
 * @license Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const DocletValidator = require( '../lib/validator/doclet-validator.js' );

// TODO - These tests should be rewritten to use doclets created from the API docs extraction.
describe( 'jsdoc-plugins/Validator', () => {
	it( '_validateMembers()', () => {
		const validator = new DocletValidator( [ {
			kind: 'member',
			name: 'module:ckeditor5/wrong_path',
			scope: 'inner',
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateMembers();

		expect( validator.errors.length ).to.be.equal( 1 );
	} );

	describe( '_validateMemberofProperty()', () => {
		it( 'should emit error if the doclet comes from inner variable', () => {
			const validator = new DocletValidator( [ {
				kind: 'member',
				name: 'module:ckeditor5/path',
				memberof: '<anonymous>',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateMemberofProperty();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );

		it( 'should emit error if the doclet contains invalid `memberof` property', () => {
			const validator = new DocletValidator( [ {
				kind: 'member',
				name: 'module:ckeditor5/wrong_path',
				memberof: 'wrongMemberof',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateMemberofProperty();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );

		it( 'should not emit error when the doclets\' `memberof` starts with `module:`', () => {
			const validator = new DocletValidator( [ {
				kind: 'member',
				name: 'module:ckeditor5/editor',
				memberof: 'module:ckeditor5/editor',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateMemberofProperty();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should emit error if the doclet comes from undocumented code', () => {
			const validator = new DocletValidator( [ {
				kind: 'member',
				undocumented: 'true',
				name: '⌘',
				memberof: 'macGlyphsToModifiers',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateMemberofProperty();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );
	} );

	describe( 'linting function parameters', () => {
		it( 'should handle not existing types', () => {
			const validator = new DocletValidator( [ {
				kind: 'function',
				params: [ {
					type: {
						names: [ 'module:engine/ckeditor5/editor' ]
					}
				} ],
				longname: 'abc',
				scope: 'inner',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateParameters();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );

		it( 'should log an error if a module is passed as parameter type', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: {
						names: [ 'module:engine/ckeditor5/editor' ]
					}
				} ],
				meta: { fileName: '', path: '' }
			}, {
				kind: 'module',
				longname: 'module:engine/ckeditor5/editor',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateParameters();

			expect( validator.errors.length ).to.be.equal( 1 );
			expect( validator.errors[ 0 ].message ).to.equal( 'Incorrect param type: module:engine/ckeditor5/editor' );
		} );

		it( 'should not log an error if an allowed member is passed as parameter type', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: {
						names: [ 'module:engine/foo~ClassFoo' ]
					}
				}, {
					type: {
						names: [ 'module:engine/foo~InterfaceBar' ]
					}
				}, {
					type: {
						names: [ 'module:engine/foo~TypedefBaz' ]
					}
				}, {
					type: {
						names: [ 'module:engine/foo~FunctionAbc' ]
					}
				} ],
				meta: { fileName: '', path: '' }
			}, {
				kind: 'class',
				longname: 'module:engine/foo~ClassFoo',
				meta: { fileName: '', path: '' }
			}, {
				kind: 'interface',
				longname: 'module:engine/foo~InterfaceBar',
				meta: { fileName: '', path: '' }
			}, {
				kind: 'typedef',
				longname: 'module:engine/foo~TypedefBaz',
				meta: { fileName: '', path: '' }
			}, {
				kind: 'function',
				longname: 'module:engine/foo~FunctionAbc',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateParameters();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should handle built-in types', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: {
						names: [
							'String',
							'Array',
							'Number'
						]
					}
				} ],
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateParameters();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should log an error if an incorrect type is passed', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				params: [ {
					type: {
						names: [
							'String',
							'Array',
							'Wrong'
						]
					}
				} ],
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateParameters();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );
	} );

	describe( 'linting links', () => {
		it( 'should validate links and adds errors if they are incorrect', () => {
			const validator = new DocletValidator( [ {
				comment:
					`* {@link module:utils/a~A#method1}
					* {@link module:utils/b~Some1} `,
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 2 );
		} );

		it( 'should not produce errors if links are correct', () => {
			const validator = new DocletValidator( [ {
				comment:
					`/** Linking test:\n *\n * * a:\n *
					* {@link module:ckeditor5/a~A} `,
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~A',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should validate links with name', () => {
			const validator = new DocletValidator( [ {
				comment: ' {@link module:ckeditor5/a~A classA} ',
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~A',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should validate links with white spaces', () => {
			const validator = new DocletValidator( [ {
				comment: ' {@link \n module:ckeditor5/a~A \n\t classA} ',
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~A',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should validate links with multi-word link', () => {
			const validator = new DocletValidator( [ {
				comment: ' {@link module:ckeditor5/a~A with multi word link} ',
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~A',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should validate links that contain double link keyword', () => {
			const validator = new DocletValidator( [ {
				comment: '{@link @link module:ckeditor5/a~A with multi word link} ',
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~A',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 1 );
			expect( validator.errors[ 0 ].message ).to.match( /Incorrect link:/ );
		} );

		it( 'should validate links that does not contain the @link part', () => {
			const validator = new DocletValidator( [ {
				comment: `
				@param {module:ckeditor5/a~A}
				@returns {module:ckeditor5/a~A}
				Correct link: {@link module:ckeditor5/a~A}
				Random comment: {priority: 'high'}
				Invalid link: {module:ckeditor5/a~B}
				`,
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~A',
				meta: { fileName: '', path: '' }
			}, {
				comment: '',
				longname: 'module:ckeditor5/a~B',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.be.equal( 1 );
			expect( validator.errors[ 0 ].message ).to.match( /Link misses the '@link' part: \{module:ckeditor5\/a~B\}/ );
		} );

		it( 'should validate comment without any link', () => {
			const validator = new DocletValidator( [ {
				comment: 'Some comment without any valid nor invalid link',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateLinks();

			expect( validator.errors.length ).to.equal( 0 );
		} );
	} );

	describe( 'linting extensibility', () => {
		it( 'should assert that the type in the `@extends` tag exsits (positive)', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				longname: 'module:abc/SomeClass',
				augments: [ 'module:abc/SomeOtherClass' ],
				meta: { fileName: '', path: '' }
			}, {
				kind: 'class',
				longname: 'module:abc/SomeOtherClass',
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateExtensibility();

			expect( validator.errors.length ).to.equal( 0 );
		} );

		it( 'should assert that the type in the `@extends` tag exsits (negative)', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				longname: 'module:abc/SomeClass',
				augments: [ 'module:abc/SomeOtherClass' ],
				meta: { fileName: '', path: '' }
			} ] );

			validator._validateExtensibility();

			expect( validator.errors.length ).to.equal( 1 );
			expect( validator.errors[ 0 ].message ).to.equal( 'Invalid @extends reference: module:abc/SomeOtherClass.' );
		} );
	} );

	describe( 'linting events', () => {
		it( 'should assert that references in `fires` exist (positive)', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				longname: 'module:abc/SomeClass',
				meta: { fileName: '', path: '' },
				fires: [ 'someEvent' ]
			} ] );

			validator._validateEvents();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );

		it( 'should assert that references in `fires` exist (negative)', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				longname: 'module:abc/SomeClass',
				meta: { fileName: '', path: '' },
				fires: [ 'module:abc/SomeClass#event:someEvent' ]
			}, {
				kind: 'event',
				longname: 'module:abc/SomeClass#event:someEvent'
			} ] );

			validator._validateEvents();

			expect( validator.errors.length ).to.be.equal( 0 );
		} );

		it( 'should assert that references in `fires` are only events', () => {
			const validator = new DocletValidator( [ {
				kind: 'class',
				longname: 'module:abc/SomeClass',
				meta: { fileName: '', path: '' },
				fires: [ 'module:abc/SomeClass#event:someEvent' ]
			}, {
				kind: 'not-event',
				longname: 'module:abc/SomeClass#event:someEvent'
			} ] );

			validator._validateEvents();

			expect( validator.errors.length ).to.be.equal( 1 );
		} );
	} );

	it( '_validateModuleDocumentedExports() - show errors', () => {
		const validator = new DocletValidator( [ {
			kind: 'member',
			scope: 'inner',
			memberof: 'module:utils/emittermixin',
			meta: { fileName: '', path: '' }
		}, {
			kind: 'module',
			longname: 'module:utils/emittermixin',
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateModuleDocumentedExports();

		expect( validator.errors.length ).to.be.equal( 1 );
	} );

	it( '_validateModuleDocumentedExports()', () => {
		const validator = new DocletValidator( [ {
			kind: 'member',
			scope: 'inner',
			memberof: 'module:utils/emittermixin~EmitterMixin',
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateModuleDocumentedExports();

		expect( validator.errors.length ).to.be.equal( 0 );
	} );

	it( 'lintSeeReferences()', () => {
		const validator = new DocletValidator( [ {
			kind: 'class',
			longname: 'module:utils/emittermixin~EmitterMixin',
			see: [
				'module:utils/emittermixin~EmitterMixin#constructor'
			],
			meta: { fileName: '', path: '' }
		}, {
			kind: 'member',
			longname: 'module:utils/emittermixin~EmitterMixin#constructor',
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateSeeReferences();

		expect( validator.errors.length ).to.be.equal( 0 );
	} );

	it( 'lintSeeReferences() - invalid', () => {
		const validator = new DocletValidator( [ {
			kind: 'class',
			see: [
				'module:utils/emittermixin~EmitterMixin'
			],
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateSeeReferences();

		expect( validator.errors.length ).to.be.equal( 1 );
	} );

	it( '_validateTypedefs()', () => {
		const validator = new DocletValidator( [ {
			type: 'typedef',
			properties: [ {
				type: {
					names: [
						'String',
						'Map.<String>'
					]
				}
			} ],
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateTypedefs();

		expect( validator.errors.length ).to.be.equal( 0 );
	} );

	it( '_validateTypedefs() - invalid', () => {
		const validator = new DocletValidator( [ {
			type: 'typedef',
			properties: [ {
				type: {
					names: [
						'Abc'
					]
				}
			} ],
			meta: { fileName: '', path: '' }
		} ] );

		validator._validateTypedefs();

		expect( validator.errors.length ).to.be.equal( 1 );
	} );

	describe( '_isCorrectType', () => {
		it( 'Should validate union type', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'String|Array' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic type (Array.<Node>)', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'Array.<Node>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic union type', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'Array.<Object|String>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate union type with parenthesis', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'Array.<(Object|String)>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate incorrect union type', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'Array.<(Object|IncorrectType)>' );

			expect( result ).to.be.equal( false );
		} );

		it( 'Should validate full path to class', () => {
			const validator = new DocletValidator( [ {
				longname: 'module:core/editor~Editor',
				kind: 'function',
				meta: { fileName: '', path: '' }
			} ] );

			const result = validator._isCorrectType( 'Array.<module:core/editor~Editor>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic type (Array)', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'Array.<*>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate invalid generic type', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'String.<Boolean>' );

			expect( result ).to.be.equal( false );
		} );

		it( 'Should validate string literal type', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( '\'forward\'' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should validate generic type with more than one template type', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( 'Object.<String, Number | Boolean>' );

			expect( result ).to.be.equal( true );
		} );

		it( 'Should accept spaces', () => {
			const validator = new DocletValidator( [] );
			const result = validator._isCorrectType( ' String | Number | Boolean ' );

			expect( result ).to.be.equal( true );
		} );
	} );
} );
