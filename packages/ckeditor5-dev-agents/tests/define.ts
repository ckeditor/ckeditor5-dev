/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineTarget, defineTask } from '../src/define.js';
import type { FileUnit, TargetConfig, Task } from '../src/types.js';

describe( 'defineTask()', () => {
	it( 'returns the task unchanged', () => {
		const task = {
			id: 't',
			title: 'Task',
			ruleIds: [ 'R1' ],
			include: [ 'docs/**' ],
			contentHash: () => 'hash',
			payload: () => ( {} ),
			judge: () => []
		};

		expect( defineTask( task ) ).toBe( task );
	} );

	it( 'infers the options, `shared`, the file unit and the payload in the hooks', () => {
		const task = defineTask( {
			id: 't',
			title: 'Task',
			ruleIds: [ 'R1' ],
			include: [ 'docs/**' ],
			defaultOptions: { maxWords: 60 },
			prepare: () => ( { seen: new Set<string>() } ),
			contentHash( { hash, unit } ) {
				expectTypeOf( unit ).toEqualTypeOf<FileUnit>();

				return hash( unit.path );
			},
			payload( { options, shared, unit } ) {
				expectTypeOf( options.maxWords ).toEqualTypeOf<number>();
				expectTypeOf( shared.seen ).toEqualTypeOf<Set<string>>();

				return { path: unit.path, words: options.maxWords };
			},
			judge( { payload } ) {
				expectTypeOf( payload ).toEqualTypeOf<{ path: string; words: number }>();

				return [];
			}
		} );

		expectTypeOf( task ).toEqualTypeOf<Task<{ seen: Set<string> }, FileUnit, { path: string; words: number }, { maxWords: number }>>();
	} );

	it( 'infers the unit from `scope()`', () => {
		defineTask( {
			id: 't',
			title: 'Task',
			ruleIds: [ 'R1' ],
			scope: () => [ { key: 'pkg', version: '1.0.0' } ],
			contentHash( { unit } ) {
				expectTypeOf( unit.version ).toEqualTypeOf<string>();

				return unit.version;
			},
			payload: () => null,
			judge: () => []
		} );
	} );
} );

describe( 'defineTarget()', () => {
	it( 'returns the target unchanged and types it', () => {
		const target = { slug: 'owner/repo', tasks: { t: { maxUnits: 10 } } };

		expect( defineTarget( target ) ).toBe( target );
		expectTypeOf( defineTarget ).returns.toEqualTypeOf<TargetConfig>();
	} );
} );
