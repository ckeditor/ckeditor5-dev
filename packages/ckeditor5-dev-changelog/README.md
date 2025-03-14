CKEditor 5 Changelog
====================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-build-tools.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

A development tool for handling changelogs in CKEditor 5.

## API

This package can be used as a CLI tool or via the JavaScript API.

### CLI

The CLI tool can be used as follows:

```bash
npx @ckeditor/ckeditor5-changelog
```

### JavaScript API

The JavaScript API can be used as follows:

```javascript
import { generateChangelog } from '@ckeditor/ckeditor5-dev-changelog';

generateChangelog();
```

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-bump-year/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
