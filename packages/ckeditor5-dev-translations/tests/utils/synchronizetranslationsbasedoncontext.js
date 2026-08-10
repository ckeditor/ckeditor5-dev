/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import os from 'node:os';
import upath from 'upath';
import { afterEach, describe, expect, it, vi } from 'vitest';
import createMissingPackageTranslations from '../../lib/utils/createmissingpackagetranslations.js';
import synchronizeTranslationsBasedOnContext from '../../lib/utils/synchronizetranslationsbasedoncontext.js';
import { serializeTranslationFile } from '../../lib/utils/translationfile.js';

vi.mock( '../../lib/utils/createmissingpackagetranslations.js' );

describe( 'synchronizeTranslationsBasedOnContext()', () => {
	let packagePath;

	afterEach( () => {
		if ( packagePath ) {
			fs.rmSync( packagePath, { recursive: true, force: true } );
		}
	} );

	it( 'synchronizes dictionaries in context order and aligns plural forms', async () => {
		packagePath = fs.mkdtempSync( upath.join( os.tmpdir(), 'ckeditor5-foo-' ) );
		const translationsPath = upath.join( packagePath, 'translations' );
		const contexts = { Changed: 'Changed context.', Plural: 'Plural context.' };
		fs.mkdirSync( translationsPath, { recursive: true } );
		write( 'en', { Changed: 'Old English', Plural: [ '%0 item', '%0 items' ], Stale: 'Stale' } );
		write( 'pl', { Changed: 'Stare tłumaczenie', Plural: [ '%0 rzecz' ], Stale: 'Nieaktualne' } );

		await synchronizeTranslationsBasedOnContext( {
			packageContexts: [ { packagePath, contextContent: contexts } ],
			sourceMessages: [
				{ id: 'Changed', string: 'New English' },
				{ id: 'Plural', string: '%0 item', plural: '%0 items' }
			],
			skipLicenseHeader: true
		} );

		expect( createMissingPackageTranslations ).toHaveBeenCalledWith( {
			packagePath,
			contexts,
			skipLicenseHeader: true
		} );
		expect( fs.readFileSync( upath.join( translationsPath, 'en.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'en',
			dictionary: { Changed: 'New English', Plural: [ '%0 item', '%0 items' ] },
			contexts,
			skipLicenseHeader: true
		} ) );
		expect( fs.readFileSync( upath.join( translationsPath, 'pl.ts' ), 'utf-8' ) ).toBe( serializeTranslationFile( {
			language: 'pl',
			dictionary: { Changed: '', Plural: [ '%0 rzecz', '', '' ] },
			contexts,
			skipLicenseHeader: true
		} ) );

		function write( language, dictionary ) {
			fs.writeFileSync( upath.join( translationsPath, `${ language }.ts` ), serializeTranslationFile( {
				language,
				dictionary,
				contexts: { ...contexts, Stale: 'Stale context.' },
				skipLicenseHeader: true
			} ) );
		}
	} );
} );
