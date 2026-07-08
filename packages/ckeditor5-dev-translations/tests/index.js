/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import {
	findMessages,
	moveTranslations,
	synchronizeTranslations
} from '../lib/index.js';
import findMessagesDirect from '../lib/findmessages.js';
import moveTranslationsDirect from '../lib/movetranslations.js';
import synchronizeTranslationsDirect from '../lib/synchronizetranslations.js';

describe( 'index', () => {
	it( 'should export public package API', () => {
		expect( findMessages ).to.equal( findMessagesDirect );
		expect( synchronizeTranslations ).to.equal( synchronizeTranslationsDirect );
		expect( moveTranslations ).to.equal( moveTranslationsDirect );
	} );
} );
