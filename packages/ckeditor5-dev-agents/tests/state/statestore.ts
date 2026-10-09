/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, describe, it, expect } from 'vitest';
import upath from 'upath';
import { readTaskState, writeTaskState } from '../../src/state/statestore.js';
import { hash } from '../../src/utils/text.js';
import { createTempDirectory, readText, removeTempDirectories, writeFiles } from '../_utils/files.js';
import type { Finding } from '../../src/types.js';

describe( 'state store', () => {
	afterEach( removeTempDirectories );

	const finding = ( fingerprint: string ): Finding => ( {
		fingerprint,
		id: hash( fingerprint ),
		task: 't',
		unit: 'u',
		ruleId: 'R1',
		discriminator: '',
		detail: 'x',
		fragment: 'f'
	} );

	describe( 'readTaskState()', () => {
		it( 'returns an empty state when there are no files', async () => {
			const root = await createTempDirectory();

			expect( await readTaskState( upath.join( root, 'missing' ) ) ).toEqual( { baseline: {}, open: [], decisions: [], warnings: [] } );
		} );

		it( 'reads the baseline, the open findings and the decisions', async () => {
			const root = await createTempDirectory();

			await writeFiles( root, {
				'baseline.json': '{ "a": "1" }',
				'open.json': JSON.stringify( [ finding( 'x' ) ] ),
				'decisions/a.yml': 'unit: a\nrule: R1\nfragment: "1"\nreason: x\n',
				'decisions/b.yml': 'broken'
			} );

			const state = await readTaskState( root );

			expect( state.baseline ).toEqual( { a: '1' } );
			expect( state.open ).toEqual( [ finding( 'x' ) ] );
			expect( state.decisions ).toHaveLength( 1 );
			expect( state.warnings ).toHaveLength( 1 );
		} );

		it.each( [
			[ 'baseline.json', '[]', 'The "baseline.json" file must contain an object.' ],
			[ 'baseline.json', 'null', 'The "baseline.json" file must contain an object.' ],
			[ 'baseline.json', '"x"', 'The "baseline.json" file must contain an object.' ],
			[ 'open.json', '{}', 'The "open.json" file must contain an array.' ]
		] )( 'throws when %s contains %s', async ( file, content, message ) => {
			const root = await createTempDirectory();

			await writeFiles( root, { [ file ]: content } );

			await expect( readTaskState( root ) ).rejects.toThrow( message );
		} );

		it( 'throws with the cause when a file is not valid JSON', async () => {
			const root = await createTempDirectory();

			await writeFiles( root, { 'open.json': '[' } );

			const error = await readTaskState( root ).catch( ( error: Error ) => error );

			expect( ( error as Error ).message ).toMatch( /^The "open.json" file is not valid JSON: / );
			expect( ( error as Error ).cause ).toBeInstanceOf( SyntaxError );
		} );
	} );

	describe( 'writeTaskState()', () => {
		it( 'writes sorted files with tabs and a trailing new line, creating the directory', async () => {
			const root = await createTempDirectory();
			const path = upath.join( root, 'nested', 'state' );

			await writeTaskState( path, {
				baseline: { b: '2', a: '1' },
				open: [ finding( 'y' ), finding( 'x' ), finding( 'y' ) ],
				report: '# Report\n'
			} );

			expect( await readText( upath.join( path, 'baseline.json' ) ) ).toBe( '{\n\t"a": "1",\n\t"b": "2"\n}\n' );
			expect( JSON.parse( await readText( upath.join( path, 'open.json' ) ) ).map( ( item: Finding ) => item.fingerprint ) )
				.toEqual( [ 'x', 'y', 'y' ] );
			expect( await readText( upath.join( path, 'open.json' ) ) ).toMatch( /^\[\n\t\{/ );
			expect( await readText( upath.join( path, 'report.md' ) ) ).toBe( '# Report\n' );
		} );
	} );
} );
