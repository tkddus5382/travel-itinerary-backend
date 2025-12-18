module.exports = (plugin) => {
  // Load custom auth controller
  const authController = require('./controllers/Auth')(plugin);
  plugin.controllers.auth = authController.controllers.auth;

  // Add custom route for Google OAuth callback
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/google/callback',
    handler: 'auth.googleCallback',
    config: {
      auth: false,
      prefix: '',
    },
  });

  // Add social auth routes
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/auth/link-social',
    handler: 'auth.linkSocial',
    config: {
      prefix: '',
    },
  });

  plugin.routes['content-api'].routes.push({
    method: 'GET',
    path: '/auth/my-social',
    handler: 'auth.mySocial',
    config: {
      prefix: '',
    },
  });

  return plugin;
};
