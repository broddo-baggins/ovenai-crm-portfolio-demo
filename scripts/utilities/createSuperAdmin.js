// This script creates a new super admin user or updates an existing one
// Run with: node scripts/createSuperAdmin.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log("Creating super admin user...");

    // Default client - either find OvenAI HQ or first available client
    const defaultClient = await prisma.client.upsert({
      where: { name: "OvenAI HQ" },
      update: {},
      create: {
        name: "OvenAI HQ",
      },
    });

    const email = "admin@super-admin.com";
    const password = "SuperAdmin!234"; // This is a clear password we can use for testing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });
      console.log(`Updated super admin user: ${updatedUser.email}`);
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          hashedPassword,
          name: "Super Admin",
          role: "SUPER_ADMIN",
          clientId: defaultClient.id,
          status: "ACTIVE",
        },
      });
      console.log(`Created new super admin user: ${newUser.email}`);
    }

    console.log("Super admin credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
