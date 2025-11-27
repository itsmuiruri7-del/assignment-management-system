'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import api from '@/services/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' // Default role
  });
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [instructorId, setInstructorId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (role: 'STUDENT' | 'INSTRUCTOR') => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  // Load instructors for student registration
  React.useEffect(() => {
    if (formData.role === 'STUDENT') {
      (async () => {
        try {
          const { data } = await api.get('/users/instructors');
          setInstructors(data || []);
        } catch {
          // ignore
        }
      })();
    }
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.role === 'STUDENT' && !instructorId) {
      setError('Please select an instructor');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        instructorId: formData.role === 'STUDENT' ? instructorId : undefined,
      });
      router.push('/login?registered=true');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ae = err as any;
      console.error('Registration error:', ae);
      setError(ae?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Create an Account</h2>
                <p className="text-muted">Join our learning community</p>
              </div>

              {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>I am a</Form.Label>
                  <div className="d-flex gap-3">
                    <Button
                      variant={formData.role === 'STUDENT' ? 'primary' : 'outline-secondary'}
                      className="grow"
                      onClick={() => handleRoleChange('STUDENT')}
                      type="button"
                    >
                      Student
                    </Button>
                    <Button
                      variant={formData.role === 'INSTRUCTOR' ? 'primary' : 'outline-secondary'}
                      className="grow"
                      onClick={() => handleRoleChange('INSTRUCTOR')}
                      type="button"
                    >
                      Instructor
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" style={{ display: formData.role === 'STUDENT' ? 'block' : 'none' }}>
                  <Form.Label htmlFor="instructor-select">Select Instructor</Form.Label>
                  <select
                    id="instructor-select"
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    required={formData.role === 'STUDENT'}
                    title="Select your instructor"
                    aria-label="Select your instructor"
                    className="form-select"
                  >
                    <option value="">-- Choose an instructor --</option>
                    {instructors.map((ins) => (
                      <option value={ins.id} key={ins.id}>{ins.name} ({ins.email})</option>
                    ))}
                  </select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Create a password"
                  />
                  <Form.Text className="text-muted">
                    Must be at least 6 characters
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <Link href="/login" className="text-decoration-none">
                    Sign in
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
