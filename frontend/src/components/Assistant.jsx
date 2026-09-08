import { useAssistant } from '../hooks/useAssistant';
import { useMail } from '../hooks/useMail';
import AssistantMessage from './AssistantMessage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function Assistant() {
  const { messages, input, setInput, isOpen, setIsOpen, thinking, send } = useAssistant();
  const mail = useMail();
  const { view, currentEmail, filters, composeState, applyAiResult } = mail;

  const buildContext = () => ({
    view,
    currentEmail: currentEmail?.id || null,
    filters,
    composeState
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || thinking) return;
    const text = input.trim();
    send(text, buildContext(), (result) => applyAiResult(result));
  };

  const suggestions = [
    'Show me unread emails this week',
    'Find emails from Sarah',
    'Open the latest email',
    'Compose an email to me'
  ];

  return (
    <aside
      className={
        isOpen ? 'assistant-panel' : 'assistant-panel assistant-panel--hidden'
      }
    >
      <div className="assistant-header">
        <div className="assistant-header-left">
          <span className="assistant-logo">AI</span>
          <h3 className="assistant-title">Assistant</h3>
        </div>
        <button
          className="assistant-collapse"
          onClick={() => setIsOpen(false)}
          title="Collapse panel"
        >
          ›
        </button>
      </div>

      <div className="assistant-messages">
        {messages.length === 0 && (
          <div className="assistant-suggestions">
            <p className="assistant-suggestions-title">Try asking:</p>
            <div className="assistant-suggestions-list">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="assistant-suggestion"
                  onClick={() => {
                    setInput(s);
                  }}
                >
                  “{s}”
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <AssistantMessage key={m.id} message={m} />
        ))}
        {thinking && (
          <div className="assistant-message-row--assistant">
            <div className="assistant-thinking">
              <LoadingSpinner />
              <span className="assistant-thinking-text">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="assistant-form">
        <div className="assistant-form-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Control the mail app with natural language..."
            rows={2}
            className="textarea assistant-input"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="button button-primary assistant-send"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}