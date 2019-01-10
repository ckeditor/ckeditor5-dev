#!/usr/bin/env bash

set -e

npm install -g mgit2

# Creates an `mgit.json` file.
ckeditor5-dev-tests-create-mgit-json

# Adds a workspace definition to `package.json` (used by Yarn).
ckeditor5-dev-tests-add-workspace-to-package-json

# Clones repositories to `packages/` directory.
mgit sync --recursive --resolver-path=@ckeditor/ckeditor5-dev-tests/lib/mgit-resolver.js

# We need to ignore the newly created packages dir with all its content (see #203).
echo -e "\npackages/**\n" >> .gitignore

yarn install
