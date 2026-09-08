import { useNavigate } from 'react-router-dom';
import { useMail } from '../hooks/useMail';
import { useAssistant } from '../hooks/useAssistant';

export default function EmailDetail({ email, loading }) {
  const { openEmail, currentEmail } = useMail();
  const { send } = useAssistant();
  const navigate = useNavigate();

  const ctx = {
    view: 'email_detail',
    currentEmail: currentEmail?.id || null,
    filters: {},
    composeState: {}
  };

  const handleReply = () => {
    navigate('/compose');
  };

  if (loading && !email) {
    return <div className="email-detail-loading">Loading...</div>;
  }

  if (!email) {
    return <div className="email-detail-empty">Select an email to view it.</div>;
  }

  return (
    <div className="email-detail">
      <div className="email-detail-header">
        <h2 className="email-detail-title">{email.subject || '(no subject)'}</h2>
        <div className="email-detail-meta">
          <div>
            <p className="email-detail-sender">
              <span className="email-detail-label">From:</span> {email.from}
            </p>
            {email.to && (
              <p className="email-detail-recipients truncate">
                <span className="email-detail-label">To:</span> {email.to}
              </p>
            )}
          </div>
          <div className="email-detail-actions">
            <span className="email-detail-date">
              {new Date(email.date).toLocaleString()}
            </span>
            <button
              className="button button-secondary button-small"
              onClick={handleReply}
            >
              Reply
            </button>
            <button
              className="button button-primary button-small"
              onClick={() => send('Reply to this message', ctx, null)}
            >
              AI Reply
            </button>
          </div>
        </div>
      </div>
      <div className="email-detail-content">
        {email.body || email.snippet || '(no content)'}
      </div>
    </div>
  );
}