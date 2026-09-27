import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, MessageSquareText, Send, Sparkles, ScanText, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../api.js';

function prettyType(type = 'other') { return type.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }

export default function DocumentPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  async function load() {
    const data = await api(`/documents/${id}`); setDoc(data.document);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, [id]);

  async function ask(e) {
    e.preventDefault(); if (!question.trim() || asking) return;
    setAsking(true); setError('');
    try {
      const data = await api(`/documents/${id}/ask`, { method: 'POST', body: JSON.stringify({ question }) });
      setDoc(d => ({ ...d, qa: data.qa })); setQuestion('');
    } catch (e) { setError(e.message); }
    finally { setAsking(false); }
  }

  async function reanalyze() {
    setReanalyzing(true); setError('');
    try { const data = await api(`/documents/${id}/analyze`, { method: 'POST' }); setDoc(data.document); }
    catch (e) { setError(e.message); }
    finally { setReanalyzing(false); }
  }

  if (error && !doc) return <div className="error-box">{error}</div>;
  if (!doc) return <div className="screen-center"><div className="spinner" /></div>;

  return (
    <div className="document-view">
      <Link className="back-link" to="/"><ArrowLeft size={17} /> Back to dashboard</Link>
      <div className="doc-title-row">
        <div><span className="eyebrow">{prettyType(doc.documentType)}</span><h1>{doc.originalName}</h1><p className="muted">OCR confidence {doc.ocrConfidence?.toFixed?.(1) ?? doc.ocrConfidence}% · {doc.analysisMode === 'openai' ? 'AI analysis' : 'Local demo analysis'}</p></div>
        <button className="secondary-btn" onClick={reanalyze} disabled={reanalyzing}><RefreshCw size={16} className={reanalyzing ? 'spin' : ''} /> Re-analyze</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {doc.warnings?.map((w, i) => <div className="warning-box" key={i}>{w}</div>)}

      <div className="document-grid">
        <section className="panel preview-panel"><div className="mini-heading"><ScanText size={17} /> Original document</div><div className="image-frame"><img src={`/api/documents/${id}/file`} alt={doc.originalName} /></div></section>
        <section className="panel insight-panel"><div className="mini-heading"><Sparkles size={17} /> AI understanding</div><div className="summary-card"><span>Summary</span><p>{doc.summary || 'No summary available.'}</p></div>
          <div className="field-list"><span className="subheading">Extracted fields</span>{doc.keyFields?.length ? doc.keyFields.map((f, i) => <div className="field-row" key={i}><span>{f.label}</span><strong>{f.value}</strong>{f.evidence && <small>Evidence: “{f.evidence}”</small>}</div>) : <p className="muted">No confident structured fields were found.</p>}</div>
        </section>
      </div>

      <div className="lower-grid">
        <section className="panel ocr-panel"><div className="section-heading"><div className="mini-heading"><ScanText size={17} /> OCR text</div><button className="text-btn" onClick={() => navigator.clipboard.writeText(doc.ocrText)}><Copy size={14} /> Copy</button></div><pre className="ocr-text">{doc.ocrText}</pre></section>
        <section className="panel qa-panel"><div className="mini-heading"><MessageSquareText size={17} /> Ask this document</div><div className="grounded-note"><ShieldCheck size={15} /> Answers are instructed to use only this document.</div><div className="chat-history">{doc.qa?.length ? doc.qa.map((item, i) => <div className="qa-item" key={i}><div className="question-bubble">{item.question}</div><div className="answer-bubble">{item.answer}</div></div>) : <div className="chat-empty">Try “What is the total amount?” or “Who issued this document?”</div>}</div><form className="question-form" onSubmit={ask}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question about this document…" /><button className="send-btn" disabled={asking || !question.trim()}><Send size={16} /></button></form></section>
      </div>
    </div>
  );
}
