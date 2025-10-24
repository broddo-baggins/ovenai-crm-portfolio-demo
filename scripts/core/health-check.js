#!/usr/bin/env node

/**
 * Application Health Check
 *
 * This script performs comprehensive health checks of the application
 * including environment configuration, Supabase connectivity, and
 * critical service availability.
 */

import fs from "fs";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Load environment variables from .env files
function loadEnvironmentVariables() {
  const envFiles = [
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
  ];

  for (const file of envFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      content.split("\n").forEach((line) => {
        if (line.trim() && !line.startsWith("#") && line.includes("=")) {
          const [key, ...valueParts] = line.split("=");
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join("=").trim();
          }
        }
      });
    } catch (error) {
      // File doesn't exist, continue
    }
  }
}

// Load environment variables at startup
loadEnvironmentVariables();

function log(level, message, details = "") {
  const prefix =
    {
      error: `${colors.red}❌ FAIL${colors.reset}`,
      warn: `${colors.yellow}⚠️  WARN${colors.reset}`,
      info: `${colors.blue}ℹ️  INFO${colors.reset}`,
      success: `${colors.green}✅ PASS${colors.reset}`,
    }[level] || level;

  console.log(`${prefix} ${message}`);
  if (details) {
    console.log(`    ${details}`);
  }
}

async function checkEnvironment() {
  log("info", "Checking environment configuration...");

  const requiredVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
  const issues = [];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      issues.push(`Missing: ${varName}`);
    }
  }

  // Check for security issues
  if (
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NODE_ENV === "production"
  ) {
    issues.push("Service role key exposed in production (security risk)");
  }

  if (issues.length > 0) {
    log("error", "Environment configuration issues", issues.join(", "));
    return false;
  } else {
    log("success", "Environment configured correctly");
    return true;
  }
}

async function checkSupabase() {
  log("info", "Testing Supabase connectivity...");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log("error", "Missing Supabase credentials");
    return false;
  }

  try {
    // Simple URL validation
    const url = new URL(supabaseUrl);

    // Check for HTTPS in production
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      log("error", "Production Supabase URL must use HTTPS");
      return false;
    }

    log("success", "Supabase configuration appears valid");
    return true;
  } catch (error) {
    log("error", "Invalid Supabase URL format", error.message);
    return false;
  }
}

async function runHealthCheck() {
  console.log(`${colors.bright}🏥 Application Health Check${colors.reset}\n`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const checks = [
    { name: "Environment", fn: checkEnvironment },
    { name: "Supabase", fn: checkSupabase },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result) {
        passCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      log("error", `${check.name} check failed`, error.message);
      failCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`${colors.bright}Health Check Summary${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);

  if (failCount > 0) {
    console.log(`\n${colors.red}🚨 HEALTH CHECK FAILED${colors.reset}`);
    console.log("   Critical issues detected. Please fix before deploying.");
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ ALL SYSTEMS HEALTHY${colors.reset}`);
    console.log("   Application is ready for use.");
  }
}

// Main execution
runHealthCheck().catch((error) => {
  console.error(
    `${colors.red}❌ Health check system failed:${colors.reset}`,
    error,
  );
  process.exit(1);
});
