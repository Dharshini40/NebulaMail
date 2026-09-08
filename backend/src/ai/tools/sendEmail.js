import {
  sendEmail as gmailSendEmail,
  resolveRecipient
} from '../../services/gmail.service.js';

export async function sendEmail(
  { to, subject, body },
  tokens
) {
  try {
    if (!tokens) {
      return {
        error: 'Gmail authentication tokens are missing.'
      };
    }

    if (!to) {
      return {
        error: 'Recipient email address or name is required.'
      };
    }

    if (!subject) {
      return {
        error: 'Email subject is required.'
      };
    }

    if (!body) {
      return {
        error: 'Email body is required.'
      };
    }

    let recipientEmail = String(to).trim();

    // --------------------------------------------
    // If "to" is a name instead of an email,
    // resolve the name using Gmail messages.
    // --------------------------------------------

    if (!recipientEmail.includes('@')) {
      console.log(
        `Resolving recipient name: ${recipientEmail}`
      );

      recipientEmail = await resolveRecipient(
        tokens,
        recipientEmail
      );

      console.log(
        `Resolved recipient email: ${recipientEmail}`
      );
    }

    // --------------------------------------------
    // Send using the existing Gmail service.
    // --------------------------------------------

    const result = await gmailSendEmail(tokens, {
      to: recipientEmail,
      subject,
      body
    });

    console.log(
      'Gmail send result:',
      result
    );

    return {
      sent: true,
      messageId: result.id,
      recipient: recipientEmail
    };

  } catch (error) {

    console.error(
      'sendEmail tool error:',
      error
    );

    return {
      error:
        error.message ||
        'Failed to send the email.'
    };
  }
}