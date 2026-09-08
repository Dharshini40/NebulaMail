import { useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import EmailList from '../components/EmailList.jsx';
import Assistant from '../components/Assistant.jsx';
import SendConfirmation from '../components/SendConfirmation.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useMail } from '../hooks/useMail';
import { useAuth } from '../hooks/useAuth';
import { useAssistant } from '../hooks/useAssistant';

export default function Sent() {
  const { emails, loading, error, setView, loadSent, openEmail } = useMail();
  const { user } = useAuth();
  const { isOpen, setIsOpen } = useAssistant();
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current && user) {
      loaded.current = true;
      loadSent();
    }
  }, [user, loadSent]);

  const handleSelect = (email) => {
    setView('email_detail');
    openEmail(email.id);
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <div className="topbar">
          <h1 className="topbar-title">Sent</h1>
          <button
            className="topbar-action"
            onClick={() => setIsOpen(!isOpen)}
          >
            Toggle AI
          </button>
        </div>
        <ErrorMessage message={error} onRetry={loadSent} />
        <EmailList
          emails={emails}
          loading={loading}
          onSelect={handleSelect}
          emptyText="Nothing sent yet."
        />
      </main>
      <Assistant />
      <SendConfirmation />
    </div>
  );
}