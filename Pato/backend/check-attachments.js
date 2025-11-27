import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const assignments = await prisma.assignment.findMany({
      select: {
        id: true,
        title: true,
        attachmentUrl: true,
        instructor: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('\n=== Assignments with Attachments ===\n');
    if (assignments.length === 0) {
      console.log('No assignments found.');
    } else {
      assignments.forEach((a) => {
        console.log(`ID: ${a.id}`);
        console.log(`Title: ${a.title}`);
        console.log(`Instructor: ${a.instructor.name}`);
        console.log(`Attachment URL: ${a.attachmentUrl || '(none)'}`);
        console.log('---');
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
