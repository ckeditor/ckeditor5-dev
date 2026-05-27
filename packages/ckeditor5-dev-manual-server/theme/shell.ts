/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
import type { ManualData } from '../src/manual-test-plugin/plugin.js';

import './shell.css';

declare const LICENSE_KEY: string;

const globalTarget = window as any;

renderManual();
ensureManualTestContainer();

// In direct HTML manual tests, `id="editor"` creates `window.editor` as a named DOM property.
// Reset it so manual tests can safely reuse `window.editor` for the editor instance.
if ( globalTarget.editor instanceof Element ) {
	globalTarget.editor = null;
}

if ( !globalTarget.CKEditorInspector ) {
	globalTarget.CKEditorInspector = CKEditorInspector;
}

if ( !globalTarget.CKEDITOR_GLOBAL_LICENSE_KEY ) {
	globalTarget.CKEDITOR_GLOBAL_LICENSE_KEY = LICENSE_KEY;
}

/**
 * Clones the injected Shell template, fills it with current test metadata,
 * and prepends it to the page before the test content is wrapped.
 */
function renderManual(): void {
	const template = document.querySelector<HTMLTemplateElement>( '#manual-shell-template' )!;
	const dataElement = document.querySelector<HTMLScriptElement>( '#manual-shell-data' )!;
	const data = JSON.parse( dataElement.textContent! ) as ManualData;
	const fragment = template.content.cloneNode( true ) as DocumentFragment;

	for ( const element of fragment.querySelectorAll<HTMLElement>( '[data-manual-shell-field="displayName"]' ) ) {
		element.textContent = data.displayName;
	}

	for ( const element of fragment.querySelectorAll<HTMLElement>( '[data-manual-shell-field="packageName"]' ) ) {
		element.textContent = data.packageName;
	}

	if ( data.instructionsHtml ) {
		fragment.querySelector<HTMLElement>( '.shell-instructions__body' )!.innerHTML = data.instructionsHtml;
	} else {
		for ( const element of fragment.querySelectorAll<HTMLElement>( '[data-manual-shell-section="instructions"]' ) ) {
			element.remove();
		}
	}

	template.remove();
	dataElement.remove();
	document.body.prepend( fragment );
}

/**
 * Wraps manual test content in a stable container while keeping Shell UI outside it.
 */
function ensureManualTestContainer(): void {
	document.body.classList.add( 'shell-enabled' );

	if ( document.querySelector( '.shell-instructions' ) ) {
		document.body.classList.add( 'shell-has-instructions' );
	}

	const container = document.createElement( 'div' );
	container.className = 'manual-test-container';

	for ( const node of Array.from( document.body.childNodes ) ) {
		if (
			node instanceof Element &&
			( node.classList.contains( 'shell' ) || node.classList.contains( 'shell-instructions' ) )
		) {
			continue;
		}

		container.appendChild( node );
	}

	document.body.appendChild( container );
}

/**
 * Opens or closes the instructions panel and synchronizes related accessibility state.
 */
function toggleInstructions( isOpen: boolean ): void {
	const panel = document.querySelector<HTMLElement>( '.shell-instructions' );
	const trigger = document.querySelector<HTMLElement>( '[data-shell-action="show-instructions"]' );

	if ( !panel ) {
		return;
	}

	panel.classList.remove( 'shell-instructions--closing' );

	if ( !isOpen && panel.classList.contains( 'shell-instructions--open' ) ) {
		panel.classList.add( 'shell-instructions--closing' );
	}

	panel.classList.toggle( 'shell-instructions--open', isOpen );
	panel.setAttribute( 'aria-hidden', String( !isOpen ) );
	panel.toggleAttribute( 'inert', !isOpen );
	trigger!.setAttribute( 'aria-expanded', String( isOpen ) );
}

/**
 * Handles clicks on Shell action buttons.
 */
document.addEventListener( 'click', event => {
	const target = event.target;

	if ( !( target instanceof Element ) ) {
		return;
	}

	const trigger = target.closest<HTMLElement>( '[data-shell-action]' );

	if ( !trigger ) {
		return;
	}

	if ( trigger.dataset.shellAction == 'show-instructions' ) {
		const panel = document.querySelector<HTMLElement>( '.shell-instructions' )!;

		toggleInstructions( !panel.classList.contains( 'shell-instructions--open' ) );
	} else if ( trigger.dataset.shellAction == 'close-instructions' ) {
		toggleInstructions( false );
	}
} );

/**
 * Cleans up the closing state after the instructions panel transition finishes.
 */
document.addEventListener( 'transitionend', event => {
	const target = event.target;

	if (
		event.propertyName == 'width' &&
		target instanceof Element &&
		target.classList.contains( 'shell-instructions' ) &&
		!target.classList.contains( 'shell-instructions--open' )
	) {
		target.classList.remove( 'shell-instructions--closing' );
	}
} );

/**
 * Allows closing the instructions panel with Escape.
 */
document.addEventListener( 'keydown', event => {
	if ( event.key == 'Escape' ) {
		toggleInstructions( false );
	}
} );
