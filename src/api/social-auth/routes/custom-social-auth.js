module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/social-auths/link',
      handler: 'social-auth.link',
      config: {
        prefix: '',
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/social-auths/find-user',
      handler: 'social-auth.findUser',
      config: {
        prefix: '',
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/social-auths/me',
      handler: 'social-auth.me',
      config: {
        prefix: '',
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/social-auths/:id/unlink',
      handler: 'social-auth.unlink',
      config: {
        prefix: '',
        policies: [],
        middlewares: [],
      },
    },
  ],
};
