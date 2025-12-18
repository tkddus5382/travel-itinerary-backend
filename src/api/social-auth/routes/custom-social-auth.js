module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/social-auths/link',
      handler: 'social-auth.link',
      config: {
        prefix: '',
        auth: {
          scope: ['authenticated'],
        },
      },
    },
    {
      method: 'GET',
      path: '/social-auths/find-user',
      handler: 'social-auth.findUser',
      config: {
        prefix: '',
        auth: false, // Allow unauthenticated access for login flow
      },
    },
    {
      method: 'GET',
      path: '/social-auths/me',
      handler: 'social-auth.me',
      config: {
        prefix: '',
        auth: {
          scope: ['authenticated'],
        },
      },
    },
    {
      method: 'DELETE',
      path: '/social-auths/:id/unlink',
      handler: 'social-auth.unlink',
      config: {
        prefix: '',
        auth: {
          scope: ['authenticated'],
        },
      },
    },
  ],
};
