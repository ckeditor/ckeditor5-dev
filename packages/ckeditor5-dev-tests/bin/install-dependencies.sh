#!/usr/bin/env bash

set -e

npm install mgit2 lerna@^2.0.0-rc.1 codeclimate-test-reporter eslint-config-ckeditor5

node_modules/.bin/ckeditor5-dev-tests-create-mgit-json
node_modules/.bin/ckeditor5-dev-tests-create-lerna-json

mgit bootstrap --recursive --resolver-path=@ckeditor/ckeditor5-dev-tests/lib/mgit-resolver.js

# We need to ignore the newly created packages dir with all its content (see #203).
echo -e "\npackages/**\n" >> .gitignore

lerna init
lerna bootstrap
