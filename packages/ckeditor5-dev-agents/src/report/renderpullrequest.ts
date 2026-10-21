/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { STATE_DIRECTORY } from '../constants.js';
import { getBlobUrl } from '../utils/githuburls.js';
import { inline, plural } from '../utils/strings.js';
import type { Target, TaskSummary } from '../types.js';

/**
 * Renders the description of a report pull request. Every run that finds something new opens one, on top of
 * the report pull requests that are still open.
 */
export function renderPullRequestBody( { task, target, branch, reportBranch, parent, open, fixed }: {
	task: { id: string; title: string };
	target: Pick<Target, 'name' | 'root' | 'slug'>;
	branch: string;
	reportBranch: string;

	/**
	 * The open report pull request that this one is stacked on.
	 */
	parent?: { number: number };
	open: number;
	fixed: number;
} ): string {
	const reportUrl = getBlobUrl( target, reportBranch, `${ STATE_DIRECTORY }/${ task.id }/report.md` );

	return [
		`This pull request is maintained by the "${ task.title }" task (\`${ task.id }\`) of \`@ckeditor/ckeditor5-dev-agents\`. ` +
			`It covers \`${ target.name }\` at \`${ branch }\`.`,
		'',
		`**${ open }** open ${ plural( open, 'finding' ) }, **${ fixed }** fixed in this pull request. ` +
			`See [report.md](${ reportUrl }) for the findings and how to review them.`,
		'',
		parent ?
			`It is stacked on #${ parent.number }, so it shows only the changes of this run. Merge #${ parent.number } first, ` +
				`with a merge commit. GitHub then bases this pull request on \`${ branch }\`.` :
			`Merge this pull request, with a merge commit, to record the state on \`${ branch }\`.`,
		'',
		'While it is open, every run that finds something new opens another pull request on top of it, so no unit is judged twice.',
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

/**
 * Renders the Slack message about a new report pull request, in the `mrkdwn` formatting of Slack.
 */
export function renderSlackMessage( { task, target, branch, pullRequest, summary }: {
	task: { title: string };
	target: Pick<Target, 'name'>;
	branch: string;
	pullRequest: { number: number; html_url: string };
	summary: TaskSummary;
} ): string {
	const { newFindings, fixed, open } = summary;

	return `*${ escapeSlack( task.title ) }* (${ escapeSlack( target.name ) }, \`${ escapeSlack( branch ) }\`) opened ` +
		`<${ pullRequest.html_url }|#${ pullRequest.number }>: ${ newFindings } new ${ plural( newFindings, 'finding' ) }, ` +
		`${ fixed } fixed, ${ open } open.`;
}

// Slack reads `&`, `<` and `>` as the start of a control sequence.
function escapeSlack( text: string ): string {
	return text.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
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
