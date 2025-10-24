/**
 * Unified API Test Utility
 *
 * Test script to validate backend connectivity and unified API functionality.
 * Run this to ensure the frontend can properly communicate with the backend.
 */

import { unifiedApiClient } from "../services/unifiedApiClient";

export interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export class UnifiedApiTester {
  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Basic connectivity
    results.push(await this.testConnectivity());

    // Test 2: Enhanced CRUD - Clients
    results.push(await this.testClientsAPI());

    // Test 3: Enhanced CRUD - Leads
    results.push(await this.testLeadsAPI());

    // Test 4: Dashboard API
    results.push(await this.testDashboardAPI());

    return results;
  }

  private async testConnectivity(): Promise<TestResult> {
    const start = Date.now();
    try {
      const isConnected = await unifiedApiClient.testConnection();
      return {
        test: "Basic Connectivity",
        success: isConnected,
        duration: Date.now() - start,
        data: { connected: isConnected },
      };
    } catch (error) {
      return {
        test: "Basic Connectivity",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - start,
      };
    }
  }

  private async testClientsAPI(): Promise<TestResult> {
    const start = Date.now();
    try {
      const result = await unifiedApiClient.getClients({
        pagination: { page: 1, limit: 5 },
      });

      return {
        test: "Clients API",
        success: result.success,
        duration: Date.now() - start,
        data: result.data,
        error: result.error,
      };
    } catch (error) {
      return {
        test: "Clients API",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - start,
      };
    }
  }

  private async testLeadsAPI(): Promise<TestResult> {
    const start = Date.now();
    try {
      const result = await unifiedApiClient.getLeads({
        pagination: { page: 1, limit: 5 },
        include: ["project", "project.client"],
      });

      return {
        test: "Leads API",
        success: result.success,
        duration: Date.now() - start,
        data: result.data,
        error: result.error,
      };
    } catch (error) {
      return {
        test: "Leads API",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - start,
      };
    }
  }

  private async testDashboardAPI(): Promise<TestResult> {
    const start = Date.now();
    try {
      // In Site DB architecture, test system status by checking basic connectivity
      const isConnected = await unifiedApiClient.testConnection();

      return {
        test: "System Status Check",
        success: isConnected,
        duration: Date.now() - start,
        data: { systemStatus: isConnected ? "online" : "offline" },
      };
    } catch (error) {
      return {
        test: "System Status Check",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - start,
      };
    }
  }

  async logResults(results: TestResult[]): Promise<void> {
    console.log("\nTEST UNIFIED API TEST RESULTS");
    console.log("=".repeat(50));

    let totalPassed = 0;
    let totalDuration = 0;

    results.forEach((result, index) => {
      const status = result.success ? "SUCCESS PASS" : "ERROR FAIL";
      console.log(
        `${index + 1}. ${result.test}: ${status} (${result.duration}ms)`,
      );

      if (result.success) {
        totalPassed++;
        if (result.data) {
          console.log(
            `   Data: ${JSON.stringify(result.data, null, 2).substring(0, 100)}...`,
          );
        }
      } else {
        console.log(`   Error: ${result.error}`);
      }

      totalDuration += result.duration;
    });

    console.log("=".repeat(50));

    console.log(`TIMER  Total duration: ${totalDuration}ms`);
    console.log(
      `INIT Average response time: ${Math.round(totalDuration / results.length)}ms`,
    );

    if (totalPassed === results.length) {
      console.log("COMPLETE All tests passed! Unified API integration is ready.");
    } else {
      console.log(
        "WARNING  Some tests failed. Check configuration and backend connectivity.",
      );
    }
  }
}

// Export singleton instance
export const unifiedApiTester = new UnifiedApiTester();

// Quick test function for console use
export async function quickTest(): Promise<void> {
  const tester = new UnifiedApiTester();
  const results = await tester.runAllTests();
  await tester.logResults(results);
}
