#!/usr/bin/env bash

npm run lint && \
node_modules/.bin/ckeditor5-dev-tests-check-dependencies && \
node_modules/.bin/ckeditor5-dev-tests --coverage --reporter=dots
