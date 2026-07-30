/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import promptStyles from './manual-bootstrap.css?inline';

declare const LICENSE_KEY: string;

interface ViteHotContextLike {
	on( event: string, callback: () => void ): void;
}

const MANUAL_REFRESH_EVENT_NAME = 'ckeditor5-manual:refresh-available';

const globalTarget = window as any;

/**
 * Invisible environment setup injected by the manual test server into EVERY manual test page
 * (`*.manual.html`), with or without the `<ck-manual-header>` chrome:
 *
 * - sets the global license key so tests do not have to pass `licenseKey` explicitly;
 * - resets the `window.editor` named DOM property and auto-attaches the CKEditor inspector;
 * - renders the "source changed" refresh prompt driven by the dev server (`refreshPlugin`).
 *
 * The refresh prompt is part of the dev-server contract, not test chrome, so it belongs here.
 */

// In direct HTML manual tests, `id="editor"` creates `window.editor` as a named DOM property.
// Reset it so manual tests can safely reuse `window.editor` for the editor instance.
if ( globalTarget.editor instanceof Element ) {
	globalTarget.editor = null;
}

globalTarget.CKEditorInspector ||= CKEditorInspector;

if ( typeof LICENSE_KEY != 'undefined' ) {
	globalTarget.CKEDITOR_GLOBAL_LICENSE_KEY ||= LICENSE_KEY;
}

autoAttachInspector();
setUpRefreshPrompt();

function autoAttachInspector(): void {
	let editor = globalTarget.editor;

	Object.defineProperty( globalTarget, 'editor', {
		configurable: true,
		set( value ) {
			editor = value;

			if ( editor ) {
				CKEditorInspector.attach( editor );
			}
		},
		get() {
			return editor;
		}
	} );
}

/**
 * Shows a refresh prompt when the dev server reports source changes (see `refreshPlugin`).
 */
function setUpRefreshPrompt(): void {
	const hot = ( import.meta as ImportMeta & { hot?: ViteHotContextLike } ).hot;

	if ( !hot ) {
		return;
	}

	const button = document.createElement( 'button' );

	button.type = 'button';
	button.className = 'refresh-prompt';
	button.textContent = 'Source changed. Click here to refresh the page.';
	button.tabIndex = -1;
	button.setAttribute( 'aria-hidden', 'true' );
	button.addEventListener( 'click', () => window.location.reload() );

	// Render the prompt inside a shadow host so its styles do not leak into the test page.
	const host = document.createElement( 'div' );
	const shadow = host.attachShadow( { mode: 'open' } );
	const sheet = new CSSStyleSheet();

	sheet.replaceSync( promptStyles );
	shadow.adoptedStyleSheets = [ sheet ];
	shadow.append( button );

	const appendHost = () => document.body.append( host );

	if ( document.body ) {
		appendHost();
	} else {
		document.addEventListener( 'DOMContentLoaded', appendHost );
	}

	hot.on( MANUAL_REFRESH_EVENT_NAME, () => {
		button.removeAttribute( 'aria-hidden' );
		button.removeAttribute( 'tabindex' );
		button.classList.add( 'refresh-prompt--visible' );
	} );
}
