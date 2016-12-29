#!/bin/sh
set -e

TEST_DIRS=""

for f in packages/*; do
  if [ -d "$f/tests" ]; then
    TEST_DIRS="$f/tests $TEST_DIRS"
  fi
done

echo $TEST_DIRS
