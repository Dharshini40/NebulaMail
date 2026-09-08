import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMail } from '../hooks/useMail';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { view, setView, startCompose } = useMail();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const navigateTo = (path, mailView) => {
    setView(mailView);
    navigate(path);
  };

  const navItem = (active, label, onClick) => (
    <button
      key={label}
      className={`nav-item ${active ? 'nav-item-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">N</div>
        <span className="sidebar-title">Nebula KnowLab</span>
      </div>

      <button
  className="button button-primary sidebar-compose"
  onClick={() => {
    startCompose();
    navigate('/compose');
  }}
>
  Compose
</button>

      <nav className="sidebar-nav">
        {navItem(view === 'inbox', 'Inbox', () => navigateTo('/', 'inbox'))}
        {navItem(view === 'sent', 'Sent', () => navigateTo('/sent', 'sent'))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <>
            <div
              className="sidebar-user"
              onClick={() => setShowLogout((s) => !s)}
            >
              {user.picture ? (
                <img src={user.picture} alt="" className="sidebar-avatar" />
              ) : (
                <div className="sidebar-avatar sidebar-avatar--placeholder">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="sidebar-user-info">
                <p className="sidebar-user-name truncate">{user.name || user.email}</p>
                <p className="sidebar-user-email truncate">{user.email}</p>
              </div>
            </div>
            {showLogout && (
              <button
                className="sidebar-logout"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                Log out
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}