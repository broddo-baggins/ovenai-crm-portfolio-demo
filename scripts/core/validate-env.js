#!/usr/bin/env node

/**
 * Environment Configuration Validator
 *
 * This script validates environment configurations across different deployment targets
 * and provides clear feedback about missing or misconfigured variables.
 *
 * Usage:
 *   npm run validate-env               # Validate current environment
 *   npm run validate-env --env=prod    # Validate production configuration
 *   npm run validate-env --env=dev     # Validate development configuration
 */

import fs from "fs";
import path from "path";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Environment variable requirements by environment
const ENV_REQUIREMENTS = {
  development: {
    required: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"],
    optional: [
      "VITE_APP_URL",
      "VITE_ENVIRONMENT",
      "VITE_ENABLE_FALLBACK_LOGIN",
      "VITE_ALLOW_REGISTRATION",
    ],
    forbidden: ["VITE_SUPABASE_SERVICE_ROLE_KEY"],
    warnings: {
      // Removed service role key warning as it's now forbidden
    },
  },
  test: {
    required: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"],
    optional: [
      "VITE_APP_URL",
      "VITE_ENVIRONMENT",
      "VITE_ENABLE_FALLBACK_LOGIN",
      "VITE_ALLOW_REGISTRATION",
      "NODE_ENV",
      "CI",
    ],
  },
  production: {
    required: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_APP_URL"],
    optional: [
      "VITE_ENVIRONMENT",
      "VITE_ENABLE_FALLBACK_LOGIN",
      "VITE_ALLOW_REGISTRATION",
    ],
    forbidden: ["VITE_SUPABASE_SERVICE_ROLE_KEY"],
    validations: {
      VITE_SUPABASE_URL: (value) => {
        if (!value.startsWith("https://")) {
          return "Production Supabase URL must use HTTPS";
        }
        if (value.includes("localhost")) {
          return "Production should not use localhost URLs";
        }
        return null;
      },
      VITE_APP_URL: (value) => {
        if (!value.startsWith("https://")) {
          return "Production app URL must use HTTPS";
        }
        return null;
      },
      VITE_ENABLE_FALLBACK_LOGIN: (value) => {
        if (value === "true") {
          return "Fallback login should be disabled in production";
        }
        return null;
      },
    },
  },
  preview: {
    required: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_APP_URL"],
    optional: [
      "VITE_ENVIRONMENT",
      "VITE_ENABLE_FALLBACK_LOGIN",
      "VITE_ALLOW_REGISTRATION",
    ],
    forbidden: ["VITE_SUPABASE_SERVICE_ROLE_KEY"],
  },
};

function log(level, message, details = "") {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      error: `${colors.red}❌ ERROR${colors.reset}`,
      warn: `${colors.yellow}⚠️  WARN${colors.reset}`,
      info: `${colors.blue}ℹ️  INFO${colors.reset}`,
      success: `${colors.green}✅ SUCCESS${colors.reset}`,
      debug: `${colors.cyan}🔍 DEBUG${colors.reset}`,
    }[level] || level;

  console.log(`${prefix} ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const env = {};

    content.split("\n").forEach((line) => {
      if (line.trim() && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join("=").trim();
        }
      }
    });

    return env;
  } catch (error) {
    return null;
  }
}

function detectEnvironment() {
  // Check command line argument
  const envArg = process.argv.find((arg) => arg.startsWith("--env="));
  if (envArg) {
    return envArg.split("=")[1];
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // Check VITE_ENVIRONMENT
  if (process.env.VITE_ENVIRONMENT) {
    return process.env.VITE_ENVIRONMENT;
  }

  // Check VERCEL_ENV (Vercel deployment)
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV;
  }

  // Default to development
  return "development";
}

function getCurrentEnvVars(targetEnv) {
  // Load from .env files in priority order
  const envFiles = [
    ".env",
    ".env.local",
    `.env.${targetEnv}`,
  ];
  const envVars = { ...process.env };

  for (const file of envFiles) {
    const env = loadEnvFile(file);
    if (env) {
      Object.assign(envVars, env);
      log("debug", `Loaded environment variables from ${file}`);
    }
  }

  return envVars;
}

function validateEnvironment(targetEnv) {
  log(
    "info",
    `${colors.bright}🔍 Validating Environment Configuration${colors.reset}`,
  );
  log("info", `Target Environment: ${colors.cyan}${targetEnv}${colors.reset}`);

  const requirements = ENV_REQUIREMENTS[targetEnv];
  if (!requirements) {
    log("error", `Unknown environment: ${targetEnv}`);
    return false;
  }

  const envVars = getCurrentEnvVars(targetEnv);
  let hasErrors = false;
  let hasWarnings = false;

  console.log("\n" + "=".repeat(60));

  // Check required variables
  log("info", `${colors.bright}Required Variables:${colors.reset}`);
  for (const varName of requirements.required) {
    if (!envVars[varName]) {
      log("error", `Missing required variable: ${varName}`);
      hasErrors = true;
    } else {
      log("success", `${varName}: Set`);

      // Run custom validations
      if (requirements.validations && requirements.validations[varName]) {
        const validationError = requirements.validations[varName](
          envVars[varName],
        );
        if (validationError) {
          log("error", `${varName}: ${validationError}`);
          hasErrors = true;
        }
      }
    }
  }

  // Check forbidden variables
  if (requirements.forbidden) {
    console.log("\n" + "-".repeat(40));
    log(
      "info",
      `${colors.bright}Security Check (Forbidden Variables):${colors.reset}`,
    );
    for (const varName of requirements.forbidden) {
      if (envVars[varName]) {
        log(
          "error",
          `Forbidden variable present: ${varName}`,
          "This creates a security risk in this environment",
        );
        hasErrors = true;
      } else {
        log("success", `${varName}: Correctly not set`);
      }
    }
  }

  // Check optional variables
  console.log("\n" + "-".repeat(40));
  log("info", `${colors.bright}Optional Variables:${colors.reset}`);
  for (const varName of requirements.optional) {
    if (envVars[varName]) {
      log("success", `${varName}: Set`);

      // Check for warnings
      if (requirements.warnings && requirements.warnings[varName]) {
        log("warn", `${varName}: ${requirements.warnings[varName]}`);
        hasWarnings = true;
      }

      // Run custom validations
      if (requirements.validations && requirements.validations[varName]) {
        const validationError = requirements.validations[varName](
          envVars[varName],
        );
        if (validationError) {
          log("warn", `${varName}: ${validationError}`);
          hasWarnings = true;
        }
      }
    } else {
      log("info", `${varName}: Not set (optional)`);
    }
  }

  // Additional checks
  console.log("\n" + "-".repeat(40));
  log("info", `${colors.bright}Configuration Analysis:${colors.reset}`);

  // Check for localhost URLs in production
  if (targetEnv === "production") {
    Object.keys(envVars).forEach((key) => {
      if (key.startsWith("VITE_") && envVars[key].includes("localhost")) {
        log(
          "warn",
          `${key} contains localhost URL in production`,
          envVars[key],
        );
        hasWarnings = true;
      }
    });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  if (hasErrors) {
    log(
      "error",
      `${colors.bright}VALIDATION FAILED${colors.reset}`,
      "Please fix the errors above before deploying",
    );
    return false;
  } else if (hasWarnings) {
    log(
      "warn",
      `${colors.bright}VALIDATION PASSED WITH WARNINGS${colors.reset}`,
      "Consider addressing the warnings above",
    );
    return true;
  } else {
    log(
      "success",
      `${colors.bright}VALIDATION PASSED${colors.reset}`,
      "All environment variables are correctly configured",
    );
    return true;
  }
}

function generateEnvTemplate(targetEnv) {
  log("info", `Generating .env template for ${targetEnv} environment...`);

  const requirements = ENV_REQUIREMENTS[targetEnv];
  if (!requirements) {
    log("error", `Unknown environment: ${targetEnv}`);
    return;
  }

  let template = `# Environment Configuration for ${targetEnv.toUpperCase()}\n`;
  template += `# Generated on ${new Date().toISOString()}\n\n`;

  template += `# Required Variables\n`;
  for (const varName of requirements.required) {
    template += `${varName}=YOUR_${varName}_HERE\n`;
  }

  template += `\n# Optional Variables\n`;
  for (const varName of requirements.optional) {
    template += `# ${varName}=\n`;
  }

  if (requirements.forbidden) {
    template += `\n# ⚠️ DO NOT SET THESE VARIABLES IN ${targetEnv.toUpperCase()}\n`;
    for (const varName of requirements.forbidden) {
      template += `# ${varName}=FORBIDDEN_IN_${targetEnv.toUpperCase()}\n`;
    }
  }

  const filename = `.env.${targetEnv}.template`;
  fs.writeFileSync(filename, template);
  log("success", `Template saved to ${filename}`);
}

// Main execution
function main() {
  console.log(
    `${colors.bright}🛡️  Environment Configuration Validator${colors.reset}\n`,
  );

  const targetEnv = detectEnvironment();

  // Generate template if requested
  if (process.argv.includes("--generate-template")) {
    generateEnvTemplate(targetEnv);
    return;
  }

  // Run validation
  const isValid = validateEnvironment(targetEnv);

  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bright}Next Steps:${colors.reset}`);

  if (!isValid) {
    console.log(`${colors.red}1. Fix the errors listed above${colors.reset}`);
    console.log(
      `${colors.red}2. Re-run validation: npm run validate-env${colors.reset}`,
    );
    console.log(
      `${colors.red}3. Only deploy after validation passes${colors.reset}`,
    );
    process.exit(1);
  } else {
    console.log(
      `${colors.green}✅ Environment is ready for deployment${colors.reset}`,
    );
    console.log(
      `${colors.cyan}💡 Run 'npm run validate-env --generate-template' to create templates${colors.reset}`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
