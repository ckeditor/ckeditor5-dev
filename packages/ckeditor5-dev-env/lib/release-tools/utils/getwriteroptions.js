/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const templatePath = path.join( __dirname, '..', 'templates' );
const { typesOrder } = require( './transform-commit-utils' );

/**
 * @param {Function} transform
 * @returns {Object}
 */
module.exports = function getWriterOptions( transform ) {
	return {
		transform,
		groupBy: 'type',
		commitGroupsSort( a, b ) {
			return typesOrder[ a.title ] - typesOrder[ b.title ];
		},
		commitsSort: [ 'subject' ],
		noteGroupsSort( a, b ) {
			return typesOrder[ a.title ] - typesOrder[ b.title ];
		},
		notesSort: require( 'compare-func' ),
		mainTemplate: fs.readFileSync( path.join( templatePath, 'template.hbs' ), 'utf-8' ),
		headerPartial: fs.readFileSync( path.join( templatePath, 'header.hbs' ), 'utf-8' ),
		commitPartial: fs.readFileSync( path.join( templatePath, 'commit.hbs' ), 'utf-8' ),
		footerPartial: fs.readFileSync( path.join( templatePath, 'footer.hbs' ), 'utf-8' )
	};
};
