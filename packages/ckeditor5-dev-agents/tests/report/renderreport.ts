/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { describe, it, expect } from 'vitest';
import { renderReport } from '../../src/report/renderreport.js';
import { hash } from '../../src/utils/text.js';
import type { Finding } from '../../src/types.js';

describe( 'renderReport()', () => {
	const task = { id: 'meta', title: 'Meta description' };
	const target = { root: 'projects/cs', slug: 'owner/repo' };

	const createFinding = ( overrides: Partial<Finding> = {} ): Finding => {
		const finding = {
			task: 'meta',
			unit: 'docs/a.md',
			ruleId: 'M1',
			discriminator: '',
			detail: 'No description.',
			fragment: 'abc',
			path: 'docs/a.md',
			...overrides
		};

		const fingerprint = `${ finding.task }|${ finding.unit }|${ finding.ruleId }|${ finding.discriminator }`;

		return { fingerprint, id: hash( fingerprint ), ...finding };
	};

	it( 'renders a report without findings', () => {
		const report = renderReport( { task, target, branch: 'stable', open: [] } );

		expect( report ).toBe( [
			'<!-- Generated from open.json by @ckeditor/ckeditor5-dev-agents. Edit open.json instead. -->',
			'',
			'# Meta description',
			'',
			'There are no findings.',
			''
		].join( '\n' ) );
	} );

	it( 'renders open and fixed findings in separate sections, grouped by unit and sorted', () => {
		const report = renderReport( {
			task,
			target,
			branch: 'stable',
			open: [
				createFinding( { unit: 'docs/b.md', path: 'docs/b.md' } ),
				createFinding( { ruleId: 'M2', discriminator: 'Intro' } ),
				createFinding(),
				createFinding( { unit: 'docs/c.md', path: 'docs/c.md', fix: { files: [ 'docs/c.md', 'docs/d.md' ], fragment: 'new', fixedAt: '2026-09-29' } } )
			]
		} );

		expect( report ).toContain( '**3** open findings, **1** fixed in the report pull request.' );
		expect( report ).toContain( 'Resolve each finding in one of these ways, using the ID in its heading:' );
		expect( report ).toContain( '* Reject it: check out the report branch and run `ckeditor5-dev-agents reject <id> --reason "…"`. ' +
			'It records why the finding is wrong in `projects/cs/.ai-tasks/meta/decisions/`, removes it from `open.json`, ' +
			'and reverts its fix. The decision holds until the judged content changes. Commit and push the result.' );
		expect( report ).toContain( '* Dismiss it: `ckeditor5-dev-agents dismiss <id>` does the same without a decision' );

		const fixedIndex = report.indexOf( '## Fixed in the report pull request' );
		const openIndex = report.indexOf( '## Open' );
		const unitA = report.indexOf( '### [`docs/a.md`](https://github.com/owner/repo/blob/stable/projects/cs/docs/a.md)' );
		const unitB = report.indexOf( '### [`docs/b.md`]' );
		const unitC = report.indexOf( '### [`docs/c.md`]' );

		expect( fixedIndex ).toBeGreaterThan( 0 );
		expect( fixedIndex ).toBeLessThan( unitC );
		expect( unitC ).toBeLessThan( openIndex );
		expect( openIndex ).toBeLessThan( unitA );
		expect( unitA ).toBeLessThan( unitB );

		expect( report ).toContain( '**Proposed fix:** `docs/c.md`, `docs/d.md`. Review it in the diff.' );
		expect( report ).toContain( `#### M2: Intro \`[${ hash( 'meta|docs/a.md|M2|Intro' ) }]\`` );
		expect( report ).toContain( `#### M1 \`[${ hash( 'meta|docs/a.md|M1|' ) }]\`` );
		expect( report ).toContain( '<!-- fp: meta|docs/a.md|M1| -->' );

		// The commands replaced the decision templates.
		expect( report ).not.toContain( '```yaml' );
		expect( report ).not.toContain( '<details>' );

		// Both units of `docs/a.md` are listed under one heading.
		expect( report.split( '### [`docs/a.md`]' ) ).toHaveLength( 2 );
	} );

	it( 'uses the singular form for one open finding and links nothing for units without a path', () => {
		const report = renderReport( {
			task,
			target: { root: '.', slug: 'owner/repo' },
			branch: 'stable',
			open: [ createFinding( { unit: 'dependency:vite', path: undefined } ) ]
		} );

		expect( report ).toContain( '**1** open finding, **0** fixed' );
		expect( report ).toContain( '### `dependency:vite`' );
		expect( report ).toContain( 'records why the finding is wrong in `.ai-tasks/meta/decisions/`' );
	} );

	it( 'explains why a rejected finding is reported again', () => {
		const report = renderReport( {
			task,
			target,
			branch: 'stable',
			open: [
				createFinding( { fragment: 'new', previousDecision: { file: 'a.yml', fragment: 'old', finding: 'Old\nclaim.', reason: 'Because\n  reasons.' } } ),
				createFinding( { unit: 'docs/b.md', previousDecision: { file: 'b.yml', fragment: 'old', finding: '', reason: 'No claim.' } } )
			]
		} );

		expect( report ).toContain( '> This finding was rejected before, in `a.yml` ' +
			'([history](https://github.com/owner/repo/commits/stable/projects/cs/.ai-tasks/meta/decisions/a.yml)). ' +
			'It is reported again because the judged content changed: `old` → `new`.' );
		expect( report ).toContain( '> **Previous claim:** Old claim.' );
		expect( report ).toContain( '> **Answer:** Because reasons.' );
		expect( report.match( /Previous claim/g ) ).toHaveLength( 1 );
		expect( report ).toContain( '> **Answer:** No claim.' );
	} );
} );
