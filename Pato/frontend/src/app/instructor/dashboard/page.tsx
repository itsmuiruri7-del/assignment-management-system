'use client';

'use client';

import { useState } from 'react';
import withAuth from '@/components/auth/withAuth';
import CreateAssignmentForm from '@/components/assignments/CreateAssignmentForm';
import InstructorAssignmentList from '@/components/assignments/InstructorAssignmentList';
import MyStudents from '@/components/instructor/MyStudents';

const InstructorDashboard = () => {
  // This state can be used to trigger a re-render of an assignment list
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAssignmentCreated = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div>
      <h1 className="mb-4">Instructor Dashboard</h1>
      <p className="mb-4">Welcome! Use the form below to create a new assignment.</p>
      
      <CreateAssignmentForm onAssignmentCreated={handleAssignmentCreated} />

      <hr className="my-4" />

      <h2>Your Assignments</h2>
      <InstructorAssignmentList refreshKey={refreshKey} />

      <hr className="my-4" />

      <MyStudents />
    </div>
  );
};

// Protect this page and allow only 'INSTRUCTOR' role
export default withAuth(InstructorDashboard, ['INSTRUCTOR']);
