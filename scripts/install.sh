#!/bin/sh
set -eu
project_directory=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
install_prefix=${1:-"$HOME/.local"}
command -v node >/dev/null 2>&1 || { echo "Install Node.js 22 or newer first." >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) process.exit(1)' || { echo "Node.js 22 or newer is required." >&2; exit 1; }
npm install --global --prefix "$install_prefix" --offline --ignore-scripts --no-audit --no-fund "$project_directory"
printf '%s\n' "Registered Driftline from this checkout. Keep the checkout in place."
printf '%s\n' "Run: $install_prefix/bin/driftline check"
printf '%s\n' "Remove registration: npm uninstall --global --prefix \"$install_prefix\" driftline"
