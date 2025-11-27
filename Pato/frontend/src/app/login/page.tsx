'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginImage, setLoginImage] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  // Check for registration success via location search (avoid `useSearchParams` in prerender)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
          setSuccess('Registration successful! Please log in.');
        }
      } catch (_err) {
        // ignore malformed URL
      }
    }
  }, []);

  // Fetch the active login screen image
  useEffect(() => {
    const fetchLoginImage = async () => {
      try {
        const response = await api.get('/login-screen-images/active');
        if (response.data) {
          setLoginImage(response.data.imageUrl);
        }
      } catch (err) {
        // swallow image load errors silently
      }
    };

    void fetchLoginImage();
  }, []);

  // Listen for admin uploads that change the active login image
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ imageUrl?: string }>;
      const newUrl = ce?.detail?.imageUrl;
      if (newUrl) setLoginImage(newUrl);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('login-screen:changed', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('login-screen:changed', handler as EventListener);
      }
    };
  }, []);

  // Fetch app settings (name) to display site name dynamically
  const [appName, setAppName] = useState<string>('EDU_Platform');
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.name) setAppName(res.data.name);
      } catch (_err) {
        // keep default
      }
    };
    void fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data as unknown;
      if (typeof data === 'object' && data !== null) {
        const d = data as Record<string, unknown>;
        const token = typeof d.token === 'string' ? d.token : '';
        const id = typeof d.id === 'string' ? d.id : (typeof d._id === 'string' ? d._id : '');
        const name = typeof d.name === 'string' ? d.name : '';
        const emailRes = typeof d.email === 'string' ? d.email : '';
        const role = typeof d.role === 'string' ? d.role : 'STUDENT';

        if (!token) {
          setError('Invalid login response from server');
          return;
        }

        // Ensure role matches allowed union type used by AuthContext
        const roleUnion = role === 'ADMIN' || role === 'INSTRUCTOR' || role === 'STUDENT' ? role : 'STUDENT';
        const normalizedUser = { id, name, email: emailRes, role: roleUnion } as { id: string; name: string; email: string; role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' };
        login(normalizedUser, token);

        // Redirect based on role
        if (normalizedUser.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (normalizedUser.role === 'INSTRUCTOR') {
          router.push('/instructor/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        setError('Invalid login response from server');
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ae = err as any;
      console.error('Login error:', ae);
      setError(ae?.response?.data?.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-sm">
              <Row className="g-0">
                {/* Login Form Column */}
                <Col md={6} className="p-4">
                  <Card.Body>
                    <div className="text-center mb-4">
                      <h2>Welcome Back</h2>
                      <p className="text-muted">Please sign in to continue</p>
                    </div>
                    
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="Enter your email"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4" controlId="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Enter your password"
                        />
                      </Form.Group>

                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 mb-3" 
                        disabled={loading}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>

                      <div className="text-center">
                        <Link href="/forgot-password" className="text-decoration-none small me-3">
                          Forgot password?
                        </Link>
                        <Link href="/register" className="text-decoration-none small">
                          Create an account
                        </Link>
                      </div>
                    </Form>
                  </Card.Body>
                </Col>
                
                {/* Image Column */}
                <Col 
                  md={6} 
                  className="d-none d-md-block p-0 login-image-section"
                  style={{
                    backgroundImage: loginImage ? `url(${loginImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <div 
                    className="login-image-overlay"
                  >
                    <div className="login-image-text-container">
                      <h2 className="mb-3">{appName}</h2>
                      <p className="mb-0">Empowering Education Through Technology</p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
