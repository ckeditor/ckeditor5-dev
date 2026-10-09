/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { describe, it, expect } from 'vitest';
import { renderPullRequestBody, renderRunComment } from '../../src/report/renderpullrequest.js';
import type { TaskSummary } from '../../src/types.js';

describe( 'pull request rendering', () => {
	const task = { id: 'meta', title: 'Meta description' };
	const target = { name: 'cs', root: 'projects/cs', slug: 'owner/repo' };

	const summary: TaskSummary = {
		task: 'meta',
		title: 'Meta description',
		units: 10,
		changed: 4,
		judged: 3,
		deferred: 7,
		newFindings: 2,
		alreadyOpen: 1,
		rejected: 1,
		fixed: 1,
		discarded: 2,
		changedFiles: 3,
		open: 5,
		errors: 1,
		problems: [
			{ unit: 'docs/c.md', message: 'Boom.' },
			{ unit: 'docs/b.md', message: 'The fix was discarded. The fix did not resolve any finding.' },
			{ message: 'A warning.' }
		],
		cost: 1.234,
		tokens: 1000
	};

	it( 'renderPullRequestBody() shows the counts and links the report on the report branch', () => {
		const body = renderPullRequestBody( { task, target, branch: 'stable', reportBranch: 'ai-tasks/meta/cs/stable', open: 1, fixed: 2 } );

		expect( body ).toContain( 'the "Meta description" task (`meta`)' );
		expect( body ).toContain( 'It covers `cs` at `stable`.' );
		expect( body ).toContain( '**1** open finding, **2** fixed in this pull request.' );
		expect( body ).toContain( 'See [report.md](https://github.com/owner/repo/blob/ai-tasks/meta/cs/stable/projects/cs/.ai-tasks/meta/report.md) ' +
			'for the findings and how to review them.' );
		expect( body ).toContain( 'Merge this pull request to record the state on `stable`.' );
		expect( renderPullRequestBody( { task, target, branch: 'stable', reportBranch: 'x', open: 3, fixed: 0 } ) ).toContain( '**3** open findings' );
	} );

	it( 'renderRunComment() renders the summary table and the problems', () => {
		const comment = renderRunComment( { today: '2026-09-29', summary, buildUrl: 'https://ci/1' } );

		expect( comment ).toContain( '### [Run](https://ci/1) on 2026-09-29' );
		expect( comment ).toContain( '| Units | Changed | Judged | Left | New findings |' );
		expect( comment ).toContain( '| Fixed | Discarded | Files changed | Errors |' );
		expect( comment ).toContain( '| 10 | 4 | 3 | 7 | 2 | 1 | 1 | 1 | 2 | 3 | 1 | 5 | $1.23 |' );
		expect( comment ).toContain( '#### Problems' );
		expect( comment ).toContain( '* `docs/c.md`: Boom.' );
		expect( comment ).toContain( '* `docs/b.md`: The fix was discarded. The fix did not resolve any finding.' );
		expect( comment ).toContain( '* A warning.' );
	} );

	it( 'renderRunComment() joins multi-line problems into one line, so they do not break the list', () => {
		const comment = renderRunComment( {
			today: '2026-09-29',
			summary: { ...summary, problems: [ { unit: 'docs/c.md', message: '"npm test" exited with code 1:\n  Line 1\n\nLine 2\n' }, { message: 'A\nwarning.' } ] }
		} );

		expect( comment ).toContain( '* `docs/c.md`: "npm test" exited with code 1: Line 1 Line 2\n' );
		expect( comment ).toContain( '* A warning.\n' );
	} );

	it( 'renderRunComment() without problems', () => {
		const comment = renderRunComment( {
			today: '2026-09-29',
			summary: { ...summary, errors: 0, problems: [] }
		} );

		expect( comment ).toContain( '### Run on 2026-09-29' );
		expect( comment ).not.toContain( 'Problems' );
	} );
} );
