CKEditor 5 translation tools
============================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-translations.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

Tools for managing [CKEditor 5](https://ckeditor.com) translation files.

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

The package exposes the following functions:

* `findMessages()` — parses a source file and finds messages to be localized, that is calls of the `t()` function.
* `synchronizeTranslations()` — synchronizes translation files (`*.po` files) with translation contexts (`context.json` files) in the given packages: it creates missing translation files, adds missing entries, and removes unused ones.
* `moveTranslations()` — moves the requested translations (context and `*.po` entries) between packages.

You can read more about localizing the editor in the [Setting the UI language](https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/ui-language.html) guide.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-translations/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
