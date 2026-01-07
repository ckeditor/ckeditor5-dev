/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { PassThrough, type Transform } from 'node:stream';
import through from 'through2';

export default function noop( callback?: ( ( chunk: unknown ) => unknown | Promise<unknown> ) ): Transform {
	if ( !callback ) {
		return new PassThrough( { objectMode: true } );
	}

	return through( { objectMode: true }, ( chunk, encoding, throughCallback ) => {
		const callbackResult = callback( chunk );

		if ( callbackResult instanceof Promise ) {
			callbackResult
				.then( () => {
					throughCallback( null, chunk );
				} )
				.catch( err => {
					throughCallback( err );
				} );
		} else {
			throughCallback( null, chunk );
		}
	} );
}
