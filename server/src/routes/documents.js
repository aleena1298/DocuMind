import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { Document } from '../models/Document.js';
import { persistValidatedImage, storedPath, removeStoredFile } from '../services/storage.js';
import { runOcr } from '../services/ocr.js';
import { analyzeDocument, answerFromDocument } from '../services/ai.js';
import { httpError } from '../utils/httpError.js';

export const documentRouter = express.Router();
documentRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) return cb(httpError(400, 'Only JPG, PNG, and WebP images are supported in this version.'));
    cb(null, true);
  }
});

const questionSchema = z.object({ question: z.string().trim().min(2).max(800) });

async function ownedDocument(id, userId) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw httpError(404, 'Document not found.');
  const doc = await Document.findOne({ _id: id, owner: userId });
  if (!doc) throw httpError(404, 'Document not found.');
  return doc;
}

documentRouter.post('/', upload.single('file'), async (req, res, next) => {
  let storedName = null;
  let doc = null;
  try {
    if (!req.file) throw httpError(400, 'Choose a document image to upload.');
    const stored = await persistValidatedImage(req.file.buffer);
    storedName = stored.storedName;
    doc = await Document.create({
      owner: req.user._id,
      originalName: req.file.originalname,
      storedName,
      mimeType: 'image/webp',
      size: req.file.size,
      status: 'processing'
    });

    const ocr = await runOcr(stored.fullPath);
    if (!ocr.text) throw httpError(422, 'No readable text was detected. Try a clearer, higher-resolution image.');
    const analysis = await analyzeDocument(ocr.text);

    Object.assign(doc, {
      status: 'ready',
      ocrText: ocr.text,
      ocrConfidence: ocr.confidence,
      documentType: analysis.documentType,
      summary: analysis.summary,
      keyFields: analysis.keyFields,
      warnings: analysis.warnings,
      analysisMode: analysis.mode,
      errorMessage: ''
    });
    await doc.save();
    res.status(201).json({ document: doc });
  } catch (err) {
    if (doc) {
      doc.status = 'failed';
      doc.errorMessage = err.message || 'Processing failed.';
      await doc.save().catch(() => {});
    } else if (storedName) {
      await removeStoredFile(storedName).catch(() => {});
    }
    next(err);
  }
});

documentRouter.get('/', async (req, res, next) => {
  try {
    const docs = await Document.find({ owner: req.user._id })
      .select('-ocrText -qa')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ documents: docs });
  } catch (err) { next(err); }
});

documentRouter.get('/:id/file', async (req, res, next) => {
  try {
    const doc = await ownedDocument(req.params.id, req.user._id);
    res.type(doc.mimeType).sendFile(storedPath(doc.storedName));
  } catch (err) { next(err); }
});

documentRouter.get('/:id', async (req, res, next) => {
  try {
    const doc = await ownedDocument(req.params.id, req.user._id);
    res.json({ document: doc });
  } catch (err) { next(err); }
});

documentRouter.post('/:id/analyze', async (req, res, next) => {
  try {
    const doc = await ownedDocument(req.params.id, req.user._id);
    if (!doc.ocrText) throw httpError(422, 'This document has no OCR text to analyze.');
    const analysis = await analyzeDocument(doc.ocrText);
    doc.documentType = analysis.documentType;
    doc.summary = analysis.summary;
    doc.keyFields = analysis.keyFields;
    doc.warnings = analysis.warnings;
    doc.analysisMode = analysis.mode;
    await doc.save();
    res.json({ document: doc });
  } catch (err) { next(err); }
});

documentRouter.post('/:id/ask', async (req, res, next) => {
  try {
    const { question } = questionSchema.parse(req.body);
    const doc = await ownedDocument(req.params.id, req.user._id);
    if (!doc.ocrText) throw httpError(422, 'This document has no OCR text.');
    const result = await answerFromDocument(doc.ocrText, question);
    doc.qa.push({ question, answer: result.answer });
    if (doc.qa.length > 30) doc.qa = doc.qa.slice(-30);
    await doc.save();
    res.json({ answer: result.answer, mode: result.mode, qa: doc.qa });
  } catch (err) { next(err); }
});

documentRouter.delete('/:id', async (req, res, next) => {
  try {
    const doc = await ownedDocument(req.params.id, req.user._id);
    await removeStoredFile(doc.storedName);
    await doc.deleteOne();
    res.status(204).end();
  } catch (err) { next(err); }
});
