import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const prisma = new PrismaClient();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/login-screens');
try {
  await fs.mkdir(uploadDir, { recursive: true });
  // Upload directory ready (silent in production)
} catch (err) {
  console.error('Error creating upload directory:', err);
}

// Get all login screen images
router.get('/', async (req, res) => {
  try {
    const images = await prisma.loginScreenImage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Normalize imageUrl to absolute URLs so frontend can load them directly
    const host = req.get('host');
    const proto = req.protocol;
    const normalized = images.map(img => {
      let imageUrl = img.imageUrl || '';
      if (!imageUrl.startsWith('http')) {
        imageUrl = `${proto}://${host}${imageUrl}`;
      }
      return { ...img, imageUrl };
    });
    res.json(normalized);
  } catch (error) {
    console.error('Error fetching login screen images:', error);
    res.status(500).json({ error: 'Failed to fetch login screen images' });
  }
});

// Get active login screen image
router.get('/active', async (req, res) => {
  try {
    const activeImage = await prisma.loginScreenImage.findFirst({
      where: { isActive: true }
    });
    if (!activeImage) return res.json(null);
    let imageUrl = activeImage.imageUrl || '';
    if (!imageUrl.startsWith('http')) {
      const host = req.get('host');
      const proto = req.protocol;
      imageUrl = `${proto}://${host}${imageUrl}`;
    }
    res.json({ ...activeImage, imageUrl });
  } catch (error) {
    console.error('Error fetching active login screen image:', error);
    res.status(500).json({ error: 'Failed to fetch active login screen image' });
  }
});

// Upload new login screen image (admin only)
router.post(
  '/',
  auth(['ADMIN']),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { name, description } = req.body;
      const imageUrl = `/uploads/login-screens/${req.file.filename}`;

      // Make the newly uploaded image the active one by default
      // (set any existing active images to inactive first)
      try {
        await prisma.loginScreenImage.updateMany({ where: { isActive: true }, data: { isActive: false } });
      } catch (e) {
        // ignore if none exist
      }

      const newImage = await prisma.loginScreenImage.create({
        data: {
          name,
          description: description || '',
          imageUrl,
          isActive: true
        }
      });

      // Return created record with absolute URL
      const host = req.get('host');
      const proto = req.protocol;
      const publicImageUrl = imageUrl.startsWith('http') ? imageUrl : `${proto}://${host}${imageUrl}`;
      res.status(201).json({ ...newImage, imageUrl: publicImageUrl });
    } catch (error) {
      console.error('Error uploading login screen image:', error);
      res.status(500).json({ error: 'Failed to upload login screen image' });
    }
  }
);

// Set active login screen image (admin only)
router.patch(
  '/:id/activate',
  auth(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // First, set all images to inactive
      await prisma.loginScreenImage.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Then set the selected image as active
      const updatedImage = await prisma.loginScreenImage.update({
        where: { id },
        data: { isActive: true }
      });

      res.json(updatedImage);
    } catch (error) {
      console.error('Error activating login screen image:', error);
      res.status(500).json({ error: 'Failed to activate login screen image' });
    }
  }
);

// Delete login screen image (admin only)
router.delete(
  '/:id',
  auth(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the image to delete
      const image = await prisma.loginScreenImage.findUnique({ where: { id } });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Delete the image file
      const filePath = path.join(__dirname, '../..', image.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting image file:', err);
        // Continue even if file deletion fails
      }

      // Delete the database record
      await prisma.loginScreenImage.delete({ where: { id } });

      // If the deleted image was active, set another one as active
      if (image.isActive) {
        const firstImage = await prisma.loginScreenImage.findFirst();
        if (firstImage) {
          await prisma.loginScreenImage.update({
            where: { id: firstImage.id },
            data: { isActive: true }
          });
        }
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting login screen image:', error);
      res.status(500).json({ error: 'Failed to delete login screen image' });
    }
  }
);

export default router;
