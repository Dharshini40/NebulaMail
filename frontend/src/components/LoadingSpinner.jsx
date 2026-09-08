export default function LoadingSpinner({ label }) {
  return (
    <div className="loading">
      <div className="spinner" />
      {label && <p className="loading-label">{label}</p>}
    </div>
  );
}