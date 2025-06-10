/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import chalk from 'chalk';
import { logger, workspaces } from '@ckeditor/ckeditor5-dev-utils';
import displaySkippedPackages from '../../lib/utils/displayskippedpackages.js';

const stubs = vi.hoisted( () => {
	const values = {
		logger: {
			info: vi.fn()
		},
		chalk: {
			bold: vi.fn( input => input ),
			underline: vi.fn( input => input )
		}
	};

	// To make `chalk.bold.yellow.red()` working.
	for ( const rootKey of Object.keys( values.chalk ) ) {
		for ( const nestedKey of Object.keys( values.chalk ) ) {
			values.chalk[ rootKey ][ nestedKey ] = values.chalk[ nestedKey ];
		}
	}

	return values;
} );

vi.mock( 'chalk', () => ( {
	default: stubs.chalk
} ) );
vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	logger: vi.fn( () => stubs.logger ),
	workspaces: {
		getPackageJson: vi.fn()
	}
} ) );
vi.mock( '../../lib/utils/constants.js', () => ( {
	CLI_INDENT_SIZE: 1
} ) );

describe( 'displaySkippedPackages()', () => {
	it( 'displays name of packages that have been skipped', () => {
		vi.mocked( workspaces.getPackageJson )
			.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-foo' } )
			.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-bar' } );

		displaySkippedPackages( new Set( [
			'/packages/ckeditor5-foo',
			'/packages/ckeditor5-bar'
		] ) );

		expect( vi.mocked( logger ) ).toHaveBeenCalledOnce();
		expect( stubs.logger.info ).toHaveBeenCalledOnce();

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;
		const logMessage = firstArgument.split( '\n' );

		expect( logMessage[ 0 ].includes( 'Packages listed below have been skipped:' ) ).to.equal( true );
		expect( logMessage[ 1 ].includes( ' * @ckeditor/ckeditor5-foo' ) ).to.equal( true );
		expect( logMessage[ 2 ].includes( ' * @ckeditor/ckeditor5-bar' ) ).to.equal( true );

		expect( vi.mocked( chalk ).underline ).toHaveBeenCalledOnce();
	} );

	it( 'does not display if given list is empty', () => {
		displaySkippedPackages( new Set() );
		expect( stubs.logger.info ).not.toHaveBeenCalledOnce();
	} );
} );
