import express from 'express';
import { getAllAssignments, createAssignment, getSubmissionsForAssignment, getMyAssignments, getAllAssignmentsAdmin } from '../controllers/assignment.controller.js';
import { protect } from '../middleware/protect.js';
import { authorize } from '../middleware/role.js';
import assignmentUpload from '../middleware/assignmentUpload.js';
import multer from 'multer';

const router = express.Router();

// @route   GET api/assignments
// @desc    Get all assignments
// @access  Private (Student, Instructor, Admin)
router.get('/', protect, authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'), getAllAssignments);

// @route   GET api/assignments/my-assignments
// @desc    Get all assignments for the logged-in instructor
// @access  Private (Instructor)
router.get('/my-assignments', protect, authorize('INSTRUCTOR'), getMyAssignments);

// @route   POST api/assignments
// @desc    Create a new assignment
// @access  Private (Instructor)
// Wrap multer upload so we can capture Multer errors and return helpful messages
router.post('/', protect, authorize('INSTRUCTOR'), (req, res, next) => {
	assignmentUpload.single('attachment')(req, res, (err) => {
		if (err) {
			if (err instanceof multer.MulterError) {
				return res.status(400).json({ message: err.message });
			}
			return res.status(400).json({ message: err.message || 'Upload failed' });
		}
		next();
	});
}, createAssignment);

// @route   GET api/assignments/:id/submissions
// @desc    Get all submissions for a specific assignment
// @access  Private (Instructor, Admin)
router.get('/:id/submissions', protect, authorize('INSTRUCTOR', 'ADMIN'), getSubmissionsForAssignment);

// @route   GET api/assignments/all
// @desc    Get all assignments (for Admin)
// @access  Private (Admin)
router.get('/all', protect, authorize('ADMIN'), getAllAssignmentsAdmin);

export default router;
