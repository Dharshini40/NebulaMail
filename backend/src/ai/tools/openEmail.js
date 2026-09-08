import { getEmailById } from '../../services/gmail.service.js';

export async function openEmail({ emailId }, tokens) {
  if (!emailId) return { error: 'emailId is required' };
  try {
    const email = await getEmailById(tokens, emailId);
    return {
      action: 'OPEN_EMAIL',
      email
    };
  } catch (err) {
    console.error('openEmail tool error:', err.message);
    return { error: 'Failed to open the email.' };
  }
}