#!/usr/bin/env node

/**
 * ANALYZE CONVERSATION FIELDS
 * Check conversation table structure and fix field mapping issues
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

console.log("🔍 ANALYZING CONVERSATION FIELD MAPPING");
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
);

async function analyzeConversationFields() {
  console.log("\n📋 Analyzing conversation table structure...");
  console.log("─".repeat(60));

  try {
    // Get sample conversations to analyze structure
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .limit(10);

    if (error) {
      console.log("❌ Error fetching conversations:", error.message);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log("⚠️  No conversations found");
      return;
    }

    console.log(`📊 Analyzing ${conversations.length} conversations...`);

    // Analyze field structure
    const fields = Object.keys(conversations[0]);
    console.log(`\n📝 Available fields (${fields.length} total):`);

    fields.forEach((field) => {
      const populated = conversations.filter((conv) => {
        const value = conv[field];
        return value !== null && value !== undefined && value !== "";
      }).length;

      const percentage = ((populated / conversations.length) * 100).toFixed(1);
      const sample = conversations.find((conv) => conv[field])?.field;
      const sampleValue = sample ? String(sample).substring(0, 30) : "empty";

      console.log(
        `   ${field}: ${populated}/${conversations.length} (${percentage}%) - ${sampleValue}${sample && sample.length > 30 ? "..." : ""}`,
      );
    });

    // Look for message-related fields
    console.log("\n💬 Message-related fields analysis:");
    const messageFields = fields.filter(
      (field) =>
        field.toLowerCase().includes("message") ||
        field.toLowerCase().includes("content") ||
        field.toLowerCase().includes("text") ||
        field.toLowerCase().includes("body"),
    );

    messageFields.forEach((field) => {
      const withContent = conversations.filter(
        (conv) => conv[field] && conv[field].trim().length > 0,
      );
      console.log(`   ${field}: ${withContent.length} have content`);
      if (withContent.length > 0) {
        console.log(
          `      Sample: "${withContent[0][field].substring(0, 50)}..."`,
        );
      }
    });

    // Check for the actual message content
    console.log("\n📱 Looking for actual message data...");
    conversations.slice(0, 3).forEach((conv, index) => {
      console.log(`\nConversation ${index + 1} (ID: ${conv.id}):`);
      messageFields.forEach((field) => {
        if (conv[field]) {
          console.log(`   ${field}: "${conv[field].substring(0, 100)}..."`);
        }
      });
    });
  } catch (error) {
    console.log("💥 Error analyzing fields:", error.message);
  }
}

async function checkMessageTables() {
  console.log("\n📧 Checking related message tables...");
  console.log("─".repeat(60));

  try {
    // Check for whatsapp_messages table
    const { data: messages, error: messagesError } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .limit(5);

    if (!messagesError && messages) {
      console.log(
        `✅ whatsapp_messages table found: ${messages.length} sample records`,
      );
      if (messages.length > 0) {
        console.log("   Sample message fields:");
        Object.keys(messages[0]).forEach((field) => {
          const value = messages[0][field];
          if (value && typeof value === "string" && value.length > 10) {
            console.log(`     ${field}: "${value.substring(0, 50)}..."`);
          } else {
            console.log(`     ${field}: ${value}`);
          }
        });
      }
    } else {
      console.log("⚠️  whatsapp_messages table not accessible or empty");
    }

    // Check for messages table
    const { data: genericMessages, error: genericError } = await supabase
      .from("messages")
      .select("*")
      .limit(5);

    if (!genericError && genericMessages) {
      console.log(
        `✅ messages table found: ${genericMessages.length} sample records`,
      );
    } else {
      console.log("⚠️  messages table not accessible or empty");
    }
  } catch (error) {
    console.log("💥 Error checking message tables:", error.message);
  }
}

async function suggestFieldMapping() {
  console.log("\n💡 Field Mapping Suggestions...");
  console.log("─".repeat(60));

  try {
    // Get conversations with various field combinations
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        "id, message_content, content, text, body, sender_number, receiver_number, status, lead_id",
      )
      .limit(20);

    if (error) {
      console.log("❌ Error:", error.message);
      return;
    }

    // Analyze which field has the most content
    const fieldAnalysis = {
      message_content: 0,
      content: 0,
      text: 0,
      body: 0,
    };

    conversations.forEach((conv) => {
      Object.keys(fieldAnalysis).forEach((field) => {
        if (conv[field] && conv[field].trim().length > 0) {
          fieldAnalysis[field]++;
        }
      });
    });

    console.log("📊 Field content analysis:");
    Object.entries(fieldAnalysis).forEach(([field, count]) => {
      const percentage = ((count / conversations.length) * 100).toFixed(1);
      console.log(
        `   ${field}: ${count}/${conversations.length} (${percentage}%)`,
      );
    });

    // Find the best field for message content
    const bestField = Object.entries(fieldAnalysis).reduce(
      (best, [field, count]) => (count > best[1] ? [field, count] : best),
    );

    if (bestField[1] > 0) {
      console.log(
        `\n✅ Recommended field for message content: ${bestField[0]}`,
      );
      console.log(
        `💡 Suggestion: Update unifiedApiClient to use '${bestField[0]}' instead of 'message_content'`,
      );
    } else {
      console.log("\n⚠️  No field contains substantial message content");
      console.log(
        "💡 This suggests messages might be stored in a separate table",
      );
    }
  } catch (error) {
    console.log("💥 Error in field mapping analysis:", error.message);
  }
}

async function main() {
  try {
    await analyzeConversationFields();
    await checkMessageTables();
    await suggestFieldMapping();

    console.log("\n🎯 SUMMARY & NEXT STEPS:");
    console.log("─".repeat(60));
    console.log("1. Check the field analysis above");
    console.log(
      "2. If a different field has content, update unifiedApiClient field mapping",
    );
    console.log(
      "3. If messages are in separate table, update conversation loading logic",
    );
    console.log("4. Test dashboard statistics after field mapping fix");
    console.log("\n🔧 The conversation 400 errors are already fixed!");
    console.log(
      "📊 Now we just need to fix the field mapping for proper content display",
    );
  } catch (error) {
    console.log("💥 Fatal error:", error.message);
  }
}

main().catch(console.error);
