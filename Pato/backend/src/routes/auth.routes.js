import express from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// Helpful GET handler for browser visits or accidental GETs
router.get('/login', (req, res) => {
	res.status(405).json({ message: 'Use POST /api/auth/login with { email, password } to authenticate.' });
});

export default router;
