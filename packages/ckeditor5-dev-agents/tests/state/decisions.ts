/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, describe, it, expect } from 'vitest';
import upath from 'upath';
import { findDecisions, getDecisionFileName, getPriorDecisions, loadDecisions, renderDecision } from '../../src/state/decisions.js';
import { createTempDirectory, removeTempDirectories, writeFiles } from '../_utils/files.js';
import type { Decision, Finding } from '../../src/types.js';

describe( 'loadDecisions()', () => {
	afterEach( removeTempDirectories );

	it( 'returns nothing for a directory that does not exist', async () => {
		const root = await createTempDirectory();

		expect( await loadDecisions( upath.join( root, 'missing' ) ) ).toEqual( { decisions: [], warnings: [] } );
	} );

	it( 'loads `*.yml` files, sorted, and keeps hashes as strings', async () => {
		const root = await createTempDirectory();

		await writeFiles( root, {
			'b.yml': 'unit: docs/b.md\nrule: R2\nfragment: 012345678901\nreason: |\n  Multi\n  line.\n',
			'a.yml': 'unit: " docs/a.md "\nrule: R1\ndiscriminator: Heading\nfragment: abc\nfinding: Too long.\nreason: Fine.\n',
			'c.yaml': 'ignored',
			'notes.txt': 'ignored'
		} );

		const { decisions, warnings } = await loadDecisions( root );

		expect( warnings ).toEqual( [] );
		expect( decisions ).toEqual( [
			{ file: 'a.yml', unit: 'docs/a.md', rule: 'R1', discriminator: 'Heading', fragment: 'abc', finding: 'Too long.', reason: 'Fine.' },
			{ file: 'b.yml', unit: 'docs/b.md', rule: 'R2', discriminator: '', fragment: '012345678901', finding: '', reason: 'Multi\nline.' }
		] );
	} );

	it( 'skips files that cannot be used and reports them as warnings', async () => {
		const root = await createTempDirectory();

		await writeFiles( root, {
			'1-invalid.yml': 'unit: [\n',
			'2-list.yml': '- a\n- b\n',
			'3-empty.yml': '',
			'4-missing.yml': 'unit: a\nrule: R1\nfragment: abc\n',
			'5-blank.yml': 'unit: a\nrule: R1\nfragment: abc\nreason: "  "\n',
			'6-nested.yml': 'unit: a\nrule: R1\nfragment: abc\nreason: x\nfinding:\n  nested: true\n',
			'7-nested-required.yml': 'unit:\n  nested: true\nrule: R1\nfragment: abc\nreason: x\n'
		} );

		const { decisions, warnings } = await loadDecisions( root );

		expect( decisions ).toEqual( [] );
		expect( warnings ).toHaveLength( 7 );
		expect( warnings[ 0 ] ).toMatch( /^The "decisions\/1-invalid.yml" decision file was skipped: [^\n]+$/ );
		expect( warnings.slice( 1 ) ).toEqual( [
			'The "decisions/2-list.yml" decision file was skipped: It must contain a single YAML mapping.',
			'The "decisions/3-empty.yml" decision file was skipped: It must contain a single YAML mapping.',
			'The "decisions/4-missing.yml" decision file was skipped: The "reason" field must be a non-empty string.',
			'The "decisions/5-blank.yml" decision file was skipped: The "reason" field must be a non-empty string.',
			'The "decisions/6-nested.yml" decision file was skipped: The "finding" field must be a string.',
			'The "decisions/7-nested-required.yml" decision file was skipped: The "unit" field must be a non-empty string.'
		] );
	} );
} );

describe( 'findDecisions()', () => {
	const decisions: Array<Decision> = [
		{ file: 'a.yml', unit: 'u', rule: 'R1', discriminator: '', fragment: 'f1', finding: '', reason: 'x' },
		{ file: 'b.yml', unit: 'u', rule: 'R1', discriminator: 'd', fragment: 'f1', finding: '', reason: 'x' },
		{ file: 'c.yml', unit: 'u', rule: 'R2', discriminator: '', fragment: 'f1', finding: '', reason: 'x' },
		{ file: 'd.yml', unit: 'v', rule: 'R1', discriminator: '', fragment: 'f1', finding: '', reason: 'x' }
	];

	it( 'returns the decisions about the same unit, rule and discriminator', () => {
		expect( findDecisions( decisions, { unit: 'u', ruleId: 'R1', discriminator: '' } ).map( decision => decision.file ) ).toEqual( [ 'a.yml' ] );
		expect( findDecisions( decisions, { unit: 'u', ruleId: 'R1', discriminator: 'd' } ).map( decision => decision.file ) ).toEqual( [ 'b.yml' ] );
		expect( findDecisions( decisions, { unit: 'w', ruleId: 'R1', discriminator: '' } ) ).toEqual( [] );
	} );
} );

describe( 'getPriorDecisions()', () => {
	it( 'returns the decisions about the unit without the file, marked as expired or not', () => {
		const decisions: Array<Decision> = [
			{ file: 'a.yml', unit: 'u', rule: 'R1', discriminator: '', fragment: 'now', finding: 'Claim.', reason: 'Answer.' },
			{ file: 'b.yml', unit: 'u', rule: 'R2', discriminator: 'd', fragment: 'old', finding: '', reason: 'Other.' },
			{ file: 'c.yml', unit: 'v', rule: 'R1', discriminator: '', fragment: 'now', finding: '', reason: 'x' }
		];

		expect( getPriorDecisions( decisions, 'u', 'now' ) ).toEqual( [
			{ unit: 'u', rule: 'R1', discriminator: '', fragment: 'now', finding: 'Claim.', reason: 'Answer.', expired: false },
			{ unit: 'u', rule: 'R2', discriminator: 'd', fragment: 'old', finding: '', reason: 'Other.', expired: true }
		] );
	} );
} );

describe( 'renderDecision()', () => {
	afterEach( removeTempDirectories );

	const finding = ( overrides: Partial<Finding> = {} ): Finding => ( {
		fingerprint: 'meta|docs/a.md|M1|',
		id: 'abc123',
		task: 'meta',
		unit: 'docs/a.md',
		ruleId: 'M1',
		discriminator: '',
		detail: 'No description.',
		fragment: '012345678901',
		...overrides
	} );

	it( 'renders a decision that loads back, without an empty discriminator', async () => {
		const root = await createTempDirectory();
		const content = renderDecision( finding(), 'It is an overview page.' );

		expect( content ).not.toContain( 'discriminator' );

		await writeFiles( root, { 'decision.yml': content } );

		expect( await loadDecisions( root ) ).toEqual( {
			decisions: [ {
				file: 'decision.yml',
				unit: 'docs/a.md',
				rule: 'M1',
				discriminator: '',
				fragment: '012345678901',
				finding: 'No description.',
				reason: 'It is an overview page.'
			} ],
			warnings: []
		} );
	} );

	it( 'keeps special characters and the discriminator', async () => {
		const root = await createTempDirectory();

		await writeFiles( root, {
			'decision.yml': renderDecision( finding( { discriminator: 'Heading: "quoted"', detail: 'Has: a colon and # hash.' } ), 'Because: yes.' )
		} );

		const { decisions } = await loadDecisions( root );

		expect( decisions[ 0 ] ).toMatchObject( { discriminator: 'Heading: "quoted"', finding: 'Has: a colon and # hash.', reason: 'Because: yes.' } );
	} );
} );

describe( 'getDecisionFileName()', () => {
	it( 'builds a readable name from the rule, the unit without `.md`, and the discriminator', () => {
		expect( getDecisionFileName( { ruleId: 'M1', unit: 'docs/a.md', discriminator: '' } ) ).toBe( 'm1-docs-a' );
		expect( getDecisionFileName( { ruleId: 'M2', unit: 'docs/a.md', discriminator: 'Intro' } ) ).toBe( 'm2-docs-a-intro' );
		expect( getDecisionFileName( { ruleId: 'M1', unit: 'dependency:vite', discriminator: '' } ) ).toBe( 'm1-dependency-vite' );
		expect( getDecisionFileName( { ruleId: '-', unit: '/x/', discriminator: '' } ) ).toBe( 'x' );
	} );
} );
