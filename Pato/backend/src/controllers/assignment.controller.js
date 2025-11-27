import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Instructor)
const createAssignment = async (req, res) => {
  const { title, description, dueDate } = req.body;
  const instructorId = req.user.id;

  try {
    // If attachment uploaded, compute public URL
    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/assignments/${req.file.filename}`;
    }
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        instructorId,
        attachmentUrl,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private (All roles)
const getAllAssignments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const skip = (page - 1) * pageSize;

    const [total, assignments] = await Promise.all([
      prisma.assignment.count(),
      prisma.assignment.findMany({
        include: {
          instructor: {
            select: { name: true },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        skip,
        take: pageSize,
      }),
    ]);
    res.json({ items: assignments, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all submissions for a specific assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Instructor for the assignment, Admin)
const getSubmissionsForAssignment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Authorization check: Allow admin or the specific instructor
    if (userRole !== 'ADMIN' && assignment.instructorId !== userId) {
      return res.status(403).json({ message: 'User not authorized to view these submissions' });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        student: { select: { name: true, email: true } },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all assignments for the logged-in instructor
// @route   GET /api/assignments/my-assignments
// @access  Private (Instructor)
const getMyAssignments = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        instructorId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all assignments (for Admin)
// @route   GET /api/assignments/all
// @access  Private (Admin)
const getAllAssignmentsAdmin = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        instructor: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { getAllAssignments, createAssignment, getSubmissionsForAssignment, getMyAssignments, getAllAssignmentsAdmin };
