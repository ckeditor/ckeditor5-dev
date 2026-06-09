/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { expect, vi } from 'vitest';
import { createServer, type AppType, type HotPayload, type Plugin, type ViteDevServer } from 'vite';
import { createFile } from './files.js';

export interface CreateTestServerOptions {
	appType?: AppType;
	plugins: Array<Plugin>;
	root: string;
}

export async function createTestServer( {
	appType,
	plugins,
	root
}: CreateTestServerOptions ): Promise<ViteDevServer> {
	return createServer( {
		root,
		appType,
		configFile: false,
		logLevel: 'silent',
		server: {
			middlewareMode: true
		},
		plugins
	} );
}

export async function updateFile(
	server: ViteDevServer,
	root: string,
	relativeFilePath: string,
	content: string
): Promise<void> {
	const filePath = await createFile( root, relativeFilePath, content );

	server.watcher.emit( 'change', filePath );
}

export function getCode( value: Awaited<ReturnType<ViteDevServer[ 'pluginContainer' ][ 'load' ]>> ): string {
	if ( typeof value == 'string' ) {
		return value;
	}

	return value!.code;
}

export function collectHotPayloads( server: ViteDevServer ): Array<{ payload: HotPayload }> {
	const hotPayloads: Array<{ payload: HotPayload }> = [];

	for ( const environment of Object.values( server.environments ) ) {
		vi.spyOn( environment.hot, 'send' ).mockImplementation( payload => {
			hotPayloads.push( {
				payload: payload as any as HotPayload
			} );
		} );
	}

	return hotPayloads;
}

export function waitForPayload(
	hotPayloads: Array<{ payload: HotPayload }>,
	predicate: ( payload: HotPayload ) => boolean
): Promise<void> {
	return vi.waitFor( () => {
		expect( hotPayloads.some( record => predicate( record.payload ) ) ).to.be.true;
	} );
}

export function getPayloadsByType(
	hotPayloads: Array<{ payload: HotPayload }>,
	type: HotPayload[ 'type' ]
): Array<HotPayload> {
	return hotPayloads.map( record => record.payload ).filter( payload => payload.type == type );
}
