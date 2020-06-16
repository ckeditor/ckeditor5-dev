exports.handlers = {
	processingComplete( e ) {
		e.doclets = e.doclets
			.filter( doclet => doclet.kind !== 'package' )
			.filter( doclet => !doclet.undocumented );

		// for ( const doclet of e.doclets ) {
		// 	delete doclet.augmentsNested;
		// 	delete doclet.implementsNested;
		// 	delete doclet.mixesNested;
		// 	delete doclet.descendants;
		// }
	}
};
