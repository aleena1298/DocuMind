import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ScanText, Sparkles, Clock3, AlertTriangle, ArrowUpRight, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import UploadCard from '../components/UploadCard.jsx';

function prettyType(type = 'other') { return type.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const data = await api('/documents'); setDocs(data.documents);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  const stats = useMemo(() => ({
    total: docs.length,
    ready: docs.filter(d => d.status === 'ready').length,
    ai: docs.filter(d => d.analysisMode === 'openai').length
  }), [docs]);

  async function upload(file) {
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('file', file);
      const data = await api('/documents', { method: 'POST', body });
      setDocs(current => [data.document, ...current]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Delete this document and its stored image?')) return;
    await api(`/documents/${id}`, { method: 'DELETE' });
    setDocs(d => d.filter(x => x._id !== id));
  }

  return (
    <div className="dashboard">
      <div className="welcome-row">
        <div><span className="eyebrow">DOCUMENT INTELLIGENCE WORKSPACE</span><h1>Process. Understand. Ask.</h1><p className="muted">A simple OCR-to-AI pipeline you can explain end-to-end.</p></div>
        <div className="status-badge"><span className="status-dot" /> System ready</div>
      </div>
      {error && <div className="error-box"><AlertTriangle size={17} /> {error}</div>}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><FileText /></div><div><span>Documents</span><strong>{stats.total}</strong></div></div>
        <div className="stat-card"><div className="stat-icon"><ScanText /></div><div><span>OCR completed</span><strong>{stats.ready}</strong></div></div>
        <div className="stat-card"><div className="stat-icon"><Sparkles /></div><div><span>AI analyses</span><strong>{stats.ai}</strong></div></div>
      </div>
      <UploadCard onUpload={upload} busy={busy} />
      <section className="panel docs-panel">
        <div className="section-heading"><div><span className="eyebrow">HISTORY</span><h2>Recent documents</h2></div><span className="muted small">{docs.length} total</span></div>
        {!docs.length ? <div className="empty-state"><ScanText size={35} /><strong>No documents yet</strong><span>Upload a clear invoice, receipt, letter or other document image above.</span></div> :
          <div className="doc-list">{docs.map(doc => <div className="doc-row" key={doc._id}>
            <div className="doc-icon"><FileText size={20} /></div>
            <div className="doc-main"><strong>{doc.originalName}</strong><span><Clock3 size={13} /> {new Date(doc.createdAt).toLocaleString()} · {prettyType(doc.documentType)}</span></div>
            <div className={`state-pill ${doc.status}`}>{doc.status}</div>
            <button className="ghost-icon danger" onClick={() => remove(doc._id)} title="Delete"><Trash2 size={16} /></button>
            <Link className="open-link" to={`/documents/${doc._id}`}>Open <ArrowUpRight size={15} /></Link>
          </div>)}</div>}
      </section>
    </div>
  );
}
