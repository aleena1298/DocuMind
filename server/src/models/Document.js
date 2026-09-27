import mongoose from 'mongoose';

const keyFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  evidence: { type: String, default: '' }
}, { _id: false });

const qaSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing', index: true },
  ocrText: { type: String, default: '' },
  ocrConfidence: { type: Number, default: 0 },
  documentType: { type: String, default: 'other' },
  summary: { type: String, default: '' },
  keyFields: { type: [keyFieldSchema], default: [] },
  warnings: { type: [String], default: [] },
  analysisMode: { type: String, enum: ['openai', 'local-demo', 'none'], default: 'none' },
  errorMessage: { type: String, default: '' },
  qa: { type: [qaSchema], default: [] }
}, { timestamps: true });

documentSchema.index({ owner: 1, createdAt: -1 });

export const Document = mongoose.model('Document', documentSchema);
