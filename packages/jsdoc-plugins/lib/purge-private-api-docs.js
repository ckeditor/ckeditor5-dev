/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// A plugin for JSDoc that should purge non-public API docs.
// Public API docs should contain the `@publicApi` tag below the `@module` tag.

const path = require( 'path' );
const fs = require( 'fs' );

module.exports = {
	handlers: {
		/**
		 * @see http://usejsdoc.org/about-plugins.html#event-beforeparse
		 * @param {any} evt
		 */
		beforeParse( evt ) {
			// Skip public packages.
			if ( !isPrivatePackageFile( evt.filename ) ) {
				return;
			}

			// Do not emit any JSDoc doclet if the `@publicApi` tag is missing in that file.
			if ( !evt.source.includes( '@publicApi' ) ) {
				evt.source = '';

				return;
			}

			// Do not emit any JSDoc doclet if the '@module' tag is missing and log a warning.
			if ( !evt.source.includes( '@module' ) ) {
				evt.source = '';

				const filename = path.relative( process.cwd(), evt.filename );

				console.warn( `File ${ filename } did not start with '@module' tag and hence it will be ignored while building docs.` );
			}
		},

		processingComplete( evt ) {
			for ( const doclet of evt.doclets ) {
				if ( doclet.meta && doclet.meta.path ) {
					if ( isPrivatePackageFile( doclet.meta.path ) ) {
						doclet.skipSource = true;
					}
				}
			}

			// Filter out protected and private doclets.
			// It's a simple and naive approach, this way private and protected
			// doclets from inherited public resources are also filtered out.
			evt.doclets = evt.doclets.filter( doclet => {
				if ( !doclet.skipSource ) {
					return true;
				}

				if ( doclet.access === 'private' ) {
					return false;
				}

				if ( doclet.access === 'protected' ) {
					return false;
				}

				return true;
			} );
		}
	},

	/**
	 * See http://usejsdoc.org/about-plugins.html#tag-definition.
	 *
	 * @param {any} dictionary
	 */
	defineTags( dictionary ) {
		dictionary.defineTag( 'publicApi', {
			mustHaveValue: false,
			canHaveType: false,
			canHaveName: false,

			/**
			 * @param {any} doclet
			 * @param {any} tag
			 */
			onTagged( doclet ) {
				Object.assign( doclet, {
					publicApi: true
				} );
			}
		} );
	}
};

function isPrivatePackageFile( fileName ) {
	let dirName = path.dirname( fileName );

	while ( true ) {
		const pathToPackageJson = path.join( dirName, 'package.json' );

		if ( fs.existsSync( pathToPackageJson ) ) {
			return !!JSON.parse( fs.readFileSync( pathToPackageJson ).toString() ).private;
		}

		dirName = path.dirname( dirName );

		// Root's dirname is equal to the root,
		// So if this check passes, then we should break this endless loop.
		if ( dirName === path.dirname( dirName ) ) {
			throw new Error( `${ fileName } is not placed inside the NPM project.` );
		}
	}
}
