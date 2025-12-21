'use strict';

/**
 * review router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::review.review');

const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/reviews/my',
      handler: 'review.myReviews',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

module.exports = {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes.routes,
  ],
};
