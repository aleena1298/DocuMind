import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

export async function runOcr(imagePath) {
  const prepared = await sharp(imagePath)
    .rotate()
    .resize({ width: 2200, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();

  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(prepared);
    return {
      text: (data.text || '').replace(/\r/g, '').trim(),
      confidence: Number.isFinite(data.confidence) ? Math.round(data.confidence * 10) / 10 : 0
    };
  } finally {
    await worker.terminate();
  }
}
