/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const RuleTester = require( 'eslint' ).RuleTester;

const importError = { message: 'Imports of CKEditor5 packages shouldn\'t be relative.' };

const ruleTester = new RuleTester( { parserOptions: { sourceType: 'module', ecmaVersion: 2018 } } );
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
