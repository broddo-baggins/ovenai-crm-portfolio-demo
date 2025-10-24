#!/usr/bin/env node

/**
 * Test Results Persistence Script
 * Ensures test results are properly saved and archived in the data folder
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function persistTestResults() {
  try {
    const projectRoot = path.resolve(__dirname, "../../");
    const testResultsFile = path.join(projectRoot, "test-results.json");
    const dataDir = path.join(projectRoot, "src", "data");
    const testDataDir = path.join(dataDir, "test-results");

    // Ensure test data directory exists
    await fs.mkdir(testDataDir, { recursive: true });

    // Check if test results file exists
    try {
      const testResults = await fs.readFile(testResultsFile, "utf8");
      const parsedResults = JSON.parse(testResults);

      // Create timestamped backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(
        testDataDir,
        `test-results-${timestamp}.json`,
      );

      // Save current results with metadata
      const persistedResults = {
        timestamp: new Date().toISOString(),
        testRun: {
          ...parsedResults,
          backupCreated: timestamp,
          persistedAt: new Date().toISOString(),
        },
      };

      await fs.writeFile(backupFile, JSON.stringify(persistedResults, null, 2));

      // Also save as latest results
      const latestFile = path.join(testDataDir, "latest-test-results.json");
      await fs.writeFile(latestFile, JSON.stringify(persistedResults, null, 2));

      console.log(`✅ Test results persisted to: ${backupFile}`);
      console.log(`✅ Latest results saved to: ${latestFile}`);

      // Create summary for dashboard if needed
      const summary = {
        lastRun: new Date().toISOString(),
        status: parsedResults.errors.length > 0 ? "failed" : "passed",
        stats: parsedResults.stats,
        errorCount: parsedResults.errors.length,
        testCount:
          parsedResults.stats.expected + parsedResults.stats.unexpected,
      };

      const summaryFile = path.join(testDataDir, "test-summary.json");
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

      console.log(`✅ Test summary created: ${summaryFile}`);
    } catch (fileError) {
      if (fileError.code === "ENOENT") {
        console.log(
          "⚠️ No test results file found. Run tests first to generate results.",
        );

        // Create placeholder structure
        const placeholder = {
          message: "No test results available yet",
          instructions:
            "Run 'npm test' or 'npm run test:e2e' to generate test results",
          timestamp: new Date().toISOString(),
        };

        const placeholderFile = path.join(testDataDir, "no-results.json");
        await fs.writeFile(
          placeholderFile,
          JSON.stringify(placeholder, null, 2),
        );
        console.log(`📝 Placeholder created: ${placeholderFile}`);
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error("❌ Error persisting test results:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  persistTestResults();
}

export { persistTestResults };
