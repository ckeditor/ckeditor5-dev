/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// How long the request may take, in milliseconds.
const REQUEST_TIMEOUT = 30_000;

/**
 * Posts the message to a Slack incoming webhook. The text may use the `mrkdwn` formatting of Slack.
 */
export async function postSlackMessage( webhookUrl: string, text: string ): Promise<void> {
	const response = await fetch( webhookUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify( { text } ),
		signal: AbortSignal.timeout( REQUEST_TIMEOUT )
	} );

	if ( !response.ok ) {
		throw new Error( `The Slack webhook responded with status ${ response.status }: ${ ( await response.text() ).trim() }` );
	}
}
