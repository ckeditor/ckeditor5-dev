const fs = require( 'fs' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const transifexService = require( './transifex-service' );

/**
 * Uploads translations to the Transifex for the given package from translation files
 * that are saved in the 'ckeditor5/packages/ckeditor5-[packageName]/lang/translations' directory.
 *
 * IMPORTANT: Take care, this will overwrite existing translations on the Transifex.
 *
 * @param {Object} credentials
 * @param {String} credentials.token Token to the Transifex API.
 * @param {String} packageName Package name
 */
module.exports = function updatePackageTranslations( credentials, packageName ) {
	if ( !packageName ) {
		throw new Error( 'Package name was not provided. Use `--package` option.' );
	}

	const fullPackageName = 'ckeditor5-' + packageName;
	const pathToPoTranslations = path.join( process.cwd(), 'packages', fullPackageName, 'lang', 'translations' );

	const data = fs.readdirSync( pathToPoTranslations ).map( fileName => ( {
		lang: path.parse( fileName ).name,
		content: fs.createReadStream( path.join( pathToPoTranslations, fileName ) ),
		token: credentials.token,
		slug: fullPackageName
	} ) );

	return Promise.all( data.map( config => {
		return transifexService.putTranslations( config );
	} ) )
		.then( () => logger.info( `All resources for ${ packageName } updated.\n` ) )
		.catch( err => {
			logger.error( err );
			throw err;
		} );
};
