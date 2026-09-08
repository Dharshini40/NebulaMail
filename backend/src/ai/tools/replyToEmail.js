import { getEmailById } from '../../services/gmail.service.js';

export async function replyToEmail({ emailId, body }, tokens) {
  if (!emailId) return { error: 'emailId is required' };
  if (!body) return { error: 'Reply body is required' };

  try {
    const original = await getEmailById(tokens, emailId);
    return {
      action: 'REPLY',
      originalEmail: {
        id: original.id,
        from: original.from,
        subject: original.subject
      },
      to: original.from,
      subject: original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`,
      body
    };
  } catch (err) {
    console.error('replyToEmail tool error:', err.message);
    return { error: 'Failed to load the email for reply.' };
  }
}