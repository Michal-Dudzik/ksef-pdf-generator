#!/bin/bash

# Change to project root directory (parent of scripts/)
cd "$(dirname "$0")/.."

echo "========================================"
echo "KSeF PDF Generator - Setup"
echo "========================================"
echo
echo "Working directory: $(pwd)"
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo "Minimum required version: 18.x or higher"
    exit 1
fi

# Display Node.js and npm versions
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    echo "Make sure you're running this from the project root directory"
    exit 1
fi

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Failed to install dependencies"
    echo "Make sure Node.js is installed"
    exit 1
fi

echo
echo "Building CLI tool..."
npm run build
if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Failed to build CLI"
    exit 1
fi

echo
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo
echo "You can now use the tool:"
echo "  node dist/cli.cjs --help"
echo
echo "Or use the wrapper script:"
echo "  ./bin/ksef-pdf-generator.sh -i input.xml -o output.pdf -t invoice"
echo

