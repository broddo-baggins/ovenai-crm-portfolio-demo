/**
 * React Context Error Monitor & Prevention Script
 *
 * This script monitors for React context initialization issues and provides
 * automated fixes and alerts to prevent the createContext undefined error.
 *
 * Usage: node scripts/react-context-monitor.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

// React context error patterns to detect
const CONTEXT_ERROR_PATTERNS = [
  // Real production errors (not guard messages)
  /Ze\.createContext.*undefined/i,
  /undefined is not an object.*createContext/i,
  /Cannot read property.*createContext/i,
  // Avoid false positives from our own guards
  /createContext.*undefined/i && !/React Context Guard|module loading issue/i,
];

// Patterns that indicate GOOD protective guards (not errors)
const PROTECTIVE_GUARD_PATTERNS = [
  /React Context Guard/i,
  /module loading issue/i,
  /React createContext is not available/i,
  /throw new Error.*createContext/i,
];

// Files to monitor for React context usage
const CONTEXT_FILES = [
  "src/context/",
  "src/components/",
  "src/hooks/",
  "src/App.tsx",
  "src/main.tsx",
];

// Required guards for context files
const REQUIRED_GUARDS = [
  {
    pattern: /createContext/,
    guard: `// CRITICAL: React Context Guard
if (typeof createContext === 'undefined') {
  throw new Error('[Context] React createContext is not available. This indicates a module loading issue.');
}`,
  },
];

class ReactContextMonitor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(level, message, file = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${file ? ` (${file})` : ""}`;

    console.log(logMessage);

    switch (level) {
      case "error":
        this.errors.push({ message, file, timestamp });
        break;
      case "warning":
        this.warnings.push({ message, file, timestamp });
        break;
      case "fix":
        this.fixes.push({ message, file, timestamp });
        break;
    }
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const relativePath = path.relative(projectRoot, filePath);

      // Check if file has protective guards (GOOD)
      const hasProtectiveGuards = PROTECTIVE_GUARD_PATTERNS.some((pattern) =>
        pattern.test(content),
      );

      // Check for real React context errors (BAD)
      const hasRealErrors =
        content.includes("Ze.createContext") ||
        (content.includes("undefined is not an object") &&
          content.includes("createContext"));

      if (hasRealErrors) {
        this.log(
          "error",
          `Production React context error detected - React not properly loaded`,
          relativePath,
        );
      }

      // Check if file ACTUALLY uses createContext (not just mentions it in strings/comments)
      const actuallyUsesCreateContext =
        content.match(/(?:React\.)?createContext\s*\(/g) || // React.createContext( or createContext(
        content.match(/=\s*createContext\s*</g); // = createContext<

      // Exclude files that only mention createContext in error messages or logs
      const onlyMentionsInStrings =
        content.includes("createContext") &&
        !actuallyUsesCreateContext &&
        (content.includes("'createContext'") ||
          content.includes('"createContext"') ||
          content.includes("message.includes(") ||
          content.includes("console."));

      if (actuallyUsesCreateContext && !onlyMentionsInStrings) {
        // Check for proper React imports
        const hasReactImport =
          content.includes("import React") ||
          content.includes("import * as React") ||
          content.includes('from "react"');

        if (!hasReactImport) {
          this.log(
            "error",
            `File uses createContext without importing React`,
            relativePath,
          );
        }

        // Check if it has protective guards
        if (!hasProtectiveGuards) {
          this.log(
            "warning",
            `File uses createContext but lacks safety guards`,
            relativePath,
          );
          this.log(
            "fix",
            `Add React context guard to prevent initialization errors`,
            relativePath,
          );
        } else {
          // This is GOOD - file has both createContext AND guards
          this.log(
            "info",
            `File properly guarded against context errors`,
            relativePath,
          );
        }
      } else if (onlyMentionsInStrings) {
        // File only mentions createContext in error handling - this is OK
        this.log(
          "info",
          `File mentions createContext only in error handling (safe)`,
          relativePath,
        );
      }
    } catch (error) {
      this.log("error", `Failed to scan file: ${error.message}`, filePath);
    }
  }

  async scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.startsWith(".") &&
          item !== "node_modules"
        ) {
          await this.scanDirectory(fullPath);
        } else if (
          stat.isFile() &&
          (item.endsWith(".tsx") || item.endsWith(".ts"))
        ) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      this.log("error", `Failed to scan directory: ${error.message}`, dirPath);
    }
  }

  checkViteConfig() {
    const viteConfigPath = path.join(projectRoot, "vite.config.ts");

    if (!fs.existsSync(viteConfigPath)) {
      this.log("error", "vite.config.ts not found");
      return;
    }

    const content = fs.readFileSync(viteConfigPath, "utf8");

    // Check for proper React chunking
    if (!content.includes("react-runtime")) {
      this.log("error", "Vite config missing React runtime chunk separation");
      this.log("fix", "Add react-runtime chunk to ensure React loads first");
    }

    // Check for proper reserved names in terser
    if (!content.includes("createContext") || !content.includes("React")) {
      this.log(
        "warning",
        "Terser config may not preserve React function names",
      );
    }

    this.log("info", "Vite configuration checked");
  }

  checkPackageJson() {
    const packagePath = path.join(projectRoot, "package.json");

    if (!fs.existsSync(packagePath)) {
      this.log("error", "package.json not found");
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    // Check React version
    const reactVersion = pkg.dependencies?.react;
    if (!reactVersion) {
      this.log("error", "React not found in dependencies");
    } else {
      // Extract version number, removing any prefix characters like ^ ~ etc.
      const cleanVersion = reactVersion.replace(/^[\^~>=<]+/, "");
      const majorVersion = parseInt(cleanVersion.split(".")[0]);

      if (majorVersion < 18) {
        this.log(
          "warning",
          `Using React ${reactVersion}, consider upgrading to React 18+`,
        );
      }
    }

    // Check for conflicting React versions
    const reactDomVersion = pkg.dependencies?.[`react-dom`];
    if (reactVersion !== reactDomVersion) {
      this.log(
        "error",
        `React (${reactVersion}) and React DOM (${reactDomVersion}) versions don't match`,
      );
    }

    this.log("info", "Package.json checked");
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("        REACT CONTEXT MONITOR REPORT");
    console.log("=".repeat(60));

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Fixes Available: ${this.fixes.length}`);

    if (this.errors.length > 0) {
      console.log(`\n🚨 ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, i) => {
        console.log(
          `   ${i + 1}. ${error.message} ${error.file ? `(${error.file})` : ""}`,
        );
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, i) => {
        console.log(
          `   ${i + 1}. ${warning.message} ${warning.file ? `(${warning.file})` : ""}`,
        );
      });
    }

    if (this.fixes.length > 0) {
      console.log(`\n🔧 SUGGESTED FIXES (${this.fixes.length}):`);
      this.fixes.forEach((fix, i) => {
        console.log(
          `   ${i + 1}. ${fix.message} ${fix.file ? `(${fix.file})` : ""}`,
        );
      });
    }

    // Overall health assessment
    const totalIssues = this.errors.length + this.warnings.length;
    console.log(`\n🏥 HEALTH ASSESSMENT:`);

    if (totalIssues === 0) {
      console.log(`   ✅ EXCELLENT - No React context issues detected`);
    } else if (this.errors.length === 0) {
      console.log(`   ⚠️  GOOD - Only warnings detected, monitor deployment`);
    } else if (this.errors.length < 3) {
      console.log(
        `   🟡 CONCERNING - ${this.errors.length} error(s) need immediate attention`,
      );
    } else {
      console.log(
        `   🔴 CRITICAL - ${this.errors.length} errors may cause production crashes`,
      );
    }

    console.log("\n" + "=".repeat(60));

    return totalIssues === 0;
  }

  async run() {
    this.log("info", "Starting React Context Monitor...");

    // Check configuration files
    this.checkViteConfig();
    this.checkPackageJson();

    // Scan source files
    for (const contextPath of CONTEXT_FILES) {
      const fullPath = path.join(projectRoot, contextPath);

      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else {
          await this.scanFile(fullPath);
        }
      } else {
        this.log("warning", `Path not found: ${contextPath}`);
      }
    }

    // Generate and return report
    const isHealthy = this.generateReport();

    // Exit with appropriate code
    if (!isHealthy && this.errors.length > 0) {
      console.log("\n💥 CRITICAL ISSUES DETECTED - DEPLOYMENT NOT RECOMMENDED");
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS DETECTED - MONITOR DEPLOYMENT CLOSELY");
      process.exit(0);
    } else {
      console.log("\n✅ ALL CHECKS PASSED - SAFE TO DEPLOY");
      process.exit(0);
    }
  }
}

// Run monitor if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ReactContextMonitor();
  monitor.run().catch((error) => {
    console.error("Monitor failed:", error);
    process.exit(1);
  });
}

export default ReactContextMonitor;
