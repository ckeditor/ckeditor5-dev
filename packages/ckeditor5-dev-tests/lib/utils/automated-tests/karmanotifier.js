/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const notifier = require( 'node-notifier' );

const defaultNotifyOptions = {
	appID: 'karmaNotifier'
};

module.exports = { 'reporter:karmanotifier': [ 'type', karmaNotifier ] };
karmaNotifier.$inject = [ 'helper' ];

function karmaNotifier( helper ) {
	const { formatTimeInterval } = helper;

	this.onBrowserComplete = browser => {
		const result = browser.lastResult;
		const footer = `\n\nExecution time: ${ formatTimeInterval( result.totalTime ) }\n${ browser.name }`;

		if ( result.disconnected ) {
			notifier.notify( {
				title: 'CKEditor5 tests: Browser Disconnected',
				message: 'Browser was disconnected before all tests finished.' + footer,
				...defaultNotifyOptions
			} );

			return;
		}

		if ( result.error ) {
			notifier.notify( {
				title: 'CKEditor5 tests: Error',
				message: 'An unexpected error occurred.' + footer,
				...defaultNotifyOptions
			} );

			return;
		}

		if ( result.failed ) {
			notifier.notify( {
				title: 'CKEditor5 tests: Failure',
				message: `Out of ${ result.total } tests, ${ result.failed } failed.` + footer,
				...defaultNotifyOptions
			} );

			return;
		}

		notifier.notify( {
			title: 'CKEditor5 tests: Success',
			message: `All ${ result.success } tests passed.` + footer,
			...defaultNotifyOptions
		} );
	};
}
