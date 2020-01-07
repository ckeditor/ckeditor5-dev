/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const rule = require( '../lib/rules/no-relative-imports' );
const RuleTester = require( 'eslint/lib/testers/rule-tester' );

const ruleTester = new RuleTester( { parserOptions: { sourceType: 'module' } } );

const importError = { message: 'Imports of CKEditor5 packages shouldn\'t be relative.' };

ruleTester.run( 'eslint-plugin-ckeditor5-rules/no-relative-imports', rule, {
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
