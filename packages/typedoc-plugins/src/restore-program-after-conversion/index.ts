/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	type Context,
	type Application
} from 'typedoc';

/**
 * The `typedoc-plugin-restore-program-after-conversion` restores TypeScript program used for source conversion.
 *
 * TypeDoc at some point, after the source compilation and conversion is finished, deletes the `context.program` property.
 * This operation prevents from using custom TypeDoc plugins, which listen to `EVENT_END` event, because some TypeDoc internals
 * require that `context.program` exists.
 */
export default function( app: Application ): void {
	// Set non-default priority to ensure execution before other plugins.
	app.converter.on( Converter.EVENT_END, onEventEnd, 1000 );
}

function onEventEnd( context: Context ) {
	context.setActiveProgram( context.programs.at( 0 ) );
}
