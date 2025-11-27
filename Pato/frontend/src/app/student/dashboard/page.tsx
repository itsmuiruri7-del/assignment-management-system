'use client';

import withAuth from '@/components/auth/withAuth';
import AssignmentList from '@/components/assignments/AssignmentList';

const StudentDashboard = () => {
  return (
    <div>
      <h1 className="mb-4">Student Dashboard</h1>
      <p className="mb-4">Welcome! Here are the assignments available for you.</p>
      <AssignmentList />
    </div>
  );
};

// Protect this page and allow only 'STUDENT' role
export default withAuth(StudentDashboard, ['STUDENT']);
