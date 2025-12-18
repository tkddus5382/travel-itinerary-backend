module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/social-auth/link',
      handler: 'social-auth.link',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/social-auth/find-user',
      handler: 'social-auth.findUser',
      config: {
        auth: false, // Allow unauthenticated access for login flow
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/social-auth/me',
      handler: 'social-auth.me',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/social-auth/:id/unlink',
      handler: 'social-auth.unlink',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
