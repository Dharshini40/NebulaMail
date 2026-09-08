import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login.jsx';
import Inbox from './pages/Inbox.jsx';
import Sent from './pages/Sent.jsx';
import EmailView from './pages/EmailView.jsx';
import ComposePage from './pages/ComposePage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Inbox />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/sent" element={<Sent />} />
      <Route path="/email/:id" element={<EmailView />} />
      <Route path="/compose" element={<ComposePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}