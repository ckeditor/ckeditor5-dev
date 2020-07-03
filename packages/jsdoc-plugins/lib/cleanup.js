exports.handlers = {
	processingComplete( e ) {
		e.doclets = e.doclets
			.filter( doclet => doclet.kind !== 'package' )
			.filter( doclet => {
				if ( doclet.undocumented ) {
					return (
						!!doclet.description ||
						!!doclet.comment ||
						!!doclet.classdesc
					);
				}

				return true;
			} );
	}
};
