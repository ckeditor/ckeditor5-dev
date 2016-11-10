CKEditor 5 Development Utilities Library
========================================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-utils.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)
[![Build Status](https://travis-ci.org/ckeditor/ckeditor5-dev-utils.svg?branch=master)](https://travis-ci.org/ckeditor/ckeditor5-dev-utils)
[![Test Coverage](https://codeclimate.com/github/ckeditor/ckeditor5-dev-utils/badges/coverage.svg)](https://codeclimate.com/github/ckeditor/ckeditor5-dev-utils/coverage)
[![Code Climate](https://codeclimate.com/github/ckeditor/ckeditor5-dev-utils/badges/gpa.svg)](https://codeclimate.com/github/ckeditor/ckeditor5-dev-utils)
[![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-utils/status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-utils#info=dependencies)
[![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev-utils/dev-status.svg)](https://david-dm.org/ckeditor/ckeditor5-dev-utils#info=devDependencies)

Utils for [CKEditor 5](https://ckeditor5.github.io) dev code (such as Gulp tasks). More information about the project can be found at the following url: <https://github.com/ckeditor/ckeditor5-dev-utils>.

## Available modules

This module exports a few modules but not all are described at this moment.

### Logger

Logger module which allows configuring the verbosity level.

There are three levels of verbosity:
 
1. `info` - all messages will be logged,
2. `warning` - warning and errors will be logged,
3. `error` - only errors will be logged.

Usage:
 
```js
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger;

const infoLog = logger( 'info ');
infoLog.info( 'Info alert.' ); // This message will be always displayed.
infoLog.warning( 'Warning alert.' ); // This message will be always displayed.
infoLog.error( 'Error alert.' ); // This message will be always displayed.

const warningLog = logger( 'warning' );
warningLog.info( 'Info alert.' ); // This message won't be displayed.
warningLog.warning( 'Warning alert.' ); // This message will be always displayed.
warningLog.error( 'Error alert.' ); // This message will be always displayed.

const errorLog = logger( 'error' );
errorLog.info( 'Info alert.'); // This message won't be displayed.
errorLog.warning( 'Warning alert.'); // This message won't be displayed.
errorLog.error( 'Error alert.' ); // This message will be always displayed.
```

## Testing

Tests:

```
npm test
```

Code coverage:

```
npm run coverage
```

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
