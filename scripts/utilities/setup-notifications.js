#!/usr/bin/env node

/**
 * Setup Notifications System
 * This script creates the notifications table and sets up sample data
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const supabaseUrl =
  process.env.VITE_AGENT_DB_URL || process.env.VITE_MASTER_SUPABASE_URL;
const supabaseServiceKey =
  process.env.VITE_AGENT_DB_SERVICE_KEY ||
  process.env.VITE_MASTER_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - VITE_AGENT_DB_URL (or VITE_MASTER_SUPABASE_URL)");
  console.error(
    "   - VITE_AGENT_DB_SERVICE_KEY (or VITE_MASTER_SUPABASE_SERVICE_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupNotifications() {
  console.log("🔧 Setting up notifications system...");

  try {
    // Read and execute the migration SQL
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20250123_create_notifications_table.sql",
    );

    if (!fs.existsSync(migrationPath)) {
      console.error("❌ Migration file not found:", migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Creating notifications table...");
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (migrationError) {
      console.error("❌ Migration error:", migrationError);

      // Try creating the table directly if RPC doesn't work
      console.log("🔄 Trying direct table creation...");

      const createTableSQL = `
        -- Create notifications table
        CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            client_id UUID,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'lead', 'message', 'system', 'meeting')),
            read BOOLEAN DEFAULT false,
            action_url VARCHAR(500),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
      `;

      const { error: directError } = await supabase.rpc("exec_sql", {
        sql: createTableSQL,
      });

      if (directError) {
        console.log("⚠️ Table might already exist or need manual creation");
        console.log(
          "   You can run the migration manually in the Supabase SQL editor",
        );
      }
    }

    // Check if table exists and get some users
    console.log("👥 Checking for users...");
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return;
    }

    if (!users.users || users.users.length === 0) {
      console.log("⚠️ No users found. Create a user account first.");
      return;
    }

    console.log(`✅ Found ${users.users.length} user(s)`);

    // Create sample notifications for the first user
    const firstUser = users.users[0];
    console.log(
      `📧 Creating sample notifications for user: ${firstUser.email}`,
    );

    const sampleNotifications = [
      {
        user_id: firstUser.id,
        title: "Welcome to OvenAI!",
        message:
          "Your account has been successfully created. Start by adding your first lead or exploring the dashboard.",
        type: "success",
        metadata: { category: "onboarding", priority: "high" },
      },
      {
        user_id: firstUser.id,
        title: "New Lead Available",
        message:
          "A potential lead has been identified from your recent marketing campaign.",
        type: "lead",
        action_url: "/leads",
        metadata: { source: "marketing", campaign: "Q1_2024" },
      },
      {
        user_id: firstUser.id,
        title: "System Update",
        message:
          "OvenAI has been updated with new features including mobile optimization and RTL support.",
        type: "system",
        metadata: {
          version: "2.1.0",
          features: ["mobile_optimization", "rtl_support"],
        },
      },
      {
        user_id: firstUser.id,
        title: "WhatsApp Integration Ready",
        message:
          "Your WhatsApp integration is now active and ready to receive messages.",
        type: "message",
        action_url: "/whatsapp",
        metadata: { integration: "whatsapp", status: "active" },
      },
      {
        user_id: firstUser.id,
        title: "Weekly Report Available",
        message:
          "Your weekly performance report is ready for review. Check your dashboard for insights.",
        type: "info",
        action_url: "/reports",
        metadata: { report_type: "weekly", period: "current_week" },
      },
    ];

    const { data: insertedNotifications, error: insertError } = await supabase
      .from("notifications")
      .insert(sampleNotifications)
      .select();

    if (insertError) {
      console.error("❌ Error creating sample notifications:", insertError);
    } else {
      console.log(
        `✅ Created ${insertedNotifications.length} sample notifications`,
      );
    }

    // Test notification retrieval
    console.log("🧪 Testing notification retrieval...");
    const { data: testNotifications, error: testError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", firstUser.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (testError) {
      console.error("❌ Error testing notifications:", testError);
    } else {
      console.log(
        `✅ Successfully retrieved ${testNotifications.length} notifications`,
      );
      console.log("📋 Sample notifications:");
      testNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} (${notif.type})`);
      });
    }

    console.log("\n🎉 Notifications system setup complete!");
    console.log("📱 You can now:");
    console.log("   - View notifications in the app");
    console.log("   - Create new notifications via the service");
    console.log("   - Receive real-time updates");
    console.log("   - Test the notification center in the top bar");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run the setup
setupNotifications();
