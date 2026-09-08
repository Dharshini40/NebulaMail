function decodeBase64Url(data) {
  if (!data) return '';
  // Gmail returns base64url-encoded data (safe for URLs). Normalize to standard
  // base64 by mapping '-'/'_' to '+'/'/' before decoding.
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function getHeader(headers, name) {
  if (!headers) return '';
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

// Recursively walk a Gmail payload tree collecting the text/plain and text/html
// bodies. Gmail nests multipart messages, so we traverse every part.
function extractParts(payload, textParts, htmlParts) {
  if (!payload) return;

  if (payload.body?.data && payload.mimeType) {
    const content = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/plain') {
      textParts.push(content);
    } else if (payload.mimeType === 'text/html') {
      htmlParts.push(content);
    }
  }

  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      extractParts(part, textParts, htmlParts);
    }
  }
}

// Convert an HTML fragment into readable text so the detail view can show an
// approximation even when only an HTML body exists.
function htmlToText(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseEmail(gmailMessage) {
  const headers = gmailMessage.payload?.headers || [];

  const textParts = [];
  const htmlParts = [];
  extractParts(gmailMessage.payload, textParts, htmlParts);

  // Prefer the plain-text body; fall back to a text extraction of the HTML body.
  let body = textParts.join('\n').trim();
  if (!body && htmlParts.length) {
    body = htmlToText(htmlParts.join('\n'));
  }
  // If there was a direct body (non-multipart), decode it too.
  if (!body && gmailMessage.payload?.body?.data) {
    body = decodeBase64Url(gmailMessage.payload.body.data);
  }

  const isUnread = Array.isArray(gmailMessage.labelIds) && gmailMessage.labelIds.includes('UNREAD');

  return {
    id: gmailMessage.id || '',
    threadId: gmailMessage.threadId || '',
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject'),
    date: getHeader(headers, 'Date'),
    snippet: gmailMessage.snippet || '',
    body,
    isUnread,
    labelIds: gmailMessage.labelIds || []
  };
}

export function buildSearchQuery({ sender, keyword, after, before, unread }) {
  const parts = [];
  if (sender) parts.push(`from:${sender}`);
  if (keyword) parts.push(keyword);
  if (after) parts.push(`after:${after}`);
  if (before) parts.push(`before:${before}`);
  if (unread) parts.push('is:unread');
  return parts.join(' ').trim();
}
