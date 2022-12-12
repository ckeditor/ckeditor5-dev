CKEditor 5 development environment tasks
========================================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-transifex.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex)
[![Build Status](https://travis-ci.com/ckeditor/ckeditor5-dev.svg?branch=master)](https://app.travis-ci.com/github/ckeditor/ckeditor5-dev)
![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-transifex)

Tasks used during development of [CKEditor 5](https://ckeditor.com).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Translation tools

Available tasks:
- `collect` - Collects translation strings ( from `t()` calls ) and stores them in ckeditor5/build/.transifex directory.
- `upload` - Uploads translations to the Transifex from collected files.
- `download` - Downloads translations from the Transifex for each package and language.

### Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-transifex
```

Then use `ckeditor5-dev-transifex-translations` command:

```
# directly from command line:
node ./node_modules/bin/ckeditor5-dev-transifex-translations collect

# using npx:
npx ckeditor5-dev-transifex-translations collect
```

Or add to `package.json` scripts:

```
{
  "scripts": {
    "translations:collect": "ckeditor5-dev-transifex-translations collect",
    "translations:download": "ckeditor5-dev-transifex-translations download",
    "translations:upload": "ckeditor5-dev-transifex-translations upload"
  }
}
```

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-transifex/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
