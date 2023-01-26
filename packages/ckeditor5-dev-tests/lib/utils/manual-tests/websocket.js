/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global document, io, window */

( () => {
	const socket = io();
	let currentToastElement;
	let wasDisconnected = false;

	socket.on( 'testCompilationStatus', status => {
		const isOnDll = window.location.href.toString().includes( '-dll.html' );
		const [ eventName, processName ] = status.split( ':' );
		const isDllStatus = processName === 'DLL';

		if ( isOnDll !== isDllStatus ) {
			return;
		}

		if ( eventName === 'start' ) {
			showToast( 'info', toastElement => {
				const text = document.createTextNode( 'Compiling tests…' );
				toastElement.insertBefore( text, toastElement.firstChild );
			} );
		} else if ( eventName === 'finished' ) {
			showUpdateAvailableToast();
		}
	} );

	socket.on( 'disconnect', () => {
		showToast( 'error', toastElement => {
			const text = document.createTextNode( 'Server disconnected' );
			toastElement.insertBefore( text, toastElement.firstChild );
		} );

		wasDisconnected = true;
	} );

	socket.on( 'connect', () => {
		if ( wasDisconnected ) {
			showUpdateAvailableToast();

			wasDisconnected = false;
		}
	} );

	function showUpdateAvailableToast() {
		showToast( 'info', toastElement => {
			const text = document.createTextNode( 'Compilation finished, ' );
			const dot = document.createTextNode( '.' );
			const reloadLink = document.createElement( 'a' );
			reloadLink.setAttribute( 'href', '#' );
			reloadLink.innerText = 'reload page';

			toastElement.insertBefore( dot, toastElement.firstChild );
			toastElement.insertBefore( reloadLink, dot );
			toastElement.insertBefore( text, reloadLink );

			reloadLink.addEventListener( 'click', evt => {
				evt.preventDefault();
				window.location.reload();
			} );
		} );
	}

	function showToast( type, callback ) {
		if ( currentToastElement ) {
			currentToastElement.remove();
		}

		currentToastElement = document.createElement( 'div' );
		currentToastElement.classList.add( 'manual-test-toast' );
		currentToastElement.classList.add( 'manual-test-toast_' + type );

		const closeButton = document.createElement( 'button' );
		closeButton.innerHTML = '✕';
		closeButton.setAttribute( 'type', 'button' );

		closeButton.addEventListener( 'click', () => {
			currentToastElement.remove();
		} );

		currentToastElement.appendChild( closeButton );
		document.body.appendChild( currentToastElement );

		callback( currentToastElement );
	}
} )();
