import { useMail } from '../hooks/useMail';

export default function AssistantMessage({ message }) {
  const { openEmail, startCompose, applyAiResult } = useMail();

  const handleEmailAction = (action) => {
    if (action.result?.email?.id) {
      openEmail(action.result.email.id);
    } else if (action.result?.emails?.length) {
      applyAiResult(action.result);
    } else if (action.result?.action === 'COMPOSE') {
      startCompose({
        to: action.result.to,
        subject: action.result.subject,
        body: action.result.body
      });
    }
  };

  let rowClass = 'assistant-message-row--assistant';
  let bubbleClass = 'message-bubble--assistant';
  if (message.role === 'user') {
    rowClass = 'assistant-message-row--user';
    bubbleClass = 'message-bubble--user';
  } else if (message.role === 'error') {
    rowClass = 'assistant-message-row--error';
    bubbleClass = 'message-bubble--error';
  }

  const resultEmails = message.actions
    ?.map((a) => a.result)
    .filter((r) => r?.emails?.length)
    .flatMap((r) => r.emails);

  return (
    <div className={`assistant-message-row ${rowClass}`}>
      {message.role === 'user' || message.role === 'error' ? (
        <div className={`message-bubble ${bubbleClass}`}>{message.content}</div>
      ) : (
        <div className="message-content-wrap">
          <div className={`message-bubble ${bubbleClass}`}>{message.content}</div>
          {resultEmails?.length > 0 && (
            <div className="message-email-list">
              {resultEmails.slice(0, 5).map((email) => (
                <button
                  key={email.id}
                  className="message-email-card"
                  onClick={() => openEmail(email.id)}
                >
                  <p className="message-email-name truncate">
                    {email.from.replace(/.*<(.*)>.*/, '$1') || email.from}
                  </p>
                  <p className="message-email-subject truncate">{email.subject}</p>
                  <p className="message-email-date">
                    {new Date(email.date).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
          {message.actions?.length > 0 && (
            <p className="message-actions-note">
              {message.actions.length} action(s) applied
            </p>
          )}
        </div>
      )}
    </div>
  );
}