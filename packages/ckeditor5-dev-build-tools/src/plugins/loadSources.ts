import { accessSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Plugin } from 'rollup';

export function loadTypeScriptSources(): Plugin {
  const cache: Record<string, string | null> = {};

  return {
    name: 'load-typescript-sources',

    resolveId( source: string, importer: string | undefined ) {
			if ( !importer || !source.startsWith( '.' ) || !source.endsWith( '.js' ) ) {
        return null;
      }

      const path = resolve(
				dirname( importer ),
				source.replace( /\.js$/, '.ts' )
			);

      if ( cache[ path ] ) {
        return cache[ path ];
      }

      try {
        accessSync( path );

        return cache[ path ] = path;
      } catch {
        return cache[ path ] = null;
      }
    }
  };
}
