import { useState } from 'react';
import { useMail } from '../hooks/useMail';

export default function Compose() {
  const {
    composeState,
    updateCompose,
    requestSend,
    cancelCompose,
    replyState
  } = useMail();

  const [error, setError] = useState('');

  const to = composeState.to;
  const subject = composeState.subject;
  const body = composeState.body;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to || '');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!to.trim()) {
      setError('Recipient is required.');
      return;
    }

    if (!validEmail) {
      setError('Enter a valid email address.');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }

    setError('');

    requestSend({
      to: to.trim(),
      subject: subject.trim(),
      body
    });
  };

  return (
    <div className="compose-form">
      <div className="compose-header">
        <h2 className="compose-title">
          {replyState ? 'Reply' : 'New Message'}
        </h2>
      </div>

      <form className="compose-body" onSubmit={handleSubmit}>
        <label className="compose-field">
          <span className="compose-label">To</span>

          <input
            type="email"
            value={to}
            onChange={(e) => updateCompose({ to: e.target.value })}
            placeholder="recipient@example.com"
            className="input"
          />
        </label>

        <label className="compose-field">
          <span className="compose-label">Subject</span>

          <input
            type="text"
            value={subject}
            onChange={(e) => updateCompose({ subject: e.target.value })}
            placeholder="Subject"
            className="input"
          />
        </label>

        <label className="compose-field compose-field--grow">
          <span className="compose-label">Body</span>

          <textarea
            value={body}
            onChange={(e) => updateCompose({ body: e.target.value })}
            placeholder="Write your message..."
            className="textarea"
          />
        </label>

        {error && (
          <p className="compose-error">
            {error}
          </p>
        )}

        <div className="compose-actions">
          <button
            type="submit"
            className="button button-primary"
          >
            Send
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={cancelCompose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}