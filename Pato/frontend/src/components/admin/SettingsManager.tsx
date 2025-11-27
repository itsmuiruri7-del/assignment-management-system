"use client";

import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Row, Col, Alert, Image } from 'react-bootstrap';
import { FaSave, FaUpload, FaDatabase } from 'react-icons/fa';
import api from '@/services/api';

interface AppSetting {
  id: string;
  name: string;
  logoUrl?: string | null;
  themePrimaryColor?: string | null;
  footerText?: string | null;
  footerColor?: string | null;
  createdAt: string;
  updatedAt: string;
}

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [name, setName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [themePrimaryColor, setThemePrimaryColor] = useState<string>('');
  const [themeError, setThemeError] = useState<string | null>(null);
  const [footerText, setFooterText] = useState<string>('');
  const [footerColor, setFooterColor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
      setName(res.data?.name || '');
      setLogoPreview(res.data?.logoUrl || null);
      setThemePrimaryColor(res.data?.themePrimaryColor || '');
      setFooterText(res.data?.footerText || '');
      setFooterColor(res.data?.footerColor || '');
    } catch (e) {
      setError('Failed to load settings');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.put('/settings', { name, themePrimaryColor, footerText, footerColor });
      setSuccess('Settings updated');
      await load();
    } catch (e) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const isValidHex = (s: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.trim());
  const isValidRgb = (s: string) => /^rgb\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(s.trim());
  const isValidColor = (s: string) => isValidHex(s) || isValidRgb(s) || s.trim() === '';

  const onSaveThemeFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setThemeError(null);

    if (!isValidColor(themePrimaryColor)) {
      setThemeError('Invalid color. Use hex (e.g. #0d6efd) or rgb(r,g,b)');
      return;
    }

    setLoading(true);
    try {
      await api.put('/settings', { name, themePrimaryColor, footerText, footerColor });
      setSuccess('Theme and footer updated');
      await load();
    } catch (e) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Live preview: apply the entered color immediately to CSS variables so admin can preview before saving
  useEffect(() => {
    if (!isValidColor(themePrimaryColor)) return;
    const root = document.documentElement;
    const color = themePrimaryColor.trim();
    if (color === '') {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--bs-primary');
      root.style.removeProperty('--brand-primary-rgb');
      root.style.removeProperty('--bs-primary-rgb');
      // notify listeners that theme was cleared
      // also clear footer preview when empty
      try { window.dispatchEvent(new CustomEvent('theme:changed', { detail: { color: null, footerColor: null } })); } catch {}
      return;
    }
    root.style.setProperty('--brand-primary', color);
    root.style.setProperty('--bs-primary', color);
    const rgb = hexToRgbComponents(color);
    if (rgb) {
      root.style.setProperty('--brand-primary-rgb', rgb);
      root.style.setProperty('--bs-primary-rgb', rgb);
    }
    // notify listeners that theme color changed (live preview)
    try { window.dispatchEvent(new CustomEvent('theme:changed', { detail: { color, footerColor } })); } catch {}
  }, [themePrimaryColor]);

  // live preview for footer color
  useEffect(() => {
    if (footerColor === '') return;
    if (!isValidColor(footerColor)) return;
    const root = document.documentElement;
    root.style.setProperty('--footer-bg', footerColor);
    const rgbF = hexToRgbComponents(footerColor);
    if (rgbF) {
      const [r,g,b] = rgbF.split(',').map(n => parseInt(n,10));
      const lum = relativeLuminance(r,g,b);
      const fg = lum > 0.5 ? '#000000' : '#ffffff';
      root.style.setProperty('--footer-foreground', fg);
    }
    try { window.dispatchEvent(new CustomEvent('theme:changed', { detail: { footerColor } })); } catch {}
  }, [footerColor]);

  function hexToRgbComponents(input: string): string | null {
    let hex = input.trim();
    if (hex.startsWith('rgb')) {
      const m = hex.match(/\(([^)]+)\)/);
      if (m && m[1]) return m[1].split(/\s*,\s*/).slice(0,3).join(',');
      return null;
    }
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return `${r},${g},${b}`;
  }

  function relativeLuminance(r: number, g: number, b: number) {
    const srgb = [r, g, b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  const onSelectLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const f = e.target.files[0];
    setLogoFile(f);
    const url = URL.createObjectURL(f);
    setLogoPreview(url);
  };

  const onUploadLogo = async () => {
    if (!logoFile) {
      setError('Please choose a logo image first');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      await api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Logo updated');
      setLogoFile(null);
      await load();
    } catch (e) {
      setError('Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const onSeedSample = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.post('/seed/sample');
      setSuccess(`Seeded sample data. Assignments created: ${res.data.assignmentsCreated}`);
    } catch (e) {
      setError('Failed to seed sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <strong>Application Settings</strong>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Form onSubmit={onSaveName} className="mb-4">
          <Form.Group as={Row} className="align-items-center">
            <Form.Label column sm={3}>
              Software Name
            </Form.Label>
            <Col sm={6}>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter software name"
              />
            </Col>
            <Col sm={3} className="text-sm-end mt-3 mt-sm-0">
              <Button type="submit" variant="primary" disabled={loading}>
                <FaSave className="me-2" /> Save
              </Button>
            </Col>
          </Form.Group>
        </Form>

        <Form onSubmit={onSaveThemeFooter} className="mb-4">
          <Row className="g-3 align-items-center">
            <Col sm={3}>
              <div className="fw-semibold">Theme Primary Color</div>
              <div className="text-muted small">Hex value (e.g., #0d6efd)</div>
            </Col>
            <Col sm={6}>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="text"
                  value={themePrimaryColor}
                  onChange={(e) => setThemePrimaryColor(e.target.value)}
                  placeholder="#0d6efd"
                />
                <input
                  type="color"
                  aria-label="Pick color"
                  value={isValidHex(themePrimaryColor) ? themePrimaryColor : '#000000'}
                  onChange={(e) => setThemePrimaryColor(e.target.value)}
                  style={{ width: 48, height: 36, border: 'none', padding: 0 }}
                />
                <div aria-hidden style={{ width: 40, height: 36, borderRadius: 4, border: '1px solid #ddd', background: isValidColor(themePrimaryColor) ? themePrimaryColor : 'transparent' }} />
              </div>
              {themeError && <div className="text-danger small mt-1">{themeError}</div>}
            </Col>
          </Row>
          <Row className="g-3 align-items-center mt-2">
            <Col sm={3}>
              <div className="fw-semibold">Footer Text</div>
            </Col>
            <Col sm={6}>
              <Form.Control
                as="textarea"
                rows={2}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="Enter footer text"
              />
            </Col>
              <Col sm={3} className="text-sm-end">
              <Button type="submit" variant="primary" disabled={loading}>
                <FaSave className="me-2" /> Save Theme & Footer
              </Button>
            </Col>
          </Row>

            <Row className="g-3 align-items-center mt-2">
              <Col sm={3}>
                <div className="fw-semibold">Footer Background Color</div>
              </Col>
              <Col sm={6}>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Control
                    type="text"
                    value={footerColor}
                    onChange={(e) => setFooterColor(e.target.value)}
                    placeholder="#000000 or rgb(0,0,0)"
                  />
                  <input
                    type="color"
                    aria-label="Pick footer color"
                    value={isValidHex(footerColor) ? footerColor : '#000000'}
                    onChange={(e) => setFooterColor(e.target.value)}
                    style={{ width: 48, height: 36, border: 'none', padding: 0 }}
                  />
                  <div aria-hidden style={{ width: 40, height: 36, borderRadius: 4, border: '1px solid #ddd', background: isValidColor(footerColor) ? footerColor : 'transparent' }} />
                </div>
              </Col>
              <Col sm={3} />
            </Row>
        </Form>

        <div className="mb-4">
          <Row className="align-items-center">
            <Col sm={3}>
              <div className="mb-2 fw-semibold">Logo</div>
              <div className="text-muted small">PNG/JPG/SVG up to 5MB</div>
            </Col>
            <Col sm={6} className="mb-3 mb-sm-0">
              <div className="d-flex align-items-center gap-3">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo preview" height={48} style={{ objectFit: 'contain' }} />
                ) : (
                  <div className="text-muted">No logo</div>
                )}
                <Form.Control type="file" accept="image/*" onChange={onSelectLogo} />
              </div>
            </Col>
            <Col sm={3} className="text-sm-end">
              <Button variant="secondary" onClick={onUploadLogo} disabled={loading || !logoFile}>
                <FaUpload className="me-2" /> Upload
              </Button>
            </Col>
          </Row>
        </div>

        <div className="border-top pt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">Sample Data</div>
              <div className="text-muted small">Create User A and Computer Science assignments</div>
            </div>
            <Button variant="outline-primary" onClick={onSeedSample} disabled={loading}>
              <FaDatabase className="me-2" /> Seed Sample Data
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SettingsManager;
