import { useMail } from '../hooks/useMail';

export default function SendConfirmation() {
  const { pendingSend, clearPendingSend, sendDraft, loading } = useMail();

  if (!pendingSend) return null;

  const handleCancel = () => clearPendingSend();
  const handleSend = async () => {
    await sendDraft(pendingSend);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal-title">Ready to send</h3>
        <div className="modal-preview">
          <p className="modal-line">
            <strong>To:</strong> {pendingSend.to}
          </p>
          <p className="modal-line">
            <strong>Subject:</strong> {pendingSend.subject}
          </p>
          <hr className="modal-divider" />
          <p className="modal-preview-body">{pendingSend.body}</p>
        </div>
        <div className="modal-actions">
          <button
            className="button button-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}