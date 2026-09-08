import { createContext, useState, useRef, useCallback } from 'react';
import { api } from '../services/api';

export const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef(null);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const send = useCallback(
    async (text, context, onAction) => {
      const userMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text
      };

      addMessage(userMessage);
      setInput('');
      setThinking(true);

      try {
        const data = await api.ai.chat({
          message: text,
          context
        });

        console.log('AI RESPONSE FROM BACKEND:', data);

        // -----------------------------------------
        // Handle backend action result
        // -----------------------------------------

        if (data?.action) {
          console.log('AI ACTION:', data.action);

          if (onAction) {
            onAction(data);
          }
        }

        // -----------------------------------------
        // Get the actual AI response
        // -----------------------------------------

        let assistantContent =
          data?.response ||
          data?.reply ||
          data?.message ||
          '';

        // If backend returned an error
        if (data?.error) {
          assistantContent = data.error;
        }

        // Final fallback
        if (!assistantContent) {
          assistantContent = 'I could not process your request.';
        }

        // -----------------------------------------
        // Add assistant message
        // -----------------------------------------

        addMessage({
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: assistantContent,
          action: data?.action,
          data
        });

      } catch (err) {
        console.error('Assistant error:', err);

        addMessage({
          id: `e-${Date.now()}`,
          role: 'error',
          content:
            err?.message ||
            'Failed to process your request.'
        });
      } finally {
        setThinking(false);
      }
    },
    [addMessage]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        messages,
        input,
        isOpen,
        thinking,
        inputRef,
        setInput,
        setIsOpen,
        send,
        clearMessages,
        reset
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}