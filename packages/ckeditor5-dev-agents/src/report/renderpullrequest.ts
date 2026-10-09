/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { STATE_DIRECTORY } from '../constants.js';
import { getBlobUrl } from '../utils/githuburls.js';
import { inline, plural } from '../utils/strings.js';
import type { Target, TaskSummary } from '../types.js';

/**
 * Renders the description of the report pull request. It is rewritten on every run that pushes,
 * so it always shows the current number of findings.
 */
export function renderPullRequestBody( { task, target, branch, reportBranch, open, fixed }: {
	task: { id: string; title: string };
	target: Pick<Target, 'name' | 'root' | 'slug'>;
	branch: string;
	reportBranch: string;
	open: number;
	fixed: number;
} ): string {
	const reportUrl = getBlobUrl( target, reportBranch, `${ STATE_DIRECTORY }/${ task.id }/report.md` );

	return [
		`This pull request is maintained by the "${ task.title }" task (\`${ task.id }\`) of \`@ckeditor/ckeditor5-dev-agents\`. ` +
			`It covers \`${ target.name }\` at \`${ branch }\`. Every run pushes new commits here and comments with what it found.`,
		'',
		`**${ open }** open ${ plural( open, 'finding' ) }, **${ fixed }** fixed in this pull request. ` +
			`See [report.md](${ reportUrl }) for the findings and how to review them.`,
		'',
		`Merge this pull request to record the state on \`${ branch }\`. ` +
			'Until then, the next runs continue this branch, so no unit is judged twice.',
		''
	].join( '\n' );
}

/**
 * Renders the comment posted after every run that pushed something.
 */
export function renderRunComment( { today, summary, buildUrl }: {
	today: string;
	summary: TaskSummary;
	buildUrl?: string;
} ): string {
	const heading = buildUrl ? `### [Run](${ buildUrl }) on ${ today }` : `### Run on ${ today }`;

	return [ heading, '', ...renderSummary( summary ) ].join( '\n' );
}

function renderSummary( summary: TaskSummary ): Array<string> {
	const lines = [
		'| Units | Changed | Judged | Left | New findings | Already open | Rejected | Fixed | Discarded | Files changed | Errors | ' +
			'Open | Cost |',
		'| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
		'| ' + [
			summary.units,
			summary.changed,
			summary.judged,
			summary.deferred,
			summary.newFindings,
			summary.alreadyOpen,
			summary.rejected,
			summary.fixed,
			summary.discarded,
			summary.changedFiles,
			summary.errors,
			summary.open,
			`$${ summary.cost.toFixed( 2 ) }`
		].join( ' | ' ) + ' |',
		''
	];

	// A message may hold the multi-line output of a command, which would break the list.
	const problems = summary.problems.map( ( { unit, message } ) => `* ${ unit ? `\`${ unit }\`: ` : '' }${ inline( message ) }` );

	if ( problems.length ) {
		lines.push( '#### Problems', '', ...problems, '' );
	}

	return lines;
}
