/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const ALLOWED_BRANCHES = [
	'stable',
	'master'
];

const ALLOWED_EVENTS = [
	'push',
	'cron',
	'api'
];

/**
 * Checks whether notification should be sent. If not, the process terminates.
 */
module.exports = function checkIfShouldNotify( { branch, event, exitCode } ) {
	// Send a notification only for main branches...
	if ( !ALLOWED_BRANCHES.includes( branch ) ) {
		printLog( `Aborting due to an invalid branch (${ branch }).` );

		process.exit();
	}

	// ...and an event that triggered the build is correct...
	if ( !ALLOWED_EVENTS.includes( event ) ) {
		printLog( `Aborting due to an invalid event type (${ event }).` );

		process.exit();
	}

	// ...and for builds that failed.
	if ( exitCode == 0 ) {
		printLog( 'The build did not fail. The notification will not be sent.' );

		process.exit();
	}
};

/**
 * @param {String} message
 */
function printLog( message ) {
	console.log( '[Slack Notification]', message );
}
