/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { RuleTester } = require( 'eslint' );

const validJSDoc = '/**\n' +
	' * This method always needs to be executed with an item. And so on...\n' +
	' *\n' +
	' * @error method-id-is-kebab\n' +
	' */\n';

const validThrow = 'throw new CKEditorError( \'method-id-is-kebab\', this );\n';

const ruleTester = new RuleTester( { parserOptions: { sourceType: 'module', ecmaVersion: 2018 } } );
ruleTester.run( 'eslint-plugin-ckeditor5-rules/ckeditor-error-message', require( '../lib/rules/ckeditor-error-message' ), {
	valid: [
		validJSDoc + validThrow,

		// Annotation in other place in the source code (before).
		validJSDoc +
		'if ( fooBar ) {\n' +
		'\t' + validThrow +
		'}',

		// Annotation in other place in the source code (after).
		validThrow + validJSDoc,

		// Error assigned to a variable.
		'/**\n' +
		' * This method always needs to be executed with an item. And so on...\n' +
		' *\n' +
		' * @error method-id-is-kebab\n' +
		' */\n' +
		'const error = new CKEditorError( \'method-id-is-kebab\', this );\n' +
		'throw error\n',

		// CKEditor error re-throw case.
		'/**\n' +
		' * An unexpected error occurred inside the CKEditor 5 codebase. This error will look like the original one\n' +
		' * to make the debugging easier.\n' +
		' *\n' +
		' * @error unexpected-error\n' +
		' */\n' +
		'const error = new CKEditorError( err.message, context );\n'
	],
	invalid: [
		// Deprecated message id with a semicolon after error id.
		{
			code: validJSDoc +
				'throw new CKEditorError( \'method-id-is-kebab: Missing item.\', this );\n',
			output: validJSDoc + validThrow,
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},

		// Wrong ID format - not in lower case.
		{
			code: validJSDoc +
				'throw new CKEditorError( \'METHOD-ID-IS-KEBAB\', this );\n',
			output: validJSDoc + validThrow,
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},
		// Wrong ID format - a sentence.
		{
			code: validJSDoc +
				'throw new CKEditorError( \'Method ID is kebab\', this );\n',
			output: validJSDoc + validThrow,
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},
		// Wrong ID format - multiple string concatenation.
		{
			code: validJSDoc +
				'throw new CKEditorError( \'method-id-is-kebab:\' + \'This\' + \' is \' + \'wrong!\', this );\n',
			output: validJSDoc + validThrow,
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
				'throw new CKEditorError( \'method-id-is-kebab\', this );\n',
			errors: [
				{ messageId: 'missingErrorAnnotation' }
			]
		},

		// Error id & @error clause mismatch.
		{
			code:
				'/**\n' +
				' * Missing item.\n' +
				' *\n' +
				' * @error some-other-error\n' +
				' */\n' +
				'throw new CKEditorError( \'method-id-is-kebab\', this );\n',
			errors: [
				{ messageId: 'missingErrorAnnotation' }
			]
		}
	]
} );
