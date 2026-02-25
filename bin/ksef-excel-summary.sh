#!/usr/bin/env bash

# KSeF Excel Summary Generator - Unix Wrapper Script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to project root (one level up from bin)
cd "$SCRIPT_DIR/.." || exit 1

# Check if dist/excel-summary.cjs exists
if [ ! -f "dist/excel-summary.cjs" ]; then
    echo "Error: excel-summary.cjs not found. Please run 'npm run build' first."
    exit 1
fi

# Run the CLI with all provided arguments
node dist/excel-summary.cjs "$@"
