/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import type { Plugin } from 'vite';
import { ckDebugPlugin } from '../../src/debug-plugin/plugin.js';

type TransformHook = {
	filter: {
		id: {
			include: RegExp;
		};
	};
	handler: ( code: string, id: string ) => { code: string } | string | null;
};

describe( 'ckDebugPlugin()', () => {
	test( 'runs before regular transforms', () => {
		expect( ckDebugPlugin().enforce ).to.equal( 'pre' );
	} );

	test( 'filters transform hook calls to JavaScript and TypeScript files', () => {
		vi.stubEnv( 'CK_DEBUG', 'true' );

		const transform = getTransformHook( ckDebugPlugin() );

		expect( transform.filter.id.include ).to.be.instanceOf( RegExp );
		expect( transform.filter.id.include.test( '/path/manual.js' ) ).to.equal( true );
		expect( transform.filter.id.include.test( '/path/manual.tsx' ) ).to.equal( true );
		expect( transform.filter.id.include.test( '/path/manual.css' ) ).to.equal( false );
	} );

	test( 'does not register the transform hook when the debug flag is disabled', () => {
		vi.stubEnv( 'CK_DEBUG', 'false' );

		expect( ckDebugPlugin().transform ).to.equal( undefined );
		expect( transformCode( 'const value = 1;\n// @if CK_DEBUG // console.log( value );' ) ).to.equal( null );
	} );

	test( 'transforms debug comments when the global debug flag is enabled', () => {
		vi.stubEnv( 'CK_DEBUG', 'true' );

		expect( transformCode( 'const value = 1;\n\t// @if CK_DEBUG // console.log( value );' ) ).to.equal(
			'const value = 1;\n\t/* @if CK_DEBUG */ console.log( value );'
		);
	} );

	test( 'does not run debug replacement when source has no debug comments', () => {
		vi.stubEnv( 'CK_DEBUG', 'true' );

		expect( transformCode( 'const value = 1;\nconsole.log( value );' ) ).to.equal( null );
	} );

	test( 'transforms debug comments for selected debug namespaces', () => {
		vi.stubEnv( 'CK_DEBUG', 'engine, ui' );

		expect( transformCode( '// @if CK_DEBUG_ENGINE // console.log( "engine" );' ) ).to.equal(
			'/* @if CK_DEBUG_ENGINE */ console.log( "engine" );'
		);
		expect( transformCode( '// @if CK_DEBUG // console.log( "debug" );' ) ).to.equal(
			'/* @if CK_DEBUG */ console.log( "debug" );'
		);
		expect( transformCode( '// @if CK_DEBUG_MODEL // console.log( "model" );' ) ).to.equal( null );
	} );
} );

function transformCode( code: string ): string | null {
	const plugin = ckDebugPlugin();

	if ( !plugin.transform ) {
		return null;
	}

	const result = getTransformHook( plugin ).handler( code, '/path/manual.js' );

	if ( !result ) {
		return null;
	}

	return typeof result == 'string' ? result : result.code;
}

function getTransformHook( plugin: Plugin ): TransformHook {
	return plugin.transform as TransformHook;
}
