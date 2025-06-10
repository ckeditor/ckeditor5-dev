CKEditor 5 Changelog
====================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-changelog.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

A development tool for handling the changelog preparation in CKEditor 5.

## Installation

Install the package to use it.

```
npm i --save-dev @ckeditor/ckeditor5-dev-changelog
```

## API

This package provides a command-line interface (CLI) and a JavaScript API for generating changelogs.

### Binary scripts

The `ckeditor5-dev-changelog-create-entry` script allows you to create a new changelog entry. By default, it will be created in the
`.changelog/` directory.

### JavaScript API

The JavaScript/TypeScript API can be used as follows:

```ts
import { generateChangelogForMonoRepository, generateChangelogForSingleRepository } from '@ckeditor/ckeditor5-dev-changelog';

await generateChangelogForMonoRepository( { /* options */ } );
await generateChangelogForSingleRepository( { /* options */ } );
```

Review the types to see the available options.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-changelog/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about
the license, please check the `LICENSE.md` file.
