/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import processJobStatuses from '../lib/process-job-statuses.js';

describe( 'lib/process-job-statuses', () => {
	describe( 'processJobStatuses()', () => {
		it( 'should be a function', () => {
			expect( processJobStatuses ).to.be.a( 'function' );
		} );

		// Workflow:
		// ┌─────┐
		// │Job A│
		// └─────┘
		it( 'should not modify status of a single successful job', () => {
			const jobs = [ {
				id: 'id1',
				status: 'success',
				dependencies: []
			} ];

			const expectedOutput = [ {
				id: 'id1',
				status: 'success',
				dependencies: []
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		// ┌────┐
		// │Id 1│
		// └────┘
		// ┌────┐
		// │Id 2│
		// └────┘
		it( 'should not modify status of multiple successful jobs', () => {
			const jobs = [ {
				id: 'id1',
				status: 'success',
				dependencies: []
			}, {
				id: 'id2',
				status: 'success',
				dependencies: [ 'id1' ]
			} ];

			const expectedOutput = [ {
				id: 'id1',
				status: 'success',
				dependencies: []
			}, {
				id: 'id2',
				status: 'success',
				dependencies: [ 'id1' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		// ┌────┐     ┌────┐
		// │Id 1├────►│Id 2│
		// └────┘     └────┘
		it( 'should not modify job whose parent has status "running"', () => {
			const jobs = [ {
				id: 'id1',
				status: 'running',
				dependencies: []
			}, {
				id: 'id2',
				status: 'blocked',
				dependencies: [ 'id1' ]
			} ];

			const expectedOutput = [ {
				id: 'id1',
				status: 'running',
				dependencies: []
			}, {
				id: 'id2',
				status: 'blocked',
				dependencies: [ 'id1' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		// ┌────┐     ┌────┐
		// │Id 1├────►│Id 2│
		// └────┘     └────┘
		it( 'should set status to "failed_parent" for a job whose parent has status "failed"', () => {
			const jobs = [ {
				id: 'id1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id2',
				status: 'blocked',
				dependencies: [ 'id1' ]
			} ];

			const expectedOutput = [ {
				id: 'id1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id2',
				status: 'failed_parent',
				dependencies: [ 'id1' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		// ┌────┐     ┌────┐     ┌────┐     ┌────┐
		// │Id 1├────►│Id 2│────►│Id 3│────►│Id 4│
		// └────┘     └────┘     └────┘     └────┘
		it( 'should set status to "failed_parent" for all jobs following parent with status "failed"', () => {
			const jobs = [ {
				id: 'id1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id2',
				status: 'blocked',
				dependencies: [ 'id1' ]
			}, {
				id: 'id3',
				status: 'blocked',
				dependencies: [ 'id2' ]
			}, {
				id: 'id4',
				status: 'blocked',
				dependencies: [ 'id3' ]
			} ];

			const expectedOutput = [ {
				id: 'id1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id2',
				status: 'failed_parent',
				dependencies: [ 'id1' ]
			}, {
				id: 'id3',
				status: 'failed_parent',
				dependencies: [ 'id2' ]
			}, {
				id: 'id4',
				status: 'failed_parent',
				dependencies: [ 'id3' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		//           ┌────┐
		//    ┌─────►│Id 3│
		//    │      └──┬─┘
		//    │         │
		//    │         │
		// ┌──┴─┐       └──────►┌────┐
		// │Id 1│               │Id 4│
		// └──┬─┘       ┌──────►└────┘
		//    │         │
		//    │         │
		//    │      ┌──┴─┐
		//    └─────►│Id 2│
		//           └────┘
		it( 'should mark a job as failed if one of two parents failed', () => {
			const jobs = [ {
				id: 'id_1',
				status: 'success',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'failed',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'running',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'blocked',
				dependencies: [ 'id_2', 'id_3' ]
			} ];

			const expectedOutput = [ {
				id: 'id_1',
				status: 'success',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'failed',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'running',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'failed_parent',
				dependencies: [ 'id_2', 'id_3' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		//           ┌────┐
		//    ┌─────►│Id 3│
		//    │      └──┬─┘
		//    │         │
		//    │         │
		// ┌──┴─┐       └──────►┌────┐
		// │Id 1│               │Id 4│
		// └──┬─┘       ┌──────►└────┘
		//    │         │
		//    │         │
		//    │      ┌──┴─┐
		//    └─────►│Id 2│
		//           └────┘
		it( 'should mark all direct children tasks as failed when a parent failed', () => {
			const jobs = [ {
				id: 'id_1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'blocked',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'blocked',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'blocked',
				dependencies: [ 'id_2', 'id_3' ]
			} ];

			const expectedOutput = [ {
				id: 'id_1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'failed_parent',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'failed_parent',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'failed_parent',
				dependencies: [ 'id_2', 'id_3' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		//                    ┌────┐
		//             ┌─────►│Id 4├──────────┐
		//             │      └────┘          │
		//             │                      │
		//           ┌─┴──┐                   ▼
		//    ┌─────►│Id 3├───────────────► ┌──────┐
		//    │      └─┬──┘                 │ Id 6 │
		//    │        │          ┌───────► └──────┘
		//    │        │          │           ▲
		// ┌──┴─┐      │      ┌───┴┐          │
		// │Id 1│      └─────►│Id 5│          │
		// └──┬─┘             └────┘          │
		//    │                               │
		//    │                               │
		//    │      ┌────┐                   │
		//    └─────►│Id 2├───────────────────┘
		//           └────┘
		it( 'should mark all children tasks as failed when an initial job (parent) failed', () => {
			const jobs = [ {
				id: 'id_1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'blocked',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'blocked',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'blocked',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_5',
				status: 'blocked',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_6',
				status: 'blocked',
				dependencies: [ 'id_2', 'id_3', 'id_4', 'id_5' ]
			} ];

			const expectedOutput = [ {
				id: 'id_1',
				status: 'failed',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'failed_parent',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'failed_parent',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'failed_parent',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_5',
				status: 'failed_parent',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_6',
				status: 'failed_parent',
				dependencies: [ 'id_2', 'id_3', 'id_4', 'id_5' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		// Workflow:
		//                    ┌────┐
		//             ┌─────►│Id 4├──────────┐
		//             │      └────┘          │
		//             │                      │
		//           ┌─┴──┐                   ▼
		//    ┌─────►│Id 3├───────────────► ┌──────┐
		//    │      └─┬──┘                 │ Id 6 │
		//    │        │          ┌───────► └──────┘
		//    │        │          │           ▲
		// ┌──┴─┐      │      ┌───┴┐          │
		// │Id 1│      └─────►│Id 5│          │
		// └──┬─┘             └────┘          │
		//    │                               │
		//    │                               │
		//    │      ┌────┐                   │
		//    └─────►│Id 2├───────────────────┘
		//           └────┘
		it( 'should mark all children tasks as failed when a children (direct parent) failed', () => {
			const jobs = [ {
				id: 'id_1',
				status: 'success',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'running',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'failed',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'blocked',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_5',
				status: 'blocked',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_6',
				status: 'blocked',
				dependencies: [ 'id_2', 'id_3', 'id_4', 'id_5' ]
			} ];

			const expectedOutput = [ {
				id: 'id_1',
				status: 'success',
				dependencies: []
			}, {
				id: 'id_2',
				status: 'running',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_3',
				status: 'failed',
				dependencies: [ 'id_1' ]
			}, {
				id: 'id_4',
				status: 'failed_parent',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_5',
				status: 'failed_parent',
				dependencies: [ 'id_3' ]
			}, {
				id: 'id_6',
				status: 'failed_parent',
				dependencies: [ 'id_2', 'id_3', 'id_4', 'id_5' ]
			} ];

			expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
		} );

		describe( 'status=canceled', () => {
			// Workflow:
			// ┌─────┐
			// │Job A│
			// └─────┘
			it( 'should not modify status of a single canceled job', () => {
				const jobs = [
					{
						id: 'id1',
						status: 'canceled',
						dependencies: []
					}
				];

				const expectedOutput = [
					{
						id: 'id1',
						status: 'canceled',
						dependencies: []
					}
				];

				expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
			} );

			// Workflow:
			// ┌────┐     ┌────┐
			// │Id 1├────►│Id 2│
			// └────┘     └────┘
			it( 'should set status to "failed_parent" for a job whose parent has status "canceled"', () => {
				const jobs = [ {
					id: 'id1',
					status: 'canceled',
					dependencies: []
				}, {
					id: 'id2',
					status: 'blocked',
					dependencies: [ 'id1' ]
				} ];

				const expectedOutput = [ {
					id: 'id1',
					status: 'canceled',
					dependencies: []
				}, {
					id: 'id2',
					status: 'failed_parent',
					dependencies: [ 'id1' ]
				} ];

				expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
			} );
		} );

		describe( 'status=skipped', () => {
			// Workflow:
			// ┌─────┐
			// │Job A│
			// └─────┘
			it( 'should not modify status of a single skipped job', () => {
				const jobs = [
					{
						id: 'id1',
						status: 'skipped',
						dependencies: []
					}
				];

				const expectedOutput = [
					{
						id: 'id1',
						status: 'skipped',
						dependencies: []
					}
				];

				expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
			} );

			// Workflow:
			// ┌────┐     ┌────┐
			// │Id 1├────►│Id 2│
			// └────┘     └────┘
			it( 'should not modify job whose parent has status "running"', () => {
				const jobs = [ {
					id: 'id1',
					status: 'running',
					dependencies: []
				}, {
					id: 'id2',
					status: 'skipped',
					dependencies: [ 'id1' ]
				} ];

				const expectedOutput = [ {
					id: 'id1',
					status: 'running',
					dependencies: []
				}, {
					id: 'id2',
					status: 'skipped',
					dependencies: [ 'id1' ]
				} ];

				expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
			} );

			// Workflow:
			// ┌────┐     ┌────┐     ┌────┐     ┌────┐
			// │Id 1├────►│Id 2│────►│Id 3│────►│Id 4│
			// └────┘     └────┘     └────┘     └────┘
			it( 'should set status to "failed_parent" for all jobs (including skipped one) following parent with status "failed"', () => {
				const jobs = [ {
					id: 'id1',
					status: 'failed',
					dependencies: []
				}, {
					id: 'id2',
					status: 'blocked',
					dependencies: [ 'id1' ]
				}, {
					id: 'id3',
					status: 'blocked',
					dependencies: [ 'id2' ]
				}, {
					id: 'id4',
					status: 'skipped',
					dependencies: [ 'id3' ]
				} ];

				const expectedOutput = [ {
					id: 'id1',
					status: 'failed',
					dependencies: []
				}, {
					id: 'id2',
					status: 'failed_parent',
					dependencies: [ 'id1' ]
				}, {
					id: 'id3',
					status: 'failed_parent',
					dependencies: [ 'id2' ]
				}, {
					id: 'id4',
					status: 'failed_parent',
					dependencies: [ 'id3' ]
				} ];

				expect( processJobStatuses( jobs ) ).toEqual( expectedOutput );
			} );
		} );
	} );
} );
