import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All 6 users that need password updates
const usersToUpdate = [
  'Patrick@patoh.com',
  'patoh@example.com',
  'kimanijj@gmail.com',
  'instructor@comp-sci.edu',
  'user.a@student.edu',
  'user1@gmail.com'
];

const NEW_PASSWORD = '123456';

async function updateAllPasswords() {
  try {
    console.log('Starting password update for all users...\n');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('Generated password hash');
    
    // Update each user
    for (const email of usersToUpdate) {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          console.log(`❌ User not found: ${email}`);
          continue;
        }
        
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        
        console.log(`✅ Password updated for: ${email}`);
      } catch (err) {
        console.log(`❌ Error updating ${email}:`, err.message);
      }
    }
    
    console.log('\n✅ Password update completed!');
    console.log(`All users now have password: ${NEW_PASSWORD}`);
    
    // Verify by listing all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log('\nCurrent users in database:');
    console.table(allUsers);
    
  } catch (err) {
    console.error('Error during password update:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllPasswords();
