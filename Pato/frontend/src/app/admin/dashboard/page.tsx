'use client';

import React from 'react';
import { Container } from 'react-bootstrap';
import LoginScreenManager from '@/components/admin/LoginScreenManager';
import SettingsManager from '@/components/admin/SettingsManager';
import AdminStudentList from '@/components/admin/AdminStudentList';

const AdminDashboard = () => {
  return (
    <Container className="py-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      <SettingsManager />
      <AdminStudentList />
      <LoginScreenManager />
    </Container>
  );
};

export default AdminDashboard;
