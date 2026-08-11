/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import os from 'node:os';
import upath from 'upath';
import { afterEach, describe, expect, it } from 'vitest';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';
import { readTranslationFile } from '../../lib/utils/translationfile.js';

describe( 'createMissingPackageTranslations()', () => {
	let temporaryDirectory;

	afterEach( () => {
		if ( temporaryDirectory ) {
			fs.rmSync( temporaryDirectory, { recursive: true, force: true } );
		}
	} );

	it( 'creates generated TypeScript files without overwriting existing translations', async () => {
		temporaryDirectory = fs.mkdtempSync( upath.join( os.tmpdir(), 'cke5-translations-' ) );
		const translationsDirectory = upath.join( temporaryDirectory, 'lang', 'translations' );
		fs.mkdirSync( translationsDirectory, { recursive: true } );
		fs.writeFileSync( upath.join( translationsDirectory, 'en.ts' ),
			'export default { en: { dictionary: { Existing: \'Existing\' } } };\n' );

		createMissingPackageTranslations( {
			packagePath: temporaryDirectory,
			contexts: { Message: 'A message context.' },
			skipLicenseHeader: true
		} );

		expect( ( await readTranslationFile( upath.join( translationsDirectory, 'en.ts' ) ) ).dictionary ).toEqual( {
			Existing: 'Existing'
		} );
		expect( await readTranslationFile( upath.join( translationsDirectory, 'pl.ts' ) ) ).toEqual( {
			language: 'pl',
			dictionary: {},
			getPluralForm: undefined
		} );
	} );
} );
