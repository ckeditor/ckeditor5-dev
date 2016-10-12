CKEditor 5 Development Environment Tasks
========================================

[![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-env/dev-status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-env?type=dev)
[![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-env/status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-env)
[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-env.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)

Tasks used during development of [CKEditor 5](https://ckeditor5.github.io). More information about the project can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev-env>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Description of each development task can be found here: <https://github.com/ckeditor/ckeditor5/wiki/Development-Workflow>.

To include development tasks in your `gulpfile.js`:

```js
const config = {
	WORKSPACE_DIR: '..'
};
const ckeditor5DevEnv = require( '@ckeditor/ckeditor5-dev-env' )( config );

gulp.task( 'init', ckeditor5DevEnv.initRepository );
gulp.task( 'create-package', ckeditor5DevEnv.createPackage );
gulp.task( 'update', ckeditor5DevEnv.updateRepositories );
gulp.task( 'pull', ckeditor5DevEnv.updateRepositories );
gulp.task( 'status', ckeditor5DevEnv.checkStatus );
gulp.task( 'st', ckeditor5DevEnv.checkStatus );
gulp.task( 'relink', ckeditor5DevEnv.relink );
gulp.task( 'install', ckeditor5DevEnv.installPackage );
gulp.task( 'exec', ckeditor5DevEnv.execOnRepositories );
```

## Testing

Tests:

```
npm test
```

Code coverage:

```
npm run coverage
```

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
