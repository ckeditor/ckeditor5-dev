#!/usr/bin/env bash

node_modules/.bin/gulp lint && \
node_modules/.bin/ckeditor5-dev-tests --coverage --ignore-duplicates --reporter=dots && \
sed -i.backup 's/build\/\.automated-tests\/ckeditor5\/[^\/]*/src/g' build/.automated-tests/coverage/lcov.info
