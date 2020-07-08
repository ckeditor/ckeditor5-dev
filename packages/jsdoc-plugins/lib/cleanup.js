const { isEqual } = require( 'lodash' );

exports.handlers = {
	processingComplete( e ) {
		const knownDoclets = new Map();

		for ( const doclet of e.doclets ) {
			if ( doclet.name && doclet.name.startsWith( '#' ) ) {
				doclet.name = doclet.name.slice( 1 );
			}

			if ( doclet.longname.includes( '#' ) ) {
				doclet.scope = 'instance';
			}

			// Remove duplicates.
			if ( knownDoclets.has( doclet.longname ) && isEqual( doclet, knownDoclets.get( doclet.longname ) ) ) {
				doclet.ignore = true;
			}

			knownDoclets.set( doclet.longname, doclet );

			// Delete props that we don't use.
			delete doclet.overrides;
		}

		/** @type {Map.<String,Doclet[]>} */
		const docletMap = new Map();

		for ( const doclet of e.doclets ) {
			const otherDocletsWithSameName = docletMap.get( doclet.longname );

			if ( !otherDocletsWithSameName ) {
				docletMap.set( doclet.longname, [ doclet ] );
			} else {
				docletMap.set( doclet.longname, [ ...otherDocletsWithSameName, doclet ] );
			}
		}

		// Delete doclets that are inherited and should be overwritten.
		for ( const doclets of docletMap.values() ) {
			const inheritedDoclets = doclets.filter( doclet => doclet.inherited );

			if ( doclets.find( doclet => !doclet.inherited && !doclet.ignore ) ) {
				for ( const d of inheritedDoclets ) {
					d.ignore = true;
				}
			}
		}

		e.doclets = e.doclets
			// Filter out the package doclet.
			.filter( doclet => doclet.kind !== 'package' )
			.filter( doclet => {
				// Filter out doclet that should be ignored.
				if ( doclet.ignore ) {
					return false;
				}

				// Filter out undocumented doclets.
				if ( doclet.undocumented ) {
					return (
						!!doclet.description ||
						!!doclet.comment ||
						!!doclet.classdesc
					);
				}

				// Filter out private doclet classes.
				// if ( doclet.kind === 'class' && doclet.access === 'private' ) {
				// 	return false;
				// }

				return true;
			} );
	}
};
