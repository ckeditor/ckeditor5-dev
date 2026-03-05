import fs, { accessSync, readFileSync, existsSync } from 'node:fs';
import url from 'node:url';
import { styleText, parseArgs } from 'node:util';
import path from 'upath';
import { defineConfig, rollup } from 'rollup';
import { createRequire } from 'node:module';
import swc from '@rollup/plugin-swc';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import svg from 'rollup-plugin-svg-import';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import MagicString from 'magic-string';
import { SourceMapGenerator, SourceMapConsumer } from 'source-map';
import { createFilter } from '@rollup/pluginutils';
import { Buffer } from 'node:buffer';
import { dirname, isAbsolute, resolve, basename, parse } from 'node:path';
import { bundleAsync, Features } from 'lightningcss';
import { walk } from 'estree-walker';
import cssnano from 'cssnano';
import litePreset from 'cssnano-preset-lite';
import { PurgeCSS } from 'purgecss';
import PO from 'pofile';
import { groupBy, merge } from 'es-toolkit/compat';
import { glob } from 'glob';

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function loadSourcemaps() {
    return {
        name: 'cke5-load-sourcemaps',
        load(id) {
            const sourceMapId = id + '.map';
            if (!fs.existsSync(sourceMapId)) {
                return;
            }
            return {
                code: fs.readFileSync(id, 'utf-8'),
                map: fs.readFileSync(sourceMapId, 'utf-8')
            };
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const require = createRequire(import.meta.url);
/**
 * Transforms `kebab-case` strings to `camelCase`.
 */
function camelize(s) {
    return s.replace(/-./g, x => x[1].toUpperCase());
}
/**
 * Transforms first-level object keys from `kebab-case` to `camelCase`.
 */
function camelizeObjectKeys(obj) {
    return Object.fromEntries(Object
        .entries(obj)
        .map(([key, value]) => [camelize(key), value]));
}
/**
 * Returns string without whitespace.
 */
function removeWhitespace(text) {
    return text.replaceAll(/\n\s+/gm, '\n');
}
/**
 * Returns dependency resolved relative to the current working directory. This is needed to ensure
 * that the dependency of this package itself (which may be in a different version) is not used.
 */
function getUserDependency(name) {
    const path = require.resolve(name, {
        paths: [process.cwd()]
    });
    return require(path);
}
/**
 * Returns plugin if condition is truthy. This is used only to get the types right.
 */
function getOptionalPlugin(condition, plugin) {
    return condition ? plugin : undefined;
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function addBanner(pluginOptions) {
    const options = Object.assign({
        include: ['**/*.js', '**/*.css', '**/translations/**/*.d.ts'],
        exclude: null
    }, pluginOptions);
    const filter = createFilter(options.include, options.exclude);
    return {
        name: 'cke5-add-banner',
        async generateBundle(outputOptions, bundle) {
            /**
             * Source maps cannot be overwritten using `chunk.map`. Instead,
             * the old source map must be removed from the bundle,
             * and the new source map with the same name must be added.
             *
             * See: https://github.com/rollup/rollup/issues/4665.
             */
            const updateSourceMap = async (fileName, magic) => {
                if (!outputOptions.sourcemap) {
                    return;
                }
                const sourceMapName = fileName + '.map';
                const originalSourceMap = bundle[sourceMapName];
                if (!originalSourceMap) {
                    return;
                }
                const newSourceMap = magic.generateMap({
                    hires: 'boundary',
                    file: sourceMapName,
                    source: fileName,
                    includeContent: true
                });
                /**
                 * Because MagicString doesn't read the original source map,
                 * we need to merge new source map with the original.
                 */
                const generator = SourceMapGenerator.fromSourceMap(await new SourceMapConsumer(newSourceMap));
                const originalMapConsumer = await new SourceMapConsumer(JSON.parse(originalSourceMap.source.toString()));
                generator.applySourceMap(originalMapConsumer, fileName);
                delete bundle[sourceMapName];
                this.emitFile({
                    type: 'asset',
                    fileName: sourceMapName,
                    source: generator.toString()
                });
            };
            /**
             * Adds banner to the beginning of the asset and updates its source map.
             */
            const updateAsset = (asset) => {
                const magic = new MagicString(asset.source.toString());
                magic.prepend(options.banner);
                asset.source = magic.toString();
                return updateSourceMap(asset.fileName, magic);
            };
            /**
             * Adds banner to the beginning of the chunk and updates its source map.
             */
            const updateChunk = (chunk) => {
                const magic = new MagicString(chunk.code);
                magic.prepend(options.banner);
                chunk.code = magic.toString();
                return updateSourceMap(chunk.fileName, magic);
            };
            for (const file of Object.values(bundle)) {
                if (!filter(file.fileName)) {
                    continue;
                }
                if (file.type === 'asset') {
                    await updateAsset(file);
                }
                else {
                    await updateChunk(file);
                }
            }
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const filter$1 = createFilter(['**/*.css']);
const VIRTUAL_ENTRY_ID = '/__cke5_bundle_css__.css';
const QUERY_AND_HASH_REGEXP = /[#?].*$/;
const URL_PROTOCOL_REGEXP = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const PROTOCOL_RELATIVE_URL_REGEXP = /^\/\//;
/**
 * Removes query strings and hash fragments from the module id.
 */
function normalizeId(id) {
    return id.replace(QUERY_AND_HASH_REGEXP, '');
}
/**
 * Builds virtual stylesheet entry containing imports in the provided order.
 */
function createVirtualEntry(filePaths) {
    const imports = new Map();
    const content = filePaths
        .map((filePath, index) => {
        const importId = `__rollup_bundle_css_${index}__`;
        imports.set(importId, filePath);
        return `@import ${JSON.stringify(importId)};`;
    })
        .join('\n');
    return {
        content,
        imports
    };
}
/**
 * Returns whether the module id points to a CSS file.
 */
function isCssModule(id) {
    return filter$1(normalizeId(id));
}
/**
 * Returns whether the import specifier references an external resource.
 */
function isExternalImport(specifier) {
    return URL_PROTOCOL_REGEXP.test(specifier) || PROTOCOL_RELATIVE_URL_REGEXP.test(specifier);
}
/**
 * Returns CSS imports from a chunk in the same order as `rollup-plugin-styles`.
 */
function getChunkCssImports(chunk, getModuleInfo) {
    const ids = [];
    for (const moduleId of Object.keys(chunk.modules)) {
        const traversed = new Set();
        let current = [moduleId];
        // Traverse level by level until only CSS modules remain.
        // Non-CSS modules are tracked to avoid loops in cyclic graphs.
        while (current.some(id => !isCssModule(id))) {
            const imports = [];
            for (const id of current) {
                if (traversed.has(id)) {
                    continue;
                }
                if (isCssModule(id)) {
                    imports.push(id);
                    continue;
                }
                traversed.add(id);
                const moduleInfo = getModuleInfo(id);
                if (moduleInfo) {
                    imports.push(...moduleInfo.importedIds);
                }
            }
            current = imports;
        }
        ids.push(...current);
    }
    return ids;
}
/**
 * Returns unique CSS modules ordered like they were emitted by `rollup-plugin-styles`.
 */
function getOrderedCssModules(bundle, outputOptions, getModuleInfo) {
    const chunks = Object.values(bundle).filter((output) => output.type === 'chunk');
    const manualChunks = chunks.filter(chunk => !chunk.facadeModuleId);
    const emittedChunks = outputOptions.preserveModules ?
        chunks :
        chunks.filter(chunk => chunk.isEntry || chunk.isDynamicEntry);
    const ids = [];
    const moved = new Set();
    // Rollup may move modules from entry chunks to manual chunks.
    // Process manual chunks first to preserve their priority.
    for (const chunk of manualChunks) {
        const chunkIds = getChunkCssImports(chunk, getModuleInfo);
        chunkIds.forEach(id => moved.add(id));
        ids.push(...chunkIds);
    }
    // Entry/dynamic chunks can still reference modules already moved above.
    // Skipping them here keeps ordering stable and prevents duplicates.
    for (const chunk of emittedChunks) {
        const chunkIds = getChunkCssImports(chunk, getModuleInfo);
        ids.push(...chunkIds.filter(id => !moved.has(id)));
    }
    // Keep the last occurrence of each id.
    return [...new Set(ids.reverse())].reverse();
}
function bundleCss(pluginOptions) {
    const options = {
        minify: false,
        sourceMap: false,
        ...pluginOptions
    };
    const styles = new Map();
    return {
        name: 'cke5-bundle-css',
        buildStart() {
            styles.clear();
        },
        transform(code, id) {
            if (!isCssModule(id)) {
                return;
            }
            styles.set(normalizeId(id), code);
            return '';
        },
        async generateBundle(outputOptions, bundle) {
            const orderedCssModules = getOrderedCssModules(bundle, outputOptions, this.getModuleInfo);
            // Lightning CSS bundles from a single entry file, so create a virtual one
            // that imports CSS modules in the desired order.
            const virtualEntry = createVirtualEntry(orderedCssModules);
            const projectRoot = outputOptions.file ? dirname(outputOptions.file) : outputOptions.dir || process.cwd();
            const result = await bundleAsync({
                projectRoot,
                filename: VIRTUAL_ENTRY_ID,
                minify: options.minify,
                sourceMap: options.sourceMap,
                include: Features.Nesting,
                resolver: {
                    read: (filePath) => {
                        if (filePath === VIRTUAL_ENTRY_ID) {
                            return virtualEntry.content;
                        }
                        const normalizedPath = normalizeId(filePath);
                        const transformedStyles = styles.get(normalizedPath);
                        // Prefer styles transformed by earlier Rollup plugins.
                        if (transformedStyles !== undefined) {
                            return transformedStyles;
                        }
                        // Fallback to raw filesystem reads when transform() did not run.
                        this.addWatchFile(normalizedPath);
                        return fs.readFileSync(normalizedPath, 'utf-8');
                    },
                    resolve: async (specifier, originatingFile) => {
                        if (originatingFile === VIRTUAL_ENTRY_ID) {
                            // Virtual entry imports map 1:1 to collected module paths.
                            const virtualImportPath = virtualEntry.imports.get(specifier);
                            if (!virtualImportPath) {
                                this.error(`Cannot resolve generated stylesheet entry import: ${specifier}.`);
                            }
                            return virtualImportPath;
                        }
                        const normalizedOrigin = normalizeId(originatingFile);
                        if (isExternalImport(specifier)) {
                            this.error(`External CSS imports are not supported. Found ${specifier} in ${normalizedOrigin}.`);
                        }
                        // Ask Rollup first so aliases/custom resolvers stay in effect.
                        const resolvedByRollup = await this.resolve(specifier, normalizedOrigin, { skipSelf: true });
                        if (resolvedByRollup) {
                            if (resolvedByRollup.external) {
                                this.error(`External CSS imports are not supported. Found ${specifier} in ${normalizedOrigin}.`);
                            }
                            return normalizeId(resolvedByRollup.id);
                        }
                        if (isAbsolute(specifier)) {
                            return specifier;
                        }
                        if (specifier.startsWith('.') || specifier.startsWith('/')) {
                            // Keep backward compatibility with relative path resolution.
                            return resolve(dirname(normalizedOrigin), specifier);
                        }
                        this.error(`Unable to resolve CSS import ${specifier} in ${normalizedOrigin}.`);
                    }
                }
            });
            const sourceMapFileName = `${options.fileName}.map`;
            let css = Buffer.from(result.code).toString();
            if (options.sourceMap && result.map) {
                const sourceMap = JSON.parse(Buffer.from(result.map).toString());
                // Ensure emitted map references the emitted stylesheet file name.
                sourceMap.file ??= options.fileName;
                css += `\n/*# sourceMappingURL=${basename(sourceMapFileName)} */`;
                this.emitFile({
                    type: 'asset',
                    fileName: sourceMapFileName,
                    source: JSON.stringify(sourceMap)
                });
            }
            this.emitFile({
                type: 'asset',
                fileName: options.fileName,
                source: css
            });
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function emitCss(pluginOptions) {
    return {
        name: 'cke5-emit-css',
        async generateBundle(outputOptions, bundle) {
            const emittedCss = Object.keys(bundle);
            for (const fileName of pluginOptions.fileNames) {
                if (emittedCss.includes(fileName)) {
                    continue;
                }
                this.emitFile({
                    type: 'asset',
                    fileName,
                    source: ''
                });
            }
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Allows importing raw file content using the `?raw` query parameter.
 */
function rawImport() {
    const rawRE = /[?&]raw\b/;
    return {
        name: 'cke5-raw-import',
        resolveId(source, importer) {
            if (!importer || !rawRE.test(source)) {
                return null;
            }
            const cleaned = source.replace(rawRE, '');
            return resolve(dirname(importer), cleaned) + '?raw';
        },
        load(id) {
            if (!rawRE.test(id)) {
                return null;
            }
            const [path] = id.split('?');
            const content = fs.readFileSync(path, 'utf-8');
            return `export default ${JSON.stringify(content)};`;
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function replaceImports(pluginOptions) {
    const options = Object.assign({ replace: [] }, pluginOptions);
    function isModule(node) {
        return [
            'ImportDeclaration',
            'ExportAllDeclaration',
            'ExportNamedDeclaration'
        ].includes(node.type);
    }
    const transformReplace = [];
    const renderReplace = [];
    options.replace.forEach(([pattern, replacement, transformOnly]) => {
        if (transformOnly === true) {
            transformReplace.push([pattern, replacement]);
        }
        else {
            renderReplace.push([pattern, replacement]);
        }
    });
    return {
        name: 'cke5-replace-import',
        transform(source) {
            const magic = new MagicString(source);
            transformReplace.forEach(replace => magic.replaceAll(...replace));
            return {
                code: magic.toString(),
                map: magic.generateMap({
                    includeContent: true,
                    hires: 'boundary'
                })
            };
        },
        renderChunk(source, chunk) {
            const magic = new MagicString(source);
            const ast = this.parse(source);
            walk(ast, {
                enter(node) {
                    if (!isModule(node) || !node.source) {
                        return;
                    }
                    const path = node.source.value;
                    const replacer = renderReplace.find(([pattern]) => {
                        if (typeof pattern === 'string') {
                            return pattern === path;
                        }
                        return pattern.test(path);
                    });
                    if (replacer) {
                        magic.overwrite(node.source.start + 1, // Skip opening quote
                        node.source.end - 1, // Skip closing quote
                        path.replace(...replacer));
                    }
                }
            });
            if (!magic.hasChanged()) {
                return null;
            }
            return {
                code: magic.toString(),
                map: magic.generateMap({
                    source: chunk.fileName,
                    includeContent: true,
                    hires: 'boundary'
                })
            };
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const filter = createFilter(['**/*.css']);
const REGEX_FOR_REMOVING_VAR_WHITESPACE = /(?<=var\()\s+|\s+(?=\))/g;
const CONTENT_PURGE_OPTIONS = {
    content: [],
    safelist: { deep: [/^ck-content/] },
    blocklist: [],
    fontFace: true,
    keyframes: true,
    variables: true
};
const EDITOR_PURGE_OPTIONS = {
    // Pseudo class`:where` is preserved only if the appropriate html structure matches the CSS selector.
    // It's a temporary solution to avoid removing selectors for Show blocks styles where `:where` occurs.
    // For example this structure will be omitted without the HTML content:
    //
    // ```css
    // .ck.ck-editor__editable.ck-editor__editable_inline.ck-show-blocks:not(.ck-widget)
    //     :where(figure.image, figure.table) figcaption { /* ... */ }
    // ```
    //
    // See: https://github.com/FullHuman/purgecss/issues/978
    content: [{
            raw: `<html>
				<body>
					<div class="ck ck-editor__editable ck-editor__editable_inline ck-show-blocks">
						<figure class="image">
							<figcaption></figcaption>
						</figure>
					</div>
				</body>
			</html>`,
            extension: 'html'
        }],
    safelist: {
        deep: [/ck(?!-content)/, /^(?!.*ck)/]
    },
    // Option to preserve all CSS selectors that starts with `[dir=ltr/rtl]` attribute.
    dynamicAttributes: ['dir'],
    // We must preserve all variables, keyframes and font faces in splitted stylesheets.
    // For example this is caused by case when some of them can be defined in the `ckeditor5`
    // but used in `ckeditor5-premium-features` stylesheet and vice versa.
    fontFace: false,
    keyframes: false,
    variables: false
};
function splitCss(pluginOptions) {
    const options = Object.assign({
        minimize: false
    }, pluginOptions);
    return {
        name: 'cke5-split-css',
        transform(code, id) {
            if (!filter(id)) {
                return;
            }
            return '';
        },
        async generateBundle(output, bundle) {
            // Get stylesheet from output bundle.
            const css = getCssStylesheet(bundle);
            // Some of CSS variables are used with spaces after/before brackets:
            // var( --var-name )
            // PurgeCss parser currently doesn't respect this syntax and removes this variable from definitions.
            // See: https://github.com/FullHuman/purgecss/issues/1264
            //
            // Till it's not solved we need to remove spaces from variables.
            const normalizedCss = css.replace(REGEX_FOR_REMOVING_VAR_WHITESPACE, '');
            // Generate stylesheets for editor and content.
            const editorStyles = await getStyles(normalizedCss, EDITOR_PURGE_OPTIONS);
            const contentStyles = await getStyles(normalizedCss, CONTENT_PURGE_OPTIONS);
            // Emit those styles into files.
            this.emitFile({
                type: 'asset',
                fileName: `${options.baseFileName}-editor.css`,
                source: options.minimize ? await minifyContent(editorStyles) : editorStyles
            });
            this.emitFile({
                type: 'asset',
                fileName: `${options.baseFileName}-content.css`,
                source: options.minimize ? await minifyContent(contentStyles) : contentStyles
            });
        }
    };
}
/**
 * Returns CSS stylesheet from the output bundle.
 */
function getCssStylesheet(bundle) {
    const cssStylesheetChunk = Object
        .values(bundle)
        .find(chunk => filter(chunk.fileName));
    if (!cssStylesheetChunk) {
        return '';
    }
    return cssStylesheetChunk.source.toString();
}
/**
 * Returns stylesheets content after removing comments and unused or empty CSS rules.
 */
async function getStyles(styles, purgeConfig) {
    const result = await new PurgeCSS().purge({
        ...purgeConfig,
        css: [{ raw: styles }]
    });
    return cleanContent(result[0].css);
}
/**
 * Safe and minimum CSS stylesheet transformation with removing comments and empty rules.
 */
async function cleanContent(content) {
    const normalizeContent = await cssnano({
        preset: litePreset({
            normalizeWhitespace: false
        })
    }).process(content, { from: undefined });
    return normalizeContent.css;
}
/**
 * Returns minified stylesheet content.
 */
async function minifyContent(stylesheetContent = '') {
    const minifier = cssnano();
    const minifiedResult = await minifier.process(stylesheetContent, { from: undefined });
    return minifiedResult.css;
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function loadTypeScriptSources() {
    const cache = {};
    return {
        name: 'load-typescript-sources',
        resolveId(source, importer) {
            if (!importer || !source.startsWith('.') || !source.endsWith('.js')) {
                return null;
            }
            const path = resolve(dirname(importer), source.replace(/\.js$/, '.ts'));
            if (cache[path]) {
                return cache[path];
            }
            try {
                accessSync(path);
                cache[path] = path;
                return path;
            }
            catch {
                cache[path] = null;
                return null;
            }
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const TYPINGS = removeWhitespace(`
	import type { Translations } from '@ckeditor/ckeditor5-utils';

	declare const translations: Translations;
	export default translations;
`);
/**
 * Returns translations dictionary from the PO file.
 */
function getDictionary(content) {
    const dictionary = {};
    for (const { msgid, msgstr } of content.items) {
        dictionary[msgid] = msgstr.length === 1 ? msgstr[0] : msgstr;
    }
    return dictionary;
}
/**
 * Returns stringified pluralization function from the PO file.
 */
function getPluralFunction(content) {
    return content.headers['Plural-Forms']?.split('plural=')?.[1] ?? null;
}
/**
 * Returns the code of the translations.
 */
function getCode(language, translation) {
    const translations = JSON.stringify({
        [language]: translation
    });
    return translations.replace(/"getPluralForm":"(.*)"/, 'getPluralForm(n){return $1}');
}
/**
 * Outputs the code for the ESM translation file.
 */
function getEsmCode(code) {
    return `export default ${code}`;
}
/**
 * Outputs the code for the UMD translation file.
 */
function getUmdCode(language, code) {
    return removeWhitespace(`
		( e => {
			const { [ '${language}' ]: { dictionary, getPluralForm } } = ${code};

			e[ '${language}' ] ||= { dictionary: {}, getPluralForm: null };
			e[ '${language}' ].dictionary = Object.assign( e[ '${language}' ].dictionary, dictionary );
			e[ '${language}' ].getPluralForm = getPluralForm;
		} )( window.CKEDITOR_TRANSLATIONS ||= {} );
	`);
}
/**
 * Generates translation files from the `.po` files.
 */
function translations(pluginOptions) {
    const options = Object.assign({
        source: '**/*.po',
        destination: 'translations'
    }, pluginOptions || {});
    return {
        name: 'cke5-translations',
        async generateBundle() {
            // Get the paths to the PO files based on provided pattern.
            const filePaths = await glob(options.source, {
                cwd: process.cwd(),
                ignore: 'node_modules/**'
            });
            // Group the translation files by the language code.
            const grouped = groupBy(filePaths, path => parse(path).name);
            for (const [language, paths] of Object.entries(grouped)) {
                // Gather all translations for the given language.
                const translations = paths
                    // Resolve relative paths to absolute paths.
                    .map(filePath => path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath))
                    // Load files by path.
                    .map(filePath => readFileSync(filePath, 'utf-8'))
                    // Process `.po` files.
                    .map(PO.parse)
                    // Filter out empty files.
                    .filter(Boolean)
                    // Map files to desired structure.
                    .map(content => ({
                    dictionary: getDictionary(content),
                    getPluralForm: getPluralFunction(content)
                }));
                // Merge all translations into a single object.
                const translation = merge({}, ...translations);
                const code = getCode(language, translation);
                // Emit ESM translations file.
                this.emitFile({
                    type: 'prebuilt-chunk',
                    fileName: path.join(options.destination, `${language}.js`),
                    code: getEsmCode(code),
                    exports: ['default']
                });
                // Emit UMD translations file.
                this.emitFile({
                    type: 'prebuilt-chunk',
                    fileName: path.join(options.destination, `${language}.umd.js`),
                    code: getUmdCode(language, code),
                    exports: []
                });
                // Emit typings file.
                this.emitFile({
                    type: 'prebuilt-chunk',
                    fileName: path.join(options.destination, `${language}.d.ts`),
                    code: TYPINGS,
                    exports: []
                });
            }
        }
    };
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Generates Rollup configurations.
 */
async function getRollupConfig(options) {
    const { input, output, tsconfig, banner, external, rewrite, declarations, translations: translations$1, sourceMap, minify, logLevel, browser } = options;
    /**
     * Until we deprecate the old installation methods, integrators can use either old import paths
     * (e.g. "@ckeditor/ckeditor5-core", "ckeditor5/src/core", etc.) or the new one (e.g. "ckeditor5")
     * in their source code. To make this work with the new installation methods, the `external` array
     * must be extended to include all packages that make up "ckeditor5" and "ckeditor5-premium-features"
     * whenever any of them are present in that array. Then, in the final step of generating the bundle,
     * we replace the old import paths with the new one.
     *
     * Example: When "ckeditor5" is added to the "external" array, it will be extended to also include
     * "@ckeditor/ckeditor5-core", "@ckeditor/ckeditor5-table" and any other package included in the "ckeditor5" bundle.
     *
     * This mapping can be removed when old installation methods are deprecated.
     */
    const coreRewrites = external.includes('ckeditor5') ?
        getPackageDependencies('ckeditor5') :
        [];
    const commercialRewrites = external.includes('ckeditor5-premium-features') ?
        getPackageDependencies('ckeditor5-premium-features') :
        [];
    external.push(...coreRewrites, ...commercialRewrites);
    /**
     * Get the name of the output CSS file based on the name of the "output" file.
     */
    const baseFileName = path.parse(output).name;
    const cssFileName = `${baseFileName}.css`;
    /**
     * Valid extensions for JavaScript and TypeScript files.
     */
    const extensions = ['.ts', '.mts', '.mjs', '.js', '.json', '.node'];
    return defineConfig({
        input,
        logLevel,
        /**
         * List of packages that will not be bundled, but their imports will be left as they are.
         */
        external: (id) => {
            // Bundle relative and absolute imports.
            if (id.startsWith('.') || path.isAbsolute(id)) {
                return false;
            }
            // Don't bundle imports that exactly match the `external` list.
            if (external.includes(id)) {
                return true;
            }
            const packageName = id
                .split('/')
                .slice(0, id.startsWith('@') ? 2 : 1)
                .join('/');
            const extension = path.extname(id);
            // Don't bundle, unless the import has non-JS or non-TS file extension (for example `.css`).
            return external.includes(packageName) && (!extension || extensions.includes(extension));
        },
        plugins: [
            /**
             * Allows importing raw file content using the `?raw` query parameter in the import path.
             */
            rawImport(),
            /**
             * Ensures that `.ts` files are loaded over `.js` files if both exist.
             */
            loadTypeScriptSources(),
            /**
             * Converts CommonJS modules to ES6.
             */
            commonjs({
                sourceMap,
                defaultIsModuleExports: true
            }),
            /**
             * Resolves imports using the Node resolution algorithm.
             */
            nodeResolve({
                extensions,
                browser: true,
                preferBuiltins: false
            }),
            /**
             * Allows importing JSON files.
             */
            json(),
            /**
             * Turns SVG file imports into JavaScript strings.
             */
            svg({
                stringify: true
            }),
            /**
             * Allows using imports and nesting in CSS and extracts output CSS to a separate file.
             */
            bundleCss({
                fileName: cssFileName,
                minify,
                sourceMap
            }),
            /**
             * Ensures empty files are emitted if files of given names were not generated.
             */
            emitCss({
                fileNames: [cssFileName]
            }),
            /**
             * Generates CSS files containing only content and only editor styles.
             */
            splitCss({
                baseFileName,
                minimize: minify
            }),
            /**
             * Transpiles TypeScript to JavaScript.
             */
            swc({
                include: ['**/*.[jt]s'],
                swc: {
                    jsc: {
                        target: 'es2022',
                        loose: false
                    },
                    module: {
                        type: 'es6'
                    }
                }
            }),
            /**
             * Builds translation from the `.po` files.
             */
            getOptionalPlugin(translations$1, translations({ source: translations$1 })),
            /**
             * Does type checking and generates `.d.ts` files.
             */
            getTypeScriptPlugin({ tsconfig, output, sourceMap, declarations }),
            /**
             * Replaces parts of the source code with the provided values.
             */
            replaceImports({
                replace: [
                    /**
                     * Rewrites provided in the config.
                     */
                    ...rewrite,
                    /**
                     * Matches:
                     * - ckeditor5/src/XXX (optionally with `.js` or `.ts` extension).
                     * - ckeditor5-collaboration/src/XXX (optionally with `.js` or `.ts` extension).
                     */
                    [
                        /ckeditor5\/src\/([a-z-]+)(?:[a-z-/.]+)?/,
                        browser ? 'ckeditor5' : '@ckeditor/ckeditor5-$1/dist/index.js'
                    ],
                    [
                        /ckeditor5-collaboration\/src\/([a-z-]+)(?:[a-z-/.]+)?/,
                        browser ? 'ckeditor5-premium-features' : 'ckeditor5-collaboration/dist/index.js'
                    ],
                    /**
                     * Rewrite "old" imports to imports used in new installation methods.
                     *
                     * Examples:
                     * [ '@ckeditor/ckeditor5-core', 'ckeditor5' ],
                     * [ '@ckeditor/ckeditor5-table', 'ckeditor5' ],
                     * [ '@ckeditor/ckeditor5-ai', 'ckeditor5-premium-features' ],
                     * [ '@ckeditor/ckeditor5-case-change', 'ckeditor5-premium-features' ],
                     */
                    ...coreRewrites.map(pkg => [
                        pkg,
                        browser ? 'ckeditor5' : `${pkg}/dist/index.js`
                    ]),
                    ...commercialRewrites.map(pkg => [
                        pkg,
                        browser ? 'ckeditor5-premium-features' : `${pkg}/dist/index.js`
                    ])
                ]
            }),
            /**
             * Minifies and mangles the output. It also removes all code comments except for license comments.
             */
            getOptionalPlugin(minify, terser({
                sourceMap,
                format: {
                    comments: false
                }
            })),
            /**
             * Adds provided banner to the top of output JavaScript and CSS files.
             */
            getOptionalPlugin(banner, addBanner({ banner }))
        ]
    });
}
/**
 * Returns a list of keys in `package.json` file of a given dependency.
 */
function getPackageDependencies(packageName) {
    try {
        const pkg = getUserDependency(`${packageName}/package.json`);
        return Object.keys(pkg.dependencies);
    }
    catch {
        return [];
    }
}
/**
 * Returns the TypeScript plugin if tsconfig file exists, otherwise doesn't return anything.
 */
function getTypeScriptPlugin({ tsconfig, output, sourceMap, declarations }) {
    if (!existsSync(tsconfig)) {
        return;
    }
    return typescriptPlugin({
        noForceEmit: true,
        tsconfig,
        sourceMap,
        inlineSources: sourceMap, // https://github.com/rollup/plugins/issues/260
        typescript: getUserDependency('typescript'),
        declaration: declarations,
        declarationDir: declarations ? path.parse(output).dir : undefined,
        compilerOptions: {
            noEmitOnError: true,
            ...(declarations ? { emitDeclarationOnly: true } : { noEmit: true })
        }
    });
}

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const defaultOptions = {
    input: 'src/index.ts',
    output: 'dist/index.js',
    tsconfig: 'tsconfig.json',
    name: '',
    globals: {},
    banner: '',
    external: [],
    rewrite: [],
    declarations: false,
    translations: '',
    sourceMap: false,
    minify: false,
    clean: false,
    logLevel: 'warn',
    browser: false,
    get cwd() {
        return path.normalize(process.cwd());
    }
};
/**
 * `ckeditor5` and `ckeditor5-premium-features` globals.
 */
const CKEDITOR_GLOBALS = {
    ckeditor5: 'CKEDITOR',
    'ckeditor5-premium-features': 'CKEDITOR_PREMIUM_FEATURES'
};
/**
 * Reads CLI arguments and turn the keys into camelcase.
 */
function getCliArguments() {
    const { values } = parseArgs({
        options: {
            'cwd': { type: 'string' },
            'input': { type: 'string' },
            'output': { type: 'string' },
            'tsconfig': { type: 'string' },
            'banner': { type: 'string' },
            'external': { type: 'string', multiple: true },
            'declarations': { type: 'boolean' },
            'translations': { type: 'string' },
            'source-map': { type: 'boolean' },
            'minify': { type: 'boolean' },
            'clean': { type: 'boolean' },
            'log-level': { type: 'string' },
            'browser': { type: 'boolean' },
            'name': { type: 'string' },
            'globals': { type: 'string', multiple: true }
        },
        // Skip `node ckeditor5-build-package`.
        args: process.argv.slice(2),
        // Fail when unknown argument is used.
        strict: true
    });
    return camelizeObjectKeys(values);
}
/**
 * Convert `globals` parameter to object when it's passed via CLI as `<external-id:variableName,another-external-id:anotherVariableName, >`
 */
function normalizeGlobalsParameter(globals) {
    if (Array.isArray(globals)) {
        return Object.fromEntries(globals.map(item => item.split(':')));
    }
    return globals;
}
/**
 * Generates `UMD` build based on previous `ESM` build.
 */
async function generateUmdBuild(args, bundle) {
    args.input = args.output;
    const { dir, name } = path.parse(args.output);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { plugins, ...config } = await getRollupConfig(args);
    /**
     * Ignore the plugins we used for the ESM build. Instead, add a new plugin to not only
     * load the source code of the dependencies (which is the default in Rollup for better
     * performance), but also their source maps to generate a proper final source map for
     * the UMD bundle.
     */
    const build = await rollup({
        ...config,
        plugins: [
            getOptionalPlugin(args.sourceMap, loadSourcemaps())
        ]
    });
    const umdBundle = await build.write({
        format: 'umd',
        file: path.join(dir, `${name}.umd.js`),
        inlineDynamicImports: true,
        assetFileNames: '[name][extname]',
        sourcemap: args.sourceMap,
        name: args.name,
        globals: {
            ...CKEDITOR_GLOBALS,
            ...args.globals
        }
    });
    return {
        output: [
            ...bundle.output,
            ...umdBundle.output
        ]
    };
}
/**
 * Merges user-provided options with the defaults and converts relative paths
 * to absolute paths. Paths to non-existent files are also removed.
 */
async function normalizeOptions(options) {
    const normalized = Object.assign({}, defaultOptions, options);
    const paths = [
        'input',
        'output',
        'tsconfig',
        'translations',
        'banner'
    ];
    paths.forEach(pathName => {
        if (!normalized[pathName]) {
            return;
        }
        normalized[pathName] = path.resolve(normalized.cwd, normalized[pathName]);
    });
    /**
     * Replace banner path with the actual banner contents.
     */
    if (normalized.banner) {
        const { href } = url.pathToFileURL(normalized.banner);
        const { banner } = await import(href);
        normalized.banner = banner;
    }
    if (normalized.globals) {
        normalized.globals = normalizeGlobalsParameter(normalized.globals);
    }
    return normalized;
}
/**
 * Builds project based on options provided as an object or CLI arguments.
 */
async function build(options = getCliArguments()) {
    try {
        const args = await normalizeOptions(options);
        /**
         * Remove old build directory.
         */
        if (args.clean) {
            const { dir } = path.parse(args.output);
            fs.rmSync(dir, { recursive: true, force: true });
        }
        /**
         * Create Rollup configuration based on provided arguments.
         */
        const config = await getRollupConfig(args);
        /**
         * Run Rollup to generate bundles.
         */
        const build = await rollup(config);
        /**
         * Write bundles to the filesystem.
         */
        const bundle = await build.write({
            format: 'esm',
            file: args.output,
            inlineDynamicImports: true,
            assetFileNames: '[name][extname]',
            sourcemap: args.sourceMap,
            name: args.name
        });
        if (!args.browser || !args.name) {
            return bundle;
        }
        /**
         * Generate UMD bundle if the `browser` parameter is set to `true` and `name` is set.
         */
        return generateUmdBuild(args, bundle);
    }
    catch (error) {
        let message;
        if (error.name === 'RollupError') {
            message = `
				${styleText('red', 'ERROR: Error occurred when processing the file ' + error.id)}.
				${error.message}
				${error.frame ?? ''}
			`;
        }
        else {
            message = `
				${styleText('red', 'ERROR: The build process failed with the following error:')}
				${error.message}
			`;
        }
        throw new Error(removeWhitespace(message));
    }
}

export { addBanner, build, bundleCss, emitCss, loadSourcemaps, loadTypeScriptSources, rawImport, replaceImports, splitCss, translations };
