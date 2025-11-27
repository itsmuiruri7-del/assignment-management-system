const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
    take: 50,
  });

  console.log('Users:');
  users.forEach((u, i) => {
    console.log(`${i + 1}. id=${u.id} email=${u.email} role=${u.role}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
