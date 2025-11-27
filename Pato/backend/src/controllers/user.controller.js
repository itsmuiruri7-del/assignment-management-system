import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      // Exclude passwords from the result
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List all instructors (public)
// @route   GET /api/users/instructors
// @access  Public
const getInstructors = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List my students (for instructors)
// @route   GET /api/users/students
// @access  Private (Instructor)
const getMyStudents = async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { instructorId: req.user.id, role: 'STUDENT' },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin resets a user's password
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin)
const adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'newPassword is required and must be at least 6 characters' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({ where: { id }, data: { password: hashed } });
    res.json({ message: 'Password reset', id: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    User changes own password
// @route   POST /api/users/change-password
// @access  Private (Any authenticated user)
const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Password changed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { getAllUsers, getInstructors, getMyStudents, adminResetPassword, changeMyPassword };
