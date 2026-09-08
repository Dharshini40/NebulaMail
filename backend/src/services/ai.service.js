import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

import {
  composeEmail,
  searchEmails,
  openEmail,
  filterEmails,
  replyToEmail,
  sendEmail
} from '../ai/tools/index.js';

// ==================================================
// GEMINI CONFIGURATION
// ==================================================

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  : null;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.6-flash';


// ==================================================
// GEMINI TOOLS
// ==================================================

const tools = [
  {
    functionDeclarations: [

      // ==================================================
      // COMPOSE EMAIL
      // ==================================================

      {
        name: 'compose_email',

        description:
          'Prepare an email for the user to compose. Do not send it.',

        parameters: {
          type: Type.OBJECT,

          properties: {
            to: {
              type: Type.STRING,
              description:
                'Recipient email address'
            },

            subject: {
              type: Type.STRING,
              description:
                'Email subject'
            },

            body: {
              type: Type.STRING,
              description: `Complete email body.
End with exactly:
Best regards,
Dharshini Rathinam`
            }
          },

          required: [
            'to',
            'subject',
            'body'
          ]
        }
      },


      // ==================================================
      // SEARCH EMAILS
      // ==================================================

      {
        name: 'search_emails',

        description:
          'Search the authenticated user Gmail messages. Use this when the user wants to find, search, show, list, or locate emails.',

        parameters: {
          type: Type.OBJECT,

          properties: {
            sender: {
              type: Type.STRING,
              description:
                'Sender name or email address'
            },

            keyword: {
              type: Type.STRING,
              description:
                'Keyword to search in email'
            },

            after: {
              type: Type.STRING,
              description:
                'Search emails after this date. Use YYYY-MM-DD when possible.'
            },

            before: {
              type: Type.STRING,
              description:
                'Search emails before this date. Use YYYY-MM-DD when possible.'
            },

            unread: {
              type: Type.BOOLEAN,
              description:
                'Whether to search only unread emails'
            },

            limit: {
              type: Type.INTEGER,
              description:
                'Maximum number of emails to return'
            }
          }
        }
      },


      // ==================================================
      // OPEN EMAIL
      // ==================================================

      {
        name: 'open_email',

        description:
          'Open and read a specific Gmail email using its Gmail message ID.',

        parameters: {
          type: Type.OBJECT,

          properties: {
            emailId: {
              type: Type.STRING,
              description:
                'Gmail message ID'
            }
          },

          required: [
            'emailId'
          ]
        }
      },


      // ==================================================
      // FILTER EMAILS
      // ==================================================

      {
        name: 'filter_emails',

        description:
          'Filter the authenticated user Gmail messages based on sender, keyword, date, or unread status.',

        parameters: {
          type: Type.OBJECT,

          properties: {
            sender: {
              type: Type.STRING,
              description:
                'Sender name or email address'
            },

            keyword: {
              type: Type.STRING,
              description:
                'Keyword to search for'
            },

            after: {
              type: Type.STRING,
              description:
                'Filter emails after this date'
            },

            before: {
              type: Type.STRING,
              description:
                'Filter emails before this date'
            },

            unread: {
              type: Type.BOOLEAN,
              description:
                'Whether to include only unread emails'
            }
          }
        }
      },


      // ==================================================
      // REPLY TO EMAIL
      // ==================================================

      {
        name: 'reply_to_email',

        description:
          'Prepare a reply to an existing Gmail email. Do not send it unless the user explicitly asks to send it.',

        parameters: {
          type: Type.OBJECT,

          properties: {
            emailId: {
              type: Type.STRING,
              description:
                'Gmail message ID of the email to reply to'
            },

            body: {
              type: Type.STRING,
              description: `Reply body.
End with exactly:
Best regards,
Dharshini Rathinam`
            }
          },

          required: [
            'emailId',
            'body'
          ]
        }
      },


      // ==================================================
      // SEND EMAIL
      // ==================================================

      {
        name: 'send_email',

        description: `Send an email using the authenticated Gmail account.

The recipient can be either:

1. An email address
2. A person's name

If the user provides a person's name, the send_email
tool can resolve the person's email address from the
user's Gmail messages.

Do not invent an email address.

Only use this tool when the user explicitly asks
to SEND an email.`,

        parameters: {
          type: Type.OBJECT,

          properties: {
            to: {
              type: Type.STRING,
              description:
                'Recipient email address or recipient name'
            },

            subject: {
              type: Type.STRING,
              description:
                'Email subject'
            },

            body: {
              type: Type.STRING,
              description: `Complete email body.
End with exactly:
Best regards,
Dharshini Rathinam`
            }
          },

          required: [
            'to',
            'subject',
            'body'
          ]
        }
      }

    ]
  }
];


// ==================================================
// SYSTEM PROMPT
// ==================================================

const systemPrompt = `
You are the AI assistant for Nebula KnowLab.

You control the authenticated user's mail application.

The Gmail account is determined by the user's
authenticated Google OAuth session. Never assume
or hardcode a particular Gmail address.

The sender's name/signature is:

Dharshini Rathinam


==================================================
EMAIL SIGNATURE
==================================================

When creating an email body, always end with exactly:

Best regards,
Dharshini Rathinam

Never use:

Best regards,
Nebula KnowLab


==================================================
AVAILABLE TOOLS
==================================================

compose_email
search_emails
open_email
filter_emails
reply_to_email
send_email


==================================================
MULTI-STEP TOOL USE
==================================================

You are allowed to use multiple tools for one
user request.

IMPORTANT:

If the result of one tool is needed to perform
another action, use the next tool.

Example:

User:
"Open the latest email"

Correct flow:

1. search_emails
2. Inspect the returned emails
3. Identify the latest email ID
4. open_email using that email ID
5. Return a natural-language answer

Do NOT stop after search_emails when the user
asked to open/read the email.


Another example:

User:
"Find the latest email from Shalini and open it"

Correct flow:

1. search_emails
2. Identify the latest matching email
3. open_email
4. Return the email content


==================================================
SEND EMAIL RULES
==================================================

When the user explicitly asks you to SEND an email:

1. Use send_email.
2. The email must actually be sent through Gmail.
3. Wait for the Gmail tool result.
4. Confirm the result naturally.

If the user provides a complete email address,
use that address directly.

If the user provides only a person's name,
do NOT invent an email address.

The application/tool may resolve the person's
email address from Gmail messages.


Example:

User:

Send a mail to tushita@example.com saying hello

Use:

send_email

to:
tushita@example.com

subject:
Hello

body:

Hello,

Best regards,
Dharshini Rathinam


==================================================
SEARCH RULES
==================================================

When the user asks:

- find emails
- search emails
- show emails
- locate emails
- list emails
- find emails from someone
- show unread emails

use:

search_emails

Examples:

Find emails from Shalini

Show unread emails

Find emails from Sarah this week

Search for emails containing meeting

Show emails from Shalini

Do NOT return raw JSON to the user.

The backend will format the Gmail result.


==================================================
OPEN EMAIL RULES
==================================================

When the user asks to:

- open an email
- read an email
- show the latest email
- open the latest email
- read the latest email
- open this email

use:

open_email

If the email ID is not already known, first
use search_emails to find the appropriate email.

Do not return raw JSON.


==================================================
FILTER RULES
==================================================

When the user asks to filter emails,
use:

filter_emails

Do not return raw JSON.


==================================================
COMPOSE RULES
==================================================

When the user asks to:

- compose an email
- draft an email
- prepare an email

use:

compose_email

Do NOT send the email unless the user
explicitly asks you to send it.


==================================================
REPLY RULES
==================================================

When the user asks to:

- draft a reply
- prepare a reply
- reply to an email

use:

reply_to_email

If the email ID is not known, first use
search_emails to identify the appropriate email.

Do NOT send the reply unless the user
explicitly asks you to send it.


==================================================
RESPONSE RULE
==================================================

After tools are executed:

NEVER expose raw JSON.

Always return a natural-language response.

Example:

Instead of:

{"emails":[...],"hasResults":true}

say:

I found 3 emails from Shalini.

Instead of:

{"sent":true,"messageId":"123"}

say:

Email sent successfully to shalini@example.com.


==================================================
IMPORTANT
==================================================

Always execute the appropriate tool.

Do not simply respond "Done" when an action
needs to be performed.

If the request requires multiple actions,
continue using tools until the request is
actually completed.

After the necessary tools are completed,
give the user a concise natural-language answer.
`;


// ==================================================
// EXECUTE APPLICATION TOOLS
// ==================================================

async function executeTool(name, args, tokens) {

  console.log('========================================');
  console.log('AI TOOL REQUEST:', name);
  console.log('AI TOOL ARGUMENTS:', args);
  console.log('========================================');

  try {

    switch (name) {

      // --------------------------------------------
      // COMPOSE
      // --------------------------------------------

      case 'compose_email':
        return await composeEmail(args);


      // --------------------------------------------
      // SEARCH
      // --------------------------------------------

      case 'search_emails':
        return await searchEmails(args, tokens);


      // --------------------------------------------
      // OPEN
      // --------------------------------------------

      case 'open_email':
        return await openEmail(args, tokens);


      // --------------------------------------------
      // FILTER
      // --------------------------------------------

      case 'filter_emails':
        return await filterEmails(args, tokens);


      // --------------------------------------------
      // REPLY
      // --------------------------------------------

      case 'reply_to_email':
        return await replyToEmail(args, tokens);


      // --------------------------------------------
      // SEND
      // --------------------------------------------

      case 'send_email':

        console.log('----------------------------------------');
        console.log('SENDING EMAIL');
        console.log('TO:', args?.to);
        console.log('SUBJECT:', args?.subject);
        console.log('----------------------------------------');

        return await sendEmail(args, tokens);


      // --------------------------------------------
      // UNKNOWN TOOL
      // --------------------------------------------

      default:

        return {
          error: `Unknown tool: ${name}`
        };
    }

  } catch (error) {

    console.error(
      `Tool execution error for ${name}:`,
      error
    );

    return {
      error:
        error?.message ||
        `Failed to execute ${name}.`
    };
  }
}


// ==================================================
// FORMAT SEARCH RESULTS
// ==================================================

function formatSearchResult(result) {

  if (!result) {
    return 'I could not find any email results.';
  }

  if (result.error) {
    return result.error;
  }

  const emails = Array.isArray(result.emails)
    ? result.emails
    : [];

  if (emails.length === 0) {
    return 'I could not find any matching emails.';
  }

  let reply =
    `I found ${emails.length} email${emails.length === 1 ? '' : 's'}.`;

  const displayEmails = emails.slice(0, 10);

  for (let i = 0; i < displayEmails.length; i++) {

    const email = displayEmails[i];

    const sender =
      email.sender ||
      email.from ||
      'Unknown sender';

    const subject =
      email.subject ||
      '(No subject)';

    const date =
      email.date ||
      '';

    const status =
      email.isUnread === true
        ? 'Unread'
        : 'Read';

    reply +=
      `\n\n${i + 1}. **Sender:** ${sender}`;

    reply +=
      `\n**Subject:** ${subject}`;

    if (date) {
      reply +=
        `\n**Date:** ${date}`;
    }

    reply +=
      `\n**Status:** ${status}`;

    if (email.snippet) {
      reply +=
        `\n**Preview:** ${email.snippet}`;
    }
  }

  if (emails.length > 10) {
    reply +=
      `\n\nShowing the first 10 results.`;
  }

  return reply;
}


// ==================================================
// FORMAT OPEN EMAIL RESULT
// ==================================================

function formatOpenEmailResult(result) {

  if (!result) {
    return 'I could not open that email.';
  }

  if (result.error) {
    return result.error;
  }

  const email =
    result.email ||
    result;

  if (
    !email ||
    typeof email !== 'object'
  ) {
    return 'I could not read the email.';
  }

  const sender =
    email.sender ||
    email.from ||
    'Unknown sender';

  const subject =
    email.subject ||
    '(No subject)';

  const date =
    email.date ||
    '';

  const body =
    email.body ||
    email.snippet ||
    '';

  let reply =
    `Here is the email:\n\n**From:** ${sender}\n**Subject:** ${subject}`;

  if (date) {
    reply +=
      `\n**Date:** ${date}`;
  }

  if (body) {
    reply +=
      `\n\n${body}`;
  }

  return reply;
}


// ==================================================
// FORMAT FILTER RESULT
// ==================================================

function formatFilterResult(result) {

  if (!result) {
    return 'I could not apply the email filter.';
  }

  if (result.error) {
    return result.error;
  }

  const emails = Array.isArray(result.emails)
    ? result.emails
    : [];

  if (emails.length === 0) {
    return 'No emails matched the filter.';
  }

  let reply =
    `I found ${emails.length} email${emails.length === 1 ? '' : 's'} matching the filter.`;

  const displayEmails = emails.slice(0, 10);

  for (let i = 0; i < displayEmails.length; i++) {

    const email = displayEmails[i];

    const sender =
      email.sender ||
      email.from ||
      'Unknown sender';

    const subject =
      email.subject ||
      '(No subject)';

    const date =
      email.date ||
      '';

    reply +=
      `\n\n${i + 1}. **${subject}**`;

    reply +=
      `\nSender: ${sender}`;

    if (date) {
      reply +=
        `\nDate: ${date}`;
    }
  }

  return reply;
}


// ==================================================
// FORMAT COMPOSE RESULT
// ==================================================

function formatComposeResult(result, args) {

  if (result?.error) {
    return result.error;
  }

  const recipient =
    result?.recipient ||
    result?.to ||
    args?.to ||
    '';

  if (recipient) {
    return `Your email draft is ready for ${recipient}.`;
  }

  return 'Your email draft is ready.';
}


// ==================================================
// FORMAT REPLY RESULT
// ==================================================

function formatReplyResult(result) {

  if (result?.error) {
    return result.error;
  }

  return 'Your reply draft is ready.';
}


// ==================================================
// FORMAT SEND RESULT
// ==================================================

function formatSendResult(result, args) {

  if (!result) {
    return 'The email could not be sent.';
  }

  if (result.error) {
    return result.error;
  }

  if (result.sent === true) {

    const recipient =
      result.recipient ||
      result.to ||
      args?.to ||
      'the recipient';

    return `Email sent successfully to ${recipient}.`;
  }

  return 'The email was not sent.';
}


// ==================================================
// CREATE HUMAN-READABLE TOOL RESPONSE
// ==================================================

function createToolReply(name, result, args) {

  switch (name) {

    case 'search_emails':
      return formatSearchResult(result);

    case 'open_email':
      return formatOpenEmailResult(result);

    case 'filter_emails':
      return formatFilterResult(result);

    case 'compose_email':
      return formatComposeResult(result, args);

    case 'reply_to_email':
      return formatReplyResult(result);

    case 'send_email':
      return formatSendResult(result, args);

    default:

      if (result?.error) {
        return result.error;
      }

      return 'The requested action was completed successfully.';
  }
}


// ==================================================
// GEMINI 429 HANDLER
// ==================================================

function isQuotaError(error) {

  const message =
    String(error?.message || '');

  return (
    error?.status === 429 ||
    error?.code === 429 ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('quota') ||
    message.includes('Quota exceeded')
  );
}


// ==================================================
// MAIN AI FUNCTION
// ==================================================

export async function runAI(
  userMessage,
  tokens,
  context = {}
) {

  // --------------------------------------------
  // CHECK GEMINI
  // --------------------------------------------

  if (!gemini) {

    return {
      error:
        'Gemini API key is not configured on the server.'
    };
  }


  // --------------------------------------------
  // CHECK GMAIL TOKENS
  // --------------------------------------------

  if (!tokens) {

    return {
      error:
        'Gmail authentication tokens are missing.'
    };
  }


  // --------------------------------------------
  // CHECK USER MESSAGE
  // --------------------------------------------

  if (
    !userMessage ||
    !String(userMessage).trim()
  ) {

    return {
      error:
        'Please enter a message.'
    };
  }


  try {

    const userText =
      String(userMessage).trim();


    // ------------------------------------------
    // CONTEXT
    // ------------------------------------------

    const contextText = `
Current mail application context:

View:
${context?.view || 'Unknown'}

Current email ID:
${context?.currentEmail || 'None'}

Filters:
${JSON.stringify(context?.filters || {}, null, 2)}

Compose state:
${JSON.stringify(context?.composeState || {}, null, 2)}
`;


    // ------------------------------------------
    // INITIAL CONTENTS
    // ------------------------------------------

    const contents = [

      {
        role: 'user',

        parts: [

          {
            text: `${systemPrompt}

==================================================
CURRENT APPLICATION CONTEXT
==================================================

${contextText}

==================================================
USER REQUEST
==================================================

${userText}`
          }

        ]
      }

    ];


    // ------------------------------------------
    // ACTIONS
    // ------------------------------------------

    const actions = [];


    // ------------------------------------------
    // MAX TOOL ROUNDS
    // ------------------------------------------

    const MAX_TOOL_ROUNDS = 5;


    // ------------------------------------------
    // TOOL-CALL LOOP
    // ------------------------------------------

    for (
      let round = 0;
      round < MAX_TOOL_ROUNDS;
      round++
    ) {

      console.log('========================================');
      console.log(
        `GEMINI ROUND ${round + 1}`
      );
      console.log('========================================');


      let response;


      // ----------------------------------------
      // CALL GEMINI
      // ----------------------------------------

      try {

        response =
          await gemini.models.generateContent({

            model: GEMINI_MODEL,

            contents,

            config: {
              tools
            }

          });

      } catch (error) {

        console.error(
          'Gemini API error:',
          error
        );


        // --------------------------------------
        // QUOTA ERROR
        // --------------------------------------

        if (isQuotaError(error)) {

          return {
            reply:
              'The AI service quota has been reached. Please try again later.',

            response:
              'The AI service quota has been reached. Please try again later.',

            error:
              'The AI service quota has been reached. Please try again later.',

            actions
          };
        }


        throw error;
      }


      // ----------------------------------------
      // NO FUNCTION CALL
      // ----------------------------------------

      if (
        !response?.functionCalls ||
        response.functionCalls.length === 0
      ) {

        const reply =
          response?.text?.trim() ||
          'I could not generate a response.';


        console.log(
          '========================================'
        );

        console.log(
          'FINAL ASSISTANT REPLY:'
        );

        console.log(reply);

        console.log(
          '========================================'
        );


        return {

          reply,

          response: reply,

          actions

        };
      }


      // ----------------------------------------
      // PRESERVE GEMINI FUNCTION CALL
      // ----------------------------------------

      const modelContent =
        response?.candidates?.[0]?.content;


      if (modelContent) {

        contents.push(
          modelContent
        );
      }


      // ----------------------------------------
      // FUNCTION RESPONSES
      // ----------------------------------------

      const functionResponseParts = [];


      // ----------------------------------------
      // EXECUTE EVERY FUNCTION CALL
      // ----------------------------------------

      for (
        const functionCall
        of response.functionCalls
      ) {

        const name =
          functionCall.name;

        const args =
          functionCall.args || {};


        console.log(
          '========================================'
        );

        console.log(
          'GEMINI TOOL REQUEST'
        );

        console.log(
          'Tool:',
          name
        );

        console.log(
          'Arguments:',
          args
        );

        console.log(
          '========================================'
        );


        // --------------------------------------
        // EXECUTE TOOL
        // --------------------------------------

        const result =
          await executeTool(
            name,
            args,
            tokens
          );


        console.log(
          '========================================'
        );

        console.log(
          'TOOL RESULT'
        );

        console.log(result);

        console.log(
          '========================================'
        );


        // --------------------------------------
        // SAVE ACTION
        // --------------------------------------

        const actionResult = {

          action: name,

          ...(
            result &&
            typeof result === 'object'

              ? result

              : {
                  result
                }
          )

        };


        actions.push({

          name,

          args,

          result: actionResult

        });


        // --------------------------------------
        // CREATE FUNCTION RESPONSE
        // --------------------------------------

        functionResponseParts.push({

          functionResponse: {

            name,

            ...(functionCall.id
              ? {
                  id: functionCall.id
                }
              : {}),

            response: {

              result:
                result &&
                typeof result === 'object'

                  ? result

                  : {
                      value: result
                    }

            }

          }

        });


        // --------------------------------------
        // TOOL ERROR
        // --------------------------------------

        if (result?.error) {

          console.error(
            `Tool ${name} returned an error:`,
            result.error
          );
        }

      }


      // ----------------------------------------
      // SEND TOOL RESULTS BACK TO GEMINI
      // ----------------------------------------

      contents.push({

        role: 'user',

        parts: functionResponseParts

      });


      /*
       * IMPORTANT:
       *
       * We do NOT return here.
       *
       * Gemini receives the tool result and
       * gets another opportunity to decide
       * what to do.
       *
       * This is what allows:
       *
       * search_emails
       *       ↓
       * open_email
       *       ↓
       * final answer
       *
       * to work.
       */

    }


    // ------------------------------------------
    // MAXIMUM TOOL ROUNDS REACHED
    // ------------------------------------------

    const fallbackReply =
      'I completed the available email actions, but I could not finish the request within the allowed number of steps.';


    return {

      reply:
        fallbackReply,

      response:
        fallbackReply,

      actions

    };


  } catch (error) {

    console.error(
      '========================================'
    );

    console.error(
      'AI SERVICE ERROR'
    );

    console.error(error);

    console.error(
      '========================================'
    );


    if (isQuotaError(error)) {

      const message =
        'The AI service quota has been reached. Please try again later.';


      return {

        reply: message,

        response: message,

        error: message,

        actions: []

      };
    }


    const message =
      error?.message ||
      'Failed to process AI request.';


    return {

      error: message,

      reply: message,

      response: message,

      actions: []

    };
  }
}


// ==================================================
// CHAT ALIAS
// ==================================================

export const chat = runAI;