#!/bin/sh
# Double-click this file to open the local build with the Liam–Ada integration.
set -eu
cd "$(dirname "$0")"
exec sh scripts/liam-ada/launch.sh "$@"
