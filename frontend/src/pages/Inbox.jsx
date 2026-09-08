import { useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import EmailList from '../components/EmailList.jsx';
import Filters from '../components/Filters.jsx';
import Assistant from '../components/Assistant.jsx';
import SendConfirmation from '../components/SendConfirmation.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useMail } from '../hooks/useMail';
import { useAuth } from '../hooks/useAuth';
import { useAssistant } from '../hooks/useAssistant';

export default function Inbox() {
  const { emails, loading, error, setView, loadInbox, openEmail } = useMail();
  const { user } = useAuth();
  const { isOpen, setIsOpen } = useAssistant();
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current && user) {
      loaded.current = true;
      loadInbox();
    }
  }, [user, loadInbox]);

  const handleSelect = (email) => {
    setView('email_detail');
    openEmail(email.id);
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <div className="topbar">
          <h1 className="topbar-title">Inbox</h1>
          <button
            className="topbar-action"
            onClick={() => setIsOpen(!isOpen)}
          >
            Toggle AI
          </button>
        </div>
        <Filters />
        <ErrorMessage message={error} onRetry={loadInbox} />
        <EmailList
          emails={emails}
          loading={loading}
          onSelect={handleSelect}
          emptyText="Your inbox is empty. Try a filter or ask the assistant."
        />
      </main>
      <Assistant />
      <SendConfirmation />
    </div>
  );
}