import express from 'express';
import { createSubmission, getMySubmissions, gradeSubmission, getAllSubmissionsAdmin } from '../controllers/submission.controller.js';
import { protect } from '../middleware/protect.js';
import { authorize } from '../middleware/role.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   POST api/submissions
// @desc    Create a new submission for an assignment
// @access  Private (Student)
// @route   GET api/submissions/me
// @desc    Get all submissions for the logged-in student
// @access  Private (Student)
router.get('/me', protect, authorize('STUDENT'), getMySubmissions);

router.post('/', protect, authorize('STUDENT'), upload.single('file'), createSubmission);

// @route   PUT api/submissions/:id/grade
// @desc    Grade a submission
// @access  Private (Instructor)
router.put('/:id/grade', protect, authorize('INSTRUCTOR'), gradeSubmission);

// @route   GET api/submissions/all
// @desc    Get all submissions (for Admin)
// @access  Private (Admin)
router.get('/all', protect, authorize('ADMIN'), getAllSubmissionsAdmin);

export default router;
