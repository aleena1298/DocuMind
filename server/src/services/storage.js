import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const uploadDir = path.resolve('uploads');

export async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

export async function persistValidatedImage(buffer) {
  await ensureUploadDir();
  const id = crypto.randomUUID();
  const storedName = `${id}.webp`;
  const fullPath = path.join(uploadDir, storedName);

  // Decoding with Sharp rejects malformed/non-image payloads. We normalize
  // orientation and store a web-friendly original copy.
  await sharp(buffer, { failOn: 'error' })
    .rotate()
    .webp({ quality: 90 })
    .toFile(fullPath);

  return { storedName, fullPath };
}

export function storedPath(storedName) {
  return path.join(uploadDir, storedName);
}

export async function removeStoredFile(storedName) {
  try { await fs.unlink(storedPath(storedName)); } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
