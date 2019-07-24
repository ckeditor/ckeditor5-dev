/**
 * The loader matches sentences like: `// @if CK_DEBUG // someDebugCode();` and uncomment them.
 * If also uncomments code after specific flags if they are provided to the webpack configuration.
 * E.g. if the `CK_DEBUG_ENGINE` flag is set to true, then all lines starting with
 * `// @if CK_DEBUG_ENGINE //` will be uncommented.
 *
 * @param {String} source
 * @param {any} map
 */
module.exports = function ckDebugLoader( source, map ) {
	source = source.replace( /\/\/ @if (!?[\w]+) \/\/(.+)/g, ( match, flagName, body ) => {
		// `this.options` comes from the webpack loader configuration.

		const options = {
			CK_DEBUG: true,
			...this.options
		}

		// Missing param in webpack loader config
		if ( !( flagName in options ) ) {
			// Unfortunately it's impossible to log a file name here.
			console.warn( `Invalid debugging flag found: "${ flagName }" in ${ match }.` );

			return match;
		}

		const flagValue = options[ flagName ];

		// Do nothing when the provided flag value is falsy.
		if ( !flagValue ) {
			return match;
		}

		// Replace the option in body with evaluated value.
		body = body.replace( new RegExp( flagName, 'g' ), options[ flagName ] );

		// Uncomment the code with a same length string to not break the source maps.
		return `/* @if ${ flagName } */ ${ body }`;
	} );

	this.callback( null, source, map );
};
