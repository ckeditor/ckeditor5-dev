/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import upath from 'upath';

import { validateLicenseFiles } from '@ckeditor/ckeditor5-dev-license-checker';

const { fix } = parseArgs( { options: {
	'fix': { type: 'boolean', default: false }
} } ).values;

validateLicenseFiles( {
	fix,
	processRoot: true,
	processPackages: true,
	isPublic: true,
	mainPackageName: 'ckeditor5-dev',
	rootDir: upath.resolve( import.meta.dirname, '..' ),
	projectName: 'CKEditor',
	copyrightOverrides: [ {
		packageName: '@ckeditor/ckeditor5-dev-build-tools',
		dependencies: [
			{ license: 'MIT', name: '@rollup/plugin-terser', copyright: 'foo' },
			{ license: 'MIT', name: '@swc/core', copyright: 'foo' },
			{ license: 'MIT', name: 'cssnano-preset-lite', copyright: 'foo' },
			{ license: 'MIT', name: 'rollup-plugin-svg-import', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-ci',
		dependencies: [
			{ license: 'MIT', name: 'minimist', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-dependency-checker',
		dependencies: [
			{ license: 'MIT', name: 'minimist', copyright: 'foo' },
			{ license: 'MIT', name: 'oxc-walker', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-release-tools',
		dependencies: [
			{ license: 'MIT', name: 'shell-escape', copyright: 'foo' },
			{ license: 'MIT', name: 'simple-git', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-stale-bot',
		dependencies: [
			{ license: 'MIT', name: 'minimist', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-tests',
		dependencies: [
			{ license: 'MIT', name: 'karma-sinon', copyright: 'foo' },
			{ license: 'MIT', name: 'minimist', copyright: 'foo' },
			{ license: 'MIT', name: 'typescript', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-utils',
		dependencies: [
			{ license: 'MIT', name: 'simple-git', copyright: 'foo' },
			{ license: 'MIT', name: 'through2', copyright: 'foo' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-web-crawler',
		dependencies: [
			{ license: 'MIT', name: 'puppeteer', copyright: 'foo' }
		]
	} ]
} ).then( exitCode => {
	process.exit( exitCode );
} );
