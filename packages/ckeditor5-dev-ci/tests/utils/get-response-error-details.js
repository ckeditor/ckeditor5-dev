/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getResponseErrorDetails from '../../lib/utils/get-response-error-details.js';

describe( 'lib/utils/getResponseErrorDetails', () => {
	it( 'returns the "message" field from a JSON body', async () => {
		expect( await getResponseErrorDetails( createResponse( '{"message":"Permission denied"}' ) ) )
			.toEqual( 'Permission denied' );
	} );

	it( 'returns the "error" field from a JSON body when "message" is missing', async () => {
		expect( await getResponseErrorDetails( createResponse( '{"error":"Not found"}' ) ) )
			.toEqual( 'Not found' );
	} );

	it( 'prefers "message" over "error"', async () => {
		expect( await getResponseErrorDetails( createResponse( '{"message":"A","error":"B"}' ) ) )
			.toEqual( 'A' );
	} );

	it( 'returns the raw body when "message" is not a string', async () => {
		expect( await getResponseErrorDetails( createResponse( '{"message":{"code":1}}' ) ) )
			.toEqual( '{"message":{"code":1}}' );
	} );

	it( 'returns the raw body for a JSON body without known fields', async () => {
		expect( await getResponseErrorDetails( createResponse( '{"foo":"bar"}' ) ) )
			.toEqual( '{"foo":"bar"}' );
	} );

	it( 'returns the raw body for a JSON body that is not an object', async () => {
		expect( await getResponseErrorDetails( createResponse( 'null' ) ) ).toEqual( 'null' );
		expect( await getResponseErrorDetails( createResponse( '"oops"' ) ) ).toEqual( '"oops"' );
	} );

	it( 'returns the trimmed raw body for a non-JSON body', async () => {
		expect( await getResponseErrorDetails( createResponse( '  Bad Gateway\n' ) ) ).toEqual( 'Bad Gateway' );
	} );

	it( 'truncates a long non-JSON body', async () => {
		const body = '<html>' + 'x'.repeat( 1000 ) + '</html>';
		const details = await getResponseErrorDetails( createResponse( body ) );

		expect( details ).toHaveLength( 301 );
		expect( details.startsWith( '<html>xxx' ) ).toEqual( true );
		expect( details.endsWith( '…' ) ).toEqual( true );
	} );

	it( 'does not truncate a body of exactly 300 characters', async () => {
		const body = 'x'.repeat( 300 );

		expect( await getResponseErrorDetails( createResponse( body ) ) ).toEqual( body );
	} );

	it( 'returns null for an empty body', async () => {
		expect( await getResponseErrorDetails( createResponse( '' ) ) ).toBeNull();
		expect( await getResponseErrorDetails( createResponse( '   ' ) ) ).toBeNull();
	} );

	it( 'returns null when the body cannot be read', async () => {
		const response = { text: () => Promise.reject( new Error( 'Stream closed' ) ) };

		expect( await getResponseErrorDetails( response ) ).toBeNull();
	} );
} );

function createResponse( body ) {
	return { text: () => Promise.resolve( body ) };
}
