/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

interface ManualEditor {
	state: string;
}

type AttachArgs = [ ManualEditor | Record<string, ManualEditor>, options?: object ] | [ string, ManualEditor ];

interface Inspector {
	attach( ...args: AttachArgs ): unknown;
}

declare global {
	interface Window {
		editor?: ManualEditor | Element | null;
		CKEditorInspector: Inspector;
		enableCKEditorInspector(): Promise<void>;
	}
}

export function setUpManualInspector( loadInspector: () => Promise<Inspector> ): void {
	const pending: Array<{ editor: WeakRef<ManualEditor>; name?: string; options?: object }> = [];
	let inspector: Inspector | undefined;
	let activation: Promise<void> | undefined;

	function attach( ...args: AttachArgs ): unknown {
		if ( inspector ) {
			return inspector.attach( ...args );
		}

		const [ target, options ] = args;

		// Keep registrations without keeping editors alive on pages that destroy and recreate them.
		if ( typeof target == 'string' ) {
			pending.push( { editor: new WeakRef( options as ManualEditor ), name: target } );
		} else if ( typeof target.state == 'string' ) {
			pending.push( { editor: new WeakRef( target as ManualEditor ), options } );
		} else {
			for ( const [ name, editor ] of Object.entries( target ) ) {
				pending.push( { editor: new WeakRef( editor ), name, options } );
			}
		}
	}

	window.CKEditorInspector = { attach };
	window.enableCKEditorInspector = () => {
		activation ||= activate().catch( error => {
			activation = undefined;
			throw error;
		} );

		return activation;
	};

	// id="editor" creates a named DOM property, not an editor instance.
	let editor = window.editor instanceof Element ? null : window.editor;

	Object.defineProperty( window, 'editor', {
		configurable: true,
		get: () => editor,
		set( value ) {
			editor = value;

			if ( value ) {
				attach( value );
			}
		}
	} );

	if ( editor ) {
		attach( editor );
	}

	async function activate(): Promise<void> {
		inspector = await loadInspector();
		window.CKEditorInspector = inspector;

		for ( const registration of pending.splice( 0 ) ) {
			const editor = registration.editor.deref();

			if ( editor && editor.state != 'destroyed' ) {
				inspector.attach( registration.name === undefined ? editor : { [ registration.name ]: editor }, registration.options );
			}
		}
	}
}
