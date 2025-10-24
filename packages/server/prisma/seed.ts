import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create default "OvenAI HQ" client
  const defaultClient = await prisma.client.upsert({
    where: { id: 'default-client' },
    update: { name: 'OvenAI HQ' },
    create: {
      id: 'default-client',
      name: 'OvenAI HQ'
    }
  });
  
  console.log('Created default client:', defaultClient);

  // Create self-serve client
  const selfServeClient = await prisma.client.upsert({
    where: { id: 'self-serve-client' },
    update: { name: 'Self-Serve' },
    create: {
      id: 'self-serve-client',
      name: 'Self-Serve'
    }
  });
  
  console.log('Created self-serve client:', selfServeClient);
  
  // Get admin credentials from environment variables
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@your-domain.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin!234';
  
  // Check if a SUPER_ADMIN already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });
  
  if (!existingAdmin) {
    // Create super admin user with bcrypt hashed password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const superAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        hashedPassword,
        role: 'SUPER_ADMIN',
        clientId: defaultClient.id,
        name: 'Super Admin',
        status: UserStatus.ACTIVE, // Make sure the admin is ACTIVE by default
      }
    });
    
    console.log('Created super admin user:', superAdmin);
  } else {
    console.log('Super admin already exists, skipping creation');
  }
  
  console.log('Database seeding completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
