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

  return plugin;
};
