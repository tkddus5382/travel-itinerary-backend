'use strict';

/**
 * event-code router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::event-code.event-code');

const customRoutes = [
  {
    method: 'POST',
    path: '/event-codes/redeem',
    handler: 'event-code.redeem',
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
