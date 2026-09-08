import { google } from 'googleapis';
import { parseEmail } from '../utils/gmailParser.js';

const MAX_RESULTS_LIMIT = 50;

/**
 * ============================================================
 * CREATE GMAIL CLIENT
 * ============================================================
 *
 * Creates a Gmail API client using the authenticated user's
 * OAuth tokens.
 */
export function getGmailClient(tokens) {
  if (!tokens) {
    const error = new Error(
      'Gmail authentication tokens are missing.'
    );

    error.statusCode = 401;

    throw error;
  }

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    const error = new Error(
      'Google OAuth configuration is missing on the server.'
    );

    error.statusCode = 500;

    throw error;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);

  /**
   * Google can automatically refresh the access token.
   */
  oauth2Client.on('tokens', (newTokens) => {
    if (newTokens.access_token) {
      Object.assign(tokens, newTokens);

      console.log(
        'Gmail access token refreshed successfully.'
      );
    }

    if (newTokens.refresh_token) {
      Object.assign(tokens, newTokens);
    }
  });

  return google.gmail({
    version: 'v1',
    auth: oauth2Client
  });
}


/**
 * ============================================================
 * NORMALIZE GMAIL ERROR
 * ============================================================
 *
 * Converts Google's large error response into a useful
 * application error.
 */
function normalizeGmailError(error) {
  const status =
    error?.response?.status ||
    error?.code ||
    error?.statusCode;

  const message =
    error?.response?.data?.error?.message ||
    error?.message ||
    'Unable to access Gmail.';

  console.error('Gmail API error:', {
    status,
    message,
    errors: error?.response?.data?.error?.errors
  });

  if (status === 401) {
    const err = new Error(
      'Gmail authentication expired. Please sign in with Google again.'
    );

    err.statusCode = 401;

    return err;
  }

  if (status === 403) {
    const err = new Error(
      'Access denied. Your Google account has not granted the required Gmail permissions. Please sign in with Google again and allow Gmail access.'
    );

    err.statusCode = 403;

    return err;
  }

  if (status === 404) {
    const err = new Error(
      'The requested Gmail email could not be found.'
    );

    err.statusCode = 404;

    return err;
  }

  const err = new Error(message);

  err.statusCode = status || 500;

  return err;
}


/**
 * ============================================================
 * FETCH MESSAGE METADATA
 * ============================================================
 */
async function fetchMessageMetadata(
  gmail,
  messageIds,
  headers = ['From', 'To', 'Subject', 'Date']
) {
  const results = await Promise.allSettled(
    messageIds.map(async (msgId) => {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msgId,
        format: 'metadata',
        metadataHeaders: headers
      });

      return parseEmail(full.data);
    })
  );

  const emails = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      emails.push(result.value);
    } else {
      console.warn(
        `Skipping message ${messageIds[index]}:`,
        result.reason?.message
      );
    }
  });

  return emails;
}


/**
 * ============================================================
 * GET INBOX EMAILS
 * ============================================================
 */
export async function getInboxEmails(
  tokens,
  {
    maxResults = 20,
    query = '',
    pageToken
  } = {}
) {
  try {
    const gmail = getGmailClient(tokens);

    const params = {
      userId: 'me',
      maxResults: Math.min(
        parseInt(maxResults, 10) || 20,
        MAX_RESULTS_LIMIT
      ),
      labelIds: ['INBOX']
    };

    if (query && String(query).trim()) {
      params.q = String(query).trim();
    }

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response =
      await gmail.users.messages.list(params);

    const messageIds =
      (response.data.messages || []).map(
        (message) => message.id
      );

    const emails = await fetchMessageMetadata(
      gmail,
      messageIds
    );

    return {
      emails,
      nextPageToken:
        response.data.nextPageToken || null
    };
  } catch (error) {
    throw normalizeGmailError(error);
  }
}


/**
 * ============================================================
 * GET SENT EMAILS
 * ============================================================
 */
export async function getSentEmails(
  tokens,
  {
    maxResults = 20,
    pageToken
  } = {}
) {
  try {
    const gmail = getGmailClient(tokens);

    const params = {
      userId: 'me',
      maxResults: Math.min(
        parseInt(maxResults, 10) || 20,
        MAX_RESULTS_LIMIT
      ),
      labelIds: ['SENT']
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response =
      await gmail.users.messages.list(params);

    const messageIds =
      (response.data.messages || []).map(
        (message) => message.id
      );

    const emails = await fetchMessageMetadata(
      gmail,
      messageIds
    );

    return {
      emails,
      nextPageToken:
        response.data.nextPageToken || null
    };
  } catch (error) {
    throw normalizeGmailError(error);
  }
}


/**
 * ============================================================
 * GET EMAIL BY ID
 * ============================================================
 */
export async function getEmailById(
  tokens,
  emailId
) {
  if (!emailId) {
    const error = new Error(
      'Email ID is required.'
    );

    error.statusCode = 400;

    throw error;
  }

  try {
    const gmail = getGmailClient(tokens);

    const response =
      await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full'
      });

    return parseEmail(response.data);
  } catch (error) {
    throw normalizeGmailError(error);
  }
}


/**
 * ============================================================
 * SEARCH EMAILS
 * ============================================================
 */
export async function searchEmails(
  tokens,
  {
    query,
    maxResults = 20
  } = {}
) {
  try {
    const gmail = getGmailClient(tokens);

    const params = {
      userId: 'me',
      maxResults: Math.min(
        parseInt(maxResults, 10) || 20,
        MAX_RESULTS_LIMIT
      )
    };

    if (query && String(query).trim()) {
      params.q = String(query).trim();
    }

    const response =
      await gmail.users.messages.list(params);

    const messageIds =
      (response.data.messages || []).map(
        (message) => message.id
      );

    return await fetchMessageMetadata(
      gmail,
      messageIds
    );
  } catch (error) {
    throw normalizeGmailError(error);
  }
}


/**
 * ============================================================
 * RESOLVE RECIPIENT
 * ============================================================
 *
 * Converts:
 *
 * "Tushita"
 *
 * into:
 *
 * tushita@example.com
 *
 * using Gmail messages.
 */
export async function resolveRecipient(
  tokens,
  name
) {
  if (!tokens) {
    const error = new Error(
      'Gmail authentication tokens are missing.'
    );

    error.statusCode = 401;

    throw error;
  }

  if (!name || !String(name).trim()) {
    const error = new Error(
      'Recipient name is required.'
    );

    error.statusCode = 400;

    throw error;
  }

  try {
    const gmail = getGmailClient(tokens);

    const searchName =
      String(name).trim();

    const response =
      await gmail.users.messages.list({
        userId: 'me',
        q: `"${searchName}"`,
        maxResults: 20
      });

    const messageIds =
      (response.data.messages || []).map(
        (message) => message.id
      );

    if (messageIds.length === 0) {
      throw new Error(
        `Could not find an email address for "${searchName}".`
      );
    }

    const results =
      await Promise.allSettled(
        messageIds.map(async (messageId) => {
          const message =
            await gmail.users.messages.get({
              userId: 'me',
              id: messageId,
              format: 'metadata',
              metadataHeaders: [
                'From',
                'To'
              ]
            });

          return (
            message.data.payload?.headers || []
          );
        })
      );

    const candidates = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        continue;
      }

      for (const header of result.value) {
        const value = header.value || '';

        /**
         * Example:
         *
         * Tushita <tushita@example.com>
         */
        const emailMatch =
          value.match(
            /<([^<>@\s]+@[^<>@\s]+)>/
          );

        if (emailMatch) {
          const email =
            emailMatch[1].toLowerCase();

          if (
            !candidates.some(
              (candidate) =>
                candidate.email === email
            )
          ) {
            candidates.push({
              email,
              value
            });
          }

          continue;
        }

        /**
         * Plain email address.
         */
        const plainEmail =
          value.match(
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
          );

        if (plainEmail) {
          const email =
            plainEmail[0].toLowerCase();

          if (
            !candidates.some(
              (candidate) =>
                candidate.email === email
            )
          ) {
            candidates.push({
              email,
              value
            });
          }
        }
      }
    }

    if (candidates.length === 0) {
      throw new Error(
        `Could not find an email address for "${searchName}".`
      );
    }

    const normalizedName =
      searchName
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    const nameMatch =
      candidates.find((candidate) =>
        candidate.value
          .toLowerCase()
          .includes(normalizedName)
      );

    const selected =
      nameMatch || candidates[0];

    console.log(
      `Resolved recipient "${searchName}" -> ${selected.email}`
    );

    return selected.email;
  } catch (error) {
    throw normalizeGmailError(error);
  }
}


/**
 * ============================================================
 * SEND EMAIL
 * ============================================================
 *
 * IMPORTANT:
 *
 * This function expects:
 *
 * sendEmail(tokens, {
 *   to,
 *   subject,
 *   body
 * })
 */
export async function sendEmail(
  tokens,
  {
    to,
    subject,
    body
  } = {}
) {
  if (!tokens) {
    const error = new Error(
      'Gmail authentication tokens are missing.'
    );

    error.statusCode = 401;

    throw error;
  }

  if (!to) {
    throw new Error(
      'Recipient email address is required.'
    );
  }

  if (!subject) {
    throw new Error(
      'Email subject is required.'
    );
  }

  if (!body) {
    throw new Error(
      'Email body is required.'
    );
  }

  try {
    const gmail =
      getGmailClient(tokens);

    const senderName =
      'Dharshini Rathinam';

    const senderEmail =
      'dharshinirathinam40@gmail.com';

    const emailParts = [
      `From: ${senderName} <${senderEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ];

    const raw =
      Buffer.from(
        emailParts.join('\r\n')
      )
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response =
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw
        }
      });

    console.log(
      'Gmail email sent successfully:',
      response.data.id
    );

    return {
      id: response.data.id,
      labelIds:
        response.data.labelIds || [],
      sent: true,
      recipient: to
    };
  } catch (error) {
    throw normalizeGmailError(error);
  }
}


/**
 * ============================================================
 * REPLY TO EMAIL
 * ============================================================
 */
export async function replyToEmail(
  tokens,
  emailId,
  {
    body
  } = {}
) {
  if (!emailId) {
    throw new Error(
      'Email ID is required.'
    );
  }

  if (!body) {
    throw new Error(
      'Reply body is required.'
    );
  }

  try {
    const gmail =
      getGmailClient(tokens);

    const original =
      await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'metadata',
        metadataHeaders: [
          'From',
          'To',
          'Subject',
          'Message-ID'
        ]
      });

    const headers =
      original.data.payload?.headers || [];

    const from =
      headers.find(
        (header) =>
          header.name.toLowerCase() ===
          'from'
      )?.value || '';

    const subject =
      headers.find(
        (header) =>
          header.name.toLowerCase() ===
          'subject'
      )?.value || '';

    const messageId =
      headers.find(
        (header) =>
          header.name.toLowerCase() ===
          'message-id'
      )?.value || '';

    const emailMatch =
      from.match(/<([^>]+)>/);

    const toAddress =
      emailMatch
        ? emailMatch[1]
        : from.trim();

    if (!toAddress) {
      throw new Error(
        'Could not determine the recipient of the original email.'
      );
    }

    const replySubject =
      subject.toLowerCase().startsWith('re:')
        ? subject
        : `Re: ${subject}`;

    const emailParts = [
      `To: ${toAddress}`,
      `Subject: ${replySubject}`,
      messageId
        ? `In-Reply-To: ${messageId}`
        : '',
      messageId
        ? `References: ${messageId}`
        : '',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].filter(Boolean);

    const raw =
      Buffer.from(
        emailParts.join('\r\n')
      )
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response =
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
          threadId:
            original.data.threadId
        }
      });

    console.log(
      'Gmail reply sent successfully:',
      response.data.id
    );

    return {
      id: response.data.id,
      labelIds:
        response.data.labelIds || [],
      sent: true,
      recipient: toAddress
    };
  } catch (error) {
    throw normalizeGmailError(error);
  }
}