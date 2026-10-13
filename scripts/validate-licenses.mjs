/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import upath from 'upath';

import { validateLicenseFiles } from '@ckeditor/ckeditor5-dev-license-checker';

const { fix, verbose } = parseArgs( { options: {
	'fix': { type: 'boolean', default: false },
	'verbose': { type: 'boolean', default: false }
} } ).values;

const globOverride = { license: 'BlueOak-1.0.0', name: 'glob', copyright: 'Copyright (c) Isaac Z. Schlueter and Contributors.' };
const minimistOverride = { license: 'MIT', name: 'minimist', copyright: 'Copyright (c) 2013 James Halliday and contributors.' };

validateLicenseFiles( {
	fix,
	verbose,
	shouldProcessRoot: true,
	shouldProcessPackages: true,
	isPublic: true,
	rootDir: upath.resolve( import.meta.dirname, '..' ),
	projectName: 'CKEditor',
	copyrightOverrides: [ {
		packageName: '@ckeditor/ckeditor5-dev-agents',
		dependencies: [
			// The packages of Pi do not ship a license file. The license is in their repository.
			{ license: 'MIT', name: '@earendil-works/pi-ai', copyright: 'Copyright (c) 2025 Mario Zechner.' },
			{ license: 'MIT', name: '@earendil-works/pi-coding-agent', copyright: 'Copyright (c) 2025 Mario Zechner.' }
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-build-tools',
		dependencies: [
			{ license: 'MPL-2.0', name: 'lightningcss', copyright: 'Copyright © 2024 Devon Govett and Parcel Contributors.' },
			globOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-bump-year',
		dependencies: [
			globOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-changelog',
		dependencies: [
			globOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-docs',
		dependencies: [
			{ license: 'Apache-2.0', name: 'typedoc', copyright: 'Copyright (c) TypeStrong contributors.' },
			globOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-release-tools',
		dependencies: [
			{ license: 'MIT', name: 'shell-escape', copyright: 'Copyright (c) Martin PANEL (https://github.com/xxorax).' },
			globOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-stale-bot',
		dependencies: [
			minimistOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-translations',
		dependencies: [
			{ license: 'MIT', name: 'oxc-walker', copyright: 'Copyright (c) 2024 Daniel Roe.' },
			{ license: 'Apache-2.0', name: 'typescript', copyright: 'Copyright (c) Microsoft Corporation. All rights reserved.' },
			globOverride
		]
	}, {
		packageName: '@ckeditor/ckeditor5-dev-utils',
		dependencies: [
			{ license: 'MIT', name: 'through2', copyright: 'Copyright (c) Rod Vagg (the "Original Author") and additional contributors.' },
			globOverride
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
