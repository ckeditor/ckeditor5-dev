/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Shadow DOM chrome styles and document-scoped instruction typography.
// Imported as raw strings so they can be adopted into constructable stylesheets.
import headerStyles from './manual-header.css?inline';
import instructionsStyles from './manual-instructions.css?inline';

const MANUAL_HEADER_DATA_META = 'ck-manual-header';

const headerStyleSheet = createStyleSheet( headerStyles );
const instructionsStyleSheet = createStyleSheet( instructionsStyles );

/* eslint-disable @stylistic/max-len */
const TEMPLATE = /* html */ `
	<div class="bar">
		<a class="pill back" title="Back to test index">&larr; All tests</a>
		<span class="divider" aria-hidden="true"></span>
		<span class="label">
			<span class="label__name" data-field="name"></span>
			<span class="label__package" data-field="package"></span>
		</span>
		<span class="divider instructions-only" aria-hidden="true"></span>
		<button type="button" class="pill instructions-only" data-action="toggle" aria-expanded="false">
			Instructions
		</button>
	</div>
	<aside class="panel" aria-hidden="true" inert>
		<div class="panel__inner">
			<header class="panel__header">
				<div class="panel__titles">
					<h1 class="panel__title" data-field="name"></h1>
					<code class="panel__package" data-field="package"></code>
				</div>
				<button type="button" class="panel__close" data-action="close" aria-label="Close">
					<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
						<path fill="currentColor" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
					</svg>
				</button>
			</header>
			<article class="panel__body"><slot></slot></article>
		</div>
	</aside>
`;
/* eslint-enable @stylistic/max-len */

/**
 * `<ck-manual-header>` renders the manual test chrome: a fixed header bar with the test
 * name, package name and a back-to-index link, plus a collapsible instructions panel that
 * projects the element's light-DOM children (default slot).
 *
 * The manual test server injects a `<meta name="ck-manual-header">` carrying the package
 * name and the base-aware catalog href, and the `<script>` that defines this
 * element — only on pages whose source contains `<ck-manual-header`. Pages without the
 * element render with no chrome. The invisible environment setup (license key, inspector,
 * refresh prompt) lives in `manual-bootstrap.ts` and is injected into every manual test page.
 *
 * Without this script the element is unknown and its children render as plain readable markup.
 */
class ManualHeaderElement extends HTMLElement {
	private _panel!: HTMLElement;

	constructor() {
		super();

		const shadow = this.attachShadow( { mode: 'open' } );

		shadow.adoptedStyleSheets = [ headerStyleSheet ];
		shadow.innerHTML = TEMPLATE;
	}

	public connectedCallback(): void {
		adoptInstructionsStyles();

		const data = readManualHeaderData();
		const shadow = this.shadowRoot!;

		this._panel = shadow.querySelector<HTMLElement>( '.panel' )!;

		const backLink = shadow.querySelector<HTMLAnchorElement>( '.back' )!;

		backLink.href = data.catalogHref;

		for ( const element of shadow.querySelectorAll<HTMLElement>( '[data-field="name"]' ) ) {
			element.textContent = this._resolveDisplayName();
		}

		for ( const element of shadow.querySelectorAll<HTMLElement>( '[data-field="package"]' ) ) {
			element.textContent = data.packageName;
		}

		this._setUpInstructions();
		this._setUpActions( shadow );
	}

	/**
	 * The visible name comes from the first slotted heading if present, otherwise `document.title`,
	 * falling back to the test path relative to `tests/manual/` derived from the page URL.
	 * This avoids `<title>`/instructions drift while letting authors override it with a heading.
	 */
	private _resolveDisplayName(): string {
		const heading = this.querySelector( 'h1, h2, h3, h4, h5, h6' );
		const headingText = heading?.textContent?.trim();

		return headingText || document.title.trim() || getSlugFromLocation();
	}

	/**
	 * Toggles the availability of the instructions panel based on whether the default slot has
	 * meaningful content.
	 */
	private _setUpInstructions(): void {
		const slot = this.shadowRoot!.querySelector<HTMLSlotElement>( 'slot' )!;
		const update = (): void => {
			this.toggleAttribute( 'has-instructions', hasSlottedContent( slot ) );
		};

		update();
		slot.addEventListener( 'slotchange', update );
	}

	private _setUpActions( shadow: ShadowRoot ): void {
		shadow.addEventListener( 'click', event => {
			const trigger = ( event.target as Element ).closest<HTMLElement>( '[data-action]' );

			if ( !trigger ) {
				return;
			}

			if ( trigger.dataset.action == 'toggle' ) {
				this._toggleInstructions( !this._panel.classList.contains( 'panel--open' ) );
			} else if ( trigger.dataset.action == 'close' ) {
				this._toggleInstructions( false );
			}
		} );

		document.addEventListener( 'keydown', event => {
			if ( event.key == 'Escape' ) {
				this._toggleInstructions( false );
			}
		} );
	}

	private _toggleInstructions( isOpen: boolean ): void {
		const trigger = this.shadowRoot!.querySelector<HTMLElement>( '[data-action="toggle"]' )!;

		this._panel.classList.toggle( 'panel--open', isOpen );
		this._panel.toggleAttribute( 'inert', !isOpen );
		this._panel.setAttribute( 'aria-hidden', String( !isOpen ) );
		trigger.setAttribute( 'aria-expanded', String( isOpen ) );
	}
}

function readManualHeaderData(): { packageName: string; catalogHref: string } {
	const meta = document.querySelector<HTMLMetaElement>( `meta[name="${ MANUAL_HEADER_DATA_META }"]` );

	return {
		packageName: meta?.dataset.packageName || '',
		catalogHref: meta?.dataset.catalogHref || '/'
	};
}

function getSlugFromLocation(): string {
	const path = decodeURIComponent( window.location.pathname );
	const slugPath = path.split( '/tests/manual/' )[ 1 ] || path.split( '/' ).pop() || '';

	return slugPath.replace( /\.manual\.html$/, '' );
}

function hasSlottedContent( slot: HTMLSlotElement ): boolean {
	return slot.assignedNodes().some( node =>
		node.nodeType == Node.ELEMENT_NODE ||
		node.nodeType == Node.TEXT_NODE && Boolean( node.textContent?.trim() )
	);
}

function createStyleSheet( css: string ): CSSStyleSheet {
	const sheet = new CSSStyleSheet();

	sheet.replaceSync( css );

	return sheet;
}

function adoptInstructionsStyles(): void {
	if ( !document.adoptedStyleSheets.includes( instructionsStyleSheet ) ) {
		document.adoptedStyleSheets = [ ...document.adoptedStyleSheets, instructionsStyleSheet ];
	}
}

customElements.define( 'ck-manual-header', ManualHeaderElement );
