/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { STATE_DIRECTORY } from '../constants.js';
import { getBlobUrl, getHistoryUrl } from '../utils/githuburls.js';
import { compare, inline, plural } from '../utils/strings.js';
import type { Finding, Target } from '../types.js';

/**
 * Renders `report.md` of one task from its findings. The file is regenerated on every run,
 * so `open.json` stays the only source of truth.
 */
export function renderReport( { task, target, branch, open }: {
	task: { id: string; title: string };
	target: Pick<Target, 'root' | 'slug'>;
	branch: string;
	open: Array<Finding>;
} ): string {
	const taskStatePath = `${ STATE_DIRECTORY }/${ task.id }`;
	const sorted = open.toSorted( ( a, b ) => compare( a.fingerprint, b.fingerprint ) );
	const fixed = sorted.filter( finding => finding.fix );
	const unresolved = sorted.filter( finding => !finding.fix );
	const lines = [
		'<!-- Generated from open.json by @ckeditor/ckeditor5-dev-agents. Edit open.json instead. -->',
		'',
		`# ${ task.title }`,
		''
	];

	if ( !open.length ) {
		lines.push( 'There are no findings.', '' );

		return lines.join( '\n' );
	}

	lines.push(
		`**${ unresolved.length }** open ${ plural( unresolved.length, 'finding' ) }, ` +
			`**${ fixed.length }** fixed in the report pull request.`,
		'',
		'Resolve each finding in one of these ways, using the ID in its heading:',
		'',
		'* Keep it: keep the proposed fix, or fix it yourself in the report pull request.',
		'* Reject it: check out the report branch and run `ckeditor5-dev-agents reject <id> --reason "…"`. It records why ' +
			`the finding is wrong in \`${ upath.join( target.root, taskStatePath ) }/decisions/\`, removes it from \`open.json\`, ` +
			'and reverts its fix. The decision holds until the judged content changes. Commit and push the result.',
		'* Dismiss it: `ckeditor5-dev-agents dismiss <id>` does the same without a decision, so it may be reported again once the judged ' +
			'content changes.',
		'',
		'Reverting a fix by hand, without rejecting the finding, means the task finds the problem and fixes it again on a later run.',
		''
	);

	const renderFinding = ( finding: Finding ) => {
		const title = finding.discriminator ? `${ finding.ruleId }: ${ finding.discriminator }` : finding.ruleId;
		const findingLines = [
			`#### ${ title } \`[${ finding.id }]\``, '', `<!-- fp: ${ finding.fingerprint } -->`, '', finding.detail, ''
		];

		if ( finding.fix ) {
			const files = finding.fix.files.map( file => `\`${ file }\`` ).join( ', ' );

			findingLines.push( `**Proposed fix:** ${ files }. Review it in the diff.`, '' );
		}

		if ( finding.previousDecision ) {
			const { file, fragment, finding: claim, reason } = finding.previousDecision;
			const historyUrl = getHistoryUrl( target, branch, `${ taskStatePath }/decisions/${ file }` );

			findingLines.push(
				'> [!NOTE]',
				`> This finding was rejected before, in \`${ file }\` ([history](${ historyUrl })). ` +
					`It is reported again because the judged content changed: \`${ fragment }\` → \`${ finding.fragment }\`.`,
				...( claim ? [ '>', `> **Previous claim:** ${ inline( claim ) }` ] : [] ),
				'>',
				`> **Answer:** ${ inline( reason ) }`,
				''
			);
		}

		return findingLines;
	};

	const renderFindings = ( heading: string, findings: Array<Finding> ) => {
		if ( !findings.length ) {
			return;
		}

		lines.push( `## ${ heading }`, '' );

		const byUnit = new Map<string, Array<Finding>>();

		for ( const finding of findings ) {
			byUnit.set( finding.unit, [ ...byUnit.get( finding.unit ) ?? [], finding ] );
		}

		for ( const [ unit, unitFindings ] of byUnit ) {
			const { path } = unitFindings[ 0 ]!;

			lines.push( `### ${ path ? `[\`${ unit }\`](${ getBlobUrl( target, branch, path ) })` : `\`${ unit }\`` }`, '' );

			for ( const finding of unitFindings ) {
				lines.push( ...renderFinding( finding ) );
			}
		}
	};

	renderFindings( 'Fixed in the report pull request', fixed );
	renderFindings( 'Open', unresolved );

	return lines.join( '\n' );
}
