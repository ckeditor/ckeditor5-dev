/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setUpManualInspector } from '../../theme/manual-inspector.js';

describe( 'setUpManualInspector()', () => {
	beforeEach( () => {
		vi.stubGlobal( 'window', {} );
		vi.stubGlobal( 'Element', class {} );
	} );

	it( 'replaces the named DOM property but keeps window.editor readable and writable without loading the inspector', async () => {
		window.editor = new Element();
		const editor = { state: 'ready' };
		const inspector = { attach: vi.fn() };
		const load = vi.fn().mockResolvedValue( inspector );

		setUpManualInspector( load );
		expect( window.editor ).to.be.null;

		window.editor = editor;
		expect( window.editor ).to.equal( editor );
		expect( load ).not.toHaveBeenCalled();
		expect( inspector.attach ).not.toHaveBeenCalled();

		await window.enableCKEditorInspector();
		expect( inspector.attach ).toHaveBeenCalledExactlyOnceWith( editor, undefined );
		expect( window.CKEditorInspector ).to.equal( inspector );

		window.editor = null;
		expect( window.editor ).to.be.null;
		expect( inspector.attach ).toHaveBeenCalledOnce();
	} );

	it( 'preserves named registrations and options before, during and after activation', async () => {
		const first = { state: 'ready' };
		const second = { state: 'ready' };
		const removed = { state: 'ready' };
		const options = { isCollapsed: true };
		const inspector = { attach: vi.fn() };
		const load = vi.fn().mockResolvedValue( inspector );

		setUpManualInspector( load );
		const registrations = window.CKEditorInspector;

		registrations.attach( { first, removed, second }, options );
		removed.state = 'destroyed';
		expect( load ).not.toHaveBeenCalled();

		const activation = window.enableCKEditorInspector();

		registrations.attach( 'legacy', second );
		await Promise.all( [ activation, window.enableCKEditorInspector() ] );
		expect( load ).toHaveBeenCalledOnce();

		window.editor = first;
		registrations.attach( { late: second } );
		expect( inspector.attach.mock.calls ).to.deep.equal( [
			[ { first }, options ],
			[ { second }, options ],
			[ { legacy: second }, undefined ],
			[ first ],
			[ { late: second } ]
		] );
	} );

	it( 'attaches the registered editor once when a failed load is retried', async () => {
		const editor = { state: 'ready' };
		const inspector = { attach: vi.fn() };
		const error = new Error( 'Could not load the Inspector.' );
		const load = vi.fn().mockRejectedValueOnce( error ).mockResolvedValueOnce( inspector );

		window.editor = editor;
		setUpManualInspector( load );
		await expect( window.enableCKEditorInspector() ).rejects.toBe( error );
		expect( inspector.attach ).not.toHaveBeenCalled();

		await window.enableCKEditorInspector();
		expect( load ).toHaveBeenCalledTimes( 2 );
		expect( inspector.attach ).toHaveBeenCalledExactlyOnceWith( editor, undefined );
	} );
} );
