import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function migrateSubmissionFilenames() {
  try {
    console.log('Starting submission filename migration...\n');

    // Get all submissions with file paths
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        filePath: true,
        assignment: {
          select: {
            title: true,
          },
        },
        student: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    console.log(`Found ${submissions.length} submissions\n`);

    const uploadsDir = path.join(__dirname, 'uploads', 'submissions');
    let renamedCount = 0;
    let skippedCount = 0;

    for (const submission of submissions) {
      // The filePath in DB is the absolute path, just extract the filename
      let oldFilename;
      if (submission.filePath.includes('\\')) {
        // Windows absolute path: C:\...\1763795507116-27295745.txt
        oldFilename = submission.filePath.split('\\').pop();
      } else {
        // Relative path: /uploads/submissions/1763795507116-27295745.txt
        oldFilename = submission.filePath.split('/').pop();
      }
      const oldFilePath = path.join(uploadsDir, oldFilename);

      // Check if file exists
      if (!fs.existsSync(oldFilePath)) {
        console.log(`⚠️  SKIP: File not found: ${oldFilename}`);
        skippedCount++;
        continue;
      }

      // Generate new filename with student name, assignment title, and original timestamp
      const ext = path.extname(oldFilename);
      const studentName = submission.student.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const assignmentTitle = submission.assignment.title.replace(/[^a-zA-Z0-9._-]/g, '_');
      // Extract timestamp from old filename (format: {timestamp}-{random}.ext)
      const originalTimestamp = oldFilename.split('-')[0];
      const newFilename = `${originalTimestamp}_${studentName}_${assignmentTitle}${ext}`;
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

        // Update database with new path
        const newPath = `/uploads/submissions/${newFilename}`;
        await prisma.submission.update({
          where: { id: submission.id },
          data: { filePath: newPath },
        });

        console.log(`✓ RENAMED: ${oldFilename} → ${newFilename}`);
        renamedCount++;
      } catch (err) {
        console.error(`✗ ERROR renaming ${oldFilename}:`, err.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ Submission migration complete!`);
    console.log(`  - Renamed: ${renamedCount}`);
    console.log(`  - Skipped/Error: ${skippedCount}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateSubmissionFilenames();
