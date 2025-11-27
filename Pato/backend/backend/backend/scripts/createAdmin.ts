import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const adminData = {
    name: 'patoh',
    email: 'patoh@example.com',
    password: 'patoh',
    role: 'ADMIN' as Role
  };

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminData.password, salt);

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role
      }
    });

    console.log('Admin user created successfully:');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdmin();
