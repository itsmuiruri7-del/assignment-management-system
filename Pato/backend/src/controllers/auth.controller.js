import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Generate JWT
const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id, role }, secret, {
    expiresIn: '30d',
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password, role, instructorId } = req.body;

  try {
    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role: allow only STUDENT or INSTRUCTOR from client; default STUDENT
    const normalizedRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

    // If student, require a valid instructorId mapping
    let instructorConnect = undefined;
    if (normalizedRole === 'STUDENT') {
      if (!instructorId) {
        return res.status(400).json({ message: 'instructorId is required for student registration' });
      }
      const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
      if (!instructor || instructor.role !== 'INSTRUCTOR') {
        return res.status(400).json({ message: 'Invalid instructorId' });
      }
      instructorConnect = instructorId;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole,
        instructorId: instructorConnect,
      },
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { register, login };
