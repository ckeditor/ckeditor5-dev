const path = require( 'path' );

module.exports = {
	handlers: {
		/**
		 * @see http://usejsdoc.org/about-plugins.html#event-beforeparse
		 * @param evt
		 */
		beforeParse( evt ) {
			if ( !evt.source.includes( '@module' ) ) {
				evt.source = '';

				const filename = path.relative( process.cwd(), evt.filename );

				console.warn( `File ${ filename } did not start with '@module' tag and hence it will be ignored while building docs.` );
			}
		}
	}
};
