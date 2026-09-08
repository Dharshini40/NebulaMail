import { createContext, useState, useCallback } from 'react';
import { api } from '../services/api';

export const MailContext = createContext(null);

export function MailProvider({ children }) {
  const [view, setView] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sender: '',
    keyword: '',
    after: '',
    before: '',
    unread: false
  });
  const [composeState, setComposeState] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [replyState, setReplyState] = useState(null);
  const [pendingSend, setPendingSend] = useState(null);

  const loadInbox = useCallback(async (extraFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.mail.inbox();
      let list = result.emails;
      const f = { ...filters, ...extraFilters };
      if (f.unread) list = list.filter((e) => e.isUnread);
      if (f.sender) list = list.filter((e) => e.from.toLowerCase().includes(f.sender.toLowerCase()));
      if (f.keyword) list = list.filter((e) => (e.subject + e.snippet).toLowerCase().includes(f.keyword.toLowerCase()));
      setEmails(list);
      setView('inbox');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadSent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.mail.sent();
      setEmails(result.emails);
      setView('sent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openEmail = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.mail.get(id);
      setCurrentEmail(result.email);
      setView('email_detail');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startCompose = useCallback((state = {}) => {
    setComposeState({
      to: state.to || '',
      subject: state.subject || '',
      body: state.body || ''
    });
    setReplyState(null);
    setPendingSend(null);
    setView('compose');
  }, []);

  const startReply = useCallback((emailId, { to, subject, body }) => {
    setReplyState({ emailId, to, subject });
    setComposeState({ to, subject, body });
    setPendingSend(null);
    setView('compose');
  }, []);

  const updateCompose = useCallback((patch) => {
    setComposeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const cancelCompose = useCallback(() => {
    setComposeState({ to: '', subject: '', body: '' });
    setReplyState(null);
    setPendingSend(null);
    setView('inbox');
  }, []);

  const requestSend = useCallback((payload) => {
    setPendingSend(payload);
  }, []);

  const clearPendingSend = useCallback(() => {
    setPendingSend(null);
  }, []);

  const sendDraft = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        if (replyState && replyState.emailId) {
          await api.mail.reply({ emailId: replyState.emailId, body: payload.body });
        } else {
          await api.mail.send(payload);
        }
        setComposeState({ to: '', subject: '', body: '' });
        setReplyState(null);
        setPendingSend(null);
        setView('inbox');
        await loadInbox();
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [replyState, loadInbox]
  );

  const applyAiResult = useCallback(
    (result) => {
      switch (result.action) {
        case 'COMPOSE':
          startCompose({ to: result.to, subject: result.subject, body: result.body });
          break;
        case 'SEARCH':
        case 'FILTER':
          if (result.emails) {
            setEmails(result.emails);
            setView('inbox');
          }
          break;
        case 'OPEN_EMAIL':
          if (result.email) {
            setCurrentEmail(result.email);
            setView('email_detail');
          }
          break;
        case 'REPLY':
          startReply(result.originalEmail?.id, {
            to: result.to,
            subject: result.subject,
            body: result.body
          });
          break;
        case 'SEND_EMAIL':
          setPendingSend({
            to: result.to,
            subject: result.subject,
            body: result.body
          });
          break;
        default:
          break;
      }
    },
    [startCompose, startReply]
  );

  return (
    <MailContext.Provider
      value={{
        view,
        emails,
        currentEmail,
        loading,
        error,
        filters,
        composeState,
        replyState,
        pendingSend,
        setView,
        setFilters,
        loadInbox,
        loadSent,
        openEmail,
        startCompose,
        startReply,
        updateCompose,
        cancelCompose,
        requestSend,
        clearPendingSend,
        sendDraft,
        applyAiResult
      }}
    >
      {children}
    </MailContext.Provider>
  );
}