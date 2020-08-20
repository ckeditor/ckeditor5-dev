/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const RuleTester = require( 'eslint' ).RuleTester;

const ruleTester = new RuleTester( { parserOptions: { sourceType: 'module', ecmaVersion: 2015 } } );

const importError = { message: 'Imports of CKEditor5 packages shouldn\'t be relative.' };

ruleTester.run( 'eslint-plugin-ckeditor5-rules/no-relative-imports', require( '../lib/rules/no-relative-imports' ), {
	valid: [
		'import Foo from \'../foo\';',
		'import Foo from \'../../foo\';',
		'import Position from \'@ckeditor5/ckeditor5-engine/src/model/position\';'
	],
	invalid: [
		{
			code: 'import Position from \'../ckeditor5-engine/src/model/position\';',
			output: 'import Position from \'@ckeditor/ckeditor5-engine/src/model/position\';',
			errors: [ importError ]
		},
		{
			code: 'import Foo from \'../ckeditor5-media-embed/src/foo\';',
			output: 'import Foo from \'@ckeditor/ckeditor5-media-embed/src/foo\';',
			errors: [ importError ]
		},
		{
			code: 'import Position from \'../../ckeditor5-engine/src/model/position\';',
			output: 'import Position from \'@ckeditor/ckeditor5-engine/src/model/position\';',
			errors: [ importError ]
		},
		{
			code: 'import Position from \'../../../../../../../../../../ckeditor5-engine/src/model/position\';',
			output: 'import Position from \'@ckeditor/ckeditor5-engine/src/model/position\';',
			errors: [ importError ]
		}
	]
} );

ruleTester.run( 'eslint-plugin-ckeditor5-rules/ckeditor-error-message', require( '../lib/rules/ckeditor-error-message' ), {
	valid: [
		'/**\n' +
		' * The {@link module:utils/collection~Collection#add `Collection#add()`} method was called without\n' +
		' * an item. This method always needs to be executed with an item. And so on...\n' +
		' *\n' +
		' * @error collection-add-called-without-an-item\n' +
		' */\n' +
		'throw new CKEditorError( \'collection-add-called-without-an-item\', this );'
	],
	invalid: [
		// Deprecated message id with a semicolon after error id.
		{
			code:
				'/**\n' +
				' * Missing item.\n' +
				' *\n' +
				' * @error collection-add-invalid-call\n' +
				' */\n' +
				'throw new CKEditorError( \'collection-add-invalid-call: Missing item.\', this );',
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},
		// No @error clause.
		{
			code:
				'/**\n' +
				' * Missing item.\n' +
				' */\n' +
				'throw new CKEditorError( \'collection-add-invalid-call: Missing item.\', this );',
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},
		// Wrong ID format - not in lower case.
		{
			code:
				'/**\n' +
				' * Missing item.\n' +
				' *\n' +
				' * @error CoLlEcTiOn-Add-INVALID-call\n' +
				' */\n' +
				'throw new CKEditorError( \'CoLlEcTiOn-Add-INVALID-call\', this );',
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},
		// Wrong ID format - a sentence.
		{
			code:
				'/**\n' +
				' * Missing item.\n' +
				' *\n' +
				' * @error CoLlEcTiOn-Add-INVALID-call\n' +
				' */\n' +
				'throw new CKEditorError( \'Collection add invalid call\', this );',
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		}

		// Error id & @error clause mismatch.
		// {
		// 	code:
		// 		'/**\n' +
		// 		' * Missing item.\n' +
		// 		' *\n' +
		// 		' * @error some-other-error\n' +
		// 		' */\n' +
		// 		'throw new CKEditorError( \'collection-add-invalid-call\', this );',
		// 	errors: [
		// 		{ messageId: 'invalidMessageFormat' }
		// 	]
		// },
	]
} );
