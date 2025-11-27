import express from 'express';
import { getAllUsers, getInstructors, getMyStudents, adminResetPassword, changeMyPassword } from '../controllers/user.controller.js';
import { protect } from '../middleware/protect.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, authorize('ADMIN'), getAllUsers);

// @route   GET api/users/instructors
// @desc    Public list of instructors (for registration mapping)
// @access  Public
router.get('/instructors', getInstructors);

// @route   GET api/users/students
// @desc    Get students mapped to the logged-in instructor
// @access  Private (Instructor)
router.get('/students', protect, authorize('INSTRUCTOR'), getMyStudents);

// @route   POST api/users/:id/reset-password
// @desc    Admin resets any user's password
// @access  Private (Admin)
router.post('/:id/reset-password', protect, authorize('ADMIN'), adminResetPassword);

// @route   POST api/users/change-password
// @desc    User changes own password
// @access  Private (Any)
router.post('/change-password', protect, changeMyPassword);

export default router;
