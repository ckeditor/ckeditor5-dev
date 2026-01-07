/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import notifier from 'node-notifier';

const ckeditor5icon = path.join( import.meta.dirname, '..', 'icons', 'ckeditor5.png' );

const defaultNotifyOptions = {
	appID: 'CKEditor 5 Tests',
	sound: false,
	icon: ckeditor5icon
};

export default { 'reporter:karmanotifier': [ 'type', karmaNotifier ] };
karmaNotifier.$inject = [ 'helper' ];

function karmaNotifier( helper ) {
	const { formatTimeInterval } = helper;

	this.onBrowserComplete = browser => {
		const result = browser.lastResult;
		const footer = `\n\nExecution time: ${ formatTimeInterval( result.totalTime ) }\n${ browser.name }`;

		if ( result.disconnected ) {
			notifier.notify( {
				title: 'CKEditor 5 tests: Disconnected.',
				message: 'Browser was disconnected before all tests finished.' + footer,
				...defaultNotifyOptions
			} );

			return;
		}

		if ( result.error ) {
			notifier.notify( {
				title: 'CKEditor 5 tests: Error.',
				message: 'An unexpected error occurred.' + footer,
				...defaultNotifyOptions
			} );

			return;
		}

		if ( result.failed ) {
			notifier.notify( {
				title: 'CKEditor 5 tests: Failure.',
				message: `Out of ${ result.total } tests, ${ result.failed } failed.` + footer,
				...defaultNotifyOptions
			} );

			return;
		}

		notifier.notify( {
			title: 'CKEditor 5 tests: Success.',
			message: `All ${ result.success } tests passed.` + footer,
			...defaultNotifyOptions
		} );
	};
}
