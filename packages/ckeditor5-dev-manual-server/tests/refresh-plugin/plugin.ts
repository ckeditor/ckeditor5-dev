/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import { MANUAL_REFRESH_EVENT_NAME } from '../../src/constants.js';
import { refreshPlugin } from '../../src/refresh-plugin/plugin.js';
import type { ModuleNode } from 'vite';

interface TestHmrContext {
	file: string;
	modules: Array<TestModule>;
	server: {
		hot: {
			send: ReturnType<typeof vi.fn>;
		};
	};
}

interface TestModule {
	type: ModuleNode[ 'type' ];
}

type TestHandleHotUpdateHook = ( context: TestHmrContext ) => unknown;

describe( 'refreshPlugin()', () => {
	test( 'applies only in the dev server', () => {
		expect( refreshPlugin().apply ).to.equal( 'serve' );
	} );

	test( 'keeps regular Vite HMR for CSS file updates', () => {
		const handleHotUpdate = getHandleHotUpdate();
		const context = createHmrContext( '/workspace/theme/styles.css', [ createModule( 'js' ) ] );

		expect( handleHotUpdate.call( {}, context ) ).to.be.undefined;
		expect( context.server.hot.send ).not.toHaveBeenCalled();
	} );

	test( 'shows the manual refresh prompt for non-CSS updates', () => {
		const handleHotUpdate = getHandleHotUpdate();
		const context = createHmrContext( '/workspace/tests/manual/sample.ts', [ createModule( 'js' ) ] );

		expect( handleHotUpdate.call( {}, context ) ).to.deep.equal( [] );
		expect( context.server.hot.send ).toHaveBeenCalledWith( {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} );
	} );

	test( 'shows the manual refresh prompt for full reload updates', () => {
		const handleHotUpdate = getHandleHotUpdate();
		const context = createHmrContext( '/workspace/tests/manual/sample.html', [] );

		expect( handleHotUpdate.call( {}, context ) ).to.deep.equal( [] );
		expect( context.server.hot.send ).toHaveBeenCalledWith( {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} );
	} );
} );

function getHandleHotUpdate(): TestHandleHotUpdateHook {
	const hook = refreshPlugin().handleHotUpdate!;

	if ( typeof hook == 'function' ) {
		return context => hook.call( {}, context as never );
	}

	return context => hook.handler.call( {}, context as never );
}

function createHmrContext( file: string, modules: Array<TestModule> ): TestHmrContext {
	const context: TestHmrContext = {
		file,
		modules,
		server: {
			hot: {
				send: vi.fn()
			}
		}
	};

	return context;
}

function createModule( type: ModuleNode[ 'type' ] ): TestModule {
	const module: TestModule = {
		type
	};

	return module;
}
