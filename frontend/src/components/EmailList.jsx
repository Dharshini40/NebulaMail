import EmailCard from './EmailCard.jsx';
import EmptyState from './EmptyState.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function EmailList({ emails, loading, activeId, onSelect, emptyText }) {
  if (loading) {
    return <LoadingSpinner label="Loading emails..." />;
  }

  if (!emails.length) {
    return <EmptyState text={emptyText || 'No emails found.'} />;
  }

  return (
    <div className="email-list">
      {emails.map((email) => (
        <EmailCard
          key={email.id}
          email={email}
          active={email.id === activeId}
          onClick={() => onSelect(email)}
        />
      ))}
    </div>
  );
}