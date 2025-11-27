import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        filePath: true,
        assignment: {
          select: {
            title: true,
          },
        },
        student: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('\n=== Submissions ===\n');
    submissions.forEach((s) => {
      console.log(`ID: ${s.id}`);
      console.log(`Student: ${s.student.name}`);
      console.log(`Assignment: ${s.assignment.title}`);
      console.log(`File Path: ${s.filePath}`);
      console.log('---');
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
