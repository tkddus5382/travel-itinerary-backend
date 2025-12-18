'use strict';

/**
 * social-auth service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::social-auth.social-auth');
