const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const { withLogto } = require('@logto/express'); // ⬅️ add LogtoClient

const { registerFromSocial } = require('../services/authService');

// Logto middleware setup
const logtoMiddleware = withLogto({
  endpoint: process.env.LOGTO_ENDPOINT,
  appId: process.env.LOGTO_APP_ID,
  appSecret: process.env.LOGTO_APP_SECRET,
  baseUrl: process.env.BASE_URL,
  // scopes: ['openid', 'email', 'profile'],
});

// Redirect user to social login provider
const CALLBACK_URIS = {
    google: 'https://1wat6l.logto.app/callback/c9w88wpr4s1gmorgsep6i',
    github: 'https://1wat6l.logto.app/callback/lrmk60b044qpgyjr0wlmg',
    facebook: 'https://1wat6l.logto.app/callback/tkykegatrtck33gjbl0nx',
  };
  
  const connect = asyncHandler(async (req, res) => {
    const { provider } = req.params;
  
    const redirectUri = CALLBACK_URIS[provider];
    if (!redirectUri) {
      return res.status(400).json({ message: 'Unsupported social provider' });
    }
  
    const returnTo = `${process.env.BASE_URL}/api/auth/social-callback`;
  
    const url = `${process.env.LOGTO_ENDPOINT}/signin/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}&return_to=${encodeURIComponent(returnTo)}`;
  
    res.redirect(url);
  });
  
  

// Callback route — make sure this matches the redirectUri
const socialCallback = asyncHandler(async (req, res) => {
  const userInfo = req.user;

  const { email, name, picture } = userInfo;

  if (!email) {
    return res.status(400).json({ message: 'No email provided by provider' });
  }

  const { user, accessToken, refreshToken } = await registerFromSocial({
    email,
    fullName: name,
    avatar: picture,
  });

  // For mobile app redirect
  res.redirect(`jobconnect://social-callback?token=${accessToken}&refreshToken=${refreshToken}`);

  // OR for debugging:
  /*
  res.status(200).json({
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    },
  });
  */
});

// Sign out route
const signOutHandler = asyncHandler(async (req, res) => {
    const redirectUri = `${process.env.BASE_URL}/goodbye`;
  
    const signOutUrl = `${process.env.LOGTO_ENDPOINT}/sign-out?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
  
    res.redirect(signOutUrl);
  });
  
  

// Export routes
module.exports = {
  connect,
  socialCallback,
  signOut: signOutHandler,
  logtoMiddleware, // export middleware to apply it in route
};
