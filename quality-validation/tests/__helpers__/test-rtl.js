#!/usr/bin/env node

/**
 * RTL Implementation Testing Script
 *
 * This script helps verify that RTL support is properly implemented
 * across all components in the OvenAI dashboard.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  srcDir: "./src",
  componentsDir: "./src/components",
  pagesDir: "./src/pages",
  outputFile: "./rtl-test-report.md",
};

// RTL patterns to check for
const rtlPatterns = {
  required: [
    "useLang",
    "useTranslation",
    "isRTL",
    "textStart",
    "flexRowReverse",
  ],
  recommended: [
    "textEnd",
    "marginEnd",
    "paddingStart",
    "dir={isRTL",
    "font-hebrew",
    "toLocaleString",
  ],
  antiPatterns: [
    "text-left",
    "text-right",
    "ml-",
    "mr-",
    "pl-",
    "pr-",
    "flex-row-reverse",
    "justify-start",
    "justify-end",
  ],
};

/**
 * Recursively find all TypeScript/JSX files
 */
function findFiles(dir, extensions = [".tsx", ".ts"]) {
  let files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(findFiles(fullPath, extensions));
    } else if (extensions.some((ext) => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Analyze a file for RTL implementation
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);

  const analysis = {
    path: relativePath,
    hasRTLSupport: false,
    requiredPatterns: [],
    recommendedPatterns: [],
    antiPatterns: [],
    score: 0,
    issues: [],
  };

  // Check for required patterns
  rtlPatterns.required.forEach((pattern) => {
    if (content.includes(pattern)) {
      analysis.requiredPatterns.push(pattern);
    }
  });

  // Check for recommended patterns
  rtlPatterns.recommended.forEach((pattern) => {
    if (content.includes(pattern)) {
      analysis.recommendedPatterns.push(pattern);
    }
  });

  // Check for anti-patterns
  rtlPatterns.antiPatterns.forEach((pattern) => {
    const regex = new RegExp(
      `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "g",
    );
    const matches = content.match(regex);
    if (matches) {
      analysis.antiPatterns.push({
        pattern,
        count: matches.length,
      });
    }
  });

  // Determine RTL support level
  analysis.hasRTLSupport = analysis.requiredPatterns.length >= 3;

  // Calculate score
  const requiredScore =
    (analysis.requiredPatterns.length / rtlPatterns.required.length) * 60;
  const recommendedScore =
    (analysis.recommendedPatterns.length / rtlPatterns.recommended.length) * 30;
  const antiPatternPenalty =
    analysis.antiPatterns.reduce((sum, ap) => sum + ap.count, 0) * 2;

  analysis.score = Math.max(
    0,
    Math.round(requiredScore + recommendedScore - antiPatternPenalty),
  );

  // Generate issues
  if (analysis.requiredPatterns.length < 3) {
    analysis.issues.push(
      "Missing essential RTL patterns (useLang, useTranslation, isRTL)",
    );
  }

  if (analysis.antiPatterns.length > 0) {
    analysis.issues.push(
      `Found ${analysis.antiPatterns.length} anti-patterns that may break RTL layout`,
    );
  }

  if (!content.includes("useTranslation") && content.includes("text")) {
    analysis.issues.push("Contains hardcoded text without translation support");
  }

  return analysis;
}

/**
 * Generate RTL test report
 */
function generateReport(analyses) {
  const totalFiles = analyses.length;
  const rtlSupportedFiles = analyses.filter((a) => a.hasRTLSupport).length;
  const totalScore = analyses.reduce((sum, a) => sum + a.score, 0);
  const averageScore = totalFiles > 0 ? Math.round(totalScore / totalFiles) : 0;
  const rtlCoverage =
    totalFiles > 0 ? Math.round((rtlSupportedFiles / totalFiles) * 100) : 0;

  let report = `# RTL Implementation Test Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;

  // Summary
  report += `## 📊 Summary\n\n`;
  report += `- **Total Files Analyzed**: ${totalFiles}\n`;
  report += `- **Files with RTL Support**: ${rtlSupportedFiles}\n`;
  report += `- **RTL Coverage**: ${rtlCoverage}%\n`;
  report += `- **Average Score**: ${averageScore}/100\n\n`;

  // Top performers
  const topPerformers = analyses
    .filter((a) => a.score >= 80)
    .sort((a, b) => b.score - a.score);
  if (topPerformers.length > 0) {
    report += `## 🏆 Top Performers (Score >= 80)\n\n`;
    topPerformers.forEach((analysis) => {
      report += `- **${analysis.path}** - ${analysis.score}/100\n`;
    });
    report += `\n`;
  }

  // Needs attention
  const needsAttention = analyses
    .filter((a) => a.score < 60)
    .sort((a, b) => a.score - b.score);
  if (needsAttention.length > 0) {
    report += `## ⚠️ Needs Attention (Score < 60)\n\n`;
    needsAttention.forEach((analysis) => {
      report += `- **${analysis.path}** - ${analysis.score}/100\n`;
      if (analysis.issues.length > 0) {
        analysis.issues.forEach((issue) => {
          report += `  - ${issue}\n`;
        });
      }
    });
    report += `\n`;
  }

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log("🔍 Analyzing RTL implementation...\n");

  // Find all component files
  const files = [
    ...findFiles(config.componentsDir),
    ...findFiles(config.pagesDir),
  ];

  console.log(`Found ${files.length} files to analyze\n`);

  // Analyze each file
  const analyses = files.map((file) => {
    console.log(`Analyzing: ${path.relative(process.cwd(), file)}`);
    return analyzeFile(file);
  });

  // Generate report
  console.log("\n📝 Generating report...\n");
  const report = generateReport(analyses);

  // Write report
  fs.writeFileSync(config.outputFile, report);

  console.log(`✅ Report generated: ${config.outputFile}\n`);

  // Summary
  const totalFiles = analyses.length;
  const rtlSupportedFiles = analyses.filter((a) => a.hasRTLSupport).length;
  const rtlCoverage =
    totalFiles > 0 ? Math.round((rtlSupportedFiles / totalFiles) * 100) : 0;

  console.log(`📊 Summary:`);
  console.log(`   Total files: ${totalFiles}`);
  console.log(
    `   RTL support: ${rtlSupportedFiles}/${totalFiles} (${rtlCoverage}%)`,
  );
  console.log(`   Report: ${config.outputFile}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
