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

const validJSDoc = '/**\n' +
	' * This method always needs to be executed with an item. And so on...\n' +
	' *\n' +
	' * @error method-id-is-kebab\n' +
	' */\n';

const validThrow = 'throw new CKEditorError( \'method-id-is-kebab\', this );\n';

ruleTester.run( 'eslint-plugin-ckeditor5-rules/ckeditor-error-message', require( '../lib/rules/ckeditor-error-message' ), {
	valid: [
		validJSDoc + validThrow,

		// // Annotation in other place in the source code (before).
		validJSDoc +
		'if ( fooBar ) {\n' +
		'\t' + validThrow +
		'}',

		// Annotation in other place in the source code (after).
		validThrow + validJSDoc,

		'/**\n' +
		' * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.\n' +
		' * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license\n' +
		' */\n' +
		'\n' +
		'/**\n' +
		' * @module utils/ckeditorerror\n' +
		' */\n' +
		'\n' +
		'/**\n' +
		' * URL to the documentation with error codes.\n' +
		' */\n' +
		'export const DOCUMENTATION_URL =\n' +
		'\t\'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/error-codes.html\';\n' +
		'\n' +
		'/**\n' +
		' * The CKEditor error class.\n' +
		' *\n' +
		' * You should throw `CKEditorError` when:\n' +
		' *\n' +
		' * * An unexpected situation occurred and the editor (most probably) will not work properly. Such exception will be handled\n' +
		' * by the {@link module:watchdog/watchdog~Watchdog watchdog} (if it is integrated),\n' +
		' * * If the editor is incorrectly integrated or the editor API is used in the wrong way. This way you will give\n' +
		' * feedback to the developer as soon as possible. Keep in mind that for common integration issues which should not\n' +
		' * stop editor initialization (like missing upload adapter, wrong name of a toolbar component) we use `console.warn()` with\n' +
		' * {@link module:utils/ckeditorerror~attachLinkToDocumentation `attachLinkToDocumentation()`}\n' +
		' * to improve developers experience and let them see the working editor as soon as possible.\n' +
		' *\n' +
		' *\t\t/**\n' +
		' *\t\t * Error thrown when a plugin cannot be loaded due to JavaScript errors, lack of plugins with a given name, etc.\n' +
		' *\t\t *\n' +
		' *\t\t * @error plugin-load\n' +
		' *\t\t * @param pluginName The name of the plugin that could not be loaded.\n' +
		' *\t\t * @param moduleName The name of the module which tried to load this plugin.\n' +
		' *\t\t * /\n' +
		' *\t\tthrow new CKEditorError( \'plugin-load: It was not possible to load the "{$pluginName}" plugin in module "{$moduleName}\', {\n' +
		' *\t\t\tpluginName: \'foo\',\n' +
		' *\t\t\tmoduleName: \'bar\'\n' +
		' *\t\t} );\n' +
		' *\n' +
		' * @extends Error\n' +
		' */\n' +
		'export default class CKEditorError extends Error {\n' +
		'\t/**\n' +
		'\t * Creates an instance of the CKEditorError class.\n' +
		'\t *\n' +
		'\t * @param {String} message The error message in an `error-name: Error message.` format.\n' +
		'\t * During the minification process the "Error message" part will be removed to limit the code size\n' +
		'\t * and a link to this error documentation will be added to the `message`.\n' +
		'\t * @param {Object|null} context A context of the error by which the {@link module:watchdog/watchdog~Watchdog watchdog}\n' +
		'\t * is able to determine which editor crashed. It should be an editor instance or a property connected to it. It can be also\n' +
		'\t * a `null` value if the editor should not be restarted in case of the error (e.g. during the editor initialization).\n' +
		'\t * The error context should be checked using the `areConnectedThroughProperties( editor, context )` utility\n' +
		'\t * to check if the object works as the context.\n' +
		'\t * @param {Object} [data] Additional data describing the error. A stringified version of this object\n' +
		'\t * will be appended to the error message, so the data are quickly visible in the console. The original\n' +
		'\t * data object will also be later available under the {@link #data} property.\n' +
		'\t */\n' +
		'\tconstructor( message, context, data ) {\n' +
		'\t\tmessage = attachLinkToDocumentation( message );\n' +
		'\n' +
		'\t\tif ( data ) {\n' +
		'\t\t\tmessage += \' \' + JSON.stringify( data );\n' +
		'\t\t}\n' +
		'\n' +
		'\t\tsuper( message );\n' +
		'\n' +
		'\t\t/**\n' +
		'\t\t * @type {String}\n' +
		'\t\t */\n' +
		'\t\tthis.name = \'CKEditorError\';\n' +
		'\n' +
		'\t\t/**\n' +
		'\t\t * A context of the error by which the Watchdog is able to determine which editor crashed.\n' +
		'\t\t *\n' +
		'\t\t * @type {Object|null}\n' +
		'\t\t */\n' +
		'\t\tthis.context = context;\n' +
		'\n' +
		'\t\t/**\n' +
		'\t\t * The additional error data passed to the constructor. Undefined if none was passed.\n' +
		'\t\t *\n' +
		'\t\t * @type {Object|undefined}\n' +
		'\t\t */\n' +
		'\t\tthis.data = data;\n' +
		'\t}\n' +
		'\n' +
		'\t/**\n' +
		'\t * Checks if the error is of the `CKEditorError` type.\n' +
		'\t */\n' +
		'\tis( type ) {\n' +
		'\t\treturn type === \'CKEditorError\';\n' +
		'\t}\n' +
		'\n' +
		'\t/**\n' +
		'\t * A utility that ensures the the thrown error is a {@link module:utils/ckeditorerror~CKEditorError} one.\n' +
		'\t * It is useful when combined with the {@link module:watchdog/watchdog~Watchdog} feature, which can restart the editor in case\n' +
		'\t * of a {@link module:utils/ckeditorerror~CKEditorError} error.\n' +
		'\t *\n' +
		'\t * @param {Error} err An error.\n' +
		'\t * @param {Object} context An object connected through properties with the editor instance. This context will be used\n' +
		'\t * by the watchdog to verify which editor should be restarted.\n' +
		'\t */\n' +
		'\tstatic rethrowUnexpectedError( err, context ) {\n' +
		'\t\tif ( err.is && err.is( \'CKEditorError\' ) ) {\n' +
		'\t\t\tthrow err;\n' +
		'\t\t}\n' +
		'\n' +
		'\t\t/**\n' +
		'\t\t * An unexpected error occurred inside the CKEditor 5 codebase. This error will look like the original one\n' +
		'\t\t * to make the debugging easier.\n' +
		'\t\t *\n' +
		'\t\t * This error is only useful when the editor is initialized using the {@link module:watchdog/watchdog~Watchdog} feature.\n' +
		'\t\t * In case of such error (or any {@link module:utils/ckeditorerror~CKEditorError} error) the watchdog should restart the editor.\n' +
		'\t\t *\n' +
		'\t\t * @error unexpected-error\n' +
		'\t\t */\n' +
		'\t\tconst error = new CKEditorError( err.message, context );\n' +
		'\n' +
		'\t\t// Restore the original stack trace to make the error look like the original one.\n' +
		'\t\t// See https://github.com/ckeditor/ckeditor5/issues/5595 for more details.\n' +
		'\t\terror.stack = err.stack;\n' +
		'\n' +
		'\t\tthrow error;\n' +
		'\t}\n' +
		'}\n' +
		'\n' +
		'/**\n' +
		' * Attaches the link to the documentation at the end of the error message. Use whenever you log a warning or error on the\n' +
		' * console. It is also used by {@link module:utils/ckeditorerror~CKEditorError}.\n' +
		' *\n' +
		' *\t\t /**\n' +
		' *\t\t  * There was a problem processing the configuration of the toolbar. The item with the given\n' +
		' *\t\t  * name does not exist so it was omitted when rendering the toolbar.\n' +
		' *\t\t  *\n' +
		' *\t\t  * @error toolbarview-item-unavailable\n' +
		' *\t\t  * @param {String} name The name of the component.\n' +
		' *\t\t  * /\n' +
		' *\t\t console.warn( attachLinkToDocumentation(\n' +
		' *\t\t \t\'toolbarview-item-unavailable: The requested toolbar item is unavailable.\' ), { name } );\n' +
		' *\n' +
		' * @param {String} message Message to be logged.\n' +
		' * @returns {String}\n' +
		' */\n' +
		'export function attachLinkToDocumentation( message ) {\n' +
		'\tconst matchedErrorName = message.match( /^([^:]+):/ );\n' +
		'\n' +
		'\tif ( !matchedErrorName ) {\n' +
		'\t\treturn message;\n' +
		'\t}\n' +
		'\n' +
		'\treturn message + ` Read more: ${ DOCUMENTATION_URL }#error-${ matchedErrorName[ 1 ] }\\n`;\n' +
		'}\n'
	],
	invalid: [
		// Deprecated message id with a semicolon after error id.
		{
			code:
				validJSDoc +
				'throw new CKEditorError( \'method-id-is-kebab: Missing item.\', this );\n',
			output: validJSDoc + validThrow,
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},

		// Wrong ID format - not in lower case.
		{
			code:
				validJSDoc +
				'throw new CKEditorError( \'METHOD-ID-IS-KEBAB\', this );\n',
			output: validJSDoc + validThrow,
			errors: [
				{ messageId: 'invalidMessageFormat' }
			]
		},
		// Wrong ID format - a sentence.
		{
			code:

				validJSDoc +
				'throw new CKEditorError( \'Method ID is kebab\', this );\n',
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
