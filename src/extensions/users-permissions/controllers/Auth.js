const utils = require('@strapi/utils');
const { getService } = require('@strapi/plugin-users-permissions/server/utils');
const jwt = require('jsonwebtoken');

module.exports = (plugin) => {
  /**
   * Google OAuth callback with social-auth integration
   */
  plugin.controllers.auth.googleCallback = async (ctx) => {
    const { idToken, provider } = ctx.request.body;

    if (!idToken || !provider) {
      return ctx.badRequest('idToken and provider are required');
    }

    try {
      // Parse Google ID token to get user info
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString('ascii')
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleUser = JSON.parse(jsonPayload);

      if (!googleUser || !googleUser.sub || !googleUser.email) {
        return ctx.badRequest('Invalid Google ID token');
      }

      const providerId = googleUser.sub;

      // Check if this social account is linked to an existing user
      const socialAuths = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { provider, providerId },
        populate: ['user'],
      });

      let user;
      let isNewUser = false;

      if (socialAuths && socialAuths.length > 0) {
        // User found via social auth - login to that account
        user = socialAuths[0].user;
        console.log('[Google Auth] User found via social-auth:', user.id);
      } else {
        // No social auth found - check if user exists with this email
        const existingUsers = await strapi.query('plugin::users-permissions.user').findMany({
          where: { email: googleUser.email },
          limit: 1,
        });

        if (existingUsers && existingUsers.length > 0) {
          // Email exists but not linked - require manual linking
          return ctx.conflict('Email already exists. Please login and link your Google account in settings.');
        }

        // Create new user with Google account
        const username = 'google_' + providerId;
        const role = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' },
        });

        user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username,
            email: googleUser.email,
            confirmed: true,
            blocked: false,
            provider: 'local',
            role: role.id,
          },
        });

        // Create social auth entry
        await strapi.entityService.create('api::social-auth.social-auth', {
          data: {
            user: user.id,
            provider,
            providerId,
          },
        });

        isNewUser = true;
        console.log('[Google Auth] Created new user and social-auth entry:', user.id);
      }

      // Generate JWT token
      const jwtToken = getService('jwt').issue({ id: user.id });

      return {
        jwt: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        isNewUser,
      };
    } catch (error) {
      console.error('[Google Auth] Error:', error);
      return ctx.internalServerError('Authentication failed', { error: error.message });
    }
  };

  return plugin;
};
