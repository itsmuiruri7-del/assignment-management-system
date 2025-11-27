const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'temp.student@example.com';
  const password = 'TempPass123!';
  const name = 'Temp Student';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', existing.id);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'STUDENT'
    }
  });

  console.log('Created temp student:', { id: user.id, email: user.email, password });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
