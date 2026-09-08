import crypto from 'crypto';
import {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getUserInfo
} from '../services/oauth.service.js';

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'https://nebulamail.onrender.com';
}

function hasGoogleConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );
}

export const googleLogin = (req, res) => {
  if (!hasGoogleConfig()) {
    return res.status(500).json({
      error: 'Google OAuth is not configured on the server.'
    });
  }

  try {
    const oauth2Client = createOAuth2Client();
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    const authUrl = getAuthUrl(oauth2Client, state);
    res.redirect(authUrl);
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(500).json({ error: 'Failed to start Google sign-in.' });
  }
};

export const googleCallback = async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError === 'access_denied') {
    return res.redirect(`${getFrontendUrl()}/login?error=denied`);
  }

  if (!code) {
    return res.redirect(`${getFrontendUrl()}/login?error=oauth`);
  }

  if (!state || !req.session.oauthState || state !== req.session.oauthState) {
    return res.redirect(`${getFrontendUrl()}/login?error=state`);
  }

  delete req.session.oauthState;

  try {
    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);

    if (!tokens.refresh_token) {
      console.warn(
        'No refresh token issued. The access token will not be renewable after expiry.'
      );
    }

    oauth2Client.setCredentials(tokens);
    const userInfo = await getUserInfo(oauth2Client);

    req.session.tokens = tokens;
req.session.user = {
  id: userInfo.id,
  email: userInfo.email,
  name: userInfo.name,
  picture: userInfo.picture
};

req.session.save((err) => {
  if (err) {
    console.error('Session save error:', err);
    return res.redirect(`${getFrontendUrl()}/login?error=session`);
  }

  console.log('Google login successful');
  console.log('Logged-in user:', userInfo.email);
  console.log('Gmail tokens saved in session');

  res.redirect(`${getFrontendUrl()}/inbox?login=success`);
});
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(`${getFrontendUrl()}/login?error=oauth`);
  }
};

export const getMe = (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};