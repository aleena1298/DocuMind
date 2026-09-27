import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FileScan, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const isRegister = mode === 'register';

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-screen">
      <div className="auth-brand-side">
        <div className="brand large"><span className="brand-mark"><Sparkles size={18} /></span><span>DocuMind <strong>AI</strong></span></div>
        <div className="hero-copy">
          <span className="eyebrow light">INTELLIGENT DOCUMENT PROCESSING</span>
          <h1>Turn scanned documents into information you can actually use.</h1>
          <p>OCR extracts the text. AI structures, summarizes and answers questions from the document — without mixing in outside knowledge.</p>
        </div>
        <div className="feature-row"><FileScan /> <div><strong>OCR-first workflow</strong><span>Readable text with confidence scoring</span></div></div>
        <div className="feature-row"><ShieldCheck /> <div><strong>Grounded AI</strong><span>Answers constrained to your document</span></div></div>
      </div>
      <div className="auth-form-side">
        <form className="auth-card" onSubmit={submit}>
          <span className="eyebrow">{isRegister ? 'CREATE WORKSPACE' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? 'Create your account' : 'Sign in to DocuMind'}</h2>
          <p className="muted">{isRegister ? 'Start processing document images in minutes.' : 'Continue with your private document workspace.'}</p>
          {error && <div className="error-box">{error}</div>}
          {isRegister && <label>Full name<input required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Aleena Tariq" /></label>}
          <label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input required minLength="8" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>
          <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
          <p className="switch-auth">{isRegister ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
        </form>
      </div>
    </div>
  );
}
