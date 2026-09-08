import { searchEmails as gmailSearch } from '../../services/gmail.service.js';

export async function filterEmails({ sender, keyword, after, before, unread }, tokens) {
  const parts = [];
  if (sender) parts.push(`from:${sender}`);
  if (keyword) parts.push(keyword);
  if (after) parts.push(`after:${after}`);
  if (before) parts.push(`before:${before}`);
  if (unread) parts.push('is:unread');

  try {
    const emails = await gmailSearch(tokens, {
      query: parts.join(' '),
      maxResults: 50
    });
    return {
      action: 'FILTER',
      filters: { sender, keyword, after, before, unread },
      emails,
      hasResults: emails.length > 0
    };
  } catch (err) {
    console.error('filterEmails tool error:', err.message);
    return { error: 'Failed to filter emails. Please check Gmail access.' };
  }
}