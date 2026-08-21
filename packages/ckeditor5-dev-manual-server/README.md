CKEditor 5 manual server
=======================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-manual-server.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

Used to extend Vite to create a manual test server for CKEditor 5.

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Loading translations

Pass a language code to `manualTestsPlugin()` to load and combine that language's TypeScript translation files from the configured package paths. The selected language becomes the default UI and content language for editors and contexts created by manual tests.

An explicit language in an editor or context configuration still takes precedence.

```ts
manualTestsPlugin( {
	paths: [ 'packages/*' ],
	language: process.env.CK_LANGUAGE || 'en'
} )
```

For example, start the manual test server in Polish using `CK_LANGUAGE=pl pnpm manual`.

## Preserving production CSS order

Vite may order extracted stylesheets differently from their source imports in multi-page production builds. Add `productionCssOrderPlugin()` to keep the CSS cascade consistent with the bundled development server:

```ts
import { defineConfig } from 'vite';
import {
	manualTestsPlugin,
	productionCssOrderPlugin
} from '@ckeditor/ckeditor5-dev-manual-server';

export default defineConfig( {
	plugins: [
		productionCssOrderPlugin(),
		manualTestsPlugin( {
			paths: [ 'packages/*' ]
		} )
	]
} );
```

The plugin runs only during production builds. It loads CSS through JavaScript side effects and enables Rolldown's strict execution order so those effects follow the source import order.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-manual-server/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
