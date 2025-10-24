
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createUser() {
  try {
    console.log('Creating user...');
    
    // Find Self-Serve client
    const client = await prisma.client.findFirst({
      where: { name: 'Self-Serve' }
    });
    
    if (!client) {
      console.log('Self-Serve client not found, checking for any client...');
      const anyClient = await prisma.client.findFirst();
      
      if (!anyClient) {
        console.log('No clients found in the database. Creating default client...');
        const defaultClient = await prisma.client.create({
          data: {
            name: 'Self-Serve'
          }
        });
        console.log('Created default client:', defaultClient);
      }
    }
    
    // Get client ID (either found or newly created)
    const finalClient = await prisma.client.findFirst();
    
    if (!finalClient) {
      throw new Error('Failed to find or create a client');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin!1234', 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'amit.yogev@gmail.com' }
    });
    
    if (existingUser) {
      console.log('User already exists, updating password...');
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword,
          role: 'SUPER_ADMIN',
        }
      });
      console.log('Updated user:', updatedUser);
      return;
    }
    
    // Create user with SUPER_ADMIN role
    const user = await prisma.user.create({
      data: {
        email: 'amit.yogev@gmail.com',
        hashedPassword,
        name: 'Amit Yogev',
        role: 'SUPER_ADMIN',
        clientId: finalClient.id
      }
    });
    
    console.log('User created successfully:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
