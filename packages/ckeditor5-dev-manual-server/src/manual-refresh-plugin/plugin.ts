/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { HotPayload, Plugin } from 'vite';
import { MANUAL_REFRESH_EVENT_NAME } from '../constants.js';

type HotSendArguments = [ payload: HotPayload ];

interface BundledDevClientEnvironment {
	initialBuildCompleted: boolean;
}

export function createManualRefreshPlugin(): Plugin {
	return {
		name: 'ckeditor5-manual-refresh',
		apply: 'serve',

		configureServer( server ) {
			const clientEnvironment = server.environments.client as typeof server.environments.client & BundledDevClientEnvironment;
			const hot = clientEnvironment.hot;
			const send = hot.send.bind( hot );

			hot.send = ( ( ...args: HotSendArguments ) => {
				const { type } = args[ 0 ];

				if ( type == 'update' || ( type == 'full-reload' && clientEnvironment.initialBuildCompleted ) ) {
					return send( {
						type: 'custom',
						event: MANUAL_REFRESH_EVENT_NAME
					} );
				}

				send( ...args );
			} );
		}
	};
}
