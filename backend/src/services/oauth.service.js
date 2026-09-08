import { google } from 'googleapis';

/**
 * Create Google OAuth2 client
 */
export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is missing.');
  }

  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is missing.');
  }

  if (!redirectUri) {
    throw new Error('GOOGLE_REDIRECT_URI is missing.');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Generate Google login URL
 */
export function getAuthUrl(oauth2Client, state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',

    // Force Google to show the consent screen again.
    // This is important when Gmail scopes have changed.
    prompt: 'consent',

    state,

    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
    ]
  });
}

/**
 * Exchange Google authorization code for tokens
 */
export async function getTokensFromCode(
  oauth2Client,
  code
) {
  if (!code) {
    throw new Error('Google authorization code is missing.');
  }

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens) {
    throw new Error(
      'Google did not return authentication tokens.'
    );
  }

  return tokens;
}

/**
 * Get Google account information
 */
export async function getUserInfo(oauth2Client) {
  const oauth2 = google.oauth2({
    version: 'v2',
    auth: oauth2Client
  });

  const { data } = await oauth2.userinfo.get();

  return data;
}