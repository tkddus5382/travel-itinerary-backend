'use strict';

/**
 * avatar router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/avatars/available',
      handler: 'avatar.available',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/avatars/select',
      handler: 'avatar.select',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/avatars/unlock',
      handler: 'avatar.unlock',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
