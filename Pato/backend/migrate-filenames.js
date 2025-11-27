import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function migrateFilenames() {
  try {
    console.log('Starting filename migration...\n');

    // Get all assignments with attachments
    const assignments = await prisma.assignment.findMany({
      where: {
        attachmentUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        attachmentUrl: true,
      },
    });

    console.log(`Found ${assignments.length} assignments with attachments\n`);

    const uploadsDir = path.join(__dirname, 'uploads', 'assignments');
    let renamedCount = 0;
    let skippedCount = 0;

    for (const assignment of assignments) {
      const oldFilename = assignment.attachmentUrl.split('/').pop(); // Extract filename from URL
      const oldFilePath = path.join(uploadsDir, oldFilename);

      // Check if file exists
      if (!fs.existsSync(oldFilePath)) {
        console.log(`⚠️  SKIP: File not found: ${oldFilename}`);
        skippedCount++;
        continue;
      }

      // Generate new filename with original title
      const ext = path.extname(oldFilename);
      const sanitized = assignment.title.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize title
      const newFilename = `${Date.now()}_${sanitized}${ext}`;
      const newFilePath = path.join(uploadsDir, newFilename);

      // Only rename if new filename is different
      if (oldFilename === newFilename) {
        console.log(`✓ SKIP (already correct): ${oldFilename}`);
        skippedCount++;
        continue;
      }

      try {
        // Rename file on disk
        fs.renameSync(oldFilePath, newFilePath);

        // Update database with new URL
        const newUrl = `/uploads/assignments/${newFilename}`;
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { attachmentUrl: newUrl },
        });

        console.log(`✓ RENAMED: ${oldFilename} → ${newFilename}`);
        renamedCount++;
      } catch (err) {
        console.error(`✗ ERROR renaming ${oldFilename}:`, err.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`  - Renamed: ${renamedCount}`);
    console.log(`  - Skipped/Error: ${skippedCount}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFilenames();
