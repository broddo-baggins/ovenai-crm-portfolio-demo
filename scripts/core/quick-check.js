#!/usr/bin/env node

/**
 * Quick Development Check
 *
 * Runs essential checks for local development without the full test suite
 */

import { execSync } from "child_process";
import fs from "fs";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(level, message) {
  const prefix =
    {
      error: `${colors.red}❌ FAIL${colors.reset}`,
      warn: `${colors.yellow}⚠️  WARN${colors.reset}`,
      info: `${colors.blue}ℹ️  INFO${colors.reset}`,
      success: `${colors.green}✅ PASS${colors.reset}`,
    }[level] || level;

  console.log(`${prefix} ${message}`);
}

function runCommand(command, description) {
  try {
    log("info", `${description}...`);
    execSync(command, { stdio: "pipe" });
    log("success", description);
    return true;
  } catch (error) {
    log("error", `${description} failed`);
    return false;
  }
}

async function quickCheck() {
  console.log(`${colors.bright}🚀 Quick Development Check${colors.reset}\n`);

  let passCount = 0;
  let failCount = 0;

  const checks = [
    {
      name: "Environment validation",
      command: "npm run validate-env --silent",
    },
    {
      name: "TypeScript compilation",
      command: "npm run type-check",
    },
    {
      name: "React context check",
      command: "npm run react-context-check",
    },
    {
      name: "Lint errors only",
      command: "npm run lint:errors-only",
    },
  ];

  for (const check of checks) {
    if (runCommand(check.command, check.name)) {
      passCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`${colors.bright}Quick Check Summary${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);

  if (failCount > 0) {
    console.log(`\n${colors.yellow}⚠️  ISSUES DETECTED${colors.reset}`);
    console.log("   Fix issues before committing to production branches.");
    console.log("   Run full checks with: npm run pre-push-check");
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ ALL QUICK CHECKS PASSED${colors.reset}`);
    console.log("   Ready for development work!");
  }
}

quickCheck().catch((error) => {
  console.error(`${colors.red}❌ Quick check failed:${colors.reset}`, error);
  process.exit(1);
});
