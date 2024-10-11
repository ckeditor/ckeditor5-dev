/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import PO from 'pofile';
import cleanTranslationFileContent from '../../lib/utils/cleantranslationfilecontent.js';

vi.mock( 'pofile' );

describe( 'cleanTranslationFileContent()', () => {
	let translations;

	beforeEach( () => {
		translations = {
			headers: {
				'Project-Id-Version': 'Value from Project-Id-Version',
				'Report-Msgid-Bugs-To': 'Value from Report-Msgid-Bugs-To',
				'POT-Creation-Date': 'Value from POT-Creation-Date',
				'PO-Revision-Date': 'Value from PO-Revision-Date',
				'Last-Translator': 'Value from Last-Translator',
				'Language': 'Value from Language',
				'Language-Team': 'Value from Language-Team',
				'Content-Type': 'Value from Content-Type',
				'Content-Transfer-Encoding': 'Value from Content-Transfer-Encoding',
				'Plural-Forms': 'Value from Plural-Forms'
			},
			toString: () => JSON.stringify( translations )
		};

		vi.mocked( PO.parse ).mockReturnValue( translations );
	} );

	it( 'should be a function', () => {
		expect( cleanTranslationFileContent ).toBeInstanceOf( Function );
	} );

	it( 'should return translation file without unneeded headers', () => {
		const result = cleanTranslationFileContent( 'Example content.' );

		expect( PO.parse ).toHaveBeenCalledWith( 'Example content.' );
		expect( JSON.parse( result ) ).toEqual( {
			headers: {
				'Language': 'Value from Language',
				'Content-Type': 'text/plain; charset=UTF-8',
				'Plural-Forms': 'Value from Plural-Forms'
			}
		} );
	} );
} );
