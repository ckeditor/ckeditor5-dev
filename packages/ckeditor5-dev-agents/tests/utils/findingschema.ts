/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { describe, it, expect } from 'vitest';
import { findingSchema } from '../../src/utils/findingschema.js';

describe( 'findingSchema()', () => {
	it( 'returns an object schema with the findings array', () => {
		const schema = findingSchema( { ruleIds: [ 'A1', 'A2' ] } );

		expect( schema ).toMatchObject( {
			type: 'object',
			required: [ 'findings' ],
			properties: {
				findings: {
					type: 'array',
					items: {
						type: 'object',
						required: [ 'ruleId', 'detail' ],
						properties: {
							ruleId: { type: 'string', enum: [ 'A1', 'A2' ] },
							detail: { type: 'string', minLength: 1 },
							discriminator: { type: 'string' }
						}
					}
				}
			}
		} );
	} );

	it( 'copies the rule IDs', () => {
		const ruleIds = [ 'A1' ];
		const schema = findingSchema( { ruleIds } ) as { properties: { findings: { items: { properties: { ruleId: { enum: Array<string> } } } } } };

		ruleIds.push( 'A2' );

		expect( schema.properties.findings.items.properties.ruleId.enum ).toEqual( [ 'A1' ] );
	} );
} );
