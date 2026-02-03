#!/bin/bash
# KSeF PDF Generator CLI - Unix/Linux Shell Script

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo "Minimum required version: 18.x or higher"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if dist/cli.cjs exists
if [ ! -f "$SCRIPT_DIR/../dist/cli.cjs" ]; then
    echo "ERROR: CLI tool not built yet"
    echo ""
    echo "Please run the setup script first to build the tool:"
    echo "  cd $SCRIPT_DIR/.."
    echo "  ./scripts/setup.sh"
    echo ""
    echo "Or install dependencies and build manually:"
    echo "  npm install"
    echo "  npm run build"
    exit 1
fi

node "$SCRIPT_DIR/../dist/cli.cjs" "$@"
exit $?

