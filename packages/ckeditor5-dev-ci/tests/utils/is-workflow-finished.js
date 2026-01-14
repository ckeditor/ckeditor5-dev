/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import isWorkflowFinished from '../../lib/utils/is-workflow-finished.js';

describe( 'lib/utils/isWorkflowFinished', () => {
	it( 'returns `true` for a finished job (status=success)', async () => {
		const jobs = [
			{ status: 'success' }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( true );
	} );

	it( 'returns `true` for a finished job (status=failed)', async () => {
		const jobs = [
			{ status: 'failed' }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( true );
	} );

	// See: https://github.com/ckeditor/ckeditor5/issues/18359.
	it( 'returns `true` for a finished job (status=skipped)', async () => {
		const jobs = [
			{ status: 'skipped' }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( true );
	} );

	it( 'returns `true` for jobs with dependencies (parent failed)', async () => {
		const jobs = [
			{ name: '1', status: 'failed' },
			{ name: '2', status: 'failed_parent', dependencies: [ '1' ] }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( true );
	} );

	it( 'returns `true` for jobs with dependencies (a child failed)', async () => {
		const jobs = [
			{ name: '1', status: 'success' },
			{ name: '2', status: 'failed', dependencies: [ '1' ] }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( true );
	} );

	it( 'returns `true` for jobs with dependencies (a child is skipped)', async () => {
		const jobs = [
			{ name: '1', status: 'success' },
			{ name: '2', status: 'skipped', dependencies: [ '1' ] }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( true );
	} );

	it( 'returns `false` for a non-finished job (status=running)', async () => {
		const jobs = [
			{ status: 'running' }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( false );
	} );

	it( 'returns `false` for a non-finished job (status=not_run)', async () => {
		const jobs = [
			{ status: 'not_run' }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( false );
	} );

	it( 'returns `false` for a non-finished job (status=blocked)', async () => {
		const jobs = [
			{ status: 'blocked' }
		];
		expect( isWorkflowFinished( jobs ) ).toEqual( false );
	} );
} );
