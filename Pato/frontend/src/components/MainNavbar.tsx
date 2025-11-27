'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import api from '@/services/api';

export default function MainNavbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [appName, setAppName] = useState<string>('EDU_Platform');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'INSTRUCTOR':
        return '/instructor/dashboard';
      case 'STUDENT':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setAppName(res.data.name || 'EDU_Platform');
          setLogoUrl(res.data.logoUrl || null);
        }
      } catch (_e) {
        // keep defaults on error
      }
    };
    fetchSettings();
  }, []);

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} href="/" className="navbar-brand-custom">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={appName}
              height={36}
              className="navbar-logo"
            />
          )}
          <span className="navbar-brand-text">{appName}</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {mounted && (
              <>
                {loading ? (
                  <Nav.Link disabled>Loading...</Nav.Link>
                ) : user ? (
                  <>
                    <Nav.Link as={Link} href={getDashboardLink()}>Dashboard</Nav.Link>
                    <Button variant="outline-light" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Nav.Link as={Link} href="/login">Login</Nav.Link>
                    <Nav.Link as={Link} href="/register">Register</Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
