#!/usr/bin/env node

/**
 * Add Test Data Script
 * Adds more projects and conversations for test@test.test user
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials
const credentialsPath = path.join(
  __dirname,
  "../credentials/supabase-credentials.local",
);
const credentials = fs.readFileSync(credentialsPath, "utf8");

const getCredential = (key) => {
  const line = credentials
    .split("\n")
    .find((line) => line.startsWith(`${key}=`));
  return line ? line.split("=")[1] : null;
};

const supabaseUrl = getCredential("SUPABASE_URL");
const serviceRoleKey = getCredential("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const testProjects = [
  {
    name: "E-commerce Platform",
    description: "Modern e-commerce solution with AI-powered recommendations",
    status: "active",
    priority: "high",
    industry: "Retail",
    budget_range: "$50,000 - $100,000",
    timeline: "6 months",
  },
  {
    name: "Healthcare Management System",
    description:
      "Comprehensive healthcare management platform with patient portal",
    status: "active",
    priority: "urgent",
    industry: "Healthcare",
    budget_range: "$100,000 - $250,000",
    timeline: "9 months",
  },
  {
    name: "Financial Dashboard",
    description: "Real-time financial analytics and reporting dashboard",
    status: "active",
    priority: "medium",
    industry: "Finance",
    budget_range: "$25,000 - $50,000",
    timeline: "4 months",
  },
  {
    name: "Educational Platform",
    description: "Online learning platform with interactive courses",
    status: "active",
    priority: "medium",
    industry: "Education",
    budget_range: "$75,000 - $150,000",
    timeline: "8 months",
  },
  {
    name: "IoT Monitoring System",
    description: "Industrial IoT monitoring and control system",
    status: "completed",
    priority: "low",
    industry: "Manufacturing",
    budget_range: "$150,000 - $300,000",
    timeline: "12 months",
  },
  {
    name: "Social Media Analytics",
    description: "AI-powered social media analytics and sentiment analysis",
    status: "active",
    priority: "high",
    industry: "Marketing",
    budget_range: "$30,000 - $60,000",
    timeline: "5 months",
  },
];

const testLeads = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@techcorp.com",
    phone: "+1-555-0123",
    company: "TechCorp Solutions",
    industry: "Technology",
    projectType: "Web Application",
    budgetRange: "$50,000 - $100,000",
    timeline: "6 months",
    requirements: "Need a modern web application with real-time features",
    status: "qualified",
    source: "Website",
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@innovate.io",
    phone: "+1-555-0124",
    company: "Innovate.io",
    industry: "Startup",
    projectType: "Mobile App",
    budgetRange: "$25,000 - $50,000",
    timeline: "4 months",
    requirements: "Cross-platform mobile app with offline capabilities",
    status: "new",
    source: "Referral",
  },
  {
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.rodriguez@healthplus.com",
    phone: "+1-555-0125",
    company: "HealthPlus",
    industry: "Healthcare",
    projectType: "Healthcare System",
    budgetRange: "$100,000 - $250,000",
    timeline: "9 months",
    requirements: "HIPAA-compliant patient management system",
    status: "contacted",
    source: "LinkedIn",
  },
  {
    firstName: "David",
    lastName: "Thompson",
    email: "david.thompson@financetech.com",
    phone: "+1-555-0126",
    company: "FinanceTech",
    industry: "Finance",
    projectType: "Dashboard",
    budgetRange: "$75,000 - $150,000",
    timeline: "6 months",
    requirements: "Real-time financial analytics dashboard",
    status: "qualified",
    source: "Google Ads",
  },
  {
    firstName: "Lisa",
    lastName: "Wang",
    email: "lisa.wang@edulearn.com",
    phone: "+1-555-0127",
    company: "EduLearn",
    industry: "Education",
    projectType: "Learning Platform",
    budgetRange: "$60,000 - $120,000",
    timeline: "8 months",
    requirements: "Interactive online learning platform with video streaming",
    status: "converted",
    source: "Website",
  },
  {
    firstName: "Robert",
    lastName: "Kim",
    email: "robert.kim@manufacturing.co",
    phone: "+1-555-0128",
    company: "Manufacturing Co",
    industry: "Manufacturing",
    projectType: "IoT System",
    budgetRange: "$150,000 - $300,000",
    timeline: "12 months",
    requirements: "Industrial IoT monitoring and predictive maintenance",
    status: "qualified",
    source: "Trade Show",
  },
];

const testMessages = [
  {
    content:
      "Hi! I'm interested in your web development services. Can we schedule a call?",
    sender: "lead",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    content:
      "Hello! Thank you for your interest. I'd be happy to discuss your project. What time works best for you?",
    sender: "agent",
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
  },
  {
    content:
      "How about tomorrow at 2 PM EST? We need a complete e-commerce solution.",
    sender: "lead",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
  {
    content:
      "Perfect! I'll send you a calendar invite. Could you share more details about your requirements?",
    sender: "agent",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    content:
      "We need product catalog, shopping cart, payment processing, and admin dashboard.",
    sender: "lead",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
];

async function findTestUser() {
  console.log("🔍 Finding test user...");

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", "test@test.test")
    .single();

  if (error) {
    console.error("❌ Error finding test user:", error);
    return null;
  }

  console.log("✅ Found test user:", users.email);
  return users;
}

async function findOrCreateClient(user) {
  console.log("🔍 Finding or creating client...");

  // Check if user has a client
  const { data: membership, error: memberError } = await supabase
    .from("client_members")
    .select(
      `
      client_id,
      clients(*)
    `,
    )
    .eq("user_id", user.id)
    .single();

  if (membership && membership.clients) {
    console.log("✅ Found existing client:", membership.clients.name);
    return membership.clients;
  }

  // Create a new client
  const { data: newClient, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: "Test Development Agency",
      status: "active",
    })
    .select()
    .single();

  if (clientError) {
    console.error("❌ Error creating client:", clientError);
    return null;
  }

  // Add user to client
  const { error: membershipError } = await supabase
    .from("client_members")
    .insert({
      client_id: newClient.id,
      user_id: user.id,
      role: "admin",
    });

  if (membershipError) {
    console.error("❌ Error creating client membership:", membershipError);
    return null;
  }

  console.log("✅ Created new client:", newClient.name);
  return newClient;
}

async function createTestProjects(client) {
  console.log("📁 Creating test projects...");

  const createdProjects = [];

  for (const project of testProjects) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...project,
        client_id: client.id,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating project:", project.name, error);
      continue;
    }

    console.log("✅ Created project:", data.name);
    createdProjects.push(data);
  }

  return createdProjects;
}

async function createTestLeads(projects) {
  console.log("👥 Creating test leads...");

  const createdLeads = [];

  for (let i = 0; i < testLeads.length; i++) {
    const lead = testLeads[i];
    const project = projects[i % projects.length]; // Distribute leads across projects

    const { data, error } = await supabase
      .from("leads")
      .insert({
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        industry: lead.industry,
        project_type: lead.projectType,
        budget_range: lead.budgetRange,
        timeline: lead.timeline,
        requirements: lead.requirements,
        status: lead.status,
        source: lead.source,
        project_id: project.id,
        current_project_id: project.id,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "❌ Error creating lead:",
        lead.firstName,
        lead.lastName,
        error,
      );
      continue;
    }

    console.log("✅ Created lead:", data.first_name, data.last_name);
    createdLeads.push(data);
  }

  return createdLeads;
}

async function createTestConversations(leads) {
  console.log("💬 Creating test conversations...");

  for (const lead of leads) {
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        lead_id: lead.id,
        status: "active",
        channel: "whatsapp",
        last_message_at: new Date(),
      })
      .select()
      .single();

    if (convError) {
      console.error(
        "❌ Error creating conversation for lead:",
        lead.first_name,
        convError,
      );
      continue;
    }

    // Create messages
    for (const message of testMessages) {
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        content: message.content,
        sender_type: message.sender,
        timestamp: message.timestamp,
        message_type: "text",
        status: "sent",
      });

      if (msgError) {
        console.error("❌ Error creating message:", msgError);
      }
    }

    console.log(
      "✅ Created conversation with",
      testMessages.length,
      "messages for:",
      lead.first_name,
    );
  }
}

async function main() {
  console.log("🚀 Starting test data creation...");

  try {
    // Find test user
    const user = await findTestUser();
    if (!user) {
      console.error(
        "❌ Test user not found. Please create test@test.test user first.",
      );
      process.exit(1);
    }

    // Find or create client
    const client = await findOrCreateClient(user);
    if (!client) {
      console.error("❌ Failed to create/find client");
      process.exit(1);
    }

    // Create test projects
    const projects = await createTestProjects(client);
    console.log(`✅ Created ${projects.length} projects`);

    // Create test leads
    const leads = await createTestLeads(projects);
    console.log(`✅ Created ${leads.length} leads`);

    // Create test conversations
    await createTestConversations(leads);
    console.log("✅ Created conversations and messages");

    console.log("\n🎉 Test data creation completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - User: ${user.email}`);
    console.log(`   - Client: ${client.name}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Leads: ${leads.length}`);
    console.log(`   - Conversations: ${leads.length}`);
    console.log(`   - Messages: ${leads.length * testMessages.length}`);
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    process.exit(1);
  }
}

// Run the script
main();
