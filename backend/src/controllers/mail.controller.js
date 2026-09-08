import {
  getInboxEmails,
  getSentEmails,
  getEmailById,
  sendEmail,
  replyToEmail,
  searchEmails
} from '../services/gmail.service.js';
import { buildSearchQuery } from '../utils/gmailParser.js';

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Normalize Gmail search dates to YYYYMMDD (Gmail query syntax).
function normalizeDateFilter(value) {
  if (!value) return '';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const compact = /^\d{8}$/.test(value);
  if (iso) return value.replace(/-/g, '');
  if (compact) return value;
  throw { statusCode: 400, message: 'Dates must be in YYYY-MM-DD or YYYYMMDD format' };
}

export const getInbox = async (req, res, next) => {
  try {
    const { maxResults, pageToken } = req.query;
    const result = await getInboxEmails(req.session.tokens, {
      maxResults: parseInt(maxResults) || 20,
      pageToken
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getSent = async (req, res, next) => {
  try {
    const { maxResults, pageToken } = req.query;
    const result = await getSentEmails(req.session.tokens, {
      maxResults: parseInt(maxResults) || 20,
      pageToken
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Email ID is required' });
    const email = await getEmailById(req.session.tokens, id);
    res.json({ email });
  } catch (err) {
    next(err);
  }
};

export const send = async (req, res, next) => {
  try {
    const { to, subject, body } = req.body || {};

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject and body are required' });
    }
    if (!validateEmail(to)) {
      return res.status(400).json({ error: 'Invalid recipient email address' });
    }

    const result = await sendEmail(req.session.tokens, { to, subject, body });
    res.status(201).json({ success: true, messageId: result.id });
  } catch (err) {
    next(err);
  }
};

export const reply = async (req, res, next) => {
  try {
    const { emailId, body } = req.body || {};

    if (!emailId || !body) {
      return res.status(400).json({ error: 'emailId and body are required' });
    }

    const result = await replyToEmail(req.session.tokens, emailId, { body });
    res.status(201).json({ success: true, messageId: result.id });
  } catch (err) {
    next(err);
  }
};

export const search = async (req, res, next) => {
  try {
    const { sender, keyword, after, before, unread, limit } = req.body || {};

    let normalizedAfter;
    let normalizedBefore;
    try {
      normalizedAfter = normalizeDateFilter(after);
      normalizedBefore = normalizeDateFilter(before);
    } catch (err) {
      return res.status(err.statusCode || 400).json({ error: err.message });
    }

    const query = buildSearchQuery({
      sender,
      keyword,
      after: normalizedAfter,
      before: normalizedBefore,
      unread: !!unread
    });
    const emails = await searchEmails(req.session.tokens, {
      query,
      maxResults: parseInt(limit) || 50
    });
    res.json({ emails });
  } catch (err) {
    next(err);
  }
};