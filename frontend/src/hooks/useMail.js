import { useContext } from 'react';
import { MailContext } from '../context/MailContext.jsx';

export function useMail() {
  return useContext(MailContext);
}