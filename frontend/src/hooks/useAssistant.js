import { useContext } from 'react';
import { AssistantContext } from '../context/AssistantContext.jsx';

export function useAssistant() {
  return useContext(AssistantContext);
}