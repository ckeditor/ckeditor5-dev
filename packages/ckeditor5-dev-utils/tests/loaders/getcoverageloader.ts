/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { describe, expect, it } from 'vitest';
import getCoverageLoader from '../../src/loaders/getcoverageloader.js';

const escapedPathSep = path.sep == '/' ? '/' : '\\\\';

describe( 'getCoverageLoader()', () => {
	it( 'should be a function', () => {
		expect( getCoverageLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition containing a loader for measuring the coverage', () => {
		const coverageLoader = getCoverageLoader( {
			files: []
		} );

		expect( coverageLoader ).to.be.an( 'object' );
		expect( '/path/to/javascript.js' ).to.match( coverageLoader.test );
		expect( '/path/to/typescript.ts' ).to.match( coverageLoader.test );

		expect( coverageLoader.include ).to.be.an( 'array' );
		expect( coverageLoader.include ).to.lengthOf( 0 );
		expect( coverageLoader.exclude ).to.be.an( 'array' );
		expect( coverageLoader.exclude ).to.lengthOf( 1 );

		expect( coverageLoader.use ).to.be.an( 'array' );
		expect( coverageLoader.use ).to.lengthOf( 1 );

		const babelLoader = coverageLoader.use.at( 0 )!;

		expect( babelLoader.loader ).to.equal( 'babel-loader' );
	} );

	it( 'should return a definition containing a loader for measuring the coverage (include glob check)', () => {
		const coverageLoader = getCoverageLoader( {
			files: [
				// -f utils
				[ 'node_modules/ckeditor5-utils/tests/**/*.js' ]
			]
		} );

		expect( coverageLoader ).to.be.an( 'object' );
		expect( coverageLoader ).to.have.property( 'include' );
		expect( coverageLoader.include ).to.be.an( 'array' );
		expect( coverageLoader.include ).to.deep.equal( [
			new RegExp( [ 'ckeditor5-utils', 'src', '' ].join( escapedPathSep ) )
		] );
	} );

	it( 'should return a definition containing a loader for measuring the coverage (exclude glob check)', () => {
		const coverageLoader = getCoverageLoader( {
			files: [
				// -f !utils
				[ 'node_modules/ckeditor5-!(utils)/tests/**/*.js' ]
			]
		} );

		expect( coverageLoader ).to.be.an( 'object' );
		expect( coverageLoader ).to.have.property( 'include' );
		expect( coverageLoader.include ).to.be.an( 'array' );
		expect( coverageLoader.include ).to.deep.equal( [
			new RegExp( [ 'ckeditor5-!(utils)', 'src', '' ].join( escapedPathSep ) )
		] );
	} );

	it( 'should return a definition containing a loader for measuring the coverage (for root named ckeditor5-*)', () => {
		const coverageLoader = getCoverageLoader( {
			files: [
				[ '/ckeditor5-collab/packages/ckeditor5-alignment/tests/**/*.{js,ts}' ]
			]
		} );

		expect( coverageLoader ).to.be.an( 'object' );
		expect( coverageLoader ).to.have.property( 'include' );
		expect( coverageLoader.include ).to.be.an( 'array' );
		expect( coverageLoader.include ).to.deep.equal( [
			new RegExp( [ 'ckeditor5-alignment', 'src', '' ].join( escapedPathSep ) )
		] );
	} );
} );
