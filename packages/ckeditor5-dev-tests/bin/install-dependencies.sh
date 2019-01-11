#!/usr/bin/env bash

set -e

NPM_BIN=$(pwd)/node_modules/.bin

yarn add mgit2

# Creates an `mgit.json` file.
$NPM_BIN/ckeditor5-dev-tests-create-mgit-json

# Adds a workspace definition to `package.json` (used by Yarn).
$NPM_BIN/ckeditor5-dev-tests-add-workspace-to-package-json

# Clones repositories to `packages/` directory.
$NPM_BIN/mgit sync --recursive --resolver-path=$(pwd)/node_modules/@ckeditor/ckeditor5-dev-tests/lib/mgit-resolver.js

# We need to ignore the newly created packages dir with all its content (see #203).
echo -e "\npackages/**\n" >> .gitignore

yarn install
