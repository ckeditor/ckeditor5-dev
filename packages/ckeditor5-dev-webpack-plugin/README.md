CKEditor 5 Webpack plugin
=========================

Intergrate [CKEditor 5](https://ckeditor.com)'s build process with your [webpack](https://webpack.js.org) setup.

Requires webpack ^4.0.0.

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

The current functionality of this plugin is limited to localizing the editor builds. Add this plugin to your webpack config to change the language of the editor's interface or build the editor with support for multiple languages (by extracting multiple language files):

```js
const CKEditorWebpackPlugin = require( '@ckeditor/ckeditor5-dev-webpack-plugin' );

// Define webpack plugins ...
	plugins: [
		new CKEditorWebpackPlugin( {
			// Main language that will be built into the main bundle.
			language: 'en',

			// Additional languages that will be emitted to the `outputDirectory`.
			// This option can be set to an array of language codes or `'all'` to build all found languages.
			// The bundle is optimized for one language when this option is omitted.
			additionalLanguages: 'all',

			// Optional directory for emitted translations. Relative to the webpack's output.
			// Defaults to `'translations'`.
			// outputDirectory: 'ckeditor5-translations',

			// Whether the build process should fail if an error occurs.
			// Defaults to `false`.
			// strict: true,

			// Whether to log all warnings to the console.
			// Defaults to `false`.
			// verbose: true
		} ),

		// Other webpack plugins...
	]
// ...
```

You can read more about localizing the editor in the [Setting the UI language](https://docs.ckeditor.com/ckeditor5/latest/features/ui-language.html) guide.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-webpack-plugin/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
