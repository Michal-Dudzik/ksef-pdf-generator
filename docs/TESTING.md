# Testing Guide

## Overview

This project includes comprehensive unit and integration tests to ensure the PDF generator works correctly.

## Test Types

### Unit Tests

Tests individual functions and components in isolation.

```bash
npm run test:unit
```

### Integration Tests

Tests the complete CLI application end-to-end.

```bash
npm run test:integration
```

### Run All Tests

```bash
npm test
```

## Choosing Test Mode for Integration Tests

By default, integration tests automatically detect which mode to use:

1. **Standalone EXE** (if `bin/ksef-pdf-generator.exe` exists) - preferred
2. **Node CLI** (if `dist/cli.cjs` exists) - fallback

### Force a Specific Test Mode

You can force tests to run in a specific mode using the `TEST_MODE` environment variable:

#### **Windows (PowerShell)**

```powershell
# Force Node CLI mode
$env:TEST_MODE="node"; npm run test:integration

# Force EXE mode
$env:TEST_MODE="exe"; npm run test:integration
```

#### **Windows (Command Prompt)**

```cmd
# Force Node CLI mode
set TEST_MODE=node && npm run test:integration

# Force EXE mode
set TEST_MODE=exe && npm run test:integration
```

#### **Unix/Linux/macOS**

```bash
# Force Node CLI mode
TEST_MODE=node npm run test:integration

# Force EXE mode
TEST_MODE=exe npm run test:integration
```

### Using Helper Scripts

Convenience scripts are provided for easier test mode selection:

#### **Windows**

```cmd
scripts\test-integration-node.bat
scripts\test-integration-exe.bat
```

#### **Unix/Linux/macOS**

```bash
./scripts/test-integration-node.sh
./scripts/test-integration-exe.sh
```

## Test Coverage

View test coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## CI/CD Testing

GitHub Actions workflows automatically run both unit and integration tests:

- **Test Workflow** (`.github/workflows/test.yml`) - Runs on every push
- **Release Workflow** (`.github/workflows/release.yml`) - Runs before creating releases

Integration tests in CI use **Node CLI mode** since the standalone executable is only built during releases.

## Test Mode Benefits

### When to use Node CLI mode (`TEST_MODE=node`)

- ✅ Faster - no need to build standalone executable
- ✅ Better for development and CI/CD
- ✅ Easier debugging with source maps
- ✅ Works on all platforms

### When to use EXE mode (`TEST_MODE=exe`)

- ✅ Tests the actual release artifact
- ✅ Validates standalone executable works correctly
- ✅ Tests SEA (Single Executable Application) packaging
- ⚠️ Requires building the exe first

## Troubleshooting

### "Executable not found" error

**In Node mode:**

```bash
npm run build
```

**In EXE mode:**

```bash
scripts\build-standalone-win.bat
```

### Tests pass locally but fail in CI

This usually indicates an environment-specific issue:

- Check timezone settings (tests use `Europe/Warsaw`)
- Verify file paths are cross-platform compatible
- Ensure no absolute paths are hardcoded
