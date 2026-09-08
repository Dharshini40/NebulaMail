import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import EmailDetail from '../components/EmailDetail.jsx';
import ReplyBox from '../components/ReplyBox.jsx';
import Assistant from '../components/Assistant.jsx';
import SendConfirmation from '../components/SendConfirmation.jsx';
import { useMail } from '../hooks/useMail';

export default function EmailView() {
  const { id } = useParams();
  const { currentEmail, loading, error, openEmail, loadInbox } = useMail();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) openEmail(id);
  }, [id, openEmail]);

  const goBack = () => {
    navigate('/', { replace: true });
    loadInbox();
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <div className="back-bar">
          <button className="button button-secondary button-small" onClick={goBack}>
            ← Back
          </button>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <EmailDetail email={currentEmail} loading={loading} />
        {currentEmail && !loading && <ReplyBox email={currentEmail} />}
      </main>
      <Assistant />
      <SendConfirmation />
    </div>
  );
}