import { runAI } from '../services/ai.service.js';


// ==================================================
// AI CHAT CONTROLLER
// ==================================================

export async function chatController(req, res, next) {

  try {

    // --------------------------------------------
    // GET REQUEST DATA
    // --------------------------------------------

    const {
      message,
      context
    } = req.body;


    // --------------------------------------------
    // VALIDATE MESSAGE
    // --------------------------------------------

    if (
      !message ||
      !String(message).trim()
    ) {

      return res.status(400).json({
        error: 'Message is required.'
      });

    }


    // --------------------------------------------
    // GET GMAIL OAUTH TOKENS
    // --------------------------------------------

    const tokens =
      req.session?.tokens;


    // --------------------------------------------
    // CHECK GMAIL AUTHENTICATION
    // --------------------------------------------

    if (!tokens) {

      return res.status(401).json({
        error:
          'Gmail authentication tokens are missing.'
      });

    }


    // --------------------------------------------
    // DEBUG INFORMATION
    // --------------------------------------------

    console.log('========================================');
    console.log('AI CHAT REQUEST');
    console.log('========================================');

    console.log(
      'User:',
      req.session?.user?.email || 'Unknown'
    );

    console.log(
      'Message:',
      message
    );

    console.log(
      'Context:',
      context || {}
    );

    console.log(
      'Gmail tokens available:',
      {
        access_token:
          Boolean(tokens.access_token),

        refresh_token:
          Boolean(tokens.refresh_token)
      }
    );

    console.log('========================================');


    // --------------------------------------------
    // RUN AI
    // --------------------------------------------

    const result = await runAI(
      message,
      tokens,
      context || {}
    );


    // --------------------------------------------
    // RETURN AI RESULT
    // --------------------------------------------

    return res.json(result);

  } catch (error) {

    // --------------------------------------------
    // LOG ERROR
    // --------------------------------------------

    console.error(
      '========================================'
    );

    console.error(
      'AI CONTROLLER ERROR'
    );

    console.error(error);

    console.error(
      '========================================'
    );


    // --------------------------------------------
    // EXPRESS ERROR HANDLER
    // --------------------------------------------

    if (next) {
      return next(error);
    }


    // --------------------------------------------
    // FALLBACK ERROR RESPONSE
    // --------------------------------------------

    return res.status(500).json({

      error:
        error?.message ||
        'Failed to process AI request.'

    });

  }

}