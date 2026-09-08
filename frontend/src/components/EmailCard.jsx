function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function EmailCard({ email, active, onClick }) {
  const sender = email.from.replace(/.*<(.*)>.*/, '$1') || email.from || 'Unknown';

  const stateClass = active
    ? 'email-card--active'
    : email.isUnread
    ? 'email-card--unread'
    : 'email-card--read';

  return (
    <button className={`email-card ${stateClass}`} onClick={onClick}>
      <div className="email-card-top">
        <div className="email-card-sender-row">
          {email.isUnread && <span className="unread-dot" />}
          <span className="email-card-sender truncate">{sender}</span>
        </div>
        <span className="email-card-date">{formatDate(email.date)}</span>
      </div>
      <p className="email-card-subject truncate">
        {email.subject || '(no subject)'}
      </p>
      {email.snippet && (
        <p className="email-card-snippet truncate">{email.snippet}</p>
      )}
    </button>
  );
}