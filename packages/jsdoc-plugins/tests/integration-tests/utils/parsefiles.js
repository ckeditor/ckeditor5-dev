/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const tmp = require( 'tmp' );
const fs = require( 'fs' );
const { execSync } = require( 'child_process' );
const glob = require( 'glob' );
const path = require( 'path' );

module.exports = function parseFiles() {
	const files = glob.sync( path.join( __dirname, '../data/*.jsdoc' ) );

	console.log( files );

	const jsDocConfig = {
		plugins: [
			require.resolve( '../../../lib/export-fixer/export-fixer' ),
			require.resolve( '../../../lib/custom-tags/error' ),
			require.resolve( '../../../lib/custom-tags/observable' ),
			require.resolve( '../../../lib/observable-event-provider' ),
			require.resolve( '../../../lib/relation-fixer' ),
			require.resolve( '../../../lib/longname-fixer/longname-fixer' ),
			require.resolve( '../../../lib/event-extender/event-extender' ),

			require.resolve( './logger' ),
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

	const rawOutput = execSync( `${ cmd } -c ${ tmpConfig.name }`, { shell: true } ).toString();

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
