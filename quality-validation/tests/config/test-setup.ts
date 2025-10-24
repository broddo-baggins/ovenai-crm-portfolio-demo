/**
 * Test Environment Setup
 * Provides isolated test environment for CRUD operations
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

export class TestEnvironment {
  private static instance: TestEnvironment;
  private testDataIds: string[] = [];

  static getInstance(): TestEnvironment {
    if (!TestEnvironment.instance) {
      TestEnvironment.instance = new TestEnvironment();
    }
    return TestEnvironment.instance;
  }

  async setup() {
    console.log("🧪 Setting up test environment...");
    // Initialize test database state
    // Clear any existing test data
    await this.cleanup();
  }

  async cleanup() {
    console.log("🧹 Cleaning up test data...");
    // Remove all test data created during tests
    this.testDataIds = [];
  }

  addTestDataId(id: string) {
    this.testDataIds.push(id);
  }

  getTestDataIds(): string[] {
    return [...this.testDataIds];
  }
}

// Global test hooks
beforeAll(async () => {
  await TestEnvironment.getInstance().setup();
});

afterAll(async () => {
  await TestEnvironment.getInstance().cleanup();
});

beforeEach(async () => {
  // Reset test state before each test
});

afterEach(async () => {
  // Clean up after each test
});
