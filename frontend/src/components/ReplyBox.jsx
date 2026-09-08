import { useState } from 'react';
import { useMail } from '../hooks/useMail';

export default function ReplyBox({ email }) {
  const { sendDraft, replyState } = useMail();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!body.trim()) return setError('Write a reply first.');
    setError('');
    setSending(true);
    const result = await sendDraft({
      to: replyState?.to || email?.from || '',
      subject: replyState?.subject || email?.subject || '',
      body
    });
    if (!result.success) setError(result.error);
    setSending(false);
  };

  return (
    <div className="reply-box">
      <p className="reply-label">
        Reply to {email?.from?.replace(/.*<(.*)>.*/, '$1') || email?.from || 'sender'}
      </p>
      <label className="compose-field">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your reply..."
          rows={4}
          className="textarea"
        />
      </label>
      {error && <p className="reply-error">{error}</p>}
      <div className="reply-actions">
        <button
          type="button"
          disabled={sending}
          className="button button-primary"
          onClick={handleSend}
        >
          {sending ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}