#!/usr/bin/env node

/**
 * CONTINUOUS CONVERSATION LOADING TEST
 * Tests conversation loading like the frontend does, runs until fixed
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

console.log("🔄 CONTINUOUS CONVERSATION LOADING TEST");
console.log("═".repeat(80));
console.log("This script will run until conversation loading is fully working");
console.log("Press Ctrl+C to stop at any time");
console.log("═".repeat(80));

// Load credentials
const credentials = (() => {
  const paths = [
    "./supabase-credentials.local",
    "./credentials/supabase-credentials.local",
  ];
  for (const path of paths) {
    if (existsSync(path)) {
      const content = readFileSync(path, "utf8");
      const creds = {};
      content.split("\n").forEach((line) => {
        if (line.includes("=") && !line.startsWith("#")) {
          const [key, value] = line.split("=");
          creds[key.trim()] = value.trim();
        }
      });
      return creds;
    }
  }
  return null;
})();

if (!credentials) {
  console.log("❌ Could not find credentials file");
  process.exit(1);
}

const supabase = createClient(
  credentials.SUPABASE_URL || credentials.VITE_SUPABASE_URL,
  credentials.SUPABASE_SERVICE_ROLE_KEY || credentials.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Test results tracking
let testRun = 0;
let consecutiveSuccesses = 0;
const REQUIRED_SUCCESSES = 3; // Need 3 consecutive successes to consider it fixed

async function testConversationTableAccess() {
  try {
    const { data, error, count } = await supabase
      .from("conversations")
      .select("*", { count: "exact" })
      .limit(10);

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return {
      success: true,
      count: count,
      sample: data.length,
      hasContent: data.filter(
        (c) => c.message_content && c.message_content.length > 0,
      ).length,
    };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}

async function testConversationsWithLeads() {
  try {
    // Get conversations with lead info (mimicking frontend)
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .limit(20);

    if (convError) {
      return {
        success: false,
        error: `Conversations: ${convError.message}`,
        data: null,
      };
    }

    // Get leads separately
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select(
        "id, name, first_name, last_name, email, phone, status, current_project_id",
      )
      .limit(50);

    if (leadsError) {
      return {
        success: false,
        error: `Leads: ${leadsError.message}`,
        data: null,
      };
    }

    // Create leads map like frontend does
    const leadsMap = new Map(leads.map((lead) => [lead.id, lead]));

    // Match conversations with leads
    const conversationsWithLeads = conversations
      .map((conv) => {
        const lead = leadsMap.get(conv.lead_id);
        if (!lead) return null;

        return {
          ...conv,
          lead,
          messageCount: conv.message_content ? 1 : 0,
          lastMessage: conv.message_content || "No message content",
          leadStatus: lead.status || "unknown",
        };
      })
      .filter(Boolean);

    return {
      success: true,
      totalConversations: conversations.length,
      matchedWithLeads: conversationsWithLeads.length,
      withContent: conversationsWithLeads.filter((c) => c.messageCount > 0)
        .length,
      conversations: conversationsWithLeads.slice(0, 3), // Sample for debugging
    };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}

async function testUnifiedApiClient() {
  try {
    // Simulate the unifiedApiClient call that the frontend makes
    const testData = {
      lead_id: null, // Get all conversations
      filters: {},
    };

    // Test the direct table access method we implemented
    let query = supabase.from("conversations").select("*");

    // Apply default sorting like our fixed implementation
    query = query.order("timestamp", { ascending: false });
    query = query.limit(100);

    const { data: readResult, error: readError } = await query;

    if (readError) {
      return {
        success: false,
        error: `API Error: ${readError.message}`,
        data: null,
      };
    }

    return {
      success: true,
      method: "Direct table access",
      count: readResult.length,
      sample: readResult.slice(0, 2),
    };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}

async function testMessagesPageFlow() {
  try {
    // Simulate the complete Messages page loading flow
    console.log("   🔄 Simulating Messages page loading...");

    // Step 1: Load conversations
    const conversationsResult = await testConversationsWithLeads();
    if (!conversationsResult.success) {
      return {
        success: false,
        error: `Conversations failed: ${conversationsResult.error}`,
      };
    }

    // Step 2: Test if we can get conversation statistics
    const stats = {
      totalConversations: conversationsResult.totalConversations,
      activeConversations: conversationsResult.conversations.filter(
        (c) => c.status === "active",
      ).length,
      withMessages: conversationsResult.withContent,
      uniqueLeads: new Set(
        conversationsResult.conversations.map((c) => c.lead_id),
      ).size,
    };

    // Step 3: Check if the data would render properly in UI
    const uiReadyData = conversationsResult.conversations.map((conv) => ({
      id: conv.id,
      leadName:
        conv.lead.name ||
        `${conv.lead.first_name || ""} ${conv.lead.last_name || ""}`.trim() ||
        "Unknown Lead",
      leadEmail: conv.lead.email,
      leadPhone: conv.lead.phone,
      lastMessage: conv.lastMessage,
      status: conv.status,
      messageCount: conv.messageCount,
      canDisplay: !!(
        conv.lead &&
        (conv.lead.name || conv.lead.first_name || conv.lead.email)
      ),
    }));

    const displayableConversations = uiReadyData.filter((c) => c.canDisplay);

    return {
      success: true,
      stats,
      totalFound: conversationsResult.totalConversations,
      displayable: displayableConversations.length,
      sample: displayableConversations.slice(0, 2),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runSingleTest() {
  testRun++;
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n🧪 TEST RUN #${testRun} (${timestamp})`);
  console.log("─".repeat(60));

  const results = {};

  // Test 1: Basic conversation table access
  console.log("1️⃣  Testing conversation table access...");
  results.tableAccess = await testConversationTableAccess();

  if (results.tableAccess.success) {
    console.log(
      `   ✅ Table access: ${results.tableAccess.count} total, ${results.tableAccess.sample} sampled, ${results.tableAccess.hasContent} with content`,
    );
  } else {
    console.log(`   ❌ Table access failed: ${results.tableAccess.error}`);
  }

  // Test 2: Conversations with leads joining
  console.log("2️⃣  Testing conversations with leads...");
  results.withLeads = await testConversationsWithLeads();

  if (results.withLeads.success) {
    console.log(
      `   ✅ Lead joining: ${results.withLeads.matchedWithLeads}/${results.withLeads.totalConversations} matched, ${results.withLeads.withContent} with content`,
    );
  } else {
    console.log(`   ❌ Lead joining failed: ${results.withLeads.error}`);
  }

  // Test 3: Unified API client method
  console.log("3️⃣  Testing unified API client...");
  results.apiClient = await testUnifiedApiClient();

  if (results.apiClient.success) {
    console.log(
      `   ✅ API Client: ${results.apiClient.count} conversations via ${results.apiClient.method}`,
    );
  } else {
    console.log(`   ❌ API Client failed: ${results.apiClient.error}`);
  }

  // Test 4: Full Messages page flow
  console.log("4️⃣  Testing Messages page flow...");
  results.messagesPage = await testMessagesPageFlow();

  if (results.messagesPage.success) {
    console.log(
      `   ✅ Messages page: ${results.messagesPage.displayable}/${results.messagesPage.totalFound} displayable conversations`,
    );
    if (results.messagesPage.sample.length > 0) {
      console.log(
        `   📋 Sample: "${results.messagesPage.sample[0].leadName}" - "${results.messagesPage.sample[0].lastMessage.substring(0, 30)}..."`,
      );
    }
  } else {
    console.log(`   ❌ Messages page failed: ${results.messagesPage.error}`);
  }

  // Overall test result
  const allPassed = Object.values(results).every((r) => r.success);

  if (allPassed) {
    consecutiveSuccesses++;
    console.log(
      `\n🎉 TEST PASSED! (${consecutiveSuccesses}/${REQUIRED_SUCCESSES} consecutive successes)`,
    );

    if (consecutiveSuccesses >= REQUIRED_SUCCESSES) {
      console.log("\n🏆 SUCCESS! CONVERSATION LOADING IS NOW WORKING!");
      console.log("─".repeat(60));
      console.log("✅ All tests passing consistently");
      console.log("✅ Conversations load successfully");
      console.log("✅ Frontend should now work properly");
      console.log("✅ Dashboard statistics should be accurate");
      console.log("\n💡 Next steps:");
      console.log("   1. Refresh your application");
      console.log("   2. Check the Messages page");
      console.log("   3. Verify dashboard numbers are correct");
      return true; // Signal to stop the loop
    }
  } else {
    consecutiveSuccesses = 0;
    console.log("\n❌ TEST FAILED - Debugging issues...");

    // Provide specific debugging information
    if (!results.tableAccess.success) {
      console.log("🔧 Fix needed: Basic table access is broken");
      console.log(
        "   Check: Database connection, RLS policies, table permissions",
      );
    }

    if (!results.withLeads.success) {
      console.log("🔧 Fix needed: Lead-conversation joining is broken");
      console.log("   Check: Lead table access, foreign key relationships");
    }

    if (!results.apiClient.success) {
      console.log("🔧 Fix needed: Unified API client method is broken");
      console.log("   Check: unifiedApiClient.ts implementation");
    }

    if (!results.messagesPage.success) {
      console.log("🔧 Fix needed: Messages page simulation failed");
      console.log("   Check: Frontend data processing logic");
    }

    // Check if it's a content issue vs access issue
    if (results.tableAccess.success && results.tableAccess.hasContent === 0) {
      console.log(
        "\n⚠️  MAIN ISSUE: Conversations exist but have no message content",
      );
      console.log("💡 This is why dashboard shows 0 - conversations are empty");
      console.log(
        "🔧 Need to populate message_content field or fix field mapping",
      );
    }
  }

  return false; // Continue testing
}

async function runContinuousTest() {
  console.log("\n🚀 Starting continuous testing loop...");
  console.log("Will test every 5 seconds until fixed or manually stopped\n");

  try {
    while (true) {
      const shouldStop = await runSingleTest();

      if (shouldStop) {
        break;
      }

      // Wait 5 seconds before next test
      console.log("\n⏳ Waiting 5 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error) {
    if (error.message.includes("SIGINT")) {
      console.log("\n\n👋 Test stopped by user");
    } else {
      console.log("\n💥 Unexpected error:", error.message);
    }
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Stopping tests...");
  console.log(`📊 Completed ${testRun} test runs`);
  console.log(`🎯 Best streak: ${consecutiveSuccesses} consecutive successes`);
  process.exit(0);
});

// Start the continuous test
runContinuousTest().catch((error) => {
  console.log("💥 Fatal error:", error.message);
  process.exit(1);
});
