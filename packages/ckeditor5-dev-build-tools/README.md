CKEditor 5 Build Tools
====================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-build-tools.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

This package can be used to build CKEditor 5 plugins compatible with the [new installation methods](https://github.com/ckeditor/ckeditor5/issues/15502), while the source code is still written for the old methods. It overrides the imports during the build process to make the plugin compatible with the new installation methods.

## API

This package can be used as a CLI tool or via the JavaScript API.

### CLI

The CLI tool can be used as follows:

```bash
npx @ckeditor/ckeditor5-dev-build-tools \
  --input=src/index.js \
	--output=dist/index.js \
	--source-map # Other options
```

### JavaScript API

The JavaScript API can be used as follows:

```javascript
import { build } from '@ckeditor/ckeditor5-dev-build-tools';

await build( {
	input: 'src/index.js',
	output: 'dist/index.js',
	sourceMap: true,
	// Other options
} );
```

### Options

#### `input` / `--input=[path]`

**Type:** `string`
**Default value:** `src/index.ts`

The path to the input file.

#### `output` / `--output=[path]`

**Type:** `string`
**Default value:** `dist/index.js`

The path to the output file. All other assets like CSS files, translations, source maps, etc. will be saved in the same directory. When used with the `clean` options, this path will be used to determine the directory to delete.

#### `tsconfig` / `--tsconfig=[path]`

**Type:** `string`
**Default value:** `tsconfig.json`

The path to the TypeScript configuration file. This option can be ignored if the project does not use TypeScript.

#### `banner` / `--banner=[path]`

**Type:** `string`
**Default value:** `''`

The path to the banner file. This file must export a variable named `banner`, which is a string that is added to the beginning of the `.js`, `.css`, and `.d.ts` files. The banner content must not violate JavaScript or CSS syntax.

**Example of the banner file:**

```javascript
export const banner =
`/**
 * This is a custom banner that uses comment syntax valid in both JavaScript and CSS.
 */
`;
```

#### `translations` / `--translations=[path]`

**Type:** `string`
**Default value:** `''`

Glob-compliant path to the translation files. This option can be ignored if the plugin doesn't provide translations.

**Example value:** `**/*.po`

#### `declarations` / `--declarations`

**Type:** `boolean`
**Default value:** `false`

Whether to generate TypeScript declaration files.

#### `sourceMap` / `--source-map`

**Type:** `boolean`
**Default value:** `false`

Whether to generate a source map.

#### `minify` / `--minify`

**Type:** `boolean`
**Default value:** `false`

Whether to minify the output.

#### `clean` / `--clean`

**Type:** `boolean`
**Default value:** `false`

Whether to clean the output directory before building. The directory to clean is based on the `output` option.

#### `browser` / `--browser`

**Type:** `boolean`
**Default value:** `false`

Whether to build the CKEditor5 plugin for the browser. This option will cause the tool to output an ESM and UMD bundles that can be used in the browser. Additionally, some of the imports in the output files will be slightly different compared to the Node.js build.

If this option is enabled, the `name` option must be specified.

#### `name` / `--name=[name]`

**Type:** `string`
**Default value:** `''`

The name of the UMD bundle. This name will be used as the global variable name when the bundle is loaded in the browser.

This option is required if the `browser' option is enabled.

#### `external` / `--external=[path]`

**Type:** `string[]` | `string`
**Default value:** `[]`

A list of external dependencies that should not be bundled.

The list of external dependencies is automatically extended to include all dependencies of `ckeditor5` and `ckeditor5-premium-features` if they are provided as external dependencies. For example, if your plugin uses `@ckeditor/ckeditor5-core` and `@ckeditor/ckeditor5-engine`, you can specify `ckeditor5` in the `external` option to exclude them from the bundle.

When using the CLI, this option can be used multiple times.

**Example value:** `--external=lodash --external=moment`

When using the JavaScript API, the option must be an array.

**Example value:** `external: [ 'lodash', 'moment' ]`

#### `rewrite`

**Type:** `string[]`
**Default value:** `[]`

A list of imports to rewrite in the output file. This option can be used if one of the dependencies provided in `external` has a separate build for the new install methods that should be used instead of the one used in the source code.

This option is only available for the JavaScript API.

**Example value:** `rewrite: [ 'dependency', 'dependency/dist/index.js' ]`

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-bump-year/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
