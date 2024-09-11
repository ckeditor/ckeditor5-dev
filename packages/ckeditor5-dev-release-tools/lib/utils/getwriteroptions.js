/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { getTypeOrder } from './transformcommitutils.js';

const templatePath = path.join( __dirname, '..', 'templates' );

/**
 * @param {Function|Object} transform
 * @returns {Object}
 */
export default function getWriterOptions( transform ) {
	return {
		transform,
		groupBy: 'type',
		commitGroupsSort: sortFunction,
		commitsSort: [ 'subject' ],
		noteGroupsSort: sortFunction,
		mainTemplate: fs.readFileSync( path.join( templatePath, 'template.hbs' ), 'utf-8' ),
		headerPartial: fs.readFileSync( path.join( templatePath, 'header.hbs' ), 'utf-8' ),
		commitPartial: fs.readFileSync( path.join( templatePath, 'commit.hbs' ), 'utf-8' ),
		footerPartial: fs.readFileSync( path.join( templatePath, 'footer.hbs' ), 'utf-8' )
	};
}

function sortFunction( a, b ) {
	return getTypeOrder( a.title ) - getTypeOrder( b.title );
}
