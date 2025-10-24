#!/usr/bin/env node

/**
 * TEST CONVERSATION FIX
 * Quick test to verify conversation loading works after our fix
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

console.log("🧪 TESTING CONVERSATION FIX & DASHBOARD STATS");
console.log("═".repeat(80));

// Load credentials
function loadCredentials() {
  const paths = [
    "./supabase-credentials.local",
    "./credentials/supabase-credentials.local",
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      const content = readFileSync(path, "utf8");
      const credentials = {};
      content.split("\n").forEach((line) => {
        if (line.includes("=") && !line.startsWith("#")) {
          const [key, value] = line.split("=");
          credentials[key.trim()] = value.trim();
        }
      });
      return credentials;
    }
  }
  return null;
}

const credentials = loadCredentials();
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

async function testConversations() {
  console.log("\n💬 Testing Conversation Table Access...");
  console.log("─".repeat(60));

  try {
    // Test basic conversation access
    const {
      data: conversations,
      error,
      count,
    } = await supabase
      .from("conversations")
      .select("*", { count: "exact" })
      .limit(10);

    if (error) {
      console.log("❌ Conversation table access failed:", error.message);
      return { success: false, conversations: [] };
    }

    console.log(`✅ Conversation table access works!`);
    console.log(`📊 Total conversations: ${count}`);
    console.log(`📋 Retrieved: ${conversations.length} conversations`);

    if (conversations.length > 0) {
      const sample = conversations[0];
      console.log("\n📝 Sample conversation:");
      console.log(`   ID: ${sample.id}`);
      console.log(`   Lead ID: ${sample.lead_id}`);
      console.log(`   Content: ${sample.message_content?.substring(0, 50)}...`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Created: ${sample.created_at}`);
    }

    return { success: true, conversations };
  } catch (error) {
    console.log("💥 Unexpected error:", error.message);
    return { success: false, conversations: [] };
  }
}

async function testLeads() {
  console.log("\n👥 Testing Lead Table Access...");
  console.log("─".repeat(60));

  try {
    const {
      data: leads,
      error,
      count,
    } = await supabase.from("leads").select("*", { count: "exact" }).limit(10);

    if (error) {
      console.log("❌ Lead table access failed:", error.message);
      return { success: false, leads: [] };
    }

    console.log(`✅ Lead table access works!`);
    console.log(`📊 Total leads: ${count}`);
    console.log(`📋 Retrieved: ${leads.length} leads`);

    if (leads.length > 0) {
      const sample = leads[0];
      console.log("\n📝 Sample lead:");
      console.log(`   ID: ${sample.id}`);
      console.log(
        `   Name: ${sample.name || sample.first_name + " " + sample.last_name}`,
      );
      console.log(`   Email: ${sample.email}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Project ID: ${sample.current_project_id}`);
    }

    return { success: true, leads };
  } catch (error) {
    console.log("💥 Unexpected error:", error.message);
    return { success: false, leads: [] };
  }
}

async function testConversationFiltering() {
  console.log("\n🔍 Testing Conversation Filtering...");
  console.log("─".repeat(60));

  try {
    // Get leads first
    const { data: leads } = await supabase.from("leads").select("id").limit(1);

    if (!leads || leads.length === 0) {
      console.log("⚠️  No leads found to test conversation filtering");
      return;
    }

    const leadId = leads[0].id;
    console.log(`📋 Testing with lead ID: ${leadId}`);

    // Test conversation filtering by lead
    const { data: filteredConversations, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("lead_id", leadId);

    if (error) {
      console.log("❌ Conversation filtering failed:", error.message);
      return;
    }

    console.log(`✅ Conversation filtering works!`);
    console.log(
      `📊 Conversations for lead ${leadId}: ${filteredConversations.length}`,
    );
  } catch (error) {
    console.log("💥 Unexpected error:", error.message);
  }
}

async function calculateDashboardStats(conversations, leads) {
  console.log("\n📊 Calculating Dashboard Statistics...");
  console.log("─".repeat(60));

  try {
    // Basic stats
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter(
      (c) => c.status === "active",
    ).length;
    const totalLeads = leads.length;
    const activeLeads = leads.filter(
      (l) => l.status === "active" || l.status === "engaged",
    ).length;

    // Conversation stats by lead
    const conversationsByLead = {};
    conversations.forEach((conv) => {
      if (!conversationsByLead[conv.lead_id]) {
        conversationsByLead[conv.lead_id] = 0;
      }
      conversationsByLead[conv.lead_id]++;
    });

    const leadsWithConversations = Object.keys(conversationsByLead).length;
    const avgConversationsPerLead =
      leadsWithConversations > 0
        ? totalConversations / leadsWithConversations
        : 0;

    // Message content analysis
    const conversationsWithContent = conversations.filter(
      (c) => c.message_content && c.message_content.length > 0,
    ).length;
    const contentPercentage =
      totalConversations > 0
        ? (conversationsWithContent / totalConversations) * 100
        : 0;

    console.log("📈 Dashboard Statistics:");
    console.log(`   Total Conversations: ${totalConversations}`);
    console.log(`   Active Conversations: ${activeConversations}`);
    console.log(
      `   With Message Content: ${conversationsWithContent} (${contentPercentage.toFixed(1)}%)`,
    );
    console.log(`   Total Leads: ${totalLeads}`);
    console.log(`   Active Leads: ${activeLeads}`);
    console.log(`   Leads with Conversations: ${leadsWithConversations}`);
    console.log(
      `   Avg Conversations per Lead: ${avgConversationsPerLead.toFixed(1)}`,
    );

    // Identify potential issues
    console.log("\n🔍 Potential Issues:");
    if (totalConversations === 0) {
      console.log(
        "   ⚠️  No conversations found - this explains the 0 count in dashboard",
      );
    }
    if (contentPercentage < 50) {
      console.log(
        `   ⚠️  ${(100 - contentPercentage).toFixed(1)}% of conversations have no message content`,
      );
    }
    if (leadsWithConversations < totalLeads) {
      console.log(
        `   ℹ️  ${totalLeads - leadsWithConversations} leads have no conversations`,
      );
    }
  } catch (error) {
    console.log("💥 Error calculating stats:", error.message);
  }
}

async function main() {
  try {
    console.log("\n🚀 Starting tests...\n");

    // Test conversation access
    const conversationResult = await testConversations();

    // Test lead access
    const leadResult = await testLeads();

    // Test conversation filtering
    await testConversationFiltering();

    // Calculate dashboard statistics
    if (conversationResult.success && leadResult.success) {
      await calculateDashboardStats(
        conversationResult.conversations,
        leadResult.leads,
      );
    }

    console.log("\n🎯 SUMMARY:");
    console.log("─".repeat(60));
    console.log(
      `✅ Conversation fix: ${conversationResult.success ? "Working" : "Failed"}`,
    );
    console.log(`✅ Lead access: ${leadResult.success ? "Working" : "Failed"}`);

    if (conversationResult.success) {
      console.log("\n🎉 The conversation 400 errors should now be fixed!");
      console.log("💡 Next steps:");
      console.log("   1. Refresh your application");
      console.log("   2. Check the Messages page");
      console.log("   3. Verify dashboard statistics are accurate");
    } else {
      console.log("\n❌ Conversation access still has issues");
      console.log("💡 Try:");
      console.log("   1. Check database connection");
      console.log("   2. Verify RLS policies");
      console.log("   3. Check table permissions");
    }
  } catch (error) {
    console.log("💥 Fatal error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
