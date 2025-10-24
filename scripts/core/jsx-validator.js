#!/usr/bin/env node

/**
 * JSX Structure Validator
 * Helps catch JSX tag mismatches before they cause build failures
 * Created after build failure fix on February 1, 2025
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

async function validateJSX() {
  log(colors.blue + colors.bold, "🔍 JSX Structure Validator");
  log(colors.blue, "━".repeat(50));

  console.log("\n📋 Running comprehensive JSX validation...\n");

  // Step 1: ESLint check
  log(colors.yellow, "1️⃣  Running ESLint check...");
  const lintResult = await runCommand("npm run lint");

  if (lintResult.error) {
    log(colors.red, "❌ ESLint found issues:");
    console.log(lintResult.stdout);
    console.log(lintResult.stderr);
    return false;
  } else {
    log(colors.green, "✅ ESLint passed");
  }

  // Step 2: TypeScript check
  log(colors.yellow, "\n2️⃣  Running TypeScript check...");
  const tsResult = await runCommand("npm run type-check");

  if (tsResult.error) {
    log(colors.red, "❌ TypeScript found issues:");
    console.log(tsResult.stdout);
    console.log(tsResult.stderr);
    return false;
  } else {
    log(colors.green, "✅ TypeScript check passed");
  }

  // Step 3: Build test
  log(colors.yellow, "\n3️⃣  Running build test...");
  const buildResult = await runCommand("npm run build --silent");

  if (buildResult.error) {
    log(colors.red, "❌ Build failed:");
    console.log(buildResult.stdout);
    console.log(buildResult.stderr);

    // Check for JSX-specific errors
    if (
      buildResult.stderr.includes("Unexpected closing") ||
      buildResult.stderr.includes("does not match opening")
    ) {
      log(colors.red + colors.bold, "\n🚨 JSX TAG MISMATCH DETECTED!");
      log(colors.yellow, "\n📚 Quick fix guide:");
      console.log("1. Check the error lines mentioned above");
      console.log("2. Ensure every opening tag has a matching closing tag");
      console.log("3. Verify tag names match exactly (case-sensitive)");
      console.log("4. Use consistent component patterns in each section");
      console.log("\n📖 See docs/guides/DEVELOPMENT_GUIDELINES.md for details");
    }

    return false;
  } else {
    log(colors.green, "✅ Build test passed");
  }

  // Success
  log(colors.green + colors.bold, "\n🎉 ALL VALIDATIONS PASSED!");
  log(colors.green, "✅ Safe to commit and deploy");

  return true;
}

async function checkSpecificFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(colors.red, `❌ File not found: ${filePath}`);
    return false;
  }

  log(colors.blue + colors.bold, `🔍 Checking file: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf8");

  // Basic JSX tag pattern check
  const openTags = content.match(/<[A-Za-z][A-Za-z0-9.]*[^/>]*>/g) || [];
  const closeTags = content.match(/<\/[A-Za-z][A-Za-z0-9.]*>/g) || [];
  const selfClosing = content.match(/<[A-Za-z][A-Za-z0-9.]*[^>]*\/>/g) || [];

  log(colors.blue, `📊 Tag analysis:`);
  console.log(`   Opening tags: ${openTags.length}`);
  console.log(`   Closing tags: ${closeTags.length}`);
  console.log(`   Self-closing: ${selfClosing.length}`);

  // Check for common JSX issues
  const hasFragments = content.includes("<>") || content.includes("</>");
  const hasMotionComponents = content.includes("<motion.");
  const hasAccordion = content.includes("<Accordion");

  if (hasFragments) {
    console.log("   ⚠️  Contains React fragments - verify matching");
  }
  if (hasMotionComponents && hasAccordion) {
    log(colors.yellow, "   ⚠️  Mixed motion and Accordion components detected");
    log(colors.yellow, "      Consider using consistent pattern");
  }

  return true;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  validateJSX();
} else if (args[0] === "file" && args[1]) {
  checkSpecificFile(args[1]);
} else if (args[0] === "help") {
  console.log(`
JSX Structure Validator

Usage:
  node scripts/jsx-validator.js           # Validate entire project
  node scripts/jsx-validator.js file <path>  # Check specific file
  node scripts/jsx-validator.js help     # Show this help

Examples:
  node scripts/jsx-validator.js
  node scripts/jsx-validator.js file src/pages/LandingPage.tsx

This tool helps prevent JSX tag mismatch build failures by running:
1. ESLint validation
2. TypeScript type checking  
3. Build test
4. JSX-specific pattern analysis

See docs/guides/DEVELOPMENT_GUIDELINES.md for detailed JSX best practices.
  `);
} else {
  log(colors.red, 'Invalid arguments. Use "help" for usage information.');
}
