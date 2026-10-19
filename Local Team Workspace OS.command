#!/bin/sh
# Uses the established local app data; does not replace the installed app.
set -eu
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export WOS_LOCAL_TEAM=1
cd "$(dirname "$0")"
exec sh scripts/liam-ada/launch.sh "$@"
