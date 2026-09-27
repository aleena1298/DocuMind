import { Outlet, Link } from 'react-router-dom';
import { FileText, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>DocuMind <strong>AI</strong></span>
        </Link>
        <div className="top-actions">
          <span className="user-chip"><FileText size={14} /> {user?.name}</span>
          <button className="icon-btn" onClick={logout} title="Sign out"><LogOut size={18} /></button>
        </div>
      </header>
      <main className="page-wrap"><Outlet /></main>
    </div>
  );
}
