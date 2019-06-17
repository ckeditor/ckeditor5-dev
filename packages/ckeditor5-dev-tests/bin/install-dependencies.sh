#!/usr/bin/env bash

set -e

# Current work directory.
PACKAGE_ROOT=$(pwd)

# Path to the executable in CWD.
ROOT_BIN=${PACKAGE_ROOT}/node_modules/.bin

# Path to the testing environment.
TEST_DIR=$(mktemp -d)

# Path to the executable in the testing environment.
TEST_BIN=${TEST_DIR}/node_modules/.bin

# Creates required files for Mgit and Yarn.
echo '{}' > ${TEST_DIR}/package.json
echo '{}' > ${TEST_DIR}/mrgit.json
mkdir ${TEST_DIR}/packages

# Prepare `package.json`. It creates a "temporary" package.
${ROOT_BIN}/ckeditor5-dev-tests-prepare-package-json ${PACKAGE_ROOT} ${TEST_DIR}

# Prepare `mrgit.json`.
${ROOT_BIN}/ckeditor5-dev-tests-prepare-mrgit-json ${TEST_DIR}

# Install Mgit.
cd ${TEST_DIR} && yarn add mrgit --ignore-workspace-root-check

# Clones repositories to `packages/` directory.
cd ${TEST_DIR} && ${TEST_BIN}/mrgit sync --recursive --resolver-path=${PACKAGE_ROOT}/node_modules/@ckeditor/ckeditor5-dev-tests/lib/mrgit-resolver.js

# We need to ignore the newly created packages dir with all its content (see #203).
cd ${TEST_DIR} && echo -e "\npackages/**\n" >> .gitignore

# Dependencies for CKEditor5-like project.
cd ${TEST_DIR} && yarn install

# Be sure that the testing environment path can be available for other scripts...
echo ${TEST_DIR} > ${PACKAGE_ROOT}/.ckeditor5_test_environment

# ...and CWD is set to the proper directory.
cd ${PACKAGE_ROOT}
