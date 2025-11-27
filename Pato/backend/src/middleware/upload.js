import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure submissions upload directory exists
const uploadsDir = path.join(__dirname, '../../uploads/submissions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Use original filename but sanitize and add timestamp prefix to avoid collisions
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'); // Remove special chars
    const timestamp = Date.now();
    cb(null, `${timestamp}_${sanitized}`);
  }
});

// Allow common document types (pdf, docx, images, zip) for submissions
const fileFilter = (_req, file, cb) => {
  const allowed = /pdf|doc|docx|txt|zip|jpeg|jpg|png|gif/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const typeOk = allowed.test(file.mimetype);
  if (extOk || typeOk) return cb(null, true);
  return cb(new Error('Unsupported file type'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

export default upload;
