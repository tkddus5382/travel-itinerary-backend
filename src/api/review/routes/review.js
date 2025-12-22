'use strict';

/**
 * review router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Custom route for getting user's reviews
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
    // Default CRUD routes
    ...createCoreRouter('api::review.review').routes,
  ],
};
