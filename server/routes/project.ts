import { Router, Request, Response } from 'express';
import * as archiverNamespace from 'archiver';
import path from 'node:path';
import fs from 'node:fs';

const router = Router();

function createZipArchive(options: any = {}) {
  const anyNs = archiverNamespace as any;
  if (typeof anyNs.ZipArchive === 'function') {
    return new anyNs.ZipArchive(options);
  }
  if (typeof anyNs.default === 'function') {
    return anyNs.default('zip', options);
  }
  if (typeof anyNs === 'function') {
    return anyNs('zip', options);
  }
  throw new Error('No zip constructor available in archiver package');
}

// GET /api/project/download-zip
// Streams the entire project source tree as a ready-to-run ZIP file
router.get('/download-zip', (req: Request, res: Response) => {
  try {
    const archive = createZipArchive({
      zlib: { level: 9 }, // Maximum compression
    });

    res.attachment('relieflink-disaster-relief-platform.zip');

    archive.on('error', (err: any) => {
      console.error('[ZIP Stream Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    });

    archive.pipe(res);

    const rootDir = process.cwd();

    // Include all essential project directories and files, excluding large generated assets
    archive.glob('**/*', {
      cwd: rootDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        'data/pgdata/**',
        '*.zip',
        '.DS_Store',
      ],
      dot: true, // include .env.example, .gitignore, etc.
    });

    archive.finalize();
  } catch (err: any) {
    console.error('[Download ZIP Error]', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Failed to generate ZIP archive.' } });
  }
});

// GET /api/project/download-ppt
// Downloads the generated Zeroth Review PowerPoint Presentation
router.get('/download-ppt', (req: Request, res: Response) => {
  const pptPath = path.resolve(process.cwd(), 'public', 'ReliefLink_Zeroth_Review_Sanjay_K.pptx');
  if (fs.existsSync(pptPath)) {
    return res.download(pptPath, 'ReliefLink_Zeroth_Review_Sanjay_K.pptx');
  }
  return res.status(404).json({ success: false, error: { message: 'Presentation file not found' } });
});

// GET /api/project/download-review1-ppt
// Downloads the generated First Review PowerPoint Presentation
router.get(['/download-review1-ppt', '/download-first-review-ppt', '/download-review-1-ppt'], (req: Request, res: Response) => {
  const pptPath = path.resolve(process.cwd(), 'public', 'ReliefLink_Review1_Sanjay_K.pptx');
  if (fs.existsSync(pptPath)) {
    return res.download(pptPath, 'ReliefLink_Review1_Sanjay_K.pptx');
  }
  const altPath = path.resolve(process.cwd(), 'public', 'ReliefLink_First_Review_Sanjay_K.pptx');
  if (fs.existsSync(altPath)) {
    return res.download(altPath, 'ReliefLink_Review1_Sanjay_K.pptx');
  }
  return res.status(404).json({ success: false, error: { message: 'Review 1 presentation file not found' } });
});

router.get('/instructions', (req: Request, res: Response) => {
  const readmePath = path.resolve(process.cwd(), 'SETUP_AND_DEPLOY.md');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    return res.json({ success: true, data: { instructions: content } });
  }
  return res.json({ success: true, data: { message: 'Review README.md in root directory.' } });
});


// GET /api/project/slides-view
// Serves the full interactive / printable 15-slide Review 1 deck
router.get(['/slides-view', '/review1-slides', '/presentation-view'], (req: Request, res: Response) => {
  const htmlPath = path.resolve(process.cwd(), 'public', 'review1-presentation.html');
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  return res.status(404).json({ success: false, error: { message: 'Review 1 presentation slides not found' } });
});

export default router;
