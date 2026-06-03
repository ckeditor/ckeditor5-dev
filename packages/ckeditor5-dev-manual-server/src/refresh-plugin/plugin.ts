/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'vite';

export const MANUAL_REFRESH_EVENT_NAME = 'ckeditor5-manual:refresh-available';

export function refreshPlugin(): Plugin {
	return {
		name: 'ckeditor5-manual-refresh',
		apply: 'serve',

		handleHotUpdate( { file, server } ) {
			if ( file.endsWith( '.css' ) ) {
				return;
			}

			server.hot.send( {
				type: 'custom',
				event: MANUAL_REFRESH_EVENT_NAME
			} );

			return [];
		}
	};
}
