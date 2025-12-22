# KSeF PDF Generator - CLI Tool

[![Download Latest](https://img.shields.io/github/v/release/Michal-Dudzik/ksef-pdf-generator?label=Download%20Latest&style=for-the-badge&logo=github)](https://github.com/Michal-Dudzik/ksef-pdf-generator/releases/latest)

A command-line tool for generating PDF visualizations of KSeF invoices and UPO documents from XML files.

## Table of Contents

- [Installation Options](#installation-options)
- [Quick Start](#quick-start)
- [Command Line Options](#command-line-options)
- [Logging](#persistent-session-logging)
- [Development](#development)
- [Building Standalone Executables](#building-standalone-executables)
- [Automated Releases & Distribution](#automated-releases--distribution)
- [Backend Integration](#backend-integration)
- [Testing Your Installation](#testing-your-installation)
- [Troubleshooting](#troubleshooting)

---

## Installation Options

### Option 1: Standalone Executable (Recommended for Production)

The standalone executable includes Node.js runtime and all dependencies bundled together.

Uses **Node.js Single Executable Applications (SEA)** - the official built-in feature for creating standalone executables.

#### Download from GitHub Releases (Recommended)

1. Go to [Releases](https://github.com/Michal-Dudzik/ksef-pdf-generator/releases/latest)
2. Download `ksef-pdf-generator-ver-X.X.X.exe` from the latest release
3. Use it directly (no installation required):

```batch
ksef-pdf-generator-ver-0.0.38.exe -i invoice.xml -o invoice.pdf -t invoice
```

#### Or Build from Source

If you cloned this repository:

1. Download `bin/ksef-pdf-generator.exe` from the repository
2. Use it directly:

```batch
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice
```

---

### Option 2: Standard Installation (For Development)

**Requires Node.js 22.14.0 or higher**

#### Windows Users

Run the setup script:

```batch
scripts\setup.bat
```

#### Linux/Mac Users

Run the setup script:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

#### Alternative (All Platforms)

You can also use npm:

```bash
npm install
npm run build
```

---

## Quick Start

### Using Standalone Executable (Windows Only)

```batch
# Generate Invoice PDF
bin\ksef-pdf-generator.exe -i assets\invoice.xml -o invoice.pdf -t invoice

# Generate Invoice PDF with KSeF Data (online)
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --nrKSeF "5265877635-20250808-9231003CA67B-BE" ^
  --qrCode1 "https://ksef-test.mf.gov.pl/client-app/invoice/..."

# Generate Offline Invoice PDF with Certificate QR Code
bin\ksef-pdf-generator.exe -i invoice.xml -o invoice.pdf -t invoice ^
  --nrKSeF "OFFLINE" ^
  --qrCode1 "offline-qr-code-data" ^
  --qrCode2 "certificate-qr-code-data"

# Generate UPO PDF
bin\ksef-pdf-generator.exe -i assets\upo.xml -o upo.pdf -t upo
```

### Using Node.js (Development)

```bash
# Generate Invoice PDF
node dist/cli.cjs --input assets/invoice.xml --output invoice.pdf --type invoice

# Using batch/shell script wrappers
bin\ksef-pdf-generator.bat -i assets\invoice.xml -o invoice.pdf -t invoice  # Windows
./bin/ksef-pdf-generator.sh -i assets/invoice.xml -o invoice.pdf -t invoice # Linux/Mac
```

---

## Command Line Options

### Required Arguments

- `--input` / `-i` - Path to input XML file
- `--output` / `-o` - Path where PDF will be saved
- `--type` / `-t` - Document type: `invoice` or `upo`

### Optional Arguments (for invoices only)

- `--nrKSeF` - KSeF number for the invoice (use "OFFLINE" for offline invoices)
- `--qrCode1` - QR code data for the first QR code
- `--qrCode2` - QR code data for the second QR code (shown below the first with label "certyfikat")

### Utility Commands

- `--help` - Display help information
- `--version` - Show version information
- `--verbose` - Enable verbose output

### Diagnostic Commands

For troubleshooting and system diagnostics:

- Windows: `scripts\diagnose.bat`
- Linux: `scripts/diagnose.sh`

---

## Development

### Modifying PDF Generation

To customize PDF generation, edit files in `src/lib-public/` and `src/shared/`:

**Example: Change Invoice Header**

Edit `src/lib-public/generators/common/Naglowek.ts` to modify the invoice header section.

**Example: Modify Table Styling**

Edit `src/shared/PDF-functions.ts` to change table layouts, fonts, or colors.

**Example: Add New Field**

1. Add the field to the appropriate type in `src/lib-public/types/`
2. Update the generator in `src/lib-public/generators/`
3. Rebuild with `npm run build`

### Testing Changes

After modifying the source:

```bash
# Build and test
npm run build
npm run cli -- --input assets/invoice.xml --output test.pdf --type invoice

# Or build standalone and test
scripts\build-standalone-win.bat
bin\ksef-pdf-generator.exe -i assets\invoice.xml -o test.pdf -t invoice
```

---

## Building Standalone Executables

### Prerequisites

You need Node.js **22.14.0 or higher** installed on your **build machine** only. The resulting executable won't require Node.js.

### Building for Windows

Run the build script:

```batch
scripts\build-standalone-win.bat
```

---

## Automated Releases & Distribution

This project uses **GitHub Actions** to automatically build and distribute releases.

### Creating a New Release

#### Method 1: Using npm version (Recommended)

```bash
# Make your changes and commit them
git add .
git commit -m "Add new feature"
git push

# Bump version and create tag
npm version patch  # 0.0.37 → 0.0.38 (for bug fixes)
npm version minor  # 0.0.37 → 0.1.0 (for new features)
npm version major  # 0.0.37 → 1.0.0 (for breaking changes)

# Push the tag (this triggers the release workflow)
git push --follow-tags

# Done! Check GitHub Actions for build progress
```

#### Method 2: Manual Tag Creation

```bash
# Create and push a tag
git tag -a v0.0.38 -m "Release version 0.0.38"
git push origin v0.0.38
```

#### Method 3: Manual Trigger from GitHub

1. Go to your repository on GitHub
2. Click **"Actions"** tab
3. Select **"Build and Release"** workflow
4. Click **"Run workflow"** button
5. Select branch and click **"Run workflow"**

### Downloading Releases

#### For End Users

```
https://github.com/Michal-Dudzik/ksef-pdf-generator/releases/latest
```

### What's Included in Each Release

Every GitHub Release contains:

- **Executable File**: `ksef-pdf-generator-ver-X.X.X.exe`
- **Release Notes**: Automatically generated with:
  - Version number
  - Installation instructions
  - Usage examples
  - Supported document types
  - Build information
  - Link to commit history

---

## Backend Integration

### Using Standalone Executable (Recommended)

The standalone executable can be called from any backend without Node.js:

#### Node.js

```javascript
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

async function generatePDF(inputPath, outputPath, type, options = {}) {
  // Use standalone executable (Windows only)
  let command = `./bin/ksef-pdf-generator.exe --input ${inputPath} --output ${outputPath} --type ${type}`;

  if (options.nrKSeF) {
    command += ` --nrKSeF "${options.nrKSeF}"`;
  }
  if (options.qrCode) {
    command += ` --qrCode "${options.qrCode}"`;
  }

  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(stdout);
    return true;
  } catch (error) {
    console.error(error.stderr);
    return false;
  }
}

// Usage
await generatePDF("assets/invoice.xml", "output/invoice.pdf", "invoice", {
  nrKSeF: "5265877635-20250808-9231003CA67B-BE",
  qrCode: "https://ksef-test.mf.gov.pl/...",
});
```

#### C# (.NET)

```csharp
using System.Diagnostics;

public class KSefPdfGenerator
{
    private readonly string _executablePath;

    public KSefPdfGenerator(string executablePath)
    {
        _executablePath = executablePath; // Path to bin/ksef-pdf-generator.exe
    }

    public async Task<bool> GeneratePdfAsync(
        string inputPath,
        string outputPath,
        string type,
        string? nrKSeF = null,
        string? qrCode = null)
    {
        var arguments = $"--input \"{inputPath}\" --output \"{outputPath}\" --type {type}";

        if (!string.IsNullOrEmpty(nrKSeF))
        {
            arguments += $" --nrKSeF \"{nrKSeF}\"";
        }

        if (!string.IsNullOrEmpty(qrCode))
        {
            arguments += $" --qrCode \"{qrCode}\"";
        }

        var processStartInfo = new ProcessStartInfo
        {
            FileName = _executablePath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        try
        {
            using var process = Process.Start(processStartInfo);
            if (process == null)
            {
                Console.WriteLine("Failed to start process");
                return false;
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (process.ExitCode == 0)
            {
                Console.WriteLine(output);
                return true;
            }
            else
            {
                Console.WriteLine($"Error: {error}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception: {ex.Message}");
            return false;
        }
    }
}

// Usage
var generator = new KSefPdfGenerator("C:\\path\\to\\bin\\ksef-pdf-generator.exe");
await generator.GeneratePdfAsync(
    "assets/invoice.xml",
    "output/invoice.pdf",
    "invoice",
    nrKSeF: "5265877635-20250808-9231003CA67B-BE",
    qrCode: "https://ksef-test.mf.gov.pl/..."
);
```

---

## Testing Your Installation

### Test 1: Help Command

```batch
bin\ksef-pdf-generator.exe --help
```

Should display help information.

### Test 2: Version Check

```batch
bin\ksef-pdf-generator.exe --version
```

Should show version information.

### Test 3: Diagnostics

```batch
scripts\diagnose.bat
```

Should run all diagnostic checks, verify dependencies, and test PDF generation.

### Test 4: Generate Test PDF

Using the example files:

```batch
# For invoice
bin\ksef-pdf-generator.exe -i assets\invoice.xml -o test_invoice.pdf -t invoice

# For UPO
bin\ksef-pdf-generator.exe -i assets\upo.xml -o test_upo.pdf -t upo
```

---

## Troubleshooting

### Quick Diagnostic

If you're experiencing issues, run the diagnostic script:

```batch
scripts\diagnose.bat
```

This will check:

- Node.js installation (if applicable)
- npm installation (if applicable)
- Project files
- Built files
- Dependencies
- File permissions
- Execution capabilities

The diagnostic will create a `diagnostics.log` file with detailed information.

### Verbose Logging

For detailed error information:

```batch
set KSEF_VERBOSE=1
set KSEF_LOG_FILE=debug.log
bin\ksef-pdf-generator.exe -i input.xml -o output.pdf -t invoice --verbose
```

### Persistent Session Logging

The application automatically logs all operations to daily log files. This feature is **enabled by default**

**Log Location:**

Logs are created in a `logs/` folder:

- **Standalone exe**: Next to the `.exe` file → `logs/ksef-generator-2025-12.log`
- **Development**: In the project directory → `logs/ksef-generator-2025-12.log`

**What Gets Logged:**

Each session records:

- Session ID, start/end times, duration, status (SUCCESS/FAILED)
- Document type, input/output files
- All parameters (nrKSeF, QR codes, etc.)
- Full command for easy replay
- Error details if operation failed

**Configuration:**

```batch
# Disable logging
set KSEF_PERSISTENT_LOG=0

# Custom log directory
set KSEF_LOG_DIR=C:\custom\path\logs

# On Linux/Mac
export KSEF_LOG_DIR=/var/log/ksef
```

**Example Log:**

```
{
    Nr: 1
    Status: SUCCESS
    Operation Time: 15:17:28 - 15:17:28 (0.53s)

    Parameters: {"input": "assets/303_inv.xml", "output": "303_inv.pdf", "type": "invoice", "nrKSeF": null, "qrCode1": null, "qrCode2": null}

    Full command: ksef-pdf-generator --input assets/303_inv.xml --output 303_inv.pdf --type invoice
}
```

---

### Common Issues and Solutions

#### Issue 1: Standalone Executable doesn't run

**Symptoms:**

- Double-clicking the .exe does nothing
- No error message appears
- Command prompt opens and closes immediately

**Solutions:**

**A. Unblock the file (Windows):**

1. Right-click on `ksef-pdf-generator.exe`
2. Select "Properties"
3. Check if there's a message "This file came from another computer..."
4. Click "Unblock" checkbox
5. Click "OK"

**B. Install Visual C++ Redistributables (Windows):**

The executable requires Visual C++ runtime libraries.

**C. Antivirus/Security Software:**

Some antivirus software blocks unsigned executables.

1. Check your antivirus quarantine
2. Add an exception for `ksef-pdf-generator.exe`
3. Contact your IT administrator if on a corporate network

**D. Test from Command Line:**

Run from Command Prompt to see errors:

```batch
cd path\to\ksef-pdf-generator
bin\ksef-pdf-generator.exe --help
```

---

#### Issue 2: "Node.js is not installed or not in PATH"

**Symptoms:**

- setup.bat fails immediately
- ksef-pdf-generator.bat doesn't work
- Error message about Node.js not found

**Solution:**

1. Install Node.js from https://nodejs.org/ (version 22.14.0 or higher recommended)
2. Make sure Node.js is added to PATH during installation
3. After installation, open a **new** command prompt and verify:

```batch
node --version
npm --version
```

**Alternative:** Use the standalone executable `bin/ksef-pdf-generator.exe` which doesn't require Node.js

---

#### Issue 3: "npm install fails"

**Symptoms:**

- setup.bat fails during "Installing dependencies"
- Error messages about network, permissions, or packages

**Solutions:**

**A. Network/Proxy Issues:**

If behind a corporate proxy:

```batch
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

**B. Permission Issues:**

Run as Administrator:

1. Right-click on `scripts/setup.bat`
2. Select "Run as administrator"

**C. Clear npm cache:**

```batch
npm cache clean --force
```

Then run `scripts/setup.bat` again.

---

#### Issue 4: "Build fails" (npm run build error)

**Symptoms:**

- npm install succeeds
- Build step fails
- setup.log shows TypeScript or build errors

**Solution:**

1. Make sure you have the latest code
2. Delete `node_modules` and try again:

```batch
rmdir /s /q node_modules
del package-lock.json
scripts\setup.bat
```

---

#### Issue 5: "The tool runs but produces no output"

**Symptoms:**

- Command appears to execute
- No error message
- No PDF file created

**Solutions:**

**A. Check file permissions:**

Make sure the output directory exists and is writable:

```batch
# Create output directory if it doesn't exist
mkdir output

# Test write permission
echo test > output\test.txt
del output\test.txt
```

**B. Run with verbose logging:**

```batch
set KSEF_VERBOSE=1
set KSEF_LOG_FILE=ksef-debug.log
bin\ksef-pdf-generator.exe -i invoice.xml -o output.pdf -t invoice
type ksef-debug.log
```

**C. Run comprehensive diagnostics:**

```batch
scripts\diagnose.bat
```

---

#### Issue 6: "Error: Input file not found"

**Symptoms:**

- Tool runs but complains about missing input file

**Solutions:**

1. **Use absolute paths:**

```batch
bin\ksef-pdf-generator.exe -i C:\full\path\to\invoice.xml -o C:\full\path\to\output.pdf -t invoice
```

2. **Check current directory:**

```batch
cd
dir invoice.xml
```

3. **Make sure the file exists and has the correct name**

---

#### Issue 7: Windows Build Issues

**Symptoms:**

- "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 not found"
- postject fails

**Solution:**

Make sure you're using Node.js 22.14.0 or higher:

```batch
node --version
```

If the version is lower, upgrade Node.js.

**"postject not found":**

The build script uses `npx postject` which should install it automatically. If it fails, install manually:

```batch
npm install -g postject
```

**"signtool not found" and "signature seems corrupted" warnings:**

During standalone build, you may see these warnings:

- `Note: signtool not found, skipping signature removal`
- `warning: The signature seems corrupted!`

**What this means:**

- The Node.js binary comes with a digital signature
- When injecting your app, this signature becomes invalid
- `signtool` (from Windows SDK) should remove it first to prevent warnings

**Impact:**

- The executable **works perfectly fine**
- May trigger Windows SmartScreen warnings
- Some antivirus software may be more suspicious

**Solutions:**

1. **For internal/development use:** Ignore the warnings - the executable works fine

2. **For distribution:** Install Windows SDK to get `signtool`:
   - Download from: https://developer.microsoft.com/windows/downloads/windows-sdk/
   - The build script will auto-detect it in common locations
3. **For professional distribution:** Sign the executable with your own code signing certificate:
   ```batch
   signtool sign /f your-certificate.pfx /p password bin\ksef-pdf-generator.exe
   ```

---

### Server Deployment Checklist

For system administrators deploying to production servers:

**Using Standalone Executable (Windows only):**

- [ ] Windows Server 2012 R2 or later
- [ ] Visual C++ Redistributables installed
- [ ] Write permissions in working directory
- [ ] Execution policy allows running .exe files
- [ ] No antivirus blocking the executable

**Using Node.js Installation (All platforms):**

- [ ] Node.js 22.14.0+ installed
- [ ] npm accessible from PATH
- [ ] Write permissions in working directory
- [ ] Network access for npm (if building from source)

---
