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

const minimistOverride = { license: 'MIT', name: 'minimist', copyright: 'Copyright (c) 2013 James Halliday and contributors.' };
const simpleGitOverride = { license: 'MIT', name: 'simple-git', copyright: 'Copyright (c) 2022 Steve King.' };
const babelParserOverride = { license: 'MIT', name: '@babel/parser', copyright: 'Copyright (C) 2012-2014 by various contributors.' };

validateLicenseFiles( {
	fix,
	shouldProcessRoot: true,
	shouldProcessPackages: true,
	isPublic: true,
	rootDir: upath.resolve( import.meta.dirname, '..' ),
	projectName: 'CKEditor',
	copyrightOverrides: [ {
		packageName: '@ckeditor/ckeditor5-dev-build-tools',
		dependencies: [
			{
				license: 'MIT',
				name: '@rollup/plugin-terser',
				copyright: 'Copyright (c) 2019 RollupJS Plugin Contributors (https://github.com/rollup/plugins/graphs/contributors).'
			},
			{ license: 'Apache-2.0', name: '@swc/core', copyright: 'Copyright 2024 SWC contributors.' },
			{
				license: 'MIT',
				name: 'cssnano-preset-lite',
				copyright: 'Copyright (c) Ben Briggs <beneb.info@gmail.com> (http://beneb.info).'
			},
			{ license: 'MIT', name: 'rollup-plugin-svg-import', copyright: 'Copyright (c) korywka (https://github.com/korywka).' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-ci',
		dependencies: [
			minimistOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-dependency-checker',
		dependencies: [
			{ license: 'MIT', name: 'oxc-walker', copyright: 'Copyright (c) 2024 Daniel Roe.' },
			minimistOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-docs',
		dependencies: [
			{ license: 'Apache-2.0', name: 'typedoc', copyright: 'Copyright (c) TypeStrong contributors.' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-release-tools',
		dependencies: [
			{ license: 'MIT', name: 'shell-escape', copyright: 'Copyright (c) Martin PANEL (https://github.com/xxorax).' },
			simpleGitOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-stale-bot',
		dependencies: [
			minimistOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-tests',
		dependencies: [
			{ license: 'MIT', name: 'karma-sinon', copyright: 'Copyright (c) Janusz J (https://github.com/yanoosh).' },
			{ license: 'Apache-2.0', name: 'typescript', copyright: 'Copyright (c) Microsoft Corporation. All rights reserved.' },
			{ license: 'BSD-2-Clause', name: 'sinon-chai', copyright: 'Copyright © 2012–2017 Domenic Denicola <d@domenic.me>.' },
			babelParserOverride,
			minimistOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-translations',
		dependencies: [
			babelParserOverride,
			simpleGitOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-utils',
		dependencies: [
			{ license: 'MIT', name: 'through2', copyright: 'Copyright (c) Rod Vagg (the "Original Author") and additional contributors.' },
			simpleGitOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-web-crawler',
		dependencies: [
			{ license: 'Apache-2.0', name: 'puppeteer', copyright: 'Copyright 2017-2025 Google Inc.' }
		]
	} ]
} ).then( exitCode => {
	process.exit( exitCode );
} );
