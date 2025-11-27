import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = Router();

// Bootstrap an ADMIN if none exists (no auth, idempotent)
router.post('/bootstrap-admin', async (_req, res) => {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', admin: { id: existingAdmin.id, email: existingAdmin.email } });
    }
    const admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@pato.local',
        // bcrypt hash for "password"
        password: '$2a$10$ZyFIH8zO8M1o7XlqvF7X9e4y6PjM1n6FvF2gJfS1iGd3i4v5Yt6xC',
        role: 'ADMIN',
      },
    });
    return res.json({ message: 'Admin created', admin: { id: admin.id, email: admin.email }, credentials: { email: 'admin@pato.local', password: 'password' } });
  } catch (e) {
    console.error('Bootstrap admin error', e);
    return res.status(500).json({ message: 'Failed to bootstrap admin' });
  }
});

// Admin-only seed endpoint to create sample data
router.post('/sample', auth(['ADMIN']), async (_req, res) => {
  try {
    // Ensure there is at least one admin (optional safeguard)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return res.status(400).json({ message: 'No ADMIN found. Call /api/seed/bootstrap-admin first.' });
    }

    // Upsert an instructor
    const instructor = await prisma.user.upsert({
      where: { email: 'instructor@comp-sci.edu' },
      update: {},
      create: {
        name: 'Instructor CompSci',
        email: 'instructor@comp-sci.edu',
        password: '$2a$10$ZyFIH8zO8M1o7XlqvF7X9e4y6PjM1n6FvF2gJfS1iGd3i4v5Yt6xC', // bcrypt hash for "password"
        role: 'INSTRUCTOR',
      },
    });

    // Upsert a student (User A)
    const student = await prisma.user.upsert({
      where: { email: 'user.a@student.edu' },
      update: {},
      create: {
        name: 'User A',
        email: 'user.a@student.edu',
        password: '$2a$10$ZyFIH8zO8M1o7XlqvF7X9e4y6PjM1n6FvF2gJfS1iGd3i4v5Yt6xC', // bcrypt hash for "password"
        role: 'STUDENT',
      },
    });

    // Create a few Computer Science assignments if not present
    const titles = [
      'Intro to Algorithms: Big-O Analysis',
      'Data Structures: Implement a Linked List',
      'Operating Systems: Process Scheduling Report',
      'Databases: Design an ER Diagram for a Library',
      'Networks: TCP vs UDP Comparison Essay',
    ];

    const createdAssignments = [];

    for (const title of titles) {
      // Avoid duplicates by title and instructor
      const existing = await prisma.assignment.findFirst({
        where: { title, instructorId: instructor.id },
      });
      if (!existing) {
        const assignment = await prisma.assignment.create({
          data: {
            title,
            description: `Assignment for ${title}. Please follow the instructions provided in class and submit before the due date.`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
            instructorId: instructor.id,
          },
        });
        createdAssignments.push(assignment);
      }
    }

    res.json({
      message: 'Sample data seeded successfully',
      admin: admin ? { id: admin.id, email: admin.email } : null,
      instructor: { id: instructor.id, email: instructor.email },
      student: { id: student.id, email: student.email },
      assignmentsCreated: createdAssignments.length,
    });
  } catch (e) {
    console.error('Seeding error', e);
    res.status(500).json({ message: 'Failed to seed sample data' });
  }
});

// Reset an existing admin's password (dev helper; unauthenticated)
router.post('/reset-admin-password', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const newPassword = password || 'password';

    // Find by email if provided, else first ADMIN
    let admin = null;
    if (email) {
      admin = await prisma.user.findUnique({ where: { email } });
      if (!admin || admin.role !== 'ADMIN') {
        return res.status(404).json({ message: 'Admin user not found with that email' });
      }
    } else {
      admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!admin) {
        return res.status(404).json({ message: 'No ADMIN user found' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: admin.id }, data: { password: hashed } });

    return res.json({ message: 'Admin password reset', email: admin.email, password: newPassword });
  } catch (e) {
    console.error('Reset admin password error', e);
    return res.status(500).json({ message: 'Failed to reset admin password' });
  }
});

// Promote a user to ADMIN by email (dev helper; unauthenticated)
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
    return res.json({ message: 'User promoted to ADMIN', email: updated.email, role: updated.role });
  } catch (e) {
    console.error('Make admin error', e);
    return res.status(500).json({ message: 'Failed to promote user' });
  }
});

export default router;
