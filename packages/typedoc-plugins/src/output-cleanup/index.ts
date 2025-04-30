/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Application } from 'typedoc';
import CleanUpSerializer from './cleanupserializer.js';

/**
 * The `typedoc-plugin-output-cleanup` removes unnecessary properties from reflections to decrease the size of the generated output.
 */
export function typeDocOutputCleanUp( app: Application ): void {
	// TODO: To resolve types.
	// @ts-expect-error TS2345
	// Argument of type CleanUpSerializer is not assignable to parameter of type SerializerComponent<Reflection>
	// The types returned by toObject(...) are incompatible between these types.
	app.serializer.addSerializer( new CleanUpSerializer() );
}
