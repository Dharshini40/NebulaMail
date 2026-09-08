export default function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✉</div>
      <p className="empty-text">{text}</p>
    </div>
  );
}