import { searchEmails as gmailSearch } from '../../services/gmail.service.js';

export async function resolveRecipient({ name }, tokens) {
  if (!name || !name.trim()) {
    return {
      error: 'Recipient name is required.'
    };
  }

  try {
    const searchName = name.trim();

    const emails = await gmailSearch(tokens, {
      query: `"${searchName}"`,
      maxResults: 20
    });

    if (!emails || emails.length === 0) {
      return {
        action: 'RECIPIENT_NOT_FOUND',
        name: searchName,
        found: false
      };
    }

    // Collect possible addresses from the email results.
    const candidates = [];

    for (const email of emails) {
      if (email.from) {
        candidates.push(email.from);
      }

      if (email.to) {
        candidates.push(email.to);
      }
    }

    // Remove duplicates and empty values.
    const uniqueCandidates = [
      ...new Set(
        candidates
          .filter(Boolean)
          .map((value) => value.trim())
      )
    ];

    if (uniqueCandidates.length === 0) {
      return {
        action: 'RECIPIENT_NOT_FOUND',
        name: searchName,
        found: false
      };
    }

    // Try to find an address whose display name matches.
    const lowerName = searchName.toLowerCase();

    const matchingCandidate = uniqueCandidates.find(
      (candidate) =>
        candidate.toLowerCase().includes(lowerName)
    );

    const selected = matchingCandidate || uniqueCandidates[0];

    // Extract email from:
    // Name <email@example.com>
    const match = selected.match(/<([^>]+)>/);

    const emailAddress = match
      ? match[1]
      : selected;

    if (!emailAddress.includes('@')) {
      return {
        action: 'RECIPIENT_NOT_FOUND',
        name: searchName,
        found: false
      };
    }

    return {
      action: 'RECIPIENT_RESOLVED',
      name: searchName,
      email: emailAddress,
      found: true
    };
  } catch (err) {
    console.error(
      'resolveRecipient tool error:',
      err.message
    );

    return {
      error: 'Failed to find the recipient email address.'
    };
  }
}