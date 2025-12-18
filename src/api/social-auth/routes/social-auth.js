'use strict';

/**
 * social-auth router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::social-auth.social-auth');
