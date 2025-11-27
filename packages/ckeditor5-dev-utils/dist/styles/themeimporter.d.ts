/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { type Plugin } from 'postcss';
type ThemeImporterOptions = {
    /**
     * The path to any file belonging to the theme as resolved by `require.resolve()`.
     * E.g.
     *
     *	{
     *		...
     *		themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' ),
     *		...
     *	}
     */
    themePath?: string;
    /**
     * When `true` it enables debug logs in the console.
     */
    debug?: boolean;
};
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
declare function themeImporter(pluginOptions?: ThemeImporterOptions): Plugin;
declare namespace themeImporter {
    var postcss: boolean;
}
export default themeImporter;
