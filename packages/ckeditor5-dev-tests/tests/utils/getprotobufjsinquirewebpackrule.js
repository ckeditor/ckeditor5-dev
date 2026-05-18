/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getProtobufJsInquireWebpackRule from '../../lib/utils/getprotobufjsinquirewebpackrule.js';

describe( 'getProtobufJsInquireWebpackRule()', () => {
	it( 'should return parser configuration for @protobufjs/inquire', () => {
		const rule = getProtobufJsInquireWebpackRule();

		expect( '/node_modules/@protobufjs/inquire/index.js' ).to.match( rule.test );
		expect( '/node_modules/.pnpm/@protobufjs+inquire@1.1.1/node_modules/@protobufjs/inquire/index.js' ).to.match( rule.test );
		expect( '/node_modules/@protobufjs/base64/index.js' ).not.to.match( rule.test );

		expect( rule.parser ).to.deep.equal( {
			exprContextCritical: false
		} );
	} );
} );
