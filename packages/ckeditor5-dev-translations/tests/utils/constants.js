/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import * as constants from '../../lib/utils/constants.js';

describe( 'constants', () => {
	it( '#CONTEXT_FILE_PATH', () => {
		expect( constants.CONTEXT_FILE_PATH ).toBeTypeOf( 'string' );
	} );

	it( '#TRANSLATION_FILES_PATH', () => {
		expect( constants.TRANSLATION_FILES_PATH ).toBeTypeOf( 'string' );
	} );
} );
