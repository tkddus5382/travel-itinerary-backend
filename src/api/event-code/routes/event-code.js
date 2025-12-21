'use strict';

/**
 * event-code router
 */

module.exports = {
  routes: [
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
  ],
};
