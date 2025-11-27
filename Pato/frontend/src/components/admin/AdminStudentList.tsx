"use client";

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, Table, Alert, Button, Form, Row, Col, Spinner } from 'react-bootstrap';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const AdminStudentList: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users');
      setUsers(data || []);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Please provide a new password (min 6 characters).');
      return;
    }
    setError(null);
    setSuccess(null);
    setResettingId(userId);
    try {
      await api.post(`/users/${userId}/reset-password`, { newPassword });
      setSuccess('Password reset successfully');
      setNewPassword('');
    } catch (e) {
      setError('Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const students = users.filter(u => u.role === 'STUDENT');

  return (
    <Card className="mb-4">
      <Card.Header>
        <strong>Students</strong>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

        <Row className="mb-3">
          <Col sm={6}>
            <Form.Control
              type="password"
              placeholder="New password for reset"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Col>
          <Col sm="auto" className="d-flex align-items-center">
            <small className="text-muted">Select a student below and click Reset</small>
          </Col>
        </Row>

        {loading ? (
          <Spinner animation="border" />
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      disabled={resettingId === s.id}
                      onClick={() => onResetPassword(s.id)}
                    >
                      {resettingId === s.id ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">No students found.</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default AdminStudentList;
