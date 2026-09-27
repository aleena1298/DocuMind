# DocuMind AI — Intelligent OCR & Document Understanding

A full-stack portfolio application that turns uploaded document images into searchable OCR text, structured AI analysis, and grounded document Q&A.

## What it does

1. User registers/signs in.
2. User uploads a JPG/PNG/WebP document image.
3. Server validates and preprocesses the image with `sharp`.
4. Tesseract.js performs OCR and stores the extracted text + OCR confidence.
5. The AI layer classifies the document, creates a concise summary, and extracts key fields with evidence.
6. The user can ask questions about the document; answers are constrained to the OCR text.
7. The dashboard stores processing history per authenticated user.

## Stack

- Frontend: React, React Router, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- OCR: Tesseract.js + Sharp preprocessing
- AI: OpenAI Responses API (Structured Outputs for document analysis)
- Auth: JWT in HttpOnly cookie + bcrypt
- Validation/Security: Zod, Helmet, rate limiting, upload size/type limits
- Tooling: Git/GitHub, Docker Compose for MongoDB

## Architecture

```text
React UI
   │
   ├── Auth / Dashboard / Document View
   │
Express API
   │
   ├── JWT authentication
   ├── Multer upload validation
   ├── Sharp image preprocessing
   ├── Tesseract OCR
   ├── OpenAI document analysis + Q&A
   └── Mongoose persistence
          │
       MongoDB
```

## Local setup

### 1. Requirements

- Node.js 20+
- npm 10+
- MongoDB locally, or Docker Desktop
- OpenAI API key for the AI features (OCR works without it)

### 2. Start MongoDB

With Docker:

```bash
docker compose up -d
```

Or use an existing MongoDB instance.

### 3. Configure the server

```bash
cp server/.env.example server/.env
```

Add your own `OPENAI_API_KEY`. Never commit it.

### 4. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo without an OpenAI key

The app includes a clearly-labelled local heuristic fallback so you can test the complete UI without billing/API access. The fallback is **not an LLM**. Once `OPENAI_API_KEY` is configured, the server automatically uses the AI workflow.

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/documents` — upload + OCR + analysis
- `GET /api/documents`
- `GET /api/documents/:id`
- `GET /api/documents/:id/file`
- `POST /api/documents/:id/analyze`
- `POST /api/documents/:id/ask`
- `DELETE /api/documents/:id`
- `GET /api/health`

## Security choices

- Passwords are hashed with bcrypt.
- Auth tokens are placed in HttpOnly cookies, not localStorage.
- Uploads are size-limited and decoded by Sharp before storage.
- Stored documents are not exposed as a public static directory; file access requires ownership authentication.
- Helmet adds HTTP security headers.
- Global and auth-specific rate limits reduce abuse.
- Zod validates JSON inputs and environment variables.
- AI prompts treat OCR text as untrusted data and instruct the model to ignore instructions found inside a document.

## Production deployment notes

This repository is a production-oriented portfolio implementation, but a real public deployment should additionally use managed object storage (S3/R2/etc.), a durable background job queue for OCR/AI tasks, central logging/monitoring, TLS at the edge, backups, malware scanning, email verification/password reset, and a secrets manager. For cross-site deployments, add an explicit CSRF strategy and configure cookie/CORS rules for your exact domains.

## Interview explanation

A concise way to explain the project:

> “The system separates OCR from document understanding. Tesseract extracts raw text from the image. The backend then supplies that text to an LLM with a constrained schema so the model can classify the document, summarize it, and extract structured fields. For document Q&A, the OCR text is supplied as the only evidence and the model is told to say when an answer is not present. React provides the interface, Express handles APIs and security, and MongoDB stores the user's processed documents.”

## Future improvements

- PDF ingestion and multi-page processing
- Background queue with Redis/BullMQ
- Cloud object storage
- Embeddings + vector search for cross-document RAG
- Human correction/validation workflow
- OCR language selector
- Audit logs and organization/team accounts
