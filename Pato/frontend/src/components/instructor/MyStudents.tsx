"use client";

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, Table, Spinner, Alert } from 'react-bootstrap';

interface StudentRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const MyStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users/students');
      setStudents(data || []);
    } catch (_e) {
      setError('Failed to load your students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card className="mb-4">
      <Card.Header>
        <strong>My Students</strong>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <Spinner animation="border" />
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-muted">No students enrolled yet.</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default MyStudents;
