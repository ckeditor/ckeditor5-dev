import { styleText } from 'util';
import fs, { readFileSync } from 'fs';
import path from 'path';
import { rspack } from '@rspack/core';
import { CKEditorTranslationsPlugin } from '@ckeditor/ckeditor5-dev-translations';
import { createRequire } from 'module';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import postCssImport from 'postcss-import';
import postCssMixins from 'postcss-mixins';
import postCssNesting from 'postcss-nesting';
import cssnano from 'cssnano';
import postcss from 'postcss';
import { PassThrough } from 'stream';
import through from 'through2';
import readline from 'readline';
import isInteractive from 'is-interactive';
import cliSpinners from 'cli-spinners';
import cliCursor from 'cli-cursor';
import sh from 'shelljs';
import { simpleGit } from 'simple-git';
import upath from 'upath';
import fs$1, { readFile } from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';
import pacote from 'pacote';
import { glob } from 'glob';

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const levels = new Map();
levels.set('silent', new Set([]));
levels.set('info', new Set(['info']));
levels.set('warning', new Set(['info', 'warning']));
levels.set('error', new Set(['info', 'warning', 'error']));
/**
 * Logger module which allows configuring the verbosity level.
 *
 * There are three levels of verbosity:
 * 1. `info` - all messages will be logged,
 * 2. `warning` - warning and errors will be logged,
 * 3. `error` - only errors will be logged.
 *
 * Usage:
 *
 *      import { logger } from '@ckeditor/ckeditor5-dev-utils';
 *
 *      const infoLog = logger( 'info' );
 *      infoLog.info( 'Message.' ); // This message will be always displayed.
 *      infoLog.warning( 'Message.' ); // This message will be always displayed.
 *      infoLog.error( 'Message.' ); // This message will be always displayed.
 *
 *      const warningLog = logger( 'warning' );
 *      warningLog.info( 'Message.' ); // This message won't be displayed.
 *      warningLog.warning( 'Message.' ); // This message will be always displayed.
 *      warningLog.error( 'Message.' ); // This message will be always displayed.
 *
 *      const errorLog = logger( 'error' );
 *      errorLog.info( 'Message.' ); // This message won't be displayed.
 *      errorLog.warning( 'Message.' ); // This message won't be displayed.
 *      errorLog.error( 'Message.' ); // This message will be always displayed.
 *
 * Additionally, the `logger#error()` method prints the error instance if provided as the second argument.
 */
function logger(moduleVerbosity = 'info') {
    return {
        info(message) {
            this._log('info', message);
        },
        warning(message) {
            this._log('warning', styleText('yellow', message));
        },
        error(message, error) {
            this._log('error', styleText('red', message), error);
        },
        _log(messageVerbosity, message, error) {
            if (!levels.get(messageVerbosity).has(moduleVerbosity)) {
                return;
            }
            console.log(message);
            if (error) {
                console.dir(error, { depth: null });
            }
        }
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function getLicenseBanner() {
    const date = new Date();
    // License banner starts with `!`. That combines with uglifyjs' `comments` /^!/ option
    // make webpack preserve that banner while cleaning code from others comments during the build task.
    // It's because UglifyJsWebpackPlugin minification takes place after adding a banner.
    /* eslint-disable @stylistic/indent */
    return (`/*!
 * @license Copyright (c) 2003-${date.getFullYear()}, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */`);
    /* eslint-enable @stylistic/indent */
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$7 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getLicenseBanner: getLicenseBanner
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const require = createRequire(import.meta.url);
/**
 * This can be replaced with `fileURLToPath( import.meta.resolve( '<NAME>' ) )`
 * once Vitest 4 releases and we update to it.
 *
 * In Vitest 3 and earlier, `import.meta.resolve` results in the following error:
 *
 * ```
 * __vite_ssr_import_meta__.resolve is not a function
 * ```
 */
function resolveLoader(loaderName) {
    return require.resolve(loaderName);
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const escapedPathSep = path.sep == '/' ? '/' : '\\\\';
function getCoverageLoader({ files }) {
    return {
        test: /\.[jt]s$/,
        use: [
            {
                loader: resolveLoader('babel-loader'),
                options: {
                    plugins: [
                        'babel-plugin-istanbul'
                    ]
                }
            }
        ],
        include: getPathsToIncludeForCoverage(files),
        exclude: [
            new RegExp(`${escapedPathSep}(lib)${escapedPathSep}`)
        ]
    };
}
/**
 * Returns an array of `/ckeditor5-name\/src\//` regexps based on passed globs.
 * E.g., `ckeditor5-utils/**\/*.js` will be converted to `/ckeditor5-utils\/src/`.
 *
 * This loose way of matching packages for CC works with packages under various paths.
 * E.g., `workspace/ckeditor5-utils` and `ckeditor5/node_modules/ckeditor5-utils` and every other path.
 */
function getPathsToIncludeForCoverage(globs) {
    const values = globs
        .reduce((returnedPatterns, globPatterns) => {
        returnedPatterns.push(...globPatterns);
        return returnedPatterns;
    }, [])
        .map(glob => {
        const matchCKEditor5 = glob.match(/\/(ckeditor5-[^/]+)\/(?!.*ckeditor5-)/);
        if (matchCKEditor5) {
            const packageName = matchCKEditor5[1]
                // A special case when --files='!engine' or --files='!engine|ui' was passed.
                // Convert it to /ckeditor5-(?!engine)[^/]\/src\//.
                .replace(/ckeditor5-!\(([^)]+)\)\*/, 'ckeditor5-(?!$1)[^' + escapedPathSep + ']+')
                .replace('ckeditor5-*', 'ckeditor5-[a-z]+');
            return new RegExp(packageName + escapedPathSep + 'src' + escapedPathSep);
        }
    })
        // Filter undefined ones.
        .filter(path => path);
    return [...new Set(values)];
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * @param {Array.<string>} debugFlags
 * @returns {object}
 */
function getDebugLoader(debugFlags) {
    return {
        loader: path.join(import.meta.dirname, 'ck-debug-loader.js'),
        options: { debugFlags }
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function getTypeScriptLoader(options = {}) {
    const { debugFlags = [], includeDebugLoader = false } = options;
    return {
        test: /\.ts$/,
        use: [
            {
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        target: 'es2022',
                        parser: {
                            syntax: 'typescript'
                        },
                        preserveAllComments: true
                    }
                },
                type: 'javascript/auto'
            },
            includeDebugLoader ? getDebugLoader(debugFlags) : null
        ].filter(Boolean)
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function getIconsLoader({ matchExtensionOnly = false } = {}) {
    return {
        test: matchExtensionOnly ? /\.svg$/ : /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
        use: [resolveLoader('raw-loader')]
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function getFormattedTextLoader() {
    return {
        test: /\.(txt|html|rtf)$/,
        use: [resolveLoader('raw-loader')]
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function getJavaScriptLoader({ debugFlags }) {
    return {
        test: /\.js$/,
        ...getDebugLoader(debugFlags)
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 */
function themeLogger() {
    return {
        postcssPlugin: 'postcss-ckeditor5-theme-logger',
        Once(root) {
            root.prepend(`/* ${root.source.input.file} */ \n`);
        }
    };
}
themeLogger.postcss = true;

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Returns a (CKEditor 5) package name the file belongs to.
 *
 * E.g., for the path to the file:
 *
 *        "/foo/ckeditor5/packages/ckeditor5-bar/baz.css"
 *
 * it outputs
 *
 *        "ckeditor5-bar"
 *
 * It always returns the last found package. Sometimes the whole project can be located
 * under path which starts with `ckeditor5-`. In this case it isn't a package and it doesn't make
 * sense to return the directory name. See #381.
 *
 * E.g., for the path from the package directory to the file:
 *
 *        "/foo/ckeditor5/packages/ckeditor5-editor-classic/node_modules/@ckeditor/ckeditor5-bar/baz.css"
 *
 * it outputs
 *
 *        "ckeditor5-bar"
 */
function getPackageName(inputFilePath) {
    const match = inputFilePath.match(/^.+[/\\](ckeditor5-[^/\\]+)/);
    if (match) {
        return match.pop();
    }
    else {
        return null;
    }
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const log = logger();
/**
 * A PostCSS plugin that loads a theme files from specified path.
 *
 * For any CSS file processed by the PostCSS, this plugin tries to find a complementary
 * theme file and load it (knowing the path to the theme). Theme files must be organized
 * to reflect the structure of the CSS files in editor packages,
 *
 * E.g., if the path to the theme is:
 * `/foo/bar/ckeditor5-theme-foo/theme/theme.css`
 *
 * and the CSS to be themed is:
 * `/baz/qux/ckeditor5-qux/theme/components/button.css`
 *
 * the theme file for `button.css` should be located under:
 * `/foo/bar/ckeditor5-theme-foo/ckeditor5-qux/theme/components/button.css`
 *
 * See the `ThemeImporterOptions` to learn about importer options.
 *
 * To learn more about PostCSS plugins, please refer to the API
 * [documentation](http://api.postcss.org/postcss.html#.plugin) of the project.
 */
function themeImporter(pluginOptions = {}) {
    return {
        postcssPlugin: 'postcss-ckeditor5-theme-importer',
        Once(root, { result }) {
            // Clone the options, don't alter the original options object.
            const options = Object.assign({}, pluginOptions, {
                debug: pluginOptions.debug || false,
                postCssOptions: {
                    plugins: [
                        postCssImport(),
                        themeLogger()
                    ]
                },
                root,
                result
            });
            return importThemeFile(options);
        }
    };
}
themeImporter.postcss = true;
/**
 * Imports a complementary theme file corresponding with a CSS file being processed by
 * PostCSS, if such a theme file exists.
 */
function importThemeFile(options) {
    const inputFilePath = options.root.source.input.file;
    // A corresponding theme file e.g. "/foo/bar/ckeditor5-theme-baz/theme/ckeditor5-qux/components/button.css".
    const themeFilePath = getThemeFilePath(options.themePath, inputFilePath);
    if (themeFilePath) {
        if (options.debug) {
            log.info(`[ThemeImporter] Loading for "${styleText('cyan', inputFilePath)}".`);
        }
        options.fileToImport = themeFilePath;
        options.fileToImportParent = inputFilePath;
        return importFile(options);
    }
}
/**
 * Imports a CSS file specified in the options using the postcss-import
 * plugin and appends its content to the css tree (root).
 */
function importFile(options) {
    const { root, result, sourceMap } = options;
    const file = options.fileToImport;
    const parent = options.fileToImportParent;
    const processingOptions = {
        from: file,
        to: file,
        map: sourceMap ? { inline: true } : false
    };
    if (!fs.existsSync(file)) {
        if (options.debug) {
            log.info(`[ThemeImporter] Failed to find "${styleText('yellow', file)}".`);
        }
        return;
    }
    return postcss(options.postCssOptions)
        .process(`@import "${file}";`, processingOptions)
        .then(importResult => {
        // Merge the CSS trees.
        root.append(importResult.root.nodes);
        // Let the watcher know that the theme file should be observed too.
        result.messages.push({
            file, parent,
            type: 'dependency'
        });
        // `importResult` contains references to all dependencies that were used.
        // We need to inform the base file (the file which imports the *.css file) that these dependencies should be watched too.
        importResult.messages.forEach(message => {
            result.messages.push(message);
        });
        if (options.debug) {
            log.info(`[ThemeImporter] Loaded "${styleText('green', file)}".`);
        }
    })
        .catch(error => {
        throw error;
    });
}
/**
 * For a given path to the theme, and a path to the CSS file processed by
 * PostCSS, it returns a path to the complementary file in the theme.
 *
 * E.g., if the path to the theme is:
 * `/foo/bar/ckeditor5-theme-foo/theme/theme.css`
 *
 * and the CSS to be themed is:
 * `/baz/qux/ckeditor5-qux/theme/components/button.css`
 *
 * this helper will return:
 * `/foo/bar/ckeditor5-theme-foo/ckeditor5-qux/theme/components/button.css`
 *
 * @param themePath Path to the theme.
 * @param inputFilePath Path to the CSS file which is to be themed.
 */
function getThemeFilePath(themePath, inputFilePath) {
    // ckeditor5-theme-foo/theme/theme.css -> ckeditor5-theme-foo/theme
    themePath = path.dirname(themePath);
    // "ckeditor5-qux"
    const packageName = getPackageName(inputFilePath);
    // Don't load theme file for files not belonging to a "ckeditor5-*" package.
    if (!packageName) {
        return;
    }
    // "components/button.css"
    const inputFileName = inputFilePath.split(path.join(packageName, 'theme', path.sep))[1];
    // Don't load theme file for files not belonging to "ckeditor5-*/theme" folder.
    if (!inputFileName) {
        return;
    }
    // A corresponding theme file e.g. "/foo/bar/ckeditor5-theme-baz/theme/ckeditor5-qux/components/button.css".
    return path.resolve(themePath, packageName, inputFileName);
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Returns a PostCSS configuration to build the editor styles (e.g., used by postcss-loader).
 */
function getPostCssConfig(options = {}) {
    const config = {
        plugins: [
            postCssImport(),
            themeImporter(options.themeImporter),
            postCssMixins(),
            postCssNesting({
                // https://github.com/ckeditor/ckeditor5/issues/11730
                noIsPseudoSelector: true,
                edition: '2021'
            }),
            themeLogger()
        ]
    };
    if (options.sourceMap) {
        config.sourceMap = 'inline';
    }
    if (options.minify) {
        config.plugins.push(cssnano({
            preset: 'default'
        }));
    }
    return config;
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$6 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getPostCssConfig: getPostCssConfig,
    themeImporter: themeImporter
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function getStylesLoader(options) {
    const { themePath, minify = false, sourceMap = false, extractToSeparateFile = false, skipPostCssLoader = false } = options;
    const getBundledLoader = () => ({
        loader: resolveLoader('style-loader'),
        options: {
            injectType: 'singletonStyleTag',
            attributes: {
                'data-cke': true
            }
        }
    });
    const getExtractedLoader = () => {
        return MiniCssExtractPlugin.loader;
    };
    return {
        test: /\.css$/,
        use: [
            extractToSeparateFile ? getExtractedLoader() : getBundledLoader(),
            resolveLoader('css-loader'),
            skipPostCssLoader ? null : {
                loader: resolveLoader('postcss-loader'),
                options: {
                    postcssOptions: getPostCssConfig({
                        themeImporter: { themePath },
                        minify,
                        sourceMap
                    })
                }
            }
        ].filter(Boolean)
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$5 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getCoverageLoader: getCoverageLoader,
    getDebugLoader: getDebugLoader,
    getFormattedTextLoader: getFormattedTextLoader,
    getIconsLoader: getIconsLoader,
    getJavaScriptLoader: getJavaScriptLoader,
    getStylesLoader: getStylesLoader,
    getTypeScriptLoader: getTypeScriptLoader
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Returns a webpack configuration that creates a bundle file for the specified package. Thanks to that, plugins exported
 * by the package can be added to DLL builds.
 * @returns {object}
 */
async function getDllPluginWebpackConfig(webpack, options) {
    const { name: packageName } = JSON.parse(fs.readFileSync(path.join(options.packagePath, 'package.json'), 'utf-8'));
    const langDirExists = fs.existsSync(path.join(options.packagePath, 'lang'));
    const indexJsExists = fs.existsSync(path.join(options.packagePath, 'src', 'index.js'));
    const webpackConfig = {
        mode: options.isDevelopmentMode ? 'development' : 'production',
        devtool: false,
        performance: { hints: false },
        // Use the `index.js` file to prepare the build to avoid potential issues if a source code differs from the published one.
        entry: path.join(options.packagePath, 'src', indexJsExists ? 'index.js' : 'index.ts'),
        output: {
            library: ['CKEditor5', getGlobalKeyForPackage(packageName)],
            path: path.join(options.packagePath, 'build'),
            filename: getIndexFileName(packageName),
            libraryTarget: 'window'
        },
        optimization: {
            minimize: false
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: getLicenseBanner(),
                raw: true
            }),
            new webpack.DllReferencePlugin({
                manifest: JSON.parse(fs.readFileSync(options.manifestPath, 'utf-8')),
                scope: 'ckeditor5/src',
                name: 'CKEditor5.dll'
            })
        ],
        resolve: {
            extensions: ['.ts', '.js', '.json'],
            extensionAlias: {
                '.js': ['.js', '.ts']
            }
        },
        module: {
            rules: [
                getIconsLoader({ matchExtensionOnly: true }),
                getStylesLoader({
                    themePath: options.themePath,
                    minify: true
                }),
                getTypeScriptLoader({
                    configFile: options.tsconfigPath || 'tsconfig.json'
                })
            ]
        }
    };
    // Force loading JS files first if the `index.js` file exists.
    if (indexJsExists) {
        webpackConfig.resolve.extensions = moveArrayItem(webpackConfig.resolve.extensions, webpackConfig.resolve.extensions.indexOf('.js'), 0);
    }
    if (langDirExists) {
        webpackConfig.plugins.push(new CKEditorTranslationsPlugin({
            // UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
            language: 'en',
            additionalLanguages: 'all',
            sourceFilesPattern: /^src[/\\].+\.[jt]s$/,
            skipPluralFormFunction: true
        }));
    }
    console.log({ isDevelopmentMode: options.isDevelopmentMode });
    if (options.isDevelopmentMode) {
        webpackConfig.devtool = 'source-map';
    }
    else {
        webpackConfig.optimization.minimize = true;
        webpackConfig.optimization.minimizer = [
            new rspack.SwcJsMinimizerRspackPlugin({
                extractComments: false
            })
        ];
    }
    return webpackConfig;
}
/**
 * Transforms the package name (`@ckeditor/ckeditor5-foo-bar`) to the name that will be used while
 * exporting the library into the global scope.
 */
function getGlobalKeyForPackage(packageName) {
    return packageName
        .replace(/^@ckeditor\/ckeditor5?-/, '')
        .replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}
/**
 * Extracts the main file name from the package name.
 */
function getIndexFileName(packageName) {
    return packageName.replace(/^@ckeditor\/ckeditor5?-/, '') + '.js';
}
function moveArrayItem(source, indexFrom, indexTo) {
    const tmp = source.slice();
    tmp.splice(indexTo, 0, ...tmp.splice(indexFrom, 1));
    return tmp;
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getDllPluginWebpackConfig: getDllPluginWebpackConfig
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function noop(callback) {
    if (!callback) {
        return new PassThrough({ objectMode: true });
    }
    return through({ objectMode: true }, (chunk, encoding, throughCallback) => {
        const callbackResult = callback(chunk);
        if (callbackResult instanceof Promise) {
            callbackResult
                .then(() => {
                throughCallback(null, chunk);
            })
                .catch(err => {
                throughCallback(err);
            });
        }
        else {
            throughCallback(null, chunk);
        }
    });
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    noop: noop
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
// A size of default indent for a log.
const INDENT_SIZE = 3;
/**
 * A factory function that creates an instance of a CLI spinner. It supports both a spinner CLI and a spinner with a counter.
 *
 * The spinner improves UX when processing a time-consuming task. A developer does not have to consider whether the process hanged on.
 *
 * @param title Description of the current processed task.
 * @param [options={}]
 */
function createSpinner(title, options = {}) {
    const isEnabled = !options.isDisabled && isInteractive();
    const indentLevel = options.indentLevel || 0;
    const indent = ' '.repeat(indentLevel * INDENT_SIZE);
    const emoji = options.emoji || '📍';
    const status = options.status || '[title] Status: [current]/[total].';
    const spinnerType = typeof options.total === 'number' ? 'counter' : 'spinner';
    let timerId;
    let counter = 0;
    return {
        start() {
            if (!isEnabled) {
                console.log(`${emoji} ${title}`);
                return;
            }
            const { frames } = cliSpinners.dots12;
            const getMessage = () => {
                if (spinnerType === 'spinner') {
                    return title;
                }
                if (typeof options.status === 'function') {
                    return options.status(title, counter, options.total);
                }
                return `${status}`
                    .replace('[title]', title)
                    .replace('[current]', String(counter))
                    .replace('[total]', options.total.toString());
            };
            let index = 0;
            let shouldClearLastLine = false;
            cliCursor.hide();
            timerId = setInterval(() => {
                if (index === frames.length) {
                    index = 0;
                }
                if (shouldClearLastLine) {
                    clearLastLine();
                }
                process.stdout.write(`${indent}${frames[index++]} ${getMessage()}`);
                shouldClearLastLine = true;
            }, cliSpinners.dots12.interval);
        },
        increase() {
            if (spinnerType === 'spinner') {
                throw new Error('The \'#increase()\' method is available only when using the counter spinner.');
            }
            counter += 1;
        },
        finish(options = {}) {
            const finishEmoji = options.emoji || emoji;
            if (!isEnabled) {
                return;
            }
            clearInterval(timerId);
            clearLastLine();
            if (spinnerType === 'counter') {
                clearLastLine();
            }
            cliCursor.show();
            console.log(`${indent}${finishEmoji} ${title}`);
        }
    };
    function clearLastLine() {
        readline.clearLine(process.stdout, 1);
        readline.cursorTo(process.stdout, 0);
    }
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Returns array with all directories under the specified path.
 */
function getDirectories(directoryPath) {
    const isDirectory = (directoryPath) => {
        try {
            return fs.statSync(directoryPath).isDirectory();
        }
        catch {
            return false;
        }
    };
    return fs.readdirSync(directoryPath)
        .filter(item => {
        return isDirectory(path.join(directoryPath, item));
    });
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
function shExec(command, options = {}) {
    const { verbosity = 'info', cwd = process.cwd(), async = false } = options;
    sh.config.silent = true;
    const execOptions = { cwd };
    if (async) {
        return new Promise((resolve, reject) => {
            sh.exec(command, execOptions, (code, stdout, stderr) => {
                try {
                    const result = execHandler({ code, stdout, stderr, verbosity, command });
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    const { code, stdout, stderr } = sh.exec(command, execOptions);
    return execHandler({ code, stdout, stderr, verbosity, command });
}
function execHandler({ code, stdout, stderr, verbosity, command }) {
    const log = logger(verbosity);
    const grey = (text) => styleText('grey', text);
    if (code) {
        if (stdout) {
            log.error(grey(stdout));
        }
        if (stderr) {
            log.error(grey(stderr));
        }
        throw new Error(`Error while executing ${command}: ${stderr}`);
    }
    if (stdout) {
        log.info(grey(stdout));
    }
    if (stderr) {
        log.info(grey(stderr));
    }
    return stdout;
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Updates JSON file under a specified path.
 *
 * @param filePath Path to a file on disk.
 * @param updateFunction Function that will be called with a parsed JSON object. It should return the modified JSON object to save.
 */
function updateJSONFile(filePath, updateFunction) {
    const contents = fs.readFileSync(filePath, 'utf-8');
    let json = JSON.parse(contents);
    json = updateFunction(json);
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const CHUNK_LENGTH_LIMIT = 4000;
async function commit({ cwd, message, files, dryRun = false }) {
    cwd = upath.normalize(cwd);
    const git = simpleGit({ baseDir: cwd });
    const filteredFiles = await getFilesToCommit(cwd, files, git);
    // To avoid an error when trying to commit a non-existing path.
    if (!filteredFiles.length) {
        return;
    }
    if (dryRun) {
        const lastCommit = await git.log(['-1']);
        await makeCommit(git, message, filteredFiles);
        await git.reset([lastCommit.latest.hash]);
    }
    else {
        await makeCommit(git, message, filteredFiles);
    }
}
async function makeCommit(git, message, filteredFiles) {
    for (const chunk of splitPathsIntoChunks(filteredFiles)) {
        await git.add(chunk);
    }
    const status = await git.status();
    if (!status.isClean()) {
        await git.commit(message);
    }
}
function splitPathsIntoChunks(filePaths) {
    return filePaths.reduce((chunks, singlePath) => {
        const lastChunk = chunks.at(-1);
        const newLength = [...lastChunk, singlePath].join(' ').length;
        if (newLength < CHUNK_LENGTH_LIMIT) {
            lastChunk.push(singlePath);
        }
        else {
            chunks.push([singlePath]);
        }
        return chunks;
    }, [[]]);
}
/**
 * Returns a set of Git-tracked file paths by parsing `git ls-files --stage`.
 * Supports file names with spaces using tab-splitting.
 */
async function getFilesToCommit(cwd, files, git) {
    const gitTracked = await getTrackedFiles(git);
    const filePromises = files
        .map(filePath => {
        const normalized = upath.normalize(filePath);
        // `upath` and Unix environment may fail on detecting a Windows-like path.
        // Hence, let's use `isAbsolute` from both systems.
        const isAbsolute = upath.win32.isAbsolute(normalized) || upath.posix.isAbsolute(normalized);
        return isAbsolute ? upath.relative(cwd, normalized) : normalized;
    })
        .map(async (itemPath) => {
        if (gitTracked.has(itemPath)) {
            return itemPath;
        }
        const fullPath = upath.join(cwd, itemPath);
        try {
            await fs$1.access(fullPath);
            return itemPath;
        }
        catch {
            return null;
        }
    });
    return (await Promise.all(filePromises))
        .filter((pathOrNull) => pathOrNull !== null);
}
/**
 * Returns a set of Git-tracked files in a current repository.
 */
async function getTrackedFiles(git) {
    const gitTrackedOutput = await git.raw(['ls-files', '--stage']);
    const gitTracked = gitTrackedOutput
        .split('\n')
        // <mode> <object> <stage>\t<file>
        // Split by tab and take the last part, which is the file path that could contain spaces.
        .map(line => line.trim().split('\t').pop())
        .filter(Boolean)
        .map(p => upath.normalize(p));
    return new Set(gitTracked);
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    commit: commit,
    createSpinner: createSpinner,
    getDirectories: getDirectories,
    shExec: shExec,
    updateJSONFile: updateJSONFile
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
const manifest = cacheLessPacoteFactory(pacote.manifest);
const packument = cacheLessPacoteFactory(pacote.packument);
/**
 * Creates a version of a `pacote` function that doesn't use caching.
 */
function cacheLessPacoteFactory(callback) {
    return async (...args) => {
        const [description, options = {}] = args;
        const uuid = randomUUID();
        const cacheDir = upath.join(os.tmpdir(), `pacote--${uuid}`);
        await fs$1.mkdir(cacheDir, { recursive: true });
        try {
            return await callback(description, {
                ...options,
                cache: cacheDir,
                memoize: false,
                preferOnline: true
            });
        }
        finally {
            await fs$1.rm(cacheDir, { recursive: true, force: true });
        }
    };
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Checks if a specific version of a package is available in the npm registry.
 */
async function checkVersionAvailability(version, packageName) {
    return manifest(`${packageName}@${version}`)
        .then(() => {
        // If `manifest` resolves, a package with the given version exists.
        return false;
    })
        .catch(() => {
        // When throws, the package does not exist.
        return true;
    });
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    checkVersionAvailability: checkVersionAvailability,
    manifest: manifest,
    packument: packument
});

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * This function locates package.json files for all packages located in `packagesDirectory` in the repository structure.
 */
async function findPathsToPackages(cwd, packagesDirectory, options = {}) {
    const { includePackageJson = false, includeCwd = false, packagesDirectoryFilter = null } = options;
    const packagePaths = await getPackages(cwd, packagesDirectory, includePackageJson);
    if (includeCwd) {
        if (includePackageJson) {
            packagePaths.push(upath.join(cwd, 'package.json'));
        }
        else {
            packagePaths.push(cwd);
        }
    }
    const normalizedPaths = packagePaths.map(item => upath.normalize(item));
    if (packagesDirectoryFilter) {
        return normalizedPaths.filter(item => packagesDirectoryFilter(item));
    }
    return normalizedPaths;
}
async function getPackages(cwd, packagesDirectory, includePackageJson) {
    if (!packagesDirectory) {
        return Promise.resolve([]);
    }
    const globOptions = {
        cwd: upath.join(cwd, packagesDirectory),
        absolute: true
    };
    let pattern = '*/';
    if (includePackageJson) {
        pattern += 'package.json';
        globOptions.nodir = true;
    }
    const paths = await glob(pattern, globOptions);
    return paths.map(path => upath.normalize(path));
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * Reads and returns the contents of the package.json file.
 */
function getPackageJson(cwd = process.cwd(), { async = false } = {}) {
    const path = upath.join(cwd, 'package.json');
    if (async) {
        return readFile(path, 'utf-8').then(data => JSON.parse(data));
    }
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data);
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/**
 * This function extracts the repository URL for generating links in the changelog.
 */
function getRepositoryUrl(cwd, { async = false } = {}) {
    if (!async) {
        const packageJson = getPackageJson(cwd);
        return findRepositoryUrl(packageJson);
    }
    return getPackageJson(cwd, { async: true }).then(findRepositoryUrl);
}
function findRepositoryUrl(packageJson) {
    // Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
    // We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
    // Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
    let repositoryUrl = (typeof packageJson.repository === 'object') ? packageJson.repository.url : packageJson.repository;
    if (!repositoryUrl) {
        throw new Error(`The package.json for "${packageJson.name}" must contain the "repository" property.`);
    }
    if (repositoryUrl.startsWith('git+')) {
        repositoryUrl = repositoryUrl.slice(4);
    }
    const match = repositoryUrl.match(/^(?:https?:\/\/|git@)github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s]+?)(?:\.git)?(?:[/?#].*)?$/);
    if (match) {
        const { owner, repo } = match.groups;
        return `https://github.com/${owner}/${repo}`;
    }
    // Short notation: `owner/repo`.
    if (/^[^/\s]+\/[^/\s]+$/.test(repositoryUrl)) {
        return `https://github.com/${repositoryUrl}`;
    }
    throw new Error(`The repository URL "${repositoryUrl}" is not supported.`);
}

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    findPathsToPackages: findPathsToPackages,
    getPackageJson: getPackageJson,
    getRepositoryUrl: getRepositoryUrl
});

export { index$4 as builds, index$7 as bundler, index$5 as loaders, logger, index$1 as npm, index$3 as stream, index$6 as styles, index$2 as tools, index as workspaces };
