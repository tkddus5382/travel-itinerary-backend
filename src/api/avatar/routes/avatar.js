'use strict';

/**
 * avatar router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::avatar.avatar');

const customRoutes = [
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
];

module.exports = {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes,
  ],
};
