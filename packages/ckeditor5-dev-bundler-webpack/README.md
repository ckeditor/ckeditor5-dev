CKEditor 5 Webpack bundler task
==============================

Gulp task which can be used to build a [CKEditor 5](https://ckeditor5.github.io) bundle using [Webpack](https://webpack.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-bundler-webpack
```

Include development task in your `gulpfile.js`:

```js
const gulp = require( 'gulp' );

gulp.task( 'build', () => {
	const path = require( 'path' );
	const tasks = require( '@ckeditor/ckeditor5-dev-bundler-webpack' );
	const getWebpackES6Config = require( '@ckeditor/ckeditor5-dev-bundler-webpack/lib/utils/getwebpackes6config' );
	const webpackConfig = getWebpackES6Config( {
		cwd: process.cwd(),
		moduleName: 'ClassicEditor',
		entryPoint: 'ckeditor.js',
		destinationPath: path.join( process.cwd(), 'build' )
	} );
	return tasks.runWebpack( webpackConfig )
} );
```

An example entry point can look like:

```js
/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */
 
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classic';
import ArticlePlugin from '@ckeditor/ckeditor5-presets/src/article';

export default class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.build = {
	plugins: [ ArticlePlugin ],
	config: {
		toolbar: [
			'image',
			'headings'
		]
	}
};
```

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
