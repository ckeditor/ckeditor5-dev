/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const tmp = require( 'tmp' );
const fs = require( 'fs' );
const { execSync } = require( 'child_process' );
const glob = require( 'glob' );
const path = require( 'path' );

module.exports = async function extractApiDocs( dirname ) {
	const filePattern1 = path.join( dirname, '/input/**/*.jsdoc' );
	const filePattern2 = path.join( dirname, '/input.jsdoc' );

	const files = [
		...glob.sync( filePattern1 ),
		...glob.sync( filePattern2 )
	];

	if ( files.length === 0 ) {
		throw new Error(
			`No file matching the '${ filePattern1 }' pattern was found by the 'extractApiDocs' test utility.`
		);
	}

	const jsDocConfig = {
		plugins: [
			require.resolve( '../../../lib/export-fixer/export-fixer' ),
			require.resolve( '../../../lib/custom-tags/error' ),
			require.resolve( '../../../lib/custom-tags/observable' ),
			require.resolve( '../../../lib/observable-event-provider' ),
			require.resolve( '../../../lib/relation-fixer' ),
			require.resolve( '../../../lib/longname-fixer/longname-fixer' ),
			require.resolve( '../../../lib/event-extender/event-extender' ),
			require.resolve( '../../../lib/cleanup' ),

			// The logger prints the JSON to stdout.
			// This way the generated structure can be fetched by integration tests.
			require.resolve( './logger' )
		],
		source: {
			include: files
		},
		opts: {
			encoding: 'utf8',
			recurse: true,
			access: 'all',
			template: 'templates/silent'
		}
	};

	const tmpConfig = tmp.fileSync();

	fs.writeFileSync( tmpConfig.name, JSON.stringify( jsDocConfig ) );

	const cmd = require.resolve( 'jsdoc/jsdoc.js' );

	const rawOutput = execSync( `node ${ cmd } -c ${ tmpConfig.name }` ).toString();

	const doclets = JSON.parse( rawOutput ).doclets;

	// Preserve only filename for doclet identification metadata.
	for ( const doclet of doclets ) {
		if ( doclet.meta ) {
			doclet.meta = {
				filename: doclet.meta.filename
			};
		}
	}

	return doclets;
};
