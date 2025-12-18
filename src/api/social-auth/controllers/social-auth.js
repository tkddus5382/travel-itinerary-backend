'use strict';

/**
 * social-auth controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::social-auth.social-auth', ({ strapi }) => ({
  /**
   * Link a social account to the current user
   */
  async link(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to link a social account');
    }

    const { provider, providerId } = ctx.request.body;

    if (!provider || !providerId) {
      return ctx.badRequest('Provider and providerId are required');
    }

    try {
      // Check if this social account is already linked to another user
      const existingAuth = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { provider, providerId },
        populate: ['user'],
      });

      if (existingAuth && existingAuth.length > 0) {
        const linkedUser = existingAuth[0].user;

        // If already linked to this user, return success
        if (linkedUser && linkedUser.id === user.id) {
          return {
            data: existingAuth[0],
            message: 'Social account already linked to your account',
          };
        }

        // If linked to another user, return error
        return ctx.conflict('This social account is already linked to another user');
      }

      // Create new social auth entry
      const socialAuth = await strapi.entityService.create('api::social-auth.social-auth', {
        data: {
          user: user.id,
          provider,
          providerId,
        },
        populate: ['user'],
      });

      console.log('[Social Auth] Linked social account:', {
        userId: user.id,
        provider,
        providerId: providerId.substring(0, 10) + '...',
      });

      return {
        data: socialAuth,
        message: 'Social account linked successfully',
      };
    } catch (error) {
      console.error('[Social Auth] Error linking social account:', error);
      return ctx.internalServerError('Failed to link social account', { error: error.message });
    }
  },

  /**
   * Find user by social provider
   */
  async findUser(ctx) {
    const { provider, providerId } = ctx.query;

    if (!provider || !providerId) {
      return ctx.badRequest('Provider and providerId are required');
    }

    try {
      const socialAuths = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { provider, providerId },
        populate: ['user'],
      });

      if (!socialAuths || socialAuths.length === 0) {
        return { data: null };
      }

      const socialAuth = socialAuths[0];

      return {
        data: {
          user: socialAuth.user,
          socialAuth: {
            id: socialAuth.id,
            provider: socialAuth.provider,
          },
        },
      };
    } catch (error) {
      console.error('[Social Auth] Error finding user by social account:', error);
      return ctx.internalServerError('Failed to find user', { error: error.message });
    }
  },

  /**
   * Get all linked social accounts for current user
   */
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      const socialAuths = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { user: user.id },
      });

      return {
        data: socialAuths,
      };
    } catch (error) {
      console.error('[Social Auth] Error getting user social accounts:', error);
      return ctx.internalServerError('Failed to get social accounts', { error: error.message });
    }
  },

  /**
   * Unlink a social account
   */
  async unlink(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      const socialAuth = await strapi.entityService.findOne('api::social-auth.social-auth', id, {
        populate: ['user'],
      });

      if (!socialAuth) {
        return ctx.notFound('Social auth not found');
      }

      // Check if this social auth belongs to the current user
      if (socialAuth.user.id !== user.id) {
        return ctx.forbidden('You can only unlink your own social accounts');
      }

      await strapi.entityService.delete('api::social-auth.social-auth', id);

      return {
        message: 'Social account unlinked successfully',
      };
    } catch (error) {
      console.error('[Social Auth] Error unlinking social account:', error);
      return ctx.internalServerError('Failed to unlink social account', { error: error.message });
    }
  },
}));
