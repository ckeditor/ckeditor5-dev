/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { JsonSchema } from '../types.js';

/**
 * Returns the JSON Schema of the findings a judge returns, wrapped in an object (`{ findings: [ … ] }`),
 * because structured-output APIs require an object at the top level. Pass it as `outputSchema` to `agent.run()`.
 */
export function findingSchema( { ruleIds }: { ruleIds: ReadonlyArray<string> } ): JsonSchema {
	return {
		type: 'object',
		properties: {
			findings: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						ruleId: {
							type: 'string',
							enum: [ ...ruleIds ],
							description: 'The rule the finding breaks.'
						},
						detail: {
							type: 'string',
							minLength: 1,
							description: 'A short explanation of what is wrong, written for the person who fixes it.'
						},
						discriminator: {
							type: 'string',
							description: 'Tells apart findings of the same rule in the same unit, for example a heading.'
						}
					},
					required: [ 'ruleId', 'detail' ]
				}
			}
		},
		required: [ 'findings' ]
	};
}
