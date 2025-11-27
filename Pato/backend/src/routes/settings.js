import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const router = Router();

// Ensure logos directory exists (resolve relative to backend/src)
const logosDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Multer for logo uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, logosDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|svg/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const typeOk = allowed.test(file.mimetype);
    if (extOk && typeOk) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function getSingletonSettings() {
  let setting = await prisma.appSetting.findFirst();
  if (!setting) {
    // Use canonical default name
    setting = await prisma.appSetting.create({ data: { name: 'EDU_Platform' } });
  }
  return setting;
}

function normalizeAndValidateColor(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  // Allow rgb(...) as-is (basic validation)
  if (/^rgb\s*\(/i.test(s)) {
    const m = s.match(/\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10));
    if (parts.length < 3 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return `rgb(${parts[0]},${parts[1]},${parts[2]})`;
  }
  if (s.startsWith('#')) s = s.slice(1);
  // Accept 3 or 6 hex digits
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s.split('').map(c => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return `#${s.toLowerCase()}`;
}

// Get current settings
router.get('/', async (req, res) => {
  try {
    const setting = await getSingletonSettings();
    let logoUrl = setting.logoUrl;
    if (logoUrl) {
      // Build absolute URL using request protocol and host
      const host = req.get('host');
      const proto = req.protocol;
      if (!logoUrl.startsWith('http')) {
        logoUrl = `${proto}://${host}${logoUrl}`;
      }
    }
    res.json({
      ...setting,
      logoUrl,
    });
  } catch (e) {
    console.error('Error fetching settings', e);
    res.status(500).json({ message: 'Failed to load settings' });
  }
});

// Update settings (ADMIN)
router.put('/', auth(['ADMIN']), async (req, res) => {
  try {
    const { name, themePrimaryColor, footerText, footerColor } = req.body;
    const current = await getSingletonSettings();
    const data = {};
    if (typeof name === 'string' && name.trim().length) data.name = name.trim();
    if (typeof themePrimaryColor === 'string') {
      const normalized = normalizeAndValidateColor(themePrimaryColor);
      if (!normalized) return res.status(400).json({ message: 'Invalid color format for themePrimaryColor' });
      data.themePrimaryColor = normalized;
    }
    if (typeof footerColor === 'string') {
      const normalizedFooter = normalizeAndValidateColor(footerColor);
      if (!normalizedFooter) return res.status(400).json({ message: 'Invalid color format for footerColor' });
      data.footerColor = normalizedFooter;
    }
    if (typeof footerText === 'string') data.footerText = footerText;
    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No valid fields to update' });
    const updated = await prisma.appSetting.update({ where: { id: current.id }, data });
    res.json(updated);
  } catch (e) {
    console.error('Error updating settings', e);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Upload/replace logo (ADMIN)
router.post('/logo', auth(['ADMIN']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Logo file is required' });
    }
    const publicUrl = `/uploads/logos/${req.file.filename}`;
    const current = await getSingletonSettings();
    const updated = await prisma.appSetting.update({ where: { id: current.id }, data: { logoUrl: publicUrl } });
    res.json(updated);
  } catch (e) {
    console.error('Error uploading logo', e);
    res.status(500).json({ message: 'Failed to upload logo' });
  }
});

export default router;
