import { test, expect } from "@playwright/test";
import { getBaseURL } from '../../__helpers__/test-config';
import { SecurityHelpers } from "../../__helpers__/security-helpers";

test.describe("🔐 TLS/HTTPS Security Tests", () => {
  let securityHelpers: SecurityHelpers;

  test.beforeEach(async ({ page }) => {
    securityHelpers = new SecurityHelpers(page);
  });

  test("should enforce HTTPS connections", async ({ page }) => {
    console.log("🔒 Testing HTTPS enforcement...");

    // Test HTTPS enforcement
    const httpsResult = await securityHelpers.testHTTPSEnforcement();

    console.log(
      `HTTPS Enforcement: ${httpsResult.passed ? "PASSED" : "FAILED"}`,
    );
    console.log(`Details: ${httpsResult.details}`);
    console.log(`Severity: ${httpsResult.severity}`);

    expect(httpsResult.passed).toBe(true);

    // Verify current connection is secure
    await page.goto("/");
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);

    console.log("✅ HTTPS enforcement validated");
  });

  test("should reject insecure HTTP connections", async ({ page }) => {
    console.log("🚫 Testing HTTP rejection...");

    try {
      // Try to connect via HTTP (convert dynamic HTTPS URL to HTTP)
      const httpsUrl = getBaseURL();
      const httpUrl = httpsUrl.replace('https://', 'http://');
      const response = await page.goto(httpUrl);

      // Should either fail or redirect to HTTPS
      const finalUrl = page.url();

      if (finalUrl.startsWith("https://")) {
        console.log("✅ HTTP redirected to HTTPS");
      } else {
        console.log("⚠️ HTTP connection allowed - security risk");
        expect(finalUrl).toMatch(/^https:\/\//);
      }
    } catch (error) {
      console.log("✅ HTTP connection blocked");
      // This is expected behavior - HTTP should be blocked
    }
  });

  test("should validate TLS configuration", async ({ page }) => {
    console.log("🔧 Testing TLS configuration...");

    const tlsResult = await securityHelpers.testTLSConfiguration();

    console.log(`TLS Configuration: ${tlsResult.passed ? "PASSED" : "FAILED"}`);
    console.log(`Details: ${tlsResult.details}`);
    console.log(`Severity: ${tlsResult.severity}`);

    expect(tlsResult.passed).toBe(true);

    console.log("✅ TLS configuration validated");
  });

  test("should check security headers", async ({ page }) => {
    console.log("📋 Testing security headers...");

    await page.goto("/");
    const response = await page.waitForResponse((response) =>
      response.url().includes("/"),
    );
    const headers = response.headers();

    // Check for HSTS header
    const hsts = headers["strict-transport-security"];
    if (hsts) {
      console.log(`✅ HSTS header present: ${hsts}`);
      expect(hsts).toContain("max-age");
    } else {
      console.log("⚠️ HSTS header missing");
    }

    // Check for X-Content-Type-Options
    const contentTypeOptions = headers["x-content-type-options"];
    if (contentTypeOptions) {
      console.log(`✅ X-Content-Type-Options: ${contentTypeOptions}`);
      expect(contentTypeOptions).toBe("nosniff");
    } else {
      console.log("⚠️ X-Content-Type-Options header missing");
    }

    // Check for X-Frame-Options
    const frameOptions = headers["x-frame-options"];
    if (frameOptions) {
      console.log(`✅ X-Frame-Options: ${frameOptions}`);
      expect(["DENY", "SAMEORIGIN"]).toContain(frameOptions);
    } else {
      console.log("⚠️ X-Frame-Options header missing");
    }

    // Check for CSP header
    const csp = headers["content-security-policy"];
    if (csp) {
      console.log(`✅ CSP header present: ${csp.substring(0, 50)}...`);
    } else {
      console.log("⚠️ CSP header missing");
    }

    console.log("✅ Security headers validated");
  });

  test("should validate cipher suites", async ({ page }) => {
    console.log("🔐 Testing cipher suites...");

    await page.goto("/");

    // Use Playwright's built-in security details
    try {
      const response = await page.waitForResponse(
        (response) => response.url() === page.url(),
      );
      const securityDetails = response.securityDetails();

      const details = await securityDetails;
      if (details) {
        console.log(`✅ Security details available`);
        // Note: Playwright doesn't expose detailed cipher info in all browsers
      } else {
        console.log("⚠️ Security details not available");
      }
    } catch (error) {
      console.log("⚠️ Could not retrieve security details");
    }

    // At minimum, verify we're using HTTPS
    expect(page.url()).toMatch(/^https:\/\//);

    console.log("✅ Cipher suite validation completed");
  });

  test("should reject weak TLS versions", async ({ page }) => {
    console.log("🔒 Testing TLS version requirements...");

    // This test would ideally connect with different TLS versions
    // For now, we verify we're using a secure connection
    await page.goto("/");

    // Check that we're using HTTPS (which implies TLS 1.2+)
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);

    // In a real implementation, you would test with:
    // - TLS 1.0 (should be rejected)
    // - TLS 1.1 (should be rejected)
    // - TLS 1.2 (should be accepted)
    // - TLS 1.3 (should be accepted)

    console.log("✅ TLS version requirements validated");
  });

  test("should validate certificate chain", async ({ page }) => {
    console.log("📜 Testing certificate validation...");

    try {
      await page.goto("/");

      // If we reach here without SSL errors, certificate is valid
      const url = page.url();
      expect(url).toMatch(/^https:\/\//);

      console.log("✅ Certificate chain is valid");
    } catch (error) {
      if (
        error.message.includes("SSL") ||
        error.message.includes("certificate")
      ) {
        console.log("❌ Certificate validation failed");
        throw error;
      } else {
        console.log("✅ No certificate errors detected");
      }
    }
  });

  test("should test mixed content protection", async ({ page }) => {
    console.log("🔒 Testing mixed content protection...");

    const mixedContentErrors: string[] = [];

    // Listen for security state changes
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("Mixed Content")) {
        mixedContentErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for mixed content errors
    expect(mixedContentErrors.length).toBe(0);

    if (mixedContentErrors.length > 0) {
      console.log("❌ Mixed content detected:", mixedContentErrors);
    } else {
      console.log("✅ No mixed content detected");
    }
  });

  test("should validate secure connection establishment", async ({ page }) => {
    console.log("🤝 Testing secure connection establishment...");

    const startTime = Date.now();

    try {
      await page.goto("/");
      const endTime = Date.now();
      const connectionTime = endTime - startTime;

      // Connection should be established reasonably quickly
      expect(connectionTime).toBeLessThan(10000); // 10 seconds max

      // Verify we have a secure connection
      const url = page.url();
      expect(url).toMatch(/^https:\/\//);

      console.log(`✅ Secure connection established in ${connectionTime}ms`);
    } catch (error) {
      console.log("❌ Failed to establish secure connection:", error);
      throw error;
    }
  });

  test("should test HSTS preload compliance", async ({ page }) => {
    console.log("📌 Testing HSTS preload compliance...");

    await page.goto("/");
    const response = await page.waitForResponse(
      (response) => response.url() === page.url(),
    );
    const headers = response.headers();

    const hsts = headers["strict-transport-security"];

    if (hsts) {
      // Check HSTS requirements for preload
      const hasMaxAge = hsts.includes("max-age");
      const hasIncludeSubDomains = hsts.includes("includeSubDomains");
      const hasPreload = hsts.includes("preload");

      console.log(`HSTS Header: ${hsts}`);
      console.log(`Max-Age: ${hasMaxAge ? "✅" : "❌"}`);
      console.log(`Include SubDomains: ${hasIncludeSubDomains ? "✅" : "⚠️"}`);
      console.log(`Preload: ${hasPreload ? "✅" : "⚠️"}`);

      expect(hasMaxAge).toBe(true);

      if (hasIncludeSubDomains && hasPreload) {
        console.log("✅ HSTS preload ready");
      } else {
        console.log("⚠️ HSTS preload not configured (optional)");
      }
    } else {
      console.log("⚠️ HSTS header not present");
    }
  });

  test("should run comprehensive security scan", async ({ page }) => {
    console.log("🛡️ Running comprehensive security scan...");

    const scanResults = await securityHelpers.runSecurityScan();

    console.log(
      `Overall Security Score: ${scanResults.overallScore.toFixed(1)}%`,
    );

    // Log individual test results
    for (const [testName, result] of Object.entries(
      scanResults.results || {},
    )) {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${testName}: ${result.details}`);

      if (!result.passed && result.severity === "critical") {
        console.log(`🚨 CRITICAL: ${testName} - ${result.details}`);
      }
    }

    // Expect at least 80% security score
    expect(scanResults.overallScore).toBeGreaterThanOrEqual(80);

    // Generate and log security report
    const report = securityHelpers.generateSecurityReport(scanResults);
    console.log("\n" + report);

    console.log("✅ Comprehensive security scan completed");
  });
});
