import { searchEmails as gmailSearch } from '../../services/gmail.service.js';

export async function searchEmails({ sender, keyword, after, before, unread, limit = 20 }, tokens) {
  const parts = [];
  if (sender) parts.push(`from:${sender}`);
  if (keyword) parts.push(keyword);
  if (after) parts.push(`after:${after}`);
  if (before) parts.push(`before:${before}`);
  if (unread) parts.push('is:unread');

  try {
    const emails = await gmailSearch(tokens, {
      query: parts.join(' '),
      maxResults: Math.min(parseInt(limit) || 20, 50)
    });
    return {
      action: 'SEARCH',
      emails,
      hasResults: emails.length > 0
    };
  } catch (err) {
    console.error('searchEmails tool error:', err.message);
    return { error: 'Failed to search emails. Please check Gmail access.' };
  }
}