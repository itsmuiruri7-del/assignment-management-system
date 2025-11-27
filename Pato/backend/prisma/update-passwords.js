const { PrismaClient } = require('@prisma/client');

// Replace this with the target hash you provided
const TARGET_HASH = '$2y$10$Cp/W0DXXfJwjkno1bnIQue8eUYMQxSwpz.ftW9DQpO7f.nqpJwBqm';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all user passwords to the provided hash...');

  const result = await prisma.user.updateMany({
    data: {
      password: TARGET_HASH,
    },
  });

  console.log(`Updated ${result.count} user password(s).`);
}

main()
  .catch((e) => {
    console.error('Error updating passwords:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
