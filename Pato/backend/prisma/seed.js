const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create Instructors
  const instructor1 = await prisma.user.create({
    data: {
      name: 'Instructor One',
      email: 'inst1@example.com',
      password: hashedPassword,
      role: 'INSTRUCTOR',
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      name: 'Instructor Two',
      email: 'inst2@example.com',
      password: hashedPassword,
      role: 'INSTRUCTOR',
    },
  });

  // Create Students
  const student1 = await prisma.user.create({
    data: {
      name: 'Student One',
      email: 'student1@example.com',
      password: hashedPassword,
      role: 'STUDENT',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Student Two',
      email: 'student2@example.com',
      password: hashedPassword,
      role: 'STUDENT',
    },
  });

  // Create Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'History of Ancient Civilizations',
      description: 'Write a 10-page essay on the rise and fall of the Roman Empire.',
      dueDate: new Date('2025-12-15T23:59:59Z'),
      instructorId: instructor1.id,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Calculus II Problem Set',
      description: 'Complete all exercises in Chapter 5 of the textbook.',
      dueDate: new Date('2025-12-20T23:59:59Z'),
      instructorId: instructor2.id,
    },
  });

  // Create a Submission
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1.id,
      filePath: '/path/to/dummy/submission1.pdf',
      status: 'SUBMITTED',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
