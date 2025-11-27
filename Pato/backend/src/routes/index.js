import express from 'express';
import authRoutes from './auth.routes.js';
import assignmentRoutes from './assignment.routes.js';
import submissionRoutes from './submission.routes.js';
import userRoutes from './user.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GET /api - helpful root for the API
router.get('/', (req, res) => {
	res.json({ message: 'EduPlatform API - available endpoints: /auth, /assignments, /submissions, /users' });
});

// Basic health endpoint for clients to check connectivity
router.get('/health', (req, res) => {
	res.json({ status: 'ok', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/users', userRoutes);

// Download route that forces a file download (sets Content-Disposition: attachment)
router.get('/download/submissions/:filename', (req, res) => {
	try {
		const raw = req.params.filename || '';
		// sanitize filename to avoid directory traversal
		const filename = path.basename(raw);
		const filePath = path.join(__dirname, '..', '..', 'uploads', 'submissions', filename);
		return res.download(filePath, filename, (err) => {
			if (err) {
				console.error('Download error:', err);
				return res.status(404).json({ error: 'File not found' });
			}
		});
	} catch (e) {
		console.error('Download route error:', e);
		return res.status(500).json({ error: 'Internal error' });
	}
});

export default router;
