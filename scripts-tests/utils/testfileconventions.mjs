/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import upath from 'upath';
import fs from 'fs-extra';
import { findTestFileConventionViolations, formatViolations } from '../../scripts/utils/testfileconventions.js';

describe( 'scripts/utils/testfileconventions', () => {
	const createdDirectories = [];

	/**
	 * Materializes a repository-like tree in a temporary directory.
	 *
	 * @param {Object.<string, string>} files Paths (relative to the tree root) mapped to their contents.
	 * @returns {Promise.<string>} Path to the created tree.
	 */
	async function createTree( files ) {
		const root = await fs.mkdtemp( upath.join( os.tmpdir(), 'ckeditor5-dev-conventions-' ) );

		createdDirectories.push( root );

		for ( const [ file, contents ] of Object.entries( files ) ) {
			await fs.outputFile( upath.join( root, file ), contents );
		}

		return root;
	}

	afterEach( async () => {
		await Promise.all( createdDirectories.splice( 0 ).map( directory => fs.remove( directory ) ) );
	} );

	describe( 'findTestFileConventionViolations()', () => {
		it( 'reports nothing for a repository that follows the conventions', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/src/index.ts': 'export const foo = 1;\n',
				'packages/ckeditor5-dev-foo/tests/index.ts': 'import { it } from \'vitest\';\n',
				'scripts-tests/preparepackages.mjs': 'import { it } from \'vitest\';\n'
			} );

			expect( await findTestFileConventionViolations( root ) ).toEqual( {
				suffixedFiles: [],
				misplacedFiles: []
			} );
		} );

		it( 'reports a test file using the redundant `.test` suffix', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/tests/index.test.ts': ''
			} );

			const { suffixedFiles } = await findTestFileConventionViolations( root );

			expect( suffixedFiles ).toEqual( [ 'packages/ckeditor5-dev-foo/tests/index.test.ts' ] );
		} );

		it( 'reports a test file using the redundant `.spec` suffix', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/tests/nested/deeply/index.spec.js': ''
			} );

			const { suffixedFiles } = await findTestFileConventionViolations( root );

			expect( suffixedFiles ).toEqual( [ 'packages/ckeditor5-dev-foo/tests/nested/deeply/index.spec.js' ] );
		} );

		it( 'reports suffixed files placed in the `scripts-tests` directory', async () => {
			const root = await createTree( {
				'scripts-tests/preparepackages.test.mjs': ''
			} );

			const { suffixedFiles } = await findTestFileConventionViolations( root );

			expect( suffixedFiles ).toEqual( [ 'scripts-tests/preparepackages.test.mjs' ] );
		} );

		it( 'returns reported files sorted alphabetically', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/tests/zebra.test.ts': '',
				'packages/ckeditor5-dev-foo/tests/apple.test.ts': '',
				'packages/ckeditor5-dev-bar/tests/mango.test.ts': ''
			} );

			const { suffixedFiles } = await findTestFileConventionViolations( root );

			expect( suffixedFiles ).toEqual( [
				'packages/ckeditor5-dev-bar/tests/mango.test.ts',
				'packages/ckeditor5-dev-foo/tests/apple.test.ts',
				'packages/ckeditor5-dev-foo/tests/zebra.test.ts'
			] );
		} );

		it( 'does not report data files, so `tsconfig.test.json` fixtures are allowed', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/tests/tsconfig.test.json': '{}',
				'packages/ckeditor5-dev-foo/tests/fixtures/input.test.po': ''
			} );

			const { suffixedFiles } = await findTestFileConventionViolations( root );

			expect( suffixedFiles ).toEqual( [] );
		} );

		it( 'does not report a `.test` suffix outside a test directory', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/src/matcher.test.ts': 'export const matcher = 1;\n'
			} );

			const { suffixedFiles } = await findTestFileConventionViolations( root );

			expect( suffixedFiles ).toEqual( [] );
		} );

		it( 'reports a file importing `vitest` from outside a test directory', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/src/index.ts': 'import { expect } from \'vitest\';\n'
			} );

			const { misplacedFiles } = await findTestFileConventionViolations( root );

			expect( misplacedFiles ).toEqual( [ 'packages/ckeditor5-dev-foo/src/index.ts' ] );
		} );

		it( 'reports a file requiring `vitest` from outside a test directory', async () => {
			const root = await createTree( {
				'scripts/build.cjs': 'const { expect } = require( \'vitest\' );\n'
			} );

			const { misplacedFiles } = await findTestFileConventionViolations( root );

			expect( misplacedFiles ).toEqual( [ 'scripts/build.cjs' ] );
		} );

		it( 'reports a test-looking file placed next to the sources instead of in `tests`', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/src/index.ts': 'export const foo = 1;\n',
				'packages/ckeditor5-dev-foo/src/index.spec.ts':
					'import { describe, expect, it } from \'vitest\';\n' +
					'describe( \'foo\', () => { it( \'works\', () => expect( 1 ).toBe( 1 ) ); } );\n'
			} );

			const { misplacedFiles } = await findTestFileConventionViolations( root );

			expect( misplacedFiles ).toEqual( [ 'packages/ckeditor5-dev-foo/src/index.spec.ts' ] );
		} );

		it( 'does not report `vitest/config` imports, as configuration files legitimately use them', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/vitest.config.ts': 'import { defineConfig } from \'vitest/config\';\n',
				'vitest.workspace.ts': 'import { defineWorkspace } from \'vitest/config\';\n'
			} );

			const { misplacedFiles } = await findTestFileConventionViolations( root );

			expect( misplacedFiles ).toEqual( [] );
		} );

		it( 'does not report `vitest` imports made from inside a test directory', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/tests/index.ts': 'import { expect } from \'vitest\';\n',
				'packages/ckeditor5-dev-foo/tests/_utils/helper.ts': 'import { vi } from \'vitest\';\n',
				'scripts-tests/preparepackages.mjs': 'import { vi } from \'vitest\';\n'
			} );

			const { misplacedFiles } = await findTestFileConventionViolations( root );

			expect( misplacedFiles ).toEqual( [] );
		} );

		it( 'ignores generated and vendored directories', async () => {
			const root = await createTree( {
				'node_modules/vitest/index.js': 'require( \'vitest\' );\n',
				'packages/ckeditor5-dev-foo/node_modules/dep/index.js': 'require( \'vitest\' );\n',
				'packages/ckeditor5-dev-foo/dist/index.js': 'import { expect } from \'vitest\';\n',
				'packages/ckeditor5-dev-foo/coverage/index.js': 'import { expect } from \'vitest\';\n',
				'release/ckeditor5-dev-foo/index.js': 'import { expect } from \'vitest\';\n',
				'packages/ckeditor5-dev-foo/dist/index.test.js': ''
			} );

			expect( await findTestFileConventionViolations( root ) ).toEqual( {
				suffixedFiles: [],
				misplacedFiles: []
			} );
		} );

		it( 'reports both kinds of violations at once', async () => {
			const root = await createTree( {
				'packages/ckeditor5-dev-foo/tests/index.test.ts': '',
				'packages/ckeditor5-dev-foo/src/index.ts': 'import { expect } from \'vitest\';\n'
			} );

			expect( await findTestFileConventionViolations( root ) ).toEqual( {
				suffixedFiles: [ 'packages/ckeditor5-dev-foo/tests/index.test.ts' ],
				misplacedFiles: [ 'packages/ckeditor5-dev-foo/src/index.ts' ]
			} );
		} );
	} );

	describe( 'formatViolations()', () => {
		it( 'returns an empty string when nothing was found', () => {
			expect( formatViolations( { suffixedFiles: [], misplacedFiles: [] } ) ).toEqual( '' );
		} );

		it( 'suggests the corrected name for a suffixed file', () => {
			const report = formatViolations( {
				suffixedFiles: [ 'packages/ckeditor5-dev-foo/tests/index.test.ts' ],
				misplacedFiles: []
			} );

			expect( report ).toContain( 'packages/ckeditor5-dev-foo/tests/index.test.ts' );
			expect( report ).toContain( '→ rename it to packages/ckeditor5-dev-foo/tests/index.ts' );
		} );

		it( 'strips the `.spec` suffix in the suggested name as well', () => {
			const report = formatViolations( {
				suffixedFiles: [ 'scripts-tests/build.spec.mjs' ],
				misplacedFiles: []
			} );

			expect( report ).toContain( '→ rename it to scripts-tests/build.mjs' );
		} );

		it( 'explains where a misplaced file should be moved', () => {
			const report = formatViolations( {
				suffixedFiles: [],
				misplacedFiles: [ 'packages/ckeditor5-dev-foo/src/index.ts' ]
			} );

			expect( report ).toContain( 'packages/ckeditor5-dev-foo/src/index.ts' );
			expect( report ).toContain( 'Move them to the `tests/` directory of their package' );
		} );

		it( 'reports both sections when both kinds of violations exist', () => {
			const report = formatViolations( {
				suffixedFiles: [ 'packages/ckeditor5-dev-foo/tests/index.test.ts' ],
				misplacedFiles: [ 'packages/ckeditor5-dev-foo/src/index.ts' ]
			} );

			expect( report ).toContain( 'redundant `.test` or `.spec` suffix' );
			expect( report ).toContain( 'are never executed' );
		} );
	} );
} );
