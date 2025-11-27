import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all submissions for the logged-in student
// @route   GET /api/submissions/me
// @access  Private (Student)
const getMySubmissions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const skip = (page - 1) * pageSize;

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where: { studentId: req.user.id } }),
      prisma.submission.findMany({
      where: {
        studentId: req.user.id,
      },
      orderBy: {
        submittedAt: 'desc',
      },
        skip,
        take: pageSize,
      }),
    ]);
    res.json({ items: submissions, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Create a new submission for an assignment
// @route   POST /api/submissions
// @access  Private (Student)
const createSubmission = async (req, res) => {
  const { assignmentId } = req.body;
  const studentId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  try {
    // Check if a submission already exists for this student and assignment
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
    });

    if (existingSubmission && existingSubmission.status === 'GRADED') {
      return res.status(400).json({ message: 'This assignment has already been graded. Resubmission is not allowed.' });
    }

    let submission;
    if (existingSubmission) {
      // Resubmission allowed if not graded: replace file and reset status/marks/feedback
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          filePath: req.file.path,
          status: 'SUBMITTED',
          marks: null,
          feedback: null,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId,
          filePath: req.file.path,
        },
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Instructor)
const gradeSubmission = async (req, res) => {
  const { id } = req.params;
  const { marks, feedback } = req.body;
  const instructorId = req.user.id;

  try {
    // First, find the submission and its related assignment
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: true },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Authorization: Check if the logged-in user is the instructor for this assignment
    if (submission.assignment.instructorId !== instructorId) {
      return res.status(403).json({ message: 'You are not authorized to grade this submission' });
    }

    // Update the submission
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        marks: parseInt(marks, 10),
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    });

    res.json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all submissions (for Admin)
// @route   GET /api/submissions/all
// @access  Private (Admin)
const getAllSubmissionsAdmin = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const skip = (page - 1) * pageSize;

    const [total, submissions] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.findMany({
      include: {
        student: { select: { name: true } },
        assignment: { select: { title: true } },
      },
      orderBy: {
        submittedAt: 'desc',
      },
        skip,
        take: pageSize,
      }),
    ]);
    res.json({ items: submissions, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { createSubmission, getMySubmissions, gradeSubmission, getAllSubmissionsAdmin };
